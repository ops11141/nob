import asyncio, os, shlex, socket, ipaddress
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, Field

app=FastAPI(title="NOB Runner", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET","POST","OPTIONS"], allow_headers=["*"])

TOOLS={
 "nmap": {"bin":"nmap","args":["-Pn","-sV","--version-light","-T3"]},
 "whatweb": {"bin":"whatweb","args":["--no-errors","--color=never"]},
 "nikto": {"bin":"nikto","args":["-nointeractive"]},
 "dnsrecon": {"bin":"dnsrecon","args":["-t","std"]},
}

class Job(BaseModel):
    tool:str
    target: str
    timeout:int=Field(default=90,ge=5,le=180)

def public_target(raw):
    value=raw.strip()
    if "://" in value:
        from urllib.parse import urlparse
        p=urlparse(value)
        host=p.hostname
    else: host=value.split("/")[0].split(":")[0]
    if not host: raise ValueError("Invalid target")
    if host.lower() in {"localhost","localhost.localdomain"} or host.lower().endswith((".local",".internal",".localhost")):
        raise ValueError("Private/local targets are blocked")
    try:
        infos=socket.getaddrinfo(host,None)
        for i in infos:
            ip=ipaddress.ip_address(i[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
                raise ValueError("Private/local target is blocked")
    except socket.gaierror:
        pass
    return host

@app.get("/health")
async def health(): return {"ok":True,"service":"NOB Runner","tools":sorted(TOOLS)}

@app.post("/run")
async def run(job:Job):
    if job.tool not in TOOLS: raise HTTPException(400,"Tool is not enabled")
    try: target=public_target(job.target)
    except ValueError as e: raise HTTPException(400,str(e))
    spec=TOOLS[job.tool]
    # Fixed argument templates: user input is never interpreted as shell syntax.
    cmd=[spec["bin"],*spec["args"],target]
    try:
        p=await asyncio.create_subprocess_exec(*cmd,stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE)
        out,err=await asyncio.wait_for(p.communicate(),timeout=job.timeout)
    except asyncio.TimeoutError:
        p.kill()
        raise HTTPException(408,"Tool execution timed out")
    return {"ok":p.returncode==0,"tool":job.tool,"target":target,"exitCode":p.returncode,
            "stdout":out.decode("utf-8","replace")[-50000:],"stderr":err.decode("utf-8","replace")[-12000:]}

@app.options("/run")
async def options(): return {"ok":True}
