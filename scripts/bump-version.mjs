import fs from 'node:fs';
const path='src/version.js',source=fs.readFileSync(path,'utf8');
const match=source.match(/APP_VERSION='(\d+)\.(\d+)'/);
if(!match)throw Error('Versão inválida em src/version.js');
const next=`${match[1]}.${String(Number(match[2])+1).padStart(2,'0')}`;
fs.writeFileSync(path,source.replace(match[0],`APP_VERSION='${next}'`));
await import('./bundle.mjs');
console.log(`Versão ${next}`);
