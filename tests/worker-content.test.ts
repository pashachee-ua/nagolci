import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createWorker } from '../worker/index.ts';
import { workerFixture } from './helpers/worker-env.ts';
test('independent editor protects assets and APIs and persists revision-checked content',async()=>{
 const f=await workerFixture();const worker=createWorker({keyResolver:f.keyResolver});const call=(r:Request)=>worker.fetch(r,f.env);
 try{
 assert.equal((await call(new Request(f.env.ADMIN_ORIGIN+'/admin'))).status,401);
 assert.equal((await call(new Request(f.env.ADMIN_ORIGIN+'/api/content'))).status,401);
 assert.equal((await call(f.request('/api/unknown'))).status,404);
 const original=await (await call(f.request('/api/content'))).json() as any;
 const data=JSON.stringify({...original,content:{...original.content,name:'Тест'}});
 assert.equal((await call(f.request('/api/content','PUT',data,{Origin:'https://evil.test'}))).status,403);
 assert.equal((await call(f.request('/api/content','PUT',data))).status,200);
 assert.equal((await call(f.request('/api/content','PUT',data))).status,409);
 assert.equal((await (await call(f.request('/api/content'))).json() as any).content.name,'Тест');
 assert.equal((await call(f.request('/api/upload','POST','<svg>',{'Content-Type':'image/svg+xml'}))).status,415);
 assert.equal((await call(f.request('/api/upload','POST',new Uint8Array(8*1024*1024+1),{'Content-Type':'image/png'}))).status,413);
 const image=await readFile('public/images/pavlo.webp');const upload=await (await call(f.request('/api/upload','POST',image,{'Content-Type':'image/webp'}))).json() as any;
 assert.ok(upload.src.startsWith('/api/media/'));
 assert.deepEqual(new Uint8Array(await (await call(f.request(upload.src))).arrayBuffer()),new Uint8Array(image));
 }finally{await f.dispose()}
});
