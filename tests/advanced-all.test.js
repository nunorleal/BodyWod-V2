import test from 'node:test';
import assert from 'node:assert/strict';
import {exercises} from '../src/exercises.js';
import {suitableForMain,trainingRole,advancedRepProfile,clusterRepTime,clusterPause} from '../src/training.js';
import {generate,repetitionTarget,modalities} from '../src/generator.js';
import {CoachAudio,repetitionAt} from '../src/audio.js';
const main=exercises.filter(e=>trainingRole(e)==='training'&&suitableForMain(e,3));
test('all advanced dynamic exercises have an explicit rhythm, grouping and greater two-minute volume',()=>{
 for(const e of main.filter(e=>e.execution==='reps')){
  const p=advancedRepProfile(e),t=repetitionTarget(e,120,3);
  assert.ok(p&&p.cadence>=2&&p.cadence<=5.5,e.name);assert.ok([10,15].includes(p.cluster.every));assert.equal(p.cluster.rest,10);
  assert.ok(t.reps>repetitionTarget(e,60,2).reps,e.name);
  assert.ok(clusterRepTime(t.reps-1,t)+t.cadence<=120,e.name);
 }
});
test('every advanced repetition profile drives exact bips with no counts during micro-rests',()=>{
 for(const e of main.filter(e=>e.execution==='reps')){
  const s={id:e.id,kind:'work',exercise:e,round:1,sets:1,duration:120,...repetitionTarget(e,120,3)},events=[],heard=[];
  let elapsed=0;const audio=new CoachAudio(()=>({voiceMode:'full'}));audio.beep=type=>events.push({type,elapsed});audio.speak=text=>heard.push(text);
  for(elapsed=0;elapsed<120;elapsed+=.1)audio.cue({step:s,running:true,remaining:120-elapsed,index:0},{timeline:[s]});
  const reps=events.filter(x=>x.type==='rep');assert.equal(reps.length,s.reps,e.name);assert.ok(reps.every(x=>!clusterPause(s,x.elapsed)),e.name);
  assert.equal(heard.filter(x=>x==='Pausa de dez segundos.').length,Math.floor((s.reps-1)/s.cluster.every),e.name);
  assert.equal(repetitionAt(s,119.99),s.reps);
 }
});
test('all muscle groups, timed cardio and isometries get longer advanced windows with exact duration',()=>{
 const seen=new Set();let timed=false,isometry=false;
 for(const modality of modalities.filter(m=>!['AMRAP','EMOM'].includes(m)))for(const seed of [1,7,17]){
  const p=generate({minutes:60,level:3,cooldown:5,modality},{},seed);assert.equal(p.duration,3600);
  for(const b of p.blocks.filter(b=>b.type==='main'))for(const i of b.items){
   seen.add(i.exercise.category);assert.ok(i.work>=100&&i.work<=120,`${modality}: ${i.exercise.name}: ${i.work}`);assert.equal(i.rest,10);
   if(i.exercise.execution==='reps')assert.ok(i.cluster,i.exercise.name);
   else{assert.equal(i.reps,null);assert.equal(i.cluster,null);timed||=i.exercise.execution==='time';isometry||=i.exercise.execution==='isometry'}
  }
 }
 assert.equal(seen.size,6);assert.ok(timed&&isometry);
});
test('EMOM retains minute boundaries and AMRAP increases all-round volumes including time references',()=>{
 const emom=generate({minutes:60,level:3,modality:'EMOM'},{},8);
 for(const i of emom.blocks.find(b=>b.type==='main').items){assert.equal(i.work,55);assert.equal(i.rest,5);if(i.exercise.execution==='reps')assert.ok(i.cluster)}
 const amrap=generate({minutes:60,level:3,modality:'AMRAP'},{},8);
 for(const i of amrap.blocks.find(b=>b.type==='main').items){assert.equal(i.work,60);if(i.exercise.execution==='reps')assert.equal(i.reps,advancedRepProfile(i.exercise).cluster.every*2);else assert.equal(i.reps,null)}
});
