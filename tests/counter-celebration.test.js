import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {COUNTER_DOCUMENT} from '../src/counter-document.js';
function celebrationHarness(){
 const els={},calls=[],timers=new Map();let id=0;
 const el=name=>els[name]??={open:false,events:{},children:[],style:{},addEventListener(n,fn){this.events[n]=fn},replaceChildren(){this.children=[]},append(child){this.children.push(child)},showModal(){this.open=true;calls.push('open')},close(){this.open=false;this.events.close?.()}};
 const ctx={document:{getElementById:el,createElement:()=>({style:{}})},setTimeout(fn){timers.set(++id,fn);return id},clearTimeout:i=>timers.delete(i),speak:(...args)=>calls.push(['voice',...args]),playSound:(...args)=>calls.push(['sound',...args])};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/counter/celebration.js','utf8')+'\ninstallFitTempoCelebration();',ctx);
 return {ctx,el,calls,timers,run:s=>vm.runInContext(s,ctx)};
}
test('completion opens one accessible celebration and announces congratulations once',()=>{
 const h=celebrationHarness();h.run("celebrateFitTempo('100 séries · 06:40')");
 assert.equal(h.el('fittempoCelebration').open,true);assert.equal(h.el('celebrationDetails').textContent,'100 séries · 06:40');
 assert.equal(h.el('celebrationConfetti').children.length,48);assert.deepEqual(h.calls[1],['voice','Parabéns! Treino concluído.']);
 h.run("celebrateFitTempo('100 séries')");assert.equal(h.calls.filter(c=>c==='open').length,1);assert.equal(h.timers.size,4);
 for(const fn of h.timers.values())fn();assert.equal(h.calls.filter(c=>c[0]==='sound').length,4);
 h.el('celebrationClose').events.click();assert.equal(h.el('fittempoCelebration').open,false);assert.equal(h.timers.size,0);assert.equal(h.el('celebrationConfetti').children.length,0);
 h.run("celebrateFitTempo('Novo treino')");assert.equal(h.el('fittempoCelebration').open,true);
});
test('automatic workout completion calls the same celebration and preserves history',()=>{
 const celebrations=[],history=[];
 const ctx={state:{totalSets:100,totalRepsDone:1000,bpm:60},clearInterval(){},releaseWakeLock(){},phaseBadge:{setAttribute(){}},progressCircle:{setAttribute(){}},mainDisplay:{},mainSubtext:{},tempoPhaseLabel:{},setMainProgress(){},setSubProgress(){},celebrateFitTempo:s=>celebrations.push(s),saveWorkoutToHistory:s=>history.push(s),toggleUIState(){},startBtn:{},lucide:{createIcons(){}}};
 vm.createContext(ctx);const start=COUNTER_DOCUMENT.indexOf('function finishWorkout()'),end=COUNTER_DOCUMENT.indexOf('function toggleUIState(',start);
 vm.runInContext(COUNTER_DOCUMENT.slice(start,end)+'\nfinishWorkout();',ctx);
 assert.deepEqual(celebrations,['100 séries · 1000 repetições']);assert.equal(ctx.state.status,'FINISHED');assert.equal(history[0].sets,100);assert.equal(history[0].reps,1000);
});
