import {createHash,randomUUID} from 'node:crypto';
import {betterAuth} from 'better-auth';
import {Pool} from 'pg';
const PREFIX='zm_auth_';
const TEAM_EMAIL_SUFFIX='@equipe.zm.invalid';
const USERNAME=/^[a-z0-9][a-z0-9_-]{2,31}$/;
const PUBLIC_ORIGIN='https://zm-exclusiva-tau.vercel.app';
export function authOptions(env,pool,{prefix=PREFIX,signup=false}={}){
 if(!/^[a-z][a-z0-9_]+$/.test(prefix))throw new Error('Prefixo inválido');
 if(!env.BETTER_AUTH_SECRET||env.BETTER_AUTH_SECRET.length<32)throw new Error('Autenticação não configurada');
 const baseURL=env.BETTER_AUTH_URL||(env.VERCEL_URL?`https://${env.VERCEL_URL}`:'http://localhost:4173');
 return {
  appName:'ZM Exclusiva',baseURL,basePath:'/api/auth',secret:env.BETTER_AUTH_SECRET,database:pool,
  trustedOrigins:[baseURL,PUBLIC_ORIGIN,'https://www.zmexclusiva.com.br','https://zmexclusiva.com.br',...(env.VERCEL_URL?[`https://${env.VERCEL_URL}`]:[]),...(baseURL==='http://localhost:4173'?['http://127.0.0.1:4173']:[])],
  emailAndPassword:{enabled:true,disableSignUp:!signup,autoSignIn:false,minPasswordLength:8,maxPasswordLength:128},
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
 const adminLoginEmail=env.ZM_ADMIN_LOGIN_EMAIL?.trim().toLowerCase();
 const managerEmails=new Set([adminLoginEmail,...(env.ZM_ADMIN_MANAGER_EMAILS||'').split(',')].map(email=>email?.trim().toLowerCase()).filter(Boolean));
 const userTable=`"${prefix}user"`;
 const accountTable=`"${prefix}account"`;
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
 async function canManageUsers(request){
  if(!managerEmails.size||!request.headers.get('cookie'))return false;
  const session=await auth.api.getSession({headers:request.headers});
  if(!session?.user?.id||!managerEmails.has(session.user.email.toLowerCase()))return false;
  const member=await pool.query(`SELECT 1 FROM ${adminTable} WHERE user_id=$1`,[session.user.id]);
  return member.rowCount===1;
 }
 async function createTeamUser(request){
  if(request.method!=='POST')return json({error:'Método inválido.'},405);
  if(request.headers.get('origin')!==new URL(request.url).origin||!await canManageUsers(request))return json({error:'Sua conta não tem permissão para cadastrar usuários.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Envie JSON.'},415);
  const body=await request.json().catch(()=>null);
  const username=typeof body?.username==='string'?body.username.trim().toLowerCase():'';
  const name=typeof body?.name==='string'?body.name.trim():'';
  const password=body?.password;
  if(!USERNAME.test(username)||username==='admin')return json({error:'Use um nome de usuário de 3 a 32 caracteres, com letras sem acento, números, hífen ou sublinhado. O usuário admin é reservado.'},422);
  if(!name||name.length>100)return json({error:'Informe o nome da pessoa (até 100 caracteres).'},422);
  if(typeof password!=='string'||password.length<8||password.length>128||!password.trim())return json({error:'A senha deve ter de 8 a 128 caracteres.'},422);
  const hash=await (await auth.$context).password.hash(password);
  try{
   // Conta, credencial e vínculo são gravados juntos, inclusive em cadastros simultâneos.
   await pool.query(`WITH new_user AS (
    INSERT INTO ${userTable} (id,name,email,"emailVerified","createdAt","updatedAt")
    VALUES ($1,$2,$3,false,now(),now()) RETURNING id
   ), new_credential AS (
    INSERT INTO ${accountTable} (id,"userId","providerId","accountId",password,"createdAt","updatedAt")
    SELECT $4,id,'credential',id,$5,now(),now() FROM new_user RETURNING "userId"
   ) INSERT INTO ${adminTable} (user_id) SELECT "userId" FROM new_credential`,
   [randomUUID(),name,username+TEAM_EMAIL_SUFFIX,randomUUID(),hash]);
  }catch(error){
   if(error.code==='23505')return json({error:'Este nome de usuário já está em uso.'},409);
   throw error;
  }
  return json({username},201);
 }
 async function setup(request){
  if(!await validSetup(request))return json({error:'Link de ativação inválido ou expirado. Solicite um novo link ao responsável.'},403);
  if(request.method!=='POST')return json({error:'Método inválido.'},405);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Envie JSON.'},415);
  const body=await request.json();
  if(typeof body.name!=='string'||!body.name.trim()||body.name.length>100||typeof body.email!=='string'||body.email.length>254||typeof body.password!=='string'||body.password.length<8||body.password.length>128)return json({error:'Informe nome, e-mail válido e senha de 8 a 128 caracteres.'},422);
  if(body.email.trim().toLowerCase().endsWith(TEAM_EMAIL_SUFFIX))return json({error:'Informe um e-mail válido.'},422);
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
   let request=new Request(url,input);
   const path=url.pathname.slice('/api/auth'.length);
   if(!sameOrigin(request))return json({error:'Origem não autorizada.'},403);
   if(Number(request.headers.get('content-length')||0)>20000)return json({error:'Requisição muito grande.'},413);
   if(path==='/users')return await createTeamUser(request);
   if(path==='/setup')return await setup(request);
   if(path==='/status'&&request.method==='GET'){
    const setupAvailable=await validSetup(request)&&(await pool.query(`SELECT 1 FROM ${adminTable} LIMIT 1`)).rowCount===0;
    return json({setupAvailable,canManageUsers:await canManageUsers(request)});
   }
   if(!['/sign-in/email','/sign-out','/get-session','/change-password','/ok'].includes(path))return json({error:'Cadastro público indisponível.'},403);
   if(path==='/sign-in/email'&&request.method==='POST'){
    if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')return json({error:'Envie JSON.'},415);
    const body=await request.json().catch(()=>null);
    const login=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
    // A conta vinculada entra somente pelo novo usuário; as demais mantêm o e-mail.
    if(login===adminLoginEmail||login.endsWith(TEAM_EMAIL_SUFFIX))return json({code:'INVALID_EMAIL_OR_PASSWORD',message:'Invalid email or password'},401);
    if(!login)return json({error:'Informe o usuário.'},400);
    const email=login==='admin'&&adminLoginEmail?adminLoginEmail:USERNAME.test(login)?login+TEAM_EMAIL_SUFFIX:login;
    const headers=new Headers(request.headers);headers.delete('content-length');
    request=new Request(request,{headers,body:JSON.stringify({...body,email})});
   }
   const response=await auth.handler(request);
   const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');
   return new Response(response.body,{status:response.status,headers});
  }catch{console.error('Autenticação: operação indisponível; detalhes sensíveis omitidos.');return json({error:'Não foi possível acessar sua conta agora. Tente novamente.'},503);}
 }
 return {auth,pool,options,isAdmin,handle,async close(){await pool.end();}};
}
