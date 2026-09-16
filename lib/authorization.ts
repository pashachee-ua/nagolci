import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export async function isEditor() {
 const user=await getChatGPTUser();if(!user)return false;
 const emails=(env.EDITOR_EMAILS??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(import.meta.env.DEV&&user.email==='seedy@sites.test')return true;
 return emails.includes(user.email.toLowerCase());
}
export function validMutationOrigin(request:Request) {
 const origin=request.headers.get('origin');
 if(!origin)return false;
 const allowed=['https://nagolci-tattoo.pavel-popov.chatgpt.site'];
 if(import.meta.env.DEV)allowed.push('http://localhost:4317','http://127.0.0.1:4317');
 return allowed.includes(origin)&&request.headers.get('sec-fetch-site')!=='cross-site';
}
