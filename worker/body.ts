import { ApiError } from './types.ts';
export async function readLimited(request:Request,max:number):Promise<Uint8Array>{
 const advertised=request.headers.get('content-length');if(advertised&&Number(advertised)>max)throw new ApiError(413,'Забагато даних.');
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();
 const chunks:Uint8Array[]=[];let total=0;
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>max){await reader.cancel();throw new ApiError(413,'Забагато даних.')}chunks.push(value)}
 const out=new Uint8Array(total);let offset=0;for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.length}return out;
}
export async function readJson(request:Request):Promise<unknown>{
 if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw new ApiError(415,'Очікується JSON.');
 try{return JSON.parse(new TextDecoder().decode(await readLimited(request,100000)))}catch(e){if(e instanceof ApiError)throw e;throw new ApiError(400,'Некоректний JSON.')}
}
