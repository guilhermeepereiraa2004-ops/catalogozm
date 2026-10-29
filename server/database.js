import {neon} from '@neondatabase/serverless';
export function createDatabase(url,schema='public'){
 if(!/^[a-z][a-z0-9_]*$/.test(schema))throw new Error('Schema inválido');
 if(!url)throw new Error('DATABASE_URL ausente no servidor.');
 const sql=neon(url);
 return {
  async read(){const [row]=await sql.query(`SELECT "${schema}".read_store() AS snapshot`,[]);if(!row?.snapshot)throw new Error('Banco não inicializado.');return row.snapshot;},
  async commit(revision,state){const [row]=await sql.query(`SELECT "${schema}".commit_store($1,$2::jsonb) AS saved`,[revision,JSON.stringify(state)]);return row.saved;}
 };
}
