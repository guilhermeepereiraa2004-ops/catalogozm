import {readFile,writeFile} from 'node:fs/promises';
import validator from 'gltf-validator';
const name='assets/models/vestido-aurora-aproximado.glb';
const report=await validator.validateBytes(new Uint8Array(await readFile(name)),{uri:name,maxIssues:1000});
await writeFile('docs/glb-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({errors:report.issues.numErrors,warnings:report.issues.numWarnings,infos:report.issues.numInfos,messages:report.issues.messages.slice(0,6)},null,2));
if(report.issues.numErrors)process.exit(1);
