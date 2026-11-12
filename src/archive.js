import {createStore,decodeState,emptyState} from './storage.js';

const archiveStoreName='snapshots',archiveKey='current';

function openArchive(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('bodywod-data',1);
  let blocked=false;
  request.onblocked=()=>{blocked=true;reject(Error('A base de dados está bloqueada.'))};
  request.onupgradeneeded=()=>request.result.createObjectStore(archiveStoreName);
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{
   const database=request.result;
   if(blocked){database.close();return}
   database.onversionchange=()=>database.close();
   resolve(database);
  };
 });
}

function readArchive(database){
 return new Promise((resolve,reject)=>{
  const transaction=database.transaction(archiveStoreName,'readonly');
  const request=transaction.objectStore(archiveStoreName).get(archiveKey);
  transaction.oncomplete=()=>resolve(request.result);
  transaction.onabort=()=>reject(transaction.error);
 });
}

function writeArchive(database,revision,json){
 return new Promise((resolve,reject)=>{
  const transaction=database.transaction(archiveStoreName,'readwrite');
  const snapshots=transaction.objectStore(archiveStoreName);
  const request=snapshots.get(archiveKey);
  const nextRevision=(revision??0)+1;
  let conflict=false;
  request.onsuccess=()=>{
   if(request.result?.revision!==revision){conflict=true;transaction.abort();return}
   snapshots.put({revision:nextRevision,json},archiveKey);
  };
  transaction.oncomplete=()=>resolve(nextRevision);
  transaction.onabort=()=>reject(conflict
   ? new DOMException('Os dados foram alterados noutra janela.','InvalidStateError')
   : transaction.error);
 });
}

export async function openWorkoutStore(migrate){
 let database,record;
 try{
  database=await openArchive();
  record=await readArchive(database);
 }catch{
  database?.close();
  return createStore();
 }

 let state,revision=record?.revision,warning='',errorName='',pending=null,dirty=false,readFailed=false,retryAfter=0;
 if(record){
  try{
   state=decodeState(record.json);
   if(state.version!==1||['favorites','excluded','saved','history'].some(key=>!Array.isArray(state[key])))throw Error('Dados inválidos');
   state.preferences={...emptyState().preferences,...state.preferences};
  }catch(error){
   state=createStore().state;
   readFailed=true;
   errorName=error.name;
   warning='Não foi possível ler os dados guardados. Guarda um ficheiro JSON com as alterações desta sessão.';
  }
 }else{
  const legacy=createStore();
  state=legacy.state;
  if(legacy.warning)warning=legacy.warning;
  migrate(state);
  if(legacy.status.bytes||state.fittempo){
   dirty=true;
   await persist();
  }
 }

 async function writePending(){
  try{
   while(dirty){
    dirty=false;
    revision=await writeArchive(database,revision,JSON.stringify(state));
   }
   warning='';errorName='';retryAfter=0;
   return true;
  }catch(error){
   dirty=true;
   errorName=error?.name||'Error';
   retryAfter=Date.now()+30000;
   warning=errorName==='InvalidStateError'
    ? 'A gravação foi interrompida. Guarda um ficheiro JSON antes de voltares a abrir a aplicação.'
    : 'Não foi possível guardar neste navegador. Guarda um ficheiro JSON para recuperares os dados mais tarde.';
   return false;
  }
 }

 function persist(){
  if(readFailed)return Promise.resolve(false);
  pending??=writePending().finally(()=>{pending=null});
  return pending;
 }

 return {
  get state(){return state},
  get warning(){return warning},
  get status(){return {persistent:!warning&&!dirty&&!pending,readFailed,errorName}},
  update(change){
   const next=structuredClone(state);
   change(next);
   state=next;
   dirty=true;
   return Date.now()<retryAfter?Promise.resolve(false):persist();
  },
  retry(){dirty=true;return persist()}
 };
}
