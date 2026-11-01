import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {COUNTER_DOCUMENT} from '../src/counter-document.js';
import {showCounterPanel} from '../src/counter.js';
test('embedded counter preserves both modes and compiles with no external resources',()=>{
 assert.ok(COUNTER_DOCUMENT.includes('manualTap'));assert.ok(COUNTER_DOCUMENT.includes('runCadencePhases'));assert.ok(COUNTER_DOCUMENT.includes('fittempo_history'));
 assert.ok(!/<(?:script|link|img)[^>]+(?:src|href)="https?:/i.test(COUNTER_DOCUMENT));
 for(const match of COUNTER_DOCUMENT.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new vm.Script(match[1]));
 assert.ok(COUNTER_DOCUMENT.includes('bodywod-counter'));assert.ok(COUNTER_DOCUMENT.includes('historyModal.hidden=true'));
});
test('counter iframe is retained across navigation and receives pause rather than reset',()=>{
 let created=0,frame=null;const messages=[],prior=globalThis.document;
 try{
  globalThis.document={createElement:()=>{created++;return {setAttribute(){},contentWindow:{postMessage:(data)=>messages.push(data)}}}};
  const panel={hidden:true,querySelector:()=>frame,append:value=>frame=value};
  showCounterPanel(panel,true);const first=frame;showCounterPanel(panel,false);showCounterPanel(panel,true);
  assert.equal(created,1);assert.equal(frame,first);assert.equal(panel.hidden,false);assert.equal(frame.srcdoc,COUNTER_DOCUMENT);
  assert.deepEqual(messages,[{type:'bodywod-counter',action:'pause'}]);
 }finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior}
});
test('integration pauses automatic/manual timers only on authenticated parent messages or page hide',()=>{
 const events={},docEvents={},calls=[],parent={},ctx={parent,state:{status:'WORK'},speechTimer:null,audioCtx:{state:'running',suspend:()=>{calls.push('audio');return Promise.resolve()}},pauseWorkout:()=>calls.push('work'),pauseManual:()=>calls.push('manual'),releaseWakeLock:()=>calls.push('wake'),clearTimeout:()=>{},window:{speechSynthesis:{cancel:()=>calls.push('speech')},addEventListener:(n,fn)=>events[n]=fn},document:{hidden:false,addEventListener:(n,fn)=>docEvents[n]=fn,getElementById:()=>null}};
 vm.runInNewContext(fs.readFileSync('src/counter/bridge.js','utf8'),ctx);
 events.message({source:{},data:{type:'bodywod-counter',action:'pause'}});assert.equal(calls.length,0);
 events.message({source:parent,data:{type:'bodywod-counter',action:'pause'}});assert.deepEqual(calls,['work','manual','speech','wake','audio']);
 calls.length=0;ctx.document.hidden=true;docEvents.visibilitychange();assert.ok(calls.includes('work')&&calls.includes('manual'));
});
test('counter history survives blocked writes in memory without touching BodyWOD history',()=>{
 const start=COUNTER_DOCUMENT.indexOf('let integratedHistory='),end=COUNTER_DOCUMENT.indexOf('function renderHistoryModal()',start),notice={textContent:''},keys=[];
 const ctx={localStorage:{getItem:k=>{keys.push(k);return '[{"id":"old","reps":3}]'},setItem:k=>{keys.push(k);throw Error('quota')}},document:{getElementById:()=>notice},renderHistoryModal:()=>{}};
 vm.createContext(ctx);vm.runInContext(COUNTER_DOCUMENT.slice(start,end),ctx);vm.runInContext('saveWorkoutToHistory({id:"new",reps:2})',ctx);
 const history=JSON.parse(vm.runInContext('JSON.stringify(getHistory())',ctx));assert.deepEqual(history.map(x=>x.id),['new','old']);assert.match(notice.textContent,/apenas em memória/);assert.ok(keys.every(k=>k==='fittempo_history'));
});
test('top settings synchronize real counter sound/voice and keep history accessible after hiding its toolbar',()=>{
 const events={},messages=[],state={status:'IDLE',isVoiceEnabled:true,isSoundEnabled:true},attrs={},parent={postMessage:data=>messages.push(data)};let historyOpened=0,cancelled=0;
 const ctx={parent,state,speechTimer:null,clearTimeout(){},voiceIcon:{setAttribute:(k,v)=>attrs['voice-'+k]=v},soundIcon:{setAttribute:(k,v)=>attrs['sound-'+k]=v},lucide:{createIcons(){}},window:{addEventListener:(name,fn)=>events[name]=fn,speechSynthesis:{cancel:()=>cancelled++}},document:{addEventListener(){},getElementById:id=>id==='historyModalBtn'?{click:()=>historyOpened++}:null}};
 vm.runInNewContext(fs.readFileSync('src/counter/bridge.js','utf8'),ctx);
 assert.equal(messages[0].voice,true);assert.equal(messages[0].beeps,true);
 events.message({source:{},data:{type:'bodywod-counter',action:'settings',settings:{voice:false,beeps:false}}});assert.equal(state.isVoiceEnabled,true);
 const send=(action,settings)=>events.message({source:parent,data:{type:'bodywod-counter',action,settings}});
 send('settings',{voice:false,beeps:false});assert.equal(state.isVoiceEnabled,false);assert.equal(state.isSoundEnabled,false);assert.equal(attrs['sound-data-lucide'],'volume-x');assert.equal(cancelled,1);assert.equal(messages.at(-1).voice,false);
 send('get-settings');assert.equal(messages.at(-1).beeps,false);
 send('history');assert.equal(historyOpened,1);
 send('settings',{voice:true,beeps:true});assert.equal(state.isVoiceEnabled,true);assert.equal(state.isSoundEnabled,true);assert.equal(state.status,'IDLE');
});
