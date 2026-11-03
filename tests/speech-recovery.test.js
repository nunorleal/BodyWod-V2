import test from 'node:test';
import assert from 'node:assert/strict';
import {CoachAudio,repetitionAt} from '../src/audio.js';
import {SessionClock} from '../src/timer.js';
import {prepareSessionPlan} from '../src/pace.js';
function harness(run){
 const keys=['speechSynthesis','SpeechSynthesisUtterance','setTimeout','clearTimeout','setInterval','clearInterval'],old=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const timers=new Map(),polls=new Map(),spoken=[];let id=0,cancels=0;
 globalThis.setTimeout=(fn,ms)=>{timers.set(++id,{fn,ms});return id};globalThis.clearTimeout=n=>timers.delete(n);
 globalThis.setInterval=fn=>{polls.set(++id,fn);return id};globalThis.clearInterval=n=>polls.delete(n);
 globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 globalThis.speechSynthesis={speaking:false,pending:false,getVoices:()=>[{lang:'pt-PT',localService:true}],addEventListener(){},resume(){},cancel(){cancels++},speak:u=>spoken.push(u)};
 const step={id:'w',start:0,end:40,duration:40,kind:'work',reps:10,cadence:2,round:1,sets:1,exercise:{id:'push',name:'Flexões clássicas'}};
 let now=0;const plan=prepareSessionPlan({duration:40,timeline:[step]}),clock=new SessionClock(plan,{now:()=>now});
 const coach=new CoachAudio(()=>({voice:true,voiceMode:'full',voiceVolume:1}),()=>{},()=>{clock.hold();return()=>clock.releaseHold()});coach.beep=()=>{};
 try{run({coach,clock,plan,spoken,timers,polls,now:v=>now=v,cancels:()=>cancels})}finally{coach.stop();for(const k of keys)if(old[k]===undefined)delete globalThis[k];else globalThis[k]=old[k]}
}
test('missing speech start never blocks a workout for fifteen seconds and late callbacks are harmless',()=>harness(({coach,clock,plan,spoken,timers,now})=>{
 clock.start();coach.cue(clock.tick(),plan);assert.equal(clock.held,true);assert.match(spoken[0].text,/Começa\.$/);assert.equal(coach.utterances.has(spoken[0]),true);
 const startWatchdog=[...timers.values()].find(t=>t.ms===1200);assert.ok(startWatchdog);now(1200);startWatchdog.fn();assert.equal(clock.held,false);
 now(2200);assert.equal(clock.elapsed,1);spoken[0].onend();assert.equal(clock.elapsed,1);assert.equal(coach.utterances.size,0);
}));
test('missing speech end releases on native idle and all ten counts continue at the scheduled cadence',()=>harness(({coach,clock,plan,spoken,polls,now,cancels})=>{
 clock.start();coach.cue(clock.tick(),plan);spoken[0].onstart();now(1000);for(const poll of [...polls.values()])poll();assert.equal(clock.held,false);assert.equal(clock.elapsed,0);
 for(let i=1;i<=10;i++){now(1000+plan.timeline[0].repTimes[i-1]*1000);coach.cue(clock.tick(),plan);const u=spoken.at(-1);assert.equal(coach.lastRep,i);assert.equal(coach.utterances.has(u),true);u.onstart();u.onend();}
 assert.equal(spoken.length,11);assert.equal(cancels(),1);assert.equal(coach.utterances.size,0);
}));
test('session preparation starts at zero, removes silent lead-in, and preserves duration, cadence and recovery progress',()=>{
 const step={id:'w',start:0,end:120,duration:120,kind:'work',reps:30,cadence:2,cluster:{every:15,rest:10}};
 const original={duration:120,timeline:[step]},plan=prepareSessionPlan(original);
 assert.equal(repetitionAt(plan.timeline[0],0),0);assert.equal(repetitionAt(plan.timeline[0],2),1);assert.equal(repetitionAt(plan.timeline[0],4),2);assert.equal(plan.timeline[0].repTimes[15],42);assert.equal(plan.duration,120);
 assert.deepEqual(prepareSessionPlan(plan),plan);assert.deepEqual(prepareSessionPlan(original,{elapsed:8}),original);assert.equal(original.timeline[0].repTimes,undefined);
});

test('FitTempo keeps the utterance alive and releases a stalled start exactly once',async()=>{
 const fs=await import('node:fs'),vm=await import('node:vm');
 const timers=new Map(),polls=new Map(),spoken=[];let id=0,starts=0;
 const synth={getVoices:()=>[],cancel(){},resume(){},speaking:false,pending:false,speak:u=>spoken.push(u)};
 const ctx={state:{isVoiceEnabled:true},speechTimer:null,guideVoice:{lang:'pt-PT'},loadGuideVoice(){},window:{speechSynthesis:synth},SpeechSynthesisUtterance:class{constructor(text){this.text=text}},setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id},clearTimeout:n=>timers.delete(n),setInterval:fn=>{polls.set(++id,fn);return id},clearInterval:n=>polls.delete(n),console,after:()=>starts++};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/counter/speech.js','utf8'),ctx);
 vm.runInContext('speak("Começa.",false,after)',ctx);assert.equal(ctx.speak.current.utterance,spoken[0]);assert.equal(starts,0);
 [...timers.values()].find(t=>t.ms===1200).fn();assert.equal(starts,1);spoken[0].onend();assert.equal(starts,1);assert.equal(ctx.speak.current,null);
 vm.runInContext('speak("Começa.",false,after)',ctx);spoken[1].onstart();for(const poll of [...polls.values()])poll();assert.equal(starts,2);spoken[1].onend();assert.equal(starts,2);
});

