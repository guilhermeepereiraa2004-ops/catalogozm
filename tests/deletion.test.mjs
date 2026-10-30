import test from 'node:test';
import assert from 'node:assert/strict';
import {deleteRecord,restoreRecord,getTrashEntries,getCashFlow,placeOrder,changeOrderStatus,saveIncome,saveExpense} from '../domain.js';
import {handleApi,mutate,visibleState} from '../server/api.js';
import {memoryDB,product} from './backend-helpers.mjs';
const seed=()=>({products:[structuredClone(product)],orders:[],incomes:[],expenses:[],requests:[]});
const customer={name:'Teste lixeira',phone:'00000000000',localDelivery:'yes',paymentMethod:'arrange'};
const cart=[{id:product.id,size:'A confirmar',qty:1}];
const withOrder=status=>{let s=placeOrder(seed(),cart,customer);if(status!=='Novo')s=changeOrderStatus(s,s.orders[0].id,status);return s;};

test('receitas e despesas manuais saem do saldo e voltam sem duplicação',()=>{
 let s=saveIncome(seed(),{description:'Entrada',amount:5000,date:'2026-10-29',category:'Outras receitas'});
 s=saveExpense(s,{description:'Gasto',amount:1200,date:'2026-10-29',category:'Outras'});
 const income=s.incomes[0],expense=s.expenses[0];assert.equal(getCashFlow(s).balance,3800);
 s=deleteRecord(s,'income',income.id);s=deleteRecord(s,'expense',expense.id);assert.equal(getCashFlow(s).balance,0);assert.equal(getTrashEntries(s).length,2);
 const deletedAt=s.incomes[0].deletedAt;s=deleteRecord(s,'income',income.id);assert.equal(s.incomes[0].deletedAt,deletedAt);
 assert.throws(()=>saveIncome(s,income),/Restaure/);assert.throws(()=>saveExpense(s,expense),/Restaure/);
 s=restoreRecord(s,'income',income.id);s=restoreRecord(s,'expense',expense.id);s=restoreRecord(s,'income',income.id);
 assert.equal(getCashFlow(s).balance,3800);assert.equal(s.incomes.length,1);assert.equal(s.incomes[0].createdAt,income.createdAt);assert.equal(getTrashEntries(s).length,0);
});

test('apagar receita de pedido altera somente o caixa e respeita cancelamento',()=>{
 let s=withOrder('Confirmado');const order=s.orders[0],date=order.confirmedAt;
 s=deleteRecord(s,'order-income',order.id);assert.equal(getCashFlow(s).income,0);assert.equal(s.orders[0].status,'Confirmado');assert.equal(s.products[0].stock,0);
 s=changeOrderStatus(s,order.id,'Concluído');assert.equal(getCashFlow(s).income,0);
 s=restoreRecord(s,'order-income',order.id);assert.equal(getCashFlow(s).income,9990);assert.equal(s.orders[0].confirmedAt,date);assert.equal(s.products[0].stock,0);
 s=deleteRecord(s,'order-income',order.id);s=changeOrderStatus(s,order.id,'Cancelado');assert.equal(getTrashEntries(s)[0].canRestore,false);
 assert.throws(()=>restoreRecord(s,'order-income',order.id),/confirmado/);
});

test('apagar pedido em aberto devolve estoque uma vez e restauração reserva novamente',()=>{
 for(const status of ['Novo','Confirmado','Em separação']){
  let s=withOrder(status);const order=s.orders[0];s=deleteRecord(s,'order',order.id);s=deleteRecord(s,'order',order.id);
  assert.equal(s.products[0].stock,1);assert.equal(getCashFlow(s).income,0);assert.equal(s.orders[0].status,status);
  assert.throws(()=>changeOrderStatus(s,order.id,'Confirmado'),/Restaure/);
  s=restoreRecord(s,'order',order.id);s=restoreRecord(s,'order',order.id);assert.equal(s.products[0].stock,0);assert.equal(s.orders[0].status,status);assert.equal(s.orders[0].confirmedAt,order.confirmedAt);
  assert.equal(getCashFlow(s).income,status==='Novo'?0:9990);
 }
});

test('excluir e restaurar venda concluída ou cancelada não repõe estoque indevidamente',()=>{
 for(const status of ['Concluído','Cancelado']){
  let s=withOrder(status);const id=s.orders[0].id,stock=s.products[0].stock;
  s=deleteRecord(s,'order',id);assert.equal(s.products[0].stock,stock);assert.equal(getCashFlow(s).income,0);
  s=restoreRecord(s,'order',id);assert.equal(s.products[0].stock,stock);assert.equal(getCashFlow(s).income,status==='Concluído'?9990:0);
 }
});

test('produto apagado não é vendido; pedidos existentes preservam a peça e repõem na lixeira',()=>{
 let s=withOrder('Novo');const id=s.orders[0].id;s=deleteRecord(s,'product',product.id);
 assert.equal(visibleState(s,false).products.length,0);assert.throws(()=>placeOrder(s,cart,customer),/peça mudou/);assert.equal(s.orders[0].items[0].name,product.name);
 s=changeOrderStatus(s,id,'Cancelado');assert.equal(s.products[0].stock,1);s=restoreRecord(s,'product',product.id);
 assert.equal(visibleState(s,false).products.length,1);assert.equal(s.products[0].stock,1);
});

test('restaurar pedido disputa o estoque com nova venda e não aceita retentativa apagada',async()=>{
 const db=memoryDB(),first=await mutate(db,'order.create',[cart,customer],'trash-request-first-0001'),id=first.order.id;
 await Promise.all([mutate(db,'record.delete',['order',id]),mutate(db,'record.delete',['order',id])]);assert.equal((await db.read()).state.products[0].stock,1);
 await assert.rejects(()=>mutate(db,'order.create',[cart,customer],'trash-request-first-0001'),/apagado/);
 const results=await Promise.allSettled([mutate(db,'record.restore',['order',id]),mutate(db,'order.create',[cart,customer],'trash-request-second-0002')]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);const s=(await db.read()).state;assert.equal(s.products[0].stock,0);assert.equal(s.orders.filter(o=>!o.deletedAt).length,1);
});

test('API exige admin para apagar/restaurar e não edita produto na lixeira',async()=>{
 const db=memoryDB(),request=action=>new Request('https://loja.test/api/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,args:['product',product.id]})});
 for(const action of ['record.delete','record.restore'])assert.equal((await handleApi(request(action),{},{db})).status,401);
 assert.equal((await handleApi(request('record.delete'),{},{admin:true,db})).status,200);
 const catalog=await (await handleApi(new Request('https://loja.test/api/catalog'),{},{db})).json();assert.equal(catalog.products.length,0);assert.deepEqual(catalog.orders,[]);
 await assert.rejects(()=>mutate(db,'product.save',[product]),/Restaure/);await assert.rejects(()=>mutate(db,'product.toggle',[product.id]),/Lixeira/);
 assert.equal((await handleApi(request('record.restore'),{},{admin:true,db})).status,200);assert.equal((await db.read()).state.products[0].stock,1);
 await assert.rejects(()=>mutate(db,'record.delete',['constructor',product.id]),/Tipo/);
});
