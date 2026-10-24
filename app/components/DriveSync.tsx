'use client';
import {useEffect,useRef,useState} from 'react';
import {Cloud,Check,RefreshCw,ShieldCheck,Link2,LogOut,ChevronDown,ExternalLink,Loader2} from 'lucide-react';
import {DriveSession,driveSpace,DRIVE_SCOPE} from '../lib/drive';
import {mergeStores,type Store} from '../lib/engine';
import {GOOGLE_DRIVE_CLIENT_ID} from '../lib/config';

type GoogleOAuth={initTokenClient:(config:{client_id:string;scope:string;include_granted_scopes:boolean;callback:(r:{access_token?:string;expires_in?:number;error?:string})=>void;error_callback:()=>void})=>{requestAccessToken:(options:{prompt:string})=>void};hasGrantedAllScopes:(r:unknown,scope:string)=>boolean;revoke:(token:string,done:()=>void)=>void};
const oauth=()=>((window as unknown as {google?:{accounts?:{oauth2?:GoogleOAuth}}}).google?.accounts?.oauth2);
let googleLoad:Promise<void>|null=null;
function loadGoogle(){
 if(oauth())return Promise.resolve();
 if(googleLoad)return googleLoad;
 googleLoad=new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=()=>resolve();script.onerror=()=>{script.remove();googleLoad=null;reject(new Error('No se ha podido cargar la conexión con Google. Comprueba tu conexión.'));};document.head.appendChild(script);});
 return googleLoad;
}

