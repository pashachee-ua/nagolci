import {readFile,readdir,stat,realpath} from 'node:fs/promises';
import {resolve,dirname,sep,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
export async function checkArtifact(directory){
 const root=await realpath(directory),html=await readFile(resolve(root,'index.html'),'utf8');
 if(!html.startsWith('<!doctype html>')||!html.includes('id="root"')||!html.includes('NA GOLCI')||!html.includes('id="site-snapshot"'))throw new Error('Incomplete public HTML');
 // The published page is the indexable one: a stray noindex would silently drop the site from search.
 if(/<meta[^>]+name="robots"[^>]+noindex/i.test(html))throw new Error('Public page must be indexable');
 if(!html.includes('<link rel="canonical" href="https://nagolci.com/">')||!html.includes('application/ld+json'))throw new Error('Missing canonical or structured data');
 const publication=JSON.parse(await readFile(resolve(root,'publication.json'),'utf8'));
 if(!Number.isSafeInteger(publication.revision)||publication.revision<0)throw new Error('Invalid publication manifest');
 async function resource(value,base=root){
  if(!value||value.startsWith('#')||/^(?:https?:|data:|mailto:|tel:)/i.test(value))return;
  const clean=decodeURIComponent(value.split(/[?#]/)[0]);const path=clean==='/'?'/index.html':clean;const file=resolve(path.startsWith('/')?root:base,'.'+(path.startsWith('/')?path:'/'+path));
  let actual;try{actual=await realpath(file);if(!(await stat(actual)).isFile())throw new Error()}catch{throw new Error(`Missing resource: ${clean}`)}
  if(!actual.startsWith(root+sep))throw new Error('Resource escapes artifact');
 }
 async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=resolve(dir,entry.name);if(entry.isDirectory()){if(['.renderer','.vite','admin'].includes(entry.name))throw new Error('Forbidden runtime directory');await scan(file);continue}
  if(!['.html','.css','.js','.json','.svg'].includes(extname(file)))continue;
  const text=await readFile(file,'utf8');
  if(/\/api\/(?:content|media|upload|publications|build)(?:[\/"'\s]|$)|BUILD_TOKEN|PAGES_API_TOKEN|CF_ACCESS_CLIENT_SECRET|BEGIN (?:RSA |EC )?PRIVATE KEY|ghp_[A-Za-z0-9]{20,}/.test(text))throw new Error('Forbidden runtime API or secret marker');
  for(const secretName of ['BUILD_TOKEN','PAGES_API_TOKEN','PAGES_DEPLOY_HOOK','CF_ACCESS_CLIENT_SECRET']){const secret=process.env[secretName];if(secret&&secret.length>=16&&!secret.includes('REPLACE_')&&text.includes(secret))throw new Error('Forbidden secret value')}
  if(extname(file)==='.html'){for(const match of text.matchAll(/(?:src|poster|href)="([^"]+)"/g))await resource(match[1],dirname(file))}
  if(extname(file)==='.css'){for(const match of text.matchAll(/url\(\s*["']?([^"'\s)]+)["']?\s*\)/g))await resource(match[1],dirname(file))}
  for(const match of text.matchAll(/["'](\/(?:images|videos|fonts|icons|media|assets)\/[^"'\\\s]+)["']/g))await resource(match[1],dirname(file));
 }}
 await scan(root);
 return {revision:publication.revision};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{if(process.argv.length!==3)throw new Error('Usage: check-static-artifact.mjs <artifact-dir>');await checkArtifact(process.argv[2]);console.log('Static artifact verified')}catch(error){console.error(error.message);process.exitCode=1}
}
