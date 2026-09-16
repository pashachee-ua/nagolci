import urllib.request, urllib.error, http.cookiejar, json
from pathlib import Path
base='http://localhost:4317'
jar=http.cookiejar.CookieJar();session=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def call(path,method='GET',body=None,auth=True,origin=base,kind='application/json'):
 headers={'Content-Type':kind}
 if origin:headers['Origin']=origin
 req=urllib.request.Request(base+path,data=body,headers=headers,method=method)
 try:
  r=(session.open if auth else urllib.request.urlopen)(req)
  return r.status,r.read()
 except urllib.error.HTTPError as e:return e.code,e.read()
def check(label,condition):
 assert condition,label
 print('PASS',label)
status,payload=call('/api/content');check('public content readable',status==200)
original=json.loads(payload); data={'content':original['content'],'revision':original['revision']}
check('anonymous cannot edit',call('/api/content','PUT',json.dumps(data).encode(),auth=False)[0]==403)
check('anonymous cannot upload',call('/api/upload','POST',b'test',auth=False)[0]==403)
call('/signin-with-chatgpt?return_to=/admin')
check('editor page renders',call('/admin')[0]==200)
check('cross-origin writes rejected',call('/api/content','PUT',json.dumps(data).encode(),origin='https://evil.test')[0]==403)
check('non-raster upload rejected',call('/api/upload','POST',b'<svg></svg>',kind='image/svg+xml')[0]==415)
image=Path('public/images/pavlo.webp').read_bytes()
status,response=call('/api/upload','POST',image,kind='image/webp');check('authenticated upload works',status==200)
src=json.loads(response)['src'];check('uploaded bytes persist',call(src)[1]==image)
data['content']['intro']='Тест збереження. '+data['content']['intro']
status,response=call('/api/content','PUT',json.dumps(data).encode());check('editor save works',status==200)
new_revision=json.loads(response)['revision']
check('stale editor cannot overwrite',call('/api/content','PUT',json.dumps(data).encode())[0]==409)
check('read after save is durable',json.loads(call('/api/content')[1])['content']['intro'].startswith('Тест збереження.'))
data['content']['intro']=data['content']['intro'].removeprefix('Тест збереження. ');data['revision']=new_revision
check('restore original content',call('/api/content','PUT',json.dumps(data).encode())[0]==200)
for image in Path('public/images').glob('*'):
 check('asset '+image.name,call('/images/'+image.name)[0]==200)
