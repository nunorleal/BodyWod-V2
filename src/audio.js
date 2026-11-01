import {clusterRepTime,clusterPause} from './training.js';
// The same repetition schedule drives the visible counter and the spoken/bip cues.
export function repetitionTiming(step){
 const count=Number(step.reps)||0;if(!count||step.kind==='rest'||step.kind==='transition')return null;
 const start=step.repTimes?.[0]??Math.min(6,Math.max(0,step.duration-2));
 return {count,start,interval:step.repTimes?step.cadence:step.cluster?step.cadence:count>1?Math.max(step.cadence||.5,(step.duration-start-(step.cadence||2))/(count-1)):0};
}
export function repetitionAt(step,elapsed){if(step.repTimes)return step.repTimes.filter(at=>elapsed+1e-6>=at).length;if(step.cluster&&step.kind==='work'){let count=0;while(count<step.reps&&elapsed+1e-6>=clusterRepTime(count,step))count++;return count}const t=repetitionTiming(step);if(!t||elapsed+1e-6<t.start)return 0;return t.count===1?1:Math.min(t.count,Math.floor((elapsed-t.start+1e-6)/t.interval)+1)}
const countWords=['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','catorze','quinze','dezasseis','dezassete','dezoito','dezanove'];
export function spokenNumber(n){if(n<20)return countWords[n]??String(n);const tens={20:'vinte',30:'trinta',40:'quarenta',50:'cinquenta',60:'sessenta'};const base=Math.floor(n/10)*10;return tens[base]?tens[base]+(n%10?' e '+countWords[n%10]:''):String(n)}
// Pronunciation hints belong only to the speech engine, not exercise names or UI.
export function speechPronunciation(text){return text.replace(/flexões/gi,word=>word.replace(/e/i,letter=>letter==='E'?'É':'é'))}
export class CoachAudio {
 constructor(getPreferences,onStatus=()=>{},onNarration=()=>{}){this.onNarration=onNarration;this.preferences=getPreferences;this.onStatus=onStatus;this.context=null;this.voices=[];this.activeNodes=new Set();this.utterances=new Set();this.lastInstruction='';this.lastSpoken='';this.error='';this.speechError='';this.beepCount=0;this.spokenCount=0;this.resetCue();this.refreshVoices();globalThis.speechSynthesis?.addEventListener('voiceschanged',()=>this.refreshVoices())}
 notify(){this.onStatus(this.status)}
 get status(){return {context:this.context?.state||'not-started',voice:this.voice?.name||'',voiceAvailable:!!this.voice,beepCount:this.beepCount,spokenCount:this.spokenCount,lastInstruction:this.lastInstruction,lastSpoken:this.lastSpoken,error:this.error||this.speechError}}
 refreshVoices(){this.voices=(globalThis.speechSynthesis?.getVoices()||[]).filter(v=>v.lang.toLowerCase().replaceAll('_','-')==='pt-pt');this.notify()}
 get voice(){const p=this.preferences();return this.voices.find(v=>v.voiceURI===p.voiceURI)||this.voices.find(v=>v.localService)||this.voices[0]}
 resetCue(){this.stepKey=null;this.lastSecond=null;this.lastRep=0;this.lastElapsed=-1;this.switchedSide=false;this.clusterRest=null}
 async unlock(){
 this.error='';const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
 try{if(!Audio)throw Error('Este navegador não disponibiliza áudio para os bips.');if(!this.context||this.context.state==='closed'){this.context=new Audio();this.context.addEventListener?.('statechange',()=>this.notify())}await this.context.resume();if(this.context.state!=='running')this.error='Som bloqueado pelo navegador. Toca em «Testar som» para o ativar.';globalThis.speechSynthesis?.resume?.()}catch(err){this.error=err.message||'Não foi possível ativar o áudio.'}
 this.refreshVoices();return this.context?.state==='running';
 }
 stop(){for(const u of [...this.utterances])u.finish?.(false);this.endNarration?.();globalThis.speechSynthesis?.cancel();for(const node of this.activeNodes){try{node.stop();node.disconnect()}catch{}}this.activeNodes.clear();if(this.context?.state==='running')this.context.suspend().catch(()=>{});this.notify()}
 speak(text,{priority='instruction',hold=false,after=null,onStart=null}={}){
 const p=this.preferences();if(!p.voice||!this.voice||!globalThis.SpeechSynthesisUtterance)return false;
 const synth=globalThis.speechSynthesis;
 try{
 // Keep native utterances alive until completion, and never accumulate stale counts.
 const notification=priority==='notification';
 const replace=notification?this.utterances.size>0:priority!=='count'||this.utterances.size>0;
 for(const u of [...this.utterances])u.finish?.(false);
 if(replace)synth.cancel();synth.resume?.();
 const u=new SpeechSynthesisUtterance(speechPronunciation(text));u.lang='pt-PT';u.voice=this.voice;u.volume=Number(p.voiceVolume);u.rate=priority==='count'?1.08:1.1;
 this.utterances.add(u);
 const release=hold?(this.onNarration()||(()=>{})):(()=>{});if(hold)this.narrationPending=true;
 let done=false,started=false,timer,poll;
 const finish=(continueSpeech=true,beforeAfter=null)=>{if(done)return;done=true;clearTimeout(timer);clearInterval(poll);this.utterances.delete(u);if(hold){this.narrationPending=false;if(this.endNarration===finish)this.endNarration=null;release()}beforeAfter?.();if(continueSpeech)after?.()};
 u.finish=finish;if(hold)this.endNarration=finish;
 const speechBudget=Math.max(1800,Math.min(30000,text.split(/\s+/).length*550+1000));
 const arm=ms=>{clearTimeout(timer);timer=setTimeout(()=>{if(done)return;finish(true,()=>synth.cancel())},ms);timer.unref?.()};
 const markStarted=()=>{if(done||started)return;started=true;this.lastSpoken=text;this.spokenCount++;this.speechError='';arm(speechBudget);onStart?.();this.notify()};
 u.onend=()=>finish();
 u.onstart=markStarted;
 u.onerror=event=>{finish(!['canceled','interrupted'].includes(event.error));if(!['canceled','interrupted'].includes(event.error)){this.speechError='A voz foi interrompida pelo navegador. Testa o som para a reativar.';this.notify()}};
 if(notification){
 // A result announcement does not gate a clock. Keep it alive until native end,
 // even when Safari reports idle or omits onstart between sentence fragments.
 // The cleanup fallback drops references only; it never cancels native speech.
 u.onstart=()=>{if(done||started)return;started=true;this.lastSpoken=text;this.spokenCount++;this.speechError='';onStart?.();this.notify()};
 timer=setTimeout(()=>finish(),60000);timer.unref?.();
 }else{
 // Safari can omit end/error events: release as soon as the native engine is idle.
 poll=setInterval(()=>{if(started&&synth.speaking===false&&synth.pending===false)finish()},100);poll.unref?.();
 timer=setTimeout(()=>{if(done)return;if(synth.speaking===true){markStarted();return}finish(true,()=>synth.cancel())},1200);timer.unref?.();
 }
 synth.speak(u);if(priority!=='count')this.lastInstruction=text;this.notify();return true;
 }catch{for(const u of [...this.utterances])u.finish?.(false);this.speechError='Não foi possível reproduzir a voz pt-PT.';this.notify();return false}
 }
 beep(type='tick'){
 const p=this.preferences();if(!p.beeps||Number(p.beepVolume)<=0)return false;
 if(!this.context||this.context.state!=='running'){this.error='Bips em pausa ou bloqueados. Toca em «Testar som» para os ativar.';this.notify();return false}
 const notes={tick:[[760,.09]],rep:[[620,.075]],start:[[980,.32]],rest:[[440,.15],[330,.2]],end:[[660,.12],[880,.2]],block:[[520,.12],[780,.12],[1040,.22]],finish:[[660,.15],[830,.15],[990,.45]]}[type]||[[760,.09]];
 try{let at=this.context.currentTime;for(const [f,d] of notes){const o=this.context.createOscillator(),g=this.context.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(Math.min(.7,Number(p.beepVolume)*.65),at+.01);g.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(g);g.connect(this.context.destination);this.activeNodes.add(o);o.onended=()=>{this.activeNodes.delete(o);o.disconnect();g.disconnect?.()};o.start(at);o.stop(at+d+.015);at+=d+.08}this.beepCount++;this.error='';this.notify();return true}catch{this.error='Não foi possível reproduzir o bip. Testa o som.';this.notify();return false}
 }
 announceStep(snap,plan){const {step}=snap,pause=clusterPause(step,step.duration-snap.remaining);if(pause){this.beep('rest');this.speak(`Pausa. Faltam ${spokenNumber(Math.ceil(pause.remaining))} segundos.`);return}const next=plan.timeline.slice(snap.index+1).find(s=>s.exercise&&s.kind!=='rest');
 if(step.kind==='rest'){this.beep('rest');this.speak(`Descansa ${spokenNumber(Math.ceil(snap.remaining))} segundos.${next?.exercise?' A seguir: '+next.exercise.name+'.':''}`)}
 else if(step.kind==='amrap'){this.beep('block');const b=plan.blocks?.find(b=>b.id===step.blockId),item=b?.items[(snap.amrapIndex||0)%b.items.length];this.speak(item?`AMRAP. ${item.exercise.name}. ${item.reps?spokenNumber(item.reps)+' repetições.':'Mantém a posição indicada.'} Ao teu ritmo. Confirma quando terminares.`:'AMRAP. Repete o circuito ao teu ritmo. Confirma cada exercício no ecrã.')}
 else if(step.exercise){this.beep(step.round===1?'block':'start');const series=step.sets>1?` Série ${spokenNumber(step.round)} de ${spokenNumber(step.sets)}.`:'';this.speak(`${step.exercise.name}.${series}${step.reps?' '+spokenNumber(step.reps)+' repetições. Começa.':' Começa.'}`,{hold:true})}
 else{this.beep('end');this.speak('Recupera e prepara-te para o próximo bloco.')}
 }
 cue(snap,plan){
 if(!snap.running||snap.finished||this.narrationPending)return;
 const p=this.preferences(),{step,remaining}=snap,elapsed=Math.max(0,step.duration-remaining);
 const key=[step.id,step.exercise?.id||'',step.round,step.kind,step.kind==='amrap'?snap.amrapIndex||0:''].join(':');
 const entered=key!==this.stepKey||elapsed<this.lastElapsed-.05;
 if(entered){this.stepKey=key;this.lastSecond=null;this.lastRep=repetitionAt(step,elapsed);this.switchedSide=false;this.lastElapsed=elapsed;this.clusterRest=clusterPause(step,elapsed)?.group||null;this.announceStep(snap,plan);return}
 this.lastElapsed=elapsed;
 const pause=clusterPause(step,elapsed),group=pause?.group||null;
 if(group!==this.clusterRest){
  const wasRest=this.clusterRest;this.clusterRest=group;
  if(pause){this.beep('rest');this.speak(`Pausa de ${spokenNumber(step.cluster.rest)} segundos.`)}
  else if(wasRest){this.speak('Começa.',{hold:true});if(this.narrationPending)return}
 }
 if(pause)return;
 const rep=repetitionAt(step,elapsed);let repCue=false;
 if(rep>this.lastRep){this.lastRep=rep;this.beep('rep');repCue=true;if(p.voiceMode==='full')this.speak(spokenNumber(rep),{priority:'count'});else if(p.voiceMode==='partial'&&(rep%5===0||rep===step.reps))this.speak(spokenNumber(rep),{priority:'count'})}
 const second=Math.ceil(remaining),secondChanged=second!==this.lastSecond;this.lastSecond=second;if(!secondChanged)return;
 if(second<=5&&second>0){if(!repCue&&!step.reps)this.beep('tick');if(second===5&&!step.reps&&p.voiceMode!=='instructions')this.speak('Faltam cinco segundos.');return}
 if(step.kind==='rest'||step.kind==='transition'){if(p.advanceWarning&&second===10){const next=plan.timeline.slice(snap.index+1).find(s=>s.exercise&&s.kind!=='rest');this.speak(`Prepara-te. ${next?.exercise?.name||'Vamos começar.'}`)}return}
 if(step.exercise?.unilateral&&!this.switchedSide&&elapsed>=step.duration/2){this.switchedSide=true;if(step.reps)this.speak('Troca de lado.',{priority:'count'});else this.speak('Troca de lado.')}
 }
}
