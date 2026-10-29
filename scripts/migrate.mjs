import {neon} from '@neondatabase/serverless';
import {initialProducts} from '../catalog.js';
import {readFile,writeFile,copyFile,access} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
let stage='env';
try{
 const bootstrap='.env.bootstrap';
 try{await access(bootstrap);}catch{await copyFile('.env.local',bootstrap);}
 const ownerText=await readFile(bootstrap,'utf8');
 const ownerURL=JSON.parse(ownerText.match(/DATABASE_URL=("[^\n]+")/)[1]);
 const sql=neon(ownerURL);stage='schema';
 // Cada statement separado por marcador; funções PL/pgSQL preservadas.
 const schema=await readFile('db/001-store.sql','utf8');
 const statements=schema.split(/;\s*(?=(?:CREATE|REVOKE|--))/).map(s=>s.trim()).filter(Boolean);
 for(let i=0;i<statements.length;i++){stage='statement-'+i;await sql.query(statements[i],[]);}
 stage='seed';const seed={products:structuredClone(initialProducts),orders:[],expenses:[],requests:[]};
 await sql`INSERT INTO public.store_state(id,data) VALUES(1,${JSON.stringify(seed)}::jsonb) ON CONFLICT(id) DO NOTHING`;
 stage='role';const exists=await sql`SELECT 1 FROM pg_roles WHERE rolname='zm_app'`;
 if(!exists.length){
  const password=randomBytes(32).toString('hex');
  await sql.query(`CREATE ROLE zm_app LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`,[]);
  const appURL=new URL(ownerURL);appURL.username='zm_app';appURL.password=password;
  await writeFile('.env.local','DATABASE_URL='+JSON.stringify(appURL.href)+'\n',{mode:0o600});
 }
 await sql`GRANT USAGE ON SCHEMA public TO zm_app`;
 await sql`GRANT EXECUTE ON FUNCTION public.read_store(),public.commit_store(bigint,jsonb) TO zm_app`;
 const [row]=await sql`SELECT jsonb_array_length(data->'products') AS products FROM public.store_state WHERE id=1`;
 console.log('Neon conectado. Migração aplicada. Produtos:',row.products);
}catch(error){console.error('Falha na migração do Neon. Etapa:',stage,'Código:',error.code||error.name);console.error(String(error.message).replace(/postgres(?:ql)?:\/\/\S+/g,'[redigido]').slice(0,250));process.exitCode=1;}
