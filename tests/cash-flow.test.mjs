import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialProducts} from '../catalog.js';
import {placeOrder,changeOrderStatus,saveExpense,getCashFlow,parseAmount,localDate} from '../domain.js';
import {getState,actions} from '../store.js';

const seed=()=>({products:structuredClone(initialProducts),orders:[],expenses:[]});
const order=state=>placeOrder(state,[{id:'zm-1',size:'A confirmar',qty:1}],{name:'Cliente Teste',phone:'71999999999'});
const expense=(extra={})=>({description:'Embalagens',amount:2590,date:'2026-10-22',category:'Embalagens',...extra});

test('novo pedido não entra no caixa; confirmação gera uma única receita e data estável',()=>{
 let s=order(seed());const id=s.orders[0].id;
 assert.equal(getCashFlow(s).income,0);
 s=changeOrderStatus(s,id,'Confirmado');const firstDate=s.orders[0].confirmedAt;
 assert.ok(firstDate);assert.equal(getCashFlow(s).income,9990);
 for(const status of ['Confirmado','Em separação','Concluído','Confirmado']){
  s=changeOrderStatus(s,id,status);
  assert.equal(getCashFlow(s).entries.length,1);assert.equal(getCashFlow(s).income,9990);
  assert.equal(s.orders[0].confirmedAt,firstDate);
 }
 assert.throws(()=>changeOrderStatus(s,id,'Novo'),/não pode voltar/);
});

test('cancelamento retira receita, mantém despesas e repõe estoque uma única vez',()=>{
 let s=order(saveExpense(seed(),expense()));const id=s.orders[0].id;
 s=changeOrderStatus(s,id,'Confirmado');assert.equal(getCashFlow(s).balance,7400);
 s=changeOrderStatus(s,id,'Cancelado');s=changeOrderStatus(s,id,'Cancelado');
 assert.equal(getCashFlow(s).income,0);assert.equal(getCashFlow(s).expense,2590);assert.equal(getCashFlow(s).balance,-2590);
 assert.equal(s.products[0].stock,1);assert.equal(s.expenses.length,1);
 assert.throws(()=>changeOrderStatus(s,id,'Confirmado'),/reabertos/);
});

test('pedidos antigos em separação e concluídos contam uma vez pela data original',()=>{
 const s=order(seed());s.orders[0].status='Em separação';s.orders[0].createdAt='2026-09-15T12:00:00.000Z';
 assert.equal(getCashFlow(s,{from:'2026-09-01',to:'2026-09-30'}).income,9990);
 const next=changeOrderStatus(s,s.orders[0].id,'Concluído');
 assert.equal(next.orders[0].confirmedAt,s.orders[0].createdAt);
 assert.equal(getCashFlow(next).entries[0].date,localDate(s.orders[0].createdAt));
});

test('despesa editada mantém identidade, sem duplicar, e sobrevive à criação de pedido',()=>{
 const original=seed(),saved=saveExpense(original,expense());const first=saved.expenses[0];
 const edited=saveExpense(saved,{...first,amount:3590,description:'Embalagens novas'});
 assert.equal(original.expenses.length,0);assert.equal(edited.expenses.length,1);
 assert.equal(edited.expenses[0].createdAt,first.createdAt);assert.equal(getCashFlow(edited).expense,3590);
 const next=order(edited);assert.deepEqual(next.expenses,edited.expenses);
 assert.throws(()=>saveExpense(saved,expense({id:'missing'})),/não encontrada/);
});

test('validação rejeita valor inválido e data impossível sem alterar o estado',()=>{
 for(const amount of [0,-1,1.5,NaN,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>saveExpense(seed(),expense({amount})));
 for(const date of ['2026-02-30','2026-13-01','2026-00-01','2026-02-29','22/10/2026',''])assert.throws(()=>saveExpense(seed(),expense({date})));
 assert.equal(saveExpense(seed(),expense({date:'2028-02-29'})).expenses.length,1);
 assert.throws(()=>saveExpense(seed(),expense({description:'  '})));
 assert.throws(()=>saveExpense(seed(),expense({category:'inexistente'})));
});

test('converte reais com vírgula ou ponto sem perder centavos nem aceitar ambiguidades',()=>{
 for(const [text,value] of [['99,90',9990],['99.90',9990],['1,5',150],['0.01',1],['100',10000]])assert.equal(parseAmount(text),value);
 for(const text of ['','-3','0','2,999','1.000,00','abc','1e3','9007199254740992'])assert.throws(()=>parseAmount(text));
});

test('período filtra receitas pela confirmação e despesas pela data, com resumo independente da busca',()=>{
 let s=saveExpense(seed(),expense());s=saveExpense(s,expense({date:'2026-09-30',amount:5000}));
 s=order(s);s=changeOrderStatus(s,s.orders[0].id,'Confirmado');s.orders[0].confirmedAt='2026-10-10T12:00:00.000Z';
 const report=getCashFlow(s,{from:'2026-10-01',to:'2026-10-31',type:'expense',query:'EMBALAGENS'});
 assert.equal(report.income,9990);assert.equal(report.expense,2590);assert.equal(report.balance,7400);assert.equal(report.entries.length,1);
 assert.equal(getCashFlow(s,{query:'cliente teste',type:'income'}).entries.length,1);
 assert.equal(getCashFlow(s,{query:'sem resultado'}).entries.length,0);
 assert.equal(getCashFlow(seed()).balance,0);
});

test('migra armazenamento antigo e persiste despesa e confirmação sem perder dados',()=>{
 const map=new Map();const previousStorage=globalThis.localStorage;
 globalThis.localStorage={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)};
 try{
  const legacy=seed();delete legacy.expenses;map.set('zm-exclusiva-v2',JSON.stringify(legacy));
  assert.deepEqual(getState().expenses,[]);
  actions['expense.save'](expense());
  const next=actions['order.create']([{id:'zm-1',size:'A confirmar',qty:1}],{name:'Teste',phone:'71999999999'});
  actions['order.status'](next.orders[0].id,'Confirmado');
  assert.equal(getState().expenses.length,1);assert.equal(getCashFlow(getState()).balance,7400);
 }finally{if(previousStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=previousStorage;}
});
