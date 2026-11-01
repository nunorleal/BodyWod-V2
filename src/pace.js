import {clusterRepTime,clusterPause} from './training.js';
import {repetitionTiming,repetitionAt} from './audio.js';
export const MIN_CADENCE=.5,MAX_CADENCE=10;
export function boundedCadence(value){return Math.max(MIN_CADENCE,Math.min(MAX_CADENCE,Math.round(Number(value)*4)/4))}
export function retimeRepetitionStep(original,cadence,elapsed=0){
 const step=structuredClone(original),timing=repetitionTiming(step);
 if(!timing)return step;
 let oldCadence=step.cadence||timing.interval||3;const count=step.reps;
 const oldTimes=step.repTimes||Array.from({length:count},(_,i)=>step.cluster?clusterRepTime(i,step):timing.start+i*timing.interval);
 const done=elapsed>0?repetitionAt(step,elapsed):0,pause=clusterPause(step,elapsed),times=oldTimes.slice(0,done);
 if(!step.repTimes&&!step.cluster&&done<count&&timing.interval>0)oldCadence=timing.interval;
 const restAfter=n=>step.cluster&&n<count&&n%step.cluster.every===0?step.cluster.rest:0;
 let finalMotionEnd;
 if(!done)times.push(oldTimes[0]);
 else{
  const last=oldTimes[done-1],fraction=Math.max(0,Math.min(1,(elapsed-last)/oldCadence));
  const motionEnd=elapsed+(1-fraction)*cadence;
  if(done<count)times.push(pause?elapsed+pause.remaining:motionEnd+restAfter(done));
  else finalMotionEnd=motionEnd;
 }
 while(times.length<count){const completed=times.length;times.push(times.at(-1)+cadence+restAfter(completed))}
 step.repTimes=times;step.cadence=cadence;step.cadenceCustom=true;
 step.pauseWindows=[];
 if(step.cluster)for(let n=step.cluster.every;n<count;n+=step.cluster.every)step.pauseWindows.push({group:n/step.cluster.every,start:times[n]-step.cluster.rest,end:times[n]});
 step.duration=Math.max(elapsed+.001,finalMotionEnd??times.at(-1)+cadence);
 return step;
}
export function retimeExercisePlan(original,exerciseId,cadence,{elapsed=0,includeCurrent=true}={}){
 if(!Number.isFinite(cadence)||cadence<MIN_CADENCE||cadence>MAX_CADENCE)throw Error('Usa entre 0,5 e 10 segundos por repetição.');
 const plan=structuredClone(original);let changed=false,at=0;
 for(let index=0;index<plan.timeline.length;index++){
  const step=plan.timeline[index];
  const eligible=step.kind==='work'&&step.reps&&step.exercise?.id===exerciseId&&(includeCurrent?step.end>elapsed:step.start>=elapsed);
  let next=step;
  if(eligible){next=retimeRepetitionStep(step,cadence,includeCurrent?Math.max(0,elapsed-step.start):0);changed=true}
  next.start=at;next.end=at+next.duration;at=next.end;plan.timeline[index]=next;
 }
 if(!changed)return plan;
 plan.customPacing=true;plan.duration=at;
 for(const block of plan.blocks){
  const steps=plan.timeline.filter(s=>s.blockId===block.id);if(!steps.length)continue;
  block.start=steps[0].start;block.end=steps.at(-1).end;block.duration=block.end-block.start;block.target=block.duration;block.customPacing=true;
  for(const item of block.items){const stepsForItem=steps.filter(s=>s.itemId===item.id&&s.cadenceCustom&&s.kind==='work');if(!stepsForItem.length)continue;
   const future=stepsForItem.find(s=>s.start>=elapsed)||stepsForItem.at(-1);
   item.cadence=future.cadence;item.cadenceCustom=true;item.work=future.duration;item.repsMode='manual';
  }
 }
 return plan;
}
export function applySavedCadences(plan,preferences={},options={}){
 let result=plan;
 for(const [id,cadence]of Object.entries(preferences||{}))if(Number.isFinite(cadence)&&cadence>=MIN_CADENCE&&cadence<=MAX_CADENCE)result=retimeExercisePlan(result,id,cadence,options);
 return result;
}

// Narration already supplies preparation. Start at zero, then cue the first
// movement after one cadence, without another six-second silent countdown.
export function prepareSessionPlan(original,{elapsed=0}={}){
 const plan=structuredClone(original);
 for(const step of plan.timeline){
  if(step.kind!=='work'||!step.reps||step.start<elapsed)continue;
  const timing=repetitionTiming(step),times=step.repTimes||Array.from({length:step.reps},(_,i)=>step.cluster?clusterRepTime(i,step):timing.start+i*timing.interval);
  const first=Math.min(step.cadence||timing.interval||2,times[0]),shift=times[0]-first;
  step.repTimes=times.map(at=>at-shift);
  if(step.cluster){step.pauseWindows=[];for(let n=step.cluster.every;n<step.reps;n+=step.cluster.every)step.pauseWindows.push({group:n/step.cluster.every,start:step.repTimes[n]-step.cluster.rest,end:step.repTimes[n]})}
 }
 return plan;
}
