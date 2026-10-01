'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Star } from 'lucide-react';
import { reviewsUrl, type Review } from '@/lib/reviews';

function ReviewCard({ review }: { review: Review }) {
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isLong, setIsLong] = useState(false);

  useEffect(() => {
    const quote = quoteRef.current;
    if (!quote || expanded) return;
    const measure = () => setIsLong(quote.scrollHeight > quote.clientHeight + 2);
    const observer = new ResizeObserver(measure);
    observer.observe(quote);
    measure();
    return () => observer.disconnect();
  }, [expanded, review.quote]);

  const quoteId = `review-quote-${review.id}`;
  return <article className="review-card">
    <div className="review-stars" aria-label={`${review.rating} з 5 зірок`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={18} fill={index < review.rating ? 'currentColor' : 'none'} aria-hidden="true" />)}</div>
    <blockquote id={quoteId} ref={quoteRef} className={expanded ? '' : 'review-quote-collapsed'}>{review.quote}</blockquote>
    {isLong && <button className="review-expand" type="button" aria-expanded={expanded} aria-controls={quoteId} onClick={() => setExpanded(value => !value)}>{expanded ? 'Згорнути' : 'Читати повністю'} <span aria-hidden="true">{expanded ? '−' : '+'}</span></button>}
    <div className="review-credit"><p>{review.author}</p>{review.originalLanguage !== 'uk' && <small>Переклад з {review.originalLanguage === 'ru' ? 'російської' : review.originalLanguage === 'en' ? 'англійської' : review.originalLanguage}</small>}<a href={review.url} target="_blank" rel="noreferrer" aria-label={`Відгук ${review.author} у Google`}>Оригінал у Google <ArrowUpRight size={15} /></a></div>
  </article>;
}

export default function Reviews({ reviews }: { reviews: Review[] }) {
  const [viewportRef, carousel] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', slidesToScroll: 1, dragFree: true, duration: 35 });
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    if (!carousel) return;
    const progress = carousel.scrollProgress();
    const start = progress <= 0.001;
    const end = progress >= 0.999 || !carousel.canScrollNext() && !carousel.canScrollPrev();
    setEdge(previous => previous.start === start && previous.end === end ? previous : { start, end });
  }, [carousel]);

  useEffect(() => {
    if (!carousel) return;
    const frame = requestAnimationFrame(measure);
    carousel.on('select', measure);
    carousel.on('scroll', measure);
    carousel.on('reInit', measure);
    return () => {
      cancelAnimationFrame(frame);
      carousel.off('select', measure);
      carousel.off('scroll', measure);
      carousel.off('reInit', measure);
    };
  }, [carousel, measure]);

  function move(direction: number) {
    if (!carousel) return;
    const jump = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (direction < 0) carousel.scrollPrev(jump);
    else carousel.scrollNext(jump);
  }

  if (!reviews.length) return null;

  return <section className="reviews-section" aria-labelledby="reviews-title" id="reviews">
    <div className="reviews-heading wow-shell">
      <div><p className="wow-index">ДОСВІД КЛІЄНТІВ</p><h2 id="reviews-title">ВІДГУКИ<span>.</span></h2></div>
      <a className="wow-action all-reviews" href={reviewsUrl} target="_blank" rel="noreferrer">Усі відгуки в Google <ArrowUpRight size={18} /></a>
    </div>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The carousel viewport needs focus for arrow-key navigation. */}
    <section className="reviews-viewport" data-at-start={edge.start} data-at-end={edge.end} ref={viewportRef} tabIndex={0} aria-roledescription="carousel" aria-label="Відгуки клієнтів, гортайте свайпом або стрілками" onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        move(event.key === 'ArrowRight' ? 1 : -1);
      }
    }}>
      <div className="reviews-track">{reviews.map(review => <ReviewCard review={review} key={review.id} />)}</div>
    </section>
    <button className="wow-gallery-edge wow-gallery-edge-prev review-edge" type="button" aria-label="Попередні відгуки" disabled={edge.start} onClick={() => move(-1)}><ArrowLeft size={34} strokeWidth={1.7} aria-hidden="true" /></button>
    <button className="wow-gallery-edge wow-gallery-edge-next review-edge" type="button" aria-label="Наступні відгуки" disabled={edge.end} onClick={() => move(1)}><ArrowRight size={34} strokeWidth={1.7} aria-hidden="true" /></button>
  </section>;
}
