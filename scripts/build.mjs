import './prepare-public.mjs';
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['node_modules/vinext/dist/cli.js','build'],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
