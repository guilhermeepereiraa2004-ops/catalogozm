import {createECDH, createHash, ECDH} from 'node:crypto';
import {setTimeout as wait} from 'node:timers/promises';
import webPush from 'web-push';

const TEST_DELAY_SECONDS = 10;

function response(data, status = 200) {
  return Response.json(data, {status, headers: {'Cache-Control': 'private, no-store'}});
}

function pushEndpoint(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    const supported = url.hostname === 'fcm.googleapis.com' ||
      /\.(push\.apple\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/.test(url.hostname);
    if (supported && url.protocol === 'https:' && !url.username && !url.password &&
        !url.port && !url.hash && url.href.length <= 2048) return url.href;
  } catch {}
  return null;
}

function decodeKey(value, length) {
  if (typeof value !== 'string' || !/^[\w-]+={0,2}$/.test(value)) return null;
  const decoded = Buffer.from(value, 'base64url');
  return decoded.length === length ? decoded : null;
}

function browserKeys(keys) {
  const publicKey = decodeKey(keys?.p256dh, 65);
  const auth = decodeKey(keys?.auth, 16);
  if (!publicKey || publicKey[0] !== 4 || !auth) return null;
  try {
    ECDH.convertKey(publicKey, 'prime256v1');
    return {p256dh: publicKey.toString('base64url'), auth: auth.toString('base64url')};
  } catch {return null;}
}

function vapidDetails(secret) {
  const privateKey = decodeKey(secret, 32);
  if (!privateKey) return null;
  try {
    const key = createECDH('prime256v1');
    key.setPrivateKey(privateKey);
    return {
      subject: 'https://www.zmexclusiva.com.br',
      publicKey: key.getPublicKey().toString('base64url'),
      privateKey: privateKey.toString('base64url')
    };
  } catch {return null;}
}

export function createPushStore(pool) {
  return {
    async has(userId, endpoint) {
      const result = await pool.query(
        'SELECT 1 FROM public.zm_auth_push_subscription WHERE user_id = $1 AND endpoint = $2',
        [userId, endpoint]
      );
      return result.rowCount === 1;
    },
    async save(userId, {endpoint, keys}) {
      await pool.query(
        `INSERT INTO public.zm_auth_push_subscription (endpoint, user_id, p256dh, auth_secret)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (endpoint) DO UPDATE
         SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth_secret = EXCLUDED.auth_secret`,
        [endpoint, userId, keys.p256dh, keys.auth]
      );
    },
    async remove(userId, endpoint) {
      await pool.query(
        'DELETE FROM public.zm_auth_push_subscription WHERE user_id = $1 AND endpoint = $2',
        [userId, endpoint]
      );
    },
    async list() {
      const {rows} = await pool.query(
        'SELECT endpoint, p256dh, auth_secret AS auth FROM public.zm_auth_push_subscription'
      );
      return rows.map(({endpoint, p256dh, auth}) => ({endpoint, keys: {p256dh, auth}}));
    },
    async claimTest(userId, endpoint) {
      const result = await pool.query(
        `UPDATE public.zm_auth_push_subscription SET last_test_at = now()
         WHERE user_id = $1 AND endpoint = $2
         AND (last_test_at IS NULL OR last_test_at <= now() - interval '1 minute')`,
        [userId, endpoint]
      );
      return result.rowCount === 1;
    },
    async get(userId, endpoint) {
      const {rows: [record]} = await pool.query(
        'SELECT p256dh, auth_secret AS auth FROM public.zm_auth_push_subscription WHERE user_id = $1 AND endpoint = $2',
        [userId, endpoint]
      );
      return record && {endpoint, keys: record};
    },
    async removeExpired({endpoint, keys}) {
      await pool.query(
        'DELETE FROM public.zm_auth_push_subscription WHERE endpoint = $1 AND p256dh = $2 AND auth_secret = $3',
        [endpoint, keys.p256dh, keys.auth]
      );
    }
  };
}

