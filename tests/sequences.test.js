import test from 'node:test';
import assert from 'node:assert/strict';
import {exercises,byId} from '../src/exercises.js';
import {sequencePhase,orderSequencePhases,sequenceSections,formatSequenceDuration,sequencePaceTest,sequenceDefaults,applySequenceDefaults,isSequencePaceVerified,setSequenceCadence,confirmSequencePace,parseSequenceSeconds,sequenceCategories,sequenceCategory,newSequence,sequenceItem,emptySequences,sequenceTimeline,measuredCadence,validateSequences,SequenceRunner} from '../src/sequences.js';
import {emptyState,createStore} from '../src/storage.js';
import {makeBackup,parseBackup,mergeBackup} from '../src/backup.js';
function fixture(){const p=newSequence();p.items=[{...sequenceItem('ex-1-01'),sets:2,reps:15,rest:10},{...sequenceItem('ex-6-01'),sets:1,reps:10,rest:30}];return p}
test('category lists share the entire Crossfit catalogue and include biceps, triceps, warmup and cooldown',()=>{
 for(const e of exercises)assert.ok(sequenceCategories.some(c=>sequenceCategory(e,c)),e.name);
 assert.ok(exercises.some(e=>sequenceCategory(e,'Bíceps')));assert.equal(sequenceCategory(byId['ex-1-01'],'Tríceps'),true);
 assert.equal(sequenceCategory(exercises.find(e=>e.category==='Aquecimento'),'Pernas e glúteos'),false);
});
test('personal decimal cadence gives exact total with series and exercise rests, without a final rest',()=>{
 const steps=sequenceTimeline(fixture(),{'ex-1-01':1.33,'ex-6-01':5});
 assert.deepEqual(steps.map(s=>s.duration),[19.95,10,19.95,10,50]);assert.ok(Math.abs(steps.at(-1).end-109.9)<1e-8);
 assert.deepEqual(steps.map(s=>s.round),[1,1,2,2,1]);assert.equal(steps.at(-1).kind,'work');assert.equal(steps[4].exerciseId,'ex-6-01');
});
test('timed warmup and cooldown preserve seconds and still support set counts',()=>{
 const p=newSequence(),warm=exercises.find(e=>e.category==='Aquecimento'),cool=exercises.find(e=>e.category==='Retorno à calma');
 p.items=[{...sequenceItem(warm.id),mode:'time',seconds:30,sets:2,rest:5},{...sequenceItem(cool.id),mode:'time',seconds:20,rest:0}];
 assert.equal(sequenceTimeline(p).at(-1).end,90);assert.equal(sequenceTimeline(p)[0].reps,null);
});
test('simulation averages complete repetitions to hundredths and rejects invalid timings',()=>{
 assert.equal(measuredCadence(3.99,3),1.33);assert.equal(measuredCadence(15,3),5);
 for(const args of [[0,3],[300,0],[Infinity,3],[.1,3],[1000,3],[5,1.5]])assert.throws(()=>measuredCadence(...args));
});
test('runner waits for narration, starts from zero and counts through the final repetition without jumping stages',()=>{
 let now=0;const r=new SequenceRunner(fixture(),{'ex-1-01':1.33},()=>now);r.prepare();now=10000;assert.equal(r.snapshot().elapsed,0);r.begin();assert.equal(r.snapshot().rep,0);
 now=11330;assert.equal(r.snapshot().rep,1);now=29950;assert.equal(r.snapshot().rep,15);assert.equal(r.snapshot().done,true);assert.equal(r.index,0);
 r.prepare();now=40000;assert.equal(r.snapshot().elapsed,19.95);r.advance();assert.equal(r.snapshot().step.kind,'rest');assert.equal(r.snapshot().elapsed,0);r.prepare();r.begin();now=45000;assert.equal(r.snapshot().remaining,5);
});
test('pause and restore exclude closed-app time, preserve progress, and finish exactly once',()=>{
 const p=newSequence();p.items=[{...sequenceItem('ex-1-01'),reps:3,rest:0}];let now=0;const r=new SequenceRunner(p,{'ex-1-01':1.33},()=>now);r.prepare();r.begin();now=2660;r.pause();const copy=SequenceRunner.restore(r.serialize(),()=>now);
 now=100000;assert.equal(copy.snapshot().rep,2);assert.equal(copy.running,false);copy.prepare();copy.begin();now=101330;assert.equal(copy.snapshot().rep,3);copy.advance();assert.equal(copy.finished,true);copy.prepare();assert.equal(copy.running,false);
});
test('sequence validation rejects empty workouts, invalid quantities, unknown exercises, rhythms and sessions',()=>{
 assert.throws(()=>sequenceTimeline(newSequence()));const base=emptySequences();base.draft=fixture();
 for(const change of [d=>d.draft.id='"<img>',d=>d.draft.items[0].sets=0,d=>d.draft.items[0].reps=1.5,d=>d.draft.items[0].rest=-1,d=>d.draft.items[0].exerciseId='unknown',d=>d.cadences['ex-1-01']=0,d=>d.session={plan:fixture(),cadences:{},index:999,offset:0}]){const bad=structuredClone(base);change(bad);assert.throws(()=>validateSequences(bad))}
});
test('shared backup and storage round-trip sequences, learned cadence, saved plans, history and paused runner without duplication',()=>{
 const state=emptyState(),d=emptySequences(),p=fixture();d.draft=p;d.plans=[structuredClone(p)];d.cadences={'ex-1-01':1.33};d.session=new SequenceRunner(p,d.cadences).serialize();d.history=[{id:'seq-history',date:'2026-11-01',duration:109.9,plan:p}];state.fittempoSequences=d;
 const incoming=parseBackup(makeBackup(state,'1.30'));const merged=mergeBackup(emptyState(),incoming);assert.deepEqual(merged.fittempoSequences,d);assert.deepEqual(mergeBackup(merged,incoming).fittempoSequences,d);
 let raw=null;const storage={getItem:()=>raw,setItem:(k,v)=>raw=v};createStore(storage).update(s=>Object.assign(s,merged));assert.deepEqual(createStore(storage).state.fittempoSequences,d);
 const bad=structuredClone(state);bad.fittempoSequences.cadences['ex-1-01']=-1;assert.throws(()=>parseBackup(makeBackup(bad,'1.30')));
});

