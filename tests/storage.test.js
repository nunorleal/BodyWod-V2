import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore,emptyState,encodeState,decodeState} from '../src/storage.js';
import {generate} from '../src/generator.js';
import {SessionClock} from '../src/timer.js';
const memory=()=>{const entries=new Map();return {getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)}};
test('compact snapshots reduce a real advanced workout and restore every field independently',()=>{
 const state=emptyState(),plan=generate({minutes:60,level:3},{},42);
 state.lastPlan=structuredClone(plan);state.saved=[structuredClone(plan)];state.session=new SessionClock(plan).serialize();
 state.history=Array.from({length:10},(_,i)=>({id:String(i),plan:structuredClone(plan),notes:'Treino '+i}));
 state.history[1].plan.name='Versão diferente';
 const raw=encodeState(state),full=JSON.stringify(state);
 assert.ok(raw.length<full.length*.3,`${raw.length} vs ${full.length}`);
 const restored=decodeState(raw);assert.deepEqual(restored,state);
 restored.history[0].plan.timeline[0].exercise.name='Alterado';
 assert.notEqual(restored.saved[0].timeline[0].exercise.name,'Alterado');
 assert.notEqual(restored.history[2].plan.timeline[0].exercise.name,'Alterado');
});
test('legacy data migrate on first successful write, without deleting history',()=>{
 const storage=memory(),state=emptyState();state.history=[{id:'old',notes:'Preservar'}];storage.setItem('bodywod.v1',JSON.stringify(state));
 const store=createStore(storage);assert.equal(store.update(s=>s.favorites.push('new')),true);
 assert.equal(JSON.parse(storage.getItem('bodywod.v1')).format,'bodywod.compact.v1');
 assert.deepEqual(createStore(storage).state.history,state.history);
 assert.equal(JSON.parse(store.export()).version,1);assert.ok(!JSON.parse(store.export()).format);
});
test('quota failure keeps the live session, previous durable data and latest changes for retry/export',()=>{
 const storage=memory(),store=createStore(storage);store.update(s=>s.favorites.push('old'));
 const durable=storage.getItem('bodywod.v1'),set=storage.setItem;storage.setItem=()=>{throw new DOMException('full','QuotaExceededError')};
 assert.equal(store.update(s=>{s.favorites.push('new');s.session={elapsed:55}}),false);
 assert.equal(storage.getItem('bodywod.v1'),durable);assert.match(store.warning,/espaço/);assert.equal(store.status.errorName,'QuotaExceededError');
 assert.equal(JSON.parse(store.export()).session.elapsed,55);assert.deepEqual(store.state.favorites,['old','new']);
 storage.setItem=set;assert.equal(store.retry(),true);assert.equal(store.warning,'');assert.equal(store.status.persistent,true);
 assert.equal(createStore(storage).state.session.elapsed,55);
});
test('blocked storage reports permission failure without claiming persistence',()=>{
 const store=createStore({getItem:()=>null,setItem:()=>{throw new DOMException('blocked','SecurityError')}});
 assert.equal(store.update(s=>s.favorites.push('a')),false);assert.match(store.warning,/bloqueou/);assert.equal(store.status.persistent,false);
});
test('a throwing localStorage getter is caught, and unreadable existing data are never overwritten',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 try{Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}});const store=createStore();assert.equal(store.status.readFailed,true);assert.equal(store.update(s=>s.favorites.push('a')),false);assert.deepEqual(store.state.favorites,['a'])}
 finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage}
 let writes=0;const store=createStore({getItem:()=>'{bad JSON',setItem:()=>{writes++}});
 assert.equal(store.retry(),false);store.update(s=>s.favorites.push('new'));assert.equal(writes,0);assert.match(store.warning,/não serão substituídos/);
});
test('malformed compact references and legacy arrays are rejected without retaining partial state',()=>{
 assert.throws(()=>decodeState(JSON.stringify({format:'bodywod.compact.v1',root:[0],nodes:[{loop:[0]}]})));
 const store=createStore({getItem:()=>JSON.stringify({...emptyState(),saved:null}),setItem:()=>assert.fail('must not overwrite')});
 assert.deepEqual(store.state.saved,[]);assert.equal(store.status.readFailed,true);
});
test('a quota which rejects the old full snapshot accepts compact workout checkpoints',()=>{
 const state=emptyState(),plan=generate({minutes:60,level:3},{},9);state.lastPlan=plan;state.saved=[structuredClone(plan)];state.session=new SessionClock(plan).serialize();
 const limit=Math.floor(JSON.stringify(state).length/2),storage=memory(),set=storage.setItem;
 storage.setItem=(k,v)=>{if(v.length>limit)throw new DOMException('full','QuotaExceededError');set(k,v)};
 assert.throws(()=>storage.setItem('bodywod.v1',JSON.stringify(state)));
 const store=createStore(storage);assert.equal(store.update(s=>Object.assign(s,state)),true);
 assert.deepEqual(createStore(storage).state.session,state.session);
});
test('checkpoint failures back off while keeping the newest in-memory progress',()=>{
 let attempts=0;const store=createStore({getItem:()=>null,setItem:()=>{attempts++;throw new DOMException('full','QuotaExceededError')}});
 store.update(s=>s.session={elapsed:2});store.update(s=>s.session.elapsed=4);store.update(s=>s.session.elapsed=6);
 assert.equal(attempts,1);assert.equal(JSON.parse(store.export()).session.elapsed,6);assert.equal(store.retry(),false);assert.equal(attempts,2);
});
