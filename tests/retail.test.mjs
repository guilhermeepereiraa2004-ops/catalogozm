import test from 'node:test';import assert from 'node:assert/strict';
import {savePickup,pickupOrders,lookSummary,bahiaDate} from '../retail-domain.js';
import {placeOrder,changeOrderStatus,getCashFlow} from '../domain.js';
import {mutate,handleApi} from '../server/api.js';import {memoryDB,product} from './backend-helpers.mjs';
const customer={name:'Cliente teste',phone:'71999999999',localDelivery:'yes',paymentMethod:'pix',note:''};
const scheduled={date:'2026-11-04',time:'14:30',status:'Agendada',note:'Retirada combinada'};
function initial(){return placeOrder({products:[structuredClone(product)],orders:[],expenses:[]},[{id:product.id,size:'A confirmar',qty:1}],customer);}
test('agendamento reserva só o horário; pronta exige confirmação; retirada conclui sem duplicar caixa/estoque',()=>{
 let state=initial();const id=state.orders[0].id;state=savePickup(state,id,scheduled);assert.equal(state.products[0].stock,0);assert.equal(getCashFlow(state).income,0);assert.equal(state.orders[0].status,'Novo');const created=state.orders[0].pickup.createdAt;
 assert.throws(()=>savePickup(state,id,{...scheduled,status:'Pronta'}),/Confirme/);
 state=changeOrderStatus(state,id,'Confirmado');const confirmedAt=state.orders[0].confirmedAt;state=savePickup(state,id,{...scheduled,status:'Pronta'});assert.equal(state.orders[0].pickup.createdAt,created);
 state=savePickup(state,id,{...scheduled,status:'Retirada'});assert.equal(state.orders[0].status,'Concluído');assert.equal(state.orders[0].confirmedAt,confirmedAt);assert.equal(getCashFlow(state).income,9990);assert.equal(state.products[0].stock,0);
 const collected=state.orders[0].pickup.collectedAt;state=savePickup(state,id,{...scheduled,status:'Retirada'});assert.equal(state.orders[0].pickup.collectedAt,collected);assert.equal(getCashFlow(state).income,9990);
 assert.throws(()=>savePickup(state,id,{...scheduled,date:'2026-11-05'}),/já foi/);assert.throws(()=>changeOrderStatus(state,id,'Em separação'),/retirado/);
});
test('agenda rejeita datas, horários, estados e pedidos incompatíveis sem gravar; conclusão por Pedidos também fecha retirada',()=>{
 const state=initial(),id=state.orders[0].id;for(const patch of [{date:'2026-02-30'},{date:'2026-13-01'},{time:'24:00'},{time:'12:99'},{status:'Inventado'},{note:'x'.repeat(501)}])assert.throws(()=>savePickup(state,id,{...scheduled,...patch}));assert.equal(state.orders[0].pickup,undefined);
 const cancelled=changeOrderStatus(state,id,'Cancelado');assert.throws(()=>savePickup(cancelled,id,scheduled),/disponível/);assert.equal(pickupOrders(cancelled).length,0);
 assert.throws(()=>savePickup({...state,orders:[{...state.orders[0],deletedAt:'agora'}]},id,scheduled),/disponível/);
 assert.throws(()=>savePickup({...state,orders:[{...state.orders[0],delivery:{mode:'shipping'}}]},id,scheduled),/retirada/);
 const prepared=savePickup(changeOrderStatus(state,id,'Confirmado'),id,scheduled),completed=changeOrderStatus(prepared,id,'Concluído');assert.equal(completed.orders[0].pickup.status,'Retirada');assert.ok(completed.orders[0].pickup.collectedAt);
 assert.equal(bahiaDate('2026-11-01T01:00:00Z'),'2026-10-31');
});
test('API de agenda exige admin; disputa com cancelamento preserva uma única devolução e remove receita',async()=>{
 const db=memoryDB(),created=await mutate(db,'order.create',[[{id:product.id,size:'A confirmar',qty:1}],customer],'retail-request-00001'),id=created.order.id;
 const req=()=>new Request('https://loja.test/api/actions',{method:'POST',headers:{Origin:'https://loja.test','Content-Type':'application/json'},body:JSON.stringify({action:'pickup.save',args:[id,scheduled]})});
 assert.equal((await handleApi(req(),{},{db,admin:false})).status,401);assert.equal((await handleApi(req(),{},{db,admin:true})).status,200);
 await mutate(db,'order.status',[id,'Confirmado']);await Promise.allSettled([mutate(db,'pickup.save',[id,{...scheduled,status:'Retirada'}]),mutate(db,'order.status',[id,'Cancelado'])]);
 const final=(await db.read()).state;assert.equal(final.orders[0].status,'Cancelado');assert.equal(final.products[0].stock,1);assert.equal(getCashFlow(final).income,0);assert.equal(pickupOrders(final).length,0);
});
test('look soma os preços atuais e rejeita repetidas, ocultas, apagadas, sem estoque ou mais de seis peças',()=>{
 const products=Array.from({length:7},(_,i)=>({...product,id:String(i),price:9990+i,active:true,stock:1}));assert.equal(lookSummary(products,['0','1']).total,19981);assert.throws(()=>lookSummary(products,['0']));assert.throws(()=>lookSummary(products,['0','0']));assert.throws(()=>lookSummary(products,products.map(p=>p.id)));
 for(const patch of [{stock:0},{active:false},{deletedAt:'agora'}])assert.throws(()=>lookSummary([{...products[0],...patch},products[1]],['0','1']),/disponível/);
});
test('data de cadastro é definida na criação e preservada nas edições para o relatório de estoque',async()=>{
 const db=memoryDB(),newProduct={...product,id:'novo'};await mutate(db,'product.save',[newProduct]);const created=(await db.read()).state.products.find(p=>p.id==='novo');assert.ok(created.createdAt);await mutate(db,'product.save',[{...created,name:'Nome editado',createdAt:'1900-01-01'}]);assert.equal((await db.read()).state.products.find(p=>p.id==='novo').createdAt,created.createdAt);
});
