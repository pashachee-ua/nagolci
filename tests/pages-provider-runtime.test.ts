import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare,createFetchMock} from 'miniflare';

// Catches use of fetch options accepted by Node but rejected by Workers.
test('Pages publication can trigger, attach and reconcile in the Workers runtime',async()=>{
 const mock=createFetchMock();mock.disableNetConnect();
 const deployment={id:'d1',environment:'production',created_on:'2026-10-07T00:01:00Z',url:'https://1234.nagolci.pages.dev',latest_stage:{name:'deploy',status:'success'}};
 mock.get('https://api.cloudflare.com').intercept({path:'/client/v4/pages/webhooks/deploy_hooks/test',method:'POST'}).reply(200,JSON.stringify({success:true,result:{id:'job-1'}}));
 mock.get('https://api.cloudflare.com').intercept({path:'/client/v4/accounts/test/pages/projects/nagolci/deployments?per_page=25',method:'GET'}).reply(200,JSON.stringify({success:true,result:[deployment]})).persist();
 for(const origin of ['https://1234.nagolci.pages.dev','https://nagolci.pages.dev'])mock.get(origin).intercept({path:'/publication.json?release=aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',method:'GET'}).reply(200,JSON.stringify({id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',revision:1}));
 const bundle=await build({stdin:{contents:`import {pagesProvider} from './worker/pages-provider.ts';
 export default {async fetch(){try{
 const provider=pagesProvider({PAGES_DEPLOY_HOOK:'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/test',PAGES_API_TOKEN:'test',PAGES_ACCOUNT_ID:'test',PAGES_PROJECT:'nagolci',PUBLIC_ORIGIN:'https://nagolci.pages.dev'});
 const p={id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',revision:1,status:'queued',createdAt:'2026-10-07T00:00:00Z',deploymentId:null,error:null};
 const job=await provider.request(p.id);const attached=await provider.attachBuild(p,'https://1234.nagolci.pages.dev');const result=await provider.reconcile(attached);
 return Response.json({jobId:job.jobId,deploymentId:result.deploymentId,status:result.status});
 }catch(e){return new Response(e.message,{status:500})}}};`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser'});
 const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-05-22',fetchMock:mock});
 try{const response=await mf.dispatchFetch('https://test.local');const body=await response.text();assert.equal(response.status,200,body);assert.deepEqual(JSON.parse(body),{jobId:'job-1',deploymentId:'d1',status:'succeeded'});}finally{await mf.dispose();await mock.close();}
});
