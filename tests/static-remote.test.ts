import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createWorker} from '../worker/index.ts';
import {workerFixture} from './helpers/worker-env.ts';
test('remote build consumes one immutable saved revision and copies uploaded media into static output',async()=>{
 const f=await workerFixture();f.env.BUILD_TOKEN='build-token-for-local-test-only';
 const provider={request:async()=>({jobId:'test-job'}),reconcile:async(p:any)=>p};const worker=createWorker({keyResolver:f.keyResolver,provider});
 const call=(r:Request)=>worker.fetch(r,f.env);
 const server=createServer(async(req,res)=>{try{const response=await call(new Request(f.env.ADMIN_ORIGIN+req.url,{headers:req.headers as Record<string,string>}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500);res.end()}});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
 const image=await readFile('public/images/pavlo.webp');const upload=await (await call(f.request('/api/upload','POST',image,{'Content-Type':'image/webp'}))).json() as any;
 const draft=await (await call(f.request('/api/content'))).json() as any;draft.content.portrait=upload.src;draft.content.name='Знімок';
 await call(f.request('/api/content','PUT',JSON.stringify(draft)));
 const release=await (await call(f.request('/api/publications','POST',JSON.stringify({revision:1})))).json() as any;
 await call(f.request('/api/content','PUT',JSON.stringify({revision:1,content:{...draft.content,name:'Ще не опубліковано'}})));
 const port=(server.address() as any).port;
 await promisify(execFile)(process.execPath,['scripts/build-public.mjs','--remote'],{env:{...process.env,BUILD_ORIGIN:`http://127.0.0.1:${port}`,BUILD_TOKEN:f.env.BUILD_TOKEN}});
 const html=await readFile('dist/public/index.html','utf8');assert.ok(html.includes('Знімок'));assert.ok(!html.includes('Ще не опубліковано'));assert.ok(!html.includes('/api/media/'));
 assert.equal(JSON.parse(await readFile('dist/public/publication.json','utf8')).id,release.id);
 assert.deepEqual(await readFile('dist/public/media/'+upload.src.split('/').at(-1)),image);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await f.dispose()}
});
