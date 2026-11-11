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
 if(raw.startsWith(storageCompressionPrefix))raw=expandStorage(raw.slice(storageCompressionPrefix.length));
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
const storageCompressionPrefix='bodywod.lz.v1:';
const referenceBase=90,referenceOffset=32,matchMinimum=6,matchMaximum=matchMinimum+referenceBase-1;
const windowSize=referenceBase*referenceBase;

// A reference is ~ followed by three printable characters: length and two
// distance digits. ~~ represents a literal tilde. Other text is unchanged.
function compressStorage(raw){
 const previous=new Int32Array(65536).fill(-1),chunks=[];
 let literalStart=0;
 for(let pos=0;pos<=raw.length-matchMinimum;){
  const hash=(raw.charCodeAt(pos)*251+raw.charCodeAt(pos+1)*31+raw.charCodeAt(pos+2)*7+raw.charCodeAt(pos+3))&65535;
  const start=previous[hash],distance=pos-start;
  previous[hash]=pos;
  let length=0;
  if(start>=0&&distance<=windowSize){
   const limit=Math.min(matchMaximum,raw.length-pos);
   while(length<limit&&raw[start+length]===raw[pos+length])length++;
  }
  if(length<matchMinimum){pos++;continue}
  chunks.push(raw.slice(literalStart,pos).replaceAll('~','~~'),'~',String.fromCharCode(
   referenceOffset+length-matchMinimum,
   referenceOffset+Math.floor((distance-1)/referenceBase),
   referenceOffset+(distance-1)%referenceBase
  ));
  pos+=length;literalStart=pos;
 }
 chunks.push(raw.slice(literalStart).replaceAll('~','~~'));
 return storageCompressionPrefix+chunks.join('');
}
function expandStorage(raw){
 const window=new Uint16Array(windowSize),chunks=[];
 let written=0,pos=0;
 while(pos<raw.length){
  const marker=raw.indexOf('~',pos);
  const end=marker===-1?raw.length:marker;
  if(end>pos){
   chunks.push(raw.slice(pos,end));
   for(;pos<end;pos++)window[written++%windowSize]=raw.charCodeAt(pos);
  }
  if(marker===-1)break;
  if(raw[pos+1]==='~'){
   window[written++%windowSize]=126;chunks.push('~');pos+=2;continue;
  }
  const length=raw.charCodeAt(pos+1)-referenceOffset;
  const high=raw.charCodeAt(pos+2)-referenceOffset,low=raw.charCodeAt(pos+3)-referenceOffset;
  const distance=high*referenceBase+low+1;
  if(pos+3>=raw.length||[length,high,low].some(digit=>digit<0||digit>=referenceBase)||distance>written)throw Error('Referência comprimida inválida');
  let match='';
  for(let i=0;i<length+matchMinimum;i++){
   const unit=window[(written-distance)%windowSize];
   window[written++%windowSize]=unit;
   match+=String.fromCharCode(unit);
  }
  chunks.push(match);pos+=4;
 }
 return chunks.join('');
}
function isQuotaError(error){
 return error?.name==='QuotaExceededError'||error?.name==='NS_ERROR_DOM_QUOTA_REACHED'||error?.code===22||error?.code===1014;
}
function storageMessage(error){
 if(isQuotaError(error))return 'O espaço disponível para este site foi atingido. O treino continua em memória. Exporta os dados antes de fechar e volta a tentar guardar.';
 if(error?.name==='SecurityError'||error?.name==='NotAllowedError')return 'O navegador bloqueou a gravação neste site. O treino continua em memória. Exporta os dados antes de fechar e verifica as permissões do site.';
 return 'A gravação no navegador falhou. O treino continua em memória. Exporta os dados antes de fechar e volta a tentar guardar.';
}
export function createStore(storage){
 const key='bodywod.v1';let state=emptyState(),warning='',readFailed=false,persistent=true,bytes=0,errorName='',retryAfter=0,compressed=false;
 try{
  // Access to the localStorage property itself may throw in restricted browsers.
  if(storage===undefined)storage=globalThis.localStorage;
  const raw=storage.getItem(key);
  if(raw){
   const data=decodeState(raw);
   if(data.version!==1)throw Error('Versão não reconhecida');
   for(const k of ['favorites','excluded','saved','history'])if(!Array.isArray(data[k]))throw Error('Dados inválidos');
   state={...state,...data,preferences:{...state.preferences,...data.preferences}};bytes=raw.length*2;compressed=raw.startsWith(storageCompressionPrefix);
  }
 }catch(error){
  readFailed=true;persistent=false;errorName=error.name||'Error';
  warning='Não foi possível ler os dados deste navegador. Os dados existentes não serão substituídos. Exporta as alterações desta sessão e volta a abrir a página para tentar recuperar os dados guardados.';
 }
 function persist(){
  if(readFailed)return false;
  try{
   const compact=encodeState(state);
   let raw=compact;
   if(compressed){
    const candidate=compressStorage(compact);
    if(candidate.length<raw.length)raw=candidate;
   }
   try{storage.setItem(key,raw)}
   catch(error){
    if(!isQuotaError(error)||compressed)throw error;
    const candidate=compressStorage(compact);
    if(candidate.length>=raw.length)throw error;
    storage.setItem(key,candidate);raw=candidate;
   }
   compressed=raw.startsWith(storageCompressionPrefix);
   bytes=raw.length*2;warning='';errorName='';persistent=true;retryAfter=0;return true;
  }
  catch(error){errorName=error.name||'Error';warning=storageMessage(error);persistent=false;retryAfter=Date.now()+30000;return false}
 }
 return {get state(){return state},get warning(){return warning},get status(){return {persistent,bytes,errorName,readFailed}},
  update(fn){const next=structuredClone(state);fn(next);state=next;if(Date.now()<retryAfter)return false;return persist()},
  retry:persist,
  export(){return JSON.stringify(state,null,2)}
 };
}
