const PUSH_WORKER = '/push-worker.js?v=2';

export function syncAdminInstall(enabled) {
  const existing = document.querySelector('#admin-install-manifest');
  if (!enabled) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const link = document.createElement('link');
  link.id = 'admin-install-manifest';
  link.rel = 'manifest';
  link.href = '/admin.webmanifest';
  document.head.append(link);
}

export function orderPushView(closeButton) {
  return `${closeButton}<div class="eyebrow">PEDIDOS DA LOJA</div>
    <h2>Avisos de novos pedidos</h2>
    <p>Receba um aviso neste aparelho quando chegar um pedido, mesmo com o painel fechado.</p>
    <p data-push-status class="muted" role="status">Verificando este aparelho…</p>
    <button type="button" class="button primary full" data-push-toggle disabled hidden>Ativar avisos</button>
    <button type="button" class="button outline full" data-push-test disabled hidden>Testar notificação</button>
    <p class="small muted">No iPhone ou iPad com iOS 16.4 ou posterior, abra no Safari e toque em Compartilhar → Adicionar à Tela de Início. Depois, abra o ícone instalado, entre no painel e ative os avisos.</p>`;
}

async function pushRequest(body) {
  const response = await fetch('/api/push', {
    credentials: 'same-origin',
    cache: 'no-store',
    ...(body ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)} : {})
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar os avisos.');
  return data;
}

export async function mountOrderPush(dialog) {
  const status = dialog.querySelector('[data-push-status]');
  const button = dialog.querySelector('[data-push-toggle]');
  const testButton = dialog.querySelector('[data-push-test]');
  if (!window.isSecureContext || !navigator.serviceWorker || !window.PushManager || !window.Notification) {
    status.textContent = 'Os avisos não estão disponíveis neste modo ou navegador.';
    return;
  }

  try {
    const {publicKey} = await pushRequest();
    if (!publicKey) {
      status.textContent = 'Os avisos ainda não estão disponíveis neste endereço.';
      return;
    }

    const applicationServerKey = Uint8Array.from(
      atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')),
      character => character.charCodeAt(0)
    );
    await navigator.serviceWorker.register(PUSH_WORKER);
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    let enabled = subscription
      ? (await pushRequest({action: 'status', endpoint: subscription.endpoint})).enabled
      : false;

    function render(message) {
      const blocked = Notification.permission === 'denied';
      status.textContent = message ?? (blocked
        ? 'Os avisos estão bloqueados. Confira as permissões deste site no aparelho.'
        : enabled ? 'Os avisos estão ativos neste aparelho.' : 'Os avisos estão desativados neste aparelho.');
      button.hidden = blocked && !enabled;
      button.disabled = false;
      button.textContent = enabled ? 'Desativar avisos' : 'Ativar avisos';
      testButton.hidden = !enabled || blocked || !registration.active?.scriptURL?.endsWith(PUSH_WORKER);
      testButton.disabled = testButton.hidden;
    }

    button.addEventListener('click', async () => {
      button.disabled = true;
      testButton.disabled = true;
      try {
        if (enabled) {
          await pushRequest({action: 'disable', endpoint: subscription.endpoint});
          enabled = false;
          if (await subscription.unsubscribe().catch(() => false)) subscription = null;
          render('Avisos desativados neste aparelho.');
          return;
        }

        const currentKey = subscription?.options?.applicationServerKey;
        if (currentKey && String(new Uint8Array(currentKey)) !== String(applicationServerKey)) {
          await subscription.unsubscribe();
          subscription = null;
          render('Toque em Ativar avisos novamente para renovar a inscrição.');
          return;
        }
        // A inscrição começa no clique, antes de qualquer espera de rede, para abrir a permissão do navegador.
        subscription = await registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey});
        await pushRequest({action: 'enable', subscription: subscription.toJSON()});
        enabled = true;
        render();
      } catch (error) {
        render(Notification.permission === 'denied'
          ? undefined
          : error.name === 'NotAllowedError' ? 'Permita as notificações no aparelho para ativar os avisos.'
          : error.message || 'Não foi possível atualizar os avisos. Tente novamente.');
      }
    });
    testButton.addEventListener('click', async () => {
      button.disabled = true;
      testButton.disabled = true;
      try {
        const {seconds} = await pushRequest({action: 'test', endpoint: subscription.endpoint});
        render(`Teste agendado para daqui a ${seconds} segundos. Feche o painel agora e toque no aviso quando chegar.`);
      } catch (error) {
        render(error.message || 'Não foi possível agendar o teste. Tente novamente.');
      }
    });
    render();
    const pending = registration.installing ?? registration.waiting;
    pending?.addEventListener('statechange', () => {
      if (pending.state === 'activated') render();
    });
  } catch {
    status.textContent = 'Não foi possível verificar os avisos. Feche e abra esta tela para tentar novamente.';
  }
}
