// Pointer events work for mouse, pen and touch without relying on native HTML dragging.
export function installSequenceReordering(root,onMove){
 let drag=null,scrollFrame=null;
 const handles='[data-sequence-drag]',rows='details.sequence-item';
 function clearTarget(){drag?.target?.classList.remove('sequence-drop-before','sequence-drop-after')}
 function locate(){
  if(!drag?.started)return;clearTarget();
  const candidates=[...drag.phase.querySelectorAll(rows)].filter(row=>row!==drag.row);
  let target=null,after=false;
  for(const row of candidates){const rect=row.getBoundingClientRect();target=row;after=drag.y>=rect.top+rect.height/2;if(!after)break}
  drag.target=target;drag.after=after;target?.classList.add(after?'sequence-drop-after':'sequence-drop-before');
  drag.ghost.style.top=`${drag.y-drag.offset}px`;
 }
 function scroll(){
  if(!drag?.started)return;
  const edge=65,height=window.innerHeight;
  if(drag.y<edge)window.scrollBy(0,-Math.ceil((edge-drag.y)/5));
  else if(drag.y>height-edge)window.scrollBy(0,Math.ceil((drag.y-height+edge)/5));
  locate();scrollFrame=requestAnimationFrame(scroll);
 }
 function finish(commit=false){
  if(!drag)return;const state=drag;clearTarget();drag=null;cancelAnimationFrame(scrollFrame);scrollFrame=null;
  state.row.classList.remove('sequence-dragging');state.row.open=state.wasOpen;state.ghost?.remove();document.body.classList.remove('sequence-is-dragging');
  try{if(state.handle.hasPointerCapture(state.pointer))state.handle.releasePointerCapture(state.pointer)}catch{}
  if(commit&&state.started&&state.target)onMove(state.row.dataset.item,state.target.dataset.item,state.after);
 }
 function down(event){
  const handle=event.target.closest(handles);if(!handle||event.button!==0||event.isPrimary===false)return;
  const row=handle.closest(rows),phase=row?.closest('.sequence-phase');if(!row||!phase)return;
  event.preventDefault();finish();const rect=row.getBoundingClientRect();
  drag={pointer:event.pointerId,handle,row,phase,wasOpen:row.open,start:event.clientY,y:event.clientY,offset:event.clientY-rect.top,started:false,target:null,after:false};
  handle.setPointerCapture?.(event.pointerId);
 }
 function move(event){
  if(!drag||event.pointerId!==drag.pointer)return;
  drag.y=event.clientY;if(!drag.started&&Math.abs(drag.y-drag.start)<6)return;
  event.preventDefault();
  if(!drag.started){
   drag.started=true;drag.row.open=false;const rect=drag.row.getBoundingClientRect();
   const ghost=drag.row.cloneNode(true);ghost.removeAttribute('name');ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));ghost.classList.add('sequence-drag-ghost');ghost.setAttribute('aria-hidden','true');ghost.inert=true;
   ghost.style.width=`${rect.width}px`;ghost.style.left=`${rect.left}px`;document.body.append(ghost);drag.ghost=ghost;
   drag.row.classList.add('sequence-dragging');document.body.classList.add('sequence-is-dragging');scrollFrame=requestAnimationFrame(scroll);
  }
  locate();
 }
 function up(event){if(drag&&event.pointerId===drag.pointer){event.preventDefault();finish(true)}}
 function cancel(){finish(false)}
 function click(event){if(event.target.closest(handles)){event.preventDefault();event.stopPropagation()}}
 function key(event){
  const handle=event.target.closest(handles);if(!handle)return;
  if(event.key==='Escape'){event.preventDefault();cancel();return}
  if(!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();
  const row=handle.closest(rows),list=[...row.closest('.sequence-phase').querySelectorAll(rows)],index=list.indexOf(row),target=list[index+(event.key==='ArrowUp'?-1:1)];
  if(!target)return;const id=row.dataset.item;onMove(id,target.dataset.item,event.key==='ArrowDown');root.querySelector(`[data-item="${id}"] ${handles}`)?.focus({preventScroll:true});
 }
 const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['keydown',key],['click',click,true]];
 for(const [name,fn,capture=false]of listeners)root.addEventListener(name,fn,{capture,passive:false});
 return {cancel,destroy(){cancel();for(const [name,fn,capture=false]of listeners)root.removeEventListener(name,fn,capture)}};
}
