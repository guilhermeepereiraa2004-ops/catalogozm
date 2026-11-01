import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {mountTodo} from '../todo.js';import {saveTask,completeTask} from '../task-domain.js';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('To-do permite adicionar, editar, concluir, filtrar e reabrir tarefas',async()=>{
 const {document,window}=parseHTML('<html><body><div id="panel"></div></body></html>'),before={};for(const key of ['document','window','FormData'])before[key]=Object.getOwnPropertyDescriptor(globalThis,key);let state={tasks:[]};
 Object.defineProperty(globalThis,'document',{configurable:true,value:document});Object.defineProperty(globalThis,'window',{configurable:true,value:window});Object.defineProperty(globalThis,'FormData',{configurable:true,value:class{constructor(form){this.form=form;}get(name){const element=this.form.querySelector(`[name="${name}"]`);return element.localName==='select'?(element.querySelector('[selected]')||element.querySelector('option')).textContent:element.value;}}});
 try{
  const panel=document.querySelector('#panel');mountTodo(panel,state,{save:async value=>(state=saveTask(state,value)),complete:async(id,done)=>(state=completeTask(state,id,done))});
  const submit=()=>panel.querySelector('#todo-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));panel.querySelector('[name=title]').value='Organizar vitrine';panel.querySelector('[name=note]').value='Separar novidades';submit();await flush();assert.equal(state.tasks.length,1);const id=state.tasks[0].id;
  panel.querySelector('[data-todo-edit]').click();panel.querySelector('[name=title]').value='Organizar vitrine da semana';submit();await flush();assert.equal(state.tasks.length,1);assert.equal(state.tasks[0].id,id);assert.equal(state.tasks[0].title,'Organizar vitrine da semana');
  let checkbox=panel.querySelector('[data-todo-complete]');checkbox.checked=true;checkbox.dispatchEvent(new window.Event('change',{bubbles:true}));await flush();assert.ok(state.tasks[0].completedAt);assert.equal(panel.querySelectorAll('.todo-item').length,0);
  panel.querySelector('[data-todo-filter=done]').click();assert.equal(panel.querySelectorAll('.todo-item').length,1);checkbox=panel.querySelector('[data-todo-complete]');checkbox.checked=false;checkbox.dispatchEvent(new window.Event('change',{bubbles:true}));await flush();assert.equal(state.tasks[0].completedAt,null);panel.querySelector('[data-todo-filter=pending]').click();assert.equal(panel.querySelectorAll('.todo-item').length,1);assert.equal(panel.querySelector('[data-delete-kind=task]').dataset.deleteId,id);
 }finally{for(const key of Object.keys(before))before[key]?Object.defineProperty(globalThis,key,before[key]):delete globalThis[key];}
});
