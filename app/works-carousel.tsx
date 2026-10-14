'use client';
/* eslint-disable next/no-img-element -- Work images are editable local media URLs in the Vinext preview. */

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { galleryFilters, workTitle, type PortfolioMedia } from '@/lib/portfolio-media';
import WorkPreview from './work-preview';
import { momentumStep, releaseVelocity } from './gallery-physics';
import { horizontalWheelDelta } from './carousel-input';

type Drag = { pointerId: number; startX: number; startScroll: number; lastX: number; lastTime: number; velocity: number; moved: boolean };
const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Desktop: a horizontal strip the visitor drives (drag with momentum, wheel, arrows) — nothing moves on its own,
 * so a work never slides away while someone is looking at it. Phones: a two-column grid with every work visible.
 */
export default function WorksGallery({ works, allWorks, total, filter, onFilterChange, onOpen, active }: { works: PortfolioMedia[]; allWorks: PortfolioMedia[]; total: number; filter: string | null; onFilterChange: (filter: string | null) => void; onOpen: (index: number) => void; active: number | null }) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const ignoreClickRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const [position, setPosition] = useState({ first: 1, progress: 0, start: true, end: false });
  const filters = galleryFilters(allWorks);

  const stopAnimation = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const max = viewport.scrollWidth - viewport.clientWidth;
      const box = viewport.getBoundingClientRect();
      const items = [...viewport.querySelectorAll<HTMLElement>('.wow-work')];
      const firstVisible = items.findIndex(item => item.getBoundingClientRect().right > box.left + 40);
      const next = { first: Math.max(1, firstVisible + 1), progress: max > 0 ? viewport.scrollLeft / max : 1, start: viewport.scrollLeft <= 2, end: viewport.scrollLeft >= max - 2 };
      setPosition(current => current.first === next.first && Math.abs(current.progress - next.progress) < .002 && current.start === next.start && current.end === next.end ? current : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || matchMedia('(max-width:760px)').matches) return;
      const delta = horizontalWheelDelta(event.deltaX, event.deltaY, event.shiftKey, event.deltaMode, viewport.clientWidth);
      if (delta === null) return;
      const max = viewport.scrollWidth - viewport.clientWidth;
      if ((delta < 0 && viewport.scrollLeft <= 0) || (delta > 0 && viewport.scrollLeft >= max)) return;
      event.preventDefault();
      stopAnimation();
      viewport.scrollLeft += delta;
    };
    viewport.scrollLeft = 0;
    viewport.addEventListener('scroll', schedule, { passive: true });
    viewport.addEventListener('wheel', wheel, { passive: false });
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    measure();
    return () => {
      viewport.removeEventListener('scroll', schedule);
      viewport.removeEventListener('wheel', wheel);
      observer.disconnect();
      cancelAnimationFrame(frame);
      stopAnimation();
    };
  }, [works]);

  // Works develop from grey as the section scrolls into view: the motion is a response to the visitor.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Observe the unclipped list item; the clipped button itself has no visible area to intersect.
    const items = [...section.querySelectorAll<HTMLElement>('.wow-gallery-item')];
    // Phones get a static grid: a reveal there risked empty tiles after a fast fling.
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce), (max-width:760px)').matches) { items.forEach(item => item.classList.add('is-revealed')); return; }
    // Works already on screen at load stay put; the clip only applies once JS runs, so the static HTML shows everything.
    const fold = window.innerHeight;
    items.forEach(item => { if (item.getBoundingClientRect().top < fold) item.classList.add('is-revealed'); });
    section.classList.add('is-animated');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
    }, { rootMargin: '0px 0px -10% 0px', threshold: .1 });
    items.forEach((item, index) => { item.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`); observer.observe(item); });
    return () => observer.disconnect();
  }, [works]);

  const glide = (distance: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    stopAnimation();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { viewport.scrollLeft += distance; return; }
    const start = viewport.scrollLeft;
    const started = performance.now();
    const animate = (time: number) => {
      const progress = Math.min((time - started) / 650, 1);
      viewport.scrollLeft = start + distance * (1 - Math.pow(1 - progress, 3));
      frameRef.current = progress < 1 ? requestAnimationFrame(animate) : null;
    };
    frameRef.current = requestAnimationFrame(animate);
  };
  const move = (direction: number) => { const viewport = viewportRef.current; if (viewport) glide(direction * viewport.clientWidth * .7); };

  const startInertia = (initialVelocity: number) => {
    const viewport = viewportRef.current;
    if (!viewport || !initialVelocity) return;
    let velocity = initialVelocity;
    let position = viewport.scrollLeft;
    let last = performance.now();
    const animate = (time: number) => {
      const step = momentumStep(velocity, Math.min(time - last, 48));
      last = time;
      position += step.distance;
      viewport.scrollLeft = position;
      velocity = step.velocity;
      const max = viewport.scrollWidth - viewport.clientWidth;
      frameRef.current = velocity && position > 0 && position < max ? requestAnimationFrame(animate) : null;
    };
    frameRef.current = requestAnimationFrame(animate);
  };

  return <section className="wow-works" id="works" aria-labelledby="works-title" ref={sectionRef}>
    <div className="wow-works-head wow-shell">
      <div><p className="wow-index">ПОРТФОЛІО</p><h2 id="works-title">РОБОТИ<span>.</span></h2></div>
      <div className="wow-works-tools">
        {filters.length > 0 && <fieldset className="wow-filters"><legend className="sr-only">Фільтр робіт за стилем</legend>
          <button type="button" aria-pressed={filter === null} onClick={() => onFilterChange(null)}>Усі <small>{total}</small></button>
          {filters.map(({ tag, count }) => <button type="button" key={tag} aria-pressed={filter === tag} onClick={() => onFilterChange(filter === tag ? null : tag)}>{tag} <small>{count}</small></button>)}
        </fieldset>}
        <div className="wow-works-nav" aria-hidden={works.length < 2}>
          <span className="wow-works-count" aria-hidden="true">{pad(Math.min(position.first, works.length))} <i>/</i> {pad(works.length)}</span>
          <span className="wow-works-progress" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(.04, position.progress)})` }} /></span>
          <button className="wow-icon-button" type="button" aria-label="Попередні роботи" disabled={position.start} onClick={() => move(-1)}><ArrowLeft size={22} strokeWidth={1.6} aria-hidden="true" /></button>
          <button className="wow-icon-button" type="button" aria-label="Наступні роботи" disabled={position.end} onClick={() => move(1)}><ArrowRight size={22} strokeWidth={1.6} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The strip is keyboard-scrollable and contains focusable photo buttons. */}
    <section className="wow-gallery-viewport" ref={viewportRef} tabIndex={0} aria-label={`Роботи Павла${filter ? `: ${filter.toLowerCase()}` : ''}, ${works.length}`} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
    }} onMouseDown={event => {
      // Mouse drags must not focus the strip: focus would draw the keyboard outline. Tab still reaches it.
      if (event.button === 0 && !matchMedia('(max-width:760px)').matches) event.preventDefault();
    }} onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0 || event.pointerType !== 'mouse' || matchMedia('(max-width:760px)').matches) return;
      stopAnimation();
      dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startScroll: event.currentTarget.scrollLeft, lastX: event.clientX, lastTime: event.timeStamp, velocity: 0, moved: false };
    }} onPointerMove={event => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const delta = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(delta) < 6) return;
      if (!drag.moved) { drag.moved = true; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('is-dragging'); }
      const elapsed = event.timeStamp - drag.lastTime;
      if (elapsed > 0) drag.velocity = Math.max(-2.4, Math.min(2.4, drag.velocity * .35 - (event.clientX - drag.lastX) / elapsed * .65));
      drag.lastX = event.clientX;
      drag.lastTime = event.timeStamp;
      event.currentTarget.scrollLeft = drag.startScroll - delta;
    }} onPointerUp={event => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      event.currentTarget.classList.remove('is-dragging');
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (!drag.moved) return;
      ignoreClickRef.current = true;
      window.setTimeout(() => { ignoreClickRef.current = false; }, 0);
      startInertia(releaseVelocity(drag.velocity, event.timeStamp - drag.lastTime, matchMedia('(prefers-reduced-motion: reduce)').matches));
    }} onPointerCancel={event => {
      dragRef.current = null;
      event.currentTarget.classList.remove('is-dragging');
    }} onClickCapture={event => {
      if (!ignoreClickRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      ignoreClickRef.current = false;
    }}>
      <ul className="wow-gallery" key={filter ?? 'all'}>
        {works.map((work, index) => <li key={work.id} className="wow-gallery-item">
          <button className={`wow-work${active === index ? ' is-open' : ''}${work.videoSrc ? ' is-video' : ''}`} type="button" onClick={() => onOpen(index)} aria-label={`Відкрити ${work.videoSrc ? 'відео' : 'фото'}: ${workTitle(work)}`} onDragStart={event => event.preventDefault()}>
            <WorkPreview work={work} eager={index < 3} disabled={active !== null} />
            <span className="wow-work-caption"><span><strong>{workTitle(work)}</strong><small>{work.videoSrc ? 'Відео' : work.category}</small></span><ArrowUpRight size={20} aria-hidden="true" /></span>
          </button>
        </li>)}
      </ul>
    </section>
  </section>;
}
