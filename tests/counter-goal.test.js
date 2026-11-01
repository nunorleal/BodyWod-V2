import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {advanceSeries,seriesGoalReached,automaticSeriesProgress,seriesGoalProgress,seriesWorkoutEstimate,seriesDurationText} from '../src/counter/progress.js';
test('delayed automatic tick caps at the goal and preserves its exact final deadline',()=>{
 const m={count:1,target:3,automatic:true,startedAt:0,interval:3000,nextAt:6000};
 assert.equal(advanceSeries(m,20000),2);assert.equal(m.count,3);assert.equal(m.nextAt-m.interval,9000);
 assert.equal(seriesGoalReached(m),true);assert.equal(automaticSeriesProgress(m,9000),1);
 assert.equal(advanceSeries(m,21000),0);
});
test('free series have no cap and paused series never advance',()=>{
 const m={count:99,target:null,automatic:true,startedAt:0,interval:3000,nextAt:6000};
 assert.equal(advanceSeries(m,12000),3);assert.equal(m.count,102);assert.equal(seriesGoalReached(m),false);
 m.startedAt=null;assert.equal(advanceSeries(m,24000),0);
});
function harness(){
 let now=0,tick=null;
 const els=new Map();
 const el=id=>{
  if(!els.has(id))els.set(id,{id,hidden:false,value:'100',checked:false,disabled:false,dataset:{},style:{setProperty(k,v){this[k]=v}},classList:{toggle(){}},attrs:{},events:{},parentElement:{},
   setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},toggleAttribute(k,v){if(v)this.attrs[k]='';else delete this.attrs[k]},
   addEventListener(k,fn){this.events[k]=fn},querySelector(){return el(id+'Icon')}});
  return els.get(id);
 };
 const fixed=el('fixed'),free=el('free'),auto=el('auto'),touch=el('touch');auto.value='auto';touch.value='manual';
 const ctx={document:{getElementById:el,querySelector:()=>fixed,querySelectorAll:s=>s.includes('seriesMode')?[auto,touch]:[fixed,free,el('seriesGoalTarget')]},celebrateFitTempo:details=>{ctx.celebrations??=[];ctx.celebrations.push(details)},closeFitTempoCelebration(){},performance:{now:()=>now},setInterval:fn=>{tick=fn;return 1},clearInterval:()=>{tick=null},clearTimeout(){},releaseWakeLock(){},requestWakeLock(){},initAudioContext(){},initSpeech(){},playSound(){},speak(){},lucide:{createIcons(){}},window:{},speechTimer:null};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/counter/progress.js','utf8').replace(/^export /gm,'')+'\n'+fs.readFileSync('src/counter/manual.js','utf8'),ctx);
 return {el,fixed,auto,ctx,setNow:n=>now=n,tick:()=>tick?.(),run:s=>vm.runInContext(s,ctx),click:id=>el(id).events.click(),goal:n=>{fixed.checked=true;el('seriesGoalTarget').value=String(n);el('seriesGoalTarget').events.input({target:el('seriesGoalTarget')})}};
}
test('fixed manual goal stops, undo permits resuming, reset retains the selected target',()=>{
 const h=harness();h.goal(3);
 h.click('manualTap');h.setNow(1000);h.click('manualTap');h.setNow(2000);h.click('manualTap');
 assert.equal(h.run('manual.count'),3);assert.equal(h.run('manual.startedAt'),null);assert.equal(h.run('manual.elapsed'),2000);assert.equal(h.el('manualStart').disabled,true);
 assert.equal(h.el('seriesGoalStroke').style.strokeDashoffset,'0');
 h.click('manualUndo');assert.equal(h.run('manual.count'),2);assert.equal(h.el('manualStart').disabled,false);
 h.click('manualStart');h.setNow(3000);h.click('manualTap');assert.equal(h.run('manual.count'),3);assert.equal(h.run('manual.elapsed'),3000);
 h.click('manualReset');assert.equal(h.run('manual.count'),0);assert.equal(h.run('manual.target'),3);assert.equal(h.el('seriesGoalStroke').style.strokeDashoffset,'100');
});
test('automatic goal stops at measured deadline despite a late callback and freezes at full fill',()=>{
 const h=harness();h.goal(3);h.auto.events.change();h.click('manualStart');h.setNow(3000);h.click('manualTap');
 h.setNow(4500);h.tick();assert.equal(h.el('manualTap').style['--series-progress'],'0.5');
 h.setNow(20000);h.tick();assert.equal(h.run('manual.count'),3);assert.equal(h.run('manual.elapsed'),9000);assert.equal(h.run('manual.startedAt'),null);
 assert.equal(h.el('manualTap').style['--series-progress'],'1');assert.equal(h.el('manualStartLabel').textContent,'Concluído');
 h.setNow(30000);h.tick();assert.equal(h.run('manual.count'),3);
 h.click('manualUndo');h.click('manualStart');h.setNow(33000);h.tick();assert.equal(h.run('manual.count'),3);assert.equal(h.run('manual.elapsed'),9000);assert.equal(h.el('manualUndo').hidden,true);
});
test('free selection removes the perimeter and input edits immediately update the goal',()=>{
 const h=harness();h.goal(100);assert.equal(h.run('manual.target'),100);assert.equal(h.el('seriesGoalRing').attrs.hidden,undefined);
 h.goal(7);assert.equal(h.run('manual.target'),7);h.fixed.checked=false;h.run('updateSeriesGoal()');assert.equal(h.run('manual.target'),null);assert.equal(h.el('seriesGoalProgress').hidden,true);
 assert.equal(h.el('seriesGoalRing').attrs.hidden,'');
});
test('pausing at an overdue deadline accounts for completed series before freezing',()=>{
 const h=harness();h.goal(3);h.auto.events.change();h.click('manualStart');h.setNow(3000);h.click('manualTap');
 h.setNow(10000);h.click('manualStart');assert.equal(h.run('manual.count'),3);assert.equal(h.run('manual.elapsed'),9000);
});
test('editing a target during a pause preserves the current series fill',()=>{
 const h=harness();h.goal(100);h.auto.events.change();h.click('manualStart');h.setNow(3000);h.click('manualTap');
 h.setNow(4500);h.click('manualStart');h.goal(50);assert.equal(h.el('manualTap').style['--series-progress'],'0.5');
});

