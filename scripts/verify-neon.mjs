import {neon} from '@neondatabase/serverless';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {createDatabase} from '../server/database.js';
import {exerciseDB,product} from '../tests/backend-helpers.mjs';
const text=await readFile('.env.bootstrap','utf8');const ownerURL=JSON.parse(text.match(/DATABASE_URL=("[^\n]+")/)[1]);const sql=neon(ownerURL);
const schema='qa_'+randomBytes(8).toString('hex');let created=false;
try{
 await sql.query(`CREATE SCHEMA "${schema}"`,[]);created=true;
 const source=(await readFile('db/001-store.sql','utf8')).replaceAll('public',schema);
 const statements=source.split(/;\s*(?=(?:CREATE|REVOKE|--))/).map(s=>s.trim()).filter(Boolean);
 for(const statement of statements)await sql.query(statement,[]);
 const seed={products:[product],orders:[],expenses:[],requests:[]};await sql.query(`INSERT INTO "${schema}".store_state(id,data) VALUES(1,$1::jsonb)`,[JSON.stringify(seed)]);
 await exerciseDB(createDatabase(ownerURL,schema));
 const app=createDatabase(process.env.DATABASE_URL);const snapshot=await app.read();
 if(snapshot.state.products.length!==39)throw new Error('Catálogo inicial divergente');
 console.log('Neon real: persistência, disputa pela última peça, retentativa, receita, despesa e cancelamento aprovados. Catálogo preservado.');
}catch(error){console.error('Falha na verificação Neon:',error.name,String(error.message).replace(/postgres(?:ql)?:\/\/\S+/g,'[redigido]').slice(0,200));process.exitCode=1;}
finally{if(created)await sql.query(`DROP SCHEMA "${schema}" CASCADE`,[]);}
