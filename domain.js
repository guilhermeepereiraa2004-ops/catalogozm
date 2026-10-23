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
 if(cart.some(x=>!Number.isSafeInteger(x.qty)||x.qty<1)) throw new Error('Quantidade inválida.');
 const grouped=new Map();
 const items=cart.map(line=>{
  const p=state.products.find(x=>x.id===line.id);
  if(!p||!p.active||!p.sizes.includes(line.size)) throw new Error('Uma peça mudou. Atualize sua sacola.');
  grouped.set(p.id,(grouped.get(p.id)||0)+line.qty);
  return {id:p.id,name:p.name,size:line.size,qty:line.qty,price:p.price,image:p.images[0]};
 });
 for(const [id,qty] of grouped){const p=state.products.find(x=>x.id===id);if(qty>p.stock) throw new Error(`Estoque insuficiente para ${p.name}.`);}
 const order={id:`ZM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`,createdAt:new Date().toISOString(),customer:{name:customer.name.trim(),phone:customer.phone.trim(),note:(customer.note||'').trim()},items,total:items.reduce((s,x)=>s+x.price*x.qty,0),status:'Novo'};
 return {products:state.products.map(p=>({...p,stock:p.stock-(grouped.get(p.id)||0)})),orders:[order,...state.orders]};
}
export function changeOrderStatus(state,id,status){
 if(!['Novo','Em separação','Concluído','Cancelado'].includes(status)) throw new Error('Status inválido.');
 const order=state.orders.find(x=>x.id===id);if(!order) throw new Error('Pedido não encontrado.');
 if(order.status==='Cancelado'&&status!=='Cancelado') throw new Error('Pedidos cancelados não podem ser reabertos.');
 const restore=order.status!=='Cancelado'&&status==='Cancelado';
 return {products:state.products.map(p=>({...p,stock:p.stock+(restore?order.items.filter(x=>x.id===p.id).reduce((s,x)=>s+x.qty,0):0)})),orders:state.orders.map(o=>o.id===id?{...o,status}:o)};
}
