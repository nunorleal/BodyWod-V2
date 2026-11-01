import test from 'node:test';
import assert from 'node:assert/strict';
import {exercises} from '../src/exercises.js';
import {executionCadence,clusterRepTime} from '../src/training.js';
import {repetitionTiming} from '../src/audio.js';
import {repetitionTarget,generate,editItem,updateRepetitionTargets} from '../src/generator.js';
import {COUNTER_DOCUMENT} from '../src/counter-document.js';
const get=name=>exercises.find(e=>e.name===name);
test('normal pushups use 2 seconds while squats and technical variants retain their own defaults',()=>{
 assert.deepEqual([1,2,3].map(level=>executionCadence(get('Flexões clássicas'),level)),[2,2,2]);
 assert.equal(repetitionTarget(get('Flexões clássicas'),120,3).reps,45);
 assert.deepEqual([1,2,3].map(level=>executionCadence(get('Agachamentos'),level)),[4,3.5,3]);
 for(const name of ['Flexões com pausa','Flexões excêntricas','Agachamentos com descida lenta'])assert.ok(executionCadence(get(name),3)>=5,name);
 assert.ok(executionCadence(get('Burpees'),3)>executionCadence(get('Agachamentos'),3));
});
test('all repetition targets leave enough time for the final complete motion and never compress cadence to fit',()=>{
 for(const exercise of exercises.filter(e=>e.execution==='reps'))for(const level of [1,2,3])for(const duration of [15,30,45,55,60,120]){
 const step={kind:'work',exercise,duration,...repetitionTarget(exercise,duration,level)};
 const timing=repetitionTiming(step);assert.ok(timing.interval===0||timing.interval>=executionCadence(exercise,level),exercise.name);
 const last=step.cluster?clusterRepTime(step.reps-1,step):timing.start+(step.reps-1)*timing.interval;
 assert.ok(last+step.cadence<=duration+1e-6,`${exercise.name}, level ${level}, ${duration}s: ${last}+${step.cadence}`);
 }
});
test('editing rejects excessive repetitions rather than speeding up a movement',()=>{
 const plan=generate({minutes:60,level:1},{},42),block=plan.blocks[1],item=block.items.find(i=>i.exercise.execution==='reps'),limit=repetitionTarget(item.exercise,item.work,1).reps;
 assert.throws(()=>editItem(plan,block.id,item.id,{reps:limit+1}),/não cabem/);
});
test('legacy manual targets are capped only in future stages while already started stages retain progress',()=>{
 const plan=generate({minutes:60,level:3},{},1),block=plan.blocks[1],item=block.items.find(i=>i.exercise.name==='Flexões clássicas');
 assert.ok(item);item.reps=56;item.cadence=1.5;item.repsMode='manual';
 const steps=plan.timeline.filter(s=>s.itemId===item.id&&s.kind==='work');for(const step of steps){step.reps=56;step.cadence=1.5}
 const migrated=updateRepetitionTargets(plan,{from:steps[0].start+1});assert.deepEqual(migrated.timeline.find(s=>s.id===steps[0].id),steps[0]);
 for(const step of migrated.timeline.filter(s=>s.itemId===item.id&&s.kind==='work'&&s.start>steps[0].start)){assert.equal(step.cadence,2);assert.ok(step.reps<=repetitionTarget(step.exercise,step.duration,3).reps)}
});
test('FitTempo pushup preset uses 2 seconds per rep while squat preset retains its 5-second movement',()=>{
 assert.match(COUNTER_DOCUMENT,/preset === 'pushups'[\s\S]*?inputBpm.value = 30/);
 assert.match(COUNTER_DOCUMENT,/preset === 'squats'[\s\S]*?tempoEccentric.value = 3;[\s\S]*?tempoPause1.value = 1;[\s\S]*?tempoConcentric.value = 1;/);
});
