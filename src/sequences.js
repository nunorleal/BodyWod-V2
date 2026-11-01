import {byId,exercises} from './exercises.js';
import {executionCadence} from './training.js';
export const sequenceCategories=['Aquecimento','Peito','Bíceps','Tríceps','Ombros','Pernas e glúteos','Costas','Abdominais','Cardio e corpo inteiro','Retorno à calma'];
export function sequenceCategory(exercise,category){
 if(category==='Todos')return true;
 if(['Aquecimento','Retorno à calma'].includes(exercise.category))return exercise.category===category;
 const muscles=exercise.primary.join(' ').toLowerCase();
 return ({Peito:exercise.category==='Peito e tríceps','Bíceps':/bíceps/.test(muscles),'Tríceps':/tríceps/.test(muscles),Ombros:exercise.category==='Ombros e braços'&&!/bíceps/.test(muscles),'Pernas e glúteos':exercise.category==='Pernas e glúteos',Costas:exercise.category==='Costas e cadeia posterior',Abdominais:exercise.category==='Abdominais e core','Cardio e corpo inteiro':exercise.category==='Cardio e corpo inteiro'})[category]||false;
}
export const sequenceId=()=>globalThis.crypto?.randomUUID?.()||String(Date.now()+Math.random());
export const newSequence=(defaults={sets:3,reps:10})=>({id:sequenceId(),name:'A minha sequência',defaults:{...defaults},items:[]});
export const emptySequences=()=>({draft:newSequence(),plans:[],cadences:{},verifiedCadences:{},history:[],session:null});
export function sequenceCadence(exerciseId,cadences={}){return cadences[exerciseId]??executionCadence(byId[exerciseId],3)??2}
export function sequenceItem(exerciseId,defaults){const e=byId[exerciseId];if(!e)throw Error('Exercício não encontrado.');return {id:sequenceId(),exerciseId,mode:e.execution==='reps'?'reps':'time',reps:e.recommendedReps||10,seconds:e.recommendedSeconds||30,sets:defaults?.sets??1,rest:15,...(defaults?{reps:defaults.reps}:{})}}
export function sequenceDefaults(plan){return {...{sets:3,reps:10},...plan.defaults}}
export function applySequenceDefaults(plan,defaults){
 if(!Number.isInteger(defaults.sets)||defaults.sets<1||defaults.sets>100||!Number.isInteger(defaults.reps)||defaults.reps<1||defaults.reps>1000)throw Error('Escolhe 1 a 100 séries e 1 a 1000 repetições.');
 const next=structuredClone(plan);next.defaults={...defaults};for(const item of next.items){item.sets=defaults.sets;if(item.mode==='reps')item.reps=defaults.reps}return next;
}
export function isSequencePaceVerified(data,exerciseId){return Number.isFinite(data.verifiedCadences?.[exerciseId])&&Math.abs(data.verifiedCadences[exerciseId]-sequenceCadence(exerciseId,data.cadences))<1e-8}
export function setSequenceCadence(data,exerciseId,value){
 if(!byId[exerciseId]||!Number.isFinite(value)||value<.25||value>60)throw Error('Ritmo inválido.');
 if(Math.abs(sequenceCadence(exerciseId,data.cadences)-value)>1e-8&&data.verifiedCadences)delete data.verifiedCadences[exerciseId];
 data.cadences[exerciseId]=value;
}
export function confirmSequencePace(data,exerciseId,confirmed){
 if(!byId[exerciseId])throw Error('Exercício inválido.');data.verifiedCadences??={};
 if(confirmed)data.verifiedCadences[exerciseId]=sequenceCadence(exerciseId,data.cadences);else delete data.verifiedCadences[exerciseId];
}
export function sequencePaceTest(exerciseId){const plan=newSequence();plan.name=byId[exerciseId]?.name||'';plan.items=[{...sequenceItem(exerciseId),mode:'reps',sets:1,reps:5,rest:0}];return plan}
export function parseSequenceSeconds(input,{min=.25,max=60}={}){
 const text=String(input).trim();
 if(!/^\d+(?:[.,]\d{1,2})?$/.test(text))throw Error('Escreve os segundos com até duas casas decimais, por exemplo 1,33 ou 1.33.');
 const value=Number(text.replace(',','.'));
 if(!Number.isFinite(value)||value<min||value>max)throw Error(`Usa entre ${String(min).replace('.',',')} e ${max} segundos.`);
 return value;
}
const validSequenceSeconds=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max&&Math.abs(value*100-Math.round(value*100))<1e-6;
const validSequenceId=id=>typeof id==='string'&&/^[a-zA-Z0-9_.:-]{1,100}$/.test(id);
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export function validateSequence(plan,{allowEmpty=false}={}){
 if(!plan||!validSequenceId(plan.id)||typeof plan.name!=='string'||plan.name.length>80||!Array.isArray(plan.items)||plan.items.length>100||(!allowEmpty&&!plan.items.length))throw Error('Adiciona entre 1 e 100 exercícios à sequência.');
 if(plan.defaults&&(!integer(plan.defaults.sets,1,100)||!integer(plan.defaults.reps,1,1000)))throw Error('Valores gerais de séries e repetições inválidos.');
 const ids=new Set();for(const item of plan.items){if(!item||!validSequenceId(item.id)||ids.has(item.id)||!byId[item.exerciseId]||!['reps','time'].includes(item.mode)||!integer(item.reps,1,1000)||!integer(item.sets,1,100)||!validSequenceSeconds(item.seconds,.01,3600)||!integer(item.rest,0,600))throw Error('Verifica repetições (1–1000), séries (1–100), segundos (0,01–3600, até duas casas decimais) e descansos (0–600 s).');ids.add(item.id)}
 return plan;
}
export function validateSequences(data){
 if(!data||!Array.isArray(data.plans)||!Array.isArray(data.history)||!data.cadences||typeof data.cadences!=='object'||Array.isArray(data.cadences))throw Error('Sequências FitTempo inválidas.');
 if(data.verifiedCadences&&(typeof data.verifiedCadences!=='object'||Array.isArray(data.verifiedCadences)||Object.entries(data.verifiedCadences).some(([id,value])=>!byId[id]||!Number.isFinite(value)||value<.25||value>60)))throw Error('Confirmações de velocidade inválidas.');
 validateSequence(data.draft,{allowEmpty:true});data.plans.forEach(p=>validateSequence(p));
 for(const [id,value]of Object.entries(data.cadences))if(!byId[id]||!Number.isFinite(value)||value<.25||value>60)throw Error('Ritmo FitTempo inválido.');
 for(const h of data.history){if(!h||typeof h.id!=='string'||typeof h.date!=='string'||!Number.isFinite(h.duration)||h.duration<0)throw Error('Histórico de sequências inválido.');validateSequence(h.plan)}
 if(data.session){const s=data.session;validateSequence(s.plan);const steps=sequenceTimeline(s.plan,s.cadences);if(!integer(s.index,0,steps.length-1)||!Number.isFinite(s.offset)||s.offset<0||s.offset>steps[s.index].duration)throw Error('Sessão de sequência inválida.');}
 return data;
}
export function measuredCadence(seconds,reps){const value=Math.round(seconds/reps*100)/100;if(!Number.isFinite(value)||!integer(reps,1,100)||value<.25||value>60)throw Error('Mede entre 0,25 e 60 segundos por repetição. Repete a simulação se necessário.');return value}
export function sequenceTimeline(plan,cadences={}){
 validateSequence(plan);if(!cadences||typeof cadences!=='object'||Array.isArray(cadences))throw Error('Ritmos inválidos.');
 const steps=[];let at=0;for(const [itemIndex,item]of plan.items.entries()){
  const cadence=sequenceCadence(item.exerciseId,cadences);if(!Number.isFinite(cadence)||cadence<.25||cadence>60)throw Error('Ritmo inválido.');
  for(let round=1;round<=item.sets;round++){
   const add=(kind,duration)=>{steps.push({kind,duration,start:at,end:at+duration,itemId:item.id,exerciseId:item.exerciseId,round,sets:item.sets,reps:item.mode==='reps'?item.reps:null,cadence});at+=duration};
   add('work',Math.round((item.mode==='reps'?item.reps*cadence:item.seconds)*100)/100);
   if(item.rest&&(round<item.sets||itemIndex<plan.items.length-1))add('rest',item.rest);
  }
 }
 return steps;
}
export const sequencePhases=[{key:'warmup',label:'Aquecimento'},{key:'training',label:'Treino específico'},{key:'cooldown',label:'Arrefecimento / retorno à calma'}];
export function sequencePhase(item){const category=byId[item.exerciseId]?.category;return category==='Aquecimento'?'warmup':category==='Retorno à calma'?'cooldown':'training'}
export function orderSequencePhases(plan){const next=structuredClone(plan),rank={warmup:0,training:1,cooldown:2};next.items.sort((a,b)=>rank[sequencePhase(a)]-rank[sequencePhase(b)]);return next}
export function sequenceSections(plan,cadences={}){
 const ordered=orderSequencePhases(plan),sections=sequencePhases.map(phase=>({...phase,items:[],duration:0}));
 validateSequence(ordered,{allowEmpty:true});if(!ordered.items.length)return sections;
 const steps=sequenceTimeline(ordered,cadences),durations=new Map();for(const step of steps)durations.set(step.itemId,(durations.get(step.itemId)||0)+step.duration);
 ordered.items.forEach((item,index)=>{const section=sections.find(s=>s.key===sequencePhase(item)),duration=Math.round(durations.get(item.id)*100)/100;section.items.push({item,index,duration});section.duration=Math.round((section.duration+duration)*100)/100});
 return sections;
}
export function formatSequenceDuration(seconds){const centis=Math.max(0,Math.round(seconds*100)),minutes=Math.floor(centis/6000),whole=Math.floor(centis%6000/100),fraction=centis%100;return `${String(minutes).padStart(2,'0')}:${String(whole).padStart(2,'0')}${fraction?','+String(fraction).padStart(2,'0'):''}`}
export class SequenceRunner{
 constructor(plan,cadences={},now=()=>performance.now()) {this.plan=structuredClone(plan);this.cadences=structuredClone(cadences);this.steps=sequenceTimeline(plan,cadences);this.now=now;this.index=0;this.offset=0;this.anchor=0;this.running=false;this.waiting=false;this.finished=false}
 snapshot(){const step=this.steps[this.index],rawElapsed=Math.min(step.duration,this.offset+(this.running&&!this.waiting?(this.now()-this.anchor)/1000:0)),elapsed=rawElapsed>=step.duration-1e-6?step.duration:rawElapsed;return {step,index:this.index,elapsed,rep:step.kind==='work'&&step.reps?Math.min(step.reps,Math.floor((elapsed+1e-6)/step.cadence)):0,remaining:Math.max(0,step.duration-elapsed),total:this.steps.at(-1).end,totalRemaining:Math.max(0,Math.round((this.steps.at(-1).end-step.start-elapsed)*1e6)/1e6),done:elapsed>=step.duration,running:this.running,waiting:this.waiting,finished:this.finished}}
 prepare(){if(this.finished)return;this.offset=this.snapshot().elapsed;this.running=true;this.waiting=true}
 begin(){if(!this.running||!this.waiting)return;this.waiting=false;this.anchor=this.now()}
 pause(){this.offset=this.snapshot().elapsed;this.running=false;this.waiting=false}
 advance(){this.pause();if(this.index===this.steps.length-1){this.finished=true;return}this.index++;this.offset=0}
 serialize(){return {plan:this.plan,cadences:this.cadences,index:this.index,offset:this.snapshot().elapsed}}
 static restore(data,now){const runner=new SequenceRunner(data.plan,data.cadences,now);if(!integer(data.index,0,runner.steps.length-1)||!Number.isFinite(data.offset)||data.offset<0||data.offset>runner.steps[data.index].duration)throw Error('Sessão inválida.');runner.index=data.index;runner.offset=data.offset;return runner}
}
