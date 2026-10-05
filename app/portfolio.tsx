'use client';
/* eslint-disable next/no-img-element -- Studio images also come from editable local media URLs; keep direct loading in the Vinext preview. */

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Clock, Play } from 'lucide-react';
import type { SiteContent } from '@/lib/content';
import Reviews from './reviews';
import { galleryMedia, processMedia } from '@/lib/portfolio-media';
import TelegramIcon from './telegram-icon';
import { MailFilledIcon, PhoneFilledIcon, MapPinFilledIcon } from './contact-icons';
import WorksCarousel from './works-carousel';
import SiteHeader from './site-header';
import WorkLightbox from './work-lightbox';
import { formatIntro, keepWordsTogether } from '@/lib/typography';

function BrandText({ text }: { text: string }) {
  return <>{keepWordsTogether(text).split(/(NA\s+GOLCI)/g).map((part, index) =>
    /^NA\s+GOLCI$/.test(part) ? <span className="brand-name" key={index}>NA GOLCI</span> : keepWordsTogether(part)
  )}</>;
}

function SocialLink({ href, label, platform }: { href: string; label: string; platform: 'instagram' | 'tiktok' }) {
  return <a className="wow-action wow-social" href={href} target="_blank" rel="noreferrer" aria-label={label}>
    <span className={`wow-social-icon wow-social-icon-${platform}`} aria-hidden="true" />
    <span>{label}</span>
    <ArrowUpRight size={17} aria-hidden="true" />
  </a>;
}