test('perimeter advances within each series and stays continuous across the next count',()=>{
 const m={count:1,target:100,automatic:true,startedAt:0,interval:4000,nextAt:8000};
 assert.equal(seriesGoalProgress(m,4000),.01);assert.equal(seriesGoalProgress(m,6000),.015);
 assert.equal(seriesGoalProgress(m,8000),.02);advanceSeries(m,8000);assert.equal(seriesGoalProgress(m,8000),.02);
 assert.equal(seriesGoalProgress({...m,automatic:false},10000),.02);assert.equal(seriesGoalProgress({...m,target:null},10000),null);
});
test('100 four-second series show 06:40 total and account for the calibrated first series',()=>{
 const m={count:1,target:100,automatic:true,startedAt:0,interval:4000,nextAt:8000};
 assert.deepEqual(seriesWorkoutEstimate(m,4000),{total:400000,remaining:396000});
 assert.deepEqual(seriesWorkoutEstimate(m,6000),{total:400000,remaining:394000});
 assert.equal(seriesDurationText(400000),'06:40');assert.equal(seriesDurationText(3661000),'01:01:01');
 assert.equal(seriesWorkoutEstimate({...m,interval:null},4000),null);assert.equal(seriesWorkoutEstimate({...m,target:null},4000),null);
 assert.equal(seriesWorkoutEstimate({...m,count:100},400000).remaining,0);
});
test('continuous perimeter and duration freeze on pause, update with a target edit, and clear on reset/free',()=>{
 const h=harness();h.goal(100);h.auto.events.change();h.click('manualStart');h.setNow(4000);h.click('manualTap');
 h.setNow(6000);h.tick();assert.equal(h.el('seriesGoalStroke').style.strokeDashoffset,'98.5');
 assert.equal(h.el('seriesWorkoutTotal').textContent,'06:40');assert.match(h.el('seriesWorkoutDetails').textContent,/Restam 06:34/);
 h.click('manualStart');h.setNow(20000);h.tick();assert.equal(h.el('seriesGoalStroke').style.strokeDashoffset,'98.5');assert.equal(h.el('seriesGoalStroke').style.transition,'none');
 h.goal(50);assert.equal(h.el('seriesWorkoutTotal').textContent,'03:20');assert.equal(h.el('seriesGoalStroke').style.strokeDashoffset,'97');
 h.click('manualReset');assert.equal(h.el('seriesWorkoutTotal').textContent,'—');assert.equal(h.el('seriesGoalStroke').style.strokeDashoffset,'100');
 h.fixed.checked=false;h.run('updateSeriesGoal()');assert.equal(h.el('seriesWorkoutDuration').hidden,true);
});
test('automatic calibration leaves goal controls accessible and accepts 100 series',()=>{
 const h=harness();h.auto.events.change();h.click('manualStart');assert.equal(h.fixed.disabled,false);assert.equal(h.el('seriesGoalTarget').disabled,false);
 h.goal(100);assert.equal(h.run('manual.target'),100);assert.equal(h.run('manual.startedAt'),0);
 h.setNow(4000);h.click('manualTap');assert.equal(h.run('manual.count'),1);assert.equal(h.run('manual.interval'),4000);
});
test('finite series celebrate once on completion, while pauses and free counts do not celebrate',()=>{
 const h=harness();h.goal(2);h.click('manualTap');assert.equal(h.ctx.celebrations,undefined);
 h.setNow(1000);h.click('manualTap');assert.equal(h.ctx.celebrations.length,1);assert.match(h.ctx.celebrations[0],/^2 séries/);
 h.run('renderManual();pauseManual();renderManual()');assert.equal(h.ctx.celebrations.length,1);
 h.click('manualUndo');h.click('manualStart');h.click('manualTap');assert.equal(h.ctx.celebrations.length,2);
 const free=harness();free.click('manualTap');free.click('manualStart');assert.equal(free.ctx.celebrations,undefined);
});

test('choosing automatic only prepares the mode; calibration requires an explicit start',()=>{
 const h=harness();h.auto.events.change();
 assert.equal(h.run('manual.startedAt'),null);assert.equal(h.run('manual.timer'),null);assert.equal(h.el('manualStartLabel').textContent,'Iniciar');
 assert.equal(h.el('manualTap').disabled,true);assert.match(h.el('seriesTiming').textContent,/Medição parada/);
 h.setNow(30000);h.tick();h.click('manualTap');assert.equal(h.run('manualElapsed()'),0);assert.equal(h.run('manual.count'),0);
 h.goal(100);assert.equal(h.run('manual.startedAt'),null);
 h.click('manualStart');assert.equal(h.el('manualTap').disabled,false);assert.match(h.el('seriesTiming').textContent,/A medir/);
 h.setNow(34000);h.click('manualTap');assert.equal(h.run('manual.interval'),4000);assert.equal(h.run('manual.count'),1);
 h.click('manualStart');h.auto.events.change();assert.equal(h.run('manual.startedAt'),null);assert.equal(h.run('manual.interval'),null);
});
