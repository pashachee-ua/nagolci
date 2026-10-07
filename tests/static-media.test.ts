import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initialContent } from '../lib/content.ts';
import { prepareMedia } from '../static/media.ts';
const key='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa.webp';
const seed={schemaVersion:1 as const,revision:0,createdAt:'2026-10-07T00:00:00.000Z',content:initialContent};
test('uploads become static files without mutating the stored snapshot',async()=>{
 const out=await mkdtemp(join(tmpdir(),'nagolci-media-'));let reads=0;
 const input={...seed,content:{...initialContent,portrait:'/api/media/'+key,studio:'/api/media/'+key}};
 try{const result=await prepareMedia(input,{publicDir:'public',outputDir:out,readUpload:async()=>{reads++;return new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80])}});
 assert.equal(result.content.portrait,'/media/'+key);assert.equal(input.content.portrait,'/api/media/'+key);assert.equal(reads,1);assert.equal((await readFile(join(out,'media',key))).length,12);
 }finally{await rm(out,{recursive:true,force:true})}
});
test('missing or malicious media stops preparation',async()=>{
 const out=await mkdtemp(join(tmpdir(),'nagolci-media-'));
 const options={publicDir:'public',outputDir:out,readUpload:async()=>{throw new Error('missing upload')}};
 try{for(const portrait of ['/images/missing.webp','/images/../../secret.webp','/images/%2e%2e/secret.webp','https://evil.test/a.webp','/api/media/'+key])await assert.rejects(()=>prepareMedia({...seed,content:{...initialContent,portrait}},options));
 await assert.rejects(()=>prepareMedia(seed,{...options,publicDir:out}));
 }finally{await rm(out,{recursive:true,force:true})}
});
