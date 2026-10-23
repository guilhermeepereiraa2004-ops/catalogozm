import {getCashFlow,expenseCategories,localDate} from './store.js';

export function currentMonth(){
 const today=new Date();
 return {from:localDate(new Date(today.getFullYear(),today.getMonth(),1)),to:localDate(new Date(today.getFullYear(),today.getMonth()+1,0)),type:'all',query:''};
}
const dateLabel=date=>new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');

export function cashSummary(report,{money,icon}){
 return `<div class="cash-stats" aria-label="Resumo do período">
  <article class="cash-stat cash-income"><span>Receitas confirmadas ${icon('arrow')}</span><strong>${money(report.income)}</strong><p>Pedidos confirmados, em separação ou concluídos</p></article>
  <article class="cash-stat cash-expense"><span>Despesas registradas ${icon('back')}</span><strong>${money(report.expense)}</strong><p>Gastos da loja no período selecionado</p></article>
  <article class="cash-stat cash-balance ${report.balance<0?'negative':''}"><span>Saldo do período ${icon('wallet')}</span><strong>${money(report.balance)}</strong><p>Receitas menos despesas</p></article>
 </div>`;
}

export function cashTable(report,{esc,money,icon}){
 return `<div class="cash-list-heading"><div><h2>Movimentações</h2><span role="status">${report.entries.length} ${report.entries.length===1?'lançamento':'lançamentos'}</span></div><p>Resumo acima considera todo o período, independentemente da busca e do tipo.</p></div>${report.entries.length?`
 <div class="table-scroll"><table><thead><tr><th>Descrição</th><th>Data</th><th>Tipo</th><th>Valor</th><th>Ação</th></tr></thead><tbody>${report.entries.map(e=>`
 <tr><td data-label="Descrição"><b>${esc(e.description)}</b><small>${esc(e.detail)}</small></td><td data-label="Data">${dateLabel(e.date)}</td><td data-label="Tipo"><span class="cash-type ${e.type}">${e.type==='income'?'Receita':'Despesa'}</span></td><td data-label="Valor" class="cash-amount ${e.type}">${e.type==='income'?'+':'−'} ${money(e.amount)}</td><td data-label="Ação">${e.type==='income'?`<button class="text-button" data-order="${esc(e.orderId)}" aria-label="Abrir ${esc(e.description)}">Ver pedido ${icon('arrow')}</button>`:`<button class="text-button" data-expense="${esc(e.id)}" aria-label="Editar despesa ${esc(e.description)}">Editar ${icon('arrow')}</button>`}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state cash-empty">${icon('wallet')}<h3>Nenhuma movimentação por aqui.</h3><p>${report.totalCount?'Tente outra busca ou selecione outro tipo de lançamento.':'Confirme um pedido ou registre uma despesa para começar. Você também pode consultar outro período.'}</p><button class="button outline" data-action="new-expense">${icon('plus')} Adicionar despesa</button></div>`}`;
}

export function cashPanel(state,filters,helpers){
 const report=getCashFlow(state,filters),{esc,icon}=helpers;
 return `<div class="cash-period-bar"><div><span class="eyebrow">SEU NEGÓCIO EM EQUILÍBRIO</span><p>Confirmações viram receitas. Despesas ajudam a acompanhar o saldo.</p></div><div class="cash-period-shortcuts"><button class="text-button" data-cash-period="month">Este mês</button><button class="text-button" data-cash-period="all">Todo o período</button></div></div>
 <form id="cash-filter-form" class="cash-filters" aria-label="Filtrar fluxo de caixa"><label>De<input id="cash-from" type="date" value="${esc(filters.from)}"></label><label>Até<input id="cash-to" type="date" value="${esc(filters.to)}"></label><label>Tipo<select id="cash-type"><option value="all" ${filters.type==='all'?'selected':''}>Todas as movimentações</option><option value="income" ${filters.type==='income'?'selected':''}>Receitas</option><option value="expense" ${filters.type==='expense'?'selected':''}>Despesas</option></select></label><label class="cash-search">Buscar<input id="cash-search" type="search" value="${esc(filters.query)}" placeholder="Descrição, pedido ou cliente"></label></form>
 <p id="cash-filter-error" class="form-error" role="alert"></p><div id="cash-summary">${cashSummary(report,helpers)}</div>
 <div class="admin-card cash-card" id="cash-results">${cashTable(report,helpers)}</div>
 <div class="cash-note">${icon('check')}<p>Cada pedido conta uma única vez a partir da confirmação. Cancelamentos retiram a receita do saldo. As receitas seguem a data da primeira confirmação; pedidos antigos usam a data do pedido.</p></div>`;
}

export function expenseForm(expense,{esc,icon}){
 const e=expense||{description:'',amount:'',date:localDate(),category:'Outras'};
 return `<button class="icon-btn dialog-close" data-action="close" aria-label="Fechar">${icon('close')}</button><div class="eyebrow">CUIDADO COM O SEU NEGÓCIO</div><h2>${expense?'Editar despesa':'Nova despesa'}</h2><p class="muted">Registre um gasto da loja para manter o saldo atualizado.</p>
 <form id="expense-form" data-id="${esc(expense?.id||'')}"><label>Descrição<input name="description" value="${esc(e.description)}" required maxlength="120" placeholder="Ex.: Embalagens para os pedidos"></label><div class="form-columns"><label>Valor (R$)<input name="amount" type="text" inputmode="decimal" value="${e.amount?(e.amount/100).toFixed(2).replace('.',','):''}" required maxlength="15" placeholder="0,00" aria-describedby="expense-amount-help"></label><label>Data da despesa<input name="date" type="date" value="${esc(e.date)}" required min="1900-01-01" max="9999-12-31"></label></div><p id="expense-amount-help" class="muted small">Use vírgula ou ponto para os centavos. Ex.: 49,90.</p><label>Categoria<select name="category">${expenseCategories.map(c=>`<option ${e.category===c?'selected':''}>${c}</option>`).join('')}</select></label><p class="form-error" role="alert"></p><button class="button primary full">${icon('check')} Salvar despesa</button><button type="button" class="text-button full" data-action="close">Cancelar</button></form>`;
}