export function createOrderPush(env, {store, send = webPush.sendNotification, defer, delay = wait} = {}) {
  const vapid = vapidDetails(env.ZM_PUSH_PRIVATE_KEY);

  async function handle(request, userId) {
    const origin = request.headers.get('origin');
    if (request.headers.get('sec-fetch-site') === 'cross-site' ||
        (origin && origin !== new URL(request.url).origin)) {
      return response({error: 'Origem não autorizada.'}, 403);
    }
    if (!userId) return response({error: 'Entre no painel para gerenciar avisos.'}, 401);
    if (request.method === 'GET') return response({publicKey: vapid?.publicKey ?? null});
    if (request.method !== 'POST') return response({error: 'Método inválido.'}, 405);
    if (!origin) return response({error: 'Origem não autorizada.'}, 403);
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return response({error: 'Envie JSON.'}, 415);
    }
    if (Number(request.headers.get('content-length')) > 8192) {
      return response({error: 'Inscrição muito grande.'}, 413);
    }
    const raw = await request.text();
    if (raw.length > 8192) return response({error: 'Inscrição muito grande.'}, 413);
    let input;
    try {input = JSON.parse(raw);} catch {return response({error: 'Inscrição inválida.'}, 422);}
    const endpoint = pushEndpoint(input?.subscription?.endpoint ?? input?.endpoint);
    if (!endpoint) return response({error: 'O serviço de notificações deste navegador não é compatível.'}, 422);

    if (input.action === 'status') return response({enabled: await store.has(userId, endpoint)});
    if (input.action === 'disable') {
      await store.remove(userId, endpoint);
      return response({enabled: false});
    }
    if (input.action === 'test') return await scheduleTest(userId, endpoint);
    if (input.action !== 'enable') return response({error: 'Ação inválida.'}, 422);
    if (!vapid) return response({error: 'Os avisos ainda não estão disponíveis.'}, 503);
    const keys = browserKeys(input.subscription?.keys);
    if (!keys) return response({error: 'Não foi possível validar a inscrição do aparelho.'}, 422);
    await store.save(userId, {endpoint, keys});
    return response({enabled: true});
  }

  async function deliver(subscription, payload, options) {
    if (!pushEndpoint(subscription.endpoint)) return false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await send(subscription, payload, options);
        return true;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await store.removeExpired(subscription);
          return false;
        }
        if (attempt === 1 || (error.statusCode && error.statusCode < 500)) throw error;
      }
    }
  }

  async function scheduleTest(userId, endpoint) {
    if (!vapid || !defer) return response({error: 'O teste está disponível no painel publicado.'}, 503);
    if (!await store.claimTest(userId, endpoint)) {
      if (!await store.has(userId, endpoint)) {
        return response({error: 'Ative os avisos neste aparelho antes de testar.'}, 404);
      }
      return response({error: 'Aguarde um minuto para testar novamente.'}, 429);
    }

    const delivery = (async () => {
      await delay(TEST_DELAY_SECONDS * 1000);
      const subscription = await store.get(userId, endpoint);
      if (!subscription) return;
      const accepted = await deliver(subscription, JSON.stringify({test: true}), {
        TTL: 120, urgency: 'high', timeout: 4000, topic: 'zm-order-test', vapidDetails: vapid
      });
      if (accepted) console.info('Web Push: aviso de teste aceito pelo provedor.');
      else console.warn('Web Push: inscrição de teste indisponível.');
    })().catch(() => console.warn('Web Push: falha no aviso de teste.'));
    defer(delivery);
    return response({seconds: TEST_DELAY_SECONDS}, 202);
  }

  async function notify(orderId) {
    if (!vapid) return;
    const subscriptions = await store.list();
    const options = {
      TTL: 3600,
      urgency: 'high',
      timeout: 4000,
      topic: createHash('sha256').update(orderId).digest('base64url').slice(0, 32),
      vapidDetails: vapid
    };
    const payload = JSON.stringify({orderId});
    const results = await Promise.allSettled(subscriptions.map(subscription => deliver(subscription, payload, options)));
    const failed = results.filter(result => result.status === 'rejected').length;
    if (failed) console.warn('Web Push: aparelhos com falha de entrega:', failed);
  }

  return {handle, notify};
}
