'use client';
/* eslint-disable next/no-img-element -- Preserve the provided SVG studio logo. */
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const navigation = [
  { id: 'works', label: 'Роботи' },
  { id: 'artist', label: 'Майстер' },
  { id: 'price', label: 'Запис' },
  { id: 'reviews', label: 'Відгуки' },
  { id: 'contact', label: 'Контакти' },
] as const;
const pageSections = ['works', 'artist', 'price', 'reviews', 'contact'] as const;

export default function SiteHeader() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let frame = 0;
    let scrollTimer = 0;
    const update = () => {
      frame = 0;
      const marker = Math.min(window.innerHeight - 1, Math.max(100, window.innerHeight * .35));
      const section = pageSections.find(id => {
        const bounds = document.getElementById(id)?.getBoundingClientRect();
        return bounds && bounds.top <= marker && bounds.bottom > marker;
      });
      setActiveSection(section ?? null);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onScroll = () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(schedule, 180);
    };
    const supportsScrollEnd = 'onscrollend' in window;
    if (supportsScrollEnd) window.addEventListener('scrollend', schedule);
    else window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      if (supportsScrollEnd) window.removeEventListener('scrollend', schedule);
      else window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', schedule);
      window.clearTimeout(scrollTimer);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const desktop = matchMedia('(min-width:1000px)');
    const resize = () => { if (desktop.matches) setMenuOpen(false); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); toggleRef.current?.focus(); }
    };
    desktop.addEventListener('change', resize);
    document.addEventListener('keydown', escape);
    return () => { desktop.removeEventListener('change', resize); document.removeEventListener('keydown', escape); };
  }, [menuOpen]);
  return (
    <header className="wow-header" id="top">
      <div className="wow-header-inner wow-shell">
        <a className="wow-logo" href="#top" aria-label="NA GOLCI — нагору"><img src="/logo.svg" alt="NA GOLCI" width="1280" height="213" /></a>
        <nav className="wow-desktop-nav" aria-label="Основна навігація">{navigation.map(({ id, label }) => <a href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined} key={id}>{label}</a>)}</nav>
        <button ref={toggleRef} className="wow-menu-toggle" type="button" aria-label={menuOpen ? 'Закрити меню' : 'Меню'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(value => !value)}>
          {menuOpen ? <X size={20} strokeWidth={1.5} aria-hidden="true" /> : <Menu size={20} strokeWidth={1.5} aria-hidden="true" />}
          <span className="wow-menu-toggle-label">{menuOpen ? 'Закрити' : 'Меню'}</span>
        </button>
        <a className="wow-action wow-header-cta wow-tattoo-cta" href="#contact"><span>Хочу тату</span><ArrowUpRight size={18} aria-hidden="true" /></a>
      </div>
      {menuOpen && <nav className="wow-mobile-nav" id="mobile-navigation" aria-label="Мобільна навігація">{navigation.map(({id,label}) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}</nav>}
    </header>
  );
}
