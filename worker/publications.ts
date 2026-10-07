import type { ContentSnapshot,Publication } from '../shared/publication.ts';
import { parseSnapshot,referencedUploads } from '../static/snapshot.ts';
import { readDraft,ensureContent } from './content.ts';
import { handleMedia } from './uploads.ts';
import { readJson } from './body.ts';
import { ApiError,json,type WorkerEnv } from './types.ts';
export interface PublicationProvider {request(id:string):Promise<{jobId:string|null}>;reconcile(publication:Publication):Promise<Publication>;attachBuild?(publication:Publication,url:string):Promise<Publication>}
export class PublishRejected extends Error {}
const active="'requesting','queued','building','unknown'";
type Row={id:string;revision:number;status:Publication['status'];created_at:string;deployment_id:string|null;error:string|null;snapshot:string;ready:number};
export async function ensurePublications(db:D1Database){
 await ensureContent(db);
 await db.prepare('CREATE TABLE IF NOT EXISTS publications (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, deployment_id TEXT, error TEXT, snapshot TEXT NOT NULL, ready INTEGER NOT NULL DEFAULT 0)').run();
 await db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS one_active_publication ON publications ((1)) WHERE status IN (${active})`).run();
}
const publicRow=(r:Row):Publication=>({id:r.id,revision:r.revision,status:r.status,createdAt:r.created_at,deploymentId:r.deployment_id,error:r.error});
async function latest(env:WorkerEnv):Promise<Row|null>{return env.DB.prepare('SELECT * FROM publications ORDER BY created_at DESC, rowid DESC LIMIT 1').first<Row>()}
async function reconcileRow(row:Row,env:WorkerEnv,provider:PublicationProvider):Promise<Row>{
 if(!['queued','building','unknown'].includes(row.status)&&!(row.status==='requesting'&&Date.now()-Date.parse(row.created_at)>60000))return row;
 let next:Publication;try{next=await provider.reconcile(publicRow(row))}catch{return row}
 if(next.id!==row.id||next.revision!==row.revision)return row;
 const update=await env.DB.prepare('UPDATE publications SET status=?,deployment_id=?,error=? WHERE id=? AND status=?').bind(next.status,next.deploymentId,next.error,row.id,row.status).run();
 return update.meta.changes===1?{...row,status:next.status,deployment_id:next.deploymentId,error:next.error}:(await env.DB.prepare('SELECT * FROM publications WHERE id=?').bind(row.id).first<Row>())!;
}
export async function handlePublications(request:Request,env:WorkerEnv,provider:PublicationProvider):Promise<Response>{
 await ensurePublications(env.DB);
 if(request.method==='GET'){
 const row=await latest(env);return json(row?publicRow(await reconcileRow(row,env,provider)):null);
 }
 if(request.method!=='POST')return json({error:'Метод не підтримується.'},405);
 const body=await readJson(request) as {revision:number};if(!body||!Number.isSafeInteger(body.revision)||body.revision<0)throw new ApiError(400,'Некоректна версія.');
 let current=await env.DB.prepare(`SELECT * FROM publications WHERE status IN (${active}) LIMIT 1`).first<Row>();
 if(current){current=await reconcileRow(current,env,provider);if(['requesting','queued','building','unknown'].includes(current.status)){
 if(current.revision===body.revision)return json(publicRow(current));throw new ApiError(409,'Дочекайся завершення поточної публікації.');
 }}
 const draft=await readDraft(env.DB);if(draft.revision!==body.revision)throw new ApiError(409,'Чернетка змінилася. Онови редактор.');
 const id=crypto.randomUUID(),createdAt=new Date().toISOString();
 const snapshot:ContentSnapshot={schemaVersion:1,id,revision:draft.revision,createdAt,content:draft.content};
 // Revision condition and partial unique index are checked in the same SQLite statement.
 const reservation=await env.DB.prepare('INSERT OR IGNORE INTO publications(id,revision,status,created_at,snapshot) SELECT ?,?,\'requesting\',?,? WHERE COALESCE((SELECT revision FROM site_content WHERE id=\'uk\'),0)=?').bind(id,draft.revision,createdAt,JSON.stringify(snapshot),draft.revision).run();
 if(reservation.meta.changes!==1){
 const winner=await env.DB.prepare(`SELECT * FROM publications WHERE status IN (${active}) LIMIT 1`).first<Row>();
 if(winner?.revision===body.revision)return json(publicRow(winner));throw new ApiError(409,'Вміст або стан публікації змінився. Онови редактор.');
 }
 try{await env.FILES.put(`snapshots/${id}.json`,JSON.stringify(snapshot),{httpMetadata:{contentType:'application/json'}});await env.DB.prepare('UPDATE publications SET ready=1 WHERE id=?').bind(id).run()}
 catch{await env.DB.prepare("UPDATE publications SET status='failed',error=? WHERE id=?").bind('Не вдалося підготувати публікацію. Спробуй ще раз.',id).run();return json(publicRow((await latest(env))!))}
 try{
 const result=await provider.request(id);
 await env.DB.prepare("UPDATE publications SET status='queued',deployment_id=? WHERE id=? AND status='requesting'").bind(result.jobId,id).run();
 }catch(e){
 await env.DB.prepare('UPDATE publications SET status=?,error=? WHERE id=? AND status=\'requesting\'').bind(e instanceof PublishRejected?'failed':'unknown',e instanceof PublishRejected?'Не вдалося запустити публікацію. Спробуй ще раз.':'Перевіряємо, чи запущено публікацію. Не запускай її повторно.',id).run();
 }
 const row=await env.DB.prepare('SELECT * FROM publications WHERE id=?').bind(id).first<Row>();return json(publicRow(row!));
}
export async function handleBuild(request:Request,env:WorkerEnv,provider:PublicationProvider):Promise<Response>{
 if(request.method!=='GET')return json({error:'Метод не підтримується.'},405);
 await ensurePublications(env.DB);const path=new URL(request.url).pathname;
 let row:Row|null;
 if(path==='/api/build/snapshot')row=await latest(env);
 else{const match=path.match(/^\/api\/build\/media\/([a-f0-9-]{36})\/([^/]+)$/);if(!match)throw new ApiError(404,'Не знайдено.');row=await env.DB.prepare('SELECT * FROM publications WHERE id=?').bind(match[1]).first<Row>();
 if(!row?.ready)throw new ApiError(404,'Не знайдено.');const snap=parseSnapshot(JSON.parse(row.snapshot));if(!referencedUploads(snap).includes(match[2]))throw new ApiError(404,'Не знайдено.');return handleMedia(match[2],env);
 }
 if(!row?.ready||row.status==='failed')throw new ApiError(409,'Немає підготовленої публікації.');
 const buildUrl=request.headers.get('X-Pages-Build-Url');
 if(buildUrl&&provider.attachBuild){const attached=await provider.attachBuild(publicRow(row),buildUrl);if(attached.deploymentId)await env.DB.prepare('UPDATE publications SET deployment_id=? WHERE id=?').bind(attached.deploymentId,row.id).run()}
 const object=await env.FILES.get(`snapshots/${row.id}.json`);if(!object)throw new ApiError(503,'Знімок недоступний.');return json(parseSnapshot(JSON.parse(await object.text())));
}
