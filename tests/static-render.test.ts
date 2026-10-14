import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
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
 const notFound=readFileSync('dist/public/404.html','utf8');
 assert.match(notFound, /Сторінку не знайдено/);
 assert.match(notFound, /href="\/"/);
 assert.match(notFound, /content="noindex, nofollow"/);
 assert.match(html, /content="noindex, nofollow"/);
 assert.match(readFileSync('dist/public/_headers','utf8'), /X-Robots-Tag: noindex, nofollow/);
 assert.equal(readFileSync('dist/public/robots.txt','utf8'), 'User-agent: *\nAllow: /\n');
 assert.ok(html.includes('<div id="top" aria-hidden="true"></div><header class="wow-header">'));
 for(const name of ['cormorant-garamond-600','golos-text-variable']) {
  assert.ok(html.includes(`<link rel="preload" href="/fonts/${name}.woff2" as="font" type="font/woff2" crossorigin>`));
  assert.equal(readFileSync(`dist/public/fonts/${name}.woff2`).subarray(0,4).toString(),'wOF2');
 }
 // The former /v2/ preview URL now points at the main page.
 assert.equal(readFileSync('dist/public/_redirects','utf8'),'/v2 / 301\n/v2/ / 301\n/v2/* / 301\n');
 assert.ok(!existsSync('dist/public/v2'));
 assert.ok(html.includes('wow-primary'));assert.ok(html.includes('https://t.me/Kot_usual?text='));
 assert.ok(html.includes('Павло'));assert.ok(html.includes('tel:+380732597665'));assert.ok(html.includes('Саша Диденко'));assert.ok(html.includes('Текст &lt;/script&gt;'));
 assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(!html.includes('/api/content'));assert.ok(!html.includes('/api/media/'));
 const embedded=html.match(/<script id="site-snapshot" type="application\/json">([\s\S]*?)<\/script>/)![1];
 assert.deepEqual(JSON.parse(embedded).imageDimensions['/images/work-31.webp'],{width:1280,height:1280});
 assert.match(html,/<img[^>]*src="\/images\/work-31.webp"[^>]*width="1280"[^>]*height="1280"/);
 assert.equal(JSON.parse(embedded).revision,3);assert.ok(embedded.includes('\\u003c'));
 assert.equal(JSON.parse(readFileSync('dist/public/publication.json','utf8')).revision,3);
 const previous=html;
 const invalid=spawnSync(process.execPath,['scripts/build-public.mjs','--remote'],{env:{...process.env,BUILD_ORIGIN:'',BUILD_TOKEN:''}});
 assert.notEqual(invalid.status,0);assert.equal(readFileSync('dist/public/index.html','utf8'),previous);
 }finally{rmSync(temp,{recursive:true,force:true})}
});
