'use client';
/* eslint-disable next/no-img-element -- Local portfolio assets. */
import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { PortfolioMedia } from '@/lib/portfolio-media';
export default function WorkPreview({ work, eager, disabled, duplicate }: { work: PortfolioMedia; eager: boolean; disabled: boolean; duplicate: boolean }) {
 const video = useRef<HTMLVideoElement>(null);
 const [playing,setPlaying] = useState(false);
 useEffect(() => { if(disabled) { video.current?.pause(); } },[disabled]);
 useEffect(() => {
  const element = video.current;
  if(!element) return;
  const observer = new IntersectionObserver(([entry]) => { if(!entry.isIntersecting) element.pause(); });
  const visibility = () => { if(document.hidden) element.pause(); };
  observer.observe(element);
  document.addEventListener('visibilitychange',visibility);
  return () => { observer.disconnect(); document.removeEventListener('visibilitychange',visibility); };
 },[]);
 const stop = () => { video.current?.pause(); setPlaying(false); };
 return <span className="wow-work-image" onPointerEnter={event => {
  if(!work.videoSrc || disabled || event.pointerType!=='mouse' || !matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  void video.current?.play().catch(()=>setPlaying(false));
 }} onPointerLeave={stop}>
  <img src={work.src} alt={duplicate?'':work.alt} loading={eager?'eager':'lazy'} decoding="async" draggable={false} width="800" height="1000" />
  {work.videoSrc && <><video ref={video} className={`wow-work-preview${playing && !disabled?' is-playing':''}`} src={work.videoSrc} preload="none" muted loop playsInline aria-hidden="true" tabIndex={-1} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={stop}/><span className="wow-video-badge" aria-hidden="true"><Play size={18} fill="currentColor"/><span>Відео</span></span></>}
 </span>;
}
