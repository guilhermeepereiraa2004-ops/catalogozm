import {neon} from '@neondatabase/serverless';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {createDatabase} from '../server/database.js';
import {exerciseDB,product} from '../tests/backend-helpers.mjs';
const text=await readFile('.env.bootstrap','utf8');const ownerURL=JSON.parse(text.match(/DATABASE_URL=("[^\n]+")/)[1]);const sql=neon(ownerURL);
const productionDB=createDatabase(process.env.DATABASE_URL),beforeStore=await productionDB.read();
const schema='qa_'+randomBytes(8).toString('hex');let created=false;
try{
 await sql.query(`CREATE SCHEMA "${schema}"`,[]);created=true;
 const source=(await readFile('db/001-store.sql','utf8')).replaceAll('public',schema);
 const statements=source.split(/;\s*(?=(?:CREATE|REVOKE|--))/).map(s=>s.trim()).filter(Boolean);
 for(const statement of statements)await sql.query(statement,[]);
 const seed={products:[product],orders:[],expenses:[],requests:[]};await sql.query(`INSERT INTO "${schema}".store_state(id,data) VALUES(1,$1::jsonb)`,[JSON.stringify(seed)]);
 await exerciseDB(createDatabase(ownerURL,schema));
 const app=createDatabase(process.env.DATABASE_URL);const snapshot=await app.read();
 if(!Array.isArray(snapshot.state.products))throw new Error('Catálogo da loja inválido');
 if(snapshot.revision===beforeStore.revision&&JSON.stringify(snapshot.state)!==JSON.stringify(beforeStore.state))throw new Error('Estado da loja divergente sem mudança de revisão');
 console.log('Neon real: persistência, disputa pela última peça, retentativa, receita, despesa, agenda, retirada e cancelamento aprovados em schema isolado. Catálogo da loja acessível.');
}catch(error){console.error('Falha na verificação Neon:',error.name,String(error.message).replace(/postgres(?:ql)?:\/\/\S+/g,'[redigido]').slice(0,200));process.exitCode=1;}
finally{if(created)await sql.query(`DROP SCHEMA "${schema}" CASCADE`,[]);}
