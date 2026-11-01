import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {mountLookBuilder} from '../look-builder.js';import {mountPickupAgenda} from '../pickup-agenda.js';import {mountTodo} from '../todo.js';

const products=Array.from({length:7},(_,i)=>({id:`p${i}`,name:`Peça ${i}`,category:i%2?'Acessórios':'Vestidos',color:'Rosa',price:9990,stock:1,active:true,images:['/assets/look-01.webp'],createdAt:'2026-10-22'}));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){const {document,window}=parseHTML('<html><body><div id="panel"></div></body></html>'),old={};for(const k of ['document','window','location','localStorage','navigator','FormData'])old[k]=Object.getOwnPropertyDescriptor(globalThis,k);const store=new Map();for(const [key,value]of Object.entries({document,window,location:{hostname:'localhost',hash:'',origin:'http://localhost:4173'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},navigator:{clipboard:{writeText:async()=>{}}},FormData:class{constructor(form){this.form=form;}get(name){const input=this.form.querySelector(`[name="${name}"]`);return input?.localName==='select'?(input.querySelector('option[selected]')||input.querySelector('option')).getAttribute('value')||input.value:input?.value;}}}))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});window.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}});return{document,window,panel:document.querySelector('#panel'),restore(){for(const key of Object.keys(old))old[key]?Object.defineProperty(globalThis,key,old[key]):delete globalThis[key];}};}
test('montador limita seis peças, mantém total e confere preços atuais antes de baixar o card',async()=>{
 const env=setup();try{let painted=[],downloaded=0,refreshed=0;mountLookBuilder(env.panel,products,{paint:async(canvas,options)=>{painted=options.products;canvas.width=1080;canvas.height=1350;return canvas;},download:async()=>{downloaded++;},refresh:async()=>{refreshed++;return{products:products.map(p=>({...p,price:15000}))};}});
  const checkbox=id=>env.panel.querySelector(`[data-look-id="${id}"]`);for(let i=0;i<6;i++){checkbox('p'+i).checked=true;checkbox('p'+i).dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();}
  assert.equal(checkbox('p6').disabled,true);assert.equal(env.panel.querySelector('#look-download').disabled,false);assert.ok(env.panel.querySelector('#look-summary').textContent.includes('599,40'));
  env.panel.querySelector('#look-download').click();await flush();await flush();assert.equal(refreshed,1);assert.equal(downloaded,1);assert.equal(painted.reduce((sum,p)=>sum+p.price,0),90000);assert.ok(env.panel.querySelector('#look-summary').textContent.includes('900,00'));
  env.panel.querySelector('#look-clear').click();await flush();assert.equal(env.panel.querySelector('#look-download').disabled,true);
 }finally{env.restore();}
});
test('agenda oferece exemplos locais e registra uma retirada sem gravar pedidos reais',async()=>{
 const env=setup();try{let realWrites=0;mountPickupAgenda(env.panel,{products,orders:[]},{save:async()=>{realWrites++;throw Error('Não deveria chamar banco real');}});env.panel.querySelector('#pickup-demo').click();
  assert.ok(env.panel.querySelector('.retail-demo').textContent.includes('não afetam'));assert.equal(env.panel.querySelectorAll('.pickup-appointment').length,2);
  env.panel.querySelector('[data-pickup-collect="EXEMPLO-2"]').click();assert.equal(realWrites,0);env.panel.querySelector('[data-pickup-collect="EXEMPLO-2"]').click();await flush();assert.equal(realWrites,0);assert.ok(env.panel.querySelector('#pickup-feedback').textContent.includes('Pedido concluído'));
  env.panel.querySelector('#pickup-demo').click();assert.equal(env.panel.querySelector('.retail-demo'),null);
 }finally{env.restore();}
});
test('trocar de tela durante a conferência do look cancela a exportação e preserva o novo painel',async()=>{
 const env=setup();try{let complete,downloads=0;const pending=new Promise(resolve=>complete=resolve);mountLookBuilder(env.panel,products,{paint:async c=>c,download:async()=>{downloads++;},refresh:()=>pending});
  for(const id of ['p0','p1']){const input=env.panel.querySelector(`[data-look-id="${id}"]`);input.checked=true;input.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();}
  env.panel.querySelector('#look-download').click();mountTodo(env.panel,{products,orders:[]});complete({products});await flush();await flush();assert.equal(downloads,0);assert.ok(env.panel.querySelector('#todo-form'));assert.equal(env.panel.querySelector('#look-summary'),null);
 }finally{env.restore();}
});
test('peça esgotada na conferência impede PNG antigo e limpa a seleção indisponível',async()=>{
 const env=setup();try{let downloads=0;mountLookBuilder(env.panel,products,{paint:async c=>c,download:async()=>{downloads++;},refresh:async()=>({products:products.map(p=>p.id==='p0'?{...p,stock:0}:p)})});await flush();
  env.panel.querySelector('#look-clear').click();await flush();for(const id of ['p0','p1']){const input=env.panel.querySelector(`[data-look-id="${id}"]`);input.checked=true;input.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();}
  assert.equal(env.panel.querySelector('#look-download').disabled,false);env.panel.querySelector('#look-download').click();await flush();await flush();assert.equal(downloads,0);assert.equal(env.panel.querySelector('[data-look-remove="p0"]'),null);assert.equal(env.panel.querySelector('#look-download').disabled,true);assert.ok(env.panel.querySelector('#look-feedback').textContent.includes('disponível'));env.panel.querySelector('#look-clear').click();await flush();
 }finally{env.restore();}
});
test('trocar de tela enquanto salva agendamento não sobrescreve o novo módulo',async()=>{
 const env=setup();try{let complete;const pending=new Promise(resolve=>complete=resolve);const order={id:'pedido-teste',status:'Confirmado',customer:{name:'Cliente teste'},delivery:{mode:'pickup'},items:[{name:'Peça teste',qty:1}],pickup:{date:new Date().toLocaleDateString('en-CA',{timeZone:'America/Bahia'}),time:'14:30',status:'Agendada'}};mountPickupAgenda(env.panel,{products,orders:[order]},{save:()=>pending});const button=env.panel.querySelector('[data-pickup-ready]');assert.ok(button);button.click();mountTodo(env.panel,{products,orders:[]});complete({products,orders:[{...order,pickup:{...order.pickup,status:'Pronta'}}]});await flush();assert.ok(env.panel.querySelector('#todo-form'));assert.equal(env.panel.querySelector('.pickup-calendar'),null);
 }finally{env.restore();}
});
