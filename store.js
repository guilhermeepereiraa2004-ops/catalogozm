import {initialProducts} from './catalog.js';
import {placeOrder,changeOrderStatus,validateProduct,saveExpense} from './domain.js';
export {getCashFlow,expenseCategories,orderStatuses,localDate,parseAmount} from './domain.js';
const KEY='zm-exclusiva-v2';
export function getState(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s?.products&&s?.orders)return {...s,expenses:Array.isArray(s.expenses)?s.expenses:[]};}catch{}return {products:structuredClone(initialProducts),orders:[],expenses:[]};}
function persist(next){try{localStorage.setItem(KEY,JSON.stringify(next));}catch{throw new Error('Não foi possível salvar. O armazenamento pode estar cheio; use fotos menores.');}return next;}
export const actions={
 'order.create':(cart,customer)=>persist(placeOrder(getState(),cart,customer)),
 'order.status':(id,status)=>persist(changeOrderStatus(getState(),id,status)),
 'expense.save':expense=>persist(saveExpense(getState(),expense)),
 'product.save':p=>{validateProduct(p);const s=getState();return persist({...s,products:s.products.some(x=>x.id===p.id)?s.products.map(x=>x.id===p.id?p:x):[p,...s.products]});},
 'product.toggle':id=>{const s=getState();return persist({...s,products:s.products.map(p=>p.id===id?{...p,active:!p.active}:p)});}
};
