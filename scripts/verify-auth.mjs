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
 const req=(path,body,cookie)=>new Request('http://localhost:4173/api/auth/'+path,{method:body?'POST':'GET',headers:{Origin:'http://localhost:4173','x-real-ip':'127.0.0.1',...(body?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
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
 const changed=await service.handle(req('change-password',{currentPassword:password,newPassword:password+'a',revokeOtherSessions:true},cookie));assert.equal(changed.status,200,await changed.clone().text());
 assert.equal((await service.handle(new Request('http://localhost:4173/api/auth/sign-out',{method:'POST',headers:{Origin:'https://externo.test','Content-Type':'application/json',cookie},body:'{}'}))).status,403);
 const logout=await service.handle(req('sign-out',{},cookie));assert.equal(logout.status,200);assert.equal(await service.isAdmin(adminReq),false);
 // Sem vínculo administrativo, uma sessão autenticada também é recusada.
 const secondLogin=await service.handle(req('sign-in/email',{email,password:password+'a'}));assert.equal(secondLogin.status,200);
 const secondCookie=secondLogin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 await pool.query(`DELETE FROM "${prefix}admin"`);assert.equal(await service.isAdmin(new Request('http://localhost:4173/api/state',{headers:{cookie:secondCookie}})),false);
 // Rate limit persiste no banco e vale entre instâncias do servidor.
 let limited=false;for(let i=0;i<8;i++){const response=await service.handle(req('sign-in/email',{email,password:'incorreta'}));if(response.status===429){limited=true;break;}}assert.equal(limited,true);
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
 console.log('Ativação HTTPS: token obrigatório, expiração, uso único e concorrência aprovados no Neon real.');
 console.log('Better Auth + Neon real: cadastro local único, signup público bloqueado, hash de senha, login, sessão HttpOnly, autorização por usuário, troca de senha, logout revogado, CSRF e rate limit aprovados.');
}catch(error){console.error('Falha na verificação auth:',error.code||error.name,String(error.message).replace(/postgres(?:ql)?:\/\/\S+/g,'[protegido]').slice(0,450));process.exitCode=1;}
finally{
 const tables=await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE $1",[prefix+'%']);
 for(const {tablename} of tables.rows){if(!tablename.startsWith(prefix)||!/^[a-z0-9_]+$/.test(tablename))throw new Error('Tabela inválida');await pool.query(`DROP TABLE "${tablename}" CASCADE`);}
 await pool.end();
}
