import { env } from 'cloudflare:workers';
import { isEditor, validMutationOrigin } from '@/lib/authorization';
import { detectImage } from '@/lib/validation';
export async function POST(request:Request){
 if(!await isEditor()||!validMutationOrigin(request))return Response.json({error:'Немає доступу.'},{status:403});
 const max=8*1024*1024;
 if(Number(request.headers.get('content-length')??0)>max)return Response.json({error:'Фото має бути до 8 МБ.'},{status:413});
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Немає файлу.'},{status:400});
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();return Response.json({error:'Фото має бути до 8 МБ.'},{status:413})}chunks.push(value)}
 const data=new Uint8Array(length);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length}
 const ext=detectImage(data);if(!ext)return Response.json({error:'Завантаж JPG, PNG або WebP.'},{status:415});
 const type={jpg:'image/jpeg',png:'image/png',webp:'image/webp'}[ext];
 const key=`${crypto.randomUUID()}.${ext}`;
 try{await env.FILES.put(key,data,{httpMetadata:{contentType:type}});return Response.json({src:`/api/media/${key}`})}catch{return Response.json({error:'Не вдалося завантажити фото. Спробуй ще раз.'},{status:503})}
}
