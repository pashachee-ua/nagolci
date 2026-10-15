import type { Work } from './content.ts';
export type ImageDimensions = Record<string, {width:number;height:number}>;
export type ImageVariant = { src: string; width: number };
/** Resized copies per original path, generated at build time for srcset. */
export type ImageVariants = Record<string, ImageVariant[]>;

/** srcset for an original image: its re-encoded copies, plus the original only if no copy reaches its width. */
export function srcSet(src: string, variants: ImageVariants | undefined, originalWidth?: number): string | undefined {
 const copies = variants?.[src];
 if (!copies?.length) return undefined;
 const widest = Math.max(...copies.map(copy => copy.width));
 const original = originalWidth && originalWidth > widest ? [`${src} ${originalWidth}w`] : [];
 return [...copies.map(copy => `${copy.src} ${copy.width}w`), ...original].join(', ');
}
export type PortfolioMedia = Work & { videoSrc?: string; sourceUrl?: string; width?:number; height?:number; srcSet?:string };
const videos: PortfolioMedia[] = [
 { id:'video-frog', src:'/images/video-frog.jpg', videoSrc:'/videos/frog.mp4', alt:'Samurai Frog — татуювання в русі', category:'Samurai Frog · відео', sourceUrl:'https://www.tiktok.com/@tattoo_nagolci/video/7482819910813469957' },
 { id:'video-ouroboros', src:'/images/video-ouroboros.jpg', videoSrc:'/videos/ouroboros.mp4', alt:'Механічний Уроборос на передпліччі', category:'Механічний Уроборос · відео', sourceUrl:'https://www.tiktok.com/@tattoo_nagolci/video/7344401172146474245' },
];
/** Backdrop of the booking section; not editable, but resized at build like the editable photos. */
export const processPhoto = '/images/process.webp';
export const processMedia: PortfolioMedia = { id:'video-process', src:'/images/video-process.jpg', videoSrc:'/videos/process.mp4', alt:'Павло працює над татуюванням', category:'Робочий процес', sourceUrl:'https://www.tiktok.com/@tattoo_nagolci/video/7206109506512686342' };
export const videoTag = 'Відео';

/** Styles a work belongs to: "Графіка й колір" counts for both filters; videos form their own group. */
export function workTags(work: PortfolioMedia): string[] {
 if (work.videoSrc) return [videoTag];
 return [...new Set(work.category.split(/\s+(?:й|і|та)\s+|\s*[·,/]\s*/u).map(tag => tag.trim()).filter(Boolean)
  .map(tag => tag[0].toLocaleUpperCase('uk') + tag.slice(1).toLocaleLowerCase('uk')))];
}

/** A caption that names the piece; the category alone ("Графіка") says nothing about the photo. */
export function workTitle(work: PortfolioMedia): string {
 return work.videoSrc ? work.alt.split(' — ')[0] : work.alt;
}

/** Filters worth offering: styles shared by at least two works, most common first. */
export function galleryFilters(media: PortfolioMedia[]): { tag: string; count: number }[] {
 const counts = new Map<string, number>();
 for (const work of media) for (const tag of workTags(work)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
 const filters = [...counts].filter(([, count]) => count > 1 && count < media.length).map(([tag, count]) => ({ tag, count }));
 return filters.length > 1 ? filters.sort((a, b) => b.count - a.count) : [];
}

export function galleryMedia(works: Work[]): PortfolioMedia[] {
 const media: PortfolioMedia[] = [...works];
 media.splice(Math.min(1, media.length),0,videos[0]);
 media.splice(Math.min(5, media.length),0,videos[1]);
 return media;
}
