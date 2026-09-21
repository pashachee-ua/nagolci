import { withContactDefaults, type SiteContent, type Work } from './content.ts';
const mediaPattern = /^\/(?:images\/[a-zA-Z0-9_-]+\.webp|api\/media\/[a-f0-9-]+\.(?:jpg|png|webp))$/;
export function validateContent(value: unknown): SiteContent {
 if(!value||typeof value!=='object')throw new Error('Некоректний вміст.');
 const v=withContactDefaults(value) as unknown as Record<string,unknown>;
 const str=(key:string,max:number)=>{const x=v[key];if(typeof x!=='string'||!x.trim()||x.length>max)throw new Error(`Перевір поле ${key} (до ${max} символів).`);return x.trim()};
 const media=(key:string)=>{const s=str(key,200);if(!mediaPattern.test(s))throw new Error('Оберіть завантажене фото.');return s};
 const optional=(key:string,max:number)=>{const x=v[key];if(typeof x!=='string'||x.length>max)throw new Error('Перевір поле '+key);return x.trim()};
 const social=(key:string,hosts:string[])=>{const x=optional(key,200);if(!x)return '';let u:URL;try{u=new URL(x)}catch{throw new Error('Некоректне посилання '+key)}if(u.protocol!=='https:'||!hosts.includes(u.hostname)||u.username||u.password||u.port)throw new Error('Перевір адресу '+key);return x};
 const instagram=social('instagram',['www.instagram.com','instagram.com']);
 const telegram=social('telegram',['t.me']);
 const tiktok=social('tiktok',['www.tiktok.com','tiktok.com']);
 const phone=optional('phone',30).replace(/[\s()-]/g,'');if(phone&&!/^\+[1-9]\d{7,14}$/.test(phone))throw new Error('Номер має починатися з + та коду країни.');
 const email=optional('email',254);if(email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))throw new Error('Перевір email.');
 if(!Array.isArray(v.works)||v.works.length<1||v.works.length>100)throw new Error('Галерея має містити від 1 до 100 робіт.');
 const ids=new Set();
 const works:Work[]=v.works.map((w:unknown)=>{if(!w||typeof w!=='object')throw new Error('Некоректна робота.');const a=w as Work;if(typeof a.id!=='string'||!/^[a-zA-Z0-9-]{1,50}$/.test(a.id)||ids.has(a.id))throw new Error('Некоректний ідентифікатор роботи.');ids.add(a.id);if(typeof a.src!=='string'||!mediaPattern.test(a.src)||typeof a.alt!=='string'||!a.alt.trim()||a.alt.length>150||typeof a.category!=='string'||!a.category.trim()||a.category.length>60)throw new Error('Додай опис і напрям для кожного фото.');return {id:a.id,src:a.src,alt:a.alt.trim(),category:a.category.trim()}});
 return {name:str('name',60),intro:str('intro',500),biography:str('biography',1500),price:str('price',1500),address:str('address',250),instagram,phone,email,telegram,tiktok,portrait:media('portrait'),studio:media('studio'),works};
}
export function detectImage(data:Uint8Array):'jpg'|'png'|'webp'|null {
 if(data[0]===255&&data[1]===216&&data[2]===255)return 'jpg';
 if(data.length>=8&&[137,80,78,71,13,10,26,10].every((x,i)=>data[i]===x))return 'png';
 if(data.length>=12&&new TextDecoder().decode(data.slice(0,4))==='RIFF'&&new TextDecoder().decode(data.slice(8,12))==='WEBP')return 'webp';
 return null;
}
