import type { Work } from './content.ts';
export type PortfolioMedia = Work & { videoSrc?: string; sourceUrl?: string };
const videos: PortfolioMedia[] = [
 { id:'video-frog', src:'/images/video-frog.jpg', videoSrc:'/videos/frog.mp4', alt:'Samurai Frog — татуювання в русі', category:'Samurai Frog · відео', sourceUrl:'https://www.tiktok.com/@tattoo_nagolci/video/7482819910813469957' },
 { id:'video-ouroboros', src:'/images/video-ouroboros.jpg', videoSrc:'/videos/ouroboros.mp4', alt:'Механічний Уроборос на передпліччі', category:'Механічний Уроборос · відео', sourceUrl:'https://www.tiktok.com/@tattoo_nagolci/video/7344401172146474245' },
];
export const processMedia: PortfolioMedia = { id:'video-process', src:'/images/video-process.jpg', videoSrc:'/videos/process.mp4', alt:'Павло працює над татуюванням', category:'Робочий процес', sourceUrl:'https://www.tiktok.com/@tattoo_nagolci/video/7206109506512686342' };
export function galleryMedia(works: Work[]): PortfolioMedia[] {
 const media: PortfolioMedia[] = [...works];
 media.splice(Math.min(1, media.length),0,videos[0]);
 media.splice(Math.min(5, media.length),0,videos[1]);
 return media;
}