test('full sequence advances through every set, rest and exercise and counts all repetitions at their individual cadences',()=>{
 let now=0;const p=fixture(),r=new SequenceRunner(p,{'ex-1-01':1.33,'ex-6-01':5},()=>now),counts=[];
 while(!r.finished){r.prepare();now+=5000;const before=r.snapshot();r.begin();const anchor=now;
 if(before.step.reps&&before.step.kind==='work')for(let rep=1;rep<=before.step.reps;rep++){now=anchor+rep*before.step.cadence*1000;assert.equal(r.snapshot().rep,rep);counts.push([before.step.exerciseId,before.step.round,rep])}
 else now+=before.step.duration*1000;
 assert.equal(r.snapshot().done,true);r.advance();
 }
 assert.equal(counts.length,40);assert.deepEqual(counts.at(-1),['ex-6-01',1,10]);assert.equal(r.snapshot().totalRemaining,0);
});


test('seconds accept comma or dot to hundredths without accepting fractional repetition counts',()=>{
 for(const text of ['1,33','1.33',' 1,33 '])assert.equal(parseSequenceSeconds(text),1.33);
 assert.equal(parseSequenceSeconds('1,3'),1.3);assert.equal(parseSequenceSeconds('1'),1);
 for(const text of ['',',','1,','1.333','1,2.3','1e2','-1','Infinity','0,01','61'])assert.throws(()=>parseSequenceSeconds(text));
 const plan=newSequence();plan.items=[{...sequenceItem('ex-1-01'),mode:'time',seconds:parseSequenceSeconds('1,33',{min:.01,max:3600}),rest:0}];
 assert.equal(sequenceTimeline(plan).at(-1).end,1.33);
 plan.items[0].reps=1.33;assert.throws(()=>sequenceTimeline(plan));
});


