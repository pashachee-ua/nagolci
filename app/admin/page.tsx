import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { isEditor } from '@/lib/authorization';
import { readContent } from '@/lib/store';
import Editor from './editor';
export const dynamic='force-dynamic';
export default async function Admin(){await requireChatGPTUser('/admin');if(!await isEditor())return <main className="wrap error-page"><h1>Редактор сайту</h1><p>Цьому акаунту ще не надано доступ до редагування.</p><a className="text-link" href="/">Повернутися на сайт</a></main>;const data=await readContent();return <Editor initial={data.content} revision={data.revision}/>}
