// Shared visuals for completed workouts; rehearsal tests never call this.
export function fillWorkoutCelebration(confetti){
 confetti.replaceChildren();
 const colors=['#facc15','#fff3b0','#60a5fa','#e0f2fe','#f59e0b'];
 for(let i=0;i<48;i++){
  const piece=document.createElement('i');piece.style.cssText=`--x:${(i*37)%100}%;--delay:${(i%12)*.08}s;--drift:${(i%7-3)*24}px;--turn:${180+i*41}deg;--color:${colors[i%5]}`;confetti.append(piece);
 }
 for(let burst=0;burst<3;burst++)for(let ray=0;ray<16;ray++){
  const piece=document.createElement('i'),angle=ray*Math.PI/8;
  piece.className='celebration-firework';
  piece.style.cssText=`--x:${[22,76,50][burst]}%;--y:${[24,32,16][burst]}%;--delay:${burst*.65}s;--dx:${Math.cos(angle)*110}px;--dy:${Math.sin(angle)*110}px;--color:${colors[(ray+burst)%5]}`;confetti.append(piece);
 }
}
export function createWorkoutCelebration(){
 const dialog=document.getElementById('fittempoCelebration'),confetti=document.getElementById('celebrationConfetti');
 document.getElementById('celebrationClose').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>confetti.replaceChildren());
 return details=>{if(dialog.open)return;document.getElementById('celebrationDetails').textContent=details;fillWorkoutCelebration(confetti);dialog.showModal()};
}
