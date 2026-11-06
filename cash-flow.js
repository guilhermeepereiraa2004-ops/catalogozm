import {getCashFlow,expenseCategories,incomeCategories,localDate,parseAmount,parseOptionalAmount,saleMethods,getSaleTotals,getActiveSales,getSaleOrderOptions} from './store.js';
import {deleteButton} from './admin-trash.js';

export function currentMonth(){
 const today=new Date();
 return {from:localDate(new Date(today.getFullYear(),today.getMonth(),1)),to:localDate(new Date(today.getFullYear(),today.getMonth()+1,0)),type:'all',query:''};
}
const dateLabel=date=>new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');

export function cashSummary(report,{money,icon}){
 return `<div class="cash-stats" aria-label="Resumo do período">
  <article class="cash-stat cash-income"><span>Receitas registradas ${icon('arrow')}</span><strong>${money(report.income)}</strong><p>Pedidos, pagamentos de vendas e receitas avulsas</p></article>
  <article class="cash-stat cash-expense"><span>Despesas registradas ${icon('back')}</span><strong>${money(report.expense)}</strong><p>Gastos da loja no período selecionado</p></article>
  <article class="cash-stat cash-balance ${report.balance<0?'negative':''}"><span>Saldo do período ${icon('wallet')}</span><strong>${money(report.balance)}</strong><p>Receitas menos despesas</p></article>
 </div>`;
}

