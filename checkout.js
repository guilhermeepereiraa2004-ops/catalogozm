import {paymentMethods} from './store.js';
import {pixDetails,pixPayload} from './pix.js';
const whatsapp='https://wa.me/message/CA6Q36RLFHG2E1';

export function checkoutForm({icon}){
 return `<button class="icon-btn dialog-close" data-action="close" aria-label="Fechar">${icon('close')}</button><div class="eyebrow">FALTA POUCO PARA O SEU NOVO LOOK</div><h2>Como seu look chega até você?</h2>
 <form id="checkout-form"><fieldset class="checkout-choice"><legend>Você é de Ubaitaba?</legend><p class="muted small">Para entrega em Ubaitaba, registre seu pedido aqui. Para outras localidades, vamos combinar o frete pelo WhatsApp.</p><div class="checkout-options"><label><input type="radio" name="localDelivery" value="yes" required><span>Sim, sou de Ubaitaba</span></label><label><input type="radio" name="localDelivery" value="no" required><span>Não, sou de outra localidade</span></label></div></fieldset>
 <div id="outside-delivery" class="checkout-outside" hidden><h3>Vamos combinar sua entrega.</h3><p>Converse com a loja para consultar frete, prazo e pagamento antes de fechar. Suas peças continuam na sacola.</p><a class="button primary full" href="${whatsapp}" target="_blank" rel="noopener">${icon('whatsapp')} Combinar frete no WhatsApp ↗</a></div>
 <fieldset id="local-checkout" class="checkout-fields" hidden disabled><legend class="checkout-section-title">Seu pedido em Ubaitaba</legend><label>Seu nome<input name="name" autocomplete="name" required maxlength="100" placeholder="Como podemos chamar você?"></label><label>WhatsApp com DDD<input name="phone" autocomplete="tel" type="tel" required minlength="10" maxlength="20" placeholder="(73) 99999-9999"></label><label>Endereço de entrega em Ubaitaba<textarea name="address" autocomplete="street-address" rows="2" required minlength="8" maxlength="300" placeholder="Rua, número, bairro e ponto de referência"></textarea></label>
 <label>Forma de pagamento<select name="paymentMethod" required><option value="" selected disabled>Selecione uma forma de pagamento</option>${Object.entries(paymentMethods).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label><p id="checkout-payment-note" class="muted small" hidden>O QR Code e o Pix Copia e Cola aparecerão após registrar o pedido. Aguarde a loja confirmar o valor final antes de pagar.</p>
 <label>Algum detalhe especial? <span class="muted">(opcional)</span><textarea name="note" rows="2" maxlength="500" placeholder="Tamanho, cor ou observações para a loja"></textarea></label><div class="demo-note">O total das peças não inclui entrega. A loja confirma valor e prazo de entrega antes do pagamento. Escolher Pix não confirma o recebimento automaticamente.</div><p class="small muted">Seus dados serão usados para este pedido. Os tamanhos a confirmar serão combinados com a loja.</p><p class="form-error" role="alert"></p><button type="submit" class="button primary full">Registrar pedido ${icon('check')}</button></fieldset><button type="button" class="text-button full" data-action="bag">Voltar à sacola</button></form>`;
}

export function updateCheckoutOptions(form){
 const local=form.elements.localDelivery.value==='yes',outside=form.elements.localDelivery.value==='no';
 const fields=form.querySelector('#local-checkout');fields.hidden=!local;fields.disabled=!local;
 form.querySelector('#outside-delivery').hidden=!outside;
 form.querySelector('#checkout-payment-note').hidden=form.elements.paymentMethod.value!=='pix';
}

export function orderDeliveryDetails(order,{esc}){
 return `<div class="order-delivery"><p><b>Pagamento:</b> ${esc(paymentMethods[order.payment?.method]||'A combinar com a loja')}<br><span class="muted small">Recebimento a conferir pela loja</span></p>${order.delivery?`<p><b>Entrega em ${esc(order.delivery.city)}</b><br>${esc(order.delivery.address)}<br><span class="muted small">Valor e prazo de entrega a combinar</span></p>`:''}</div>`;
}

export function pixCard({esc,icon}){
 return `<section class="pix-card" aria-label="Pix da loja"><span class="eyebrow">PIX DA LOJA</span><h3 >QR Code ou Copia e Cola</h3><p>Aguarde a confirmação da loja sobre o total com a entrega antes de pagar.</p><img src="/assets/pix-zm-exclusiva.png" width="320" height="320" alt="QR Code Pix da ZM Exclusiva. Você também pode usar os botões para copiar a chave ou o código Pix."><p><b>${esc(pixDetails.name)}</b><br>Chave CPF: <span class="pix-key">043.017.235-44</span></p><div class="pix-copy-actions"><button type="button" class="button primary full" data-action="copy-pix" data-copy="payload">${icon('box')} Copiar Pix Copia e Cola</button><button type="button" class="button outline full" data-action="copy-pix" data-copy="key">Copiar chave Pix</button></div><p class="pix-copy-status small" role="status" aria-live="polite"></p><details class="pix-code-details"><summary>Ver código para copiar manualmente</summary><label>Pix Copia e Cola<textarea readonly rows="4">${esc(pixPayload)}</textarea></label></details><p class="small muted">No aplicativo do banco, confira o recebedor e informe o valor combinado. O pagamento será conferido pela loja.</p></section>`;
}

export function checkoutConfirmation(order,helpers){
 const {esc,money,icon}=helpers;
 return `<button class="icon-btn dialog-close" data-action="close" aria-label="Fechar">${icon('close')}</button><div class="success-mark">${icon('check')}</div><div class="eyebrow">SEU LOOK ESTÁ QUASE AÍ</div><h2>Pedido registrado!</h2><p>Obrigada, ${esc(order.customer.name.split(' ')[0])}. Sua seleção foi reservada. A loja vai confirmar os detalhes com você.</p><div class="order-confirmation"><span>Seu pedido</span><b>${esc(order.id)}</b><span>Total das peças</span><b>${money(order.total)}</b></div>${orderDeliveryDetails(order,helpers)}<div class="demo-note">Seu pedido já aparece no painel da loja. A entrega é combinada à parte.</div>${order.payment?.method==='pix'?pixCard(helpers):''}<a class="button primary full" href="${whatsapp}" target="_blank" rel="noopener">Combinar detalhes pelo WhatsApp ↗</a><button class="text-button full" data-action="close">Continuar navegando</button>`;
}
