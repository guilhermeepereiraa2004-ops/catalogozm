import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist/assets',{recursive:true});
for(const name of ['index.html','vestido-3d.html','viewer-3d.js','viewer-3d.css','styles.css','hero.css','responsive.css','hero-motion.js','cash-flow.js','cash-flow.css','branding.css','app.js','catalog.js','domain.js','store.js'])await copyFile(name,`dist/${name}`);
await cp('assets','dist/assets',{recursive:true,filter:s=>!s.includes('originals')});
console.log('Build estático criado em dist/.');

await cp('vendor','dist/vendor',{recursive:true});
