import type { Metadata } from 'next';
import './fonts.css';
import './globals.css';
import './wow.css';
import './redesign.css';
export const metadata: Metadata = {
  title: 'NA GOLCI | Павло, тату-майстер у Києві',
  description: 'Тату-майстер Павло. Графіка, чорно-білі та кольорові роботи. Київ, Поділ. Портфоліо та запис на тату.',
  icons: { icon: '/favicon.svg' },
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
 return <html lang="uk" className="dark"><head><link rel="preload" href="/fonts/cormorant-garamond-600.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /><link rel="preload" href="/fonts/golos-text-variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /></head><body>{children}</body></html>;
}
