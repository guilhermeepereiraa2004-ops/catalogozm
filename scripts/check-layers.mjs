import {readFile} from 'node:fs/promises';
const allowed={'catalog.js':[],'domain.js':[],'store.js':['catalog.js','domain.js'],'viewer-3d.js':['vendor/model-viewer.min.js'],'hero-motion.js':[],'app.js':['catalog.js','store.js','hero-motion.js']};
export function check(file,source){for(const m of source.matchAll(/(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]\.\/([^'"]+)['"]/g)){if(!allowed[file]?.includes(m[1]))throw new Error(`Dependência proibida: ${file} -> ${m[1]}`);}}
for(const name of Object.keys(allowed))check(name,await readFile(name,'utf8'));
check('store.js',"import {x} from './domain.js';");let detected=false;try{check('domain.js',"import './app.js';");}catch{detected=true;}if(!detected)throw new Error('Fixture de violação não detectada.');console.log('Camadas verificadas; fixture permitida e proibida confirmadas.');
