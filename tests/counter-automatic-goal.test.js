import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {automaticWorkoutGoal} from '../src/counter/automatic-goal.js';
import {COUNTER_DOCUMENT} from '../src/counter-document.js';
test('100 automatic series produce 100 complete sets, not 100 total repetitions',()=>{
 assert.deepEqual(automaticWorkoutGoal('series',100,100,10),{totalReps:1000,repsPerSet:10,totalSets:100});
 assert.deepEqual(automaticWorkoutGoal('series',100,100,15),{totalReps:1500,repsPerSet:15,totalSets:100});
 assert.deepEqual(automaticWorkoutGoal('reps',100,105,10),{totalReps:105,repsPerSet:10,totalSets:11});
});
test('integrated calculation switches goal fields and sends the selected series count to the scheduler',()=>{
 const elements={};const el=id=>elements[id]??=( {textContent:''} );
 const ctx={automaticWorkoutGoal,state:{status:'IDLE',secPerRep:1,bpm:60},automaticGoalMode:{value:'series'},inputSeriesGoal:{value:'100'},inputTotalReps:{value:'105'},inputRepsPerSet:{value:'10'},inputCountIn:{value:'3'},inputRestTime:{value:'15'},document:{getElementById:el},setMainProgress(){},setSubProgress(){}};
 for(const id of ['summaryText','statSets','statReps','statTempo','mainDisplay','mainSubtext','tempoPhaseLabel'])ctx[id]={};
 const start=COUNTER_DOCUMENT.indexOf('function updateCalculations()'),end=COUNTER_DOCUMENT.indexOf('function setMainProgress(',start);
 vm.createContext(ctx);vm.runInContext(COUNTER_DOCUMENT.slice(start,end)+'\nupdateCalculations();',ctx);
 assert.equal(ctx.state.totalSets,100);assert.equal(ctx.state.totalRepsGoal,1000);assert.equal(ctx.statSets.textContent,'0 / 100');assert.match(ctx.summaryText.textContent,/100 séries de 10 reps/);
 assert.equal(ctx.inputTotalReps.hidden,true);assert.equal(ctx.inputSeriesGoal.hidden,false);
 ctx.inputRepsPerSet.value='15';vm.runInContext('updateCalculations()',ctx);assert.equal(ctx.state.totalSets,100);assert.equal(ctx.state.totalRepsGoal,1500);
 ctx.automaticGoalMode.value='reps';ctx.inputRepsPerSet.value='10';vm.runInContext('updateCalculations()',ctx);assert.equal(ctx.state.totalRepsGoal,105);assert.equal(ctx.state.totalSets,11);assert.equal(ctx.inputSeriesGoal.hidden,true);
 ctx.state.status='WORK';ctx.inputTotalReps.value='999';vm.runInContext('updateCalculations()',ctx);assert.equal(ctx.state.totalRepsGoal,105);
});
