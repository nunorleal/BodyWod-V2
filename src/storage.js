export const emptyState=()=>({version:1,preferences:{voiceMode:'full',voice:true,beeps:true,voiceVolume:.85,beepVolume:.35,voiceURI:'',advanceWarning:true},exerciseCadences:{},favorites:[],excluded:[],saved:[],history:[],session:null,lastPlan:null});

// Intern equal JSON subtrees, including repeated exercise and plan snapshots.
// Resolve each reference independently on read so historical records stay independent.
export function encodeState(state){
 const nodes=[],known=new Map();
 function pack(value){
  if(value===null||typeof value!=='object')return value;
  const node=Array.isArray(value)?value.map(pack):Object.fromEntries(Object.entries(value).map(([k,v])=>[k,pack(v)]));
  const signature=JSON.stringify(node);
  if(!known.has(signature)){known.set(signature,nodes.length);nodes.push(node)}
  return [known.get(signature)];
 }
 const root=pack(JSON.parse(JSON.stringify(state)));
 return JSON.stringify({format:'bodywod.compact.v1',root,nodes});
}
export function decodeState(raw){
 const data=JSON.parse(raw);
 if(data.format!=='bodywod.compact.v1')return data;
 if(!Array.isArray(data.nodes))throw Error('Dados inválidos');
 function unpack(value,depth=0){
  if(!Array.isArray(value))return value;
  const id=value[0];
  if(value.length!==1||!Number.isInteger(id)||id<0||id>=data.nodes.length||depth>100)throw Error('Referência inválida');
  const node=data.nodes[id];
  if(!node||typeof node!=='object')throw Error('Dados inválidos');
  return Array.isArray(node)?node.map(v=>unpack(v,depth+1)):Object.fromEntries(Object.entries(node).map(([k,v])=>[k,unpack(v,depth+1)]));
 }
 return unpack(data.root);
}
function storageMessage(error){
 if(error?.name==='QuotaExceededError'||error?.name==='NS_ERROR_DOM_QUOTA_REACHED'||error?.code===22||error?.code===1014)return 'O espaço disponível para este site foi atingido. O treino continua em memória. Exporta os dados antes de fechar e volta a tentar guardar.';
 if(error?.name==='SecurityError'||error?.name==='NotAllowedError')return 'O navegador bloqueou a gravação neste site. O treino continua em memória. Exporta os dados antes de fechar e verifica as permissões do site.';
 return 'A gravação no navegador falhou. O treino continua em memória. Exporta os dados antes de fechar e volta a tentar guardar.';
}
export function createStore(storage){
 const key='bodywod.v1';let state=emptyState(),warning='',readFailed=false,persistent=true,bytes=0,errorName='',retryAfter=0;
 try{
  // Access to the localStorage property itself may throw in restricted browsers.
  if(storage===undefined)storage=globalThis.localStorage;
  const raw=storage.getItem(key);
  if(raw){
   const data=decodeState(raw);
   if(data.version!==1)throw Error('Versão não reconhecida');
   for(const k of ['favorites','excluded','saved','history'])if(!Array.isArray(data[k]))throw Error('Dados inválidos');
   state={...state,...data,preferences:{...state.preferences,...data.preferences}};bytes=raw.length*2;
  }
 }catch(error){
  readFailed=true;persistent=false;errorName=error.name||'Error';
  warning='Não foi possível ler os dados deste navegador. Os dados existentes não serão substituídos. Exporta as alterações desta sessão e volta a abrir a página para tentar recuperar os dados guardados.';
 }
 function persist(){
  if(readFailed)return false;
  try{const raw=encodeState(state);storage.setItem(key,raw);bytes=raw.length*2;warning='';errorName='';persistent=true;retryAfter=0;return true}
  catch(error){errorName=error.name||'Error';warning=storageMessage(error);persistent=false;retryAfter=Date.now()+30000;return false}
 }
 return {get state(){return state},get warning(){return warning},get status(){return {persistent,bytes,errorName,readFailed}},
  update(fn){const next=structuredClone(state);fn(next);state=next;if(Date.now()<retryAfter)return false;return persist()},
  retry:persist,
  export(){return JSON.stringify(state,null,2)}
 };
}
