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
 const confetti=document.getElementById('celebrationConfetti');confetti.replaceChildren();
 for(let i=0;i<48;i++){
  const piece=document.createElement('i');
  piece.className=i<12?'celebration-sparkle':'';
  piece.style.cssText=`--x:${(i*37)%100}%;--y:${8+(i*29)%82}%;--delay:${(i%12)*.08}s;--drift:${(i%7-3)*24}px;--turn:${180+i*41}deg;--color:${['#facc15','#fff3b0','#60a5fa','#e0f2fe','#f59e0b'][i%5]}`;
  confetti.append(piece);
 }
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
