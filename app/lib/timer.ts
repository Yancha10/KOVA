export type TimerMode='amrap'|'for-time'|'emom'|'tabata'|'intervals'|'stopwatch'|'hybrid';
export type TimerConfig={mode:TimerMode;title:string;duration:number;rounds:number;work:number;rest:number;prepare:number;stations:string[]};
export type Split={at:number;label:string};
export type TimerRun={config:TimerConfig;elapsed:number;startedAt:number|null;running:boolean;splits:Split[];finished:boolean};
export const HYBRID_STATIONS=['SkiErg','Sled push','Sled pull','Burpee broad jumps','Remo','Farmers carry','Sandbag lunges','Wall balls'];
export function defaults(mode:TimerMode='amrap'):TimerConfig{return {mode,title:mode==='hybrid'?'HYROX · entrenamiento':mode==='stopwatch'?'Open gym':mode.toUpperCase(),duration:900,rounds:mode==='tabata'?8:5,work:mode==='tabata'?20:120,rest:mode==='tabata'?10:60,prepare:5,stations:HYBRID_STATIONS.flatMap((s,i)=>[`Carrera ${i+1}`,s])};}
export function totalSeconds(c:TimerConfig){return c.mode==='stopwatch'||c.mode==='hybrid'?null:['tabata','intervals'].includes(c.mode)?c.rounds*(c.work+c.rest):c.duration;}
export function elapsedSeconds(run:TimerRun,now=Date.now()){return Math.max(0,run.elapsed+(run.running&&run.startedAt!==null?(now-run.startedAt)/1000:0));}
export function timerPhase(c:TimerConfig,elapsed:number,splits:Split[]=[]){const total=totalSeconds(c);const prep=elapsed<c.prepare;const t=Math.max(0,elapsed-c.prepare);const complete=total!==null&&t>=total;let label='TRABAJO',round=1,phaseRemaining:number|null=null;
 if(prep){label='PREPÁRATE';phaseRemaining=c.prepare-elapsed;}
 else if(complete){label='COMPLETADO';phaseRemaining=0;}
 else if(['intervals','tabata'].includes(c.mode)){const cycle=c.work+c.rest;const pos=t%cycle;round=Math.floor(t/cycle)+1;label=pos<c.work?'TRABAJO':'RECUPERACIÓN';phaseRemaining=pos<c.work?c.work-pos:cycle-pos;}
 else if(c.mode==='emom'){round=Math.floor(t/60)+1;label='MINUTO '+round;phaseRemaining=Math.min(60-t%60,Math.max(0,c.duration-t));}
 else if(c.mode==='hybrid'){round=Math.min(c.stations.length,splits.length+1);label=c.stations[round-1]||'ENTRENAMIENTO';}
 else if(c.mode==='stopwatch')label='EN MOVIMIENTO';
 return {prep,t,complete,label,round,phaseRemaining,total,display:prep?Math.ceil(c.prepare-elapsed):c.mode==='for-time'||c.mode==='stopwatch'||c.mode==='hybrid'?Math.floor(t):Math.ceil(phaseRemaining??Math.max(0,(total||0)-t)),progress:total===null?0:Math.min(1,t/total)};
}
export function formatClock(seconds:number){const s=Math.max(0,Math.floor(seconds));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
export function seedConfig(seed:{minutes:number;title:string;interval?:any;mode?:TimerMode}){let c=defaults(seed.mode|| (seed.interval?'intervals':/EMOM/i.test(seed.title)?'emom':/for time/i.test(seed.title)?'for-time':'amrap'));c={...c,title:seed.title,duration:Math.max(60,seed.minutes*60)};if(seed.interval)c={...c,rounds:seed.interval.rounds,work:seed.interval.work,rest:seed.interval.rest};return c;}
export function validRun(v:any):v is TimerRun{const c=v?.config;return !!c&&['amrap','for-time','emom','tabata','intervals','stopwatch','hybrid'].includes(c.mode)&&Number.isFinite(c.duration)&&c.duration>=60&&c.duration<=10800&&Number.isInteger(c.rounds)&&c.rounds>=1&&c.rounds<=100&&c.work>=1&&c.work<=3600&&c.rest>=0&&c.rest<=3600&&c.prepare>=0&&c.prepare<=30&&Array.isArray(c.stations)&&c.stations.length>=1&&c.stations.length<=40&&c.stations.every((x:any)=>typeof x==='string'&&x.length<=120)&&Number.isFinite(v.elapsed)&&v.elapsed>=0&&typeof v.running==='boolean'&&typeof v.finished==='boolean'&&(v.startedAt===null||Number.isFinite(v.startedAt))&&Array.isArray(v.splits)&&v.splits.length<=1000&&v.splits.every((x:any)=>Number.isFinite(x.at)&&x.at>=0&&typeof x.label==='string');}
