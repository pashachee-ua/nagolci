import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { authenticateEditor } from '../worker/auth.ts';
const issuer='https://studio.cloudflareaccess.com';
const config={ACCESS_ISSUER:issuer,ACCESS_AUD:'editor-app',EDITOR_EMAILS:'editor@example.test'};
test('Access verifies signature, expiration, issuer, audience and editor email',async()=>{
 const keys=await generateKeyPair('RS256');const jwk=await exportJWK(keys.publicKey);const resolver=createLocalJWKSet({keys:[{...jwk,kid:'test',alg:'RS256'}]});
 const signed=async(patch:Record<string,unknown>={})=>new SignJWT({email:'editor@example.test',iss:issuer,aud:'editor-app',exp:Math.floor(Date.now()/1000)+300,...patch}).setProtectedHeader({alg:'RS256',kid:'test'}).sign(keys.privateKey);
 const request=(token:string)=>new Request('https://admin.example.test/api/content',{headers:{'Cf-Access-Jwt-Assertion':token,'oai-authenticated-user-email':'editor@example.test'}});
 assert.deepEqual(await authenticateEditor(request(await signed()),config,resolver),{email:'editor@example.test'});
 for(const patch of [{aud:'other'},{iss:'https://evil.test'},{exp:1},{email:'other@example.test'},{exp:undefined}])assert.equal(await authenticateEditor(request(await signed(patch)),config,resolver),null);
 assert.equal(await authenticateEditor(request('eyJhbGciOiJub25lIn0.eyJlbWFpbCI6ImVkaXRvckBleGFtcGxlLnRlc3QifQ.'),config,resolver),null);
 assert.equal(await authenticateEditor(request(await signed()),{...config,ACCESS_AUD:''},resolver),null);
 assert.equal(await authenticateEditor(new Request('https://admin.example.test',{headers:{'Cf-Access-Authenticated-User-Email':'editor@example.test'}}),config,resolver),null);
});
