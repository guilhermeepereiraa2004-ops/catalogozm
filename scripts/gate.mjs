import {spawnSync} from 'node:child_process';
for(const args of [['--check','app.js'],['--check','store.js'],['scripts/check-layers.mjs'],['--test','tests/domain.test.mjs'],['scripts/build.mjs']]){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}console.log('Gate aprovado.');
