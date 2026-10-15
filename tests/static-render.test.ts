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
 // Production is indexable; only the 404 page and the *.pages.dev mirror stay out of search.
 assert.doesNotMatch(html, /name="robots"/);
 const headers=readFileSync('dist/public/_headers','utf8');
 assert.doesNotMatch(headers.split('https://')[0], /X-Robots-Tag: noindex, nofollow/);
 assert.match(headers, /https:\/\/:project\.pages\.dev\/\*\n  X-Robots-Tag: noindex/);
 assert.equal(readFileSync('dist/public/robots.txt','utf8'), 'User-agent: *\nAllow: /\n\nSitemap: https://nagolci.com/sitemap.xml\n');
 assert.ok(html.includes('<link rel="canonical" href="https://nagolci.com/">'));
 assert.ok(html.includes('<meta property="og:image" content="https://nagolci.com/images/og.jpg">'));
 const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
 assert.equal(ld['@graph'][0]['@type'],'TattooParlor');assert.equal(ld['@graph'][0].telephone,'+380732597665');
 assert.ok(!JSON.stringify(ld).includes('aggregateRating'));
 const sitemap=readFileSync('dist/public/sitemap.xml','utf8');
 assert.match(sitemap,/<loc>https:\/\/nagolci\.com\/<\/loc><lastmod>2026-10-07<\/lastmod>/);
 assert.match(sitemap,/<image:loc>https:\/\/nagolci\.com\/images\/work-31\.webp<\/image:loc>/);
 // Gallery images describe the work for image search, and only the hero is preloaded (and so Early-Hinted).
 assert.match(html,/<img src="\/images\/work-31\.webp" alt="[^"]+— тату/);
 assert.deepEqual([...html.matchAll(/<link rel="preload" as="image" href="([^"]+)"/g)].map(m=>m[1]),['/logo.svg','/images/work-25.webp']);
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
