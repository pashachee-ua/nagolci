import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initialContent } from '../lib/content.ts';
test('static build includes real content, safe snapshot JSON and no draft API',()=>{
 const temp=mkdtempSync(join(tmpdir(),'nagolci-render-'));
 try{
 const snapshot=join(temp,'snapshot.json');
 writeFileSync(snapshot,JSON.stringify({schemaVersion:1,revision:3,createdAt:'2026-10-07T00:00:00Z',content:{...initialContent,biography:'Текст </script><script>alert(1)</script> & < тут'}}));
 execFileSync(process.execPath,['scripts/build-public.mjs','--snapshot',snapshot],{stdio:'pipe'});
 const html=readFileSync('dist/public/index.html','utf8');
 for(const name of ['cormorant-garamond-600','golos-text-variable']) {
  assert.ok(html.includes(`<link rel="preload" href="/fonts/${name}.woff2" as="font" type="font/woff2" crossorigin>`));
  assert.equal(readFileSync(`dist/public/fonts/${name}.woff2`).subarray(0,4).toString(),'wOF2');
 }
 assert.ok(html.includes('Павло'));assert.ok(html.includes('tel:+380732597665'));assert.ok(html.includes('Саша Диденко'));assert.ok(html.includes('Текст &lt;/script&gt;'));
 assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(!html.includes('/api/content'));assert.ok(!html.includes('/api/media/'));
 const embedded=html.match(/<script id="site-snapshot" type="application\/json">([\s\S]*?)<\/script>/)![1];
 assert.equal(JSON.parse(embedded).revision,3);assert.ok(embedded.includes('\\u003c'));
 assert.equal(JSON.parse(readFileSync('dist/public/publication.json','utf8')).revision,3);
 const previous=html;
 const invalid=spawnSync(process.execPath,['scripts/build-public.mjs','--remote'],{env:{...process.env,BUILD_ORIGIN:'',BUILD_TOKEN:''}});
 assert.notEqual(invalid.status,0);assert.equal(readFileSync('dist/public/index.html','utf8'),previous);
 }finally{rmSync(temp,{recursive:true,force:true})}
});
