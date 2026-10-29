import {handleApi} from './api.js';
export const PRIVATE_ADMIN_ORIGIN='https://zm-exclusiva-admin-guilherme.vercel.app';
// A plataforma protege todas as previews; produção nunca ganha acesso administrativo.
// Não confiar em headers oai-* ou parâmetros fornecidos pelo navegador.
export function privatePreviewAdmin(env){return env.VERCEL_ENV==='preview'&&env.VERCEL_PRIVATE_ADMIN==='1';}
export function createVercelHandler(env,options={}){return {async fetch(request){
 const response=await handleApi(request,env,{...options,admin:privatePreviewAdmin(env)});
 if(response.status===401&&new URL(request.url).pathname==='/api/state')return Response.json({error:'Entre no painel protegido da loja.',adminUrl:PRIVATE_ADMIN_ORIGIN},{status:401,headers:{'Cache-Control':'private, no-store'}});
 return response;
}};}
export default createVercelHandler(process.env);
