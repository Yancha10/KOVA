import {mergeStores,validStore,type Store} from './engine.ts';

export const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
const API='https://www.googleapis.com/drive/v3/files';
const LIMIT=1_800_000;
type Snapshot={format:'kova-drive';version:1;space:string;savedAt:string;state:Store};
export type DriveFile={id:string;name:string;size?:string};

// Opaque account namespace: the account identifier itself never leaves KOVA.
export async function driveSpace(accountId:string){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('kova-drive-v1:'+accountId));
 return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function readSnapshot(raw:string,space:string):Store{
 if(new TextEncoder().encode(raw).length>LIMIT)throw new Error('Una copia de Drive supera el límite de 1,8 MB.');
 let v:Snapshot;try{v=JSON.parse(raw);}catch{throw new Error('Hay una copia ilegible en Drive. No se ha sobrescrito nada.');}
 if(v?.format!=='kova-drive'||v.version!==1||v.space!==space||!validStore(v.state))throw new Error('Una copia de Drive no es válida para este espacio. No se ha sobrescrito nada.');
 return v.state;
}

export class DriveSession {
 private token:string;private request:typeof fetch;
 constructor(token:string,request:typeof fetch=fetch){this.token=token;this.request=request;}
 private async text(r:Response){
  if(Number(r.headers.get('Content-Length'))>LIMIT)throw new Error('Una copia de Drive supera el límite de 1,8 MB.');
  const reader=r.body?.getReader();if(!reader)return '';
  let count=0,result='';const decoder=new TextDecoder();
  try{while(true){const {value,done}=await reader.read();if(done)break;count+=value.byteLength;if(count>LIMIT){await reader.cancel();throw new Error('Una copia de Drive supera el límite de 1,8 MB.');}result+=decoder.decode(value,{stream:true});}return result+decoder.decode();}finally{reader.releaseLock();}
 }
 private async call(url:string,init:RequestInit={}){
  const r=await this.request(url,{...init,headers:{...init.headers,Authorization:'Bearer '+this.token},signal:AbortSignal.timeout(45_000),cache:'no-store'});
  if(r.status===401)throw new Error('La conexión con Google ha caducado. Vuelve a conectar.');
  if(!r.ok)throw new Error(r.status===403?'Google no permite acceder a Drive. Revisa el permiso y que Drive API esté activada.':r.status===429?'Drive está limitando las peticiones. Espera y vuelve a intentarlo.':'Drive no ha completado la operación. Tus datos locales siguen guardados.');
  return r;
 }
 async files(space:string):Promise<DriveFile[]>{
  if(!/^[a-f0-9]{64}$/.test(space))throw new Error('Espacio de Drive no válido.');
  const files:DriveFile[]=[];let page='';
  do{
   const q=new URLSearchParams({spaces:'appDataFolder',q:`trashed = false and appProperties has { key='kovaSpace' and value='${space}' }`,pageSize:'100',fields:'nextPageToken,files(id,name,size)',...(page?{pageToken:page}:{})});
   const d=await (await this.call(API+'?'+q)).json() as {files:DriveFile[];nextPageToken?:string};
   if(!Array.isArray(d.files))throw new Error('Respuesta inesperada de Drive.');
   files.push(...d.files);page=d.nextPageToken||'';
   // Refuse incomplete merges; never silently discard an older branch.
   if(files.length>2000)throw new Error('El archivo de Drive necesita consolidación. Exporta una copia y contacta con soporte.');
  }while(page);
  return files.sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 }
 async pull(space:string,onProgress?:(n:number,total:number)=>void){
  const files=await this.files(space);let combined:Store|null=null,totalBytes=0;
  for(let i=0;i<files.length;i++){
   if(Number(files[i].size)>LIMIT)throw new Error('Una copia de Drive supera el límite de 1,8 MB.');
   const raw=await this.text(await this.call(API+'/'+encodeURIComponent(files[i].id)+'?alt=media'));
   totalBytes+=new TextEncoder().encode(raw).length;
   if(totalBytes>24_000_000)throw new Error('El archivo de Drive necesita consolidación: supera 24 MB. No se ha perdido ninguna copia.');
   const state=readSnapshot(raw,space);combined=combined?mergeStores(combined,state):state;onProgress?.(i+1,files.length);
  }
  return {state:combined,count:files.length};
 }
 async push(space:string,state:Store){
  if(!/^[a-f0-9]{64}$/.test(space)||!validStore(state))throw new Error('No se puede guardar una copia con datos inválidos.');
  const snapshot:Snapshot={format:'kova-drive',version:1,space,savedAt:new Date().toISOString(),state};
  const raw=JSON.stringify(snapshot);if(new TextEncoder().encode(raw).length>LIMIT)throw new Error('La copia supera 1,8 MB. Exporta el histórico antes de sincronizar.');
  const boundary='kova_'+crypto.randomUUID().replaceAll('-','');
  const metadata={name:'kova-'+snapshot.savedAt.replaceAll(':','-')+'.json',mimeType:'application/json',parents:['appDataFolder'],appProperties:{kovaSpace:space}};
  const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${raw}\r\n--${boundary}--`;
  const result=await (await this.call('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body})).json() as {id?:string};
  if(typeof result.id!=='string')throw new Error('Google no ha confirmado la copia. Comprueba Drive antes de repetir.');
  // Readback verifies provider bytes, not merely a successful HTTP status.
  const check=await this.text(await this.call(API+'/'+encodeURIComponent(result.id)+'?alt=media'));
  readSnapshot(check,space);if(check!==raw)throw new Error('No se ha podido verificar la copia de Drive. Conserva tu copia local.');
  return result.id as string;
 }
}
