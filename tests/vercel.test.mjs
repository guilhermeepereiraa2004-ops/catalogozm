import test from 'node:test';
import assert from 'node:assert/strict';
import {createVercelHandler} from '../server/vercel.js';
test('flag privada e headers da Vercel/Sites não concedem administração sem sessão da loja',async()=>{
 for(const environment of ['preview','production']){
  const handler=createVercelHandler({VERCEL_ENV:environment,VERCEL_PRIVATE_ADMIN:'1'});
  const response=await handler.fetch(new Request('https://loja.test/api/state',{headers:{'oai-authenticated-user-id':'forjado','x-vercel-protection-bypass':'forjado'}}));assert.equal(response.status,401);
 }
});
test('sessão válida depende da autorização por usuário no servidor',async()=>{
 const handler=createVercelHandler({}, {authService:{isAdmin:async()=>false}});
 const response=await handler.fetch(new Request('https://loja.test/api/state',{headers:{cookie:'zm.session_token=forjado'}}));assert.equal(response.status,401);
});
