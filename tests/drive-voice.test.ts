import test from 'node:test';
import assert from 'node:assert/strict';
import {DriveSession,driveSpace,readSnapshot} from '../app/lib/drive.ts';
import {emptyStore} from '../app/lib/engine.ts';
import {voicePlan,voiceLog,spokenNumbers} from '../app/lib/voice.ts';
const space='a'.repeat(64);
const snapshot=(state=emptyStore(),s=space)=>JSON.stringify({format:'kova-drive',version:1,space:s,savedAt:'2026-10-24T00:00:00Z',state});
const json=(v:unknown)=>Response.json(v);
test('Drive paginates and merges concurrent snapshots including tombstones',async()=>{
 const first=emptyStore(),second=emptyStore();first.logs=[{id:'l',profileId:'athlete-1',date:'2026-10-24',title:'Clase',minutes:40,rpe:7,updatedAt:1}];second.logs=[{...first.logs[0],_deleted:true,updatedAt:2},{...first.logs[0],id:'other',updatedAt:3}];
 let pages=0;const request:typeof fetch=async(input,init)=>{assert.match(String((init?.headers as Record<string,string>).Authorization),/^Bearer /);const url=String(input);if(url.includes('alt=media'))return new Response(url.includes('/first?')?snapshot(first):snapshot(second));pages++;return json(pages===1?{files:[{id:'first',name:'1'}],nextPageToken:'p2'}:{files:[{id:'second',name:'2'}]});};
 const result=await new DriveSession('test',request).pull(space);assert.equal(pages,2);assert.equal(result.count,2);assert.equal(result.state?.logs.length,2);assert.equal(result.state?.logs.find(x=>x.id==='l')?._deleted,true);
});
test('Drive validates namespaces, schema and byte limits before accepting data',async()=>{
 assert.throws(()=>readSnapshot(snapshot(emptyStore(),'b'.repeat(64)),space),/espacio/);assert.throws(()=>readSnapshot('not json',space),/ilegible/);assert.throws(()=>readSnapshot(' '.repeat(1_800_001),space),/límite/);
 assert.notEqual(await driveSpace('one'),await driveSpace('two'));assert.equal((await driveSpace('one')).length,64);
});
test('Drive upload creates an immutable snapshot and verifies exact provider bytes',async()=>{
 let uploads=0,raw='';const request:typeof fetch=async(input,init)=>{if(init?.method==='POST'){uploads++;const body=String(init.body),match=body.match(/\r\n\r\n(\{"format":"kova-drive".+)\r\n--kova_/);assert.ok(match);raw=match[1];assert.match(body,/appDataFolder/);return json({id:'new'});}return new Response(raw);};
 assert.equal(await new DriveSession('test',request).push(space,emptyStore()),'new');assert.equal(uploads,1);
});
test('Drive failures do not replay uploads or report success',async()=>{
 let uploads=0;const request:typeof fetch=async(_,init)=>{if(init?.method==='POST'){uploads++;return json({id:'uncertain'});}return new Response(snapshot());};
 await assert.rejects(new DriveSession('test',request).push(space,emptyStore()),/verificar/);assert.equal(uploads,1);
 await assert.rejects(new DriveSession('test',async()=>new Response('',{status:401})).pull(space),/caducado/);
});
test('Spanish dictation preserves quantities and turns sections into timed workout blocks',()=>{
 const result=voicePlan('Calentamiento cinco minutos. Fuerza diez minutos: tres series de cinco sentadillas a treinta y cinco kilos. AMRAP quince minutos: diez wall balls y ocho burpees. Vuelta a la calma cinco minutos.');
 const blocks=result.plan.sessions[0].blocks;assert.equal(blocks.length,4);assert.deepEqual(blocks.map(x=>x.minutes),[5,10,15,5]);assert.equal(result.plan.sessions[0].duration,35);assert.match(blocks[1].text,/35 kilos/);assert.match(blocks[2].text,/10 wall balls y 8 burpees/);
});
test('Unknown dictation times are visible proposals; multiple days are refused',()=>{
 const result=voicePlan('AMRAP de burpees y remo hasta completar todas las rondas.');assert.ok(result.warnings.some(x=>x.includes('no se ha identificado duración')));
 assert.throws(()=>voicePlan('Día A entrenamiento de fuerza. Día B entrenamiento de cardio.'),/varios días/);
 assert.equal(spokenNumbers('cuarenta y cinco minutos'), '45 minutos');
 const interval=voicePlan('Intervalos ocho rondas de veinte segundos de trabajo y diez segundos de descanso.');assert.deepEqual(interval.plan.sessions[0].blocks[0].interval,{rounds:8,work:20,rest:10});assert.equal(interval.plan.sessions[0].blocks[0].minutes,4);
});
test('Voice logs keep raw words and leave missing effort/duration unfilled',()=>{
 const entry=voiceLog('Hoy entrené cuarenta y cinco minutos con esfuerzo siete.','p');assert.equal(entry.minutes,45);assert.equal(entry.rpe,7);assert.equal(entry._draft,true);
 const missing=voiceLog('Hice burpees y varias dominadas con mi grupo.','p');assert.equal(missing.minutes,null);assert.equal(missing.rpe,null);assert.match(missing.note,/burpees/);assert.equal(voiceLog('Hoy esfuerzo once y cero minutos.','p').rpe,null);
});
