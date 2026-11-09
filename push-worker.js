self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));

self.addEventListener('push', event => {
  let orderId;
  try {orderId = event.data?.json()?.orderId;} catch {}
  event.waitUntil(self.registration.showNotification('Novo pedido na ZM Exclusiva', {
    body: 'Toque para abrir os pedidos no painel.',
    icon: '/assets/zm-push-192.png',
    ...(typeof orderId === 'string' && /^ZM-[A-Z0-9-]{3,45}$/.test(orderId) ? {tag: orderId} : {})
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/#admin/orders'));
});
