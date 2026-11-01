// Uses the same elapsed clock and next-series deadline as the automatic counter.
export function automaticSeriesProgress(model,elapsed){
 if(!model.automatic||!Number.isFinite(model.interval)||model.interval<=0||!Number.isFinite(model.nextAt)||!Number.isFinite(elapsed))return null;
 if(seriesGoalReached(model))return 1;
 return Math.max(0,Math.min(1,1-(model.nextAt-elapsed)/model.interval));
}
export function paintSeriesProgress(model,elapsed){
 const tile=document.getElementById('manualTap'),label=document.getElementById('seriesFillLabel'),meter=document.getElementById('seriesFillProgress');
 const progress=automaticSeriesProgress(model,elapsed),active=progress!==null;
 const cycle=active?String(model.nextAt):'';
 // Reset immediately at a new series; freeze exactly when paused.
 tile.style.setProperty('--series-fill-transition',model.startedAt===null||tile.dataset.fillCycle!==cycle?'none':'transform 100ms linear');
 tile.dataset.fillCycle=cycle;tile.style.setProperty('--series-progress',String(progress??0));tile.classList.toggle('has-series-progress',active);
 label.hidden=!active;meter.hidden=!active;
 if(active){const percent=Math.round(progress*100);label.textContent=`${percent}% da série`;meter.setAttribute('aria-valuenow',String(percent));meter.setAttribute('aria-valuetext',`${percent}% da série automática`)}
 else{label.textContent='';meter.setAttribute('aria-valuenow','0');meter.removeAttribute('aria-valuetext')}
}

export function seriesGoalReached(model){return Number.isSafeInteger(model.target)&&model.target>0&&model.count>=model.target}
export function advanceSeries(model,elapsed){
 if(!model.automatic||model.startedAt===null||!Number.isFinite(model.interval)||model.interval<=0||!Number.isFinite(model.nextAt)||elapsed<model.nextAt)return 0;
 const due=Math.floor((elapsed-model.nextAt)/model.interval)+1;
 const completed=Math.min(due,model.target===null||model.target===undefined?due:Math.max(0,model.target-model.count));
 model.count+=completed;model.nextAt+=completed*model.interval;
 return completed;
}
export function seriesWorkoutEstimate(model,elapsed){
 const fraction=automaticSeriesProgress(model,elapsed);
 if(!Number.isSafeInteger(model.target)||model.target<=0||fraction===null)return null;
 return {total:model.target*model.interval,remaining:Math.max(0,model.target-model.count-fraction)*model.interval};
}
export function seriesGoalProgress(model,elapsed){
 if(!Number.isSafeInteger(model.target)||model.target<=0)return null;
 return Math.max(0,Math.min(1,(model.count+(seriesGoalReached(model)?0:automaticSeriesProgress(model,elapsed)??0))/model.target));
}
export function seriesDurationText(milliseconds){
 const seconds=Math.ceil(Math.max(0,milliseconds)/1000),hours=Math.floor(seconds/3600);
 return (hours?[hours,Math.floor(seconds/60)%60,seconds%60]:[Math.floor(seconds/60),seconds%60]).map(n=>String(n).padStart(2,'0')).join(':');
}
export function paintSeriesGoal(model,elapsed){
 const ring=document.getElementById('seriesGoalRing'),stroke=document.getElementById('seriesGoalStroke'),caption=document.getElementById('seriesGoalProgress');
 const active=Number.isSafeInteger(model.target)&&model.target>0;
 ring.toggleAttribute('hidden',!active);caption.hidden=!active;
 const duration=document.getElementById('seriesWorkoutDuration'),estimate=seriesWorkoutEstimate(model,elapsed);
 duration.hidden=!active||!model.automatic;
 document.getElementById('seriesWorkoutTotal').textContent=estimate?seriesDurationText(estimate.total):'—';
 document.getElementById('seriesWorkoutDetails').textContent=estimate?`${model.target} séries × ${Number((model.interval/1000).toFixed(2)).toLocaleString('pt-PT')} s · Restam ${seriesDurationText(estimate.remaining)}`:'Disponível após medir a primeira série';
 if(!active)return;
 const progress=seriesGoalProgress(model,elapsed),percent=(progress*100).toLocaleString('pt-PT',{maximumFractionDigits:1});
 const completed=Math.min(model.count,model.target);
 stroke.style.transition=model.startedAt===null?'none':'stroke-dashoffset 100ms linear';
 stroke.style.strokeDashoffset=String(100-100*progress);
 caption.textContent=seriesGoalReached(model)?`${model.count} / ${model.target} séries · Meta concluída!`:`${model.count} / ${model.target} séries · ${percent}%`;
 caption.setAttribute('aria-valuemin','0');caption.setAttribute('aria-valuemax',String(model.target));caption.setAttribute('aria-valuenow',String(Number((progress*model.target).toFixed(3))));
 caption.setAttribute('aria-valuetext',`${completed} de ${model.target} séries concluídas · ${percent}% do treino`);
}
