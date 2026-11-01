import {applySavedCadences} from './pace.js';
import {trainingRole,suitableForMain,advancedWodSequence,advancedRepProfile,clusterTarget,executionCadence} from './training.js';
import {exercises, categories, byId} from './exercises.js';
export const modalities=['Full Body','Força e resistência','HIIT','EMOM','AMRAP','Circuito funcional','Cardio e core','Treino misto'];
export const levels=['Iniciante','Intermédio','Avançado'];
const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function rng(seed){let n=seed>>>0;return()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296}}
// Automatic targets are timing proposals, not an estimate of an individual's maximum.
export function repetitionTarget(exercise,work,level=1){
 if(exercise.execution!=='reps')return {reps:null,cadence:null,cluster:null};
 const profile=level===3?advancedRepProfile(exercise):null;
 const cadence=profile?.cadence||executionCadence(exercise,level);
 return {reps:profile?.cluster?clusterTarget(work,profile):Math.max(1,Math.min(profile?.cap||(level===3?90:60),Math.floor((work-6)/cadence))),cadence,cluster:profile?.cluster||null};
}
export function alternatives(exercise,config={},excluded=[]){return exercises.filter(e=>e.id!==exercise.id&&e.category===exercise.category&&e.primary.some(m=>exercise.primary.includes(m))&&e.difficulty<=(config.level||2)&&Math.abs(e.difficulty-exercise.difficulty)<=1&&(!config.lowImpact||e.impact==='low')&&!excluded.includes(e.id)&&(['warmup','cooldown'].includes(config.phase)||suitableForMain(e,config.level||2)))}
function distribute(block){
 if(block.format==='amrap'){block.items.forEach(i=>{i.sets=1;i.rest=0});return}
 const total=()=>block.items.reduce((n,i)=>n+(i.work+i.rest)*i.sets,0);
 let delta=block.target-total();
 // One second per set is redistributed only when all sets fit. Residual seconds are explicit recovery.
 const candidates=block.items.filter(i=>!i.locked);
 for(let pass=0;pass<180&&Math.abs(delta)>0;pass++){
 let changed=false;
 for(const i of candidates){if(delta>0&&delta<i.sets)continue;const sign=Math.sign(delta);const limit=block.customPacing?1200:block.format==='emom'?55:block.level===3||i.cluster?120:90;if(i.work+sign>=15&&i.work+sign<=limit){i.work+=sign;delta-=sign*i.sets;changed=true}}
 if(!changed)break;
 }
 for(const i of candidates){while(delta<0&&i.rest>5){i.rest--;delta+=i.sets}}
 if(delta<0)throw Error('Não é possível manter a duração com estes tempos e exercícios bloqueados. Reduz as séries ou desbloqueia outro exercício.');
 if(delta>Math.max(10,block.items.length*3))throw Error('Não é possível redistribuir este tempo dentro dos limites de execução. Reduz a duração do bloco ou adiciona séries.');
 block.tail=delta;
 if(block.format==='emom'){
 // Every occurrence occupies precisely one minute; editing changes the work/rest split.
 for(const i of block.items){if(i.work>55)throw Error('EMOM: execução máxima de 55 segundos.');i.rest=60-i.work}
 const used=block.items.reduce((s,i)=>s+60*i.sets,0);if(used>block.target)throw Error('As séries excedem os minutos disponíveis neste EMOM.');block.tail=block.target-used;
 }
}
export function rebuild(plan,{rebalance=false}={}){
 let at=0;const timeline=[];
 for(const block of plan.blocks){
 if(rebalance&&block.format!=='amrap'&&block.format!=='emom')distribute(block);
 const start=at;
 const add=(kind,duration,item,round)=>{if(duration<=0)return;const step={id:`s-${timeline.length}`,kind,duration,start:at,end:at+duration,blockId:block.id,blockName:block.name,exercise:item?.exercise||null,itemId:item?.id||null,round,sets:item?.sets||1,reps:kind==='work'?item?.reps||null:null,cadence:item?.cadence||3,cluster:kind==='work'?item?.cluster||null:null,format:block.format,...(item?.cadenceCustom?{cadenceCustom:true}:{})};timeline.push(step);at+=duration};
 if(block.format==='amrap')add('amrap',block.target,null,1);
 else{
 const maxSets=Math.max(...block.items.map(i=>i.sets));
 for(let round=1;round<=maxSets;round++)for(const item of block.items){if(round>item.sets)continue;add(block.type==='warmup'?'warmup':block.type==='cooldown'?'cooldown':'work',item.work,item,round);add('rest',item.rest,item,round)}
 add('transition',block.tail||0,null,1);
 }
 block.duration=at-start;block.start=start;block.end=at;
 }
 plan.timeline=timeline;plan.duration=at;
 if(at!==plan.config.minutes*60&&!plan.customPacing)throw Error(`A linha temporal tem ${at}s, mas foram pedidos ${plan.config.minutes*60}s.`);
 return plan;
}
export function generate(config={},state={},seed=Date.now()){
 config={minutes:30,level:1,modality:'Full Body',warmup:true,cooldown:3,lowImpact:false,preferFavorites:true,included:[],...config};
 if(!Number.isInteger(config.minutes)||config.minutes<10||config.minutes>180)throw Error('Escolhe uma duração entre 10 e 180 minutos inteiros.');
 if(![1,2,3].includes(config.level)||!modalities.includes(config.modality)||![0,2,3,5,10].includes(Number(config.cooldown)))throw Error('Configuração inválida.');
 const warm=config.warmup?300:0,cool=Number(config.cooldown)*60,main=config.minutes*60-warm-cool;
 if(main<180)throw Error('Reserva pelo menos 3 minutos para o treino principal. Reduz o retorno à calma ou aumenta a duração.');
 const random=rng(seed),used=new Set(),categoryUses=new Map(),patternUses=new Map(),excluded=state.excluded||[],recent=new Map();
 for(const session of (state.history||[]).slice(0,5))for(const b of session.plan.blocks)for(const i of b.items)recent.set(i.exercise.id,(recent.get(i.exercise.id)||0)+1);
 const pool=exercises.filter(e=>!excluded.includes(e.id)&&e.difficulty<=config.level&&(!config.lowImpact||e.impact==='low'));
 for(const id of config.included||[])if(config.level===3&&byId[id]&&!suitableForMain(byId[id],3))throw Error('O exercício incluído é de ativação ou não corresponde à exigência do bloco principal avançado.');
 for(const id of config.included||[])if(!pool.some(e=>e.id===id))throw Error('Um exercício incluído é incompatível com a dificuldade, o impacto ou as exclusões.');
 const pick=(cat,focus=null,phase='main')=>{
 let available=pool.filter(e=>(e.category===cat||(cat==='Aquecimento'&&trainingRole(e)==='activation'))&&(phase!=='main'||suitableForMain(e,config.level)));if(focus){const focused=available.filter(e=>focus.includes(e.id)||focus.includes(e.name));if(focused.length)available=focused;}if(!available.length)throw Error(`Sem exercícios disponíveis em «${cat}». Revê as exclusões.`);
 const occurrence=categoryUses.get(cat)||0;
 const preferred=cat==='Pernas e glúteos'?['agachar','anca','passada'][occurrence%3]:cat==='Ombros e braços'?['empurrar vertical','estabilização','cotovelo'][occurrence%3]:null;
 const focusRank=e=>focus?Math.max(0,focus.findIndex(id=>id===e.id||id===e.name)):0;
 const score=e=>focusRank(e)*5+(used.has(e.id)?100:0)+(preferred&&e.pattern!==preferred?20:0)+(patternUses.get(cat+e.pattern)||0)*2+(recent.get(e.id)||0)*6-((config.preferFavorites&&(state.favorites||[]).includes(e.id))?2:0)-(!used.has(e.id)&&(config.included||[]).includes(e.id)?200:0)+random()*4;
 const ranked=available.map(e=>({e,score:score(e)})).sort((a,b)=>a.score-b.score);const e=structuredClone(ranked[0].e);used.add(e.id);categoryUses.set(cat,occurrence+1);patternUses.set(cat+e.pattern,(patternUses.get(cat+e.pattern)||0)+1);return e;
 };
 let blockNo=0;
 function block(name,type,target,sequence,format='interval'){
 const count=format==='emom'?Math.min(6,Math.floor(target/60)):type==='main'?sequence.length:Math.max(2,Math.ceil(target/65));
 const sets=type==='main'&&format==='interval'?Math.max(1,Math.min(8,Math.ceil(target/(count*(config.level===3?95:65))))):1;
 const warmGroups=[[config.lowImpact?'ex-7-16':'ex-7-11'],['ex-7-05','ex-7-06','ex-7-12','ex-7-13'],(config.level===3?['ex-3-06','ex-7-03','ex-7-04','ex-7-15']:['ex-7-03','ex-7-04','ex-7-15']),['ex-7-07','ex-7-08','ex-7-09'],['ex-7-10','ex-7-12']];
 const pickSlot=j=>{const slot=sequence[j%sequence.length],cat=typeof slot==='string'?slot:slot.category,focus=type==='warmup'?warmGroups[j%warmGroups.length]:typeof slot==='string'?null:slot.focus;return pick(cat,focus,type)};
 const occurrences=type==='main'&&format==='interval'&&config.level===3?Math.min(count*8,Math.max(count,Math.ceil(target/130))):count*sets;
 const items=Array.from({length:count},(_,j)=>({id:uid(),exercise:pickSlot(j),sets:type==='main'&&format==='interval'&&config.level===3?Math.floor(occurrences/count)+(j<occurrences%count?1:0):sets,work:format==='emom'?(config.level===3?55:40):30,rest:type==='main'?(config.level===3?10:config.modality==='HIIT'?20:config.modality==='Força e resistência'?30:15):5,reps:type==='main'?8+config.level*2:null,cadence:3,locked:false}));
 for(const item of items)if(item.exercise.execution==='isometry'||item.exercise.execution==='time')item.reps=null;
 const b={id:`block-${++blockNo}`,name,type,target,format,items,tail:0,level:type==='main'?config.level:1};
 if(format==='amrap')items.forEach(i=>{i.reps=config.level===3?(i.exercise.execution==='reps'?advancedRepProfile(i.exercise).cluster.every*2:null):i.exercise.execution==='isometry'?null:8+config.level*2;i.work=config.level===3?60:30;i.rest=0});
 else if(format==='emom'){items.forEach((i,j)=>{i.sets=Math.floor(Math.floor(target/60)/count)+(j<Math.floor(target/60)%count?1:0);i.rest=60-i.work});b.tail=target-items.reduce((s,i)=>s+i.sets*60,0)}
 else distribute(b);
 for(const i of items)if(type==='main'&&format!=='amrap'){Object.assign(i,repetitionTarget(i.exercise,i.work,config.level));i.repsMode='auto'}
 return b;
 }
 const all=categories.slice(0,6),blocks=[];
 const strength=['Peito e tríceps','Pernas e glúteos','Costas e cadeia posterior','Ombros e braços','Abdominais e core'];
 const cardio=['Cardio e corpo inteiro','Abdominais e core','Cardio e corpo inteiro','Abdominais e core','Pernas e glúteos','Abdominais e core'];
 const hiit=['Cardio e corpo inteiro','Pernas e glúteos','Cardio e corpo inteiro','Abdominais e core','Peito e tríceps','Abdominais e core'];
 const advancedFull=config.level===3&&['Full Body','Treino misto','Circuito funcional'].includes(config.modality);
 const seq=config.modality==='Cardio e core'?cardio:config.modality==='HIIT'?hiit:config.modality==='Força e resistência'?strength:all;
 if(warm)blocks.push(block('Preparar o corpo','warmup',warm,Array(5).fill('Aquecimento')));
 if(config.modality==='EMOM'||config.modality==='AMRAP')blocks.push(block(config.modality==='EMOM'?'Cada minuto conta':'Ao teu ritmo','main',main,config.level===3?[...advancedWodSequence,'Costas e cadeia posterior','Ombros e braços']:all,config.modality==='EMOM'?'emom':'amrap'));
 else if(main>=900){
 const a=Math.floor(main*.3/60)*60,b=Math.floor(main*.4/60)*60,c=main-a-b;
 blocks.push(block(advancedFull?'A · WOD de resistência':'A · Força e controlo','main',a,advancedFull?advancedWodSequence:config.modality==='Cardio e core'?cardio:config.modality==='HIIT'?hiit:strength));
 blocks.push(block('B · Circuito funcional','main',b,seq));
 blocks.push(block('C · Cardio e core','main',c,config.modality==='Força e resistência'?strength:cardio));
 }else{blocks.push(block(advancedFull?'O teu WOD':'O teu circuito','main',main,advancedFull?[...advancedWodSequence,'Costas e cadeia posterior','Ombros e braços']:seq))}
 if(cool)blocks.push(block('Desacelerar','cooldown',cool,Array(5).fill('Retorno à calma')));
 const selected=new Set(blocks.flatMap(b=>b.items.map(i=>i.exercise.id)));for(const id of config.included||[])if(!selected.has(id))throw Error('Não há lugares suficientes para todos os exercícios incluídos. Reduz a seleção ou aumenta a duração.');
 const plan={id:uid(),name:`${config.modality} · ${config.minutes} min`,createdAt:new Date().toISOString(),config,blocks,seed,notes:'',favorite:false};
 return applySavedCadences(rebuild(plan),state.exerciseCadences);
}
function paceCapacity(item,level){
 if(!item.cadenceCustom)return repetitionTarget(item.exercise,item.work,level).reps;
 return item.cluster?clusterTarget(item.work,{cadence:item.cadence,cluster:item.cluster,cap:90}):Math.max(1,Math.floor((item.work-6)/item.cadence));
}
export function editItem(plan,blockId,itemId,patch){const copy=structuredClone(plan),b=copy.blocks.find(b=>b.id===blockId),i=b?.items.find(i=>i.id===itemId);if(!i)throw Error('Exercício não encontrado.');
 if(patch.exercise&&patch.exercise.id!==i.exercise.id){const allowed=alternatives(i.exercise,{...copy.config,phase:b.type},copy.config.excluded||[]);if(!allowed.some(e=>e.id===patch.exercise.id))throw Error('Substituição incompatível.');}
 const changedExercise=patch.exercise&&patch.exercise.id!==i.exercise.id;const explicitReps=Object.hasOwn(patch,'reps')&&patch.reps!==i.reps;Object.assign(i,patch);if(changedExercise)delete i.cadenceCustom;if(explicitReps){i.repsMode='manual';const profile=repetitionTarget(i.exercise,i.work,copy.config.level);if(!i.cadenceCustom){i.cluster=profile.cluster;i.cadence=profile.cadence;}}else if(i.repsMode==='auto'&&b.format!=='amrap')Object.assign(i,repetitionTarget(i.exercise,i.work,copy.config.level));if(i.exercise.execution==='isometry')i.reps=null;if(!Number.isInteger(i.sets)||i.sets<1||i.sets>8||!(copy.customPacing?Number.isFinite(i.work):Number.isInteger(i.work))||i.work<(copy.customPacing?1:15)||i.work>(copy.customPacing?1200:copy.config.level===3?120:90)||!Number.isInteger(i.rest)||i.rest<0||i.rest>60||i.reps!==null&&(!Number.isInteger(i.reps)||i.reps<1||i.reps>(copy.config.level===3?90:60)))throw Error(`Usa 1–8 séries, 15–${copy.config.level===3?120:90}s de execução, 0–60s de descanso e 1–${copy.config.level===3?90:60} repetições.`);
 if(i.reps&&b.format!=='amrap'&&i.reps>paceCapacity(i,copy.config.level))throw Error('Estas repetições não cabem no tempo com a cadência e as pausas previstas. Aumenta o tempo ou reduz as repetições.');
 if(b.format==='emom'){if(i.work>55)throw Error('EMOM: no máximo 55s de execução.');i.rest=60-i.work;b.tail=b.target-b.items.reduce((s,x)=>s+x.sets*60,0);if(b.tail<0)throw Error('As séries excedem o bloco EMOM.');}
 else if(b.format!=='amrap'){
 const locked=i.locked;i.locked=true;distribute(b);i.locked=locked;
 }
 for(const item of b.items)if(item.id!==i.id&&item.reps&&b.format!=='amrap'){if(item.repsMode==='auto')Object.assign(item,repetitionTarget(item.exercise,item.work,copy.config.level));else item.reps=Math.max(1,Math.min(item.reps,paceCapacity(item,copy.config.level)));}
 return rebuild(copy);
}
export function regenerateBlock(plan,blockId,state,seed=Date.now()){
 const candidate=generate(plan.config,state,seed),copy=structuredClone(plan),b=copy.blocks.find(x=>x.id===blockId),replacement=candidate.blocks.find(x=>x.id===blockId);
 if(b.format==='amrap'){b.items=b.items.map(i=>{if(i.locked)return i;const alts=alternatives(i.exercise,{...plan.config,phase:b.type},state.excluded||[]);return alts.length?{...i,exercise:structuredClone(alts[Math.abs(seed)%alts.length])}:i});return rebuild(copy)}
 const random=rng(seed);b.items=b.items.map(i=>{if(i.locked)return i;const alts=alternatives(i.exercise,{...plan.config,phase:b.type},state.excluded||[]);if(!alts.length)return i;const exercise=structuredClone(alts[Math.floor(random()*alts.length)]);return {...i,exercise,...(b.type==='main'&&i.repsMode==='auto'?repetitionTarget(exercise,i.work,copy.config.level):{})}});return rebuild(copy);
}
export function validateLibrary(){const ids=new Set();for(const e of exercises){if(ids.has(e.id)||!e.name||!e.instructions.length||!e.primary.length||!['low','high'].includes(e.impact))throw Error('Exercício inválido: '+e.id);ids.add(e.id);for(const id of [...e.easier,...e.harder])if(!byId[id])throw Error('Alternativa inexistente');}return true}

