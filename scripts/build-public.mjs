import { build } from 'vite';
import { checkArtifact } from './check-static-artifact.mjs';
import { readFile, mkdir, mkdtemp, cp, rm, writeFile, rename } from 'node:fs/promises';
import { resolve, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { initialContent } from '../lib/content.ts';
import { parseSnapshot } from '../static/snapshot.ts';
import { prepareMedia } from '../static/media.ts';
import { documentTemplate } from '../static/template.ts';
import { sitemap } from '../lib/seo.ts';
const args=process.argv.slice(2);
let snapshot;
let readUpload;
async function authenticatedFetch(path){
 const origin=process.env.BUILD_ORIGIN;
 if(!origin || !process.env.BUILD_TOKEN || (!origin.startsWith('https://') && !['localhost','127.0.0.1'].includes(new URL(origin).hostname)))throw new Error('Remote build configuration is missing or invalid');
 const response=await fetch(new URL(path,origin),{redirect:'error',signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${process.env.BUILD_TOKEN}`,...(process.env.CF_PAGES_URL?{'X-Pages-Build-Url':process.env.CF_PAGES_URL}:{}),...(process.env.CF_ACCESS_CLIENT_ID?{'CF-Access-Client-Id':process.env.CF_ACCESS_CLIENT_ID,'CF-Access-Client-Secret':process.env.CF_ACCESS_CLIENT_SECRET??''}:{})}});
 if(!response.ok)throw new Error(`Build source unavailable (${response.status})`);return response;
}
if(args.length===1&&args[0]==='--seed'){
 snapshot=parseSnapshot({schemaVersion:1,revision:0,createdAt:new Date().toISOString(),content:initialContent});
 readUpload=async()=>{throw new Error('Seed cannot reference uploaded media')};
}else if(args.length===2&&args[0]==='--snapshot'&&isAbsolute(args[1])){
 snapshot=parseSnapshot(JSON.parse(await readFile(args[1],'utf8')));
 readUpload=async key=>new Uint8Array(await readFile(resolve(args[1],'..','uploads',key)));
}else if(args.length===1&&args[0]==='--remote'){
 snapshot=parseSnapshot(await (await authenticatedFetch('/api/build/snapshot')).json());
 if(!snapshot.id)throw new Error('Remote snapshot has no publication ID');
 readUpload=async key=>new Uint8Array(await (await authenticatedFetch(`/api/build/media/${snapshot.id}/${key}`)).arrayBuffer());
}else throw new Error('Choose --seed, --snapshot <absolute JSON file> or --remote');
await mkdir('dist',{recursive:true});
const staging=await mkdtemp(resolve('dist/.public-stage-'));
try{
 const prepared=await prepareMedia(snapshot,{publicDir:resolve('public'),outputDir:staging,readUpload});
 await cp('public',staging,{recursive:true});
 await build({configFile:resolve('vite.public.config.ts'),build:{outDir:staging,emptyOutDir:false}});
 const renderer=resolve(staging,'.renderer');
 await build({configFile:resolve('vite.public.config.ts'),publicDir:false,build:{ssr:'static/render.tsx',outDir:renderer,emptyOutDir:true,manifest:false,rollupOptions:{input:'static/render.tsx',output:{entryFileNames:'render.mjs'}}}});
 const {renderPortfolio}=await import(pathToFileURL(resolve(renderer,'render.mjs')).href);
 const manifest=JSON.parse(await readFile(resolve(staging,'.vite/manifest.json'),'utf8'));
 const entry=manifest['static/client.tsx'];
 await writeFile(resolve(staging,'index.html'),documentTemplate(renderPortfolio(prepared),prepared,entry.file,entry.css??[]));
 // The redesign was previewed at /v2/ before it became the main page; keep shared links working.
 await writeFile(resolve(staging,'_redirects'),'/v2 / 301\n/v2/ / 301\n/v2/* / 301\n');
 await writeFile(resolve(staging,'sitemap.xml'),sitemap(prepared.content,snapshot.createdAt));
 await writeFile(resolve(staging,'publication.json'),JSON.stringify({id:snapshot.id??null,revision:snapshot.revision,createdAt:snapshot.createdAt}));
 await writeFile(resolve(staging,'_headers'),'/publication.json\n  Cache-Control: no-store\n  X-Robots-Tag: noindex\n/\n  Cache-Control: no-cache\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Strict-Transport-Security: max-age=31536000\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex\nhttps://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex\n');
 await rm(renderer,{recursive:true});await rm(resolve(staging,'.vite'),{recursive:true});
 await checkArtifact(staging);
 // Keep the previous artifact until a complete replacement is ready.
 const destination=resolve('dist/public'),backup=resolve('dist/.public-previous');
 await rm(backup,{recursive:true,force:true});
 try{await rename(destination,backup)}catch(e){if(e.code!=='ENOENT')throw e}
 try{await rename(staging,destination)}catch(e){try{await rename(backup,destination)}catch{}throw e}
 await rm(backup,{recursive:true,force:true});
 console.log(`Static publication ready: revision ${snapshot.revision}`);
}finally{await rm(staging,{recursive:true,force:true})}
