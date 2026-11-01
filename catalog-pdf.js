import {catalogMoney} from './catalog-selection.js';
export const catalogContact='https://wa.me/message/CA6Q36RLFHG2E1';
export function renderCatalogPdf({jsPDF,products,title,assets,date=new Date()}){
 if(!products.length)throw Error('Selecione ao menos uma peça.');
 const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
 for(const [style,font]of [['normal',assets.regular],['bold',assets.bold]]){doc.addFileToVFS(`Poppins-${style}.ttf`,font);doc.addFont(`Poppins-${style}.ttf`,'Poppins',style);}
 const ink='#402c2b',rose='#794149',muted='#755b58',gold='#8b572a';
 const text=(value,x,y,size=10,color=ink,style='normal',options={})=>{doc.setFont('Poppins',style);doc.setFontSize(size);doc.setTextColor(color);doc.text(String(value),x,y,options);};
 const rect=(x,y,w,h,color,r=0)=>{doc.setFillColor(color);r?doc.roundedRect(x,y,w,h,r,r,'F'):doc.rect(x,y,w,h,'F');};
 const stamp=date.toLocaleDateString('pt-BR');
 doc.setProperties({title:`ZM Exclusiva - ${title}`,author:'ZM Exclusiva Store',subject:'Catálogo de moda feminina'});
 rect(0,0,210,297,'#fff4f2');doc.addImage(assets.hero,'JPEG',0,0,210,118.125);
 rect(16,137,18,1,'#bd884c');text('UMA SELEÇÃO SÓ PARA VOCÊ',16,149,9,gold,'bold');
 let size=30,coverTitle;do{doc.setFont('Poppins','bold');doc.setFontSize(size);coverTitle=doc.splitTextToSize(title||'Sua próxima paixão',175);if(coverTitle.length<=3)break;size--;}while(size>16);text(coverTitle,16,170,size,rose,'bold');
 const after=170+Math.min(coverTitle.length,3)*13;
 text('Looks que valorizam cada versão sua.',16,after+8,11,muted);
 text(`${products.length} ${products.length===1?'peça escolhida':'peças escolhidas'}  |  ${stamp}`,16,after+19,10,muted);
 rect(16,251,178,18,rose,4);text('Vamos escolher seu próximo look?',105,262,11,'#ffffff','bold',{align:'center'});doc.link(16,251,178,18,{url:catalogContact});
 text('Toque no botão para conversar com a loja pelo WhatsApp.',105,278,8,muted,'normal',{align:'center'});
 const pages=Math.ceil(products.length/4);
 for(let page=0;page<pages;page++){
  doc.addPage();rect(0,0,210,297,'#ffffff');doc.addImage(assets.logo,'JPEG',16,12,18,18);text('ZM EXCLUSIVA',40,20,12,rose,'bold');text('STORE  /  ESCOLHIDAS COM CARINHO',40,26,7,gold);
  text(`${page+1} / ${pages}`,194,23,9,muted,'normal',{align:'right'});rect(16,36,178,.3,'#efd8d2');
  products.slice(page*4,page*4+4).forEach((p,i)=>{
   const x=16+(i%2)*93,y=44+Math.floor(i/2)*112,w=85,h=106;
   rect(x,y,w,h,'#fff4f2',3);const photo=assets.photos[p.id];if(!photo)throw Error(`Não foi possível carregar a foto de ${p.name}.`);
   const scale=Math.min(77/photo.width,72/photo.height),pw=photo.width*scale,ph=photo.height*scale;
   doc.addImage(photo.data,'JPEG',x+(w-pw)/2,y+4+(72-ph)/2,pw,ph,undefined,'FAST');
   text(p.category.toLocaleUpperCase('pt-BR'),x+4,y+81,6.5,gold);
   doc.setFont('Poppins','bold');doc.setFontSize(10);const name=doc.splitTextToSize(p.name,77);text(name.slice(0,2),x+4,y+87,10,ink,'bold');
   text(catalogMoney(p.price),x+4,y+101,13,rose,'bold');text('ESCOLHER',x+w-4,y+101,6.5,muted,'normal',{align:'right'});doc.link(x,y,w,h,{url:catalogContact});
  });
  rect(16,274,178,.3,'#efd8d2');text('EXCLUSIVA, COMO VOCÊ.',16,282,7.5,gold,'bold');text(`Valores em ${stamp}. Sujeito à disponibilidade.`,194,282,6.5,muted,'normal',{align:'right'});
 }
 return doc;
}
let library;
function loadLibrary(){return library??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/vendor/jspdf.umd.min.js';script.onload=()=>resolve(window.jspdf.jsPDF);script.onerror=()=>{library=null;reject(Error('Não foi possível carregar o gerador de PDF.'));};document.head.append(script);});}
const base64=buffer=>{let s='';for(const byte of new Uint8Array(buffer))s+=String.fromCharCode(byte);return btoa(s);};
async function photoAsset(src,maxWidth=700){
 if(!/^\/assets\/[\w.-]+\.(?:webp|png|jpg)$/.test(src)&&!/^data:image\/(?:jpeg|png|webp);base64,/.test(src))throw Error('Foto de produto inválida.');
 const img=new Image();img.src=src;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('A foto demorou a carregar. Tente novamente.')),20000);img.onload=()=>{clearTimeout(timer);resolve();};img.onerror=()=>{clearTimeout(timer);reject(Error('Uma foto não carregou. Tente novamente.'));};});
 const canvas=document.createElement('canvas'),scale=Math.min(1,maxWidth/img.naturalWidth);canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);return {data:canvas.toDataURL('image/jpeg',.86),width:canvas.width,height:canvas.height};
}
export async function downloadCatalogPdf(products,title,progress=()=>{}){
 const jsPDF=await loadLibrary();
 const font=async name=>{const r=await fetch(`/assets/${name}.ttf`);if(!r.ok)throw Error('Não foi possível carregar a fonte do PDF.');return base64(await r.arrayBuffer());};
 const [regular,bold,hero,logo]=await Promise.all([font('Poppins-Regular'),font('Poppins-SemiBold'),photoAsset('/assets/hero-rodape.jpg',1400),photoAsset('/assets/logo-zm-exclusiva.jpg',240)]);
 const photos={};for(let i=0;i<products.length;i+=4){await Promise.all(products.slice(i,i+4).map(async p=>{photos[p.id]=await photoAsset(p.images[0]);}));progress(`Preparando fotos… ${Math.min(i+4,products.length)} de ${products.length}`);}
 const doc=renderCatalogPdf({jsPDF,products,title,assets:{regular,bold,hero:hero.data,logo:logo.data,photos}});
 await doc.save('catalogo-zm-exclusiva.pdf',{returnPromise:true});return doc;
}
