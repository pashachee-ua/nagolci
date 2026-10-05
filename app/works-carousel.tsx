'use client';
/* eslint-disable next/no-img-element -- Work images are editable local media URLs in the Vinext preview. */

import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react';
import type { PortfolioMedia } from '@/lib/portfolio-media';
import WorkPreview from './work-preview';
import { momentumStep, releaseVelocity } from './gallery-physics';

type Drag = { pointerId: number; startX: number; startY: number; startScroll: number; lastX: number; lastTime: number; velocity: number; moved: boolean; position: number; target: number };
const wrap = (position: number, width: number) => ((position % width) + width) % width;

export default function WorksCarousel({ works, onOpen, active, motionPaused, onMotionPausedChange }: { works: PortfolioMedia[]; onOpen: (index: number) => void; active: number | null; motionPaused: boolean; onMotionPausedChange: (paused: boolean) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const ignoreClickRef = useRef(false);
  const loopWidthRef = useRef(0);
  const controlFrameRef = useRef<number | null>(null);
  const inertiaFrameRef = useRef<number | null>(null);
  const dragFrameRef = useRef<number | null>(null);

  const stopDragAnimation = () => {
    if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = null;
  };

  const startDragAnimation = () => {
    let previous = performance.now();
    const animate = (time: number) => {
      const drag = dragRef.current;
      const viewport = viewportRef.current;
      const width = loopWidthRef.current;
      if (!drag || !viewport || !width) { dragFrameRef.current = null; return; }
      const elapsed = Math.min(time - previous, 48);
      previous = time;
      const follow = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1 - Math.exp(-elapsed / 35);
      drag.position += (drag.target - drag.position) * follow;
      viewport.scrollLeft = wrap(drag.position, width);
      dragFrameRef.current = requestAnimationFrame(animate);
    };
    dragFrameRef.current = requestAnimationFrame(animate);
  };

  const stopInertia = () => {
    if (inertiaFrameRef.current !== null) cancelAnimationFrame(inertiaFrameRef.current);
    inertiaFrameRef.current = null;
  };

  const startInertia = (initialVelocity: number, remainingDistance = 0) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (!initialVelocity && Math.abs(remainingDistance) < 0.1) return;
    let velocity = initialVelocity;
    let position = viewport.scrollLeft;
    let remaining = remainingDistance;
    let lastTime = performance.now();
    const animate = (time: number) => {
      const width = loopWidthRef.current;
      if (!width) { inertiaFrameRef.current = null; return; }
      const elapsed = Math.min(time - lastTime, 48);
      const step = momentumStep(velocity, elapsed);
      const nextRemaining = remaining * Math.exp(-elapsed / 55);
      lastTime = time;
      // Accumulate fractional movement internally so native scroll rounding
      // doesn't cut the slow tail of the release animation short.
      position += step.distance + remaining - nextRemaining;
      remaining = nextRemaining;
      viewport.scrollLeft = wrap(position, width);
      velocity = step.velocity;
      inertiaFrameRef.current = velocity || Math.abs(remaining) > 0.1 ? requestAnimationFrame(animate) : null;
    };
    inertiaFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstGroup = viewport?.querySelector('.wow-gallery-group');
    if (!viewport || !firstGroup || !works.length) return;

    const desktop = matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastTime = 0;
    let subpixelDistance = 0;
    let touching = false;
    let resumeAt = 0;
    let autoScrollPosition: number | null = null;
    const nativeScroll = matchMedia('(max-width:760px), (pointer:coarse)');
    const pauseTouch = () => {
      if (!nativeScroll.matches) return;
      touching = true;
      autoScrollPosition = null;
    };
    const releaseTouch = () => {
      touching = false;
      resumeAt = performance.now() + 2000;
    };
    const pauseNativeScroll = () => {
      if (nativeScroll.matches && (autoScrollPosition === null || Math.abs(viewport.scrollLeft - autoScrollPosition) > 1)) {
        resumeAt = performance.now() + 2000;
      }
    };
    const measure = () => {
      const width = firstGroup.getBoundingClientRect().width;
      if (!width) return;
      const previous = loopWidthRef.current;
      if (previous && previous !== width) viewport.scrollLeft *= width / previous;
      loopWidthRef.current = width;
    };
    const normalize = () => {
      const width = loopWidthRef.current;
      if (desktop.matches && width && viewport.scrollLeft >= width) viewport.scrollLeft -= width;
    };
    const advance = (time: number) => {
      const elapsed = lastTime ? Math.min(time - lastTime, 64) : 0;
      lastTime = time;
      const width = loopWidthRef.current;
      const inputReady = nativeScroll.matches
        ? !touching && time >= resumeAt
        : desktop.matches && !viewport.matches(':hover') && !sectionRef.current?.querySelector('.wow-gallery-edge:hover, :focus-visible');
      if (width && !motionPaused && inputReady && !reducedMotion.matches && active === null && !dragRef.current && controlFrameRef.current === null && inertiaFrameRef.current === null && document.visibilityState === 'visible') {
        subpixelDistance += elapsed * 0.022;
        const pixels = Math.floor(subpixelDistance);
        if (pixels) {
          subpixelDistance -= pixels;
          viewport.scrollLeft = Math.floor(wrap(Math.round(viewport.scrollLeft) + pixels, width));
          autoScrollPosition = viewport.scrollLeft;
        }
      }
      frame = requestAnimationFrame(advance);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(firstGroup);
    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !frame) {
        lastTime = 0;
        frame = requestAnimationFrame(advance);
      } else if (!entry.isIntersecting && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    visibility.observe(viewport);
    viewport.addEventListener('scroll', normalize, { passive: true });
    viewport.addEventListener('scroll', pauseNativeScroll, { passive: true });
    viewport.addEventListener('pointerdown', pauseTouch, { passive: true });
    window.addEventListener('pointerup', releaseTouch, { passive: true });
    window.addEventListener('pointercancel', releaseTouch, { passive: true });
    measure();
    return () => {
      observer.disconnect();
      visibility.disconnect();
      viewport.removeEventListener('scroll', normalize);
      viewport.removeEventListener('scroll', pauseNativeScroll);
      viewport.removeEventListener('pointerdown', pauseTouch);
      window.removeEventListener('pointerup', releaseTouch);
      window.removeEventListener('pointercancel', releaseTouch);
      cancelAnimationFrame(frame);
      if (controlFrameRef.current !== null) cancelAnimationFrame(controlFrameRef.current);
      controlFrameRef.current = null;
      if (inertiaFrameRef.current !== null) cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
      if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
      dragRef.current = null;
    };
  }, [works, active, motionPaused]);

  const move = (direction: number) => {
    const viewport = viewportRef.current;
    const width = loopWidthRef.current;
    if (!viewport || !width) return;
    stopInertia();
    if (controlFrameRef.current !== null) cancelAnimationFrame(controlFrameRef.current);
    const start = viewport.scrollLeft;
    const distance = direction * viewport.clientWidth * 0.75;
    if (matchMedia('(max-width:760px), (pointer:coarse)').matches) {
      viewport.scrollBy({ left: distance, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' });
      controlFrameRef.current = null;
      return;
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      viewport.scrollLeft = wrap(start + distance, width);
      controlFrameRef.current = null;
      return;
    }
    const started = performance.now();
    const animate = (time: number) => {
      const progress = Math.min((time - started) / 650, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      viewport.scrollLeft = wrap(start + distance * eased, width);
      controlFrameRef.current = progress < 1 ? requestAnimationFrame(animate) : null;
    };
    controlFrameRef.current = requestAnimationFrame(animate);
  };

  return <section className="wow-works" id="works" aria-labelledby="works-title" ref={sectionRef}>
    <div className="wow-section-head wow-shell">
      <div><p className="wow-index">ПОРТФОЛІО</p><h2 id="works-title">РОБОТИ<span>.</span></h2></div>
      <div className="wow-works-side">
        <button className="wow-action wow-motion-toggle" type="button" aria-pressed={motionPaused} aria-label={motionPaused ? 'Увімкнути рух' : 'Зупинити рух'} title={motionPaused ? 'Увімкнути рух' : 'Зупинити рух'} onClick={() => onMotionPausedChange(!motionPaused)}>{motionPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}<span className="sr-only">{motionPaused ? 'Увімкнути рух' : 'Зупинити рух'}</span></button>
      </div>
    </div>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The viewport is keyboard-scrollable and contains focusable photo buttons. */}
    <section className="wow-gallery-viewport" ref={viewportRef} tabIndex={0} aria-roledescription="carousel" aria-label="Роботи Павла, гортайте горизонтально" onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }} onMouseDown={event => { if (!matchMedia('(max-width:760px), (pointer:coarse)').matches) event.preventDefault(); }} onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0 || event.pointerType !== 'mouse' || matchMedia('(max-width:760px), (pointer:coarse)').matches) return;
      // Focus the carousel without asking the browser to reveal a whole photo.
      if (event.pointerType === 'mouse') event.currentTarget.focus({ preventScroll: true });
      stopInertia();
      stopDragAnimation();
      if (controlFrameRef.current !== null) cancelAnimationFrame(controlFrameRef.current);
      controlFrameRef.current = null;
      dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startScroll: event.currentTarget.scrollLeft, lastX: event.clientX, lastTime: event.timeStamp, velocity: 0, moved: false, position: event.currentTarget.scrollLeft, target: event.currentTarget.scrollLeft };
    }} onPointerMove={event => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const delta = event.clientX - drag.startX;
      if (!drag.moved && (Math.abs(delta) < 6 || (event.pointerType === 'touch' && Math.abs(delta) <= Math.abs(event.clientY - drag.startY) * 1.2))) return;
      if (!drag.moved) {
        drag.moved = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.classList.add('is-dragging');
        startDragAnimation();
      }
      event.preventDefault();
      const elapsed = event.timeStamp - drag.lastTime;
      if (elapsed > 0) {
        const instantaneous = -(event.clientX - drag.lastX) / elapsed;
        drag.velocity = Math.max(-2.4, Math.min(2.4, drag.velocity * 0.35 + instantaneous * 0.65));
      }
      drag.lastX = event.clientX;
      drag.lastTime = event.timeStamp;
      drag.target = drag.startScroll - delta;
    }} onPointerUp={event => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      stopDragAnimation();
      event.currentTarget.classList.remove('is-dragging');
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (drag.moved) {
        ignoreClickRef.current = true;
        window.setTimeout(() => { ignoreClickRef.current = false; }, 0);
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion && loopWidthRef.current) event.currentTarget.scrollLeft = wrap(drag.target, loopWidthRef.current);
        startInertia(releaseVelocity(drag.velocity, event.timeStamp - drag.lastTime, reducedMotion), reducedMotion ? 0 : drag.target - drag.position);
      }
    }} onPointerCancel={event => {
      dragRef.current = null;
      stopDragAnimation();
      event.currentTarget.classList.remove('is-dragging');
    }} onClickCapture={event => {
      if (!ignoreClickRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      ignoreClickRef.current = false;
    }}>
      <div className="wow-gallery">{[0, 1].map(copy => <div className="wow-gallery-group" key={copy} aria-hidden={copy === 1 ? 'true' : undefined}>
        {works.map((work, index) => <button className={`wow-work${active === index ? ' is-open' : ''}`} key={work.id} type="button" tabIndex={copy === 1 ? -1 : undefined} onClick={() => onOpen(index)} aria-label={`Відкрити ${work.videoSrc ? 'відео' : 'фото'}: ${work.alt}`} onDragStart={event => event.preventDefault()}>
          <WorkPreview work={work} eager={copy === 0 && index < 3} disabled={active !== null} duplicate={copy === 1} />
          <span className="wow-work-caption"><span>{work.category}</span><ArrowUpRight size={22} aria-hidden="true" /></span>
        </button>)}
      </div>)}</div>
    </section>
    <button className="wow-gallery-edge wow-gallery-edge-prev" type="button" aria-label="Попередні роботи" onClick={() => move(-1)}><ArrowLeft size={34} strokeWidth={1.7} aria-hidden="true" /></button>
    <button className="wow-gallery-edge wow-gallery-edge-next" type="button" aria-label="Наступні роботи" onClick={() => move(1)}><ArrowRight size={34} strokeWidth={1.7} aria-hidden="true" /></button>
  </section>;
}
