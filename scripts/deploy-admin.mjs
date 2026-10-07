import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
// The example is never accepted for deployment. Keep local configuration outside Git.
const file='wrangler.admin.jsonc';let config;
try{const text=await readFile(file,'utf8');if(/REPLACE_|PLACEHOLDER/.test(text))throw new Error();config=JSON.parse(text);
 for(const key of ['ADMIN_ORIGIN','PUBLIC_ORIGIN','ACCESS_ISSUER']){const url=new URL(config.vars[key]);if(url.protocol!=='https:'||url.origin!==config.vars[key])throw new Error()}
 for(const key of ['ACCESS_AUD','EDITOR_EMAILS','PAGES_ACCOUNT_ID','PAGES_PROJECT'])if(!config.vars[key])throw new Error();
 if(!config.d1_databases?.[0]?.database_id||!config.r2_buckets?.[0]?.bucket_name)throw new Error();
}catch{console.error('Create wrangler.admin.jsonc with complete real settings (strict JSON, no placeholders). Deployment refused.');process.exit(1)}
async function run(command,args){const child=spawn(command,args,{stdio:'inherit'});const code=await new Promise(resolve=>child.on('exit',resolve));if(code!==0)process.exit(code??1)}
await run('npm',['run','build:admin']);await run('npx',['wrangler','deploy','--config',file]);
