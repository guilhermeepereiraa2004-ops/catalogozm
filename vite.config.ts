import {defineConfig} from 'vite';
import vinext from 'vinext';
import {sites} from './scripts/vite/sites-vite-plugin';
export default defineConfig(async()=>{
 const {cloudflare}=await import('@cloudflare/vite-plugin');
 return {plugins:[vinext(),sites({mockAuth:false}),cloudflare({viteEnvironment:{name:'rsc',childEnvironments:['ssr']},inspectorPort:false,config:{main:'./worker/index.ts',compatibility_flags:['nodejs_compat'],compatibility_date:'2026-05-15'}})]};
});
