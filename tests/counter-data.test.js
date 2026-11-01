import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {COUNTER_DOCUMENT} from '../src/counter-document.js';
test('FitTempo data channel transfers live memory, settings and measured series and restores without starting timers',()=>{
 const elements={},events={},docEvents={},messages=[],parent={postMessage:(data)=>messages.push(data)};
 const el=id=>elements[id]??={value:'10',hidden:false,parentElement:{},classList:{remove(){},add(){}}};
 const controls=[{value:'auto'},{value:'manual'}];
 const ctx={parent,structuredClone,globalThis:{},state:{status:'IDLE',isVoiceEnabled:false,isSoundEnabled:true,timer:123,subTimer:456,wakeLock:{unserializable:true}},manual:{count:4,target:100,elapsed:18000,automatic:true,calibrationStart:0,interval:4000,nextAt:20000,id:'series-1',startedAt:10},integratedHistory:[{sets:2,reps:20,date:'19/10',tempo:'60 BPM'}],integratedReadFailed:false,
 getHistory:()=>ctx.integratedHistory,manualElapsed:()=>ctx.manual.elapsed,window:{addEventListener:(name,fn)=>events[name]=fn},document:{getElementById:el,querySelectorAll:()=>controls,querySelector:()=>({}),addEventListener:(name,fn)=>docEvents[name]=fn},startCounterLeadIn:fn=>fn(),setTimeout:()=>1,clearTimeout(){},localStorage:{setItem(){throw Error('blocked')}},pauseIntegratedCounter(){ctx.manual.startedAt=null},sendCounterSettings(){},updateCadenceValues(){},updateCalculations(){},renderManual(){},renderHistoryModal(){},lucide:{createIcons(){}}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/counter/data.js','utf8'),ctx);
 assert.equal(messages[0].type,'bodywod-counter-data-ready');const snapshot=messages[0].data;
 assert.equal(snapshot.history.length,1);assert.equal(snapshot.manual.count,4);assert.equal(snapshot.settings.voice,false);assert.equal(snapshot.automatic.timer,undefined);assert.equal(snapshot.automatic.wakeLock,undefined);
 events.message({source:{},data:{type:'bodywod-counter-data',action:'get',requestId:'evil'}});assert.equal(messages.length,1);
 events.message({source:parent,data:{type:'bodywod-counter-data',action:'get',requestId:'valid'}});assert.equal(messages[1].requestId,'valid');
 for(const name of ['startBtn','pauseBtn','phaseBadge','mainDisplay','mainSubtext','statSets','statReps'])ctx[name]=el(name);ctx.toggleUIState=()=>{};
 const imported=structuredClone(snapshot);imported.manual.count=12;imported.settings.voice=true;
 events.message({source:parent,data:{type:'bodywod-counter-data',action:'restore',data:imported}});
 assert.equal(ctx.manual.count,12);assert.equal(ctx.manual.startedAt,null);assert.equal(ctx.manual.timer,null);assert.equal(ctx.state.isVoiceEnabled,true);assert.equal(ctx.integratedHistory.length,1);
 assert.match(el('integration-notice').textContent,/memória/);
 imported.automatic={...imported.automatic,status:'WORK',currentSet:2,currentRepInSet:5,totalRepsDone:15,repsPerSet:10,totalRepsGoal:1000,totalSets:100};
 events.message({source:parent,data:{type:'bodywod-counter-data',action:'restore',data:imported}});
 assert.equal(ctx.state.status,'PAUSED');assert.equal(ctx.state.previousStatus,'WORK');assert.equal(ctx.state.totalRepsDone,15);assert.equal(el('startBtn').textContent,'RETOMAR TREINO');
 ctx.executeNextRep=target=>ctx.nextTarget=target;vm.runInContext('resumeImportedWork()',ctx);assert.equal(ctx.nextTarget,10);assert.equal(ctx.state.currentRepInSet,5);

});
test('counter retains every future workout and imported history labels are escaped',()=>{
 assert.ok(!COUNTER_DOCUMENT.includes('history.length > 20'));assert.ok(COUNTER_DOCUMENT.includes('escapeFitTempoText(item.date)'));
 const snippet=fs.readFileSync('src/counter/data.js','utf8');const start=snippet.indexOf('function escapeFitTempoText'),end=snippet.indexOf("window.addEventListener",start);
 const ctx={};vm.createContext(ctx);vm.runInContext(snippet.slice(start,end),ctx);assert.equal(vm.runInContext("escapeFitTempoText('<img src=x>')",ctx),'&lt;img src=x&gt;');
});
