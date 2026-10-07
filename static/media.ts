import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import type { ContentSnapshot } from '../shared/publication.ts';
import { galleryMedia, processMedia } from '../lib/portfolio-media.ts';
import { detectImage } from '../lib/validation.ts';
import { parseSnapshot, referencedUploads } from './snapshot.ts';
export async function prepareMedia(snapshot: ContentSnapshot, options: {publicDir:string;outputDir:string;readUpload:(key:string)=>Promise<Uint8Array>}): Promise<ContentSnapshot> {
 const result=structuredClone(parseSnapshot(snapshot));
 const sourceRoot=await realpath(options.publicDir);
 const paths=new Set([result.content.portrait,result.content.studio,...galleryMedia(result.content.works).flatMap(w=>[w.src,...(w.videoSrc?[w.videoSrc]:[])]),processMedia.src,processMedia.videoSrc!, '/logo.svg','/favicon.svg']);
 for(const path of paths){
 if(path.startsWith('/api/media/'))continue;
 if(!/^\/(images|videos)\/[a-zA-Z0-9_-]+\.(webp|jpg|png|mp4)$/.test(path)&&!['/logo.svg','/favicon.svg'].includes(path))throw new Error('Invalid media path');
 const file=await realpath(resolve(sourceRoot,path.slice(1)));
 if(!file.startsWith(sourceRoot+sep))throw new Error('Media outside public directory');
 await readFile(file);
 }
 for(const key of referencedUploads(result)){
 const bytes=await options.readUpload(key);
 if(bytes.byteLength>8*1024*1024 || detectImage(bytes)!==key.split('.').at(-1))throw new Error('Invalid uploaded media');
 const destination=resolve(options.outputDir,'media',key);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,bytes);
 }
 const mapped=(path:string)=>path.startsWith('/api/media/')?'/media/'+path.slice('/api/media/'.length):path;
 result.content.portrait=mapped(result.content.portrait);result.content.studio=mapped(result.content.studio);result.content.works=result.content.works.map(w=>({...w,src:mapped(w.src)}));
 return result;
}