export function cashTable(report,{esc,money,icon}){
 return `<div class="cash-list-heading"><div><h2>Movimentações</h2><span role="status">${report.entries.length} ${report.entries.length===1?'lançamento':'lançamentos'}</span></div><p>Resumo acima considera todo o período, independentemente da busca e do tipo.</p></div>${report.entries.length?`
 <div class="table-scroll"><table><thead><tr><th>Descrição</th><th>Data</th><th>Tipo</th><th>Valor</th><th>Ação</th></tr></thead><tbody>${report.entries.map(e=>`
 <tr><td data-label="Descrição"><b>${esc(e.description)}</b><small>${esc(e.detail)}</small></td><td data-label="Data">${dateLabel(e.date)}</td><td data-label="Tipo"><span class="cash-type ${e.type}">${e.type==='income'?'Receita':'Despesa'}</span></td><td data-label="Valor" class="cash-amount ${e.type}">${e.type==='income'?'+':'−'} ${money(e.amount)}</td><td data-label="Ação"><div class="record-actions">${e.saleId?`<button type="button" class="text-button" data-sale="${esc(e.saleId)}">Ver ficha ${icon('arrow')}</button>`:e.orderId?`<button class="text-button" data-order="${esc(e.orderId)}" aria-label="Abrir ${esc(e.description)}">Ver pedido ${icon('arrow')}</button>`:`<button class="text-button" data-${e.type}="${esc(e.id)}" aria-label="Editar ${e.type==='income'?'receita':'despesa'} ${esc(e.description)}">Editar ${icon('arrow')}</button>`}${e.saleId?'':`<button type="button" class="text-button danger-text" data-delete-kind="${e.orderId?'order-income':e.type}" data-delete-id="${esc(e.orderId||e.id)}" aria-label="Apagar ${esc(e.description)}">Apagar</button>`}</div></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state cash-empty">${icon('wallet')}<h3>Nenhuma movimentação por aqui.</h3><p>${report.totalCount?'Tente outra busca ou selecione outro tipo de lançamento.':'Registre uma receita ou despesa, ou confirme um pedido para começar. Você também pode consultar outro período.'}</p><div class="cash-actions"><button class="button primary" data-action="new-income">${icon('plus')} Adicionar receita</button><button class="button outline" data-action="new-expense">${icon('plus')} Adicionar despesa</button></div></div>`}`;
}

export function cashPanel(state,filters,helpers){
 const report=getCashFlow(state,filters),{esc,icon}=helpers;
 return `<div class="cash-period-bar"><div><span class="eyebrow">SEU NEGÓCIO EM EQUILÍBRIO</span><p>Registre vendas, pagamentos e despesas para acompanhar o saldo.</p></div><div class="cash-period-shortcuts"><button class="text-button" data-cash-period="month">Este mês</button><button class="text-button" data-cash-period="all">Todo o período</button></div></div>
 <form id="cash-filter-form" class="cash-filters" aria-label="Filtrar fluxo de caixa"><label>De<input id="cash-from" type="date" value="${esc(filters.from)}"></label><label>Até<input id="cash-to" type="date" value="${esc(filters.to)}"></label><label>Tipo<select id="cash-type"><option value="all" ${filters.type==='all'?'selected':''}>Todas as movimentações</option><option value="income" ${filters.type==='income'?'selected':''}>Receitas</option><option value="expense" ${filters.type==='expense'?'selected':''}>Despesas</option></select></label><label class="cash-search">Buscar<input id="cash-search" type="search" value="${esc(filters.query)}" placeholder="Descrição, pedido ou cliente"></label></form>
 <p id="cash-filter-error" class="form-error" role="alert"></p><div id="cash-summary">${cashSummary(report,helpers)}</div>
 ${ordersWithoutSale(state,helpers)}
 ${salesPanel(state,helpers)}
 <div class="admin-card cash-card" id="cash-results">${cashTable(report,helpers)}</div>
 <div class="cash-note">${icon('check')}<p>Pedidos com ficha entram no caixa pelos valores recebidos. Pedidos confirmados sem ficha seguem a data da confirmação.</p></div>`;
}

function entryForm(entry,type,{esc,icon}){
 const isIncome=type==='income',label=isIncome?'receita':'despesa',categories=isIncome?incomeCategories:expenseCategories;
 const e=entry||{description:'',amount:'',date:localDate(),category:isIncome?'Venda presencial':'Outras'};
 return `<button class="icon-btn dialog-close" data-action="close" aria-label="Fechar">${icon('close')}</button><div class="eyebrow">CUIDADO COM O SEU NEGÓCIO</div><h2>${entry?'Editar':'Nova'} ${label}</h2><p class="muted">${isIncome?'Registre uma entrada avulsa. Pedidos confirmados já entram automaticamente: não os lance novamente. Esta entrada não altera o estoque.':'Registre um gasto da loja para manter o saldo atualizado.'}</p>
 <form id="${type}-form" data-id="${esc(entry?.id||'')}"><label>Descrição<input name="description" value="${esc(e.description)}" required maxlength="120" placeholder="${isIncome?'Ex.: Venda presencial na loja':'Ex.: Embalagens para os pedidos'}"></label><div class="form-columns"><label>Valor (R$)<input name="amount" type="text" inputmode="decimal" value="${e.amount?(e.amount/100).toFixed(2).replace('.',','):''}" required maxlength="15" placeholder="0,00" aria-describedby="${type}-amount-help"></label><label>Data da ${label}<input name="date" type="date" value="${esc(e.date)}" required min="1900-01-01" max="9999-12-31"></label></div><p id="${type}-amount-help" class="muted small">Use vírgula ou ponto para os centavos. Ex.: 49,90.</p><label>Categoria<select name="category">${categories.map(c=>`<option ${e.category===c?'selected':''}>${c}</option>`).join('')}</select></label><p class="form-error" role="alert"></p><button class="button primary full">${icon('check')} Salvar ${label}</button><button type="button" class="text-button full" data-action="close">Cancelar</button></form>`;
}
export const expenseForm=(entry,helpers)=>entryForm(entry,'expense',helpers);
export const incomeForm=(entry,helpers)=>entryForm(entry,'income',helpers);

const asInput=amount=>(amount/100).toFixed(2).replace('.',',');
const methodOptions=()=>'<option value="">Escolha a forma</option>'+Object.entries(saleMethods).map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
const saleStatus=({received,due})=>due===0?'Quitada':received===0?'Fiado':'Parcial';
const splitLabel=(byMethod,money)=>Object.entries(saleMethods).filter(([id])=>byMethod[id]>0).map(([id,label])=>`${label} ${money(byMethod[id])}`).join(' · ');
const dialogStart=(title,icon)=>`<button type="button" class="icon-btn dialog-close" data-action="close" aria-label="Fechar">${icon('close')}</button><div class="eyebrow">FICHA DE VENDA</div><h2>${title}</h2>`;

function ordersWithoutSale(state,{esc,icon,money}){
 const orders=getSaleOrderOptions(state);
 return `<section class="admin-card sales-card" aria-labelledby="orders-without-sale-title">
 <div class="cash-list-heading"><div><h2 id="orders-without-sale-title">Pedidos sem ficha</h2><span>${orders.length}</span></div><p>Escolha um pedido para registrar como a cliente pagou.</p></div>
 ${orders.length?`<div class="table-scroll"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Status</th><th>Total</th><th>Ação</th></tr></thead>
 <tbody>${orders.map(order=>`<tr><td data-label="Pedido">${esc(order.id)}</td><td data-label="Cliente">${esc(order.customer.name)}</td><td data-label="Status">${esc(order.status)}</td><td data-label="Total">${money(order.total)}</td>
 <td data-label="Ação"><button type="button" class="text-button" data-action="new-sale" data-sale-order="${esc(order.id)}" aria-label="Registrar pagamento do pedido ${esc(order.id)}">Registrar pagamento ${icon('arrow')}</button></td></tr>`).join('')}</tbody></table></div>`
 :'<div class="sales-empty">Nenhum pedido disponível para registrar pagamento.</div>'}</section>`;
}

export function salesPanel(state,{esc,icon,money}){
 const sales=getActiveSales(state).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
 const rows=sales.map(s=>({sale:s,...getSaleTotals(s)}));
 const due=rows.reduce((sum,r)=>sum+r.due,0);
 return `<section class="admin-card sales-card" aria-labelledby="sales-title"><div class="cash-list-heading"><div><h2 id="sales-title">Fichas de venda</h2><span>${money(due)} a receber</span></div><p>Histórico de todas as datas. Só os pagamentos recebidos entram no caixa.</p></div>${rows.length?`<div class="table-scroll"><table><thead><tr><th>Data</th><th>Cliente e compra</th><th>Total</th><th>Recebido</th><th>Saldo fiado</th><th>Ação</th></tr></thead><tbody>${rows.map(({sale:s,byMethod,received,due})=>`<tr>
  <td data-label="Data">${dateLabel(s.date)}</td><td data-label="Cliente e compra"><b>${esc(s.customer)}</b><small>${esc(s.description)}</small></td>
  <td data-label="Total">${money(s.total)}</td><td data-label="Recebido">${money(received)}<small>${splitLabel(byMethod,money)||'Nenhum pagamento'}</small></td>
  <td data-label="Saldo fiado">${money(due)}<small>${saleStatus({received,due})}</small></td><td data-label="Ação"><button type="button" class="text-button" data-sale="${esc(s.id)}">Abrir ficha ${icon('arrow')}</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="sales-empty">Nenhuma ficha de venda registrada. Use <strong>Registrar venda</strong> para começar.</div>`}</section>`;
}

export function saleForm(state,{esc,icon,money}){
 const options=getSaleOrderOptions(state);
 return `${dialogStart('Registrar venda',icon)}<p>Informe a compra e quanto a cliente pagou. O restante fica em aberto na ficha.</p>
 <form id="sale-form" data-id="${crypto.randomUUID()}">
 <label>Origem<select name="orderId"><option value="">Venda de balcão</option>${options.map(o=>`<option value="${esc(o.id)}">${esc(o.id)} · ${esc(o.customer.name)} · ${money(o.total)}</option>`).join('')}</select></label>
 <p class="muted small">Para registrar o pagamento de um pedido do site, selecione-o acima. O caixa considera os pagamentos registrados na ficha.</p>
 <label>Nome da cliente<input name="customer" maxlength="100" required></label>
 <label>Compra<textarea name="description" maxlength="500" rows="2" required placeholder="Ex.: vestido e bolsa"></textarea></label>
 <div class="form-columns"><label>Data da venda<input name="date" type="date" value="${localDate()}" min="1900-01-01" max="9999-12-31" required></label><label>Total da venda (R$)<input name="total" inputmode="decimal" maxlength="15" placeholder="0,00" required></label></div>
 <label>Como foi o pagamento?<select name="mode"><option value="paid">Pago por completo</option><option value="split">Dividido ou com entrada</option><option value="due">Tudo fiado</option></select></label>
 <div data-sale-full><label>Forma de pagamento<select name="method" required>${methodOptions()}</select></label></div>
 <fieldset class="sale-split" data-sale-split hidden><legend>Valores recebidos (R$)</legend><div class="form-columns">${Object.entries(saleMethods).map(([id,label])=>`<label>${label}<input name="${id}" inputmode="decimal" maxlength="15" placeholder="0,00"></label>`).join('')}</div></fieldset>
 <p class="sale-totals" data-sale-summary aria-live="polite">Informe o total da venda para ver o resumo.</p>
 <p class="form-error" role="alert"></p><button type="submit" class="button primary full">${icon('check')} Salvar ficha</button></form>`;
}

const field=(form,name)=>form.querySelector(`[name="${name}"]`);
export function readSaleForm(form){
 const value=name=>field(form,name).value,mode=value('mode'),total=parseAmount(value('total'));
 if(mode==='paid'&&!Object.hasOwn(saleMethods,value('method')))throw new Error('Escolha a forma de pagamento.');
 const payments=mode==='paid'?{[value('method')]:total}:mode==='split'?Object.fromEntries(Object.keys(saleMethods).map(key=>[key,parseOptionalAmount(value(key))])):{};
 return {id:form.dataset.id,orderId:value('orderId'),date:value('date'),customer:value('customer'),description:value('description'),total,payments};
}
export function updateSaleForm(form,state,{money},fillOrder=false){
 if(fillOrder){
  const order=state.orders.find(o=>o.id===field(form,'orderId').value);
  for(const [key,value] of Object.entries({customer:order?.customer.name||'',description:order?order.items.map(i=>`${i.qty}× ${i.name}`).join(', ').slice(0,500):'',total:order?asInput(order.total):''})){
   field(form,key).value=value;field(form,key).readOnly=Boolean(order);
  }
 }
 const mode=field(form,'mode').value;
 form.querySelector('[data-sale-full]').hidden=mode!=='paid';
 field(form,'method').disabled=mode!=='paid';
 form.querySelector('[data-sale-split]').hidden=mode!=='split';
 const summary=form.querySelector('[data-sale-summary]');
 try{
  const {total,payments}=readSaleForm(form),received=Object.values(payments).reduce((sum,n)=>sum+n,0);
  summary.textContent=received>total?'O valor recebido ultrapassa o total da venda.':`Total: ${money(total)} · Recebido: ${money(received)} · Fiado: ${money(total-received)}`;
 }catch(error){summary.textContent=error.message;}
}

export function saleDetails(sale,helpers){
 const {esc,icon,money}=helpers,{received,due}=getSaleTotals(sale);
 const initial=splitLabel(sale.payments,money);
 return `${dialogStart('Detalhes da venda',icon)}<p><b>${esc(sale.customer)}</b> · ${dateLabel(sale.date)}<br>${esc(sale.description)}${sale.orderId?`<br>Pedido ${esc(sale.orderId)}`:''}</p>
 <p class="sale-totals">${saleStatus({received,due})} · Total: ${money(sale.total)} · Recebido: ${money(received)} · Fiado: ${money(due)}</p>
 <h3>Pagamentos</h3><ul class="sale-receipts"><li>Na venda: ${initial||'Sem entrada'}</li>${sale.receipts.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(r=>`<li>${dateLabel(r.date)} · ${saleMethods[r.method]} · ${money(r.amount)}</li>`).join('')}</ul>
 ${due>0?`<form id="sale-receipt-form" data-id="${esc(sale.id)}" data-receipt-id="${crypto.randomUUID()}"><h3>Registrar recebimento</h3><div class="form-columns"><label>Valor recebido (R$)<input name="amount" inputmode="decimal" maxlength="15" value="${asInput(due)}" required></label><label>Data do recebimento<input name="date" type="date" min="${esc(sale.date)}" max="9999-12-31" value="${localDate()}" required></label></div><label>Forma de pagamento<select name="method" required>${methodOptions()}</select></label><p class="form-error" role="alert"></p><button type="submit" class="button primary full">${icon('check')} Salvar recebimento</button></form>`:''}
 ${deleteButton('sale',sale.id,`ficha de ${sale.customer}`,helpers)}`;
}
