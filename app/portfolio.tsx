'use client';
import { useState } from 'react';
import { ArrowUpRight, Eye, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import type { SiteContent } from '@/lib/content';
function InstagramLink({href,label,className=''}:{href:string;label:string;className?:string}) {
 return <a className={`instagram-link ${className}`} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}><img src="/icons/instagram.svg" alt="" width="24" height="24"/></a>;
}
export default function Portfolio({content:c}:{content:SiteContent}) {
 const [active,setActive]=useState<number|null>(null);
 const [expanded,setExpanded]=useState(false);
 const works=expanded?c.works:c.works.slice(0,6);
 return <>
 <a className="skip-link" href="#works">До робіт</a>
 <header className="masthead" id="top">
  <div className="topline"><a href="#top" className="studio-name">Тату-студія · Київ, Поділ</a><nav aria-label="Основна навігація"><a href="#works">Роботи</a><a href="#artist">Майстер</a><a href="#contact">Контакти</a></nav><a className="header-book" href="#price">Запис на тату <ArrowUpRight size={16}/></a></div>
  <img className="wordmark" src="/logo.svg" alt="NA GOLCI" width="1280" height="213"/>
 </header>
 <main>
  <section className="works-section wrap" id="works"><div className="section-heading"><div><h1>Роботи</h1></div></div>
   <div className="gallery">{works.map((w,i)=><button key={w.id} className={`work work-${i%6}`} onClick={()=>setActive(i)} aria-label={`Відкрити фото: ${w.alt}`}><div className="work-image"><img src={w.src} alt={w.alt} loading={i<3?"eager":"lazy"} fetchPriority={i===0?"high":"auto"} width="800" height="1000"/><span className="work-overlay" aria-hidden="true"><Eye size={34} strokeWidth={1.25}/></span></div></button>)}</div>
   {c.works.length>6&&<button className="more-button" onClick={()=>setExpanded(!expanded)}>{expanded?'Згорнути добірку':`Ще ${c.works.length-6} робіт`} <ArrowUpRight size={18} className={expanded?'expanded-arrow':''}/></button>}
  </section>
  <section className="artist-section" id="artist"><div className="wrap artist-grid"><div className="artist-copy"><h2>Майстер {c.name}</h2><p>{c.biography}</p><InstagramLink href="https://www.instagram.com/anohin_pavlo/" label="Особистий Instagram Павла" className="artist-social"/><div className="artist-signature">NA GOLCI · KYIV</div></div><figure className="portrait"><img src={c.portrait} alt="Павло, тату-майстер NA GOLCI" loading="lazy" width="1064" height="1331"/><figcaption>{c.name} · Тату-майстер</figcaption></figure></div></section>
  <section className="details wrap" id="price"><div><h2>Запис<br/>і вартість</h2></div><div className="details-copy"><h3>Як дізнатися ціну</h3><p>{c.price}</p><ol className="steps"><li><span>01</span><div><h4>Твоя ідея</h4><p>Розкажи, що хочеш набити. Можеш додати фото, які тобі подобаються.</p></div></li><li><span>02</span><div><h4>Розмір і місце</h4><p>Напиши, де буде тату і якого приблизно розміру.</p></div></li><li><span>03</span><div><h4>Обговорення й запис</h4><p>У студії підкажуть ціну, дадуть відповіді на запитання й допоможуть обрати дату.</p></div></li></ol><a className="booking-link" href="#contact">Уточнити вартість <ArrowUpRight size={19}/></a></div></section>
  <section className="contact-section" id="contact"><div className="wrap contact-grid"><figure className="studio-photo"><img src={c.studio} alt="Інтер’єр студії NA GOLCI" loading="lazy" width="1200" height="900"/></figure><div className="contact-copy"><h2>NA GOLCI</h2><p className="address">{c.address}</p><a className="text-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address+' NA GOLCI')}`} target="_blank" rel="noreferrer">Прокласти маршрут <ArrowUpRight size={18}/></a><div className="contact-bottom"><p>Запис та запитання</p><a className="contact-action" href={c.instagram} target="_blank" rel="noreferrer" aria-label="Написати в студію NA GOLCI в Instagram"><span>Написати в студію</span><span className="instagram-link instagram-primary" aria-hidden="true"><img src="/icons/instagram.svg" alt="" width="24" height="24"/></span></a></div></div></div></section>
 </main>
 <footer className="wrap"><a href="#top"><img src="/logo.svg" alt="NA GOLCI" width="200" height="34"/></a><span className="copyright">© {new Date().getFullYear()} NA GOLCI<br/><span>Усі права захищено</span></span><a href="#top" className="back-top">Нагору <ArrowUpRight size={17}/></a></footer>
 <Dialog open={active!==null} onOpenChange={open=>{if(!open)setActive(null)}}><DialogContent className="lightbox" showCloseButton={false} onKeyDown={e=>{if(active===null)return;if(e.key==='ArrowRight')setActive((active+1)%c.works.length);if(e.key==='ArrowLeft')setActive((active+c.works.length-1)%c.works.length)}}>
  <div className="lightbox-top"><DialogTitle className="sr-only">{active!==null?c.works[active]?.alt:''}</DialogTitle><DialogClose className="icon-button" aria-label="Закрити фото"><X/></DialogClose></div><DialogDescription className="sr-only">Фото роботи. Стрілки ліворуч і праворуч перемикають зображення.</DialogDescription>
  {active!==null&&<><img className="full-work" src={c.works[active]?.src} alt={c.works[active]?.alt}/><div className="lightbox-nav"><button className="icon-button" aria-label="Попередня робота" onClick={()=>setActive((active+c.works.length-1)%c.works.length)}><ArrowLeft/></button><span>{active+1} з {c.works.length}</span><button className="icon-button" aria-label="Наступна робота" onClick={()=>setActive((active+1)%c.works.length)}><ArrowRight/></button></div></>}
 </DialogContent></Dialog>
 </>;
}
