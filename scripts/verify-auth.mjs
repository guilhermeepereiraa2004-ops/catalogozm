import {Pool} from 'pg';
import {randomBytes,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getMigrations} from 'better-auth/db/migration';
import {authOptions,createAuthService} from '../server/auth.js';
import {createVercelHandler} from '../server/vercel.js';
import {memoryDB} from '../tests/backend-helpers.mjs';
import assert from 'node:assert/strict';
process.loadEnvFile('.env.local');
const ownerText=await readFile('.env.bootstrap','utf8'),ownerURL=new URL(JSON.parse(ownerText.match(/DATABASE_URL=("[^\n]+")/)[1]));ownerURL.searchParams.set('sslmode','verify-full');
const pool=new Pool({connectionString:ownerURL.href,max:5}),prefix='qa_auth_'+randomBytes(6).toString('hex')+'_';
const env={BETTER_AUTH_SECRET:randomBytes(48).toString('hex'),BETTER_AUTH_URL:'http://localhost:4173'};
const options=authOptions(env,pool,{prefix});let service;
try{
 const migration=await getMigrations(options);await migration.runMigrations();
 await pool.query(`CREATE TABLE "${prefix}admin" (user_id text PRIMARY KEY REFERENCES "${prefix}user"(id) ON DELETE CASCADE)`);
 await pool.query(`CREATE TABLE "${prefix}bootstrap" (id integer PRIMARY KEY CHECK(id=1),token_hash text NOT NULL,expires_at timestamptz NOT NULL,consumed_at timestamptz)`);
 service=createAuthService(env,{pool,prefix,localSetup:true});
 const email='qa-'+randomBytes(6).toString('hex')+'@example.test',password=randomBytes(24).toString('base64url');
 const req=(path,body,cookie,ip='127.0.0.1')=>new Request('http://localhost:4173/api/auth/'+path,{method:body?'POST':'GET',headers:{Origin:'http://localhost:4173','x-real-ip':ip,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const bootstrap=await service.handle(req('setup',{name:'Administrador QA',email,password}));assert.equal(bootstrap.status,200,await bootstrap.clone().text());
 const stored=await pool.query(`SELECT password FROM "${prefix}account" WHERE password IS NOT NULL`);assert.equal(stored.rowCount,1);assert.notEqual(stored.rows[0].password,password);
 assert.equal((await service.handle(req('setup',{name:'Outro QA',email:'outro@example.test',password}))).status,409);
 assert.equal((await service.handle(req('sign-up/email',{name:'Intruso',email:'intruso@example.test',password}))).status,403);
 const denied=await service.handle(req('sign-in/email',{email,password:'senha-incorreta'}));assert.equal(denied.status,401);
 const login=await service.handle(req('sign-in/email',{email,password}));assert.equal(login.status,200,await login.clone().text());
 const cookies=login.headers.getSetCookie();assert.ok(cookies.some(c=>/httponly/i.test(c)));assert.ok(cookies.some(c=>/samesite=lax/i.test(c)));
 const cookie=cookies.map(c=>c.split(';')[0]).join('; ');
 const adminReq=new Request('http://localhost:4173/api/state',{headers:{cookie}});assert.equal(await service.isAdmin(adminReq),true);
 assert.equal(await service.isAdmin(new Request('http://localhost:4173/api/state',{headers:{cookie:'zm.session_token=forjado'}})),false);
 const adapter=createVercelHandler(env,{authService:service,db:memoryDB()});assert.equal((await adapter.fetch(adminReq)).status,200);
 const aliasService=createAuthService({...env,ZM_ADMIN_LOGIN_EMAIL:email},{pool,prefix,localSetup:true});
 const aliasReq=(login,secret)=>req('sign-in/email',{email:login,password:secret},null,'127.0.0.2');
 assert.equal((await aliasService.handle(aliasReq(email.toUpperCase(),password))).status,401);
 assert.equal((await aliasService.handle(aliasReq('admin','senha-incorreta'))).status,401);
 const aliasLogin=await aliasService.handle(aliasReq(' admin ',password));
 assert.equal(aliasLogin.status,200,await aliasLogin.clone().text());
 const aliasCookie=aliasLogin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 assert.equal(await aliasService.isAdmin(new Request('http://localhost:4173/api/state',{headers:{cookie:aliasCookie}})),true);
 assert.equal((await pool.query(`SELECT password FROM "${prefix}account" WHERE password IS NOT NULL`)).rows[0].password,stored.rows[0].password);
 // Domínios próprios da loja aceitam login com a mesma conta e preservam a proteção de origem.
 const domainService=createAuthService({...env,BETTER_AUTH_URL:'https://zm-exclusiva-tau.vercel.app',ZM_ADMIN_LOGIN_EMAIL:email},{pool,prefix});
 let domainIndex=10;
 for(const origin of ['https://www.zmexclusiva.com.br','https://zmexclusiva.com.br']){
  const domainLogin=await domainService.handle(new Request(origin+'/api/auth/sign-in/email',{
   method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-real-ip':'198.51.100.'+domainIndex++},
   body:JSON.stringify({email:'admin',password,rememberMe:false})
  }));
  assert.equal(domainLogin.status,200,await domainLogin.clone().text());
  const domainCookie=domainLogin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
  assert.equal(await domainService.isAdmin(new Request(origin+'/api/state',{headers:{cookie:domainCookie}})),true);
  assert.ok(domainLogin.headers.getSetCookie().some(c=>/secure/i.test(c)));
  const newUsername='domain_qa_'+domainIndex,newPassword=randomBytes(6).toString('base64url');
  const domainCreate=await domainService.handle(new Request(origin+'/api/auth/users',{
   method:'POST',headers:{Origin:origin,'Content-Type':'application/json',cookie:domainCookie},
   body:JSON.stringify({name:'Equipe QA domínio',username:newUsername,password:newPassword})
  }));
  assert.equal(domainCreate.status,201,await domainCreate.clone().text());
  const domainMemberLogin=await domainService.handle(new Request(origin+'/api/auth/sign-in/email',{
   method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-real-ip':'198.51.100.'+domainIndex++},
   body:JSON.stringify({email:newUsername,password:newPassword})
  }));
  assert.equal(domainMemberLogin.status,200,await domainMemberLogin.clone().text());
  const memberCookie=domainMemberLogin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
  assert.equal(await domainService.isAdmin(new Request(origin+'/api/state',{headers:{cookie:memberCookie}})),true);
  const memberStatus=await domainService.handle(new Request(origin+'/api/auth/status',{headers:{Origin:origin,cookie:memberCookie}}));
  assert.equal((await memberStatus.json()).canManageUsers,false);
 }
 const unknownOrigin='https://dominio-nao-autorizado.example';
 const unknownLogin=await domainService.handle(new Request(unknownOrigin+'/api/auth/sign-in/email',{
  method:'POST',headers:{Origin:unknownOrigin,'Content-Type':'application/json','x-real-ip':'198.51.100.20'},body:JSON.stringify({email:'admin',password})
 }));
 assert.equal(unknownLogin.status,403);
 console.log('Domínios próprios: cadastro da equipe, login individual e sessão aprovados, origem externa recusada.');
 const teamPassword=randomBytes(1).toString('hex').slice(0,1);
 assert.equal(teamPassword.length,1);
 const team={name:'Pessoa da equipe QA',username:' Vendas_QA ',password:teamPassword};
 assert.equal((await (await aliasService.handle(req('status'))).json()).canManageUsers,false);
 assert.equal((await (await aliasService.handle(req('status',null,aliasCookie))).json()).canManageUsers,true);
 assert.equal((await aliasService.handle(req('users',team))).status,403);
 const externalCreate=req('users',team,aliasCookie);externalCreate.headers.set('Origin','https://externo.test');
 assert.equal((await aliasService.handle(externalCreate)).status,403);
 assert.equal((await aliasService.handle(req('users',{...team,username:'admin'},aliasCookie))).status,409);
 assert.equal((await aliasService.handle(req('users',{...team,password:''},aliasCookie))).status,422);
 const creates=await Promise.all([aliasService.handle(req('users',team,aliasCookie)),aliasService.handle(req('users',team,aliasCookie))]);
 assert.deepEqual(creates.map(res=>res.status).sort(),[201,409]);
 const created=creates.find(res=>res.status===201);
 assert.deepEqual(await created.json(),{username:'vendas_qa'});
 assert.equal(created.headers.get('set-cookie'),null);
 const teamLogin=await aliasService.handle(req('sign-in/email',{email:'VENDAS_QA',password:teamPassword},null,'127.0.0.4'));
 assert.equal(teamLogin.status,200,await teamLogin.clone().text());
 const teamCookie=teamLogin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 assert.notEqual(teamCookie,aliasCookie);
 const teamAdapter=createVercelHandler(env,{authService:aliasService,db:memoryDB()});
 assert.equal((await teamAdapter.fetch(new Request('http://localhost:4173/api/state',{headers:{cookie:teamCookie}}))).status,200);
 assert.equal((await (await aliasService.handle(req('status',null,teamCookie))).json()).canManageUsers,false);
 assert.equal((await aliasService.handle(req('users',{...team,username:'outro'},teamCookie))).status,403);
 assert.equal((await aliasService.handle(req('sign-in/email',{email:'vendas_qa@equipe.zm.invalid',password:teamPassword},null,'127.0.0.4'))).status,401);
 assert.equal(await aliasService.isAdmin(new Request('http://localhost:4173/api/state',{headers:{cookie:aliasCookie}})),true);
 console.log('Equipe: cadastro exclusivo do acesso principal, concorrência, login individual e autorização verificados.');
 const managerService=createAuthService({...env,ZM_ADMIN_LOGIN_EMAIL:email,ZM_ADMIN_MANAGER_EMAILS:'vendas_qa@equipe.zm.invalid'},{pool,prefix});
 assert.equal((await (await managerService.handle(req('status',null,teamCookie))).json()).canManageUsers,true);
 const managedUser=await managerService.handle(req('users',{name:'Pessoa QA delegada',username:'equipe_delegada',password:teamPassword},teamCookie));
 assert.equal(managedUser.status,201,await managedUser.clone().text());
 assert.equal((await (await aliasService.handle(req('status',null,teamCookie))).json()).canManageUsers,false);
 assert.equal((await (await managerService.handle(req('status',null,aliasCookie))).json()).canManageUsers,true);
 console.log('Cadastro de usuários: somente as contas explicitamente autorizadas podem criar novos acessos.');
 const changed=await service.handle(req('change-password',{currentPassword:password,newPassword:teamPassword,revokeOtherSessions:true},cookie));assert.equal(changed.status,200,await changed.clone().text());
 assert.equal((await service.handle(new Request('http://localhost:4173/api/auth/sign-out',{method:'POST',headers:{Origin:'https://externo.test','Content-Type':'application/json',cookie},body:'{}'}))).status,403);
 const logout=await service.handle(req('sign-out',{},cookie));assert.equal(logout.status,200);assert.equal(await service.isAdmin(adminReq),false);
 // Sem vínculo administrativo, uma sessão autenticada também é recusada.
 const secondLogin=await service.handle(req('sign-in/email',{email,password:teamPassword}));assert.equal(secondLogin.status,200);
 const secondCookie=secondLogin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 await pool.query(`DELETE FROM "${prefix}admin"`);assert.equal(await service.isAdmin(new Request('http://localhost:4173/api/state',{headers:{cookie:secondCookie}})),false);
 // Rate limit persiste no banco e vale entre instâncias do servidor.
 let limited=false;for(let i=0;i<8;i++){const response=await service.handle(req('sign-in/email',{email,password:'incorreta'}));if(response.status===429){limited=true;break;}}assert.equal(limited,true);
 let aliasLimited=false;
 for(let i=0;i<6;i++){if((await aliasService.handle(aliasReq('admin','incorreta'))).status===429){aliasLimited=true;break;}}
 assert.equal(aliasLimited,true);
 const remote=createAuthService(env,{pool,prefix,localSetup:false});
 const setupRequest=(path,token,body)=>{const r=req(path,body);if(token)r.headers.set('X-ZM-Setup-Token',token);return r;};
 assert.equal((await remote.handle(setupRequest('setup',undefined,{}))).status,403);
 const activation=randomBytes(32).toString('base64url'),hash=createHash('sha256').update(activation).digest('hex');
 await pool.query(`INSERT INTO "${prefix}bootstrap"(id,token_hash,expires_at) VALUES(1,$1,now()-interval '1 minute')`,[hash]);
 assert.equal((await remote.handle(setupRequest('setup',activation,{}))).status,403);
 await pool.query(`UPDATE "${prefix}bootstrap" SET expires_at=now()+interval '5 minutes'`);
 assert.equal((await (await remote.handle(setupRequest('status',undefined))).json()).setupAvailable,false);
 assert.equal((await (await remote.handle(setupRequest('status',activation))).json()).setupAvailable,true);
 const body={name:'Ativação QA',email:'activation-'+randomBytes(6).toString('hex')+'@example.test',password:randomBytes(24).toString('base64url')};
 const attempts=await Promise.all([remote.handle(setupRequest('setup',activation,body)),remote.handle(setupRequest('setup',activation,body))]);
 assert.equal(attempts.filter(r=>r.status===200).length,1);
 assert.ok(attempts.some(r=>r.status===403||r.status===409));
 assert.equal((await remote.handle(setupRequest('setup',activation,body))).status,403);
 assert.equal((await (await remote.handle(setupRequest('status',activation))).json()).setupAvailable,false);
 assert.equal((await pool.query(`SELECT 1 FROM "${prefix}admin"`)).rowCount,1);
 const otherLogin=await aliasService.handle(req('sign-in/email',{email:body.email,password:body.password},null,'127.0.0.3'));
 assert.equal(otherLogin.status,200);
 assert.equal(await aliasService.isAdmin(new Request('http://localhost:4173/api/state',{headers:{cookie:otherLogin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')}})),true);
 const recoveryService=createAuthService({...env,ZM_ADMIN_LOGIN_EMAIL:email,ZM_ADMIN_MANAGER_EMAILS:body.email},{pool,prefix});
 const recoveryCookie=otherLogin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 const recreatedPassword=randomBytes(9).toString('base64url');
 const replacement={name:'Principal recriado QA',username:'admin',password:recreatedPassword};
 assert.equal((await recoveryService.handle(req('users',replacement,recoveryCookie))).status,409);
 const removed=await pool.query(`DELETE FROM "${prefix}user" WHERE email=$1 RETURNING id`,[email]);
 assert.equal(removed.rowCount,1);
 const recreate=await recoveryService.handle(req('users',replacement,recoveryCookie));
 assert.equal(recreate.status,201,await recreate.clone().text());
 assert.equal((await recoveryService.handle(req('users',replacement,recoveryCookie))).status,409);
 const recreatedLogin=await recoveryService.handle(req('sign-in/email',{email:'admin',password:recreatedPassword},null,'198.51.100.30'));
 assert.equal(recreatedLogin.status,200,await recreatedLogin.clone().text());
 const recreatedCookie=recreatedLogin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 const recreatedRequest=req('status',null,recreatedCookie);
 assert.equal((await (await recoveryService.handle(recreatedRequest)).json()).canManageUsers,true);
 assert.equal((await (await recoveryService.handle(req('status',null,recoveryCookie))).json()).canManageUsers,true);
 console.log('Admin recriado: conta antiga removida, nome liberado, novo cadastro e login aprovados; outra gestora mantém acesso.');
 console.log('Usuário admin: mesma senha e vínculo, e-mail anterior recusado, outros acessos e limite de tentativas preservados.');
 console.log('Ativação HTTPS: token obrigatório, expiração, uso único e concorrência aprovados no Neon real.');
 console.log('Better Auth + Neon real: cadastro local único, signup público bloqueado, hash de senha, login, sessão HttpOnly, autorização por usuário, troca de senha, logout revogado, CSRF e rate limit aprovados.');
}catch(error){console.error('Falha na verificação auth:',error.code||error.name,String(error.message).replace(/postgres(?:ql)?:\/\/\S+/g,'[protegido]').slice(0,450));process.exitCode=1;}
finally{
 const tables=await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE $1",[prefix+'%']);
 for(const {tablename} of tables.rows){if(!tablename.startsWith(prefix)||!/^[a-z0-9_]+$/.test(tablename))throw new Error('Tabela inválida');await pool.query(`DROP TABLE "${tablename}" CASCADE`);}
 await pool.end();
}
