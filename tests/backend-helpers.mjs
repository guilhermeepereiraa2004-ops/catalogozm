import assert from 'node:assert/strict';
import {mutate} from '../server/api.js';
import {getCashFlow,pickupLocation} from '../domain.js';
export const product={id:'test-dress',name:'Vestido teste',description:'Peça para teste',category:'Vestidos',price:9990,stock:1,images:['/assets/look-01.webp'],sizes:['A confirmar'],color:'Rosa',active:true};
export function memoryDB(){let revision=0,state={products:[structuredClone(product)],orders:[],expenses:[],requests:[]};return {async read(){return structuredClone({revision,state});},async commit(expected,next){if(expected!==revision)return false;state=structuredClone(next);revision++;return true;}};}
export async function exerciseDB(db){
 const customer={name:'Teste integração',phone:'71999999999',localDelivery:'yes',paymentMethod:'pix',note:'Dados fictícios para validação'};
 const cart=[{id:product.id,size:'A confirmar',qty:1,price:1}];
 const attempts=await Promise.allSettled([mutate(db,'order.create',[cart,customer],'test-order-request-0001'),mutate(db,'order.create',[cart,customer],'test-order-request-0002')]);
 assert.equal(attempts.filter(a=>a.status==='fulfilled').length,1,'Somente um pedido pode reservar a última unidade');
 const winner=attempts.find(a=>a.status==='fulfilled').value.order;
 assert.equal(winner.total,9990,'Preço vem do banco, não do navegador');
 assert.equal(winner.payment.method,'pix');assert.equal(winner.payment.status,'Pendente');assert.equal(winner.delivery.city,'Ubaitaba');assert.equal(winner.delivery.mode,'pickup');assert.equal(winner.delivery.address,pickupLocation.address);assert.equal(winner.delivery.fee,0);
 const winnerKey=attempts[0].status==='fulfilled'?'test-order-request-0001':'test-order-request-0002';
 const duplicate=await mutate(db,'order.create',[cart,customer],winnerKey);assert.equal(duplicate.order.id,winner.id);
 assert.equal(duplicate.state.orders.length,1);assert.equal(duplicate.state.products[0].stock,0);
 const confirmed=await mutate(db,'order.status',[winner.id,'Confirmado']);
 const first=confirmed.state.orders[0].confirmedAt;assert.equal(getCashFlow(confirmed.state).income,9990);
 const again=await mutate(db,'order.status',[winner.id,'Em separação']);assert.equal(again.state.orders[0].confirmedAt,first);assert.equal(getCashFlow(again.state).income,9990);
 const expense=await mutate(db,'expense.save',[{description:'Embalagens teste',category:'Embalagens',date:'2026-10-29',amount:1900}]);assert.equal(getCashFlow(expense.state).balance,8090);
 // Concurrent finance writes must preserve both records through CAS retries.
 await Promise.all([
  mutate(db,'income.save',[{description:'Venda presencial teste',category:'Venda presencial',date:'2026-10-29',amount:2500}]),
  mutate(db,'expense.save',[{...expense.state.expenses[0],amount:1900}])
 ]);
 const withIncome=(await db.read()).state;assert.equal(getCashFlow(withIncome).income,12490);assert.equal(withIncome.incomes.length,1);
 const savedIncome=withIncome.incomes[0];await mutate(db,'income.save',[{...savedIncome,amount:3500}]);
 const edited=(await db.read()).state;assert.equal(edited.incomes.length,1);assert.equal(edited.incomes[0].createdAt,savedIncome.createdAt);
 await Promise.all([mutate(db,'order.status',[winner.id,'Cancelado']),mutate(db,'order.status',[winner.id,'Cancelado'])]);
 const final=(await db.read()).state;assert.equal(final.products[0].stock,1);assert.equal(getCashFlow(final).income,3500);assert.equal(getCashFlow(final).expense,1900);assert.equal(getCashFlow(final).balance,1600);
 await assert.rejects(()=>mutate(db,'order.status',[winner.id,'Novo']),/reabertos/);
 // The same flow also runs against an isolated Neon schema: trash survives reads and CAS retries.
 const targets=[['product',product.id],['order',winner.id],['income',savedIncome.id],['expense',expense.state.expenses[0].id]];
 await Promise.all(targets.map(args=>mutate(db,'record.delete',args)));
 const trashed=(await db.read()).state;assert.ok(trashed.products[0].deletedAt);assert.equal(getCashFlow(trashed).balance,0);
 await Promise.all(targets.map(args=>mutate(db,'record.restore',args)));
 const restored=(await db.read()).state;assert.equal(restored.products[0].stock,1);assert.equal(restored.products[0].deletedAt,undefined);assert.equal(getCashFlow(restored).balance,1600);
}
