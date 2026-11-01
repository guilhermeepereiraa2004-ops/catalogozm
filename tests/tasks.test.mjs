import test from 'node:test';import assert from 'node:assert/strict';
import {saveTask,completeTask} from '../task-domain.js';import {deleteRecord,restoreRecord,getTrashEntries,getCashFlow} from '../domain.js';
import {mutate,handleApi} from '../server/api.js';import {memoryDB,product} from './backend-helpers.mjs';
import {deletionPrompt} from '../admin-trash.js';
const input={id:'task-test',title:'Organizar nova coleção',priority:'Alta',dueDate:'2026-11-05',note:'Separar por categoria'};
test('tarefas criam, editam, concluem e reabrem sem duplicar nem alterar estoque ou caixa',()=>{
 const original={products:[product],orders:[],expenses:[]};let state=saveTask(original,input);const created=state.tasks[0].createdAt;state=saveTask(state,{...input,title:'Revisar nova coleção',completedAt:'forjado'});assert.equal(state.tasks.length,1);assert.equal(state.tasks[0].completedAt,null);assert.equal(state.tasks[0].createdAt,created);
 state=completeTask(state,input.id,true);const completed=state.tasks[0].completedAt;assert.ok(completed);state=completeTask(state,input.id,true);assert.equal(state.tasks[0].completedAt,completed);state=completeTask(state,input.id,false);assert.equal(state.tasks[0].completedAt,null);assert.deepEqual(state.products,original.products);assert.deepEqual(getCashFlow(state),getCashFlow(original));
});
test('tarefas rejeitam campos inválidos e usam Lixeira reversível com título legível',()=>{
 let state=saveTask({products:[product],orders:[]},input);for(const patch of [{title:' '},{priority:'urgente'},{dueDate:'2026-02-30'},{dueDate:'amanhã'},{note:'x'.repeat(1001)},{id:'invalid'}])assert.throws(()=>saveTask(state,{...input,...patch}));assert.throws(()=>completeTask(state,input.id,'true'));
 state=completeTask(state,input.id,true);const completed=state.tasks[0].completedAt;state=deleteRecord(state,'task',input.id);assert.equal(getTrashEntries(state)[0].label,input.title);assert.throws(()=>saveTask(state,input),/Lixeira/);assert.throws(()=>completeTask(state,input.id,false),/Lixeira/);
 const html=deletionPrompt(state,'task',input.id,{esc:String,icon:()=>'',money:()=>{throw Error('Tarefa não possui preço');}});assert.ok(html.includes(input.title));assert.ok(!html.includes('NaN'));
 state=restoreRecord(state,'task',input.id);assert.equal(state.tasks[0].completedAt,completed);assert.equal(getTrashEntries(state).length,0);
});
test('API protege tarefas e gravações concorrentes preservam tarefas, pedidos e financeiro',async()=>{
 const db=memoryDB(),request=()=>new Request('https://loja.test/api/actions',{method:'POST',headers:{Origin:'https://loja.test','Content-Type':'application/json'},body:JSON.stringify({action:'task.save',args:[input]})});assert.equal((await handleApi(request(),{},{db})).status,401);assert.equal((await handleApi(request(),{},{db,admin:true})).status,200);
 await Promise.all([mutate(db,'task.complete',[input.id,true]),mutate(db,'income.save',[{description:'Receita teste',category:'Outras receitas',date:'2026-10-31',amount:3500}])]);const snapshot=(await db.read()).state;assert.ok(snapshot.tasks[0].completedAt);assert.equal(snapshot.incomes.length,1);
 const publicData=await (await handleApi(new Request('https://loja.test/api/catalog'),{},{db})).json();assert.deepEqual(publicData.tasks,[]);assert.ok(!JSON.stringify(publicData).includes(input.title));assert.equal(snapshot.products[0].stock,1);
});
