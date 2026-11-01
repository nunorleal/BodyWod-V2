let counterLeadGeneration=0,counterLeadTimer=null;
function cancelCounterLeadIn(){counterLeadGeneration++;clearTimeout(counterLeadTimer);counterLeadTimer=null}
function startCounterLeadIn(begin){
 cancelCounterLeadIn();const generation=counterLeadGeneration;state.status='WORK';
 phaseBadge.textContent='Prepara-te · começa a seguir ao aviso';
 const done=()=>{
  if(generation!==counterLeadGeneration||state.status!=='WORK')return;
  cancelCounterLeadIn();begin();
 };
 if(!state.isVoiceEnabled){done();return}
 counterLeadTimer=setTimeout(()=>{window.speechSynthesis?.cancel();done()},3000);
 speak('Começa.',false,done);
}
function runWorkPhase(){startCounterLeadIn(beginCountedWork)}