function displayPhone(phone: string) {
  return /^\+380\d{9}$/.test(phone) ? phone.replace(/^(\+380)(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5') : phone;
}

function Ticker({ paused }: { paused: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState({ copies: 16, duration: 80 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const unit = unitRef.current;
    if (!container || !unit) return;

    let active = true;
    const update = () => {
      if (!active) return;
      const unitWidth = unit.getBoundingClientRect().width;
      if (!unitWidth) return;
      const copies = Math.max(2, Math.ceil(container.getBoundingClientRect().width / unitWidth) + 1);
      const duration = Math.round(copies * unitWidth / 45);
      setLayout(current => current.copies === copies && current.duration === duration ? current : { copies, duration });
    };
    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(unit);
    update();
    void document.fonts.ready.then(update);
    return () => { active = false; observer.disconnect(); };
  }, []);

  return <div className="wow-ticker" aria-hidden="true" ref={containerRef}>
    <div className="wow-ticker-track" style={{ animationDuration: `${layout.duration}s`, animationPlayState: paused ? 'paused' : 'running' }}>
      {[0, 1].map(group => <div className="wow-ticker-group" key={group}>
        {Array.from({ length: layout.copies }, (_, index) =>
          <span className="wow-ticker-unit" ref={group === 0 && index === 0 ? unitRef : undefined} key={index}>NA GOLCI <span>✳</span> ТАТУ З ХАРАКТЕРОМ <span>✳</span></span>
        )}
      </div>)}
    </div>
  </div>;
}

export default function Portfolio({ content: c }: { content: SiteContent }) {
  const [motionPaused, setMotionPaused] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const works = useMemo(() => galleryMedia(c.works), [c.works]);
  const viewerWorks = useMemo(() => [...works, processMedia], [works]);
  const heroWork = c.works.find(work => work.id === '25') ?? c.works[0];
  const telegramHandle = c.telegram ? new URL(c.telegram).pathname.split('/').filter(Boolean)[0] : '';
  const primaryContact = c.telegram ? { href: c.telegram, label: 'Написати в Telegram', icon: <TelegramIcon /> } : c.phone ? { href: `tel:${c.phone}`, label: 'Зателефонувати', icon: <PhoneFilledIcon /> } : c.email ? { href: `mailto:${c.email}`, label: 'Написати на пошту', icon: <MailFilledIcon /> } : null;
  const biographyParagraphs = c.biography.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean);


  return <>
    <a className="skip-link" href="#works">До робіт</a>
    <SiteHeader />

    <main>
      <section className="wow-hero" aria-labelledby="hero-title">
        <div className="wow-hero-visual" aria-hidden="true">{heroWork && <img src={heroWork.src} alt="" width="800" height="1000" />}</div>
        <div className="wow-hero-inner">
          <div className="wow-hero-kicker"><span>NA GOLCI · КИЇВ</span><span>Тату-студія · Поділ</span></div>
          <h1 id="hero-title">ТАТУ <span>З</span><br />ХАРАКТЕРОМ<span className="wow-title-stop">.</span></h1>
          <div className="wow-hero-bottom"><p>{formatIntro(c.intro)}</p><a href="#works" className="wow-action" aria-label="Дивитися роботи"><span>Дивитися роботи</span><ArrowDown size={20} /></a></div>
        </div>
        <span className="wow-hero-side" aria-hidden="true">ГРАФІКА · КОЛІР · ІЛЮСТРАЦІЯ</span>
      </section>

      <Ticker paused={motionPaused} />

      <WorksCarousel works={works} onOpen={setActive} active={active} motionPaused={motionPaused} onMotionPausedChange={setMotionPaused} />

      <section className="wow-artist" id="artist" aria-labelledby="artist-title"><div className="wow-shell wow-artist-layout">
        <div className="wow-artist-media"><img className="wow-portrait" src={c.portrait} alt="Павло, тату-майстер NA GOLCI" loading="lazy" width="1064" height="1331" /></div>
        <div className="wow-artist-copy"><p className="wow-index">МАЙСТЕР</p><h2 id="artist-title">ПРИВІТ,<br /><small>МЕНЕ ЗВАТИ</small><br /><em>{c.name.toUpperCase()}</em><span>.</span></h2><div className="wow-bio">{biographyParagraphs.map((paragraph, index) => <p key={index}><BrandText text={paragraph} /></p>)}</div><div className="wow-artist-actions"><a href="#contact" className="wow-action wow-tattoo-cta"><span>Хочу тату</span><ArrowUpRight size={18} aria-hidden="true" /></a><SocialLink href="https://www.instagram.com/anohin_pavlo/" label="Мій Instagram" platform="instagram" /></div></div>
      </div></section>

      <section className="wow-booking" id="price" aria-labelledby="price-title">
        <div className="wow-booking-content">
          <figure className="wow-process-photo"><img src="/images/process.webp" alt="Павло працює над татуюванням у студії" loading="lazy" width="945" height="1280" /></figure>
          <button type="button" className="wow-action wow-process-video-button" onClick={() => setActive(works.length)}><Play size={18} fill="currentColor" aria-hidden="true" /><span>Дивитися процес</span><ArrowUpRight size={18} aria-hidden="true" /></button>
          <div className="wow-booking-head"><p className="wow-index">ПОЧНЕМО?</p><h2 id="price-title">ТВОЯ ІДЕЯ.<br /><span>НАША РОБОТА.</span></h2></div>
          <div className="wow-booking-details"><h3>Запис і вартість</h3><p>{keepWordsTogether(c.price)}</p><ol className="wow-steps"><li><div><h4>Твоя ідея</h4><p>{keepWordsTogether('Розкажи, що хочеш набити. Можеш додати фото, які тобі подобаються.')}</p></div><ArrowDown className="wow-step-arrow" size={22} strokeWidth={1.5} aria-hidden="true" /></li><li><div><h4>Розмір і місце</h4><p>{keepWordsTogether('Напиши, де буде тату і якого приблизно розміру.')}</p></div><ArrowDown className="wow-step-arrow" size={22} strokeWidth={1.5} aria-hidden="true" /></li><li><div><h4>Обговорення й запис</h4><p>{keepWordsTogether('У студії підкажуть ціну, дадуть відповіді на запитання й допоможуть обрати дату.')}</p></div></li></ol><a href="#contact" className="wow-action wow-booking-cta wow-tattoo-cta"><span>Хочу тату</span><ArrowUpRight size={20} aria-hidden="true" /></a></div>
        </div>
      </section>

      <div className="wow-reviews"><Reviews reviews={c.reviews} /></div>

      <section className="wow-contact" id="contact" aria-labelledby="contact-title"><div className="wow-shell wow-contact-layout"><div className="wow-contact-photo"><img src={c.studio} alt="Інтер’єр студії NA GOLCI" loading="lazy" width="1200" height="900" /></div><div className="wow-contact-copy"><p className="wow-index">ЗАХОДЬ У ГОСТІ</p><h2 id="contact-title">ЧЕКАЮ ТЕБЕ<br /><span>НА ПОДОЛІ.</span></h2>{primaryContact && <a className="wow-action wow-contact-primary" href={primaryContact.href} target={c.telegram ? '_blank' : undefined} rel={c.telegram ? 'noreferrer' : undefined}>{primaryContact.icon}<span>{primaryContact.label}</span><ArrowUpRight size={20} aria-hidden="true" /></a>}<p className="wow-address"><BrandText text={c.address} /></p>{c.openingHours && <p className="wow-hours"><Clock size={18} aria-hidden="true" />{c.openingHours}</p>}{c.mapsUrl && <a className="wow-action wow-text-link" href={c.mapsUrl} target="_blank" rel="noreferrer"><MapPinFilledIcon /><span>Відкрити в Google Maps</span><ArrowUpRight size={18} aria-hidden="true" /></a>}<div className="wow-contact-methods"><h3>Обговоримо твоє тату?</h3>{c.telegram && <a href={c.telegram} target="_blank" rel="noreferrer"><TelegramIcon /><span>Telegram: @{telegramHandle}</span><ArrowUpRight size={19} /></a>}{c.phone && <a href={`tel:${c.phone}`}><PhoneFilledIcon /><span>{displayPhone(c.phone)}</span><ArrowUpRight size={19} /></a>}{c.email && <a href={`mailto:${c.email}`}><MailFilledIcon /><span>{c.email}</span><ArrowUpRight size={19} /></a>}</div><div className="wow-socials">{c.instagram && <SocialLink href={c.instagram} label="Instagram студії" platform="instagram" />}{c.tiktok && <SocialLink href={c.tiktok} label="TikTok студії" platform="tiktok" />}</div></div></div></section>
    </main>

    <footer className="wow-footer-region"><div className="wow-footer wow-shell"><a className="wow-logo" href="#top" aria-label="NA GOLCI — нагору"><img src="/logo.svg" alt="NA GOLCI" width="1280" height="213" /></a><span>© {new Date().getFullYear()} NA GOLCI · КИЇВ</span></div><div className="wow-footer-credit"><a className="wow-developer-link" href="https://www.instagram.com/pasha.chee/" target="_blank" rel="noreferrer" aria-label="Сайт зробив @pasha.chee — Instagram"><span>Сайт зробив @pasha.chee</span><ArrowUpRight size={13} aria-hidden="true" /></a></div></footer>

    <WorkLightbox works={viewerWorks} active={active} onActiveChange={setActive} />
  </>;
}
