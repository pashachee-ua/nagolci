import { validateContent } from '../lib/validation.ts';
import type { ContentSnapshot } from '../shared/publication.ts';
export function parseSnapshot(value: unknown): ContentSnapshot {
 if (!value || typeof value !== 'object') throw new Error('Invalid snapshot');
 const v=value as ContentSnapshot;
 if(v.schemaVersion!==1 || !Number.isSafeInteger(v.revision) || v.revision<0 || typeof v.createdAt!=='string' || !Number.isFinite(Date.parse(v.createdAt)))throw new Error('Invalid snapshot metadata');
 if(v.id!==undefined && !/^[a-f0-9-]{36}$/.test(v.id))throw new Error('Invalid publication ID');
 return {schemaVersion:1,...(v.id?{id:v.id}:{}),revision:v.revision,createdAt:v.createdAt,content:validateContent(v.content)};
}
export const uploadKeyPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|png|webp)$/;
export function referencedUploads(snapshot: ContentSnapshot): string[] {
 return [...new Set([snapshot.content.portrait,snapshot.content.studio,...snapshot.content.works.map(w=>w.src)].filter(p=>p.startsWith('/api/media/')).map(p=>{
 const key=p.slice('/api/media/'.length);if(!uploadKeyPattern.test(key))throw new Error('Invalid upload key');return key;
 }))];
}
