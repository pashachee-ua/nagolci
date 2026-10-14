'use client';
/* eslint-disable next/no-img-element -- Studio images also come from editable local media URLs; keep direct loading in the Vinext preview. */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Clock, Play } from 'lucide-react';
import type { SiteContent } from '@/lib/content';
import Reviews from './reviews';
import { galleryMedia, processMedia, workTags, type ImageDimensions, type PortfolioMedia } from '@/lib/portfolio-media';
import { bookingLink, telegramHandle, workDraft } from '@/lib/booking';
import TelegramIcon from '../telegram-icon';
import TickerStar from '../ticker-star';
import { MailFilledIcon, PhoneFilledIcon, MapPinFilledIcon } from '../contact-icons';
import WorksGallery from './works-carousel';
import SiteHeader from './site-header';
import WorkLightbox from './work-lightbox';
import BookingAction from './booking-action';
import { formatIntro, keepWordsTogether } from '@/lib/typography';

function BrandText({ text }: { text: string }) {
  return <>{keepWordsTogether(text).split(/(NA\s+GOLCI)/g).map((part, index) =>
    /^NA\s+GOLCI$/.test(part) ? <span className="brand-name" key={index}>NA GOLCI</span> : keepWordsTogether(part)
  )}</>;
}

function SocialLink({ href, label, platform }: { href: string; label: string; platform: 'instagram' | 'tiktok' }) {
  return <a className="wow-action wow-secondary wow-social" href={href} target="_blank" rel="noreferrer">
    <span className={`wow-social-icon wow-social-icon-${platform}`} aria-hidden="true" />
    <span>{label}</span>
    <ArrowUpRight size={17} aria-hidden="true" />
  </a>;
}

