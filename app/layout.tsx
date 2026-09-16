import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'NA GOLCI — Павло, тату-майстер у Києві',
  description: 'Тату-майстер Павло. Графіка, чорно-білі та кольорові роботи. Київ, Поділ. Портфоліо та запис на тату.',
  icons: { icon: '/favicon.svg' },
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
 return <html lang="uk" className="dark"><body>{children}</body></html>;
}
