import type { JWTVerifyGetKey } from 'jose';
import { authenticateEditor,validOrigin } from './auth.ts';
import { handleContent } from './content.ts';
import { handleUpload,handleMedia } from './uploads.ts';
import { ApiError,json,type WorkerEnv } from './types.ts';
export function createWorker(options:{keyResolver?:JWTVerifyGetKey}={}){
 return {async fetch(request:Request,env:WorkerEnv):Promise<Response>{
 try{
 if(!await authenticateEditor(request,env,options.keyResolver))return json({error:'Потрібен вхід редактора.'},401);
 if(!['GET','HEAD'].includes(request.method)&&!validOrigin(request,env))return json({error:'Неприпустиме джерело запиту.'},403);
 const path=new URL(request.url).pathname;
 if(path==='/api/content')return await handleContent(request,env);
 if(path==='/api/upload')return await handleUpload(request,env);
 if(path.startsWith('/api/media/')&&request.method==='GET')return await handleMedia(path.slice('/api/media/'.length),env);
 if(path.startsWith('/api/'))return json({error:'Не знайдено.'},404);
 if(!['GET','HEAD'].includes(request.method))return json({error:'Метод не підтримується.'},405);
 return await env.ASSETS.fetch(request);
 }catch(e){return json({error:e instanceof ApiError?e.message:'Не вдалося виконати запит. Спробуй ще раз.'},e instanceof ApiError?e.status:503)}
 }};
}
export default createWorker();
