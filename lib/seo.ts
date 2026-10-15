import type { SiteContent } from './content.ts';
import { galleryMedia } from './portfolio-media.ts';

// Facts that are not editable in the admin. Coordinates come from the Google Maps place the
// address links to (place 0x40d4cf82f685f7d3:0x701bfc8305c4b8c0), verified 2026-10-15.
export const siteOrigin = 'https://nagolci.com';
export const artistInstagram = 'https://www.instagram.com/anohin_pavlo/';
const studioGeo = { latitude: 50.4664465, longitude: 30.5104729 };
export const ogImage = { path: '/images/og.jpg', width: 1200, height: 630, alt: 'NA GOLCI — тату-студія на Подолі, Київ' };

export const seoTitle = 'Тату-студія NA GOLCI на Подолі, Київ — майстер Павло';

export function seoDescription(content: Pick<SiteContent, 'address'>) {
  return `Графіка, кольорові та ілюстративні тату від майстра Павла, понад 10 років досвіду. ${content.address}. Портфоліо, відгуки й запис у Telegram.`;
}

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Reads "Щодня · 11:00–20:00" style hours; anything else is left out of the markup rather than guessed. */
export function openingHoursSpecification(hours: string) {
  const match = hours.match(/^\s*Щодня\D*(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})\s*$/u);
  if (!match) return undefined;
  const pad = (time: string) => time.padStart(5, '0');
  return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: weekdays, opens: pad(match[1]), closes: pad(match[2]) }];
}

function postalAddress(address: string) {
  const [locality, ...rest] = address.split(/,\s*/u);
  return rest.length && /^(Київ|Kyiv)$/iu.test(locality)
    ? { '@type': 'PostalAddress', streetAddress: rest.join(', '), addressLocality: 'Київ', addressCountry: 'UA' }
    : { '@type': 'PostalAddress', streetAddress: address, addressCountry: 'UA' };
}

const absolute = (path: string) => new URL(path, siteOrigin).href;

/**
 * TattooParlor + Person + WebSite graph. Deliberately no aggregateRating: Google ignores
 * self-hosted ratings of one's own business, and the reviews on the page come from Google.
 */
export function structuredData(content: SiteContent) {
  const business = `${siteOrigin}/#business`;
  const artist = `${siteOrigin}/#artist`;
  const hours = openingHoursSpecification(content.openingHours);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TattooParlor',
        '@id': business,
        name: 'NA GOLCI',
        alternateName: 'тату салон NA GOLCI',
        description: seoDescription(content),
        url: `${siteOrigin}/`,
        logo: absolute('/logo.svg'),
        image: [absolute(content.studio), absolute(content.portrait), ...content.works.slice(0, 4).map(work => absolute(work.src))],
        ...(content.phone && { telephone: content.phone }),
        ...(content.email && { email: content.email }),
        address: postalAddress(content.address),
        geo: { '@type': 'GeoCoordinates', ...studioGeo },
        ...(content.mapsUrl && { hasMap: content.mapsUrl }),
        ...(hours && { openingHoursSpecification: hours }),
        sameAs: [content.instagram, content.tiktok].filter(Boolean),
        employee: { '@id': artist },
      },
      {
        '@type': 'Person',
        '@id': artist,
        name: content.name,
        jobTitle: 'Тату-майстер',
        image: absolute(content.portrait),
        worksFor: { '@id': business },
        sameAs: [artistInstagram],
      },
      { '@type': 'WebSite', '@id': `${siteOrigin}/#website`, name: 'NA GOLCI', url: `${siteOrigin}/`, inLanguage: 'uk', publisher: { '@id': business } },
    ],
  };
}

const escapeAttribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// Same escaping as the content snapshot: JSON inside <script> must not be able to close the tag.
const scriptJson = (value: unknown) => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));

/** Everything search engines and link previews read from <head>, built from the published content. */
export function headTags(content: SiteContent): string {
  const description = escapeAttribute(seoDescription(content));
  const title = escapeAttribute(seoTitle);
  const canonical = `${siteOrigin}/`;
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${canonical}">`,
    '<link rel="icon" href="/favicon.ico" sizes="48x48">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="NA GOLCI">',
    '<meta property="og:locale" content="uk_UA">',
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${absolute(ogImage.path)}">`,
    `<meta property="og:image:width" content="${ogImage.width}">`,
    `<meta property="og:image:height" content="${ogImage.height}">`,
    `<meta property="og:image:alt" content="${escapeAttribute(ogImage.alt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<script type="application/ld+json">${scriptJson(structuredData(content))}</script>`,
  ].join('');
}

const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One page plus its portfolio images, so Google Images can associate the works with the studio. */
export function sitemap(content: SiteContent, lastModified: string): string {
  const images = [...galleryMedia(content.works).map(work => work.src), content.portrait, content.studio];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n<url><loc>${siteOrigin}/</loc><lastmod>${lastModified.slice(0, 10)}</lastmod>${images.map(src => `<image:image><image:loc>${xml(absolute(src))}</image:loc></image:image>`).join('')}</url>\n</urlset>\n`;
}
