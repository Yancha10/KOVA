import {normalizePlan,uid,type Plan,type Entry,today} from './engine.ts';
const nums:Record<string,number>={cero:0,un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,veintiuno:21,veintidos:22,veintitres:23,veinticuatro:24,veinticinco:25,veintiseis:26,veintisiete:27,veintiocho:28,veintinueve:29,treinta:30,cuarenta:40,cincuenta:50,sesenta:60,noventa:90};
export function spokenNumbers(text:string){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(treinta|cuarenta|cincuenta|sesenta) y (uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/g,(_,a,b)=>String(nums[a]+nums[b])).replace(new RegExp('\\b('+Object.keys(nums).join('|')+')\\b','g'),n=>String(nums[n]));}
export function voicePlan(text:string,title='Mi entreno'): {plan:Plan;warnings:string[]}{
 if(text.trim().length<15)throw new Error('Describe al menos el formato y los ejercicios del entreno.');
 if(text.length>12000)throw new Error('Para varios días, utiliza Importar planning. Este asistente prepara una sesión.');
 if(/\b(?:semana\s+(?:dos|2)|dia\s+(?:dos|2|b)|ma[ñn]ana.+pasado)\b/i.test(text.normalize('NFD').replace(/[\u0300-\u036f]/g,'')))throw new Error('Hay varios días en el dictado. Usa Importar planning para conservarlos por separado.');
 const normalized=spokenNumbers(text).replace(/(?:a[ -]?m[ -]?rap|am rap|amrap)/g,'AMRAP').replace(/(?:e[ -]?m[ -]?o[ -]?m|emom)/g,'EMOM').replace(/for time|por tiempo/g,'For time');
 const markers=/\b(calentamiento|activacion|tecnica|habilidad|fuerza|AMRAP|EMOM|For time|tabata|intervalos|vuelta a la calma|enfriamiento)\b/gi;
 const hits=[...normalized.matchAll(markers)];
 const parts:{label:string;text:string}[]=[];
 if(!hits.length)parts.push({label:'Entrenamiento',text:normalized});
 else {if(hits[0].index!>0&&normalized.slice(0,hits[0].index).replace(/[\s.,:;-]/g,'').length>8)parts.push({label:'Indicaciones',text:normalized.slice(0,hits[0].index)});hits.forEach((m,i)=>parts.push({label:m[0],text:normalized.slice(m.index,hits[i+1]?.index??normalized.length)}));}
 const warnings:string[]=[];
 const blocks=parts.map((part,i)=>{
  const match=part.text.match(/\b(\d{1,3})\s*(?:minutos?|mins?|min)\b/),seconds=part.text.match(/\b(\d{1,3})\s*segundos?\b/);
  const label=part.label.toLowerCase();
  const type=/calentamiento|activacion/.test(label)?'warmup':/tecnica|habilidad/.test(label)?'skill':/fuerza/.test(label)?'strength':/calma|enfriamiento/.test(label)?'cooldown':'conditioning';
  let interval:{rounds:number;work:number;rest:number}|undefined;
  if(label==='tabata')interval={rounds:8,work:20,rest:10};
  if(label==='intervalos'){
   const rounds=part.text.match(/\b(\d{1,3})\s*(?:rondas|series|intervalos)\b/),work=part.text.match(/\b(\d{1,3})\s*(?:segundos?\s*)?(?:de\s+)?trabajo\b/),rest=part.text.match(/\b(\d{1,3})\s*(?:segundos?\s*)?(?:de\s+)?descanso\b/);
   if(rounds&&work&&rest)interval={rounds:+rounds[1],work:+work[1],rest:+rest[1]};
   else warnings.push(`Bloque ${i+1}: no se han identificado todas las fases de los intervalos. Revisa rondas, trabajo y descanso en el cronómetro.`);
  }
  let minutes=interval?Math.ceil(interval.rounds*(interval.work+interval.rest)/60):match?+match[1]:seconds?Math.ceil(+seconds[1]/60):0;
  if(!minutes){minutes=type==='conditioning'?15:5;warnings.push(`Bloque ${i+1}: no se ha identificado duración. Se proponen ${minutes} min para que los revises.`);}
  if(minutes<1||minutes>180)throw new Error('Hay un tiempo fuera de rango. Corrígelo antes de continuar.');
  return {type,title:part.label==='Indicaciones'?'Indicaciones previas':part.label,text:part.text.trim(),minutes,...(interval?{interval}:{})};
 });
 warnings.push('Revisa nombres, repeticiones, pesos, descansos y tiempos. El dictado conserva el texto, pero no interpreta todos los formatos.');
 const duration=blocks.reduce((a,b)=>a+b.minutes,0);
 const plan=normalizePlan({id:uid(),name:title.trim()||'Mi entreno',weeks:1,source:'Dictado o texto revisado en KOVA',updatedAt:Date.now(),sessions:[{id:uid(),week:1,day:'A',title:title.trim()||'Mi entreno',duration,blocks}]});
 return {plan,warnings};
}
export function voiceLog(text:string,profileId:string):Entry{
 const n=spokenNumbers(text),minutes=n.match(/\b(\d{1,3})\s*(?:minutos?|mins?|min)\b/),effort=n.match(/\b(?:rpe|esfuerzo(?:\s+de)?|intensidad(?:\s+de)?)\s*(\d{1,2})\b/);
 return {id:uid(),profileId,date:today(),title:'Entreno dictado',minutes:minutes&&+minutes[1]>=1&&+minutes[1]<=300?+minutes[1]:null,rpe:effort&&+effort[1]>=1&&+effort[1]<=10?+effort[1]:null,kind:'open',score:'',note:text,patterns:[],updatedAt:Date.now(),_draft:true,_voice:true};
}
