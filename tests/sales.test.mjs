import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveSale,receiveSale,getSaleTotals,getCashFlow,getActiveSales,getSaleOrderOptions,deleteRecord,restoreRecord,changeOrderStatus} from '../domain.js';
import {handleApi,mutate} from '../server/api.js';
import {memoryDB} from './backend-helpers.mjs';

const empty=()=>({products:[],orders:[],expenses:[]});
const input=(extra={})=>({id:'sale-ficticia-0001',date:'2026-11-05',customer:'Cliente fictícia',description:'Vestido e bolsa',total:15000,payments:{credit:7000,debit:3000},...extra});
const receipt=(extra={})=>({id:'recebimento-teste-001',date:'2026-11-09',method:'pix',amount:5000,...extra});

test('venda dividida soma formas, separa fiado do caixa e registra quitação no período do pagamento',()=>{
 const original=empty(),saved=saveSale(original,input());
 assert.equal(original.sales,undefined);
 assert.deepEqual(getSaleTotals(saved.sales[0]),{byMethod:{credit:7000,debit:3000,pix:0,cash:0},received:10000,due:5000});
 const next=receiveSale(saved,input().id,receipt());
 assert.equal(getCashFlow(next,{to:'2026-11-05'}).income,10000);
 assert.equal(getCashFlow(next,{from:'2026-11-06',query:'CLIENTE FICTICIA'}).entries[0].amount,5000);
 assert.equal(getCashFlow(next).income,15000);
 assert.equal(getSaleTotals(next.sales[0]).due,0);
 assert.equal(receiveSale(next,input().id,receipt()),next);
 assert.throws(()=>receiveSale(next,input().id,receipt({id:'recebimento-teste-002',amount:1})),/saldo/);
});

test('venda integral e fiado integral, com rejeição de formas e valores inválidos',()=>{
 const paid=saveSale(empty(),input({payments:{cash:15000}}));
 assert.equal(getSaleTotals(paid.sales[0]).due,0);
 const due=saveSale(empty(),input({payments:{}}));
 assert.equal(getCashFlow(due).income,0);
 assert.equal(getSaleTotals(due.sales[0]).due,15000);
 for(const payments of [{credit:15001},{credit:-1},{credit:0.5},{credit:'15000'},{transfer:100}])
  assert.throws(()=>saveSale(empty(),input({payments})));
 assert.throws(()=>receiveSale(due,input().id,receipt({date:'2026-11-04'})),/posterior/);
 const reordered=structuredClone(paid);
 reordered.sales[0].payments={pix:0,cash:15000,debit:0,credit:0};
 assert.equal(saveSale(reordered,input({payments:{cash:15000}})),reordered);
});

test('ficha vinculada substitui receita automática, impede vínculo duplo e respeita cancelamento e lixeira',()=>{
 const order={id:'ZM-TESTE',status:'Confirmado',createdAt:'2026-11-05T12:00:00Z',total:15000,customer:{name:'Cliente do pedido'},items:[{name:'Bolsa',qty:1}]};
 const initial={...empty(),orders:[order]};
 assert.equal(getCashFlow(initial).income,15000);
 const sale=saveSale(initial,input({orderId:order.id,customer:'Ignorado',description:'Ignorado',total:1}));
 assert.equal(sale.sales[0].customer,order.customer.name);
 assert.equal(sale.sales[0].total,15000);
 assert.equal(getSaleOrderOptions(sale).length,0);
 assert.equal(getCashFlow(sale).income,10000);
 assert.throws(()=>saveSale(sale,input({id:'sale-ficticia-0002',orderId:order.id})),/já tem uma ficha/);
 const deleted=deleteRecord(sale,'sale',input().id);
 assert.equal(getCashFlow(deleted).income,0);
 assert.equal(getCashFlow(restoreRecord(deleted,'sale',input().id)).income,10000);
 const cancelled=changeOrderStatus(sale,order.id,'Cancelado');
 assert.equal(getActiveSales(cancelled).length,0);
 assert.equal(getCashFlow(cancelled).income,0);
});

test('API guarda fichas apenas no admin e disputa por saldo não permite receber duas vezes',async()=>{
 const db=memoryDB(),body={action:'sale.save',args:[input()]};
 const post=(data,admin)=>handleApi(new Request('https://loja.test/api/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),{},{db,admin});
 assert.equal((await post(body,false)).status,401);
 const saved=await post(body,true);
 assert.equal(saved.status,200);
 assert.equal((await saved.json()).sales[0].customer,input().customer);
 const publicData=await (await handleApi(new Request('https://loja.test/api/catalog'),{},{db})).json();
 assert.equal(Object.hasOwn(publicData,'sales'),false);
 assert.equal(JSON.stringify(publicData).includes(input().customer),false);
 const outcomes=await Promise.allSettled([receipt(),receipt({id:'recebimento-teste-002'})].map(r=>mutate(db,'sale.receive',[input().id,r])));
 assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);
 const stored=(await db.read()).state;
 assert.equal(stored.sales[0].receipts.length,1);
 assert.equal(getCashFlow(stored).income,15000);
});
