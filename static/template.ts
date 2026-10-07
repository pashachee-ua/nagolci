import type { ContentSnapshot } from '../shared/publication.ts';
export function serializeSnapshot(snapshot: ContentSnapshot): string {
 return JSON.stringify(snapshot).replace(/[<>&\u2028\u2029]/g,char=>'\\u'+char.charCodeAt(0).toString(16).padStart(4,'0'));
}
export function documentTemplate(body:string,snapshot:ContentSnapshot,js:string,css:string[]):string {
 return `<!doctype html><html lang="uk" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>NA GOLCI | Павло, тату-майстер у Києві</title><meta name="description" content="Тату-майстер Павло. Графіка, чорно-білі та кольорові роботи. Київ, Поділ. Портфоліо та запис на тату."><meta name="robots" content="noindex, nofollow"><link rel="icon" href="/favicon.svg">${css.map(path=>`<link rel="stylesheet" href="/${path}">`).join('')}</head><body><div id="root">${body}</div><script id="site-snapshot" type="application/json">${serializeSnapshot(snapshot)}</script><script type="module" src="/${js}"></script></body></html>`;
}
