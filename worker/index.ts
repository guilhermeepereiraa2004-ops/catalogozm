import handler from 'vinext/server/fetch-handler';
import {handleApi} from '../server/api.js';
export default {fetch(request:Request,env:any,ctx:any){
 if(new URL(request.url).pathname.startsWith('/api/'))return handleApi(request,env,{admin:Boolean(request.headers.get('oai-authenticated-user-id'))});
 return handler.fetch(request,env,ctx);
}};
