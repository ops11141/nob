const MAX_BODY=12000;
const RATE_LIMIT=20;
const WINDOW_MS=60_000;
const buckets=new Map();

function cors(){
  return {
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"content-type",
    "Access-Control-Max-Age":"86400"
  };
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,headers:{"content-type":"application/json; charset=utf-8",...cors()}
  });
}
function isPrivateHost(host){
  const h=host.toLowerCase().replace(/^[|]$/g,"");
  if(h==="localhost"||h.endsWith(".local")||h.endsWith(".internal")||h.endsWith(".localhost")) return true;
  if(h.includes(":")) return true;
  const p=h.split(".").map(Number);
  if(p.length===4&&p.every(Number.isInteger)){
    const [a,b]=p;
    return a===10||a===127||a===0||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168);
  }
  return false;
}
function validateUrl(raw){
  if(typeof raw!=="string"||!raw.trim()) throw new Error("URL is required");
  const u=new URL(raw.trim());
  if(!["http:","https:"].includes(u.protocol)) throw new Error("Only HTTP/HTTPS targets are allowed");
  if(u.username||u.password) throw new Error("Credentials in URL are not allowed");
  if(isPrivateHost(u.hostname)) throw new Error("Private or local targets are not allowed");
  return u;
}
function allowedRedirect(location){
  try{return validateUrl(location)}catch{return null}
}
async function requestSafe(url,method){
  let current=url;
  for(let hop=0;hop<3;hop++){
    const r=await fetch(current.toString(),{
      method,
      redirect:"manual",
      headers:{"user-agent":"NOB-Cyber-Defense/1.0"},
      cf:{cacheTtl:0,cacheEverything:false}
    });
    const location=r.headers.get("location");
    if(location&&r.status>=300&&r.status<400){
      const next=allowedRedirect(new URL(location,current).href);
      if(!next) return {status:r.status,finalUrl:current.href,redirectBlocked:true,headers:r.headers};
      current=next;
      continue;
    }
    return {status:r.status,finalUrl:current.href,headers:r.headers,redirects:hop};
  }
  throw new Error("Too many redirects");
}
function headerObject(h){
  const out={};
  for(const [k,v] of h.entries()){
    if(["set-cookie"].includes(k.toLowerCase())) continue;
    out[k]=v;
  }
  return out;
}
function clientKey(request){
  return request.headers.get("CF-Connecting-IP")||request.headers.get("x-forwarded-for")||"anonymous";
}
function rateLimited(key){
  const now=Date.now();
  const item=buckets.get(key);
  if(!item||now-item.start>WINDOW_MS){buckets.set(key,{start:now,count:1});return false;}
  item.count++;
  return item.count>RATE_LIMIT;
}
export default {
  async fetch(request){
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors()});
    const url=new URL(request.url);
    if(request.method==="GET"&&url.pathname==="/health") return json({ok:true,service:"NOB Backend Scanner",scope:"non-destructive-public-http"});
    if(request.method!=="POST"||url.pathname!=="/scan") return json({ok:false,error:"Not found"},404);
    if(rateLimited(clientKey(request))) return json({ok:false,error:"Rate limit exceeded"},429);
    try{
      const body=await request.json();
      const target=validateUrl(body?.target);
      const methods=Array.isArray(body?.methods)?body.methods:["HEAD","OPTIONS","GET"];
      const safeMethods=methods.filter(x=>["HEAD","OPTIONS","GET"].includes(String(x).toUpperCase())).map(x=>String(x).toUpperCase());
      const unique=[...new Set(safeMethods)];
      const results={};
      for(const method of unique){
        try{
          const r=await requestSafe(target,method);
          results[method]={
            status:r.status,
            finalUrl:r.finalUrl,
            redirects:r.redirects||0,
            redirectBlocked:!!r.redirectBlocked,
            headers:headerObject(r.headers),
            server:r.headers.get("server")||null,
            allow:r.headers.get("allow")||null,
            contentType:r.headers.get("content-type")||null
          };
        }catch(e){
          results[method]={status:null,error:e.message||"request failed"};
        }
      }
      return json({ok:true,target:target.origin+target.pathname,scope:"non-destructive-public-http",results,generatedAt:new Date().toISOString()});
    }catch(e){
      return json({ok:false,error:e.message||"Invalid request"},400);
    }
  }
};