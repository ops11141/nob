import asyncio, ipaddress, socket, io, ssl, ftplib, re, os, shlex
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app=FastAPI(title="NOB Runner", version="2.2")
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

class KaliJob(BaseModel):
    tool:str
    target:str
    timeout:int=Field(default=90,ge=10,le=180)
    command:str=Field(default="",max_length=2000)

KALI_SAFE_PROFILES={
 "sql":["sqlmap","-u"],
 "wp":["wpscan","--no-update","--enumerate","ap,at","--url"],
 "zap":["zap-baseline.py","-t"],
 "proxy":["burpsuite","--version"],
 "meta":["msfconsole","-q","-x","version; exit"],
 "hydra":["hydra","-h"]
}

class FTPJob(BaseModel):
    host:str
    port:int=Field(default=21,ge=1,le=65535)
    username:str=Field(default="anonymous",max_length=160)
    password:str=Field(default="",max_length=512)
    path:str=Field(default="/",max_length=2048)
    tls:bool=False
    timeout:int=Field(default=15,ge=5,le=60)

class DBJob(BaseModel):
    engine:str
    host:str
    port:int
    username:str=Field(max_length=160)
    password:str=Field(default="",max_length=512)
    database:str=Field(default="",max_length=160)
    query:str=Field(default="",max_length=8000)
    timeout:int=Field(default=20,ge=5,le=60)
    max_rows:int=Field(default=200,ge=1,le=1000)

