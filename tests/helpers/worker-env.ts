import { Miniflare } from 'miniflare';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { WorkerEnv } from '../../worker/types.ts';
export async function workerFixture(){
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',d1Databases:['DB'],r2Buckets:['FILES']});
 const pair=await generateKeyPair('RS256');const jwk=await exportJWK(pair.publicKey);
 const env={DB:await mf.getD1Database('DB'),FILES:await mf.getR2Bucket('FILES'),ASSETS:{fetch:async()=>new Response('admin assets')},ADMIN_ORIGIN:'https://admin.example.test',EDITOR_EMAILS:'editor@example.test',ACCESS_ISSUER:'https://studio.cloudflareaccess.com',ACCESS_AUD:'editor-app',BUILD_TOKEN:'test-build-only'} as unknown as WorkerEnv;
 const token=await new SignJWT({email:'editor@example.test'}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer(env.ACCESS_ISSUER).setAudience(env.ACCESS_AUD).setExpirationTime('5m').sign(pair.privateKey);
 const keyResolver=createLocalJWKSet({keys:[{...jwk,kid:'test',alg:'RS256'}]});
 function request(path:string,method='GET',body?:BodyInit,headers:Record<string,string>={}){const merged=new Headers({'Cf-Access-Jwt-Assertion':token,Origin:env.ADMIN_ORIGIN,'Content-Type':'application/json'});for(const [name,value] of Object.entries(headers))merged.set(name,value);return new Request(env.ADMIN_ORIGIN+path,{method,body,headers:merged})}
 return {env,keyResolver,request,dispose:()=>mf.dispose()};
}
