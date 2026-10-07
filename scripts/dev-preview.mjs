import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const admin=process.argv[2]==='admin';
const builder=spawn('npm',['run',admin?'build:admin':'build:public',...(admin?[]:['--','--seed'])],{stdio:'inherit'});
const code=await new Promise(resolve=>builder.on('exit',resolve));if(code!==0)process.exit(code??1);
if(admin){const child=spawn(process.execPath,['--experimental-strip-types','tests/helpers/dev-admin.ts'],{stdio:'inherit'});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??0));}
else{
 const root=await realpath('dist/public'),mime={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.ttf':'font/ttf','.woff2':'font/woff2'};
 const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=await realpath(resolve(root,'.'+(pathname==='/'?'/index.html':pathname)));if(!file.startsWith(root+sep)||(await stat(file)).isDirectory())throw new Error();const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-store','Content-Length':bytes.length});res.end(req.method==='HEAD'?undefined:bytes)}catch{res.writeHead(404);res.end('Not found')}});
 server.listen(4320,'127.0.0.1',()=>console.log('Static preview: http://127.0.0.1:4320'));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit()));
}
