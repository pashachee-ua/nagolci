import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { WorkerEnv } from './types.ts';
type AuthConfig=Pick<WorkerEnv,'ACCESS_ISSUER'|'ACCESS_AUD'|'EDITOR_EMAILS'>;
const keysets=new Map<string,JWTVerifyGetKey>();
export async function authenticateEditor(request:Request,env:AuthConfig,keyResolver?:JWTVerifyGetKey):Promise<{email:string}|null>{
 try{
 if(!env.ACCESS_ISSUER||!env.ACCESS_AUD||!env.EDITOR_EMAILS)return null;
 const issuer=new URL(env.ACCESS_ISSUER);
 if(issuer.protocol!=='https:'||!issuer.hostname.endsWith('.cloudflareaccess.com')||issuer.origin!==env.ACCESS_ISSUER)return null;
 const token=request.headers.get('Cf-Access-Jwt-Assertion');if(!token)return null;
 let keys=keyResolver??keysets.get(env.ACCESS_ISSUER);
 if(!keys){keys=createRemoteJWKSet(new URL('/cdn-cgi/access/certs',issuer));keysets.set(env.ACCESS_ISSUER,keys)}
 const {payload}=await jwtVerify(token,keys,{issuer:env.ACCESS_ISSUER,audience:env.ACCESS_AUD,algorithms:['RS256'],requiredClaims:['exp','email','iss','aud']});
 if(typeof payload.email!=='string')return null;
 const email=payload.email.toLowerCase();
 return env.EDITOR_EMAILS.split(',').map(e=>e.trim().toLowerCase()).includes(email)?{email}:null;
 }catch{return null}
}
export function validOrigin(request:Request,env:WorkerEnv):boolean {
 try{const configured=new URL(env.ADMIN_ORIGIN);return configured.origin===env.ADMIN_ORIGIN&&new URL(request.url).origin===env.ADMIN_ORIGIN&&request.headers.get('origin')===env.ADMIN_ORIGIN&&request.headers.get('sec-fetch-site')!=='cross-site'}catch{return false}
}
export async function authenticateBuild(request:Request,env:WorkerEnv):Promise<boolean>{
 if(!env.BUILD_TOKEN||env.BUILD_TOKEN.length<16)return false;
 const supplied=request.headers.get('authorization')??'';
 const bytes=new TextEncoder();const digest=async(value:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',bytes.encode(value)));
 const [a,b]=await Promise.all([digest(supplied),digest('Bearer '+env.BUILD_TOKEN)]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
