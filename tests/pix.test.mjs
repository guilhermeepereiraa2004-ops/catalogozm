import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {readFile} from 'node:fs/promises';
import {createPixPayload,crc16,pixDetails,pixPayload} from '../pix.js';

test('Pix reproduz vetor oficial do Banco Central e QR pode ser decodificado',()=>{
 const data={key:'123e4567-e12b-12d1-a456-426655440000',name:'Fulano de Tal',city:'BRASILIA'};
 const payload=createPixPayload(data);
 assert.equal(payload,'00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D');
 const qr=QRCode.create(payload,{errorCorrectionLevel:'M'}),scale=6,margin=4,size=(qr.modules.size+margin*2)*scale;
 const rgba=new Uint8ClampedArray(size*size*4).fill(255);
 for(let y=0;y<qr.modules.size;y++)for(let x=0;x<qr.modules.size;x++)if(qr.modules.get(y,x))for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){
  const offset=(((y+margin)*scale+dy)*size+(x+margin)*scale+dx)*4;rgba[offset]=rgba[offset+1]=rgba[offset+2]=0;
 }
 assert.equal(jsQR(rgba,size,size)?.data,payload);
 assert.equal(crc16('123456789'),'29B1');
 assert.throws(()=>createPixPayload({...data,name:''}));assert.throws(()=>createPixPayload({...data,city:'X'.repeat(16)}));
});

test('QR publicado corresponde ao Pix e titular informados, sem valor pré-definido',async()=>{
 assert.equal(pixDetails.name,'ZEIDIZAN DE SOUZA MENEZES');assert.equal(pixDetails.name.length,25);
 const fields={};for(let cursor=0;cursor<pixPayload.length;){const id=pixPayload.slice(cursor,cursor+2),size=Number(pixPayload.slice(cursor+2,cursor+4));fields[id]=pixPayload.slice(cursor+4,cursor+4+size);cursor+=4+size;}
 assert.equal(fields['59'],pixDetails.name);assert.equal(fields['60'],'UBAITABA');assert.ok(fields['26'].endsWith('0111'+pixDetails.key));assert.equal(fields['54'],undefined);assert.equal(fields['63'],crc16(pixPayload.slice(0,-4)));
 assert.deepEqual(await readFile('assets/pix-zm-exclusiva.png'),await QRCode.toBuffer(pixPayload,{errorCorrectionLevel:'M',margin:4,width:320}));
});
