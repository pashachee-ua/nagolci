// Eight-spoke asterisk drawn as SVG: the "✳" character (U+2733) has an emoji form that
// phones render as a green tile regardless of CSS color.
export default function TickerStar() {
  return <svg className="wow-ticker-star" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" /></svg>;
}
