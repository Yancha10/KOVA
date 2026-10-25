import {Plan,normalizePlan,parseTextPlan,uid} from './engine';
import base from './base-plan.json';
export async function extractFile(file:File,onProgress:(s:string)=>void){
 if(file.size>15*1024*1024)throw new Error('El archivo supera los 15 MB. Usa una versión más ligera.');
 const ext=file.name.split('.').pop()?.toLowerCase();let text='';
 if(ext==='pdf'){onProgress('Leyendo las páginas del PDF…');const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdf.worker.min.mjs',document.baseURI).href;const task=pdfjs.getDocument({data:await file.arrayBuffer()});const pdf=await task.promise;if(pdf.numPages>80){await task.destroy();throw new Error('Máximo 80 páginas por importación. Divide el documento.');}try{for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n);const content=await page.getTextContent();let currentY:number|null=null;for(const item of content.items as any[]){if(!('str'in item))continue;const y=item.transform?.[5];if(currentY!==null&&Math.abs(y-currentY)>4)text+='\n';text+=item.str+(item.hasEOL?'\n':' ');currentY=y;}text+='\n';onProgress(`Leyendo página ${n} de ${pdf.numPages}…`);if(text.length>180000)throw new Error('Demasiado texto; divide el documento.');}}finally{await task.destroy();}}
 else if(ext==='docx'){onProgress('Extrayendo el documento Word…');const mammoth=await import('mammoth/mammoth.browser');text=(await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;}
 else if(['txt','md','json'].includes(ext||''))text=await file.text();else throw new Error('Usa PDF con texto, DOCX, TXT, MD o JSON. Para DOC antiguo, guarda como DOCX.');
 if(text.trim().length<30)throw new Error('No se ha encontrado texto legible. El PDF puede estar escaneado: usa el puente con ChatGPT para transcribirlo.');return text.slice(0,180000);
}
export function planFromText(text:string,name:string):{plan:Plan;recognized:boolean}{
 if(text.trim().startsWith('{')){const raw=JSON.parse(text);return {plan:normalizePlan(raw),recognized:false};}
 if(/Plan de CrossFit/i.test(text)&&/24\s*SEMANAS/i.test(text)&&/Una hoja por semana/i.test(text)&&/KOVA|Topes de series|Tope dinámico/i.test(text)){const p=JSON.parse(JSON.stringify(base));const id=uid();p.id=id;p.name=name||p.name;p.source='Tu PDF de CrossFit de 6 meses · plantilla reconocida';p.updatedAt=Date.now();p.sessions=p.sessions.map((s:any)=>({...s,id:id+'-'+s.id}));return {plan:p,recognized:true};}
 return {plan:parseTextPlan(text,name),recognized:false};
}
