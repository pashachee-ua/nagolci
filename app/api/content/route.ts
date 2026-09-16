import { readContent, saveContent } from '@/lib/store';
import { validateContent } from '@/lib/validation';
import { isEditor, validMutationOrigin } from '@/lib/authorization';
export async function GET(){try{return Response.json(await readContent(),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Не вдалося завантажити вміст.'},{status:503})}}
export async function PUT(request:Request){
 if(!await isEditor())return Response.json({error:'Немає доступу до редагування.'},{status:403});
 if(!validMutationOrigin(request))return Response.json({error:'Неприпустиме джерело запиту.'},{status:403});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return Response.json({error:'Очікується JSON.'},{status:415});
 try{
 const text=await request.text();if(text.length>100000)return Response.json({error:'Забагато даних.'},{status:413});
 const body=JSON.parse(text);const content=validateContent(body.content);
 if(!Number.isSafeInteger(body.revision)||body.revision<0)throw new Error('Некоректна версія.');
 if(!await saveContent(content,body.revision))return Response.json({error:'Вміст уже змінився в іншій вкладці. Онови сторінку перед збереженням.'},{status:409});
 return Response.json({revision:body.revision+1});
 }catch(e){return Response.json({error:e instanceof Error&&!(e.message.includes('D1_'))?e.message:'Не вдалося зберегти зміни.'},{status:400})}
}
