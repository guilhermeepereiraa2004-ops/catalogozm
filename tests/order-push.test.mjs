import test from 'node:test';
import assert from 'node:assert/strict';
import {createECDH, randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {parseHTML} from 'linkedom';
import webPush from 'web-push';
import {createOrderPush} from '../server/order-push.js';
import {createVercelHandler} from '../server/vercel.js';
import {mountOrderPush, orderPushView} from '../order-push.js';
import {memoryDB, product} from './backend-helpers.mjs';

const origin = 'https://loja.test';
const vapid = webPush.generateVAPIDKeys();
const env = {ZM_PUSH_PRIVATE_KEY: vapid.privateKey};
const key = createECDH('prime256v1');
key.generateKeys();
const keys = {p256dh: key.getPublicKey().toString('base64url'), auth: randomBytes(16).toString('base64url')};
const subscription = (name, host = 'fcm.googleapis.com') => ({endpoint: `https://${host}/push/${name}`, keys});

function request(path, body, headers) {
  return new Request(origin + path, {
    ...(body ? {method: 'POST', body: JSON.stringify(body)} : {}),
    headers: {Origin: origin, 'Content-Type': 'application/json', ...headers}
  });
}

test('inscrição exige sessão administrativa, origem da loja e serviço Push autorizado', async () => {
  const records = new Map();
  const store = {
    async has(userId, endpoint) {return records.get(endpoint)?.userId === userId;},
    async save(userId, record) {records.set(record.endpoint, {userId, record});},
    async remove(userId, endpoint) {if (await this.has(userId, endpoint)) records.delete(endpoint);}
  };
  const handler = createVercelHandler(env, {
    pushService: createOrderPush(env, {store}),
    authService: {
      async getAdminUserId(req) {
        const cookie = req.headers.get('cookie');
        return cookie === 'admin=ana' ? 'ana' : cookie === 'admin=bia' ? 'bia' : null;
      }
    }
  });
  const route = '/api/push';
  const ana = {cookie: 'admin=ana'};
  const bia = {cookie: 'admin=bia'};
  assert.equal((await handler.fetch(request(route))).status, 401);
  assert.equal((await handler.fetch(request(route, null, {cookie: 'admin=forjado'}))).status, 401);
  assert.deepEqual(await (await handler.fetch(request(route, null, ana))).json(), {publicKey: vapid.publicKey});
  const device = subscription('ana', 'web.push.apple.com');
  const enable = {action: 'enable', subscription: device};
  assert.equal((await handler.fetch(request(route, enable, {...ana, Origin: 'https://outra.test'}))).status, 403);
  assert.equal((await handler.fetch(request(route, {...enable, subscription: subscription('forjado', 'fcm.googleapis.com.outro.test')}, ana))).status, 422);
  assert.equal((await handler.fetch(request(route, {...enable, subscription: {...device, keys: {...keys, auth: 'invalida'}}}, ana))).status, 422);
  assert.equal(records.size, 0);
  assert.deepEqual(await (await handler.fetch(request(route, enable, ana))).json(), {enabled: true});
  const check = {action: 'status', endpoint: device.endpoint};
  const disable = {...check, action: 'disable'};
  assert.deepEqual(await (await handler.fetch(request(route, check, bia))).json(), {enabled: false});
  await handler.fetch(request(route, disable, bia));
  assert.deepEqual(await (await handler.fetch(request(route, check, ana))).json(), {enabled: true});
  await handler.fetch(request(route, disable, ana));
  assert.equal(records.size, 0);
});

test('pedido persistido avisa uma vez em requisições simultâneas e tolera falha de envio', async () => {
  const db = memoryDB();
  const jobs = [];
  const notified = [];
  const handler = createVercelHandler(env, {
    db,
    defer: job => jobs.push(job),
    pushService: {async notify(orderId) {
      assert.equal((await db.read()).state.orders[0].id, orderId);
      notified.push(orderId);
      throw new Error('Serviço push temporariamente indisponível');
    }}
  });
  const order = {
    action: 'order.create',
    requestKey: 'push-test-order-0001',
    args: [[{id: product.id, size: 'A confirmar', qty: 1}], {
      name: 'Cliente fictícia', phone: '71999999999', localDelivery: 'yes', paymentMethod: 'pix', note: ''
    }]
  };
  const results = await Promise.all([handler.fetch(request('/api/actions', order)), handler.fetch(request('/api/actions', order))]);
  assert.deepEqual(results.map(result => result.status), [200, 200]);
  const replies = await Promise.all(results.map(result => result.json()));
  assert.equal(replies[0].order.id, replies[1].order.id);
  assert.equal(jobs.length, 1);
  await Promise.all(jobs);
  assert.deepEqual(notified, [replies[0].order.id]);
  assert.equal((await db.read()).state.orders.length, 1);
  assert.equal((await handler.fetch(request('/api/actions', {...order, requestKey: 'push-test-order-0002'}))).status, 422);
  assert.equal(jobs.length, 1);
});

test('entrega criptografada retenta indisponibilidade e remove aparelho expirado', async () => {
  const expired = subscription('expirado', 'updates.push.services.mozilla.com');
  const active = subscription('ativo');
  const removed = [];
  let attempts = 0;
  const service = createOrderPush(env, {
    store: {
      async list() {return [expired, active];},
      async removeExpired(value) {removed.push(value);}
    },
    async send(device, payload, options) {
      if (device === expired) throw Object.assign(new Error(), {statusCode: 410});
      assert.deepEqual(JSON.parse(payload), {orderId: 'ZM-EXEMPLO-001'});
      const encrypted = webPush.generateRequestDetails(device, payload, options);
      assert.equal(encrypted.headers['Content-Encoding'], 'aes128gcm');
      assert.equal(encrypted.body.includes('ZM-EXEMPLO-001'), false);
      if (++attempts === 1) throw Object.assign(new Error(), {statusCode: 503});
    }
  });
  await service.notify('ZM-EXEMPLO-001');
  assert.equal(attempts, 2);
  assert.deepEqual(removed, [expired]);
});

test('configuração no aparelho espera o clique, salva e desativa a inscrição', async () => {
  const {document} = parseHTML(`<dialog>${orderPushView('')}</dialog>`);
  const events = [];
  const device = {
    ...subscription('celular'),
    toJSON() {return subscription('celular');},
    async unsubscribe() {events.push('unsubscribe');return true;}
  };
  const registration = {
    pushManager: {
      async getSubscription() {return null;},
      async subscribe({userVisibleOnly, applicationServerKey}) {
        assert.equal(userVisibleOnly, true);
        assert.equal(Buffer.from(applicationServerKey).toString('base64url'), vapid.publicKey);
        events.push('subscribe');
        return device;
      }
    }
  };
  const browser = {permission: 'default'};
  const values = {
    Notification: browser,
    window: {isSecureContext: true, Notification: browser, PushManager: {}},
    navigator: {serviceWorker: {async register() {}, ready: Promise.resolve(registration)}},
    async fetch(_url, options) {
      if (!options.body) return Response.json({publicKey: vapid.publicKey});
      const body = JSON.parse(options.body);
      events.push(body.action);
      return Response.json({enabled: body.action === 'enable'});
    }
  };
  const saved = Object.keys(values).map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  for (const [name, value] of Object.entries(values)) {
    Object.defineProperty(globalThis, name, {value, configurable: true});
  }
  try {
    await mountOrderPush(document.querySelector('dialog'));
    const button = document.querySelector('[data-push-toggle]');
    assert.equal(button.hidden, false);
    assert.deepEqual(events, []);
    button.click();
    assert.deepEqual(events, ['subscribe']);
    await new Promise(setImmediate);
    assert.match(document.querySelector('[data-push-status]').textContent, /ativos neste aparelho/);
    button.click();
    await new Promise(setImmediate);
    assert.deepEqual(events, ['subscribe', 'enable', 'disable', 'unsubscribe']);
    assert.match(document.querySelector('[data-push-status]').textContent, /Avisos desativados/);
  } finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});

test('service worker mostra o aviso em segundo plano e abre a área de pedidos', async () => {
  const handlers = {};
  const shown = [];
  const urls = [];
  const self = {
    addEventListener(name, handle) {handlers[name] = handle;},
    registration: {async showNotification(...args) {shown.push(args);}},
    clients: {async openWindow(url) {urls.push(url);}}
  };
  runInNewContext(await readFile(new URL('../push-worker.js', import.meta.url), 'utf8'), {self});
  let work;
  const waitUntil = promise => {work = promise;};
  handlers.push({data: {json: () => ({orderId: 'ZM-EXEMPLO-001', customer: 'Dado que deve ficar oculto'})}, waitUntil});
  await work;
  assert.equal(shown[0][0], 'Novo pedido na ZM Exclusiva');
  assert.equal(shown[0][1].tag, 'ZM-EXEMPLO-001');
  assert.doesNotMatch(JSON.stringify(shown), /Dado que deve ficar oculto/);
  let closed = false;
  handlers.notificationclick({notification: {close() {closed = true;}}, waitUntil});
  await work;
  assert.equal(closed, true);
  assert.deepEqual(urls, ['/#admin/orders']);
});
