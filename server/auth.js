import {createHash} from 'node:crypto';
import {betterAuth} from 'better-auth';
import {Pool} from 'pg';
const PREFIX='zm_auth_';
const PUBLIC_ORIGIN='https://zm-exclusiva-tau.vercel.app';
export function authOptions(env,pool,{prefix=PREFIX,signup=false}={}){
 if(!/^[a-z][a-z0-9_]+$/.test(prefix))throw new Error('Prefixo inválido');
 if(!env.BETTER_AUTH_SECRET||env.BETTER_AUTH_SECRET.length<32)throw new Error('Autenticação não configurada');
 const baseURL=env.BETTER_AUTH_URL||(env.VERCEL_URL?`https://${env.VERCEL_URL}`:'http://localhost:4173');
 return {
  appName:'ZM Exclusiva',baseURL,basePath:'/api/auth',secret:env.BETTER_AUTH_SECRET,database:pool,
  trustedOrigins:[baseURL,PUBLIC_ORIGIN,...(env.VERCEL_URL?[`https://${env.VERCEL_URL}`]:[]),...(baseURL==='http://localhost:4173'?['http://127.0.0.1:4173']:[])],
  emailAndPassword:{enabled:true,disableSignUp:!signup,autoSignIn:false,minPasswordLength:12,maxPasswordLength:128},
  user:{modelName:prefix+'user'},account:{modelName:prefix+'account'},verification:{modelName:prefix+'verification'},
  session:{modelName:prefix+'session',expiresIn:8*60*60,updateAge:60*60,cookieCache:{enabled:false}},
  rateLimit:{enabled:true,storage:'database',modelName:prefix+'rate_limit',window:60,max:60,customRules:{'/sign-in/email':{window:60,max:5}}},
  advanced:{cookiePrefix:'zm',useSecureCookies:baseURL.startsWith('https://'),ipAddress:{ipAddressHeaders:env.VERCEL?['x-vercel-forwarded-for']:['x-real-ip']}},
  logger:{disabled:true}
 };
}
function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
function sameOrigin(request){const origin=request.headers.get('origin');return request.headers.get('sec-fetch-site')!=='cross-site'&&(!origin||origin===new URL(request.url).origin);}
export function createAuthService(env,{pool:providedPool,prefix=PREFIX,localSetup=false}={}){
 if(!providedPool&&!env.AUTH_DATABASE_URL)throw new Error('Banco de autenticação não configurado');
 const pool=providedPool||new Pool({connectionString:env.AUTH_DATABASE_URL,max:4,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});
 const options=authOptions(env,pool,{prefix}),auth=betterAuth(options);
 const adminTable=`"${prefix}admin"`;
 const bootstrapTable=`"${prefix}bootstrap"`;
 function setupHash(request){const token=request.headers.get('x-zm-setup-token')||'';return /^[A-Za-z0-9_-]{43}$/.test(token)?createHash('sha256').update(token).digest('hex'):null;}
 async function validSetup(request,connection=pool){
  if(localSetup)return true;
  const hash=setupHash(request);if(!hash)return false;
  const result=await connection.query(`SELECT 1 FROM ${bootstrapTable} WHERE id=1 AND token_hash=$1 AND consumed_at IS NULL AND expires_at>now()`,[hash]);
  return result.rowCount===1;
 }
 async function isAdmin(request){
  if(!request.headers.get('cookie'))return false;
  const session=await auth.api.getSession({headers:request.headers});
  if(!session?.user?.id)return false;
  const row=await pool.query(`SELECT 1 FROM ${adminTable} WHERE user_id=$1`,[session.user.id]);return row.rowCount===1;
 }
 async function setup(request){
  if(!await validSetup(request))return json({error:'Link de ativação inválido ou expirado. Solicite um novo link ao responsável.'},403);
  if(request.method!=='POST')return json({error:'Método inválido.'},405);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Envie JSON.'},415);
  const body=await request.json();
  if(typeof body.name!=='string'||!body.name.trim()||body.name.length>100||typeof body.email!=='string'||body.email.length>254||typeof body.password!=='string'||body.password.length<12||body.password.length>128)return json({error:'Informe nome, e-mail válido e senha de 12 a 128 caracteres.'},422);
  const client=await pool.connect();
  try{
   await client.query('BEGIN');await client.query("SELECT pg_advisory_xact_lock(hashtext('zm-initial-admin'))");
   if(!await validSetup(request,client)){await client.query('ROLLBACK');return json({error:'Link de ativação inválido ou expirado.'},403);}
   const existing=await client.query(`SELECT 1 FROM ${adminTable} LIMIT 1`);
   if(existing.rowCount){await client.query('ROLLBACK');return json({error:'O primeiro administrador já foi cadastrado.'},409);}
   const bootstrap=betterAuth(authOptions(env,pool,{prefix,signup:true}));
   await bootstrap.api.signUpEmail({body:{name:body.name.trim(),email:body.email.trim().toLowerCase(),password:body.password}});
   // Verifica a senha inclusive na recuperação de uma criação interrompida antes do vínculo.
   const signed=await auth.api.signInEmail({body:{email:body.email.trim().toLowerCase(),password:body.password}});
   if(!signed.user?.id)throw new Error('Não foi possível verificar o cadastro');
   await client.query(`INSERT INTO ${adminTable}(user_id) VALUES($1)`,[signed.user.id]);
   await client.query(`DELETE FROM "${prefix}session" WHERE "userId"=$1`,[signed.user.id]);
   await client.query(`UPDATE ${bootstrapTable} SET consumed_at=now() WHERE id=1 AND consumed_at IS NULL`);
   await client.query('COMMIT');return json({ok:true});
  }catch{await client.query('ROLLBACK');return json({error:'Não foi possível criar o acesso. Confira o e-mail e a senha e tente novamente.'},422);}
  finally{client.release();}
 }
 async function handle(input){
  try{
   const url=new URL(input.url);const routed=url.searchParams.get('auth_path');
   if(routed!==null){url.pathname='/api/auth/'+routed;url.searchParams.delete('auth_path');}
   const request=new Request(url,input),path=url.pathname.slice('/api/auth'.length);
   if(!sameOrigin(request))return json({error:'Origem não autorizada.'},403);
   if(Number(request.headers.get('content-length')||0)>20000)return json({error:'Requisição muito grande.'},413);
   if(path==='/setup')return await setup(request);
   if(path==='/status'&&request.method==='GET'){
    const setupAvailable=await validSetup(request)&&(await pool.query(`SELECT 1 FROM ${adminTable} LIMIT 1`)).rowCount===0;
    return json({setupAvailable});
   }
   if(!['/sign-in/email','/sign-out','/get-session','/change-password','/ok'].includes(path))return json({error:'Cadastro público indisponível.'},403);
   const response=await auth.handler(request);
   const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');
   return new Response(response.body,{status:response.status,headers});
  }catch{console.error('Autenticação: operação indisponível; detalhes sensíveis omitidos.');return json({error:'Não foi possível acessar sua conta agora. Tente novamente.'},503);}
 }
 return {auth,pool,options,isAdmin,handle,async close(){await pool.end();}};
}
