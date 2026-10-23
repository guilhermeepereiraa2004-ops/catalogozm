import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist/assets',{recursive:true});
for(const name of ['index.html','styles.css','hero.css','app.js','catalog.js','domain.js','store.js'])await copyFile(name,`dist/${name}`);
await cp('assets','dist/assets',{recursive:true,filter:s=>!s.includes('originals')});
console.log('Build estático criado em dist/.');
