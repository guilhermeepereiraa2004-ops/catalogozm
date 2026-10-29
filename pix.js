// Static BR Code: Banco Central, Manual de Padrões para Iniciação do Pix 2.10.0, §2.6.
function field(id,value){
 if(!value||value.length>99||!/^[\x20-\x7e]+$/.test(value))throw new Error('Campo Pix inválido.');
 return `${id}${String(value.length).padStart(2,'0')}${value}`;
}
export function crc16(text){
 let crc=0xffff;
 for(const byte of new TextEncoder().encode(text)){
  crc^=byte<<8;
  for(let bit=0;bit<8;bit++)crc=((crc<<1)^((crc&0x8000)?0x1021:0))&0xffff;
 }
 return crc.toString(16).toUpperCase().padStart(4,'0');
}
export function createPixPayload({key,name,city}){
 const ascii=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
 name=ascii(name);city=ascii(city);
 if(!key||key.length>77||!name||name.length>25||!city||city.length>15)throw new Error('Revise a chave, o titular e a cidade do Pix.');
 const payload=field('00','01')+field('26',field('00','br.gov.bcb.pix')+field('01',key))+field('52','0000')+field('53','986')+field('58','BR')+field('59',name)+field('60',city)+field('62',field('05','***'))+'6304';
 return payload+crc16(payload);
}
// Published at the store owner's explicit request; generated entirely locally.
export const pixDetails={key:'04301723544',name:'ZEIDIZAN DE SOUZA MENEZES',city:'UBAITABA'};
export const pixPayload=createPixPayload(pixDetails);
