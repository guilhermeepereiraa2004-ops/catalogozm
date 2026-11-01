export const lookCardSize={width:1080,height:1350};
const money=value=>(value/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function wrap(ctx,value,width,max=2){
 const words=String(value).trim().split(/\s+/).flatMap(word=>{const chunks=[];let part='';for(const character of word){if(part&&ctx.measureText(part+character).width>width){chunks.push(part);part='';}part+=character;}if(part)chunks.push(part);return chunks;}),lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
 if(lines.length<=max)return lines;const result=lines.slice(0,max);let last=result[max-1];while(last&&ctx.measureText(last+'…').width>width)last=last.slice(0,-1);result[max-1]=last+'…';return result;
}
export function renderLookCard(ctx,{products,title='Seu look, do seu jeito.',theme='rose',images,logo,font='LookPoppins',date=new Date()}){
 if(products.length<2||products.length>6)throw Error('O card precisa de 2 a 6 peças.');
 const white=theme==='white',background=white?'#ffffff':'#fff4f2',paper=white?'#fff4f2':'#ffffff',rose='#794149',ink='#402c2b',gold='#986532';
 const box=(x,y,w,h,color,r=0)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
 const text=(value,x,y,size=24,color=ink,weight=400)=>{ctx.font=`${weight} ${size}px ${font}`;ctx.fillStyle=color;ctx.fillText(value,x,y);};
 ctx.clearRect(0,0,1080,1350);box(0,0,1080,1350,background);box(0,0,1080,12,rose);
 ctx.save();ctx.beginPath();ctx.arc(101,84,43,0,Math.PI*2);ctx.clip();ctx.drawImage(logo,58,41,86,86);ctx.restore();
 text('ZM EXCLUSIVA',164,76,26,rose,600);text('STORE  /  ESCOLHIDAS COM CARINHO',164,108,15,gold);
 ctx.font=`600 55px ${font}`;const lines=wrap(ctx,title||'Seu look, do seu jeito.',950,2);lines.forEach((line,i)=>text(line,58,184+i*61,55,rose,600));
 const top=lines.length===1?236:298,bottom=1071,columns=products.length>=5?3:2,rows=Math.ceil(products.length/columns),gap=18,cellW=(964-gap*(columns-1))/columns,cellH=(bottom-top-gap*(rows-1))/rows;
 products.forEach((p,i)=>{
  const row=Math.floor(i/columns),rowCount=Math.min(columns,products.length-row*columns),offset=(964-(rowCount*cellW+(rowCount-1)*gap))/2,x=58+offset+(i%columns)*(cellW+18),y=top+row*(cellH+gap),image=images[p.id];if(!image)throw Error('Uma foto não carregou.');
  box(x,y,cellW,cellH,paper,18);const photoH=cellH-106,scale=Math.min((cellW-24)/image.width,photoH/image.height),w=image.width*scale,h=image.height*scale;
  ctx.drawImage(image.source||image,x+(cellW-w)/2,y+12+(photoH-h)/2,w,h);
  ctx.font=`600 22px ${font}`;wrap(ctx,p.name,cellW-36,2).forEach((line,j)=>text(line,x+18,y+cellH-69+j*25,22,ink,600));
  text(money(p.price),x+18,y+cellH-16,28,rose,600);
 });
 box(58,1101,964,126,rose,20);text('LOOK COMPLETO',82,1137,17,'#fbd8d4',600);text(money(products.reduce((sum,p)=>sum+p.price,0)),82,1196,50,'#ffffff',600);
 ctx.font=`400 19px ${font}`;const count=`${products.length} peças escolhidas para você`;text(count,996-ctx.measureText(count).width,1174,19,'#ffffff');
 const stamp=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Bahia'}).format(new Date(date));
 text(`Valores em ${stamp}. Sujeito à disponibilidade.`,58,1274,18,'#755b58');text('@zmexclusiva.store',58,1310,20,gold,600);text('SEU ESTILO. SUA ESSÊNCIA.',684,1310,15,gold);
 return ctx.canvas;
}
let fonts;const imageCache=new Map();
async function loadImage(src){
 if(!/^\/assets\/[\w.-]+\.(?:jpg|jpeg|png|webp)$/.test(src)&&!/^data:image\/(?:jpeg|png|webp);base64,/.test(src))throw Error('Foto inválida para o card.');
 if(!imageCache.has(src))imageCache.set(src,new Promise((resolve,reject)=>{const img=new Image(),timer=setTimeout(()=>{imageCache.delete(src);reject(Error('A foto demorou a carregar. Tente novamente.'));},20000);img.onload=()=>{clearTimeout(timer);resolve({source:img,width:img.naturalWidth,height:img.naturalHeight});};img.onerror=()=>{clearTimeout(timer);imageCache.delete(src);reject(Error('Uma foto não carregou. Tente novamente.'));};img.src=src;}));return imageCache.get(src);
}
export async function paintLookCard(canvas,options){
 if(!fonts)fonts=Promise.all([['400','Poppins-Regular'],['600','Poppins-SemiBold']].map(async([weight,name])=>{const face=await new FontFace('LookPoppins',`url(/assets/${name}.ttf)`,{weight}).load();document.fonts.add(face);})).catch(error=>{fonts=null;throw error;});
 await fonts;const [logo,...photos]=await Promise.all([loadImage('/assets/logo-zm-exclusiva.jpg'),...options.products.map(p=>loadImage(p.images[0]))]);
 canvas.width=1080;canvas.height=1350;const images=Object.fromEntries(options.products.map((p,i)=>[p.id,photos[i]]));return renderLookCard(canvas.getContext('2d'),{...options,images,logo:logo.source});
}
export async function downloadLookCard(canvas){
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Não foi possível gerar a imagem.');const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='look-zm-exclusiva.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
