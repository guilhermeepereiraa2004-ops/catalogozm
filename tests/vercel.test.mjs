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

test('login distingue senha inválida de bloqueio por domínio e indisponibilidade',async()=>{
 const {authRequest}=await import('../admin-auth.js');
 const fetchBefore=globalThis.fetch;
 try{
  for(const [status,body,message] of [
   [401,{code:'INVALID_EMAIL_OR_PASSWORD'},/Usuário ou senha incorretos/],
   [403,{code:'INVALID_ORIGIN'},/autorizar o acesso por este endereço/],
   [429,{},/Muitas tentativas/],
   [503,{error:'Serviço indisponível'},/Serviço indisponível/]
  ]){
   globalThis.fetch=async()=>Response.json(body,{status});
   await assert.rejects(()=>authRequest('sign-in/email',{email:'admin',password:'ficticia'}),message);
  }
 }finally{globalThis.fetch=fetchBefore;}
});
