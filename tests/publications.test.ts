import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createWorker } from '../worker/index.ts';
import type { PublicationProvider } from '../worker/publications.ts';
import { workerFixture } from './helpers/worker-env.ts';
async function setup(){
 const f=await workerFixture();let requests=0;let failure:'none'|'reject'|'timeout'='none';let phase='building';let expectedId='';
 const provider:PublicationProvider={request:async()=>{requests++;if(failure==='reject')throw new Error('rejected');if(failure==='timeout')throw new DOMException('timeout','TimeoutError');return{jobId:'job-1'}},reconcile:async p=>({...p,status:phase==='succeeded'&&expectedId===p.id?'succeeded':phase==='failed'?'failed':'building',error:phase==='failed'?'Збірка не вдалася.':null})};
 const worker=createWorker({keyResolver:f.keyResolver,provider});const call=(request:Request)=>worker.fetch(request,f.env);
 f.env.BUILD_TOKEN='test-build-token-at-least-16';
 const original=await (await call(f.request('/api/content'))).json() as any;
 await call(f.request('/api/content','PUT',JSON.stringify(original)));
 return {...f,call,provider,getRequests:()=>requests,setFailure:(value:typeof failure)=>{failure=value},setPhase:(value:string,id='')=>{phase=value;expectedId=id}};
}
test('publish pins saved content, deduplicates requests and restricts build reads',async()=>{
 const f=await setup();
 try{
 const start=async()=>f.call(f.request('/api/publications','POST',JSON.stringify({revision:1})));
 const both=await Promise.all([start(),start()]);assert.ok(both.every(r=>r.status===200));
 const release=await both[0].json() as any;assert.notEqual(release.status,'succeeded');assert.equal(f.getRequests(),1);
 const build=(path:string)=>new Request(f.env.ADMIN_ORIGIN+path,{headers:{Authorization:'Bearer '+f.env.BUILD_TOKEN}});
 assert.equal((await f.call(new Request(f.env.ADMIN_ORIGIN+'/api/build/snapshot'))).status,401);
 const snapshot=await (await f.call(build('/api/build/snapshot'))).json() as any;assert.equal(snapshot.revision,1);assert.equal(snapshot.id,release.id);
 const draft=await (await f.call(f.request('/api/content'))).json() as any;
 await f.call(f.request('/api/content','PUT',JSON.stringify({...draft,content:{...draft.content,name:'Новий чернетковий текст'}})));
 const still=await (await f.call(build('/api/build/snapshot'))).json() as any;assert.equal(still.content.name,'Павло');
 assert.equal((await f.call(f.request('/api/publications','POST',JSON.stringify({revision:2})))).status,409);
 assert.equal((await f.call(build(`/api/build/media/${release.id}/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp`))).status,404);
 f.setPhase('succeeded','old-id');assert.notEqual((await (await f.call(f.request('/api/publications/latest'))).json() as any).status,'succeeded');
 f.setPhase('succeeded',release.id);assert.equal((await (await f.call(f.request('/api/publications/latest'))).json() as any).status,'succeeded');
 const next=await (await f.call(f.request('/api/publications','POST',JSON.stringify({revision:2})))).json() as any;assert.notEqual(next.id,release.id);assert.equal(f.getRequests(),2);
 }finally{await f.dispose()}
});
test('definitive failure permits retry but uncertain hook timeout remains locked',async()=>{
 const f=await setup();
 try{
 f.setFailure('reject');const failed=await (await f.call(f.request('/api/publications','POST',JSON.stringify({revision:1})))).json() as any;assert.equal(failed.status,'unknown');
 // Generic transport errors cannot prove the hook was rejected; never replay automatically.
 assert.equal(f.getRequests(),1);
 await f.call(f.request('/api/publications','POST',JSON.stringify({revision:1})));assert.equal(f.getRequests(),1);
 f.setPhase('failed');const terminal=await (await f.call(f.request('/api/publications/latest'))).json() as any;assert.equal(terminal.status,'failed');
 f.setPhase('building');f.setFailure('timeout');const timeout=await (await f.call(f.request('/api/publications','POST',JSON.stringify({revision:1})))).json() as any;assert.equal(timeout.status,'unknown');assert.equal(f.getRequests(),2);
 await f.call(f.request('/api/publications','POST',JSON.stringify({revision:1})));assert.equal(f.getRequests(),2);
 const draft=await (await f.call(f.request('/api/content'))).json() as any;assert.equal(draft.revision,1);
 }finally{await f.dispose()}
});
