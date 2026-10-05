import test from 'node:test';
import assert from 'node:assert/strict';
import { initialContent } from '../lib/content.ts';
import { galleryMedia, processMedia } from '../lib/portfolio-media.ts';

void test('curated videos preserve editable photos and have stable unique IDs', () => {
 const media = galleryMedia(initialContent.works);
 assert.equal(media.filter(w => w.videoSrc).length, 2);
 assert.equal(new Set(media.map(w => w.id)).size, media.length);
 for (const work of initialContent.works) assert.deepEqual(media.find(w => w.id === work.id), work);
 assert.equal(processMedia.videoSrc, '/videos/process.mp4');
});