def validate_public_host(raw, label="target"):
    host=(raw or "").strip().lower()
    if not host: raise ValueError(f"{label} is required")
    if "://" in host: host=urlparse(host).hostname or ""
    if host in {"localhost","localhost.localdomain"} or host.endswith((".local",".internal",".localhost")):
        raise ValueError(f"Private/local {label} is blocked")
    try:
        infos=socket.getaddrinfo(host,None)
        if not infos: raise ValueError(f"{label} DNS could not be resolved")
        for i in infos:
            ip=ipaddress.ip_address(i[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
                raise ValueError(f"Private/local {label} is blocked")
    except socket.gaierror as e:
        raise ValueError(f"{label} DNS could not be resolved") from e
    return host

def ftp_connect(job):
    host=validate_public_host(job.host,"FTP host")
    cls=ftplib.FTP_TLS if job.tls else ftplib.FTP
    ftp=cls(); ftp.connect(host,job.port,timeout=job.timeout); ftp.encoding="utf-8"
    ftp.login(job.username,job.password)
    if job.tls and isinstance(ftp,ftplib.FTP_TLS): ftp.prot_p()
    ftp.set_pasv(True)
    return ftp,host

def ftp_list(job):
    ftp,host=ftp_connect(job)
    try:
        path=job.path or "/"; ftp.cwd(path); current=ftp.pwd(); items=[]
        try:
            for name,facts in ftp.mlsd():
                kind=facts.get("type","unknown"); size=facts.get("size")
                items.append({"name":name,"type":kind,"size":int(size) if str(size).isdigit() else None,"modified":facts.get("modify")})
        except Exception:
            for name in ftp.nlst(): items.append({"name":name.rsplit("/",1)[-1],"type":"unknown","size":None,"modified":None})
        return {"ok":True,"host":host,"path":current,"items":items[:500],"tls":job.tls,"scope":"authorized-ftp-access"}
    finally:
        try: ftp.quit()
        except Exception: pass

def ftp_preview(job):
    ftp,host=ftp_connect(job)
    try:
        path=job.path or "/"; buf=io.BytesIO()
        ftp.retrbinary("RETR "+path,buf.write,blocksize=65536); raw=buf.getvalue()
        if len(raw)>250000: raise ValueError("File preview is limited to 250 KB")
        return {"ok":True,"host":host,"path":path,"content":raw.decode("utf-8"),"bytes":len(raw),"scope":"authorized-ftp-access"}
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
    validate_public_host(host,"target")
    port=p.port or (443 if p.scheme=="https" else 80)
    return {"url":value,"host":host,"port":port,"scheme":p.scheme,"domain":host}

def tool_target(spec,target):
    if spec["kind"]=="url": return target["url"]
    if spec["kind"]=="domain": return target["domain"]
    if spec["kind"]=="tls": return f'{target["host"]}:{target["port"]}'
    return target["host"]

async def execute_tool(name,target,timeout):
    spec=TOOLS[name]; cmd=[spec["bin"],*spec["args"]]
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

class SafeRedirectHandler(__import__("urllib.request",fromlist=["HTTPRedirectHandler"]).HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        normalize_target(newurl); return super().redirect_request(req,fp,code,msg,headers,newurl)

def public_fetch(url,timeout=8):
    import urllib.request
    opener=urllib.request.build_opener(SafeRedirectHandler())
    req=urllib.request.Request(url,headers={"User-Agent":"NOB-Public-Surface/1.0","Accept":"text/html,application/xhtml+xml,*/*"})
    with opener.open(req,timeout=timeout) as r:
        data=r.read(250000)
        return {"status":r.status,"url":r.geturl(),"content_type":r.headers.get("content-type",""),"text":data.decode("utf-8","replace")}

def extract_public_surface(target):
    from html.parser import HTMLParser
    from urllib.parse import urljoin,urlparse
    class P(HTMLParser):
        def __init__(self,base): super().__init__(); self.base=base; self.links=[]; self.scripts=[]; self.assets=[]; self.forms=[]
        def handle_starttag(self,tag,attrs):
            d=dict(attrs); key={"a":"href","script":"src","link":"href","img":"src","iframe":"src","source":"src"}.get(tag)
            if key and d.get(key):
                u=urljoin(self.base,d[key])
                if u.startswith(("http://","https://")):
                    if tag=="script": self.scripts.append(u)
                    elif tag=="a": self.links.append(u)
                    else: self.assets.append(u)
            if tag=="form": self.forms.append({"method":d.get("method","GET").upper(),"url":urljoin(self.base,d.get("action") or self.base)})
    root=public_fetch(target["url"]); base=root["url"]; parser=P(base); parser.feed(root["text"]); origin=urlparse(base).netloc
    pages=[]; seen=set()
    for u in [base]+parser.links:
        p=urlparse(u)
        if p.scheme in ("http","https") and p.netloc==origin and u not in seen and len(pages)<15: seen.add(u); pages.append(u)
    endpoints=[]; files=[]
    def add_endpoint(method,u,source):
        if urlparse(u).netloc!=origin:return
        if not any(x["method"]==method and x["url"]==u for x in endpoints): endpoints.append({"method":method,"url":u,"source":source})
    for f in parser.forms: add_endpoint(f["method"],f["url"],base)
    for u in parser.scripts[:30]:
        files.append({"kind":"script","url":u})
        try:
            js=public_fetch(u,6)["text"]
            for raw in re.findall(r"""['"]((?:https?://|/)[^'"\\s<>]{1,300})['"]""",js):
                full=urljoin(u,raw)
                if any(x in full.lower() for x in ("/api/","/graphql","/rest/","/ajax/","/json/","/search/","/upload/","/auth/")): add_endpoint("GET",full,u)
        except Exception: pass
    for u in parser.assets[:40]: files.append({"kind":"asset","url":u})
    return {"ok":True,"target":target["url"],"finalUrl":base,"status":root["status"],"pages":pages,"endpoints":endpoints[:120],"forms":parser.forms[:60],"files":files[:80],"counts":{"pages":len(pages),"endpoints":len(endpoints),"forms":len(parser.forms),"files":len(files)},"scope":"public-surface-discovery"}

def db_validate(job):
    engine=job.engine.lower()
    if engine not in {"mysql","mariadb","postgresql"}: raise ValueError("Supported database engines: mysql, mariadb, postgresql")
    host=validate_public_host(job.host,"database host")
    if not job.username: raise ValueError("Database username is required")
    if not job.query.strip(): raise ValueError("A read-only query is required")
    q=job.query.strip().rstrip(";")
    if not re.match(r"^(select|show|describe|desc|explain)\b",q,re.I): raise ValueError("Only read-only SELECT/SHOW/DESCRIBE/EXPLAIN queries are allowed")
    if re.search(r"(--|/\*|\*/|;)",q): raise ValueError("Comments and multiple statements are blocked")
    return engine,host,q

async def db_query(job):
    engine,host,q=db_validate(job)
    import urllib.request
    payload=json.dumps({"engine":engine,"host":host,"port":job.port,"username":job.username,"password":job.password,"database":job.database,"query":q,"timeout":job.timeout,"max_rows":job.max_rows}).encode()
    def call():
        req=urllib.request.Request("http://db-gateway:8788/query",data=payload,headers={"Content-Type":"application/json"},method="POST")
        with urllib.request.urlopen(req,timeout=job.timeout+8) as r:
            return json.loads(r.read().decode("utf-8","replace"))
    try:
        return await asyncio.to_thread(call)
    except Exception as e:
        return {"ok":False,"engine":engine,"host":host,"error":str(e)[:500],"scope":"authorized-read-only-database-access"}

@app.post("/public-surface")
async def public_surface(job:DeepJob):
    try: target=normalize_target(job.target); return extract_public_surface(target)
    except ValueError as e: raise HTTPException(400,str(e))
    except Exception as e: return {"ok":False,"error":str(e)[:300],"scope":"public-surface-discovery"}

@app.post("/ftp/list")
async def ftp_list_route(job:FTPJob):
    try:return await asyncio.to_thread(ftp_list,job)
    except (ValueError,ftplib.all_errors) as e:raise HTTPException(400,str(e)[:400])

@app.post("/ftp/preview")
async def ftp_preview_route(job:FTPJob):
    try:return await asyncio.to_thread(ftp_preview,job)
    except (ValueError,ftplib.all_errors) as e:raise HTTPException(400,str(e)[:400])

@app.post("/db/query")
async def db_query_route(job:DBJob):
    try:return await db_query(job)
    except ValueError as e:raise HTTPException(400,str(e)[:400])
    except Exception as e:raise HTTPException(400,str(e)[:400])

def kali_tools_status():
    import shutil
    specs={"proxy":["burpsuite","burp"],"sql":["sqlmap"],"wp":["wpscan"],"zap":["zaproxy","zap.sh"],"meta":["msfconsole"],"hydra":["hydra"]}
    return {k:{"available":any(shutil.which(x) for x in names)} for k,names in specs.items()}

@app.get("/kali-tools/status")
async def kali_tools_status_route():
    return {"ok":True,"tools":kali_tools_status(),"scope":"authorized-security-assessment"}

def kali_tool_command(job):
    import shutil
    key=job.tool.lower()
    if key not in KALI_SAFE_PROFILES: raise ValueError("Unsupported Kali tool")
    target=normalize_target(job.target)
    if key=="sql":
        return ["sqlmap","-u",target["url"],"--batch","--level=1","--risk=1","--crawl=1"]
    if key=="wp":
        return ["wpscan","--no-update","--url",target["url"],"--enumerate","ap,at"]
    if key=="zap":
        if shutil.which("zap-baseline.py"):
            return ["zap-baseline.py","-t",target["url"]]
        if shutil.which("zaproxy"):
            return ["zaproxy","-dir","/tmp/nob-zap-home","-cmd","-quickurl",target["url"],"-quickprogress"]
        raise ValueError("OWASP ZAP executable is not available")
    if key=="proxy":
        if shutil.which("burpsuite"): return ["burpsuite","--version"]
        if shutil.which("burp"): return ["burp","--version"]
        raise ValueError("Burp Suite executable is not available")
    if key=="meta":
        if not shutil.which("msfconsole"): raise ValueError("Metasploit executable is not available")
        return ["msfconsole","-q","-x","version; exit"]
    if key=="hydra":
        if not shutil.which("hydra"): raise ValueError("Hydra executable is not available")
        return ["hydra","-h"]
    raise ValueError("Unsupported Kali tool")

@app.post("/kali-tools/command")
async def kali_tools_command_route(job:KaliJob):
    import shutil, shlex
    key=job.tool.lower()
    target=normalize_target(job.target)
    raw=job.command.strip()
    if not raw: raise HTTPException(400,"Command is required")
    try: parts=shlex.split(raw)
    except ValueError as e: raise HTTPException(400,f"Invalid command syntax: {e}")
    if not parts: raise HTTPException(400,"Command is required")
    base=parts[0].lower()
    if base in {"sh","bash","zsh","python","python3","perl","ruby","nc","curl","wget","sudo","su"}:
        raise HTTPException(400,"System shell commands are not available in the NOB tool console")
    if key=="sql" and base=="sqlmap":
        if any(x in parts for x in ("--os-shell","--os-cmd","--file-read","--file-write","--dump","--dump-all","--passwords","--sql-shell")):
            raise HTTPException(400,"This SQLmap action is not available in the NOB authorized console")
        cmd=["sqlmap","-u",target["url"],"--batch","--level=1","--risk=1","--crawl=1"]
    elif key=="wp" and base=="wpscan":
        cmd=["wpscan","--no-update","--url",target["url"],"--enumerate","ap,at"]
    elif key=="zap" and base in {"zap-baseline.py","zaproxy","zap.sh"}:
        if shutil.which("zap-baseline.py"): cmd=["zap-baseline.py","-t",target["url"]]
        elif shutil.which("zaproxy"): cmd=["zaproxy","-dir","/tmp/nob-zap-home","-cmd","-quickurl",target["url"],"-quickprogress"]
        else: raise HTTPException(400,"OWASP ZAP executable is not available")
    elif key=="proxy" and base in {"burpsuite","burp"}:
        cmd=[base,"--version"]
    elif key=="meta" and base=="msfconsole":
        if any(x in raw.lower() for x in ("exploit","payload","sessions","shell","meterpreter")):
            raise HTTPException(400,"Exploit, payload and shell actions are not available in the NOB console")
        cmd=["msfconsole","-q","-x","version; exit"]
    elif key=="hydra" and base=="hydra":
        if len(parts)>1 and parts[1] not in {"-h","-U"}: raise HTTPException(400,"Hydra console is limited to help/module-information commands")
        cmd=["hydra",*parts[1:]] if len(parts)>1 else ["hydra","-h"]
    else:
        raise HTTPException(400,"Unsupported command for selected tool")
    try:
        p=await asyncio.create_subprocess_exec(*cmd,stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE)
        out,err=await asyncio.wait_for(p.communicate(),timeout=job.timeout)
        return {"ok":p.returncode==0,"tool":job.tool,"input":raw,"stdout":out.decode("utf-8","replace")[-40000:],"stderr":err.decode("utf-8","replace")[-10000:],"exitCode":p.returncode,"scope":"authorized-security-assessment"}
    except asyncio.TimeoutError:
        try:p.kill()
        except ProcessLookupError:pass
        return {"ok":False,"tool":job.tool,"error":"Tool command timed out","scope":"authorized-security-assessment"}
@app.post("/kali-tools/run")
async def kali_tools_run(job:KaliJob):
    try:
        cmd=kali_tool_command(job)
        p=await asyncio.create_subprocess_exec(*cmd,stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE)
        out,err=await asyncio.wait_for(p.communicate(),timeout=job.timeout)
        return {"ok":p.returncode==0,"tool":job.tool,"target":job.target,"command":" ".join(cmd[:2])+" …","exitCode":p.returncode,"stdout":out.decode("utf-8","replace")[-40000:],"stderr":err.decode("utf-8","replace")[-10000:],"scope":"authorized-security-assessment"}
    except asyncio.TimeoutError:
        try:p.kill()
        except ProcessLookupError:pass
        return {"ok":False,"tool":job.tool,"error":"Tool execution timed out","scope":"authorized-security-assessment"}
    except ValueError as e:
        raise HTTPException(400,str(e))

@app.get("/health")
async def health():
    return {"ok":True,"service":"NOB Runner","version":"2.2","tools":sorted(TOOLS),"modules":["public-surface","authorized-ftp-browser","authorized-read-only-database","isolated-db-gateway"]}

@app.post("/run")
async def run(job:Job):
    if job.tool not in TOOLS:raise HTTPException(400,"Tool is not enabled")
    try:target=normalize_target(job.target)
    except ValueError as e:raise HTTPException(400,str(e))
    result=await execute_tool(job.tool,target,job.timeout)
    return {"ok":True,"tool":job.tool,"target":target,"result":result,"scope":"authorized-public-assessment"}

@app.post("/deep-scan")
async def deep_scan(job:DeepJob):
    try:target=normalize_target(job.target)
    except ValueError as e:raise HTTPException(400,str(e))
    names=("dnsrecon","subfinder","httpx","whatweb","wafw00f","nmap","sslscan","nikto"); results={}; sem=asyncio.Semaphore(4)
    async def one(name):
        async with sem: results[name]=await execute_tool(name,target,job.timeout)
    await asyncio.gather(*(one(name) for name in names))
    return {"ok":True,"target":target,"scope":"authorized-public-assessment","engine":"NOB Unified Deep Scan","results":results}
