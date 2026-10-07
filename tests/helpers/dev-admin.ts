// Local-only test harness: signed test identity and real disposable D1/R2.
// Never imported by the production Worker or included in public/admin bundles.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createWorker} from '../../worker/index.ts';
import {workerFixture} from './worker-env.ts';
import type {Publication} from '../../shared/publication.ts';
import {PublishRejected} from '../../worker/publications.ts';
const f=await workerFixture({tokenLifetime:'12h'});f.env.PUBLIC_ORIGIN='http://127.0.0.1:4320';f.env.BUILD_TOKEN='local-build-test-token-not-production';
let phase='building';let reject=false;
const provider={request:async()=>{if(reject)throw new PublishRejected('test rejection');phase='building';return{jobId:'local-job'}},reconcile:async(p:Publication)=>{let live:any=null;try{live=JSON.parse(await readFile('dist/public/publication.json','utf8'))}catch{}return{...p,status:phase==='failed'?'failed' as const:phase==='succeeded'&&live?.id===p.id?'succeeded' as const:'building' as const,error:phase==='failed'?'Збірка не вдалася.':null}}};
const worker=createWorker({keyResolver:f.keyResolver,provider});
f.env.ASSETS={fetch:async(request:Request)=>{
 const root=resolve('dist/admin'),path=new URL(request.url).pathname;let file=resolve(root,'.'+path);if(!file.startsWith(root+sep))file=resolve(root,'index.html');
 let bytes;try{bytes=await readFile(file)}catch{file=resolve(root,'index.html');bytes=await readFile(file)}
 const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf','.mp4':'video/mp4'};
 return new Response(bytes,{headers:{'Content-Type':mime[extname(file)]??'application/octet-stream'}});
}} as unknown as Fetcher;
const server=createServer(async(req,res)=>{try{
 if(req.url==='/__test/provider'&&req.method==='POST'){let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);phase=body.phase??phase;reject=body.reject??reject;res.end('ok');return}
 const chunks=[];for await(const chunk of req)chunks.push(chunk);const data=Buffer.concat(chunks);
 const headers={...req.headers} as Record<string,string>;delete headers.host;
 const request=req.url?.startsWith('/api/build/')?new Request(f.env.ADMIN_ORIGIN+req.url,{headers}):f.request(req.url??'/',req.method,data.length?data:undefined,headers);
 const response=await worker.fetch(request,f.env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500);res.end('Test request failed')}});
await new Promise<void>(resolve=>server.listen(4321,'127.0.0.1',resolve));f.env.ADMIN_ORIGIN='http://127.0.0.1:4321';
console.log('Disposable editor test harness: http://127.0.0.1:4321/admin');
async function stop(){await new Promise<void>(resolve=>server.close(()=>resolve()));await f.dispose();process.exit()}
process.on('SIGINT',()=>{void stop()});process.on('SIGTERM',()=>{void stop()});
