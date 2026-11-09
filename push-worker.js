self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));

self.addEventListener('push', event => {
  let payload;
  try {payload = event.data?.json();} catch {}
  const isTest = payload?.test === true;
  const orderId = payload?.orderId;
  event.waitUntil(self.registration.showNotification(isTest ? 'Teste de aviso da ZM Exclusiva' : 'Novo pedido na ZM Exclusiva', {
    body: 'Toque para abrir os pedidos no painel.',
    icon: '/assets/zm-push-192.png',
    ...(isTest ? {tag: 'zm-order-test'} :
      typeof orderId === 'string' && /^ZM-[A-Z0-9-]{3,45}$/.test(orderId) ? {tag: orderId} : {})
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/#admin/orders'));
});
