import type { Publication } from '../shared/publication.ts';
import { PublishRejected,type PublicationProvider } from './publications.ts';
import {ApiError,type WorkerEnv} from './types.ts';
type Deployment={id:string;url:string;environment:string;created_on:string;latest_stage:{name:string;status:string};deployment_trigger?:{type?:string}};
export function pagesProvider(env:WorkerEnv,fetcher:typeof fetch=fetch):PublicationProvider{
 function configured(){if(!env.PAGES_DEPLOY_HOOK||!env.PAGES_API_TOKEN||!env.PAGES_ACCOUNT_ID||!env.PAGES_PROJECT||!env.PUBLIC_ORIGIN)throw new PublishRejected('Publication settings missing')}
 const api=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.PAGES_ACCOUNT_ID??'')}/pages/projects/${encodeURIComponent(env.PAGES_PROJECT??'')}`;
 async function get(path:string){const response=await fetcher(api+path,{headers:{Authorization:'Bearer '+env.PAGES_API_TOKEN},signal:AbortSignal.timeout(15000),redirect:'error'});if(!response.ok)throw new Error('Deployment status unavailable');const body=await response.json() as {success:boolean;result:unknown};if(!body.success)throw new Error('Deployment status unavailable');return body.result}
 async function manifest(url:string,p:Publication):Promise<boolean>{
 try{const origin=new URL(url);if(origin.protocol!=='https:'||(!origin.hostname.endsWith('.pages.dev')&&origin.origin!==env.PUBLIC_ORIGIN))return false;
 const response=await fetcher(new URL('/publication.json?release='+encodeURIComponent(p.id),origin),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok)return false;const m=await response.json() as {id?:string;revision?:number};return m.id===p.id&&m.revision===p.revision;
 }catch{return false}
 }
 return{
 async attachBuild(p,url){
 configured();const parsed=new URL(url);if(parsed.protocol!=='https:'||!parsed.hostname.endsWith(`.${env.PAGES_PROJECT}.pages.dev`))throw new ApiError(409,'Невідома збірка.');
 const deployments=await get('/deployments?per_page=25') as Deployment[];const d=deployments.find(d=>d.url===parsed.origin&&d.environment==='production'&&Date.parse(d.created_on)>=Date.parse(p.createdAt));
 if(!d)throw new ApiError(503,'Збірка ще недоступна.');
 if(p.deploymentId&&p.deploymentId!==d.id)throw new ApiError(409,'До публікації вже прив’язана інша збірка.');
 return {...p,deploymentId:d.id};
 },
 async request(){
 configured();const hook=new URL(env.PAGES_DEPLOY_HOOK!);if(hook.protocol!=='https:'||hook.hostname!=='api.cloudflare.com'||!hook.pathname.startsWith('/client/v4/pages/webhooks/'))throw new PublishRejected('Invalid hook');
 const response=await fetcher(hook,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000)});
 if(response.status>=400&&response.status<500)throw new PublishRejected('Hook rejected');if(!response.ok)throw new Error('Hook response uncertain');
 const body=await response.json() as {success?:boolean;result?:{job?:{id?:string};id?:string}};
 if(body.success===false)throw new PublishRejected('Hook rejected');return{jobId:body.result?.job?.id??body.result?.id??null};
 },
 async reconcile(p){
 configured();const deployments=await get('/deployments?per_page=25') as Deployment[];
 // A terminal failure is trustworthy only for the exact deployment ID attached by the build.
 const known=deployments.find(d=>d.id===p.deploymentId&&d.environment==='production');
 if(known&&['failure','canceled'].includes(known.latest_stage.status))return{...p,status:'failed',error:'Збірка не вдалася. Попередня версія сайту працює.'};
 for(const d of deployments){
 if((p.deploymentId&&d.id!==p.deploymentId)||d.environment!=='production'||Date.parse(d.created_on)<Date.parse(p.createdAt)||d.latest_stage.status!=='success'||d.latest_stage.name!=='deploy')continue;
 if(await manifest(d.url,p)&&await manifest(env.PUBLIC_ORIGIN!,p))return{...p,deploymentId:d.id,status:'succeeded',error:null};
 }
 if(known&&known.latest_stage.status==='active')return{...p,status:'building',error:null};
 return p;
 }
 };
}
