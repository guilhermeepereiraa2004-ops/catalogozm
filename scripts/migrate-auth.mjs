import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {Pool} from 'pg';
import {getMigrations} from 'better-auth/db/migration';
import {authOptions} from '../server/auth.js';
process.loadEnvFile('.env.local');
const ownerText=await readFile('.env.bootstrap','utf8');const ownerURL=JSON.parse(ownerText.match(/DATABASE_URL=("[^\n]+")/)[1]);
const owner=new Pool({connectionString:ownerURL,max:2,connectionTimeoutMillis:15000});
try{
 let envText=await readFile('.env.local','utf8');
 if(!process.env.BETTER_AUTH_SECRET){process.env.BETTER_AUTH_SECRET=randomBytes(48).toString('base64url');envText+='\nBETTER_AUTH_SECRET='+JSON.stringify(process.env.BETTER_AUTH_SECRET)+'\n';}
 const options=authOptions(process.env,owner);
 const migration=await getMigrations(options);await migration.runMigrations();
 await owner.query('CREATE TABLE IF NOT EXISTS public.zm_auth_admin (user_id text PRIMARY KEY REFERENCES public.zm_auth_user(id) ON DELETE CASCADE)');
 await owner.query('CREATE TABLE IF NOT EXISTS public.zm_auth_bootstrap (id integer PRIMARY KEY CHECK(id=1),token_hash text NOT NULL,expires_at timestamptz NOT NULL,consumed_at timestamptz)');
 const exists=await owner.query("SELECT 1 FROM pg_roles WHERE rolname='zm_auth_app'");
 if(!exists.rowCount){
  const password=randomBytes(32).toString('hex');await owner.query(`CREATE ROLE zm_auth_app LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`);
  const appURL=new URL(ownerURL);appURL.username='zm_auth_app';appURL.password=password;
  envText+='AUTH_DATABASE_URL='+JSON.stringify(appURL.href)+'\n';
 }
 await owner.query('GRANT USAGE ON SCHEMA public TO zm_auth_app');
 const tables=await owner.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'zm_auth_%'");
 for(const {tablename} of tables.rows){if(!/^zm_auth_[a-z_]+$/.test(tablename))throw new Error('Nome inválido');await owner.query(`REVOKE ALL ON TABLE public."${tablename}" FROM PUBLIC`);if(tablename==='zm_auth_bootstrap'){await owner.query('REVOKE ALL ON TABLE public.zm_auth_bootstrap FROM zm_auth_app');await owner.query('GRANT SELECT, UPDATE(consumed_at) ON TABLE public.zm_auth_bootstrap TO zm_auth_app');}else await owner.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public."${tablename}" TO zm_auth_app`);}
 await writeFile('.env.local',envText,{mode:0o600});
 console.log('Autenticação migrada. Tabelas isoladas:',tables.rowCount,'. O primeiro usuário será cadastrado pelo proprietário por ativação protegida.');
}catch(error){console.error('Migração de autenticação falhou:',error.code||error.name);process.exitCode=1;}
finally{await owner.end();}
