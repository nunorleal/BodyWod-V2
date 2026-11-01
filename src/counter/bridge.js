// Pause without resetting when BodyWOD hides the tab or the device backgrounds it.
function pauseIntegratedCounter(){
 if(typeof cancelCounterLeadIn==='function')cancelCounterLeadIn();
 if(typeof closeFitTempoCelebration==='function')closeFitTempoCelebration();
 if(!['IDLE','PAUSED','FINISHED'].includes(state.status))pauseWorkout();
 pauseManual();clearTimeout(speechTimer);window.speechSynthesis?.cancel();releaseWakeLock();
 if(audioCtx?.state==='running')audioCtx.suspend().catch(()=>{});
}
function sendCounterSettings(){parent.postMessage?.({type:'bodywod-counter-settings',voice:state.isVoiceEnabled,beeps:state.isSoundEnabled},'*')}
window.addEventListener('message',event=>{
 if(event.source!==parent||event.data?.type!=='bodywod-counter')return;
 const {action,settings}=event.data;
 if(action==='pause')pauseIntegratedCounter();
 else if(action==='get-settings')sendCounterSettings();
 else if(action==='settings'){
  if(typeof settings?.voice==='boolean')state.isVoiceEnabled=settings.voice;
  if(typeof settings?.beeps==='boolean')state.isSoundEnabled=settings.beeps;
  voiceIcon.setAttribute('class',state.isVoiceEnabled?'w-4 h-4 text-purple-400':'w-4 h-4 text-slate-500');
  soundIcon.setAttribute('data-lucide',state.isSoundEnabled?'volume-2':'volume-x');
  soundIcon.setAttribute('class',state.isSoundEnabled?'w-4 h-4 text-emerald-400':'w-4 h-4 text-slate-500');
  lucide.createIcons();
  if(!state.isVoiceEnabled){clearTimeout(speechTimer);window.speechSynthesis?.cancel()}
  sendCounterSettings();
 }else if(action==='history')document.getElementById('historyModalBtn').click();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseIntegratedCounter()});
window.addEventListener('pagehide',pauseIntegratedCounter);

const counterLabels={inputTotalReps:'Meta de repetições',inputRepsPerSet:'Repetições por série',inputBpm:'Ritmo em BPM',inputSecPerRep:'Segundos por repetição',inputCountIn:'Preparação em segundos',inputRestTime:'Descanso entre séries',tempoEccentric:'Fase excêntrica em segundos',tempoPause1:'Pausa inferior em segundos',tempoConcentric:'Fase concêntrica em segundos',tempoPause2:'Pausa superior em segundos'};
for(const [id,label] of Object.entries(counterLabels))document.getElementById(id)?.setAttribute('aria-label',label);

sendCounterSettings();
document.getElementById('closeHistoryBtn')?.setAttribute('aria-label','Fechar histórico');
