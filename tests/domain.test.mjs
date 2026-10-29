import {test} from 'node:test';import assert from 'node:assert/strict';import {initialProducts} from '../catalog.js';import {placeOrder,changeOrderStatus,validateProduct} from '../domain.js';
const seed=()=>({products:structuredClone(initialProducts),orders:[]});const customer={name:'Cliente Teste',phone:'71999999999',localDelivery:'yes',paymentMethod:'pix',address:'Rua de Teste, 1, Centro'};const line=(qty=1)=>[{id:'zm-1',qty,size:'A confirmar'}];
test('pedido reserva estoque e calcula preço a partir do catálogo',()=>{const s=placeOrder(seed(),line(),customer);assert.equal(s.products[0].stock,0);assert.equal(s.orders[0].total,9990);assert.equal(seed().products[0].stock,1);});
test('pedido exige confirmação de Ubaitaba, endereço e pagamento sem marcar recebimento',()=>{
 for(const patch of [{localDelivery:'no'},{localDelivery:''},{paymentMethod:''},{paymentMethod:'cartao-nao-configurado'},{address:''}]){
  const before=seed();assert.throws(()=>placeOrder(before,line(),{...customer,...patch}));assert.equal(before.products[0].stock,1);assert.equal(before.orders.length,0);
 }
 for(const method of ['pix','arrange']){
  const order=placeOrder(seed(),line(),{...customer,paymentMethod:method}).orders[0];
  assert.deepEqual(order.payment,{method,status:'Pendente'});assert.deepEqual(order.delivery,{mode:'local',city:'Ubaitaba',address:customer.address,fee:null});assert.equal(order.status,'Novo');
 }
});
test('impede venda além do estoque, inclusive linhas duplicadas',()=>{assert.throws(()=>placeOrder(seed(),line(2),customer),/Estoque/);assert.throws(()=>placeOrder(seed(),[...line(),...line()],customer),/Estoque/);});
test('rejeita produto oculto, tamanho inválido e quantidade negativa',()=>{const s=seed();s.products[0].active=false;assert.throws(()=>placeOrder(s,line(),customer));assert.throws(()=>placeOrder(seed(),[{...line()[0],size:'X'}],customer));assert.throws(()=>placeOrder(seed(),line(-1),customer));});
test('cancelamento devolve estoque exatamente uma vez e não permite reabrir',()=>{let s=placeOrder(seed(),line(),customer);const id=s.orders[0].id;s=changeOrderStatus(s,id,'Cancelado');assert.equal(s.products[0].stock,1);s=changeOrderStatus(s,id,'Cancelado');assert.equal(s.products[0].stock,1);assert.throws(()=>changeOrderStatus(s,id,'Novo'),/reabertos/);});
test('validar cadastro, estoque inteiro e preço em centavos',()=>{assert.equal(validateProduct(initialProducts[0]).price,9990);assert.throws(()=>validateProduct({...initialProducts[0],price:0}));assert.throws(()=>validateProduct({...initialProducts[0],stock:1.5}));assert.throws(()=>validateProduct({...initialProducts[0],images:[]}));});
test('todas as 42 fotos aparecem no catálogo, sem perda de arquivos',()=>{const photos=new Set(initialProducts.flatMap(p=>p.images));assert.equal(photos.size,42);assert.equal(initialProducts.length,39);assert.ok(initialProducts.every(p=>p.price===9990));});
