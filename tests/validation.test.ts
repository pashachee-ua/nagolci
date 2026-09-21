import test from 'node:test';
import assert from 'node:assert/strict';
import { initialContent } from '../lib/content.ts';
import { validateContent,detectImage } from '../lib/validation.ts';
test('rejects script links and external image URLs',()=>{assert.throws(()=>validateContent({...initialContent,instagram:'javascript:alert(1)'}));assert.throws(()=>validateContent({...initialContent,portrait:'https://evil.test/a.svg'}))});
test('preserves a valid portfolio without hidden arbitrary fields',()=>{assert.deepEqual(validateContent({...initialContent,admin:true}),initialContent)});
test('requires a hero and unique work IDs',()=>{assert.throws(()=>validateContent({...initialContent,works:[]}));assert.throws(()=>validateContent({...initialContent,works:[initialContent.works[0],initialContent.works[0]]}))});
test('rejects SVG uploads and recognises raster signatures',()=>{assert.equal(detectImage(new TextEncoder().encode('<svg onload="alert(1)"></svg>')),null);assert.equal(detectImage(new Uint8Array([255,216,255,224])),'jpg');assert.equal(detectImage(new Uint8Array([137,80,78,71,13,10,26,10])),'png')});
test('old content gains contacts while explicitly empty fields stay hidden',()=>{
 const legacy={...initialContent} as Partial<typeof initialContent>;delete legacy.phone;delete legacy.email;delete legacy.telegram;delete legacy.tiktok;
 assert.deepEqual(validateContent(legacy),initialContent);
 const hidden=validateContent({...initialContent,phone:'',email:'',telegram:'',instagram:'',tiktok:''});
 for(const key of ['phone','email','telegram','instagram','tiktok'] as const)assert.equal(hidden[key],'');
});
test('contacts reject invalid formats and disguised social destinations',()=>{
 for(const patch of [{phone:'0732597665'},{email:'a@b'},{telegram:'https://t.me.evil.test/name'},{telegram:'https://user@t.me/name'},{tiktok:'http://www.tiktok.com/@name'},{email:'x@example.com\r\nBcc:y@example.com'},{phone:null}])assert.throws(()=>validateContent({...initialContent,...patch}));
 assert.equal(validateContent({...initialContent,phone:'+380 (73) 259-76-65'}).phone,'+380732597665');
});
