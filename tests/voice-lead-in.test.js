import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {CoachAudio} from '../src/audio.js';
import {SessionClock} from '../src/timer.js';
import {COUNTER_DOCUMENT} from '../src/counter-document.js';
test('narration holds preserve elapsed and active time, and user pause cannot be resumed by a late voice callback',()=>{
 let now=0;const clock=new SessionClock({duration:120,timeline:[{id:'work',start:0,end:120}]},{now:()=>now});clock.start();now=2000;clock.hold();now=9000;
 assert.equal(clock.running,true);assert.equal(clock.elapsed,2);assert.equal(clock.activeElapsed,2);
 clock.releaseHold();now=10000;assert.equal(clock.elapsed,3);clock.hold();clock.pause();now=15000;clock.releaseHold();assert.equal(clock.running,false);assert.equal(clock.elapsed,3);
 clock.resume();now=16000;assert.equal(clock.elapsed,4);assert.equal(clock.activeElapsed,4);
});
test('Crossfit first instruction and restart finish before any repetition is queued; cadence resumes without catch-up',()=>{
 const oldSynth=globalThis.speechSynthesis,oldUtterance=globalThis.SpeechSynthesisUtterance,spoken=[],bips=[];let now=0;
 globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 globalThis.speechSynthesis={getVoices:()=>[{lang:'pt-PT',localService:true}],addEventListener(){},cancel(){},resume(){},speak:u=>spoken.push(u)};
 const step={id:'work',kind:'work',duration:120,start:0,end:120,reps:56,cadence:1.5,cluster:{every:15,rest:10},round:1,sets:1,exercise:{id:'push',name:'Flexões'}};
 const plan={duration:120,timeline:[step]},clock=new SessionClock(plan,{now:()=>now});
 const audio=new CoachAudio(()=>({voice:true,voiceMode:'full',voiceVolume:1}),()=>{},()=>{clock.hold();return()=>clock.releaseHold()});audio.beep=t=>bips.push(t);
 try{
 clock.start();audio.cue(clock.tick(),plan);assert.equal(audio.narrationPending,true);now=10000;audio.cue(clock.tick(),plan);assert.equal(clock.elapsed,0);assert.equal(spoken.length,1);
 spoken[0].onend();for(now=10000;now<=48500;now+=50)audio.cue(clock.tick(),plan);
 assert.equal(clock.elapsed,38.5);assert.equal(spoken.at(-1).text,'Começa.');assert.equal(audio.narrationPending,true);assert.equal(bips.filter(t=>t==='rep').length,15);
 now=53000;audio.cue(clock.tick(),plan);assert.equal(clock.elapsed,38.5);assert.equal(bips.filter(t=>t==='rep').length,15);
 spoken.at(-1).onend();audio.cue(clock.tick(),plan);assert.equal(spoken.at(-1).text,'dezasseis');assert.equal(bips.filter(t=>t==='rep').length,16);
 now=54000;audio.cue(clock.tick(),plan);assert.equal(bips.filter(t=>t==='rep').length,16);
 now=54500;audio.cue(clock.tick(),plan);assert.equal(spoken.at(-1).text,'dezassete');assert.equal(bips.filter(t=>t==='rep').length,17);
 }finally{audio.stop();if(oldSynth===undefined)delete globalThis.speechSynthesis;else globalThis.speechSynthesis=oldSynth;if(oldUtterance===undefined)delete globalThis.SpeechSynthesisUtterance;else globalThis.SpeechSynthesisUtterance=oldUtterance}
});
test('FitTempo begins counting only on voice completion and cancels a pending start on pause',()=>{
 const callbacks=[],timers=new Map();let id=0,starts=0;
 const ctx={state:{status:'IDLE',isVoiceEnabled:true},phaseBadge:{},setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:i=>timers.delete(i),speak:(text,force,done)=>{assert.equal(text,'Começa.');callbacks.push(done)},beginCountedWork:()=>starts++};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/counter/lead-in.js','utf8'),ctx);
 vm.runInContext('runWorkPhase()',ctx);assert.equal(starts,0);callbacks[0]();assert.equal(starts,1);callbacks[0]();assert.equal(starts,1);
 vm.runInContext('runWorkPhase();cancelCounterLeadIn();state.status="PAUSED"',ctx);callbacks[1]();assert.equal(starts,1);
 ctx.state.isVoiceEnabled=false;vm.runInContext('runWorkPhase()',ctx);assert.equal(starts,2);
});
test('FitTempo without a Portuguese voice proceeds immediately instead of waiting for a speech event',()=>{
 const start=COUNTER_DOCUMENT.indexOf('function speak(text,'),end=COUNTER_DOCUMENT.indexOf('// Manter Ecrã',start);let finished=0;
 const ctx={state:{isVoiceEnabled:true},speechTimer:null,clearTimeout(){},window:{speechSynthesis:{}},guideVoice:null,loadGuideVoice(){},console};
 vm.createContext(ctx);vm.runInContext(COUNTER_DOCUMENT.slice(start,end),ctx);ctx.done=()=>finished++;vm.runInContext('speak("Começa.",false,done)',ctx);assert.equal(finished,1);
});
