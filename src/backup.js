import {validateSequences} from './sequences.js';
import {emptyState} from './storage.js';
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function mergeRecords(current=[],incoming=[]){
 const result=structuredClone(current),keys=new Set(result.map(record=>record.id||JSON.stringify(record)));
 for(const record of incoming){const key=record.id||JSON.stringify(record);if(!keys.has(key)){result.push(structuredClone(record));keys.add(key)}}return result;
}
export function validateFitTempo(data){
 if(!plain(data)||!Array.isArray(data.history))throw Error('Dados FitTempo inválidos.');
 for(const h of data.history)if(!plain(h)||!Number.isFinite(h.reps)||h.reps<0||!Number.isFinite(h.sets)||h.sets<0||typeof h.date!=='string'||typeof h.tempo!=='string')throw Error('Histórico FitTempo inválido.');
 if(data.automatic){const a=data.automatic;if(!plain(a)||!['IDLE','COUNT_IN','WORK','REST','PAUSED','FINISHED'].includes(a.status)||['totalRepsGoal','repsPerSet','bpm','secPerRep','countInSec','restSec','currentSet','totalSets','currentRepInSet','totalRepsDone','countInRemaining','restSecondsRemaining'].some(k=>!Number.isFinite(a[k])||a[k]<0)||!plain(a.cadence)||Object.values(a.cadence).some(v=>!Number.isFinite(v)||v<0))throw Error('Treino automático FitTempo inválido.');}
 if(data.settings&&(!plain(data.settings)||Object.values(data.settings).some(v=>typeof v!=='boolean')))throw Error('Definições FitTempo inválidas.');
 if(data.inputs&&(!plain(data.inputs)||Object.values(data.inputs).some(v=>typeof v!=='string'||v.length>100)))throw Error('Configuração FitTempo inválida.');
 if(data.manual){const m=data.manual;if(!plain(m)||!Number.isInteger(m.count)||m.count<0||!Number.isFinite(m.elapsed)||m.elapsed<0||typeof m.automatic!=='boolean'||(m.target!==null&&(!Number.isSafeInteger(m.target)||m.target<1))||['interval','nextAt'].some(k=>m[k]!==null&&(!Number.isFinite(m[k])||m[k]<0))||!Number.isFinite(m.calibrationStart)||m.calibrationStart<0)throw Error('Sessão FitTempo inválida.');}
 return data;
}
export function mergeFitTempo(current,incoming){
 if(!current)return structuredClone(incoming);if(!incoming)return structuredClone(current);
 return {...structuredClone(current),...structuredClone(incoming),history:mergeRecords(current.history,incoming.history)};
}
export function parseBackup(raw){
 const data=typeof raw==='string'?JSON.parse(raw):structuredClone(raw);
 function safe(value){if(!value||typeof value!=='object')return;for(const [k,v]of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Chave inválida no backup.');safe(v)}}safe(data);
 const state=data?.format==='bodywod.backup'&&data.backupVersion===2?data.data:data;
 if(!plain(state)||state.version!==1||!plain(state.preferences)||['saved','history','favorites','excluded'].some(k=>!Array.isArray(state[k])))throw Error('O ficheiro não é um backup BodyWOD válido.');
 const validPlan=p=>{if(!plain(p)||typeof p.id!=='string'||!Array.isArray(p.blocks)||!Array.isArray(p.timeline)||!p.timeline.length||!plain(p.config)||!Number.isFinite(p.duration)||p.duration<1||p.blocks.some(b=>!plain(b)||!Array.isArray(b.items)||b.items.some(i=>!i.exercise||!Array.isArray(i.exercise.primary)||!Array.isArray(i.exercise.instructions))))throw Error('Estrutura de treino inválida no backup.');for(const s of p.timeline)if(s.repTimes&&(!Array.isArray(s.repTimes)||s.repTimes.length!==s.reps||s.repTimes.some((t,i)=>!Number.isFinite(t)||t<0||(i>0&&t<s.repTimes[i-1]))||!Number.isFinite(s.cadence)||s.cadence<.5||s.cadence>10))throw Error('Cadência inválida no plano.');};
 state.saved.forEach(validPlan);state.history.forEach(h=>{validPlan(h.plan);if(!h.id||!Array.isArray(h.completedSteps)||!h.completedReps||!h.rounds||!Array.isArray(h.changes)||!Number.isFinite(h.actualSeconds))throw Error('Sessão inválida no backup.')});
 if(state.lastPlan)validPlan(state.lastPlan);if(state.session){validPlan(state.session.plan);if(!Number.isFinite(state.session.elapsed)||state.session.elapsed<0)throw Error('Sessão em pausa inválida.');}
 if(state.unsavedSummary){validPlan(state.unsavedSummary.plan);if(!state.unsavedSummary.id)throw Error('Resumo inválido.');}
 for(const k of ['favorites','excluded'])if(state[k].some(id=>typeof id!=='string'))throw Error('Favoritos ou exclusões inválidos.');
 for(const [key,value]of Object.entries(emptyState().preferences))if(key in state.preferences&&typeof state.preferences[key]!==typeof value)throw Error('Preferências inválidas.');
 if(state.exerciseCadences&&(!plain(state.exerciseCadences)||Object.values(state.exerciseCadences).some(v=>!Number.isFinite(v)||v<.5||v>10)))throw Error('Ritmos de exercícios inválidos.');
 if(state.generatorConfig&&(!plain(state.generatorConfig)||!Array.isArray(state.generatorConfig.included)||!Number.isFinite(state.generatorConfig.minutes)||!Number.isFinite(state.generatorConfig.level)))throw Error('Configuração do gerador inválida.');
 if(state.fittempo)validateFitTempo(state.fittempo);
 if(state.fittempoSequences)validateSequences(state.fittempoSequences);
 return state;
}
export function makeBackup(state,appVersion){return {format:'bodywod.backup',backupVersion:2,appVersion,exportedAt:new Date().toISOString(),data:structuredClone(state)}}
export function mergeBackup(current,incoming){
 const next=structuredClone(current);
 for(const k of ['saved','history'])next[k]=mergeRecords(current[k],incoming[k]);
 for(const k of ['favorites','excluded'])next[k]=[...new Set([...current[k],...incoming[k]])];
 next.preferences={...current.preferences,...incoming.preferences};
 next.exerciseCadences={...current.exerciseCadences,...incoming.exerciseCadences};
 next.lastPlan=current.lastPlan||incoming.lastPlan||null;
 next.session=current.session||incoming.session||null;
 if(incoming.generatorConfig)next.generatorConfig=structuredClone(incoming.generatorConfig);
 if(incoming.unsavedSummary)next.unsavedSummary=structuredClone(incoming.unsavedSummary);
 if(incoming.fittempo)next.fittempo=mergeFitTempo(current.fittempo,incoming.fittempo);
 if(incoming.fittempoSequences){const a=current.fittempoSequences,b=incoming.fittempoSequences;next.fittempoSequences=a?{...structuredClone(b),plans:mergeRecords(a.plans,b.plans),history:mergeRecords(a.history,b.history),cadences:{...a.cadences,...b.cadences},verifiedCadences:{...a.verifiedCadences,...b.verifiedCadences},draft:structuredClone(a.draft.items.length?a.draft:b.draft),session:structuredClone(a.session||b.session||null)}:structuredClone(b)}
 return next;
}
