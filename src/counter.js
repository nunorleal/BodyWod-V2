import {COUNTER_DOCUMENT} from './counter-document.js';
export function showCounterPanel(panel,visible){
 panel.hidden=!visible;
 if(!visible){pauseCounterPanel(panel);return}
 if(!panel.querySelector('iframe')){
  const frame=document.createElement('iframe');frame.title='Contador de repetições — FitTempo';frame.id='counter-frame';frame.srcdoc=COUNTER_DOCUMENT;frame.setAttribute('allow','autoplay; screen-wake-lock');panel.append(frame);
 }
}
export function pauseCounterPanel(panel){panel.querySelector('iframe')?.contentWindow?.postMessage({type:'bodywod-counter',action:'pause'},'*')}
export function counterCommand(panel,action,settings){panel.querySelector('iframe')?.contentWindow?.postMessage({type:'bodywod-counter',action,settings},'*')}
// Read the live counter, including memory-only history when browser storage failed.
export function requestCounterBackup(panel){
 const frame=panel.querySelector('iframe');if(!frame)return Promise.resolve(null);
 return new Promise((resolve,reject)=>{
  const requestId=globalThis.crypto?.randomUUID?.()||String(Date.now()+Math.random());
  const timer=setTimeout(()=>{window.removeEventListener('message',receive);reject(Error('O FitTempo não respondeu. Tenta exportar novamente.'))},5000);
  function receive(event){if(event.source!==frame.contentWindow||event.data?.type!=='bodywod-counter-backup'||event.data.requestId!==requestId)return;clearTimeout(timer);window.removeEventListener('message',receive);resolve(event.data.data)}
  window.addEventListener('message',receive);frame.contentWindow.postMessage({type:'bodywod-counter-data',action:'get',requestId},'*');
 });
}
export function restoreCounterBackup(panel,data){panel.querySelector('iframe')?.contentWindow?.postMessage({type:'bodywod-counter-data',action:'restore',data},'*')}
