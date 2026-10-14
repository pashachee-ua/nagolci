import { createRoot } from 'react-dom/client';
import { useEffect,useState } from 'react';
import Editor from '../app/admin/editor';
import type { SiteContent } from '../lib/content';
import '../app/fonts.css';import '../app/globals.css';import '../app/wow.css';import '../app/redesign.css';
function Admin(){
 const [draft,setDraft]=useState<{content:SiteContent;revision:number;publicUrl:string|null}|null>(null);const [error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();void fetch('/api/content',{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error('Не вдалося відкрити редактор. Перевір доступ і онови сторінку.');setDraft(await response.json())}).catch(e=>{if(!controller.signal.aborted)setError(e.message)});return()=>controller.abort()},[]);
 return draft?<Editor initial={draft.content} revision={draft.revision} publishing publicUrl={draft.publicUrl}/>:<main className="editor wrap"><h1>Редактор сайту</h1><p role="status">{error||'Завантажуємо вміст…'}</p></main>;
}
createRoot(document.getElementById('root')!).render(<Admin/>);
