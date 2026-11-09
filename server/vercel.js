import {handleApi} from './api.js';
import {createAuthService} from './auth.js';
import {createOrderPush,createPushStore} from './order-push.js';
export function createVercelHandler(env,options={}){
 let authService=options.authService;
 function auth(){return authService??=createAuthService(env,{localSetup:Boolean(options.localSetup)});}
 let pushService=options.pushService;
 function push(){return pushService??=createOrderPush(env,{store:createPushStore(auth().pool),defer:options.defer});}
 function orderCreated(orderId){
  const delivery=Promise.resolve().then(()=>push().notify(orderId)).catch(()=>{
   console.warn('Web Push: não foi possível disparar o aviso de pedido.');
  });
  if(options.defer){
   try{options.defer(delivery);return;}catch{}
  }
  return delivery;
 }
 return {async fetch(request){
  try{
   const path=new URL(request.url).pathname;
   if(path==='/api/auth'||path.startsWith('/api/auth/'))return auth().handle(request);
   if(path==='/api/push'){
    const userId=request.headers.get('cookie')?await auth().getAdminUserId(request):null;
    if(!userId)return Response.json({error:'Entre no painel para gerenciar avisos.'},{status:401,headers:{'Cache-Control':'private, no-store'}});
    return await push().handle(request,userId);
   }
   const admin=request.headers.get('cookie')?await auth().isAdmin(request):false;
   return handleApi(request,env,{db:options.db,admin,onOrderCreated:env.ZM_PUSH_PRIVATE_KEY||options.pushService?orderCreated:undefined});
  }catch{console.error('Sessão administrativa indisponível; detalhes omitidos.');return Response.json({error:'Não foi possível verificar o acesso. Entre novamente.'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
 }};
}
export default createVercelHandler(process.env);
