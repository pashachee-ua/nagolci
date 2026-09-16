'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="wrap error-page"><h1>Не вдалося<br/>відкрити сторінку.</h1><p>Спробуй ще раз або напиши нам в Instagram.</p><button className="more-button" onClick={reset}>Спробувати ще раз</button><a className="text-link" href="https://www.instagram.com/nagolci/">Instagram NA GOLCI</a></main>}
