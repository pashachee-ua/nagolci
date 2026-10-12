import type { SiteContent } from '../lib/content.ts';
import type { ImageDimensions } from '../lib/portfolio-media.ts';
export type ContentSnapshot = { schemaVersion: 1; id?: string; revision: number; content: SiteContent; createdAt: string; imageDimensions?:ImageDimensions };
export type PublicationStatus = 'requesting' | 'queued' | 'building' | 'succeeded' | 'failed' | 'unknown';
export type Publication = { id: string; revision: number; status: PublicationStatus; createdAt: string; deploymentId: string | null; error: string | null };
