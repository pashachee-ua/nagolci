import { initialContent, withContactDefaults, type SiteContent } from '../lib/content.ts';
import { validateContent } from '../lib/validation.ts';
import { readJson } from './body.ts';
import { ApiError,json,type WorkerEnv } from './types.ts';
export async function ensureContent(db:D1Database){await db.prepare('CREATE TABLE IF NOT EXISTS site_content (id text PRIMARY KEY NOT NULL, body text NOT NULL, revision integer DEFAULT 1 NOT NULL, updated_at text NOT NULL)').run()}
export async function readDraft(db:D1Database):Promise<{content:SiteContent;revision:number}>{
 await ensureContent(db);const row=await db.prepare('SELECT body,revision FROM site_content WHERE id=?').bind('uk').first<{body:string;revision:number}>();
 return row?{content:validateContent(withContactDefaults(JSON.parse(row.body))),revision:row.revision}:{content:initialContent,revision:0};
}
export async function handleContent(request:Request,env:WorkerEnv):Promise<Response>{
 if(request.method==='GET')return json({...await readDraft(env.DB),publicUrl:env.PUBLIC_ORIGIN||null});
 if(request.method!=='PUT')return json({error:'Метод не підтримується.'},405);
 const body=await readJson(request) as {content:unknown;revision:number};
 if(!body||!Number.isSafeInteger(body.revision)||body.revision<0)throw new ApiError(400,'Некоректна версія.');
 let content:SiteContent;try{content=validateContent(body.content)}catch{throw new ApiError(400,'Перевір тексти, контакти та фотографії.')}
 await ensureContent(env.DB);const now=new Date().toISOString();
 const query=body.revision===0?env.DB.prepare('INSERT OR IGNORE INTO site_content(id,body,revision,updated_at) VALUES(?,?,1,?)').bind('uk',JSON.stringify(content),now):env.DB.prepare('UPDATE site_content SET body=?, revision=revision+1, updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(content),now,'uk',body.revision);
 const result=await query.run();if(result.meta.changes!==1)throw new ApiError(409,'Вміст уже змінився. Онови сторінку перед збереженням.');
 return json({revision:body.revision+1});
}
