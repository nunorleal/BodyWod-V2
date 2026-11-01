import test from 'node:test';
import assert from 'node:assert/strict';
import {retimeExercisePlan,applySavedCadences,retimeRepetitionStep,boundedCadence} from '../src/pace.js';
import {repetitionAt} from '../src/audio.js';
import {clusterPause} from '../src/training.js';
import {SessionClock} from '../src/timer.js';
import {generate,updateRepetitionTargets} from '../src/generator.js';
const step=(id,exercise='push')=>({id,kind:'work',blockId:'block',itemId:exercise,exercise:{id:exercise},reps:10,cadence:3,duration:36,start:0,end:36,round:1,sets:2,cluster:null});
function plan(){const a=step('a'),rest={id:'r',kind:'rest',blockId:'block',duration:10,start:36,end:46},b={...step('b'),start:46,end:82},c={...step('c','squat'),start:82,end:118};return {duration:118,config:{minutes:2},blocks:[{id:'block',target:118,items:[{id:'push',exercise:{id:'push'},work:36,reps:10},{id:'squat',exercise:{id:'squat'},work:36,reps:10}]}],timeline:[a,rest,b,c]}}
test('live faster pace preserves the rep count and movement fraction, updates future sets and total time',()=>{
 const original=plan(),updated=retimeExercisePlan(original,'push',2,{elapsed:13.5}),current=updated.timeline[0];
 assert.equal(repetitionAt(original.timeline[0],13.5),3);assert.equal(repetitionAt(current,13.5),3);
 assert.equal(current.repTimes[3],14.5);assert.equal(repetitionAt(current,14.49),3);assert.equal(repetitionAt(current,14.5),4);
 assert.equal(current.duration,28.5);assert.equal(updated.timeline[2].duration,26);assert.equal(updated.duration,100.5);
 assert.equal(updated.timeline[1].duration,10);assert.equal(updated.timeline[3].duration,36);assert.equal(updated.timeline[3].start,64.5);
 assert.equal(original.duration,118);assert.deepEqual(updated.timeline.map(s=>s.id),original.timeline.map(s=>s.id));
});
test('slowing down lengthens the current workout without losing elapsed time, manual confirmations or the paused state',()=>{
 let now=0;const clock=new SessionClock(plan(),{now:()=>now});clock.start();now=13500;clock.pause();clock.completedReps.a=2;
 clock.plan=retimeExercisePlan(clock.plan,'push',4,{elapsed:clock.elapsed});assert.equal(clock.plan.duration,135.5);assert.equal(clock.elapsed,13.5);assert.equal(clock.completedReps.a,2);assert.equal(clock.running,false);
 clock.resume();now=14500;assert.equal(clock.elapsed,14.5);assert.equal(repetitionAt(clock.getSnapshot().step,14.5),3);
});
test('changing speed inside a micro-rest preserves the remaining rest and all repetitions',()=>{
 const original={...step('cluster'),duration:120,reps:31,cadence:3,cluster:{every:15,rest:10}},updated=retimeRepetitionStep(original,2,55);
 assert.equal(repetitionAt(updated,55),15);assert.equal(clusterPause(updated,55).remaining,6);assert.equal(updated.repTimes[15],61);assert.equal(repetitionAt(updated,61),16);
 assert.equal(updated.repTimes.length,31);assert.equal(updated.pauseWindows.length,2);
});
test('changing speed while preparing or on the final rep keeps progress monotonic',()=>{
 const a=retimeRepetitionStep(step('a'),2,3);assert.equal(a.repTimes[0],6);assert.equal(repetitionAt(a,3),0);
 const last=retimeRepetitionStep(step('a'),2,34.5);assert.equal(repetitionAt(last,34.5),10);assert.equal(last.duration,35.5);
});
test('stored paces apply only to the selected exercise in a new workout and survive recovery without touching started stages',()=>{
 const state={exerciseCadences:{'ex-1-01':2.25}},generated=generate({minutes:60,level:3},state,1),personal=generated.timeline.filter(s=>s.exercise?.id==='ex-1-01'&&s.kind==='work');
 assert.ok(personal.length);assert.ok(personal.every(s=>s.cadence===2.25&&s.cadenceCustom));
 assert.equal(generated.duration,generated.timeline.at(-1).end);assert.ok(generated.customPacing);
 const migrated=updateRepetitionTargets(generated);assert.deepEqual(migrated.timeline,generated.timeline);
 const base=plan(),recovered=applySavedCadences(base,{push:2},{elapsed:13.5,includeCurrent:false});assert.deepEqual(recovered.timeline[0],base.timeline[0]);assert.equal(recovered.timeline[2].cadence,2);
 const restored=SessionClock.restore({...new SessionClock(recovered).serialize(),elapsed:13.5});assert.equal(restored.running,false);assert.equal(restored.plan.duration,recovered.duration);
});
test('speed limits and repeated preference application are stable',()=>{
 assert.equal(boundedCadence(.1),.5);assert.equal(boundedCadence(20),10);assert.equal(boundedCadence(2.26),2.25);
 assert.throws(()=>retimeExercisePlan(plan(),'push',0));
 const once=applySavedCadences(plan(),{push:2}),twice=applySavedCadences(once,{push:2});assert.deepEqual(twice,once);
});
test('legacy evenly spread counts retain their fractional position when a preferred speed is applied',()=>{
 const old={...step('legacy'),duration:45,cadence:3},changed=retimeRepetitionStep(old,2,16);
 // The old interval is 4 seconds: the third rep began at 14 and is halfway complete.
 assert.equal(repetitionAt(changed,16),3);assert.equal(changed.repTimes[3],17);
});
test('personal exercise speed and adjusted schedules survive a complete data export/import',async()=>{
 const {emptyState}=await import('../src/storage.js'),{makeBackup,parseBackup,mergeBackup}=await import('../src/backup.js');
 const state=emptyState();state.exerciseCadences={'ex-1-01':2.25};const workout=generate({minutes:60,level:3},state,1);state.saved=[workout];state.session=new SessionClock(workout).serialize();
 const imported=mergeBackup(emptyState(),parseBackup(JSON.stringify(makeBackup(state,'1.27'))));
 assert.deepEqual(imported.exerciseCadences,state.exerciseCadences);assert.deepEqual(imported.saved[0].timeline,workout.timeline);assert.deepEqual(imported.session.plan.timeline,workout.timeline);
});
