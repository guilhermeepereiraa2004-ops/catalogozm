import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{privatePreviewAdmin} from '../server/vercel.js';
test('admin da Vercel só funciona na prévia privada explicitamente habilitada',()=>{
 assert.equal(privatePreviewAdmin({}),false);
 assert.equal(privatePreviewAdmin({VERCEL_ENV:'production',VERCEL_PRIVATE_ADMIN:'1'}),false);
 assert.equal(privatePreviewAdmin({VERCEL_ENV:'preview'}),false);
 assert.equal(privatePreviewAdmin({VERCEL_ENV:'preview',VERCEL_PRIVATE_ADMIN:'1'}),true);
});
test('header do Sites forjado não concede acesso administrativo na Vercel',async()=>{
 const previous={VERCEL_ENV:process.env.VERCEL_ENV,VERCEL_PRIVATE_ADMIN:process.env.VERCEL_PRIVATE_ADMIN};
 process.env.VERCEL_ENV='production';delete process.env.VERCEL_PRIVATE_ADMIN;
 try{const response=await handler.fetch(new Request('https://loja.vercel.app/api/state',{headers:{'oai-authenticated-user-id':'forjado'}}));assert.equal(response.status,401);}
 finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
