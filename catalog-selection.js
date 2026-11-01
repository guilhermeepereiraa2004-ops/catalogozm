export const catalogMoney=value=>(value/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const availableCatalog=products=>products.filter(p=>p.active&&!p.deletedAt&&p.stock>0);
const normalized=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function filterCatalog(products,{category='',query='',min='',max='',sort='name'}={}){
 const minimum=min===''?0:Math.round(Number(min)*100),maximum=max===''?Infinity:Math.round(Number(max)*100);
 return availableCatalog(products).filter(p=>(!category||p.category===category)&&normalized(`${p.name} ${p.category} ${p.color}`).includes(normalized(query))&&p.price>=minimum&&p.price<=maximum).sort((a,b)=>sort==='price-low'?a.price-b.price:sort==='price-high'?b.price-a.price:a.name.localeCompare(b.name,'pt-BR'));
}
export function catalogLink(products,title,origin){
 if(!products.length)throw Error('Selecione ao menos uma peça.');
 const params=new URLSearchParams({titulo:title.trim().slice(0,80)||'Sua próxima paixão',itens:products.map(p=>p.id).join(',')});
 const link=`${origin}/#colecao?${params}`;if(link.length>8000)throw Error('Esta seleção é grande demais para um link. Gere o PDF ou divida em coleções menores.');return link;
}
export function readCatalogLink(hash,products){
 const params=new URLSearchParams(hash.split('?')[1]||''),ids=new Set((params.get('itens')||'').split(',').filter(Boolean));
 const byId=new Map(availableCatalog(products).map(p=>[p.id,p])),selected=[...ids].map(id=>byId.get(id)).filter(Boolean);
 return {title:(params.get('titulo')||'Sua próxima paixão').slice(0,80),products:selected,missing:ids.size-selected.length};
}
