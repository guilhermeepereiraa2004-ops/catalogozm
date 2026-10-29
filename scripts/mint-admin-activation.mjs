import {Pool} from 'pg';
import {randomBytes,createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const text=await readFile('.env.bootstrap','utf8');const uri=new URL(JSON.parse(text.match(/DATABASE_URL=("[^\n]+")/)[1]));uri.searchParams.set('sslmode','verify-full');
const pool=new Pool({connectionString:uri.href,max:1,connectionTimeoutMillis:10000});
try{
 await pool.query('BEGIN');await pool.query("SELECT pg_advisory_xact_lock(hashtext('zm-initial-admin'))");
 const exists=await pool.query('SELECT 1 FROM public.zm_auth_admin LIMIT 1');
 if(exists.rowCount)throw new Error('O administrador já foi cadastrado. Use o login da loja.');
 const token=randomBytes(32).toString('base64url');const hash=createHash('sha256').update(token).digest('hex');
 const result=await pool.query("INSERT INTO public.zm_auth_bootstrap(id,token_hash,expires_at,consumed_at) VALUES(1,$1,now()+interval '30 minutes',null) ON CONFLICT(id) DO UPDATE SET token_hash=EXCLUDED.token_hash,expires_at=EXCLUDED.expires_at,consumed_at=null RETURNING expires_at",[hash]);
 await pool.query('COMMIT');await mkdir('artifacts',{recursive:true});
 await writeFile('artifacts/admin-setup-link.json',JSON.stringify({url:'https://zm-exclusiva-tau.vercel.app/#admin/setup?token='+token,expiresAt:result.rows[0].expires_at}),{mode:0o600});
 console.log('Ativação temporária preparada para o proprietário, válida por 30 minutos. Link armazenado apenas no arquivo local ignorado.');
}catch(error){await pool.query('ROLLBACK');console.error('Não foi possível preparar a ativação:',error.message==='O administrador já foi cadastrado. Use o login da loja.'?error.message:'Detalhes sensíveis omitidos.');process.exitCode=1;}
finally{await pool.end();}
