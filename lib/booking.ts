import type { SiteContent } from './content.ts';

// Mirrors the three booking steps on the page, so the first message already has what Pavlo asks for.
export const bookingDraft = 'Привіт! Хочу тату.\nІдея: \nМісце на тілі: \nПриблизний розмір: ';

export function workDraft(title: string) {
  return `Привіт! Хочу тату в схожому стилі, як «${title}» на сайті.\nМісце на тілі: \nПриблизний розмір: `;
}

/** t.me/<username>?text= pre-fills the chat input (https://core.telegram.org/api/links). */
export function telegramDraft(telegram: string, text: string) {
  const url = new URL(telegram);
  return `${url.origin}${url.pathname}?text=${encodeURIComponent(text)}`;
}

export type BookingLink = { href: string; external: boolean; channel: 'telegram' | 'phone' | 'email' | 'page' };

/** The single destination for every "Хочу тату" action: Telegram first, then phone, email, contacts. */
export function bookingLink(content: Pick<SiteContent, 'telegram' | 'phone' | 'email'>, text = bookingDraft): BookingLink {
  if (content.telegram) return { href: telegramDraft(content.telegram, text), external: true, channel: 'telegram' };
  if (content.phone) return { href: `tel:${content.phone}`, external: false, channel: 'phone' };
  if (content.email) return { href: `mailto:${content.email}?body=${encodeURIComponent(text)}`, external: false, channel: 'email' };
  return { href: '#contact', external: false, channel: 'page' };
}

export function telegramHandle(telegram: string) {
  return telegram ? new URL(telegram).pathname.split('/').filter(Boolean)[0] ?? '' : '';
}