test('sequence voice continuations run once after native completion or the missing-start fallback',()=>harness(({coach,spoken,timers})=>{
 let continuations=0;coach.speak('Começa.',{after:()=>continuations++});assert.equal(continuations,0);spoken[0].onend();spoken[0].onend();assert.equal(continuations,1);
 coach.speak('Série dois. Começa.',{after:()=>continuations++});[...timers.values()].find(t=>t.ms===1200).fn();assert.equal(continuations,2);spoken[1].onend();assert.equal(continuations,2);
}));

// Safari can start speaking while omitting the native start notification.
test('an audible confirmation survives the startup watchdog when Safari omits onstart',()=>harness(({coach,spoken,timers,cancels})=>{
 let completed=0;
 coach.speak('Teste concluído. Confirma se a velocidade está ajustada.',{after:()=>completed++});
 const utterance=spoken.at(-1),before=cancels();
 globalThis.speechSynthesis.speaking=true;
 [...timers.values()].find(t=>t.ms===1200).fn();
 assert.equal(cancels(),before,'the recovery timer must not cancel an audible phrase');
 assert.equal(completed,0);
 assert.equal(coach.utterances.has(utterance),true);
 assert.equal(coach.lastSpoken,'Teste concluído. Confirma se a velocidade está ajustada.');
 assert.ok([...timers.values()].some(t=>t.ms>4000));
 utterance.onstart(); // A delayed notification must not restart or double-count it.
 assert.equal(coach.spokenCount,1);
 utterance.onend();utterance.onend();assert.equal(completed,1);
 assert.equal(coach.utterances.size,0);
}));

test('result speech is never canceled by recovery timers or a false idle between sentences',()=>harness(({coach,spoken,timers,polls,cancels})=>{
 coach.speak('três',{after:()=>coach.speak('Teste concluído. Confirma se a velocidade está ajustada.',{priority:'notification'})});
 const lastCount=spoken[0];lastCount.onstart();lastCount.onend();
 const result=spoken[1],before=cancels();
 assert.match(result.text,/Confirma/);assert.equal(before,1,'no native cancellation during the handoff');
 // Native start can be absent and native state can falsely report idle.
 for(const poll of [...polls.values()])poll();
 assert.equal(coach.utterances.has(result),true);
 assert.ok([...timers.values()].every(t=>t.ms===60000));
 result.onstart();
 for(const poll of [...polls.values()])poll();
 assert.equal(coach.utterances.has(result),true);
 for(const timer of [...timers.values()])timer.fn();
 assert.equal(cancels(),before,'even fallback cleanup must not cancel the audible result');
 result.onend();assert.equal(coach.utterances.size,0);
}));
test('replacing or stopping a pending count cannot run a stale completion callback',()=>harness(({coach,spoken})=>{
 let advanced=0;coach.speak('três',{after:()=>advanced++});
 const oldCount=spoken[0];coach.speak('Teste concluído.',{priority:'notification'});
 oldCount.onend();assert.equal(advanced,0);assert.equal(coach.utterances.size,1);
 coach.stop();assert.equal(advanced,0);assert.equal(coach.utterances.size,0);
}));
test('a speech watchdog finishes cancellation before its continuation starts a result message',()=>harness(({coach,spoken,timers,cancels})=>{
 // Some engines synchronously dispatch onend from cancel().
 const nativeCancel=globalThis.speechSynthesis.cancel;
 globalThis.speechSynthesis.cancel=()=>{nativeCancel();spoken.at(-1)?.onend?.()};
 coach.speak('três',{after:()=>coach.speak('Teste concluído. Confirma a velocidade.',{priority:'notification'})});
 [...timers.values()].find(t=>t.ms===1200).fn();
 assert.equal(spoken.length,2);assert.equal(cancels(),2);
 assert.equal(coach.utterances.has(spoken[1]),true);
}));

test('the start cue starts the sequence clock on native voice start, without waiting for voice end',()=>harness(({coach,spoken,clock,now})=>{
 clock.start();clock.hold();let starts=0;
 const begin=()=>{starts++;clock.releaseHold()};
 coach.speak('Começa.',{onStart:begin});
 now(4000);assert.equal(clock.elapsed,0);
 spoken[0].onstart();assert.equal(starts,1);assert.equal(clock.elapsed,0);
 now(4250);assert.equal(clock.elapsed,.25,'clock runs while the start cue is still speaking');
 spoken[0].onstart();assert.equal(starts,1);spoken[0].onend();assert.equal(starts,1);
}));

test('an initially empty native voice list still requests Portuguese speech and picks up voices on the next cue',()=>harness(({coach,spoken})=>{
 globalThis.speechSynthesis.getVoices=()=>[];
 assert.equal(coach.speak('Começa.'),true);
 assert.equal(spoken[0].lang,'pt-PT');assert.equal(spoken[0].voice,undefined);
 spoken[0].onstart();spoken[0].onend();
 const portuguese={name:'Joana',voiceURI:'joana',lang:'pt-PT',localService:true};
 globalThis.speechSynthesis.getVoices=()=>[portuguese];
 assert.equal(coach.speak('um',{priority:'count'}),true);
 assert.equal(spoken[1].voice,portuguese);
}));
