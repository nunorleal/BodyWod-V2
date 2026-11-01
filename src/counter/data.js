const fitTempoInputIds=['automaticGoalMode','inputSeriesGoal','inputTotalReps','inputRepsPerSet','inputBpm','inputSecPerRep','inputCountIn','inputRestTime','tempoEccentric','tempoPause1','tempoConcentric','tempoPause2'];
function fitTempoSnapshot(){
 const {timer,subTimer,wakeLock,...automatic}=state;
 return {automatic:structuredClone(automatic),history:structuredClone(getHistory()),settings:{voice:state.isVoiceEnabled,beeps:state.isSoundEnabled},inputs:Object.fromEntries(fitTempoInputIds.map(id=>[id,document.getElementById(id).value])),manual:{count:manual.count,target:manual.target,elapsed:manualElapsed(),automatic:manual.automatic,calibrationStart:manual.calibrationStart,interval:manual.interval,nextAt:manual.nextAt,id:manual.id||null}};
}
function publishCounterData(){parent.postMessage({type:'bodywod-counter-data-changed',data:fitTempoSnapshot()},'*')}
function restoreFitTempoSnapshot(data){
 pauseIntegratedCounter();
 integratedHistory=structuredClone(data.history||[]);
 try{localStorage.setItem('fittempo_history',JSON.stringify(integratedHistory));integratedReadFailed=false}catch{document.getElementById('integration-notice').textContent='Dados importados em memória; a gravação do FitTempo está bloqueada.'}
 for(const id of fitTempoInputIds)if(typeof data.inputs?.[id]==='string')document.getElementById(id).value=data.inputs[id];
 if(data.settings){state.isVoiceEnabled=data.settings.voice!==false;state.isSoundEnabled=data.settings.beeps!==false;sendCounterSettings()}
 if(state.status==='IDLE'){updateCadenceValues();updateCalculations()}
 if(data.manual){for(const key of ['count','target','elapsed','automatic','calibrationStart','interval','nextAt','id'])manual[key]=data.manual[key]??(key==='target'||key==='interval'||key==='nextAt'||key==='id'?null:0);manual.startedAt=null;manual.timer=null;
 document.querySelectorAll('[name="seriesMode"]').forEach(input=>input.checked=input.value===(manual.automatic?'auto':'manual'));
 document.querySelector('[name="seriesGoalMode"][value="fixed"]').checked=manual.target!==null;
 document.querySelector('[name="seriesGoalMode"][value="free"]').checked=manual.target===null;
 document.getElementById('seriesGoalTarget').value=manual.target||100;document.getElementById('seriesGoalTarget').parentElement.hidden=manual.target===null;renderManual();lucide.createIcons();}
 if(data.automatic&&data.automatic.status!=='IDLE'){
 const source=data.automatic;
 for(const key of ['totalRepsGoal','repsPerSet','bpm','secPerRep','countInSec','restSec','currentSet','totalSets','currentRepInSet','totalRepsDone','countInRemaining','restSecondsRemaining','cadence'])if(source[key]!==undefined)state[key]=structuredClone(source[key]);
 state.status=source.status==='FINISHED'?'FINISHED':'PAUSED';state.previousStatus=source.status==='PAUSED'?source.previousStatus:source.status;
 if(state.status==='PAUSED'){
 toggleUIState(true);startBtn.classList.remove('hidden');pauseBtn.classList.add('hidden');startBtn.textContent='RETOMAR TREINO';phaseBadge.textContent='Treino recuperado em pausa';
 }else{toggleUIState(false);phaseBadge.textContent='Treino concluído';startBtn.textContent='NOVO TREINO'}
 mainDisplay.textContent=state.totalRepsDone;mainSubtext.textContent='Repetições concluídas';statSets.textContent=`${state.currentSet} / ${state.totalSets}`;statReps.textContent=state.totalRepsDone;
 }
 renderHistoryModal();
}
function recordManualCompletion(){
 manual.id??=globalThis.crypto?.randomUUID?.()||String(Date.now()+Math.random());
 const record={id:manual.id,date:new Date().toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),reps:0,sets:manual.count,tempo:manual.interval?`${Number((manual.interval/1000).toFixed(2))} s/série`:'Séries por toque',seconds:manual.elapsed/1000,mode:'series'};
 const existing=getHistory().findIndex(item=>item.id===manual.id);if(existing>=0)getHistory().splice(existing,1);
 saveWorkoutToHistory(record);
}
function escapeFitTempoText(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
window.addEventListener('message',event=>{
 if(event.source!==parent)return;
 if(event.data?.type==='bodywod-counter'&&['pause','settings'].includes(event.data.action)){queueCounterData();return}
 if(event.data?.type!=='bodywod-counter-data')return;
 if(event.data.action==='get')parent.postMessage({type:'bodywod-counter-backup',requestId:event.data.requestId,data:fitTempoSnapshot()},'*');
 if(event.data.action==='restore')restoreFitTempoSnapshot(event.data.data);
});
let counterDataTimer;
function queueCounterData(){clearTimeout(counterDataTimer);counterDataTimer=setTimeout(publishCounterData,0)}
document.addEventListener('change',queueCounterData);document.addEventListener('input',queueCounterData);document.addEventListener('click',queueCounterData);
parent.postMessage({type:'bodywod-counter-data-ready',data:fitTempoSnapshot()},'*');

document.addEventListener('visibilitychange',()=>{if(document.hidden)publishCounterData()});
window.addEventListener('pagehide',publishCounterData);

function resumeImportedWork(){
 if(state.totalRepsDone>=state.totalRepsGoal){finishWorkout();return}
 if(state.currentRepInSet>=state.repsPerSet){state.currentSet++;runRestPhase();return}
 startCounterLeadIn(()=>{state.status='WORK';phaseBadge.textContent=`Série ${state.currentSet} de ${state.totalSets} • Em Exercício`;
 executeNextRep(Math.min(state.repsPerSet,state.currentRepInSet+state.totalRepsGoal-state.totalRepsDone));});
}
