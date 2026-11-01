// Convert a series target into the repetition total used by the existing scheduler.
export function automaticWorkoutGoal(mode,series,repetitions,perSeries){
 const positive=value=>Math.max(1,Math.min(1000000,Math.floor(Number(value)||1)));
 const repsPerSet=positive(perSeries);
 const totalReps=mode==='series'?positive(series)*repsPerSet:positive(repetitions);
 return {totalReps,repsPerSet,totalSets:Math.ceil(totalReps/repsPerSet)};
}
