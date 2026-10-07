import { detectImage } from '../lib/validation.ts';
import { uploadKeyPattern } from '../static/snapshot.ts';
import { readLimited } from './body.ts';
import { ApiError,json,type WorkerEnv } from './types.ts';
export async function handleUpload(request:Request,env:WorkerEnv):Promise<Response>{
 if(request.method!=='POST')return json({error:'Метод не підтримується.'},405);
 const data=await readLimited(request,8*1024*1024);const ext=detectImage(data);
 if(!ext)throw new ApiError(415,'Завантаж JPG, PNG або WebP.');
 const key=`${crypto.randomUUID()}.${ext}`;await env.FILES.put(key,data,{httpMetadata:{contentType:{jpg:'image/jpeg',png:'image/png',webp:'image/webp'}[ext]}});return json({src:'/api/media/'+key});
}
export async function handleMedia(key:string,env:WorkerEnv):Promise<Response>{
 if(!uploadKeyPattern.test(key))throw new ApiError(404,'Фото не знайдено.');
 const object=await env.FILES.get(key);if(!object)throw new ApiError(404,'Фото не знайдено.');
 return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType??'application/octet-stream','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});
}
