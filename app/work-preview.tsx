'use client';
/* eslint-disable next/no-img-element -- Local portfolio assets. */
import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { workTitle, type PortfolioMedia } from '@/lib/portfolio-media';

/**
 * Gallery images are always lazy: React turns non-lazy <img> into <link rel=preload>, which Cloudflare
 * then sends as Early Hints ahead of the hero. Video previews stay unrequested until the card is near and
 * a mouse can hover it.
 */
export default function WorkPreview({ work, disabled }: { work: PortfolioMedia; disabled: boolean }) {
 const frame = useRef<HTMLSpanElement>(null);
 const video = useRef<HTMLVideoElement>(null);
 const [playing,setPlaying] = useState(false);
 const [near,setNear] = useState(false);
 useEffect(() => { if(disabled) video.current?.pause(); },[disabled]);
 useEffect(() => {
  const element = frame.current;
  if(!element || !work.videoSrc) return;
  const canHover = matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches;
  const observer = new IntersectionObserver(([entry]) => {
   if(entry.isIntersecting && canHover) setNear(true);
   if(!entry.isIntersecting) video.current?.pause();
  },{rootMargin:'200px'});
  const visibility = () => { if(document.hidden) video.current?.pause(); };
  observer.observe(element);
  document.addEventListener('visibilitychange',visibility);
  return () => { observer.disconnect(); document.removeEventListener('visibilitychange',visibility); };
 },[work.videoSrc]);
 const stop = () => { video.current?.pause(); setPlaying(false); };
 return <span className="wow-work-image" ref={frame} onPointerEnter={event => {
  if(!work.videoSrc || disabled || event.pointerType!=='mouse' || !matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  void video.current?.play().catch(()=>setPlaying(false));
 }} onPointerLeave={stop}>
  <img src={work.src} srcSet={work.srcSet} sizes={work.srcSet ? '(max-width:760px) 48vw, (max-width:1100px) 60vw, 34vw' : undefined} alt={work.videoSrc ? `${workTitle(work)} — відео татуювання` : `${workTitle(work)} — тату, ${work.category.toLocaleLowerCase('uk')}`} loading="lazy" decoding="async" draggable={false} width={work.width ?? 800} height={work.height ?? 1000} style={work.width && work.height ? {aspectRatio:`${work.width} / ${work.height}`} : undefined} />
  {work.videoSrc && <>{near && <video ref={video} className={`wow-work-preview${playing && !disabled?' is-playing':''}`} src={work.videoSrc} preload="metadata" muted loop playsInline aria-hidden="true" tabIndex={-1} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={stop}/>}<span className="wow-video-badge" aria-hidden="true"><Play size={14} fill="currentColor"/><span>Відео</span></span></>}
 </span>;
}
