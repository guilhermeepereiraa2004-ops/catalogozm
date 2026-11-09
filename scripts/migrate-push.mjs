import {readFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {Pool} from 'pg';

const databaseTarget = url => url.hostname.replace('-pooler.', '.') + url.pathname;
let pool, appPool;

try {
  const {DATABASE_URL: ownerUrl} = parseEnv(await readFile('.env.bootstrap', 'utf8'));
  const {AUTH_DATABASE_URL: appUrl} = parseEnv(await readFile('.env.local', 'utf8'));
  const owner = new URL(ownerUrl);
  const app = new URL(appUrl);
  if (databaseTarget(owner) !== databaseTarget(app) || app.username !== 'zm_auth_app') {
    throw new Error('Configuração incompatível');
  }
  owner.searchParams.set('sslmode', 'verify-full');
  app.searchParams.set('sslmode', 'verify-full');
  pool = new Pool({connectionString: owner.href, max: 1, connectionTimeoutMillis: 10000});
  appPool = new Pool({connectionString: app.href, max: 1, connectionTimeoutMillis: 10000});
  const migration = await readFile(new URL('../db/002-push.sql', import.meta.url), 'utf8');
  await pool.query('BEGIN;\n' + migration + '\nCOMMIT;');
  await appPool.query('SELECT last_test_at FROM public.zm_auth_push_subscription LIMIT 0');
  console.log('Tabela de inscrições atualizada e acesso da aplicação verificado.');
} catch (error) {
  console.error('Migração de avisos falhou:', error.code || error.name);
  process.exitCode = 1;
} finally {
  await Promise.all([pool?.end(), appPool?.end()]);
}
