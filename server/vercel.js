import {handleApi} from './api.js';
// Admin habilitado apenas na prévia privada, atrás de Vercel Authentication.
// Não confiar em headers oai-* enviados pelo navegador nesta hospedagem.
export function privatePreviewAdmin(env){return env.VERCEL_ENV==='preview'&&env.VERCEL_PRIVATE_ADMIN==='1';}
export default {fetch(request){return handleApi(request,process.env,{admin:privatePreviewAdmin(process.env)});}};
