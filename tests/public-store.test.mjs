import test from 'node:test';
import assert from 'node:assert/strict';
import {createVercelHandler} from '../server/vercel.js';
import {memoryDB,product} from './backend-helpers.mjs';
const request=(action,args)=>new Request('https://loja.test/api/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,args,requestKey:'anonymous-order-request-0001'})});
test('vitrine pública aceita pedido sem sessão e mantém financeiro e alterações restritos',async()=>{
 const db=memoryDB(),publicSite=createVercelHandler({VERCEL_ENV:'production',VERCEL_PRIVATE_ADMIN:'1'},{db});
 const result=await publicSite.fetch(request('order.create',[[{id:product.id,size:'A confirmar',qty:1}],{name:'Cliente teste',phone:'71999999999',localDelivery:'yes',paymentMethod:'pix'}]));
 assert.equal(result.status,200);const order=await result.json();assert.equal(order.order.total,9990);assert.deepEqual(order.orders,[]);assert.deepEqual(order.expenses,[]);
 assert.equal(order.order.payment.method,'pix');assert.equal(order.order.payment.status,'Pendente');assert.equal(order.order.delivery.city,'Ubaitaba');assert.equal(order.order.delivery.mode,'pickup');assert.match(order.order.delivery.address,/Avenida Presidente Vargas/);
 const privateState=await publicSite.fetch(new Request('https://loja.test/api/state'));assert.equal(privateState.status,401);const rejection=await privateState.json();assert.equal(rejection.adminUrl,undefined);assert.equal('orders' in rejection,false);
 for(const [action,args] of [['order.status',[order.order.id,'Confirmado']],['income.save',[{}]],['expense.save',[{}]],['product.save',[product]],['product.toggle',[product.id]]])assert.equal((await publicSite.fetch(request(action,args))).status,401,action);
 const catalog=await (await publicSite.fetch(new Request('https://loja.test/api/catalog'))).json();assert.equal(catalog.products[0].stock,0);assert.deepEqual(catalog.orders,[]);
 const admin=createVercelHandler({VERCEL_ENV:'preview',VERCEL_PRIVATE_ADMIN:'1'},{db,authService:{isAdmin:async()=>true}});
 const state=await (await admin.fetch(new Request('https://admin.test/api/state',{headers:{cookie:'session=verified'}}))).json();assert.equal(state.orders.length,1);assert.equal(state.orders[0].id,order.order.id);
 assert.equal((await admin.fetch(new Request(request('order.status',[order.order.id,'Confirmado']),{headers:{'Content-Type':'application/json',cookie:'session=verified'}}))).status,200);
 const refreshed=await (await admin.fetch(new Request('https://admin.test/api/state',{headers:{cookie:'session=verified'}}))).json();assert.equal(refreshed.orders[0].status,'Confirmado');
});
