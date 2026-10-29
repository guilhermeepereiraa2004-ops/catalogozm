import {handleApi} from './api.js';
import {createAuthService} from './auth.js';
export function createVercelHandler(env,options={}){
 let authService=options.authService;
 function auth(){return authService??=createAuthService(env,{localSetup:Boolean(options.localSetup)});}
 return {async fetch(request){
  try{
   const path=new URL(request.url).pathname;
   if(path==='/api/auth'||path.startsWith('/api/auth/'))return auth().handle(request);
   const admin=request.headers.get('cookie')?await auth().isAdmin(request):false;
   return handleApi(request,env,{db:options.db,admin});
  }catch{console.error('Sessão administrativa indisponível; detalhes omitidos.');return Response.json({error:'Não foi possível verificar o acesso. Entre novamente.'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
 }};
}
export default createVercelHandler(process.env);
