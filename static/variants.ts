import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import type { ImageVariant } from '../lib/portfolio-media.ts';

// vinext's type stubs declare `sharp` as unknown, shadowing the package's own types; load it with them explicitly.
const sharp = createRequire(import.meta.url)('sharp') as typeof import('sharp/lib/index.d.ts');

// Widths cover a phone gallery tile (~170px at 2-3x) up to the widest backdrop on a 1920px screen.
export const variantWidths = [480, 800, 1200, 1600] as const;

/**
 * Resized WebP copies for srcset. Files are named by content hash, so /img/* can be cached forever
 * (a separate root, so no broader /images/* header rule overlaps it). Sizes the source cannot reach are
 * skipped; instead a full-width copy is re-encoded, since the originals are often heavier than needed.
 */
export async function writeVariants(source: Uint8Array, outputDir: string): Promise<ImageVariant[]> {
  const image = sharp(source).rotate();
  // metadata() reports pre-rotation size; EXIF orientations 5-8 swap width and height.
  const meta = await image.metadata();
  const width = (meta.orientation ?? 1) >= 5 ? meta.height ?? 0 : meta.width ?? 0;
  const widths = [...variantWidths.filter(target => target < width), ...(width && width <= variantWidths.at(-1)! ? [width] : [])];
  const variants: ImageVariant[] = [];
  await mkdir(resolve(outputDir, 'img'), { recursive: true });
  for (const target of widths) {
    const bytes = await image.clone().resize({ width: target, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toBuffer();
    const name = `${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}-${target}.webp`;
    await writeFile(resolve(outputDir, 'img', name), bytes);
    variants.push({ src: `/img/${name}`, width: target });
  }
  return variants;
}