test('general values seed new exercises, allow individual edits and bulk application preserves timing settings',()=>{
 const plan=newSequence({sets:4,reps:20});const first=sequenceItem('ex-1-01',sequenceDefaults(plan));plan.items.push(first);assert.equal(first.sets,4);assert.equal(first.reps,20);
 first.reps=12;plan.defaults={sets:2,reps:15};const second=sequenceItem('ex-6-01',sequenceDefaults(plan));plan.items.push(second);assert.equal(first.reps,12);assert.equal(second.reps,15);assert.equal(second.sets,2);
 const warm=exercises.find(e=>e.category==='Aquecimento');plan.items.push({...sequenceItem(warm.id),mode:'time',seconds:45,rest:17});
 const changed=applySequenceDefaults(plan,{sets:3,reps:8});assert.equal(changed.items[0].reps,8);assert.equal(changed.items[2].sets,3);assert.equal(changed.items[2].seconds,45);assert.equal(changed.items[2].rest,17);assert.equal(first.reps,12);
 assert.throws(()=>applySequenceDefaults(plan,{sets:0,reps:20}));const legacy=newSequence();delete legacy.defaults;assert.deepEqual(sequenceDefaults(legacy),{sets:3,reps:10});
});
test('verification belongs to the exact exercise pace and only changing that pace invalidates it',()=>{
 const data=emptySequences();setSequenceCadence(data,'ex-1-01',1.33);confirmSequencePace(data,'ex-1-01',true);assert.equal(isSequencePaceVerified(data,'ex-1-01'),true);
 setSequenceCadence(data,'ex-6-01',5);assert.equal(isSequencePaceVerified(data,'ex-1-01'),true);setSequenceCadence(data,'ex-1-01',1.33);assert.equal(isSequencePaceVerified(data,'ex-1-01'),true);
 setSequenceCadence(data,'ex-1-01',1.5);assert.equal(isSequencePaceVerified(data,'ex-1-01'),false);setSequenceCadence(data,'ex-1-01',1.33);assert.equal(isSequencePaceVerified(data,'ex-1-01'),false);
 confirmSequencePace(data,'ex-1-01',true);confirmSequencePace(data,'ex-1-01',false);assert.equal(isSequencePaceVerified(data,'ex-1-01'),false);
});
test('defaults and confirmed pace survive shared backup while legacy sequence backups remain importable',()=>{
 const state=emptyState(),data=emptySequences();data.draft=fixture();data.draft.defaults={sets:2,reps:15};data.plans=[structuredClone(data.draft)];setSequenceCadence(data,'ex-1-01',1.33);confirmSequencePace(data,'ex-1-01',true);state.fittempoSequences=data;
 const restored=mergeBackup(emptyState(),parseBackup(makeBackup(state,'1.32')));assert.equal(isSequencePaceVerified(restored.fittempoSequences,'ex-1-01'),true);assert.deepEqual(restored.fittempoSequences.draft.defaults,{sets:2,reps:15});assert.equal(mergeBackup(restored,parseBackup(makeBackup(state,'1.32'))).fittempoSequences.plans.length,1);
 const legacy=structuredClone(state);delete legacy.fittempoSequences.verifiedCadences;delete legacy.fittempoSequences.draft.defaults;assert.doesNotThrow(()=>parseBackup(makeBackup(legacy,'1.31')));
 const bad=structuredClone(state);bad.fittempoSequences.verifiedCadences['ex-1-01']='true';assert.throws(()=>parseBackup(makeBackup(bad,'1.32')));
});
test('pace rehearsal is five repetitions at the stored speed, independent of workout volume or completion records',()=>{
 const workout=fixture(),snapshot=structuredClone(workout),preview=sequencePaceTest('ex-1-01');const steps=sequenceTimeline(preview,{'ex-1-01':1.33});assert.equal(steps.length,1);assert.equal(steps[0].reps,5);assert.equal(steps[0].sets,1);assert.equal(steps[0].duration,6.65);assert.deepEqual(workout,snapshot);
});


test('phase ordering is stable within each section and does not change the source or paused session',()=>{
 const plan=newSequence(),warm=exercises.find(e=>e.category==='Aquecimento'),cool=exercises.find(e=>e.category==='Retorno à calma');
 plan.items=[sequenceItem('ex-1-01'),sequenceItem(cool.id),sequenceItem(warm.id),sequenceItem('ex-6-01')];const original=structuredClone(plan),session=new SequenceRunner(plan).serialize();
 const ordered=orderSequencePhases(plan);assert.deepEqual(ordered.items.map(sequencePhase),['warmup','training','training','cooldown']);assert.deepEqual(ordered.items.filter(i=>sequencePhase(i)==='training').map(i=>i.exerciseId),['ex-1-01','ex-6-01']);assert.deepEqual(plan,original);assert.deepEqual(session.plan,original);
});
test('section totals include series rests and transitions and add exactly to the ordered workout',()=>{
 const plan=newSequence(),warm=exercises.find(e=>e.category==='Aquecimento'),cool=exercises.find(e=>e.category==='Retorno à calma');
 plan.items=[{...sequenceItem('ex-1-01'),reps:3,sets:2,rest:10},{...sequenceItem(cool.id),mode:'time',seconds:30,rest:9},{...sequenceItem(warm.id),mode:'time',seconds:20,rest:5},{...sequenceItem('ex-6-01'),reps:2,sets:1,rest:7}];
 const cadences={'ex-1-01':1.33,'ex-6-01':5},sections=sequenceSections(plan,cadences),ordered=orderSequencePhases(plan),steps=sequenceTimeline(ordered,cadences);
 assert.deepEqual(sections.map(s=>s.duration),[25,44.98,30]);assert.equal(sections[1].items[0].duration,27.98);assert.equal(sections[2].items[0].duration,30);assert.ok(Math.abs(sections.reduce((total,s)=>total+s.duration,0)-steps.at(-1).end)<1e-8);assert.equal(formatSequenceDuration(steps.at(-1).end),'01:39,98');
});
test('empty sections stay visible at zero and recalculation follows exercise timing edits',()=>{
 const plan=newSequence();assert.deepEqual(sequenceSections(plan).map(s=>s.duration),[0,0,0]);plan.items=[{...sequenceItem('ex-1-01'),sets:2,reps:10,rest:5}];
 assert.deepEqual(sequenceSections(plan,{'ex-1-01':1.33}).map(s=>s.duration),[0,31.6,0]);plan.items[0].reps=15;assert.equal(sequenceSections(plan,{'ex-1-01':1.33})[1].duration,44.9);assert.equal(formatSequenceDuration(44.9),'00:44,90');assert.equal(formatSequenceDuration(60),'01:00');
});
