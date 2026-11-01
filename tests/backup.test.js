import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBackup,parseBackup,mergeBackup,mergeFitTempo,validateFitTempo} from '../src/backup.js';
import {emptyState,createStore} from '../src/storage.js';
import {generate} from '../src/generator.js';
import {SessionClock} from '../src/timer.js';
function fixture(){
 const data=emptyState(),plan=generate({minutes:30,level:1},{},42);
 plan.favorite=true;plan.notes='Treino guardado';data.exerciseCadences={'ex-1-01':2.25};data.saved=[plan];data.lastPlan=plan;data.favorites=['ex-1-01'];data.excluded=['burpee'];data.preferences.voice=false;
 data.session=new SessionClock(plan).serialize();data.history=[{id:'session-1',status:'completed',date:new Date().toISOString(),plan,completedSteps:[],completedReps:{},rounds:{},changes:[],actualSeconds:600,notes:'Bom treino',rating:5}];
 data.unsavedSummary=data.history[0];
 data.fittempo={history:[{id:'fit-1',date:'19/10, 12:30',sets:100,reps:1000,tempo:'60 BPM'}],settings:{voice:false,beeps:true},inputs:{inputSeriesGoal:'100',automaticGoalMode:'series'},manual:{id:'manual-1',count:4,target:100,elapsed:18000,automatic:true,calibrationStart:0,interval:4000,nextAt:20000}};
 return data;
}
test('complete JSON round trip includes history, ratings, favorites, settings, plans, paused session and FitTempo',()=>{
 const data=fixture();const file=JSON.stringify(makeBackup(data,'1.20'));const restored=parseBackup(file);
 assert.deepEqual(restored,data);const target=mergeBackup(emptyState(),restored);assert.deepEqual(target,data);
 const entries=new Map(),storage={getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)};
 createStore(storage).update(s=>Object.assign(s,target));assert.deepEqual(createStore(storage).state,target);
});
test('repeated import preserves existing records and session without duplicating workouts',()=>{
 const data=fixture(),current=structuredClone(data);current.saved[0].name='Nome neste dispositivo';current.history.push({...current.history[0],id:'local-session'});current.favorites.push('squat');
 const original=structuredClone(current);let merged=mergeBackup(current,parseBackup(makeBackup(data,'1.20')));merged=mergeBackup(merged,data);
 assert.equal(merged.history.length,2);assert.equal(merged.saved.length,1);assert.deepEqual(merged.favorites,['ex-1-01','squat']);assert.equal(merged.fittempo.history.length,1);
 assert.equal(merged.saved[0].name,'Nome neste dispositivo');assert.deepEqual(current,original);assert.deepEqual(merged.session,current.session);
});
test('legacy BodyWOD JSON remains importable and restores preferences',()=>{
 const legacy=fixture();delete legacy.fittempo;const decoded=parseBackup(JSON.stringify(legacy));const merged=mergeBackup(emptyState(),decoded);
 assert.equal(merged.preferences.voice,false);assert.equal(merged.saved.length,1);assert.equal(merged.history.length,1);
});
test('malformed backup fails validation before any store update',()=>{
 const data=fixture();for(const alter of [d=>d.saved[0].config=null,d=>d.history[0].actualSeconds='600',d=>d.session.elapsed=-1,d=>d.fittempo.history[0].sets='100',d=>d.fittempo.manual.interval=-2,d=>d.preferences.voice='false']){
 const bad=structuredClone(data);alter(bad);assert.throws(()=>parseBackup(makeBackup(bad,'1.20')));
 }
 assert.throws(()=>parseBackup('{"version":1,"__proto__":{}}'));assert.throws(()=>parseBackup('{broken'));
});
test('FitTempo merges uncapped legacy history without duplicates and blocked persistence keeps imported data exportable',()=>{
 const history=Array.from({length:80},(_,i)=>({id:String(i),sets:100,reps:1000,date:'19/10',tempo:'60 BPM'}));
 const merged=mergeFitTempo({history},validateFitTempo({history:history.slice(20),settings:{voice:true,beeps:true}}));assert.equal(merged.history.length,80);
 const store=createStore({getItem:()=>null,setItem:()=>{throw Object.assign(Error(),{name:'QuotaExceededError'})}});
 assert.equal(store.update(s=>Object.assign(s,fixture())),false);assert.equal(parseBackup(JSON.stringify(makeBackup(store.state,'1.20'))).fittempo.history.length,1);
});
