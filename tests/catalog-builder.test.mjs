import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {mountCatalogBuilder,sharedCatalogView} from '../catalog-share.js';
test('admin filtra, limpa, seleciona individualmente e copia exatamente o link mostrado na prévia',async()=>{
 const {document,window}=parseHTML('<html><body><div id="panel"></div></body></html>');
 const previous={document:globalThis.document,window:globalThis.window,location:globalThis.location,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator')};
 let copied='',opened='';globalThis.document=document;globalThis.window=window;globalThis.location={origin:'http://localhost:4173',hostname:'localhost'};Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{copied=text;}}}});window.open=url=>{opened=url;};
 const products=[{id:'1',name:'Vestido',category:'Vestidos',color:'Azul',price:9990,stock:1,active:true,images:['/assets/look-01.webp']},{id:'2',name:'Bolsa',category:'Acessórios',color:'Rosa',price:15000,stock:1,active:true,images:['/assets/look-02.webp']},{id:'3',name:'Não mostrar',category:'Vestidos',price:9990,stock:0,active:true}];
 try{
  const panel=document.querySelector('#panel'),find=s=>panel.querySelector(s),change=(id,value)=>{const input=find('#'+id);input.value=value;input.dispatchEvent(new window.Event('input',{bubbles:true}));};mountCatalogBuilder(panel,products);
  assert.equal(panel.querySelectorAll('[data-share-id]').length,2);assert.ok(!panel.textContent.includes('Não mostrar'));
  change('share-query','Azul');assert.equal(panel.querySelectorAll('[data-share-id]').length,1);find('#share-clear').click();assert.equal(find('#share-copy').disabled,true);
  find('#share-all').click();assert.equal(panel.querySelectorAll('[data-share-id]').length,2);const checkbox=find('[data-share-id="1"]');checkbox.checked=false;checkbox.dispatchEvent(new window.Event('change',{bubbles:true}));
  find('#share-copy').click();await new Promise(resolve=>setImmediate(resolve));assert.equal(new URL(copied).hash.includes('itens=2'),true);assert.equal(find('#share-output').value,copied);find('#share-preview').click();assert.equal(opened,copied);
  const publicHtml=sharedCatalogView(products,'#colecao?itens=1,2,3&titulo=%3Cscript%3Eteste%3C%2Fscript%3E');assert.ok(publicHtml.includes('&lt;script&gt;teste&lt;/script&gt;'));assert.ok(!publicHtml.includes('Não mostrar'));assert.ok(!publicHtml.includes('<script>teste'));
 }finally{for(const key of ['document','window','location'])previous[key]===undefined?delete globalThis[key]:globalThis[key]=previous[key];previous.navigator?Object.defineProperty(globalThis,'navigator',previous.navigator):delete globalThis.navigator;}
});
