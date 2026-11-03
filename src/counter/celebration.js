let celebrationSoundTimers=[];
function closeFitTempoCelebration(){
 const dialog=document.getElementById('fittempoCelebration');
 if(dialog?.open)dialog.close();
 celebrationSoundTimers.forEach(clearTimeout);celebrationSoundTimers=[];
}
function celebrateFitTempo(details){
 const dialog=document.getElementById('fittempoCelebration');
 if(!dialog||dialog.open)return;
 document.getElementById('celebrationDetails').textContent=details;
 fillWorkoutCelebration(document.getElementById('celebrationConfetti'));
 dialog.showModal();
 [523.25,659.25,783.99,1046.5].forEach((frequency,i)=>{
  celebrationSoundTimers.push(setTimeout(()=>playSound(frequency,'triangle',i===3?.4:.15),i*150));
 });
 speak('Parabéns! Treino concluído.');
}
function installFitTempoCelebration(){
 const dialog=document.getElementById('fittempoCelebration');
 document.getElementById('celebrationClose').addEventListener('click',closeFitTempoCelebration);
 dialog.addEventListener('close',()=>{
  celebrationSoundTimers.forEach(clearTimeout);celebrationSoundTimers=[];
  document.getElementById('celebrationConfetti').replaceChildren();
 });
}
