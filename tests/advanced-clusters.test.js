import test from 'node:test';
import assert from 'node:assert/strict';
import {generate,repetitionTarget,updateRepetitionTargets,editItem,modalities} from '../src/generator.js';
import {clusterPause,clusterRepTime} from '../src/training.js';
import {CoachAudio,repetitionAt,repetitionTiming,spokenNumber} from '../src/audio.js';
import {exercises} from '../src/exercises.js';
import {SessionClock} from '../src/timer.js';
const push=exercises.find(e=>e.name==='Flexões clássicas');
const step=()=>({id:'push',kind:'work',duration:120,start:0,end:120,round:1,sets:2,exercise:push,...repetitionTarget(push,120,3)});
test('two-minute advanced pushups contain 45 reps, exact 2 s cadence and two 10 s pauses after 15',()=>{
 const s=step();assert.equal(s.reps,45);assert.equal(repetitionTiming(s).interval,2);
 assert.equal(repetitionAt(s,5.99),0);assert.equal(repetitionAt(s,6),1);
 for(let i=0;i<s.reps;i++){
  const at=clusterRepTime(i,s);assert.equal(repetitionAt(s,at),i+1);
  if(i){const gap=at-clusterRepTime(i-1,s);assert.equal(gap,i%15===0?12:2)}
 }
 for(const [from,to,count] of [[36,46,15],[76,86,30]]){
  assert.equal(clusterPause(s,from).remaining,10);assert.equal(repetitionAt(s,to-.01),count);assert.equal(clusterPause(s,to),null);assert.equal(repetitionAt(s,to),count+1);
 }
 assert.equal(repetitionAt(s,119.9),45);assert.equal(clusterPause(s,119.9),null);
});
test('real clock and coach emit all 45 rep bips, pause announcements and no counts inside recoveries',()=>{
 const s=step(),plan={duration:120,timeline:[s]},heard=[],bips=[];let now=0;
 const clock=new SessionClock(plan,{now:()=>now}),audio=new CoachAudio(()=>({voiceMode:'full',advanceWarning:true}));
 audio.beep=type=>bips.push({type,at:now/1000});audio.speak=(text,options)=>heard.push({text,priority:options?.priority,at:now/1000});
 clock.start();for(now=0;now<120000;now+=50)audio.cue(clock.tick(),plan);
 assert.equal(bips.filter(x=>x.type==='rep').length,45);
 assert.deepEqual(heard.filter(x=>x.priority==='count'&&x.text!=='Continua.').map(x=>x.text),Array.from({length:45},(_,i)=>spokenNumber(i+1)));
 assert.equal(heard.filter(x=>x.text==='Pausa de dez segundos.').length,2);
 assert.equal(heard.filter(x=>x.text==='Começa.').length,2);
 assert.ok(bips.filter(x=>x.type==='rep').every(x=>!clusterPause(s,x.at)));
});
test('recovery in the middle of a cluster pause remains paused and preserves elapsed/count',()=>{
 const s=step(),p={duration:120,timeline:[s]},clock=new SessionClock(p,{now:()=>0});clock.seek(80);const restored=SessionClock.restore(clock.serialize(),{now:()=>999999});
 assert.equal(restored.running,false);assert.equal(repetitionAt(s,restored.elapsed),30);assert.equal(clusterPause(s,restored.elapsed).remaining,6);
 const heard=[],audio=new CoachAudio(()=>({}));audio.beep=()=>{};audio.speak=t=>heard.push(t);audio.cue({running:true,index:0,step:s,remaining:40},p);assert.match(heard[0],/Pausa.*seis segundos/);
});
test('levels preserve movement time and advanced retains clustered volume',()=>{
 for(const level of [1,2]){const t=repetitionTarget(push,60,level);assert.equal(t.cluster,null);assert.equal(t.reps,Math.floor(54/(2)))}
 assert.equal(repetitionTarget(push,60,3).reps,22);
 for(const name of ['Burpees','Agachamentos','Lunges alternados','Sit-ups']){const e=exercises.find(e=>e.name===name);assert.ok(repetitionTarget(e,120,3).reps>repetitionTarget(e,60,2).reps,name)}
});
test('advanced plans retain exact time across short/long modes and valid two-minute work where possible',()=>{
 for(const minutes of [10,20,30,60,90,180])for(const modality of modalities){const p=generate({minutes,level:3,modality,cooldown:minutes===10?2:5},{},8);assert.equal(p.duration,minutes*60);let end=0;for(const s of p.timeline){assert.equal(s.start,end);end=s.end;if(s.cluster){assert.equal(s.kind,'work');assert.ok(clusterRepTime(s.reps-1,s)+s.cadence<=s.duration)}}}
 const emom=generate({minutes:30,level:3,modality:'EMOM'},{},1);assert.ok(emom.blocks.find(b=>b.type==='main').items.every(i=>i.work===55&&i.rest===5));
 const p=generate({minutes:60,level:3,cooldown:5},{},1),b=p.blocks[1],i=b.items.find(i=>i.exercise.name===push.name);
 assert.ok(i.work>=110&&i.work<=120);assert.equal(i.reps,repetitionTarget(push,i.work,3).reps);assert.equal(i.rest,10);
 assert.doesNotThrow(()=>editItem(p,b.id,i.id,{work:120,reps:31}));
 assert.throws(()=>editItem(p,b.id,i.id,{work:120,reps:80}),/não cabem/);
 const changed=editItem(p,b.id,i.id,{work:120,reps:25});assert.equal(changed.blocks[1].items.find(x=>x.id===i.id).reps,25);
});
test('future-target migration leaves started stages unchanged and adapts protocols on exercise edits',()=>{
 const p=generate({minutes:60,level:3,cooldown:5},{},1),s=p.timeline.find(s=>s.kind==='work'&&s.exercise?.id===push.id),copy=structuredClone(p);s.reps=27;
 const migrated=updateRepetitionTargets(p,{from:s.start+10});assert.deepEqual(migrated.timeline.find(x=>x.id===s.id),s);
 const b=copy.blocks.find(b=>b.items.some(i=>i.id===s.itemId)),i=b.items.find(i=>i.id===s.itemId),slow=exercises.find(e=>e.name==='Flexões com pausa');
 const edited=editItem(copy,b.id,i.id,{exercise:slow});assert.equal(edited.blocks.find(x=>x.id===b.id).items.find(x=>x.id===i.id).cadence,5);
});

test('isometric pushups never inherit a repetition cluster or its preferred work duration',()=>{const p=generate({minutes:60,level:3},{},1);for(const s of p.timeline.filter(s=>s.exercise?.execution==='isometry'))assert.equal(s.cluster,null)});
