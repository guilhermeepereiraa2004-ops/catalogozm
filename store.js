export {getCashFlow,expenseCategories,orderStatuses,localDate,parseAmount} from './domain.js';
let cached={products:[],orders:[],expenses:[]};
let pendingOrder;
export function getState(){return cached;}
async function call(url,options){
 let response;try{response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});}catch{throw new Error('Sem conexão com a loja. Verifique sua internet e tente novamente.');}
 let data;try{data=await response.json();}catch{throw new Error('O servidor da loja não respondeu. Tente novamente.');}
 if(!response.ok){const error=new Error(data.error||'Não foi possível salvar. Tente novamente.');error.status=response.status;error.adminUrl=data.adminUrl;throw error;}
 return data;
}
export async function refreshState(admin=false){cached=await call(admin?'/api/state':'/api/catalog');return cached;}
async function run(action,args){
 const fingerprint=JSON.stringify(args);
 if(action==='order.create'&&pendingOrder?.fingerprint!==fingerprint){
  // Mantém a chave de tentativa entre recarregamentos, sem guardar dados pessoais.
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  let saved;try{saved=JSON.parse(sessionStorage.getItem('zm-order-attempt'));}catch{}
  pendingOrder={fingerprint,key:saved?.digest===digest?saved.key:crypto.randomUUID()};
  try{sessionStorage.setItem('zm-order-attempt',JSON.stringify({digest,key:pendingOrder.key}));}catch{}
 }
 const body=JSON.stringify({action,args,...(action==='order.create'?{requestKey:pendingOrder.key}:{})});
 if(new TextEncoder().encode(body).length>4000000)throw new Error('As fotos ultrapassam o limite do cadastro. Use imagens menores ou menos fotos.');
 const data=await call('/api/actions',{method:'POST',headers:{'Content-Type':'application/json'},body});
 cached={products:data.products,orders:data.orders,expenses:data.expenses};
 if(data.order){cached.orders=[data.order,...cached.orders.filter(o=>o.id!==data.order.id)];pendingOrder=undefined;try{sessionStorage.removeItem('zm-order-attempt');}catch{}}
 return cached;
}
export const actions={
 'order.create':(cart,customer)=>run('order.create',[cart,customer]),
 'order.status':(id,status)=>run('order.status',[id,status]),
 'expense.save':expense=>run('expense.save',[expense]),
 'product.save':product=>run('product.save',[product]),
 'product.toggle':id=>run('product.toggle',[id])
};
