import test from 'node:test';
import assert from 'node:assert/strict';
import { initialContent } from '../lib/content.ts';
import { validateContent,detectImage } from '../lib/validation.ts';
test('rejects script links and external image URLs',()=>{assert.throws(()=>validateContent({...initialContent,instagram:'javascript:alert(1)'}));assert.throws(()=>validateContent({...initialContent,portrait:'https://evil.test/a.svg'}))});
test('preserves a valid portfolio without hidden arbitrary fields',()=>{assert.deepEqual(validateContent({...initialContent,admin:true}),initialContent)});
test('requires a hero and unique work IDs',()=>{assert.throws(()=>validateContent({...initialContent,works:[]}));assert.throws(()=>validateContent({...initialContent,works:[initialContent.works[0],initialContent.works[0]]}))});
test('rejects SVG uploads and recognises raster signatures',()=>{assert.equal(detectImage(new TextEncoder().encode('<svg onload="alert(1)"></svg>')),null);assert.equal(detectImage(new Uint8Array([255,216,255,224])),'jpg');assert.equal(detectImage(new Uint8Array([137,80,78,71,13,10,26,10])),'png')});
