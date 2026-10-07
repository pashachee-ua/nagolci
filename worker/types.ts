export type WorkerEnv = {
 DB:D1Database; FILES:R2Bucket; ASSETS:Fetcher;
 ADMIN_ORIGIN:string; EDITOR_EMAILS:string; ACCESS_ISSUER:string; ACCESS_AUD:string; BUILD_TOKEN:string;
 PUBLIC_ORIGIN?:string; PAGES_ACCOUNT_ID?:string; PAGES_PROJECT?:string; PAGES_API_TOKEN?:string; PAGES_DEPLOY_HOOK?:string;
};
export class ApiError extends Error { status:number; constructor(status:number,message:string){super(message);this.status=status} }
export const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
