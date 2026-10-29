import QRCode from 'qrcode';
import {pixPayload} from '../pix.js';
await QRCode.toFile('assets/pix-zm-exclusiva.png',pixPayload,{errorCorrectionLevel:'M',margin:4,width:320});
console.log('QR Pix gerado localmente. Sem envio de dados a serviço externo.');
