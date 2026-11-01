import {changeOrderStatus} from './domain.js';
export const pickupStatuses=['Agendada','Pronta','Retirada'];
export function bahiaDate(value=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 const part=type=>parts.find(p=>p.type===type).value;return `${part('year')}-${part('month')}-${part('day')}`;
}
function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [y,m,d]=value.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));return y>=2000&&y<=2100&&date.toISOString().slice(0,10)===value;}
export function savePickup(state,id,input){
 const order=state.orders.find(o=>o.id===id);
 if(!order||order.deletedAt||order.status==='Cancelado')throw Error('Este pedido não está disponível para agendar.');
 if(order.delivery?.mode!=='pickup')throw Error('A agenda aceita apenas pedidos de retirada na loja.');
 if(!input||!validDate(input.date)||typeof input.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time))throw Error('Informe uma data válida e um horário de retirada.');
 if(!pickupStatuses.includes(input.status)||typeof (input.note??'')!=='string'||(input.note||'').length>500)throw Error('Revise o status e a observação da retirada.');
 if(order.pickup?.status==='Retirada'||order.status==='Concluído'){
  if(order.pickup?.status==='Retirada'&&input.status==='Retirada'&&input.date===order.pickup.date&&input.time===order.pickup.time&&(input.note||'').trim()===(order.pickup.note||''))return state;
  throw Error('Este pedido já foi retirado ou concluído e não pode ser reagendado.');
 }
 if(input.status!=='Agendada'&&!['Confirmado','Em separação'].includes(order.status))throw Error('Confirme o pedido antes de marcar a peça como pronta ou retirada.');
 const now=new Date().toISOString(),pickup={date:input.date,time:input.time,status:input.status,note:(input.note||'').trim(),createdAt:order.pickup?.createdAt||now,updatedAt:now,...(input.status==='Retirada'?{collectedAt:now}:{})};
 const next=input.status==='Retirada'?changeOrderStatus(state,id,'Concluído'):state;
 return {...next,orders:next.orders.map(o=>o.id===id?{...o,pickup}:o)};
}
export function pickupOrders(state){return state.orders.filter(o=>!o.deletedAt&&o.status!=='Cancelado'&&o.delivery?.mode==='pickup');}
export function lookSummary(products,ids){
 if(!Array.isArray(ids)||ids.length<2||ids.length>6||new Set(ids).size!==ids.length)throw Error('Escolha de 2 a 6 peças diferentes para compor o look.');
 const chosen=ids.map(id=>{const p=products.find(p=>p.id===id);if(!p||p.deletedAt||!p.active||p.stock<1)throw Error('Uma das peças não está mais disponível. Atualize sua seleção.');return p;});
 return {products:chosen,total:chosen.reduce((sum,p)=>sum+p.price,0)};
}
