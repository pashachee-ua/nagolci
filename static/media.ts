import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import type { ContentSnapshot } from '../shared/publication.ts';
import { galleryMedia, processMedia, processPhoto, type ImageDimensions, type ImageVariants } from '../lib/portfolio-media.ts';
import { writeVariants } from './variants.ts';
import { imageSize } from 'image-size';
import { detectImage } from '../lib/validation.ts';
import { parseSnapshot, referencedUploads } from './snapshot.ts';
export async function prepareMedia(snapshot: ContentSnapshot, options: {publicDir:string;outputDir:string;readUpload:(key:string)=>Promise<Uint8Array>;variants?:boolean}): Promise<ContentSnapshot> {
 const result=structuredClone(parseSnapshot(snapshot));
 const gallerySources=new Set(galleryMedia(result.content.works).map(work=>work.src));
 const dimensions:ImageDimensions={};
 const variants:ImageVariants={};
 const publicPath=(path:string)=>path.startsWith('/api/media/')?'/media/'+path.slice('/api/media/'.length):path;
 // Photos shown on the page (gallery incl. video posters, portrait, studio) get resized copies for srcset.
 const resized=new Set([...gallerySources,result.content.portrait,result.content.studio,processPhoto]);
 const resizes=(path:string)=>options.variants!==false && resized.has(path);
 const addVariants=async(path:string,bytes:Uint8Array)=>{ if(resizes(path)) { const copies=await writeVariants(bytes,options.outputDir); if(copies.length) variants[publicPath(path)]=copies; } };
 const readDimensions=(path:string,bytes:Uint8Array)=>{
  // Gallery sizes reserve layout space; other photos only need a width for their srcset.
  if(!gallerySources.has(path)&&!(resizes(path)))return;
  const size=imageSize(bytes);
  const rotated=!!size.orientation && size.orientation>=5 && size.orientation<=8;
  dimensions[path.startsWith('/api/media/')?'/media/'+path.slice('/api/media/'.length):path]=rotated?{width:size.height,height:size.width}:{width:size.width,height:size.height};
 };
 const sourceRoot=await realpath(options.publicDir);
 const paths=new Set([result.content.portrait,result.content.studio,...galleryMedia(result.content.works).flatMap(w=>[w.src,...(w.videoSrc?[w.videoSrc]:[])]),processMedia.src,processMedia.videoSrc!,processPhoto,'/logo.svg','/favicon.svg']);
 for(const path of paths){
 if(path.startsWith('/api/media/'))continue;
 if(!/^\/(images|videos)\/[a-zA-Z0-9_-]+\.(webp|jpg|png|mp4)$/.test(path)&&!['/logo.svg','/favicon.svg'].includes(path))throw new Error('Invalid media path');
 const file=await realpath(resolve(sourceRoot,path.slice(1)));
 if(!file.startsWith(sourceRoot+sep))throw new Error('Media outside public directory');
 const bytes=await readFile(file);
 readDimensions(path,bytes);
 await addVariants(path,bytes);
 }
 for(const key of referencedUploads(result)){
 const bytes=await options.readUpload(key);
 if(bytes.byteLength>8*1024*1024 || detectImage(bytes)!==key.split('.').at(-1))throw new Error('Invalid uploaded media');
 readDimensions('/api/media/'+key,bytes);
 await addVariants('/api/media/'+key,bytes);
 const destination=resolve(options.outputDir,'media',key);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,bytes);
 }
 const mapped=(path:string)=>path.startsWith('/api/media/')?'/media/'+path.slice('/api/media/'.length):path;
 result.content.portrait=mapped(result.content.portrait);result.content.studio=mapped(result.content.studio);result.content.works=result.content.works.map(w=>({...w,src:mapped(w.src)}));
 result.imageDimensions=dimensions;
 if(Object.keys(variants).length) result.imageVariants=variants;
 return result;
}
