'use client';
import { useState } from 'react';
import { ArrowUpRight, ArrowDown, Plus, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import type { SiteContent } from '@/lib/content';
export default function Portfolio({content:c}:{content:SiteContent}) {
 const [active,setActive]=useState<number|null>(null);
 const [expanded,setExpanded]=useState(false);
 const works=expanded?c.works:c.works.slice(0,6);
 return <>
 <a className="skip-link" href="#works">До робіт</a>
 <header className="masthead" id="top">
  <div className="topline"><a href="#top" className="studio-name">Тату-студія · Київ, Поділ</a><nav aria-label="Основна навігація"><a href="#works">Роботи</a><a href="#artist">Майстер</a><a href="#contact">Контакти</a></nav><a className="header-book" href={c.instagram} target="_blank" rel="noreferrer">Обговорити тату <ArrowUpRight size={17}/></a></div>
  <img className="wordmark" src="/logo.svg" alt="NA GOLCI" width="1280" height="213"/>
 </header>
 <main>
  <section className="hero wrap" aria-labelledby="hero-title">
   <div className="hero-copy"><p className="eyebrow"><span className="red-line"/> Авторське тату · {c.name}</p><h1 id="hero-title">Графіка<br/><em>на шкірі.</em></h1><p className="intro">{c.intro}</p><a className="text-link" href="#works">Переглянути роботи <ArrowDown size={19}/></a><div className="hero-note"><span>NA GOLCI</span><p>Чорнило. Лінія. Характер.</p></div></div>
   <button className="hero-art" onClick={()=>setActive(0)} aria-label={`Роздивитися: ${c.works[0]?.alt}`}><img src={c.works[0]?.src} alt={c.works[0]?.alt} fetchPriority="high" width="825" height="1100"/><span className="image-label">{c.works[0]?.category} <Plus size={20}/></span><span className="vertical-label">SELECTED WORK / 01</span></button>
  </section>
  <section className="works-section wrap" id="works"><div className="section-heading"><div><p className="eyebrow">01 / Портфоліо</p><h2>На живій шкірі.</h2></div><p className="section-aside">Від тонкої лінії<br/>до насиченого кольору.</p></div>
   <div className="gallery">{works.map((w,i)=><button key={w.id} className={`work work-${i%6}`} onClick={()=>setActive(i)} aria-label={`Відкрити фото: ${w.alt}`}><div className="work-image"><img src={w.src} alt={w.alt} loading="lazy" width="800" height="1000"/><span className="zoom-icon"><Plus size={23}/></span></div><div className="work-caption"><span>{String(i+1).padStart(2,'0')} / {w.category}</span><span>{w.alt}</span></div></button>)}</div>
   {c.works.length>6&&<button className="more-button" onClick={()=>setExpanded(!expanded)}>{expanded?'Згорнути добірку':`Ще ${c.works.length-6} робіт`} <span>{expanded?'−':'+'}</span></button>}
  </section>
  <section className="artist-section" id="artist"><div className="wrap artist-grid"><div className="artist-copy"><p className="eyebrow">02 / За цими роботами</p><h2>Привіт.<br/>Я {c.name}.</h2><p>{c.biography}</p><a className="text-link" href="https://www.instagram.com/anohin_pavlo/" target="_blank" rel="noreferrer">Особистий Instagram <ArrowUpRight size={19}/></a><div className="artist-signature">NA GOLCI / KYIV</div></div><figure className="portrait"><img src={c.portrait} alt="Павло, тату-майстер NA GOLCI" loading="lazy" width="1064" height="1331"/><figcaption>{c.name} / Тату-майстер</figcaption></figure></div></section>
  <section className="details wrap" id="price"><div><p className="eyebrow">03 / Від ідеї до тату</p><h2>Почнемо<br/><em>з розмови.</em></h2></div><div className="details-copy"><h3>Скільки коштуватиме?</h3><p>{c.price}</p><ol className="steps"><li><span>01</span><div><h4>Твоя ідея</h4><p>Сюжет, референси або просто напрям.</p></div></li><li><span>02</span><div><h4>Розмір і місце</h4><p>Де хочеш тату та приблизний розмір у сантиметрах.</p></div></li><li><span>03</span><div><h4>Обговорення й запис</h4><p>Уточнимо деталі, вартість і зручну дату.</p></div></li></ol><a className="primary-link" href={c.instagram} target="_blank" rel="noreferrer">Написати Павлу <ArrowUpRight size={20}/></a></div></section>
  <section className="contact-section" id="contact"><div className="wrap contact-grid"><figure className="studio-photo"><img src={c.studio} alt="Інтер’єр студії NA GOLCI" loading="lazy" width="1200" height="900"/></figure><div className="contact-copy"><p className="eyebrow">04 / Побачимось на Подолі</p><h2>NA GOLCI</h2><p className="address">{c.address}</p><a className="text-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address+' NA GOLCI')}`} target="_blank" rel="noreferrer">Прокласти маршрут <ArrowUpRight size={18}/></a><div className="contact-bottom"><p>Маєш ідею?</p><a href={c.instagram} target="_blank" rel="noreferrer">Давай втілимо. <ArrowUpRight/></a></div></div></div></section>
 </main>
 <footer className="wrap"><a href="#top"><img src="/logo.svg" alt="NA GOLCI" width="200" height="34"/></a><span>Тату. Київ. Поділ.</span><a href={c.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={15}/></a></footer>
 <Dialog open={active!==null} onOpenChange={open=>{if(!open)setActive(null)}}><DialogContent className="lightbox" showCloseButton={false} onKeyDown={e=>{if(active===null)return;if(e.key==='ArrowRight')setActive((active+1)%c.works.length);if(e.key==='ArrowLeft')setActive((active+c.works.length-1)%c.works.length)}}>
  <div className="lightbox-top"><DialogTitle>{active!==null?c.works[active]?.alt:''}</DialogTitle><DialogClose className="icon-button" aria-label="Закрити фото"><X/></DialogClose></div><DialogDescription className="sr-only">Фото роботи. Стрілки ліворуч і праворуч перемикають зображення.</DialogDescription>
  {active!==null&&<><img className="full-work" src={c.works[active]?.src} alt={c.works[active]?.alt}/><div className="lightbox-nav"><button className="icon-button" aria-label="Попередня робота" onClick={()=>setActive((active+c.works.length-1)%c.works.length)}><ArrowLeft/></button><span>{active+1} / {c.works.length}</span><button className="icon-button" aria-label="Наступна робота" onClick={()=>setActive((active+1)%c.works.length)}><ArrowRight/></button></div></>}
 </DialogContent></Dialog>
 </>;
}
