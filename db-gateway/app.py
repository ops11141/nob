from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import asyncio, ipaddress, socket, re, pymysql
import psycopg

app=FastAPI(title="NOB DB Gateway",version="1.0")

class Job(BaseModel):
    engine:str
    host:str
    port:int=0
    username:str=Field(max_length=160)
    password:str=Field(default="",max_length=512)
    database:str=Field(default="",max_length=160)
    query:str=Field(max_length=8000)
    timeout:int=Field(default=20,ge=5,le=60)
    max_rows:int=Field(default=200,ge=1,le=1000)

def public_host(host):
    try:
        infos=socket.getaddrinfo(host,None,type=socket.SOCK_STREAM)
        ips={x[4][0] for x in infos}
    except Exception: raise ValueError("Database host could not be resolved")
    for raw in ips:
        ip=ipaddress.ip_address(raw)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise ValueError("Private or local database addresses are not allowed")
    return host

def validate(j):
    e=j.engine.lower()
    if e not in {"mysql","mariadb","postgresql"}: raise ValueError("Unsupported database engine")
    public_host(j.host)
    if not j.username: raise ValueError("Database username is required")
    q=j.query.strip().rstrip(";")
    if not re.match(r"^(select|show|describe|desc|explain)\b",q,re.I): raise ValueError("Only read-only queries are allowed")
    if re.search(r"(--|/\*|\*/|;)",q): raise ValueError("Comments and multiple statements are blocked")
    return e,q

async def run(j):
    e,q=validate(j)
    timeout=j.timeout
    def work():
        if e in {"mysql","mariadb"}:
            conn=pymysql.connect(host=j.host,port=j.port or 3306,user=j.username,password=j.password,database=j.database or None,connect_timeout=timeout,read_timeout=timeout,write_timeout=timeout,autocommit=True)
            try:
                with conn.cursor() as c:
                    c.execute(q)
                    rows=c.fetchmany(j.max_rows)
                    return [list(x) for x in rows]
            finally: conn.close()
        conn=psycopg.connect(host=j.host,port=j.port or 5432,user=j.username,password=j.password,dbname=j.database or None,connect_timeout=timeout)
        try:
            with conn.cursor() as c:
                c.execute(q)
                return [list(x) for x in c.fetchmany(j.max_rows)]
        finally: conn.close()
    try:
        rows=await asyncio.wait_for(asyncio.to_thread(work),timeout=timeout+5)
        return {"ok":True,"engine":e,"rows":rows,"rowCount":len(rows),"scope":"authorized-read-only-database-access"}
    except asyncio.TimeoutError: raise HTTPException(408,"Database query timed out")
    except Exception as ex: raise HTTPException(400,str(ex)[:500])

@app.get("/health")
def health(): return {"ok":True,"service":"NOB DB Gateway","version":"1.0"}

@app.post("/query")
async def query(j:Job): return await run(j)
