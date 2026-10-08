import asyncio, ipaddress, socket, io, ssl, ftplib
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app=FastAPI(title="NOB Runner", version="2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET","POST","OPTIONS"], allow_headers=["*"])

TOOLS={
 "dnsrecon":{"bin":"dnsrecon","args":["-t","std"],"kind":"host"},
 "subfinder":{"bin":"subfinder","args":["-silent"],"kind":"domain"},
 "httpx":{"bin":"httpx-toolkit","args":["-silent","-status-code","-title","-tech-detect","-web-server","-cdn","-asn","-ip","-location","-json"],"kind":"url"},
 "whatweb":{"bin":"whatweb","args":["--no-errors","--color=never"],"kind":"url"},
 "wafw00f":{"bin":"wafw00f","args":["--no-colors"],"kind":"url"},
 "nmap":{"bin":"nmap","args":["-Pn","-sV","--version-light","-T3"],"kind":"host"},
 "sslscan":{"bin":"sslscan","args":["--no-colour"],"kind":"tls"},
 "nikto":{"bin":"nikto","args":["-nointeractive"],"kind":"url"},
}

class Job(BaseModel):
    tool:str
    target:str
    timeout:int=Field(default=90,ge=5,le=180)

class DeepJob(BaseModel):
    target:str
    timeout:int=Field(default=90,ge=10,le=180)

class FTPJob(BaseModel):
    host:str
    port:int=Field(default=21,ge=1,le=65535)
    username:str=Field(default="anonymous",max_length=160)
    password:str=Field(default="",max_length=512)
    path:str=Field(default="/",max_length=2048)
    tls:bool=False
    timeout:int=Field(default=15,ge=5,le=60)

