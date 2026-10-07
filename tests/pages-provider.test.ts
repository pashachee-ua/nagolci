import test from 'node:test';
import assert from 'node:assert/strict';
import { pagesProvider } from '../worker/pages-provider.ts';
import type { WorkerEnv } from '../worker/types.ts';
const env={PAGES_DEPLOY_HOOK:'https://api.cloudflare.com/client/v4/pages/webhooks/test',PAGES_API_TOKEN:'test',PAGES_ACCOUNT_ID:'test',PAGES_PROJECT:'nagolci',PUBLIC_ORIGIN:'https://nagolci.pages.dev'} as WorkerEnv;
const publication={id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',revision:1,status:'queued' as const,createdAt:'2026-10-07T00:00:00Z',deploymentId:null,error:null};
test('provider associates a build URL with its real deployment, not an arbitrary job',async()=>{
 const fetcher=async()=>Response.json({success:true,result:[{id:'deployment-1',environment:'production',created_on:'2026-10-07T00:01:00Z',url:'https://1234.nagolci.pages.dev',latest_stage:{name:'build',status:'active'}}]});
 const p=pagesProvider(env,fetcher as typeof fetch);
 assert.equal((await p.attachBuild!(publication,'https://1234.nagolci.pages.dev')).deploymentId,'deployment-1');
 assert.equal((await p.attachBuild!(publication,'https://evil.test')).deploymentId,null);
});
test('provider confirms both immutable deployment and live manifest before reporting success',async()=>{
 let liveId='old';
 const fetcher=async(input:any)=>{const url=String(input);if(url.includes('api.cloudflare.com'))return Response.json({success:true,result:[{id:'d1',environment:'production',created_on:'2026-10-07T00:01:00Z',url:'https://1234.nagolci.pages.dev',latest_stage:{name:'deploy',status:'success'}}]});return Response.json({id:url.includes('1234.')?publication.id:liveId,revision:1})};
 const provider=pagesProvider(env,fetcher as typeof fetch);
 assert.equal((await provider.reconcile(publication)).status,'queued');liveId=publication.id;assert.equal((await provider.reconcile(publication)).status,'succeeded');
});
