import test from 'node:test';
import assert from 'node:assert/strict';
import {automaticSeriesProgress,paintSeriesProgress} from '../src/counter/progress.js';
const model=()=>({automatic:true,interval:3000,nextAt:6000,startedAt:0});
test('three-second series fills in proportion to the actual counter deadline',()=>{
 const m=model();assert.equal(automaticSeriesProgress(m,3000),0);assert.equal(automaticSeriesProgress(m,4500),.5);assert.equal(automaticSeriesProgress(m,6000),1);
 m.nextAt=9000;assert.equal(automaticSeriesProgress(m,6000),0);assert.equal(automaticSeriesProgress(m,7500),.5);
});
test('manual mode and calibration have no fabricated progress, and values remain bounded',()=>{
 assert.equal(automaticSeriesProgress({...model(),automatic:false},4500),null);assert.equal(automaticSeriesProgress({...model(),interval:null},4500),null);assert.equal(automaticSeriesProgress({...model(),interval:0},4500),null);
 assert.equal(automaticSeriesProgress(model(),0),0);assert.equal(automaticSeriesProgress(model(),10000),1);assert.equal(automaticSeriesProgress(model(),NaN),null);
});
test('tile fill, accessible progress and percentage freeze on pause and clear on reset',()=>{
 const prior=globalThis.document,css={},attrs={},classes={},tile={dataset:{},style:{setProperty:(k,v)=>css[k]=v},classList:{toggle:(k,v)=>classes[k]=v}},label={},meter={setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k]};
 try{
  globalThis.document={getElementById:id=>({manualTap:tile,seriesFillLabel:label,seriesFillProgress:meter})[id]};
  const m=model();paintSeriesProgress(m,4500);assert.equal(css['--series-progress'],'0.5');assert.equal(label.textContent,'50% da série');assert.equal(attrs['aria-valuenow'],'50');assert.equal(classes['has-series-progress'],true);
  m.startedAt=null;paintSeriesProgress(m,4500);assert.equal(css['--series-progress'],'0.5');assert.equal(css['--series-fill-transition'],'none');
  m.nextAt=9000;m.startedAt=6000;paintSeriesProgress(m,6000);assert.equal(css['--series-progress'],'0');assert.equal(css['--series-fill-transition'],'none');
  m.interval=null;paintSeriesProgress(m,6000);assert.equal(label.hidden,true);assert.equal(meter.hidden,true);assert.equal(classes['has-series-progress'],false);
 }finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior}
});
