import test from 'node:test';
import assert from 'node:assert/strict';
import { initialContent } from '../lib/content.ts';
import { parseSnapshot } from '../static/snapshot.ts';
const seed = {schemaVersion:1,revision:0,createdAt:'2026-10-07T00:00:00.000Z',content:initialContent};
test('snapshot validation preserves content and rejects invalid revisions and links',()=>{
 assert.equal(parseSnapshot(seed).content.name,'Павло');
 for(const revision of [-1,1.5,Infinity]) assert.throws(()=>parseSnapshot({...seed,revision}));
 assert.throws(()=>parseSnapshot({...seed,createdAt:'bad'}));
 assert.throws(()=>parseSnapshot({...seed,content:{...initialContent,instagram:'javascript:alert(1)'}}));
});
