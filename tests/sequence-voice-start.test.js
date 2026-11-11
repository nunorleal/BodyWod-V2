import test from 'node:test';
import assert from 'node:assert/strict';
import {createSequenceUI} from '../src/sequence-ui.js';
import {emptySequences,sequenceItem} from '../src/sequences.js';

test('editing saved lunges updates the reopened plan and starts its new counts before beep activation finishes',async()=>{
 const names=['document','window','navigator','speechSynthesis','SpeechSynthesisUtterance','AudioContext','requestAnimationFrame','cancelAnimationFrame'];
 const old=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 const spoken=[],listeners={},fields=new Map();let resolveAudio,activationFinished=false,inTap=true;
 const set=(name,value)=>Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 const root={isConnected:true,innerHTML:'',scrollIntoView(){},querySelectorAll:()=>[],addEventListener:(name,fn)=>{listeners[name]=fn},querySelector(selector){if(!fields.has(selector))fields.set(selector,{textContent:'',innerHTML:'',value:0,querySelectorAll:()=>[]});return fields.get(selector)}};
 try{
 set('document',{hidden:false,addEventListener(){}});set('window',{addEventListener(){}});set('navigator',{});
 set('requestAnimationFrame',()=>1);set('cancelAnimationFrame',()=>{});
 set('SpeechSynthesisUtterance',class{constructor(text){this.text=text}});
 set('speechSynthesis',{getVoices:()=>[{name:'Joana',lang:'pt-PT',localService:true}],resume(){},cancel(){},addEventListener(){},speak(u){assert.equal(inTap,true,'native speech needs to be requested in the initiating tap');assert.equal(activationFinished,false);spoken.push(u)}});
 set('AudioContext',class{constructor(){this.state='suspended'}addEventListener(){}resume(){return new Promise(resolve=>{resolveAudio=()=>{activationFinished=true;this.state='running';resolve()}})}suspend(){this.state='suspended';return Promise.resolve()}});
 const data=emptySequences();data.draft.items=[{...sequenceItem('ex-2-11'),reps:10,sets:1,rest:0}];data.plans=[structuredClone(data.draft)];
 const store={state:{fittempoSequences:data,preferences:{voice:true,voiceVolume:1}}};
 const ui=createSequenceUI({store,save:fn=>fn(store.state),toast(){},showExercise(){}});ui.mount(root);
 const savedId=data.plans[0].id,itemId=data.plans[0].items[0].id;
 const open=()=>listeners.click({target:{closest:()=>({dataset:{seq:'load',id:savedId}})}});
 await open();
 for(const [field,value] of [['reps','5'],['sets','2']])listeners.change({type:'change',target:{dataset:{field},value,closest:()=>({dataset:{item:itemId}}),checkValidity:()=>true}});
 await open();
 assert.equal(data.draft.items[0].reps,5);assert.equal(data.draft.items[0].sets,2);
 const click=listeners.click({target:{closest:()=>({dataset:{seq:'start'}})}});
 assert.equal(spoken.length,1,'the first instruction must not wait for AudioContext.resume');
 assert.match(spoken[0].text,/Série um de dois. cinco repetições/);
 inTap=false;resolveAudio();await click;
 assert.equal(activationFinished,true);
 assert.equal(data.session.plan.items[0].reps,5);assert.equal(data.session.plan.items[0].sets,2);
 ui.suspend();
 }finally{for(const name of names){if(old[name])Object.defineProperty(globalThis,name,old[name]);else delete globalThis[name]}}
});

test('rest announces the next movement while time runs and zero starts work without waiting for speech events',async()=>{
 const names=['document','window','navigator','performance','speechSynthesis','SpeechSynthesisUtterance','AudioContext','requestAnimationFrame','cancelAnimationFrame'];
 const old=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 const spoken=[],listeners={},fields=new Map();let now=0,nextFrame;
 const set=(name,value)=>Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 const root={isConnected:true,innerHTML:'',scrollIntoView(){},querySelectorAll:()=>[],addEventListener:(name,fn)=>{listeners[name]=fn},querySelector(selector){if(!fields.has(selector))fields.set(selector,{textContent:'',innerHTML:'',value:0,querySelectorAll:()=>[]});return fields.get(selector)}};
 let ui;
 try{
 set('document',{hidden:false,addEventListener(){}});set('window',{addEventListener(){}});set('navigator',{});set('performance',{now:()=>now});
 set('requestAnimationFrame',fn=>{nextFrame=fn;return 1});set('cancelAnimationFrame',()=>{});
 set('SpeechSynthesisUtterance',class{constructor(text){this.text=text}});
 set('speechSynthesis',{getVoices:()=>[{name:'Joana',lang:'pt-PT',localService:true}],resume(){},cancel(){},addEventListener(){},speak:u=>spoken.push(u)});
 set('AudioContext',class{constructor(){this.state='running'}addEventListener(){}async resume(){}async suspend(){this.state='suspended'}});
 const data=emptySequences();data.draft.items=[{...sequenceItem('ex-1-01'),reps:1,sets:1,rest:5},{...sequenceItem('ex-6-01'),reps:1,sets:1,rest:0}];data.cadences={'ex-1-01':1,'ex-6-01':1};
 const store={state:{fittempoSequences:data,preferences:{voice:true,voiceVolume:1,beeps:false}}};
 ui=createSequenceUI({store,save:fn=>fn(store.state),toast(){},showExercise(){}});ui.mount(root);
 await listeners.click({target:{closest:()=>({dataset:{seq:'start'}})}});
 spoken[0].onend();assert.equal(spoken[1].text,'Começa.');spoken[1].onstart();spoken[1].onend();
 now=1000;nextFrame();
 assert.match(spoken.at(-1).text,/A seguir: bârpis/);
 assert.equal(fields.get('#sequence-phase').textContent,'Descanso');
 // Do not deliver any voice completion: the clock must keep running anyway.
 now=2000;nextFrame();assert.equal(fields.get('#sequence-stage-clock').textContent,'00:04');
 now=5000;nextFrame();assert.equal(fields.get('#sequence-stage-clock').textContent,'00:01');
 now=6000;nextFrame();
 assert.equal(spoken.at(-1).text,'Começa.');
 assert.equal(fields.get('#sequence-exercise').textContent,'Burpees');
 assert.equal(fields.get('#sequence-phase').textContent,'Em movimento');
 const progressAtZero=fields.get('#sequence-progress').value;
 now=6250;nextFrame();assert.ok(fields.get('#sequence-progress').value>progressAtZero,'next exercise time runs before Começa onstart or onend');
 const beforePace=fields.get('#sequence-progress').value;
 await listeners.click({target:{closest:()=>({dataset:{seq:'pace',direction:'faster'}})}});
 assert.equal(store.state.fittempoSequences.cadences['ex-6-01'],.9);
 assert.equal(store.state.fittempoSequences.session.paceChanges.length,1);
 assert.equal(fields.get('#sequence-pace-value').textContent,'0,9 s / rep.');
 assert.ok(fields.get('#sequence-progress').value>=beforePace);

 }finally{ui?.suspend();for(const name of names){if(old[name])Object.defineProperty(globalThis,name,old[name]);else delete globalThis[name]}}
});
