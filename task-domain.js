export const taskPriorities=['Alta','Normal','Baixa'];
function validDate(value){if(value==='')return true;if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [y,m,d]=value.split('-').map(Number);return y>=2000&&y<=2100&&new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)===value;}
export function saveTask(state,input){
 if(!input||typeof input.title!=='string'||!input.title.trim()||input.title.length>160||typeof (input.note??'')!=='string'||(input.note||'').length>1000||!taskPriorities.includes(input.priority)||!validDate(input.dueDate??''))throw Error('Revise o título, a prioridade e o prazo da tarefa.');
 if(input.id!==undefined&&(typeof input.id!=='string'||!/^task-[a-zA-Z0-9-]{1,90}$/.test(input.id)))throw Error('Identificador da tarefa inválido.');
 const tasks=state.tasks||[],previous=tasks.find(t=>t.id===input.id);if(previous?.deletedAt)throw Error('Restaure a tarefa na Lixeira antes de editar.');
 const now=new Date().toISOString(),task={id:previous?.id||input.id||`task-${crypto.randomUUID()}`,title:input.title.trim(),note:(input.note||'').trim(),dueDate:input.dueDate||'',priority:input.priority,createdAt:previous?.createdAt||now,updatedAt:now,completedAt:previous?.completedAt||null};
 return {...state,tasks:previous?tasks.map(t=>t.id===task.id?task:t):[task,...tasks]};
}
export function completeTask(state,id,completed){
 if(typeof completed!=='boolean')throw Error('Situação da tarefa inválida.');const task=(state.tasks||[]).find(t=>t.id===id);if(!task||task.deletedAt)throw Error('Tarefa não encontrada ou na Lixeira.');
 if(Boolean(task.completedAt)===completed)return state;
 const now=new Date().toISOString();return {...state,tasks:state.tasks.map(t=>t.id===id?{...t,completedAt:completed?now:null,updatedAt:now}:t)};
}