export default function DriveSync({accountId,snapshot,integrate}:{accountId:string;snapshot:()=>Store;integrate:(s:Store)=>void}){
 const [clientId,setClientId]=useState(GOOGLE_DRIVE_CLIENT_ID),[editing,setEditing]=useState(false),[loaded,setLoaded]=useState(false),[googleReady,setGoogleReady]=useState(false),[connected,setConnected]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[consent,setConsent]=useState(false),[last,setLast]=useState(''),[origin,setOrigin]=useState('');
 const session=useRef<{token:string;expires:number}|null>(null),working=useRef(false),mounted=useRef(true),client=useRef<ReturnType<GoogleOAuth['initTokenClient']>|null>(null);
 const key='kova-drive-'+accountId;
 useEffect(()=>{mounted.current=true;setOrigin(location.origin);try{setClientId(GOOGLE_DRIVE_CLIENT_ID||localStorage.getItem('kova-google-client-id')||'');setLast(localStorage.getItem(key+'-last')||'');}catch{}setLoaded(true);return()=>{mounted.current=false;session.current=null;};},[key]);
 const validId=/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId.trim());
 useEffect(()=>{if(!loaded)return;setGoogleReady(false);client.current=null;if(!validId||!consent)return;let cancelled=false;
  void loadGoogle().then(()=>{if(cancelled)return;const api=oauth();if(!api)throw new Error('Google no ha iniciado la conexión.');client.current=api.initTokenClient({client_id:clientId.trim(),scope:DRIVE_SCOPE,include_granted_scopes:false,callback:r=>{working.current=false;if(!mounted.current)return;setBusy(false);if(!r.access_token||r.error||!api.hasGrantedAllScopes(r,DRIVE_SCOPE)){setError('Google no ha concedido el permiso de datos de KOVA en Drive.');return;}session.current={token:r.access_token,expires:Date.now()+Math.max(0,(Number(r.expires_in)||3600)-60)*1000};setConnected(true);setLast('');setError('');setMessage('Google conectado. Pulsa Sincronizar ahora para integrar y guardar tus datos.');},error_callback:()=>{working.current=false;if(!mounted.current)return;setBusy(false);setError('La ventana de Google se cerró o no pudo abrirse. Prueba desde Safari o Chrome.');}});setGoogleReady(true);}).catch(e=>{if(!cancelled)setError(e.message);});return()=>{cancelled=true;};
 },[loaded,clientId,validId,consent]);
 useEffect(()=>{const t=setInterval(()=>{if(session.current&&session.current.expires<=Date.now()){session.current=null;setConnected(false);setMessage('La conexión ha caducado. Reconecta para sincronizar.');}},10000);return()=>clearInterval(t);},[]);
 const connect=()=>{if(!client.current||working.current)return;working.current=true;setBusy(true);setError('');try{localStorage.setItem('kova-google-client-id',clientId.trim());}catch{}try{client.current.requestAccessToken({prompt:'select_account'});}catch{working.current=false;setBusy(false);setError('No se pudo abrir Google. Revisa el bloqueo de ventanas emergentes.');}};
 const disconnect=()=>{session.current=null;setConnected(false);setConsent(false);setMessage('Desconectado en esta sesión. Las copias de Drive se conservan.');setLast('');};
 const sync=async()=>{
  if(working.current||!consent)return;const auth=session.current;if(!auth||auth.expires<=Date.now()){session.current=null;setConnected(false);setError('Vuelve a conectar con Google antes de sincronizar.');return;}
  working.current=true;setBusy(true);setError('');setMessage('Buscando tus copias de KOVA…');
  try{
   const space=await driveSpace(accountId),drive=new DriveSession(auth.token);
   const remote=await drive.pull(space,(n,total)=>{if(mounted.current)setMessage(`Integrando copias ${n} de ${total}…`);});
   if(!mounted.current||session.current!==auth)return;
   const merged=remote.state?mergeStores(remote.state,snapshot()):snapshot();
   // Local/cloud merge happens before upload: a failed upload never loses a read.
   if(remote.state)integrate(merged);
   setMessage('Guardando y verificando una nueva copia en Google Drive…');
   await drive.push(space,merged);
   if(!mounted.current)return;
   const at=new Date().toISOString();setLast(at);try{localStorage.setItem(key+'-last',at);}catch{}
   const pending=JSON.stringify(snapshot())!==JSON.stringify(merged);
   setMessage(pending?'Copia verificada. Hay cambios posteriores: pulsa de nuevo para incluirlos.':'Sincronización completada. Copia verificada en Google Drive.');
  }catch(e){if(mounted.current)setError(e instanceof Error?e.message:'No se pudo sincronizar. La copia local sigue guardada.');}
  finally{working.current=false;if(mounted.current)setBusy(false);}
 };
 return <section className="panel drive-panel"><div className="drive-heading"><span className="drive-cloud"><Cloud size={25}/></span><div><span className="eyebrow">TU SEGUNDA NUBE</span><h3>Siempre contigo.</h3></div><span className={'drive-dot '+(connected?'connected':'')}/></div><p>Integra y guarda programas, perfiles, marcas y diario en el espacio privado de KOVA en tu Google Drive.</p><div className="drive-status"><span>{connected?'Google conectado':'Google Drive'}</span><b>{connected?'Listo para sincronizar':'Sin conectar'}</b></div>
 {last&&<p className="drive-last">Última copia en este dispositivo: {new Date(last).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>}
 {(!validId||editing)&&<label className="field">Identificador de Google de KOVA<input aria-label="Identificador OAuth de Google" value={clientId} disabled={connected||busy} onChange={e=>{setClientId(e.target.value);setError('');}} placeholder="…apps.googleusercontent.com" autoComplete="off" spellCheck={false}/><small>Es un Client ID público, nunca una contraseña ni un secreto.</small></label>}
 {!connected&&<label className="checkbox-row drive-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Quiero sincronizar los datos de entrenamiento de esta cuenta con la cuenta de Google que elija.</label>}
 {connected?<div className="drive-actions"><button className="button dark full" disabled={busy||!consent} onClick={()=>void sync()}>{busy?<Loader2 size={17} className="spin"/>:<RefreshCw size={17}/>} {busy?'Sincronizando…':'Sincronizar ahora'}</button><button className="text-button" disabled={busy} onClick={disconnect}><LogOut size={14}/> Desconectar</button></div>:<button className="button dark full" disabled={!validId||!consent||!googleReady||busy} onClick={connect}>{busy?<Loader2 size={17} className="spin"/>:<Link2 size={17}/>} Conectar Google Drive</button>}
 <div aria-live="polite">{message&&<p className="drive-feedback"><Check size={15}/>{message}</p>}</div>{error&&<div className="error-message" role="alert">{error}</div>}
 <p className="drive-note"><ShieldCheck size={14}/> Sincronización manual. No se envía nada al conectar: tú decides cuándo guardar.</p>
 <details className="drive-setup"><summary>Preparar Google Drive <ChevronDown size={16}/></summary><p>Esta configuración se hace una vez para KOVA. Usa el mismo Client ID, la misma cuenta de KOVA y la misma cuenta de Google en todos los dispositivos.</p><ol><li>Crea un proyecto en Google Cloud y activa <b>Google Drive API</b>.</li><li>Configura Google Auth Platform, su audiencia y tu cuenta como usuario de prueba si está en modo de pruebas.</li><li>Crea un cliente OAuth de tipo <b>Aplicación web</b>. En orígenes JavaScript autorizados añade exactamente <code>{origin||'el origen de esta app'}</code>.</li><li>Añade el permiso <code>https://www.googleapis.com/auth/drive.appdata</code> y pega el Client ID aquí.</li></ol><button className="text-button" disabled={connected||busy} onClick={()=>setEditing(!editing)}>{editing?'Ocultar configuración':'Cambiar Client ID'}</button><a className="text-button" href="https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid" target="_blank" rel="noreferrer">Guía oficial de Google <ExternalLink size={13}/></a><p>Solo accede a los datos de KOVA; las copias están en la carpeta interna de la aplicación, no en Mi unidad. Conserva también tu exportación JSON. La conexión caduca y puede pedirte entrar de nuevo. Desconectar aquí no borra las copias ni revoca el permiso en Google.</p><a className="text-button" href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer">Gestionar permisos en Google <ExternalLink size={13}/></a></details>
 </section>;
}