// Update only warmup references in reusable plans; preserve timing and performed session stages.
export function updateWarmupReferences(plan,{from=0,excluded=[]}={}){
 if(!plan)return plan;
 const copy=structuredClone(plan),changed=new Map();
 const walking=/caminhad|caminhar|marcha|walk|passos laterais de ativação|^Inchworm$/i;
 for(const b of copy.blocks)if(b.type==='warmup')for(const item of b.items){
  if(!walking.test(item.exercise.name))continue;
  const pending=copy.timeline?.some(s=>s.itemId===item.id&&s.kind==='warmup'&&s.end>from);
  if(!pending)continue;
  const preferred=['ex-7-02','ex-7-07'].includes(item.exercise.id)?item.exercise.id:copy.config.lowImpact?'ex-7-16':'ex-7-11';
  const replacement=byId[preferred];
  const pool=exercises.filter(e=>e.category==='Aquecimento'&&!walking.test(e.name)&&!excluded.includes(e.id)&&e.difficulty<=copy.config.level&&(!copy.config.lowImpact||e.impact==='low'));
  const chosen=pool.find(e=>e.id===replacement.id)||pool[0];
  if(!chosen)throw Error('Sem alternativas de aquecimento compatíveis com as exclusões.');
  item.exercise=structuredClone(chosen);changed.set(item.id,item.exercise);
 }
 for(const step of copy.timeline||[])if(changed.has(step.itemId)&&step.end>from)step.exercise=structuredClone(changed.get(step.itemId));
 return copy;
}

export function updateRepetitionTargets(plan,{from=0}={}){
 if(!plan)return plan;
 const copy=structuredClone(plan);
 for(const b of copy.blocks)if(b.type==='main'&&b.format!=='amrap')for(const item of b.items){
  if(item.exercise.execution!=='reps'||item.cadenceCustom)continue;
  const pending=copy.timeline.filter(s=>s.itemId===item.id&&s.kind==='work'&&s.start>=from);
  if(!pending.length)continue;
  const manual=item.repsMode==='manual',target=repetitionTarget(item.exercise,item.work,copy.config.level);
  Object.assign(item,{...target,reps:manual?Math.min(item.reps,target.reps):target.reps,repsMode:manual?'manual':'auto'});
  for(const step of pending){const next=repetitionTarget(step.exercise,step.duration,copy.config.level);Object.assign(step,{...next,reps:manual?Math.min(step.reps,next.reps):next.reps});}
 }
 return copy;
}
