export type Work = { id: string; src: string; alt: string; category: string };
export type SiteContent = {
 name: string; intro: string; biography: string; price: string; address: string; instagram: string;
 portrait: string; studio: string; works: Work[];
};
export const initialContent: SiteContent = {
 name: 'Павло',
 intro: 'Працюю з графікою та кольором. Разом визначимо сюжет, розмір і місце нанесення.',
 biography: 'Привіт! Мене звати Павло, я майстер студії NA GOLCI. Роблю тату вже понад 10 років. Працюю і з чорно-білими, і з кольоровими роботами. Якщо маєш ідею, але ще не знаєш, як вона має виглядати, напиши мені. Обговоримо ескіз, розмір і місце для тату. А якщо це твоє перше татуювання, розповім, як усе проходить, і відповім на запитання.',
 price: 'Щоб назвати ціну, мені потрібно зрозуміти, яку роботу ти хочеш. Вона залежить від розміру, деталей і місця для тату. Усе обговоримо до запису.',
 address: 'Київ, вул. Ярославська, 6',
 instagram: 'https://www.instagram.com/nagolci/',
 portrait: '/images/pavlo.webp', studio: '/images/studio.webp',
 works: [
 {id:'30',src:'/images/work-30.webp',alt:'Дві пташки, що утворюють коло',category:'Графіка'},
 {id:'20',src:'/images/work-20.webp',alt:'Дракон на руці',category:'Графіка'},
 {id:'25',src:'/images/work-25.webp',alt:'Персонаж-жаба з клинком',category:'Ілюстрація'},
 {id:'31',src:'/images/work-31.webp',alt:'Чорно-червона змія',category:'Графіка й колір'},
 {id:'29',src:'/images/work-29.webp',alt:'Череп з бородою',category:'Ілюстрація'},
 {id:'17',src:'/images/work-17.webp',alt:'Кобра на руці',category:'Графіка'},
 {id:'37',src:'/images/work-37.webp',alt:'Архітектурна композиція',category:'Графіка'},
 {id:'19',src:'/images/work-19.webp',alt:'Графічний павук',category:'Графіка'},
 {id:'26',src:'/images/work-26.webp',alt:'Парні ілюстративні портрети',category:'Ілюстрація'},
 {id:'5',src:'/images/work-5.webp',alt:'Кольорова робота на передпліччі',category:'Колір'},
 {id:'24',src:'/images/work-24.webp',alt:'Кольорова композиція на плечі',category:'Колір'},
 {id:'38',src:'/images/work-38.webp',alt:'Ілюстративний персонаж-шишка',category:'Ілюстрація'},
 ]
};
