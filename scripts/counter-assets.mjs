import fs from 'node:fs';
export function buildCounter(){
 let html=fs.readFileSync('src/counter/source.html','utf8');
 html=html.replace(/<script\s+src="https:[^"]+"[^>]*><\/script>/g,'').replace(/<link[^>]+href="https:[^"]+"[^>]*>/g,'');
 const leadIn=fs.readFileSync('src/counter/lead-in.js','utf8');
 const celebration=fs.readFileSync('src/counter/celebration.js','utf8');
 const automaticGoal=fs.readFileSync('src/counter/automatic-goal.js','utf8').replace(/^export /gm,'');
 const css=fs.readFileSync('src/counter/local.css','utf8'),icons=fs.readFileSync('src/counter/icons.js','utf8'),bridge=fs.readFileSync('src/counter/bridge.js','utf8'),progress=fs.readFileSync('src/counter/progress.js','utf8').replace(/^export /gm,'');
 html=html.replace('</head>',`<style>${css}</style><script>${icons}\n${progress}\n${automaticGoal}\n${celebration}\n${leadIn}</script></head>`);
 html=html.replace(/<body([^>]*)>/,'<body$1><p id="integration-notice" role="status"></p>');
 html=html.replace('</body>',`${fs.readFileSync('src/counter/celebration.html','utf8')}<script>${bridge}\n${fs.readFileSync('src/counter/data.js','utf8')}\ninstallFitTempoCelebration();</script></body>`);
 html=html.replace('<span>Séries</span>','<span>Séries</span><span id="seriesFillLabel" class="series-fill-label" hidden></span>');
 html=html.replace('<div class="manual-actions">','<div id="seriesFillProgress" class="counter-sr-only" role="progressbar" aria-label="Progresso da série automática" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden></div><div class="manual-actions">');
 const manualStart=html.indexOf('        const manual ='),manualEnd=html.indexOf('        function selectMode',manualStart);
 if(manualStart<0||manualEnd<0)throw Error('Bloco de séries não encontrado');
 html=html.slice(0,manualStart)+fs.readFileSync('src/counter/manual.js','utf8')+html.slice(manualEnd);
 const goalControls=`<fieldset class="series-goal-options" aria-label="Meta de séries">
 <label><input type="radio" name="seriesGoalMode" value="free" checked> Livre</label>
 <label><input type="radio" name="seriesGoalMode" value="fixed"> Número de séries</label>
 <label class="series-goal-input" hidden>Meta <input id="seriesGoalTarget" type="number" min="1" step="1" value="100" inputmode="numeric" aria-label="Número de séries a fazer"></label>
 </fieldset>`;
 html=html.replace('<p id="seriesTiming"',goalControls+'<p id="seriesTiming"');
 html=html.replace('<div id="manualClock"',`<section id="seriesWorkoutDuration" class="series-workout-duration" aria-label="Duração prevista do treino" hidden><span>DURAÇÃO PREVISTA</span><strong id="seriesWorkoutTotal">—</strong><small id="seriesWorkoutDetails"></small></section><div id="manualClock"`);
 html=html.replace('<strong id="manualCount"',`<svg id="seriesGoalRing" class="series-goal-ring" aria-hidden="true" hidden><rect class="series-goal-track" x="4" y="4" width="calc(100% - 8px)" height="calc(100% - 8px)" rx="7"/><rect id="seriesGoalStroke" x="4" y="4" width="calc(100% - 8px)" height="calc(100% - 8px)" rx="7" pathLength="100"/></svg><strong id="manualCount"`);
 html=html.replace('<div class="manual-actions">','<div id="seriesGoalProgress" class="series-goal-caption" role="progressbar" aria-label="Meta de séries concluídas" hidden></div><div class="manual-actions">');
 // Add a series target while keeping the scheduler's repetition-based contract.
 html=html.replace('<!-- Definições Principais de Repetições -->',`<label class="automatic-goal-mode">Definir meta por<select id="automaticGoalMode" aria-label="Definir meta por"><option value="reps">Repetições</option><option value="series">Séries</option></select></label><!-- Definições Principais de Repetições -->`);
 html=html.replace('<label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Meta de Repetições</label>',`<label id="automaticGoalLabel" class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Meta de Repetições</label>`);
 html=html.replace('<input type="number" id="inputTotalReps"',`<input type="number" id="inputSeriesGoal" aria-label="Meta de séries automáticas" value="100" min="1" step="1" inputmode="numeric" class="automatic-series-input" hidden><input type="number" id="inputTotalReps"`);
 html=html.replace("const inputTotalReps = document.getElementById('inputTotalReps');",`const inputTotalReps = document.getElementById('inputTotalReps');
 const automaticGoalMode=document.getElementById('automaticGoalMode'),inputSeriesGoal=document.getElementById('inputSeriesGoal');`);
 html=html.replace('state.totalRepsGoal = Math.max(1, parseInt(inputTotalReps.value) || 1);',`const goal=automaticWorkoutGoal(automaticGoalMode.value,inputSeriesGoal.value,inputTotalReps.value,inputRepsPerSet.value);
 state.totalRepsGoal=goal.totalReps;
 const bySeries=automaticGoalMode.value==='series';
 inputTotalReps.hidden=bySeries;inputSeriesGoal.hidden=!bySeries;
 document.getElementById('automaticGoalLabel').textContent=bySeries?'Meta de séries':'Meta de repetições';`);
 html=html.replaceAll('[inputTotalReps, inputRepsPerSet,','[automaticGoalMode, inputSeriesGoal, inputTotalReps, inputRepsPerSet,');
 html=html.replace("const preset = e.target.getAttribute('data-preset');", "automaticGoalMode.value='reps';const preset = e.target.getAttribute('data-preset');");
 html=html.replace("function executeNextRep(targetRepsInSet) {", "function executeNextRep(targetRepsInSet) {if(typeof queueCounterData==='function')queueCounterData();");
 html=html.replace("                runWorkPhase();\n            }\n        }\n\n        function resetWorkout()", "                resumeImportedWork();\n            }\n        }\n\n        function resetWorkout()");
 const victoryStart=html.indexOf('            // Som de vitória'),victoryEnd=html.indexOf('            // Guardar no Histórico',victoryStart);
 if(victoryStart<0||victoryEnd<0)throw Error('Conclusão do FitTempo não encontrada');
 html=html.slice(0,victoryStart)+`            celebrateFitTempo(state.totalSets+' séries · '+state.totalRepsDone+' repetições');\n\n`+html.slice(victoryEnd);
 html=html.replace('function resetWorkout() {','function resetWorkout() {closeFitTempoCelebration();');
 html=html.replace('if (history.length > 20) history.pop(); // guardar últimos 20','');
 html=html.replaceAll('${item.date}','${escapeFitTempoText(item.date)}').replaceAll('${item.tempo}','${escapeFitTempoText(item.tempo)}');
 html=html.replace('function runWorkPhase() {','function beginCountedWork() {');
 const speechStart=html.indexOf('        function speak(text, force = false) {'),speechEnd=html.indexOf('        // Manter Ecrã',speechStart);
 if(speechStart<0||speechEnd<0)throw Error('Voz do FitTempo não encontrada');
 html=html.slice(0,speechStart)+fs.readFileSync('src/counter/speech.js','utf8')+'\n'+html.slice(speechEnd);
 html=html.replace('function pauseWorkout() {','function pauseWorkout() {cancelCounterLeadIn();');
 html=html.replace('function resetWorkout() {','function resetWorkout() {cancelCounterLeadIn();');
 // Strength presets allow a complete repetition; explicit user settings stay editable.
 html=html.replace('id="inputBpm" value="60"','id="inputBpm" value="30"');
 html=html.replace("if (preset === 'pushups') {\n                    inputTotalReps.value = 100;\n                    inputRepsPerSet.value = 10;\n                    inputBpm.value = 60;", "if (preset === 'pushups') {\n                    inputTotalReps.value = 100;\n                    inputRepsPerSet.value = 10;\n                    inputBpm.value = 30;");
 // Retain the supplied app's history key. Failure never aborts workout completion.
 html=html.replace('function getHistory() {','let integratedHistory=null,integratedReadFailed=false;\n function getHistory() {');
 html=html.replace("return JSON.parse(localStorage.getItem('fittempo_history') || '[]');", "if(integratedHistory)return integratedHistory;const data=JSON.parse(localStorage.getItem('fittempo_history')||'[]');if(!Array.isArray(data))throw Error('Histórico inválido');return data;");
 html=html.replace(/(function getHistory\(\)[\s\S]*?catch \(e\) \{)\s*return \[\];/,"$1 integratedReadFailed=true;return integratedHistory||[];");
 html=html.replace("localStorage.setItem('fittempo_history', JSON.stringify(history));", "integratedHistory=history;try{if(integratedReadFailed)throw Error('Leitura bloqueada');localStorage.setItem('fittempo_history',JSON.stringify(history));document.getElementById('integration-notice').textContent=''}catch{document.getElementById('integration-notice').textContent='Histórico do contador apenas em memória: não foi possível guardar neste navegador.'}");
 html=html.replace('            renderHistoryModal();\n        }',"            renderHistoryModal();if(typeof publishCounterData==='function')publishCounterData();\n        }");
 html=html.replace("localStorage.removeItem('fittempo_history');", "try{localStorage.removeItem('fittempo_history');integratedHistory=[];integratedReadFailed=false}catch{document.getElementById('integration-notice').textContent='Não foi possível apagar o histórico do contador.'}");
 for(const id of ['soundIcon','voiceIcon'])html=html.replace(new RegExp(id+'\\.className = ([^;]+);','g'),`${id}.setAttribute('class',$1);`);
 const voiceStart=html.indexOf('            guideVoice ='),voiceEnd=html.indexOf('            return guideVoice;',voiceStart);
 html=html.slice(0,voiceStart)+"            guideVoice=voices.find(v=>/^pt[-_]PT$/i.test(v.lang)&&v.localService)||voices.find(v=>/^pt[-_]PT$/i.test(v.lang))||null;\n"+html.slice(voiceEnd);
 html=html.replace('if (!guideVoice) loadGuideVoice();','if (!guideVoice) loadGuideVoice();if(!guideVoice){after?.();return;}');
 html=html.replace("const historyModal = document.getElementById('historyModal');","const historyModal = document.getElementById('historyModal');historyModal.hidden=true;historyModal.setAttribute('role','dialog');historyModal.setAttribute('aria-label','Histórico do contador');");
 html=html.replace("historyModal.classList.remove('opacity-0', 'pointer-events-none');","historyModal.hidden=false;historyModal.classList.remove('opacity-0', 'pointer-events-none');");
 html=html.replace("historyModal.classList.add('opacity-0', 'pointer-events-none');","historyModal.hidden=true;historyModal.classList.add('opacity-0', 'pointer-events-none');");
 html=html.replace('<header class=', '<header hidden class=');
 html=html.replace('Tela ativa','Ecrã ativo');
 // Recolour the integrated copy, including all runtime status classes and gradients.
 // Keep destructive/error colours distinct from the app's decorative accents.
 const bluePalette={'34d399':'60a5fa','10b981':'3b82f6','06b6d4':'3b82f6','22d3ee':'93c5fd','2dd4bf':'60a5fa','5eead4':'93c5fd','62e5b6':'60a5fa','a855f7':'3b82f6','c084fc':'93c5fd','f59e0b':'3b82f6','fbbf24':'93c5fd','fb923c':'60a5fa','fdba74':'bfdbfe','064e3b':'102f50','065f46':'163f6b','0a1118':'091322'};
 html=html.replace(/#([0-9a-f]{6})([0-9a-f]{2})?\b/gi,(value,rgb,alpha)=>bluePalette[rgb.toLowerCase()]?'#'+bluePalette[rgb.toLowerCase()]+(alpha||''):value);
 html=html.replace('</head>','<style>#phaseBadge{color:#bfdbfe!important;border-color:#60a5fa66!important}.manual-actions button{border-color:#31587f}.manual-actions button:not(:disabled):hover{background:#143256}input[type=radio]{accent-color:#60a5fa}#manualTap{color:#eff6ff}.mode-tabs button[aria-selected="true"]{color:#93c5fd}</style></head>');
 fs.writeFileSync('src/counter-document.js',`// Generated from the supplied FitTempo app and local integration assets.\nexport const COUNTER_DOCUMENT=${JSON.stringify(html)};\n`);
}
