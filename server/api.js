import {placeOrder,changeOrderStatus,validateProduct,saveExpense} from '../domain.js';
import {categories} from '../catalog.js';
import {createDatabase} from './database.js';
export class InputError extends Error{}
function requireInput(ok,message){if(!ok)throw new InputError(message);}
function text(value,max){return typeof value==='string'&&value.length<=max;}
function productInput(p){
 requireInput(p&&text(p.id,100)&&/^[\w-]+$/.test(p.id),'Identificador de produto inválido.');
 requireInput(text(p.name,100)&&text(p.description,1500)&&text(p.color,40),'Revise os campos do produto.');
 requireInput(categories.slice(1).includes(p.category),'Categoria inválida.');
 requireInput(Array.isArray(p.sizes)&&p.sizes.length>0&&p.sizes.length<=20&&p.sizes.every(s=>text(s,40)&&s.trim()),'Tamanhos inválidos.');
 requireInput(Array.isArray(p.images)&&p.images.length<=6&&p.images.every(x=>text(x,1500000)&&(/^\/assets\/[\w.-]+\.(webp|png|jpg|jpeg)$/.test(x)||/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(x))),'Fotos inválidas ou muito grandes.');
 requireInput(Number.isSafeInteger(p.price)&&p.price<=100000000&&Number.isSafeInteger(p.stock)&&p.stock<=1000000,'Preço ou estoque fora do limite.');
 validateProduct(p);
 return {id:p.id,name:p.name.trim(),description:p.description.trim(),category:p.category,color:p.color,images:p.images,sizes:p.sizes,price:p.price,stock:p.stock,active:Boolean(p.active),featured:Boolean(p.featured)};
}
export async function mutate(db,action,args,requestKey){
 requireInput(Array.isArray(args),'Requisição inválida.');
 if(action==='order.create'){
  const [cart,customer]=args;
  requireInput(Array.isArray(cart)&&cart.length<=50&&customer&&text(customer.name,100)&&text(customer.phone,20)&&text(customer.note||'',500),'Revise os dados do pedido.');
  requireInput(text(requestKey,100)&&/^[\w-]{16,100}$/.test(requestKey),'Identificador de pedido inválido.');
 }
 const fingerprint=action==='order.create'?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(args))))).map(x=>x.toString(16).padStart(2,'0')).join(''):'';
 for(let attempt=0;attempt<8;attempt++){
  const snapshot=await db.read();const current=snapshot.state;let next,order;
  if(action==='order.create'){
   const prior=(current.requests||[]).find(r=>r.key===requestKey);
   if(prior){requireInput(prior.fingerprint===fingerprint,'Esta tentativa pertence a outro pedido.');return {state:current,order:current.orders.find(o=>o.id===prior.orderId)};}
  }
  try{
   if(action==='order.create'){next=placeOrder(current,...args);order=next.orders[0];next.requests=[...(current.requests||[]),{key:requestKey,fingerprint,orderId:order.id}];}
   else if(action==='order.status')next=changeOrderStatus(current,...args);
   else if(action==='expense.save'){
    const expense=args[0];requireInput(expense&&(!expense.id||text(expense.id,100)),'Despesa inválida.');next=saveExpense(current,expense);
   }else if(action==='product.save'){
    const product=productInput(args[0]);next={...current,products:current.products.some(p=>p.id===product.id)?current.products.map(p=>p.id===product.id?product:p):[product,...current.products]};
   }else if(action==='product.toggle'){
    requireInput(current.products.some(p=>p.id===args[0]),'Produto não encontrado.');next={...current,products:current.products.map(p=>p.id===args[0]?{...p,active:!p.active}:p)};
   }else throw new InputError('Ação inválida.');
  }catch(error){if(error instanceof InputError)throw error;throw new InputError(error.message);}
  if(await db.commit(snapshot.revision,next))return {state:next,order};
 }
 throw new InputError('O estoque está sendo atualizado. Tente novamente.');
}
export function visibleState(state,admin){return {products:admin?state.products:state.products.filter(p=>p.active),orders:admin?state.orders:[],expenses:admin?state.expenses:[]};}
function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
export async function handleApi(request,env,{admin=false,db}={}){
 try{
  const path=new URL(request.url).pathname;
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Origem não autorizada.'},403);
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return json({error:'Origem não autorizada.'},403);
  if(path==='/api/health'&&request.method==='GET'){
   await (db||createDatabase(env.DATABASE_URL)).read();return json({ok:true,database:'Neon'});
  }
  if(path==='/api/state'&&request.method==='GET'){
   if(!admin)return json({error:'Acesso administrativo restrito.'},401);
   const snapshot=await (db||createDatabase(env.DATABASE_URL)).read();return json(visibleState(snapshot.state,true));
  }
  if(path==='/api/catalog'&&request.method==='GET'){
   const snapshot=await (db||createDatabase(env.DATABASE_URL)).read();return json(visibleState(snapshot.state,false));
  }
  if(path==='/api/actions'&&request.method==='POST'){
   if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Envie JSON.'},415);
   // Limite aplicado durante leitura; não depender apenas de Content-Length.
   const reader=request.body?.getReader();let bytes=0,chunks=[];
   if(!reader)return json({error:'Requisição vazia.'},400);
   while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>9500000){await reader.cancel();return json({error:'Fotos muito grandes. Reduza o tamanho.'},413);}chunks.push(value);}
   let body;try{const data=new Uint8Array(bytes);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length;}body=JSON.parse(new TextDecoder().decode(data));}catch{return json({error:'JSON inválido.'},400);}
   if(!admin&&body.action!=='order.create')return json({error:'Acesso administrativo restrito.'},401);
   const result=await mutate(db||createDatabase(env.DATABASE_URL),body.action,body.args,body.requestKey);
   return json({...visibleState(result.state,admin),...(result.order?{order:result.order}:{})});
  }
  return json({error:'Rota não encontrada.'},404);
 }catch(error){if(error instanceof InputError)return json({error:error.message},422);console.error('API: falha de conexão ou persistência; detalhes sensíveis omitidos.');return json({error:'Não foi possível acessar a loja agora. Tente novamente em instantes.'},503);}
}
