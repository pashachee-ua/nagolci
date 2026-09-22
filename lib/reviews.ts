export type Review = {id:string;author:string;quote:string;rating:number;originalLanguage:string;url:string};
// Selected from Google Maps sorted by newest, verified 2026-09-22; Ukrainian originals only.
// Quote spacing is lightly normalized; wording is preserved.
// Google displayed relative dates only; no exact publication dates are inferred.
export const reviewsUrl='https://www.google.com/maps/place/%D1%82%D0%B0%D1%82%D1%83+%D1%81%D0%B0%D0%BB%D0%BE%D0%BD+NA+GOLCI/@50.46621,30.5135172,16z/data=!4m8!3m7!1s0x40d4cf82f685f7d3:0x701bfc8305c4b8c0!8m2!3d50.4664465!4d30.5104729!9m1!1b1!16s%2Fg%2F11f8bsbz1y';
export const initialReviews:Review[]=[
{id:'victoria',author:'Виктория Давыденко',rating:5,originalLanguage:'uk',quote:'Паша, ти найкращий майстер тату евер Якщо вам треба якісна тату, а ще допомога з ескізом - то вам точно сюди!',url:'https://maps.app.goo.gl/DXRPDrDJkPnhk5yf8'},
{id:'myla',author:'Мила Мережко',rating:5,originalLanguage:'uk',quote:'Не один «партачок» був виправлений Пашою, майстер своєї справи)…',url:'https://maps.app.goo.gl/4hATgEy5YBUb9YzN7'},
{id:'sasha',author:'Саша Диденко',rating:5,originalLanguage:'uk',quote:'…Все дуже якісно, акуратно й швидко. Атмосфера під час сеансів спокійна й довірлива, мені було комфортно з першої хвилини…',url:'https://maps.app.goo.gl/6CuW9LHxnr8MjdUP8'},
{id:'bodia',author:'Бодя Семенченко',rating:5,originalLanguage:'uk',quote:'Зробив у Паші 2 тату. Максимально задоволений результатом. Завжди раджу та буду радити його всім, справжній майстер свого діла 👍🏻…',url:'https://maps.app.goo.gl/8EnrQj2sfMcZemc99'},
{id:'darina',author:'Darina Onoprienko',rating:5,originalLanguage:'uk',quote:'Залишилася дуже задоволена роботою! Все акуратно, стерильно і з увагою до деталей)',url:'https://maps.app.goo.gl/ota5vSvCg5pmU5nNA'},
{id:'daria',author:"Дар'я Черних",rating:5,originalLanguage:'uk',quote:'Зовсім нещодавно набивала одразу два тату в Павла) все пройшло швидко і безболісно, дуже обережно робив майстер…',url:'https://maps.app.goo.gl/tYrj1PABDP8kxuoc7'},
{id:'yana',author:'Yana Yakimets',rating:5,originalLanguage:'uk',quote:'Тату-студія дійсно дуже затишна, а майстер Павло дуже комфортна та цікава людина, з якою завжди є про що поговорити…',url:'https://maps.app.goo.gl/SDUmAXYD6xoUi5D97'},
{"id":"darya-shevtsova","author":"Darya Shevtsova","rating":5,"originalLanguage":"uk","quote":"…Професіонал з великої літери - уважний до деталей, працює акуратно, все стерильно й безпечно. Саме той майстер, до якого хочеться повертатися!","url":"https://maps.app.goo.gl/awp1hDpA4dRkYqR98"},
{"id":"sonic","author":"Sonic","rating":5,"originalLanguage":"uk","quote":"Ходжу до Паші вже не перший рік, всі свої тату бʼю тут, це штук 5 точно! Майстер своє справи, приємні розмови!…","url":"https://maps.app.goo.gl/vzfsLdnNCnxSLJBA9"},
{"id":"volodymyr","author":"Володимир","rating":5,"originalLanguage":"uk","quote":"Зробив у Павла 3 тату + відновив стару. Роботою ДУЖЕ задоволений! Першій вже більше трьох років - виглядає як нова!)…","url":"https://maps.app.goo.gl/poYHoHAVmTx25YJX9"},
];
export const studioDefaults={mapsUrl:'https://maps.app.goo.gl/Wh4vhs2vYa1cVsBw6',openingHours:'Щодня · 11:00–20:00',reviews:initialReviews};
export function isMapsUrl(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&((u.hostname==='maps.app.goo.gl'&&/^\/[A-Za-z0-9]+$/.test(u.pathname))||(['www.google.com','google.com'].includes(u.hostname)&&u.pathname.startsWith('/maps/')))}catch{return false}}
