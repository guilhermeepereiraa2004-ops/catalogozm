export const orderStatuses=['Novo','Confirmado','Em separação','Concluído','Cancelado'];
export const expenseCategories=['Fornecedores','Aluguel','Embalagens','Marketing','Transporte','Outras'];
export const incomeCategories=['Venda presencial','Outras receitas'];
export const paymentMethods={pix:'Pix',arrange:'Combinar com a loja'};
export const pickupLocation={name:'ZM Exclusiva Store',city:'Ubaitaba',address:'Avenida Presidente Vargas, Centro, CEP 45545-000'};
const confirmedStatuses=['Confirmado','Em separação','Concluído'];
export function localDate(value=new Date()){
 const d=new Date(value);
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function validDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
 const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d);
 return y>=1900&&date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d;
}
export function parseAmount(value){
 const text=String(value).trim();
 if(!/^\d+(?:[.,]\d{1,2})?$/.test(text))throw new Error('Informe um valor válido com até duas casas decimais. Ex.: 99,90.');
 const [whole,fraction='']=text.split(/[.,]/),amount=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('Informe um valor maior que zero.');
 return amount;
}
export function saveExpense(state,expense){
 const expenses=state.expenses||[];
 if(!expense.description?.trim()||expense.description.trim().length>120)throw new Error('Informe uma descrição de até 120 caracteres.');
 if(!Number.isSafeInteger(expense.amount)||expense.amount<=0)throw new Error('Informe um valor maior que zero em centavos inteiros.');
 if(!validDate(expense.date))throw new Error('Informe uma data válida para a despesa.');
 if(!expenseCategories.includes(expense.category))throw new Error('Escolha uma categoria para a despesa.');
 const previous=expenses.find(e=>e.id===expense.id);
 if(previous?.deletedAt)throw new Error('Restaure a despesa na Lixeira antes de editar.');
 if(expense.id&&!previous)throw new Error('Despesa não encontrada.');
 const next={id:previous?.id||`expense-${crypto.randomUUID()}`,description:expense.description.trim(),amount:expense.amount,date:expense.date,category:expense.category,createdAt:previous?.createdAt||new Date().toISOString()};
 return {...state,expenses:previous?expenses.map(e=>e.id===next.id?next:e):[next,...expenses]};
}
export function saveIncome(state,income){
 const incomes=state.incomes||[];
 if(!income.description?.trim()||income.description.trim().length>120)throw new Error('Informe uma descrição de até 120 caracteres.');
 if(!Number.isSafeInteger(income.amount)||income.amount<=0)throw new Error('Informe um valor maior que zero em centavos inteiros.');
 if(!validDate(income.date))throw new Error('Informe uma data válida para a receita.');
 if(!incomeCategories.includes(income.category))throw new Error('Escolha uma categoria para a receita.');
 const previous=incomes.find(e=>e.id===income.id);
 if(previous?.deletedAt)throw new Error('Restaure a receita na Lixeira antes de editar.');
 if(income.id&&!previous)throw new Error('Receita não encontrada.');
 const next={id:previous?.id||`income-${crypto.randomUUID()}`,description:income.description.trim(),amount:income.amount,date:income.date,category:income.category,createdAt:previous?.createdAt||new Date().toISOString()};
 return {...state,incomes:previous?incomes.map(e=>e.id===next.id?next:e):[next,...incomes]};
}
export function getCashFlow(state,{from='',to='',type='all',query=''}={}){
 const revenues=state.orders.filter(o=>!o.deletedAt&&!o.cashExcludedAt&&confirmedStatuses.includes(o.status)).map(o=>({id:`order-${o.id}`,orderId:o.id,type:'income',description:`Pedido ${o.id}`,detail:o.customer.name,category:'Vendas',date:localDate(o.confirmedAt||o.createdAt),amount:o.total}));
 const incomes=(state.incomes||[]).filter(e=>!e.deletedAt).map(e=>({...e,type:'income',detail:`Receita avulsa · ${e.category}`}));
 const expenses=(state.expenses||[]).filter(e=>!e.deletedAt).map(e=>({...e,type:'expense',detail:e.category}));
 const inPeriod=[...revenues,...incomes,...expenses].filter(e=>(!from||e.date>=from)&&(!to||e.date<=to));
 const income=inPeriod.filter(e=>e.type==='income').reduce((sum,e)=>sum+e.amount,0);
 const expense=inPeriod.filter(e=>e.type==='expense').reduce((sum,e)=>sum+e.amount,0);
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const entries=inPeriod.filter(e=>(type==='all'||e.type===type)&&normalize(`${e.description} ${e.detail}`).includes(normalize(query))).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 return {income,expense,balance:income-expense,entries,totalCount:inPeriod.length};
}
export function validateProduct(p){
 if(!p.name?.trim() || !p.description?.trim()) throw new Error('Preencha o nome e a descrição.');
 if(!Number.isSafeInteger(p.price)||p.price<=0) throw new Error('Informe um preço maior que zero.');
 if(!Number.isSafeInteger(p.stock)||p.stock<0) throw new Error('A quantidade deve ser um número inteiro a partir de zero.');
 if(!p.images?.length||p.images.some(x=>!/^\/assets\/|^data:image\/(jpeg|png|webp);base64,/.test(x))) throw new Error('Adicione pelo menos uma foto JPG, PNG ou WebP.');
 return p;
}
export function placeOrder(state, cart, customer){
 if(!cart.length) throw new Error('Sua sacola está vazia.');
 if(!customer.name?.trim() || !/^[\d\s()+-]{10,20}$/.test(customer.phone||'')) throw new Error('Informe seu nome e um telefone válido com DDD.');
 if(customer.localDelivery!=='yes')throw new Error('Para entrega fora de Ubaitaba, combine o frete pelo WhatsApp da loja.');
 if(!Object.hasOwn(paymentMethods,customer.paymentMethod))throw new Error('Escolha a forma de pagamento.');
 if(cart.some(x=>!Number.isSafeInteger(x.qty)||x.qty<1)) throw new Error('Quantidade inválida.');
 const grouped=new Map();
 const items=cart.map(line=>{
  const p=state.products.find(x=>x.id===line.id);
  if(!p||p.deletedAt||!p.active||!p.sizes.includes(line.size)) throw new Error('Uma peça mudou. Atualize sua sacola.');
  grouped.set(p.id,(grouped.get(p.id)||0)+line.qty);
  return {id:p.id,name:p.name,size:line.size,qty:line.qty,price:p.price,image:p.images[0]};
 });
 for(const [id,qty] of grouped){const p=state.products.find(x=>x.id===id);if(qty>p.stock) throw new Error(`Estoque insuficiente para ${p.name}.`);}
 const order={id:`ZM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`,createdAt:new Date().toISOString(),customer:{name:customer.name.trim(),phone:customer.phone.trim(),note:(customer.note||'').trim()},payment:{method:customer.paymentMethod,status:'Pendente'},delivery:{city:pickupLocation.city,mode:'pickup',address:pickupLocation.address,fee:0},items,total:items.reduce((s,x)=>s+x.price*x.qty,0),status:'Novo'};
 return {...state,products:state.products.map(p=>({...p,stock:p.stock-(grouped.get(p.id)||0)})),orders:[order,...state.orders]};
}
export function changeOrderStatus(state,id,status){
 if(!orderStatuses.includes(status)) throw new Error('Status inválido.');
 const order=state.orders.find(x=>x.id===id);if(!order) throw new Error('Pedido não encontrado.');
 if(order.deletedAt)throw new Error('Restaure o pedido na Lixeira antes de alterar o status.');
 if(order.status==='Cancelado'&&status!=='Cancelado') throw new Error('Pedidos cancelados não podem ser reabertos.');
 if(confirmedStatuses.includes(order.status)&&status==='Novo')throw new Error('Um pedido confirmado não pode voltar para Novo. Para desfazer a venda, cancele o pedido.');
 const restore=order.status!=='Cancelado'&&status==='Cancelado';
 const confirmedAt=order.confirmedAt||(confirmedStatuses.includes(order.status)?order.createdAt:confirmedStatuses.includes(status)?new Date().toISOString():undefined);
 return {...state,products:state.products.map(p=>({...p,stock:p.stock+(restore?order.items.filter(x=>x.id===p.id).reduce((s,x)=>s+x.qty,0):0)})),orders:state.orders.map(o=>o.id===id?{...o,status,...(confirmedAt?{confirmedAt}:{})}:o)};
}

