import asyncio, ipaddress, socket
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

@app.get("/health")
async def health(): return {"ok":True,"service":"NOB Runner","version":"2.0","tools":sorted(TOOLS)}

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