function displayPhone(phone: string) {
  return /^\+380\d{9}$/.test(phone) ? phone.replace(/^(\+380)(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5') : phone;
}

const tickerUnit = ['ГРАФІКА', 'КОЛІР', 'ІЛЮСТРАЦІЯ', 'ПОНАД 10 РОКІВ', 'ПОДІЛ, КИЇВ'];

/** Moves only while the page scrolls, so it reads as a response to the visitor rather than ambient motion. */
function Ticker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLSpanElement>(null);
  const [copies, setCopies] = useState(4);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const unit = unitRef.current;
    if (!container || !unit) return;
    let active = true;
    const update = () => {
      if (!active) return;
      const unitWidth = unit.getBoundingClientRect().width;
      if (!unitWidth) return;
      const next = Math.max(2, Math.ceil(container.getBoundingClientRect().width / unitWidth) + 1);
      setCopies(current => current === next ? current : next);
    };
    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(unit);
    update();
    void document.fonts.ready.then(update);
    return () => { active = false; observer.disconnect(); };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const unit = unitRef.current;
    if (!track || !unit) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const render = () => {
      frame = 0;
      const width = unit.getBoundingClientRect().width;
      const offset = reducedMotion.matches || !width ? 0 : (window.scrollY * 0.45) % width;
      track.style.transform = `translate3d(${-offset}px,0,0)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
    window.addEventListener('scroll', schedule, { passive: true });
    reducedMotion.addEventListener('change', schedule);
    render();
    return () => {
      window.removeEventListener('scroll', schedule);
      reducedMotion.removeEventListener('change', schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="wow-ticker" aria-hidden="true" ref={containerRef}>
    <div className="wow-ticker-track" ref={trackRef}>
      {Array.from({ length: copies }, (_, index) =>
        <span className="wow-ticker-unit" ref={index === 0 ? unitRef : undefined} key={index}>{tickerUnit.map(word => <span key={word}>{word}<i><TickerStar /></i></span>)}</span>
      )}
    </div>
  </div>;
}

export default function Portfolio({ content: c, year = new Date().getFullYear(), imageDimensions }: { content: SiteContent; year?: number; imageDimensions?:ImageDimensions }) {
  const [active, setActive] = useState<number | null>(null);
  const [processOpen, setProcessOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const works = useMemo(() => galleryMedia(c.works).map(work=>({...work,...imageDimensions?.[work.src]})), [c.works,imageDimensions]);
  const shownWorks = useMemo(() => filter ? works.filter(work => workTags(work).includes(filter)) : works, [works, filter]);
  const heroWork = c.works.find(work => work.id === '25') ?? c.works[0];
  const booking = bookingLink(c);
  const handle = telegramHandle(c.telegram);
  const workBooking = (work: PortfolioMedia) => bookingLink(c, workDraft(work.alt));
  const biographyParagraphs = c.biography.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean);
  const changeFilter = (next: string | null) => { setActive(null); setFilter(next); };

  return <>
    <a className="skip-link" href="#works">До робіт</a>
    <SiteHeader booking={booking} />

    <main>
      <section className="wow-hero" aria-labelledby="hero-title">
        <div className="wow-hero-visual" aria-hidden="true">{heroWork && <img src={heroWork.src} alt="" width="800" height="1000" fetchPriority="high" />}</div>
        <div className="wow-hero-inner">
          <div className="wow-hero-kicker"><span>NA GOLCI · КИЇВ</span><span>Тату-студія · Поділ</span></div>
          <h1 id="hero-title">ТАТУ <span>З</span><br />ХАРАКТЕРОМ<span className="wow-title-stop">.</span></h1>
          <div className="wow-hero-bottom">
            <p>{formatIntro(c.intro)}</p>
            <div className="wow-hero-actions">
              <BookingAction link={booking} />
              <a href="#works" className="wow-action wow-secondary"><span>Дивитися роботи</span><ArrowDown size={18} aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </section>

      <Ticker />

      <WorksGallery works={shownWorks} total={works.length} allWorks={works} filter={filter} onFilterChange={changeFilter} onOpen={setActive} active={active} />

      <section className="wow-artist" id="artist" aria-labelledby="artist-title"><div className="wow-shell wow-artist-layout">
        <div className="wow-artist-media"><img className="wow-portrait" src={c.portrait} alt="Павло, тату-майстер NA GOLCI" loading="lazy" width="1064" height="1331" /></div>
        <div className="wow-artist-copy"><p className="wow-index">МАЙСТЕР</p><h2 id="artist-title">ПРИВІТ,<br />Я <em>{c.name.toUpperCase()}</em><span>.</span></h2><div className="wow-bio">{biographyParagraphs.map((paragraph, index) => <p key={index}><BrandText text={paragraph} /></p>)}</div><div className="wow-artist-actions"><BookingAction link={booking} /><SocialLink href="https://www.instagram.com/anohin_pavlo/" label="Мій Instagram" platform="instagram" /></div></div>
      </div></section>

      <section className="wow-booking" id="price" aria-labelledby="price-title">
        <div className="wow-booking-content">
          <figure className="wow-process-photo"><img src="/images/process.webp" alt="Павло працює над татуюванням у студії" loading="lazy" width="945" height="1280" /></figure>
          <button type="button" className="wow-action wow-secondary wow-process-video-button" onClick={() => setProcessOpen(true)}><Play size={16} fill="currentColor" aria-hidden="true" /><span>Дивитися процес</span></button>
          <div className="wow-booking-head"><p className="wow-index">ПОЧНЕМО?</p><h2 id="price-title">ТВОЯ ІДЕЯ.<br /><span>МОЯ РОБОТА.</span></h2></div>
          <div className="wow-booking-details"><h3>Запис і вартість</h3><p>{keepWordsTogether(c.price)}</p><ol className="wow-steps"><li><div><h4>Твоя ідея</h4><p>{keepWordsTogether('Розкажи, що хочеш набити. Можеш додати фото, які тобі подобаються.')}</p></div><ArrowDown className="wow-step-arrow" size={22} strokeWidth={1.5} aria-hidden="true" /></li><li><div><h4>Розмір і місце</h4><p>{keepWordsTogether('Напиши, де буде тату і якого приблизно розміру.')}</p></div><ArrowDown className="wow-step-arrow" size={22} strokeWidth={1.5} aria-hidden="true" /></li><li><div><h4>Ескіз і дата</h4><p>{keepWordsTogether('Обговоримо ескіз і ціну, а потім разом оберемо дату сеансу.')}</p></div></li></ol>
            <BookingAction link={booking} label={booking.channel === 'telegram' ? 'Написати в Telegram' : 'Хочу тату'} className="wow-booking-cta" />
            {booking.channel === 'telegram' && <p className="wow-booking-note">{keepWordsTogether('Відкриється чат зі шаблоном: залишиться дописати ідею, місце й розмір.')}</p>}
          </div>
        </div>
      </section>

      <div className="wow-reviews"><Reviews reviews={c.reviews} /></div>

      <section className="wow-contact" id="contact" aria-labelledby="contact-title"><div className="wow-shell wow-contact-layout"><div className="wow-contact-photo"><img src={c.studio} alt="Інтер’єр студії NA GOLCI" loading="lazy" width="1200" height="900" /></div><div className="wow-contact-copy">
        <p className="wow-index">ЗАХОДЬ У ГОСТІ</p><h2 id="contact-title">ЧЕКАЮ ТЕБЕ<br /><span>НА ПОДОЛІ.</span></h2>
        <BookingAction link={booking} label={booking.channel === 'telegram' ? 'Написати в Telegram' : 'Хочу тату'} className="wow-contact-primary" />
        {(c.phone || c.email || (booking.channel !== 'telegram' && c.telegram)) && <div className="wow-contact-methods">
          {booking.channel !== 'telegram' && c.telegram && <a href={c.telegram} target="_blank" rel="noreferrer"><TelegramIcon /><span>Telegram: @{handle}</span><ArrowUpRight size={19} aria-hidden="true" /></a>}
          {c.phone && <a href={`tel:${c.phone}`}><PhoneFilledIcon /><span>{displayPhone(c.phone)}</span><ArrowUpRight size={19} aria-hidden="true" /></a>}
          {c.email && <a href={`mailto:${c.email}`}><MailFilledIcon /><span>{c.email}</span><ArrowUpRight size={19} aria-hidden="true" /></a>}
        </div>}
        <div className="wow-visit">
          <p className="wow-address">{c.mapsUrl ? <a href={c.mapsUrl} target="_blank" rel="noreferrer" aria-label={`${c.address} — відкрити на карті`}><BrandText text={c.address.replace(/,[ \t]+(?=\d)/gu, ',\u00a0')} /></a> : <BrandText text={c.address.replace(/,[ \t]+(?=\d)/gu, ',\u00a0')} />}</p>
          {c.openingHours && <p className="wow-hours"><Clock size={18} aria-hidden="true" />{c.openingHours}</p>}
          {c.mapsUrl && <a className="wow-text-link" href={c.mapsUrl} target="_blank" rel="noreferrer"><MapPinFilledIcon /><span>Як дістатися</span><ArrowUpRight size={18} aria-hidden="true" /></a>}
        </div>
        {(c.instagram || c.tiktok) && <div className="wow-socials">{c.instagram && <SocialLink href={c.instagram} label="Instagram студії" platform="instagram" />}{c.tiktok && <SocialLink href={c.tiktok} label="TikTok студії" platform="tiktok" />}</div>}
      </div></div></section>
    </main>

    <footer className="wow-footer-region"><div className="wow-footer wow-shell"><a className="wow-logo" href="#top" aria-label="NA GOLCI — нагору"><img src="/logo.svg" alt="NA GOLCI" width="1280" height="213" /></a><div className="wow-footer-meta"><span>© {year} NA GOLCI · КИЇВ</span><a className="wow-developer-link" href="https://www.instagram.com/pasha.chee/" target="_blank" rel="noreferrer" aria-label="Сайт зробив @pasha.chee — Instagram"><span>Сайт зробив @pasha.chee</span></a></div></div></footer>

    <WorkLightbox works={shownWorks} active={active} onActiveChange={setActive} bookingFor={workBooking} />
    <WorkLightbox works={[processMedia]} active={processOpen ? 0 : null} onActiveChange={index => setProcessOpen(index !== null)} bookingFor={() => booking} />
  </>;
}