const recordLists={product:'products',order:'orders',income:'incomes',expense:'expenses','order-income':'orders'};
function findRecord(state,kind,id){
 const list=recordLists[kind];if(!Object.hasOwn(recordLists,kind))throw new Error('Tipo de registro inválido.');
 const record=(state[list]||[]).find(r=>r.id===id);if(!record)throw new Error('Registro não encontrado.');
 return {list,record};
}
function orderQuantities(order){const quantities=new Map();for(const item of order.items)quantities.set(item.id,(quantities.get(item.id)||0)+item.qty);return quantities;}
export function deleteRecord(state,kind,id){
 const {list,record}=findRecord(state,kind,id),now=new Date().toISOString();
 if(kind==='order-income'){
  if(record.deletedAt||!confirmedStatuses.includes(record.status))throw new Error('Este pedido não possui receita disponível no caixa.');
  if(record.cashExcludedAt)return state;
  return {...state,orders:state.orders.map(o=>o.id===id?{...o,cashExcludedAt:now}:o)};
 }
 if(record.deletedAt)return state;
 const restock=kind==='order'&&['Novo','Confirmado','Em separação'].includes(record.status);
 const quantities=restock?orderQuantities(record):new Map();
 const next={...record,deletedAt:now,...(kind==='order'?{deletionRestocked:restock}:{})};
 return {...state,products:restock?state.products.map(p=>({...p,stock:p.stock+(quantities.get(p.id)||0)})):state.products,[list]:state[list].map(r=>r.id===id?next:r)};
}
export function restoreRecord(state,kind,id){
 const {list,record}=findRecord(state,kind,id);
 if(kind==='order-income'){
  if(record.deletedAt)throw new Error('Restaure o pedido primeiro na Lixeira.');
  if(!confirmedStatuses.includes(record.status))throw new Error('A receita só pode voltar ao caixa se o pedido estiver confirmado.');
  const {cashExcludedAt,...restored}=record;
  return {...state,orders:state.orders.map(o=>o.id===id?restored:o)};
 }
 if(!record.deletedAt)return state;
 const quantities=kind==='order'&&record.deletionRestocked?orderQuantities(record):new Map();
 for(const [productId,qty] of quantities){const product=state.products.find(p=>p.id===productId);if(!product||product.stock<qty)throw new Error(`Estoque insuficiente para restaurar ${product?.name||'uma peça do pedido'}.`);}
 const {deletedAt,deletionRestocked,...restored}=record;
 return {...state,products:quantities.size?state.products.map(p=>({...p,stock:p.stock-(quantities.get(p.id)||0)})):state.products,[list]:state[list].map(r=>r.id===id?restored:r)};
}
export function getTrashEntries(state){
 const entries=[];
 for(const [kind,list] of Object.entries(recordLists)){
  if(kind==='order-income')continue;
  for(const r of state[list]||[])if(r.deletedAt)entries.push({kind,id:r.id,label:r.name||r.description||`Pedido ${r.id}`,deletedAt:r.deletedAt,detail:kind==='order'?`${r.status} · ${r.customer.name}`:'',canRestore:true});
 }
 for(const o of state.orders)if(o.cashExcludedAt&&!o.deletedAt)entries.push({kind:'order-income',id:o.id,label:`Receita do pedido ${o.id}`,deletedAt:o.cashExcludedAt,detail:confirmedStatuses.includes(o.status)?'Restauração afeta somente o caixa.':`Pedido ${o.status}: receita indisponível.`,canRestore:confirmedStatuses.includes(o.status)});
 return entries.sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));
}
