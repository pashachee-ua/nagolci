import { env } from 'cloudflare:workers';
import { initialContent, withContactDefaults, type SiteContent } from './content';
export async function readContent():Promise<{content:SiteContent;revision:number}> {
 const row=await env.DB.prepare('SELECT body, revision FROM site_content WHERE id = ?').bind('uk').first<{body:string;revision:number}>();
 return row?{content:withContactDefaults(JSON.parse(row.body)),revision:row.revision}:{content:initialContent,revision:0};
}
export async function saveContent(content:SiteContent,revision:number) {
 const body=JSON.stringify(content),now=new Date().toISOString();
 const result=revision===0
 ?await env.DB.prepare('INSERT OR IGNORE INTO site_content (id, body, revision, updated_at) VALUES (?, ?, 1, ?)').bind('uk',body,now).run()
 :await env.DB.prepare('UPDATE site_content SET body = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ?').bind(body,now,'uk',revision).run();
 return result.meta.changes===1;
}
