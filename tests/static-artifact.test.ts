import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkArtifact} from '../scripts/check-static-artifact.mjs';
test('artifact check rejects missing resources, secrets and runtime APIs',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'static-check-'));
 const html='<!doctype html><html lang="uk"><head><link rel="canonical" href="https://nagolci.com/"><script type="application/ld+json">{}</script></head><body><div id="root">NA GOLCI</div><img src="/image.webp"><script id="site-snapshot" type="application/json">{"content":{"portrait":"/image.webp"}}</script><script src="/assets/client.js"></script></body></html>';
 try{await mkdir(join(dir,'assets'));await writeFile(join(dir,'index.html'),html);await writeFile(join(dir,'publication.json'),'{"id":null,"revision":0}');await writeFile(join(dir,'image.webp'),'image');await writeFile(join(dir,'assets/client.js'),'hydrateRoot()');await checkArtifact(dir);
 await rm(join(dir,'image.webp'));await assert.rejects(checkArtifact(dir),/Missing resource/);await writeFile(join(dir,'image.webp'),'image');
 await writeFile(join(dir,'assets/client.js'),'BUILD_TOKEN=secret');await assert.rejects(checkArtifact(dir),/Forbidden/);await writeFile(join(dir,'assets/client.js'),'hydrateRoot()');
 await writeFile(join(dir,'index.html'),html.replace('/image.webp','/api/media/test.webp'));await assert.rejects(checkArtifact(dir),/Forbidden/);
 await writeFile(join(dir,'index.html'),html.replace('id="root"','id="nothing"'));await assert.rejects(checkArtifact(dir),/HTML/);
 await writeFile(join(dir,'index.html'),html.replace('<head>','<head><meta name="robots" content="noindex">'));await assert.rejects(checkArtifact(dir),/indexable/);
 }finally{await rm(dir,{recursive:true,force:true})}
});