def validate_public_host(raw):
    host=(raw or "").strip().lower()
    if not host: raise ValueError("FTP host is required")
    if "://" in host: host=urlparse(host).hostname or ""
    if host in {"localhost","localhost.localdomain"} or host.endswith((".local",".internal",".localhost")):
        raise ValueError("Private/local FTP targets are blocked")
    try:
        infos=socket.getaddrinfo(host,None)
        if not infos: raise ValueError("FTP host DNS could not be resolved")
        for i in infos:
            ip=ipaddress.ip_address(i[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
                raise ValueError("Private/local FTP target is blocked")
    except socket.gaierror as e:
        raise ValueError("FTP host DNS could not be resolved") from e
    return host

def ftp_connect(job):
    host=validate_public_host(job.host)
    cls=ftplib.FTP_TLS if job.tls else ftplib.FTP
    ftp=cls()
    ftp.connect(host,job.port,timeout=job.timeout)
    ftp.encoding="utf-8"
    ftp.login(job.username,job.password)
    if job.tls and isinstance(ftp,ftplib.FTP_TLS):
        ftp.prot_p()
    ftp.set_pasv(True)
    return ftp,host

def ftp_list(job):
    ftp,host=ftp_connect(job)
    try:
        path=job.path or "/"
        ftp.cwd(path)
        current=ftp.pwd()
        items=[]
        try:
            for name, facts in ftp.mlsd():
                kind=facts.get("type","unknown")
                size=facts.get("size")
                items.append({"name":name,"type":kind,"size":int(size) if str(size).isdigit() else None,"modified":facts.get("modify")})
        except Exception:
            names=ftp.nlst()
            for name in names:
                items.append({"name":name.rsplit("/",1)[-1],"type":"unknown","size":None,"modified":None})
        return {"ok":True,"host":host,"path":current,"items":items[:500],"tls":job.tls,"scope":"authorized-ftp-access"}
    finally:
        try: ftp.quit()
        except Exception: pass

def ftp_preview(job):
    ftp,host=ftp_connect(job)
    try:
        path=job.path or "/"
        buf=io.BytesIO()
        ftp.retrbinary("RETR "+path,buf.write,blocksize=65536)
        raw=buf.getvalue()
        if len(raw)>250000: raise ValueError("File preview is limited to 250 KB")
        text_value=raw.decode("utf-8")
        return {"ok":True,"host":host,"path":path,"content":text_value,"bytes":len(raw),"scope":"authorized-ftp-access"}
    except UnicodeDecodeError:
        return {"ok":False,"error":"Binary/non-text file; preview is disabled","scope":"authorized-ftp-access"}
    finally:
        try: ftp.quit()
        except Exception: pass

def normalize_target(raw):
    value=raw.strip()
    if not value: raise ValueError("Target is required")
    if "://" not in value: value="https://"+value
    p=urlparse(value)
    if p.scheme not in {"http","https"} or not p.hostname or p.username or p.password:
        raise ValueError("Only public HTTP/HTTPS targets are allowed")
    host=p.hostname.lower()
    if host in {"localhost","localhost.localdomain"} or host.endswith((".local",".internal",".localhost")):
        raise ValueError("Private/local targets are blocked")
    try:
        infos=socket.getaddrinfo(host,None)
        if not infos: raise ValueError("Target DNS could not be resolved")
        for i in infos:
            ip=ipaddress.ip_address(i[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
                raise ValueError("Private/local target is blocked")
    except socket.gaierror as e:
        raise ValueError("Target DNS could not be resolved") from e
    port=p.port or (443 if p.scheme=="https" else 80)
    return {"url":value,"host":host,"port":port,"scheme":p.scheme,"domain":host}

def tool_target(spec,target):
    if spec["kind"]=="url": return target["url"]
    if spec["kind"]=="domain": return target["domain"]
    if spec["kind"]=="tls": return f'{target["host"]}:{target["port"]}'
    return target["host"]

async def execute_tool(name,target,timeout):
    spec=TOOLS[name]
    cmd=[spec["bin"],*spec["args"]]
    if name=="subfinder": cmd += ["-d",target["domain"]]
    elif name=="dnsrecon": cmd += ["-d",target["domain"]]
    elif name=="httpx": cmd += ["-u",target["url"]]
    elif name=="nikto": cmd += ["-host",target["url"]]
    else: cmd += [tool_target(spec,target)]
    try:
        p=await asyncio.create_subprocess_exec(*cmd,stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE)
        out,err=await asyncio.wait_for(p.communicate(),timeout=timeout)
        return {"ok":p.returncode==0,"exitCode":p.returncode,"stdout":out.decode("utf-8","replace")[-40000:],"stderr":err.decode("utf-8","replace")[-10000:]}
    except asyncio.TimeoutError:
        try:p.kill()
        except ProcessLookupError:pass
        return {"ok":False,"exitCode":408,"stdout":"","stderr":"Tool execution timed out"}


class SafeRedirectHandler(__import__('urllib.request',fromlist=['HTTPRedirectHandler']).HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        normalize_target(newurl)
        return super().redirect_request(req,fp,code,msg,headers,newurl)

def public_fetch(url, timeout=8):
    import urllib.request
    opener=urllib.request.build_opener(SafeRedirectHandler())
    req=urllib.request.Request(url,headers={'User-Agent':'NOB-Public-Surface/1.0','Accept':'text/html,application/xhtml+xml,*/*'})
    with opener.open(req,timeout=timeout) as r:
        data=r.read(250000)
        return {'status':r.status,'url':r.geturl(),'content_type':r.headers.get('content-type',''),'text':data.decode('utf-8','replace')}

def extract_public_surface(target):
    from html.parser import HTMLParser
    from urllib.parse import urljoin,urlparse
    class P(HTMLParser):
        def __init__(self,base):
            super().__init__(); self.base=base; self.links=[]; self.scripts=[]; self.assets=[]; self.forms=[]
        def handle_starttag(self,tag,attrs):
            d=dict(attrs); key={'a':'href','script':'src','link':'href','img':'src','iframe':'src','source':'src'}.get(tag)
            if key and d.get(key):
                u=urljoin(self.base,d[key])
                if u.startswith(('http://','https://')):
                    if tag=='script': self.scripts.append(u)
                    elif tag=='a': self.links.append(u)
                    else: self.assets.append(u)
            if tag=='form': self.forms.append({'method':d.get('method','GET').upper(),'url':urljoin(self.base,d.get('action') or self.base)})
    root=public_fetch(target['url']); base=root['url']; parser=P(base); parser.feed(root['text']); origin=urlparse(base).netloc
    pages=[]; seen=set()
    for u in [base]+parser.links:
        p=urlparse(u)
        if p.scheme in ('http','https') and p.netloc==origin and u not in seen and len(pages)<15: seen.add(u); pages.append(u)
    endpoints=[]; files=[]
    def add_endpoint(method,u,source):
        if urlparse(u).netloc!=origin:return
        item={'method':method,'url':u,'source':source}
        if not any(x['method']==method and x['url']==u for x in endpoints): endpoints.append(item)
    for f in parser.forms: add_endpoint(f['method'],f['url'],base)
    import re
    for u in parser.scripts[:30]:
        files.append({'kind':'script','url':u})
        try:
            js=public_fetch(u,6)['text']
            for raw in re.findall(r"['\"]((?:https?://|/)[^'\"\\s<>]{1,300})['\"]",js):
                full=urljoin(u,raw)
                if any(x in full.lower() for x in ('/api/','/graphql','/rest/','/ajax/','/json/','/search/','/upload/','/auth/')): add_endpoint('GET',full,u)
        except Exception: pass
    for u in parser.assets[:40]: files.append({'kind':'asset','url':u})
    for page in pages[1:]:
        try:
            pg=public_fetch(page,6); pp=P(pg['url']); pp.feed(pg['text'])
            for f in pp.forms: add_endpoint(f['method'],f['url'],page)
            for u in pp.scripts[:10]:
                if not any(x['url']==u for x in files): files.append({'kind':'script','url':u})
        except Exception: pass
    return {'ok':True,'target':target['url'],'finalUrl':base,'status':root['status'],'pages':pages,'endpoints':endpoints[:120],'forms':parser.forms[:60],'files':files[:80],'counts':{'pages':len(pages),'endpoints':len(endpoints),'forms':len(parser.forms),'files':len(files)},'scope':'public-surface-discovery'}

@app.post('/public-surface')
async def public_surface(job:DeepJob):
    try: target=normalize_target(job.target)
    except ValueError as e: raise HTTPException(400,str(e))
    try: return extract_public_surface(target)
    except Exception as e: return {'ok':False,'error':str(e)[:300],'scope':'public-surface-discovery'}

@app.post("/ftp/list")
async def ftp_list_route(job:FTPJob):
    try:
        return await asyncio.to_thread(ftp_list,job)
    except (ValueError,ftplib.all_errors) as e:
        raise HTTPException(400,str(e)[:400])

@app.post("/ftp/preview")
async def ftp_preview_route(job:FTPJob):
    try:
        return await asyncio.to_thread(ftp_preview,job)
    except (ValueError,ftplib.all_errors) as e:
        raise HTTPException(400,str(e)[:400])

@app.get("/health")
async def health(): return {"ok":True,"service":"NOB Runner","version":"2.1","tools":sorted(TOOLS),"modules":["public-surface","authorized-ftp-browser"]}

@app.post("/run")
async def run(job:Job):
    if job.tool not in TOOLS: raise HTTPException(400,"Tool is not enabled")
    try:target=normalize_target(job.target)
    except ValueError as e:raise HTTPException(400,str(e))
    result=await execute_tool(job.tool,target,job.timeout)
    return {"ok":True,"tool":job.tool,"target":target,"result":result,"scope":"authorized-public-assessment"}

@app.post("/deep-scan")
async def deep_scan(job:DeepJob):
    try:target=normalize_target(job.target)
    except ValueError as e:raise HTTPException(400,str(e))
    names=("dnsrecon","subfinder","httpx","whatweb","wafw00f","nmap","sslscan","nikto")
    results={}
    sem=asyncio.Semaphore(4)
    async def one(name):
        async with sem:
            results[name]=await execute_tool(name,target,job.timeout)
    await asyncio.gather(*(one(name) for name in names))
    return {"ok":True,"target":target,"scope":"authorized-public-assessment","engine":"NOB Unified Deep Scan","results":results}
