'use client';
/* eslint-disable next/no-img-element -- Editable studio media; preserve full image proportions. */
import { useRef } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { Work } from '@/lib/content';
import { swipeDirection } from './carousel-input';

type Props = { works: Work[]; active: number | null; onActiveChange: (index: number | null) => void };
export default function WorkLightbox({ works, active, onActiveChange }: Props) {
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const pointers = useRef(new Set<number>());
  const work = active === null ? undefined : works[active];
  const move = (direction: number) => {
    if (active === null || !works.length) return;
    onActiveChange((active + direction + works.length) % works.length);
  };
  const clear = () => { gesture.current = null; pointers.current.clear(); };
  return <Dialog open={!!work} onOpenChange={open => { if (!open) { clear(); onActiveChange(null); } }}>
    <DialogContent className="lightbox wow-lightbox" showCloseButton={false} onKeyDown={event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
    }}>
      <div className="lightbox-top"><DialogTitle className="sr-only">{work?.alt}</DialogTitle><DialogClose className="lightbox-close" aria-label="Закрити фото"><X aria-hidden="true" /></DialogClose></div>
      <DialogDescription className="sr-only">Фото роботи. Стрілки або горизонтальний свайп перемикають зображення. Escape закриває перегляд.</DialogDescription>
      {work && <>
        <figure className="wow-lightbox-figure" onPointerDown={event => {
          if (event.pointerType === 'mouse') return;
          pointers.current.add(event.pointerId);
          if (pointers.current.size !== 1) { gesture.current = null; return; }
          gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }} onPointerUp={event => {
          const start = gesture.current;
          pointers.current.delete(event.pointerId);
          gesture.current = null;
          if (start?.id === event.pointerId) {
            const direction = swipeDirection(event.clientX - start.x, event.clientY - start.y);
            if (direction) move(direction);
          }
        }} onPointerCancel={clear}>
          <img className="full-work" src={work.src} alt={work.alt} draggable={false} />
          <figcaption>{work.category}</figcaption>
        </figure>
        {works.length > 1 && <>
          <button className="wow-gallery-edge wow-gallery-edge-prev lightbox-edge" type="button" aria-label="Попередня робота" onClick={() => move(-1)}><ArrowLeft size={34} strokeWidth={1.7} aria-hidden="true" /></button>
          <button className="wow-gallery-edge wow-gallery-edge-next lightbox-edge" type="button" aria-label="Наступна робота" onClick={() => move(1)}><ArrowRight size={34} strokeWidth={1.7} aria-hidden="true" /></button>
        </>}
      </>}
    </DialogContent>
  </Dialog>;
}
