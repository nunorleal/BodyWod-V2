import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {APP_VERSION} from '../src/version.js';
test('both Mac file entrypoints contain the complete app without module/file dependencies',()=>{
 const index=fs.readFileSync('index.html','utf8'),standalone=fs.readFileSync('BodyWOD.html','utf8');
 assert.equal(index,standalone);
 for(const html of [index,standalone]){
  assert.ok(!/<script[^>]+(?:src=|type="module")/.test(html));
  assert.ok(!/<link[^>]+rel="stylesheet"/.test(html));
  assert.ok(html.includes('function createStore('));assert.ok(html.includes('function render('));
  assert.ok(html.includes(`APP_VERSION='${APP_VERSION}'`));
  const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);
  assert.doesNotThrow(()=>new vm.Script(script));
 }
});
test('development template stays separate from generated entrypoints',()=>{
 const shell=fs.readFileSync('src/shell.html','utf8');assert.ok(shell.includes('<script type="module" src="src/app.js"></script>'));
 const builder=fs.readFileSync('scripts/bundle.mjs','utf8');assert.ok(builder.includes("readFileSync('src/shell.html'"));assert.ok(!builder.includes("readFileSync('index.html'"));
});
