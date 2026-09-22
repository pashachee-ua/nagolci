'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Star} from 'lucide-react';
import {reviewsUrl,type Review} from '@/lib/reviews';
export default function Reviews({reviews}:{reviews:Review[]}){
 const track=useRef<HTMLDivElement>(null);
 const [edge,setEdge]=useState({start:true,end:false});
 const measure=()=>{const el=track.current;if(el)setEdge({start:el.scrollLeft<2,end:el.scrollLeft+el.clientWidth>=el.scrollWidth-2})};
 useEffect(()=>{const el=track.current;if(!el)return;const observer=new ResizeObserver(measure);observer.observe(el);measure();return()=>observer.disconnect()},[reviews]);
 function move(direction:number){const el=track.current;if(!el)return;const card=el.firstElementChild as HTMLElement|null;const distance=(card?.getBoundingClientRect().width??el.clientWidth)+24;el.scrollBy({left:direction*distance,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
 if(!reviews.length)return null;
 return <section className="reviews-section wrap" aria-labelledby="reviews-title" id="reviews"><div className="reviews-heading"><h2 id="reviews-title">Відгуки</h2><div className="review-controls"><button className="icon-button" aria-label="Попередні відгуки" disabled={edge.start} onClick={()=>move(-1)}><ArrowLeft size={20}/></button><button className="icon-button" aria-label="Наступні відгуки" disabled={edge.end} onClick={()=>move(1)}><ArrowRight size={20}/></button></div></div>
 <div className="reviews-track" ref={track} onScroll={measure} tabIndex={0} role="region" aria-label="Відгуки клієнтів, гортайте стрілками" onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}}}>{reviews.map(r=><article className="review-card" key={r.id}><div className="review-stars" aria-label={`${r.rating} з 5 зірок`}>{Array.from({length:5},(_,i)=><Star key={i} size={15} fill={i<r.rating?'currentColor':'none'} aria-hidden="true"/>)}</div><blockquote>{r.quote}</blockquote><div className="review-credit"><p>{r.author}</p>{r.originalLanguage!=='uk'&&<small>Переклад з {r.originalLanguage==='ru'?'російської':r.originalLanguage==='en'?'англійської':r.originalLanguage}</small>}<a href={r.url} target="_blank" rel="noreferrer" aria-label={`Відгук ${r.author} у Google`}>Оригінал у Google <ArrowUpRight size={15}/></a></div></article>)}</div>
 <a className="text-link all-reviews" href={reviewsUrl} target="_blank" rel="noreferrer">Усі відгуки в Google <ArrowUpRight size={18}/></a></section>
}
