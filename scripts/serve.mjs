import http from 'node:http';import {readFile} from 'node:fs/promises';import path from 'node:path';import {createVercelHandler} from '../server/vercel.js';
try{process.loadEnvFile('.env.local');}catch{}
const handler=createVercelHandler(process.env,{localSetup:true});
const root=process.cwd(),port=Number(process.env.PORT||4173);
const files=new Set(['index.html','vestido-3d.html','viewer-3d.js','viewer-3d.css','styles.css','hero.css','responsive.css','hero-motion.js','cash-flow.js','cash-flow.css','branding.css','mobile.css','app.js','admin-auth.js','admin-auth.css','catalog.js','domain.js','store.js']);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'};
http.createServer(async(req,res)=>{try{
 const host=req.headers.host;
 if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(host)){res.writeHead(403);res.end();return;}
 const url=new URL(req.url,`http://${host}`);
 if(url.pathname.startsWith('/api/')){
  const headers=new Headers(req.headers);for(const k of [...headers.keys()])if(k.startsWith('oai-authenticated-'))headers.delete(k);
  headers.set('x-real-ip',req.socket.remoteAddress);
  const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
  const response=await handler.fetch(request);const responseHeaders=Object.fromEntries(response.headers);delete responseHeaders['set-cookie'];const cookies=response.headers.getSetCookie();res.writeHead(response.status,{...responseHeaders,...(cookies.length?{'Set-Cookie':cookies}:{})});res.end(Buffer.from(await response.arrayBuffer()));return;
 }
 if(url.pathname==='/admin'||url.pathname==='/admin/setup'){res.writeHead(302,{Location:url.pathname.endsWith('/setup')?'/#admin/setup':'/#admin'});res.end();return;}
 const name=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
 if(!['GET','HEAD'].includes(req.method)||(!files.has(name)&&!/^assets\/(?:models\/)?[\w.-]+\.(webp|png|jpg|glb)$/.test(name)&&!/^vendor\/[\w.-]+\.js$/.test(name))){res.writeHead(404);res.end('Não encontrado');return;}
 const data=await readFile(path.join(root,name));res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end('Não encontrado');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://localhost:${port}`));
