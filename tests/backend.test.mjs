import test from 'node:test';
import assert from 'node:assert/strict';
import {handleApi,mutate} from '../server/api.js';
import {getCashFlow} from '../domain.js';
import {product,memoryDB,exerciseDB} from './backend-helpers.mjs';
test('concorrência, idempotência, preço, confirmação e cancelamento atômicos',()=>exerciseDB(memoryDB()));
test('API protege dados administrativos, rejeita CSRF e esconde clientes do catálogo',async()=>{
 const db=memoryDB();
 assert.equal((await handleApi(new Request('https://loja.test/api/state'),{},{db})).status,401);
 const csrf=new Request('https://loja.test/api/actions',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://outro.test'},body:'{}'});
 assert.equal((await handleApi(csrf,{},{admin:true,db})).status,403);
 const action=new Request('https://loja.test/api/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'product.toggle',args:[product.id]})});
 assert.equal((await handleApi(action,{},{db})).status,401);
 const response=await handleApi(new Request('https://loja.test/api/catalog'),{},{db});const data=await response.json();assert.equal(data.products.length,1);assert.deepEqual(data.orders,[]);assert.deepEqual(data.expenses,[]);assert.equal('requests' in data,false);
});
test('cadastro rejeita URL de foto externa, tamanho vazio e dinheiro inválido',async()=>{
 for(const patch of [{images:['https://externo.test/x.png']},{sizes:[]},{price:0},{stock:-1}])await assert.rejects(()=>mutate(memoryDB(),'product.save',[{...product,...patch}]));
});
