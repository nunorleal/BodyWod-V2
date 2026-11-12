import fs from 'node:fs';
import {buildCounter} from './counter-assets.mjs';
buildCounter();
const files=['version','counter-document','counter','exercises','storage','archive','backup','timer','training','pace','generator','audio','anatomy','movement','sequences','celebration','sequence-drag','sequence-ui','app'];
let js=files.map(name=>fs.readFileSync(`src/${name}.js`,'utf8').replace(/^import .+;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
js=js.replaceAll('</script','<\\/script');
const css=fs.readFileSync('styles.css','utf8')+'\n'+fs.readFileSync('src/celebration.css','utf8');
let html=fs.readFileSync('src/shell.html','utf8').replace('<link rel="stylesheet" href="styles.css">',`<style>${css}</style>`).replace('<script type="module" src="src/app.js"></script>',`<script>(()=>{\n${js}\n})();</script>`);
html=html.replace('<!-- workout-celebration -->',fs.readFileSync('src/counter/celebration.html','utf8'));
// Keep manifest and PNG icon links relative for project-based GitHub Pages URLs.
fs.writeFileSync('BodyWOD.html',html);
fs.writeFileSync('index.html',html);
console.log(`BodyWOD.html: ${Math.round(Buffer.byteLength(html)/1024)} KB, sem dependências externas.`);

const version=fs.readFileSync('src/version.js','utf8').match(/APP_VERSION='([^']+)'/)[1];
const worker=fs.readFileSync('sw.js','utf8').replace(/const CACHE='[^']+';/,`const CACHE='bodywod-v${version}';`);
fs.writeFileSync('sw.js',worker);
