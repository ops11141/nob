const DNS_ENDPOINT='https://cloudflare-dns.com/dns-query';

export function normalizeTarget(raw){
  if(!raw) throw new Error('أدخل رابط الموقع أولاً.');
  let value=raw.trim();
  if(!/^https?:\/\//i.test(value)) value='https://'+value;
  const url=new URL(value);
  if(!['http:','https:'].includes(url.protocol)) throw new Error('يسمح فقط بـ HTTP أو HTTPS.');
  if(!url.hostname || url.hostname==='localhost' || /^127(?:\\.\\d+){3}$/.test(url.hostname) || url.hostname.includes(':')) throw new Error('هذا الفحص مخصص لأهداف ويب عامة، وليس localhost أو عناوين IP داخلية.');
  return {url,display:url.origin+url.pathname,host:url.hostname,protocol:url.protocol.replace(':','')};
}

function makeFinding(severity,code,title,reason,recommendation){return {severity,code,title,reason,recommendation};}
function headerChecks(headers){
  const specs=[
    ['content-security-policy','CSP','يقلل مخاطر حقن المحتوى وXSS في المتصفح.'],
    ['strict-transport-security','HSTS','يفرض استخدام HTTPS بعد زيارة الموقع.'],
    ['x-content-type-options','X-Content-Type-Options','يمنع بعض حالات MIME sniffing.'],
    ['referrer-policy','Referrer-Policy','يحد من تسريب معلومات URL عبر Referer.'],
    ['permissions-policy','Permissions-Policy','يحد من صلاحيات ميزات المتصفح.'],
    ['x-frame-options','X-Frame-Options','يضيف طبقة حماية من clickjacking للمتصفحات الداعمة.']
  ];
  return specs.map(([key,name,description])=>({key,name,description,present:headers.has(key)}));
}

async function dnsLookup(host){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const r=await fetch(DNS_ENDPOINT+'?name='+encodeURIComponent(host)+'&type=A',{headers:{accept:'application/dns-json'},signal:controller.signal,cache:'no-store'});
    if(!r.ok) throw new Error('DNS HTTP '+r.status);
    const j=await r.json();
    return (j.Answer||[]).filter(x=>x.type===1).map(x=>x.data);
  }catch{return [];}
}

async function getHttp(url){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
  try{
    const response=await fetch(url,{method:'GET',redirect:'follow',credentials:'omit',cache:'no-store',signal:controller.signal});
    const text=await response.text();
    return {ok:true,status:response.status,url:response.url,headers:response.headers,text:text.slice(0,200000)};
  }catch(e){return {ok:false,error:e.name==='AbortError'?'timeout':(e.message||'blocked')};}
  finally{clearTimeout(timer);}
}

function analyzeHeaders(target,http){
  const findings=[];const headers=http.ok?http.headers:new Headers();
  const checks=headerChecks(headers);
  if(target.protocol==='https' && !headers.has('strict-transport-security')) findings.push(makeFinding('MEDIUM','HDR-01','HSTS غير ظاهر','لم يظهر Strict-Transport-Security في الاستجابة المقروءة.','فعّل HSTS بعد التأكد من أن جميع موارد الموقع تعمل عبر HTTPS.'));
  if(!headers.has('content-security-policy')) findings.push(makeFinding('MEDIUM','HDR-02','CSP غير ظاهر','لم يظهر Content-Security-Policy في الاستجابة المقروءة.','ضع سياسة CSP مناسبة لتقليل مخاطر XSS وحقن المحتوى.'));
  if(!headers.has('x-content-type-options')) findings.push(makeFinding('LOW','HDR-03','X-Content-Type-Options غير ظاهر','لم يظهر الرأس في الاستجابة.','استخدم nosniff حيث يناسب الموقع.'));
  if(!headers.has('referrer-policy')) findings.push(makeFinding('LOW','HDR-04','Referrer-Policy غير ظاهر','لم يظهر الرأس في الاستجابة.','حدد سياسة Referrer-Policy مناسبة لتقليل تسريب معلومات التنقل.'));
  const server=headers.get('server');if(server) findings.push(makeFinding('LOW','INFO-01','Server header مكشوف','الاستجابة تكشف قيمة Server للعامة.','أخفِ التفاصيل غير الضرورية عن إصدار الخادم إن لم تكن مطلوبة.'));
  return {findings,checks,server};
}

function analyzeTechnology(http){
  if(!http.ok)return [];
  const out=[];const server=http.headers.get('server');const powered=http.headers.get('x-powered-by');
  if(server)out.push({category:'HTTP Server',name:server,evidence:'Server header'});
  if(powered)out.push({category:'Runtime',name:powered,evidence:'X-Powered-By header'});
  const html=http.text||'';
  if(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i.test(html)){const m=html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i);out.push({category:'Generator',name:m[1],evidence:'HTML meta generator'});}
  return out;
}

export async function runAuthorizedActiveAssessment(target,onProgress=()=>{}){
  const checks=[];
  const findings=[];
  const request=async(method)=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),7000);
    try{
      const r=await fetch(target.url,{method,redirect:'manual',credentials:'omit',cache:'no-store',signal:controller.signal});
      checks.push({method,status:r.status,allow:r.headers.get('allow')||''});
      return r;
    }catch(e){
      checks.push({method,status:null,allow:'',error:e.name==='AbortError'?'timeout':'blocked'});
      return null;
    }finally{clearTimeout(timer);}
  };
  onProgress({label:'Active Validation',percent:20});
  const response=await request('HEAD');
  onProgress({label:'HTTP Methods',percent:55});
  await request('OPTIONS');
  onProgress({label:'Response Controls',percent:80});
  if(response){
    const server=response.headers.get('server');
    if(server) findings.push(makeFinding('LOW','ACT-01','Server disclosure confirmed','تم تأكيد ظهور Server عبر طلب نشط غير تخريبي.','قلل تفاصيل إصدار الخادم الظاهرة للعامة.'));
  }
  onProgress({label:'Active Validation Complete',percent:100});
  return {checks,findings,scope:'non-destructive-active-validation'};
}

export async function runPassiveAssessment(target,onProgress=()=>{}){
  const findings=[];let checks=0;let http=null;let ips=[];
  onProgress({label:'DNS العام',percent:18,step:'dns'});ips=await dnsLookup(target.host);checks++;
  if(!ips.length) findings.push(makeFinding('LOW','DNS-01','تعذر تأكيد DNS العام','لم يمكن الحصول على سجل A عبر محلل DNS العام المستخدم.','تحقق من DNS يدويًا؛ قد يكون السبب حجب الشبكة أو عدم وجود A record وليس مشكلة أمنية.'));
  onProgress({label:'HTTP Response',percent:38,step:'http'});http=await getHttp(target.url);checks++;
  if(!http.ok){
    findings.push(makeFinding('LOW','HTTP-01','الاستجابة غير قابلة للقياس من المتصفح','قد يمنع CORS أو جدار حماية أو الشبكة قراءة الاستجابة. لا نعتبر ذلك ثغرة.','استخدم نسخة الخادم المصرح بها من NOB لاحقًا للحصول على قياس موثوق.'));
  }
  onProgress({label:'Security Headers',percent:62,step:'headers'});
  const headerResult=analyzeHeaders(target,http);findings.push(...headerResult.findings);checks+=headerResult.checks.length;
  if(target.protocol!=='https') findings.push(makeFinding('HIGH','TLS-01','الموقع يستخدم HTTP','الاتصال الأولي غير مشفر بواسطة HTTPS.','فعّل HTTPS وأعد توجيه HTTP إلى HTTPS.'));
  else checks++;
  const technologies=analyzeTechnology(http);
  const exposure=[];
  if(http.ok && http.headers.get('server')) exposure.push({level:'LOW',name:'Server technology disclosure',description:'رأس Server ظاهر في الاستجابة العامة.'});
  if(http.ok && http.headers.get('x-powered-by')) exposure.push({level:'MEDIUM',name:'Runtime disclosure',description:'X-Powered-By يكشف تقنية تشغيلية للعامة.'});
  if(!http.ok) exposure.push({level:'INFO',name:'HTTP visibility limited',description:'لم تتم قراءة الاستجابة من المتصفح؛ لا يوجد استنتاج بوجود بيانات مكشوفة.'});
  onProgress({label:'Risk Analysis',percent:88,step:'risk'});
  const weights={CRITICAL:30,HIGH:18,MEDIUM:9,LOW:3};
  const summary={critical:0,high:0,medium:0,low:0};
  findings.forEach(f=>summary[f.severity.toLowerCase()]++);
  const penalty=findings.reduce((n,f)=>n+(weights[f.severity]||0),0);
  const score=Math.max(0,100-penalty);
  return {
    target:{...target,ips},
    score,findings,exposure,technologies,
    headers:headerResult.checks,
    summary,checks,
    statusMessage:http.ok?'تمت قراءة استجابة HTTP جزئيًا وتحليلها دفاعيًا.':'تعذر قراءة HTTP من المتصفح؛ تم تنفيذ فحوصات عامة محدودة.',
    http:{ok:http.ok,status:http.status||null,finalUrl:http.url||null},
    generatedAt:new Date().toISOString()
  };
}


export async function discoverPublicDataSurface(target,onProgress=()=>{}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  const sameOrigin=(u)=>{try{return new URL(u).origin===new URL(target.url).origin}catch{return false}};
  const resolve=(value,base)=>{try{return new URL(value,base).href}catch{return null}};
  const clean=(u)=>{try{const x=new URL(u);x.hash='';return x.href}catch{return u}};
  const publicGet=async(url,timeout=7000)=>{
    const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
    try{
      const r=await fetch(url,{method:'GET',redirect:'follow',credentials:'omit',cache:'no-store',signal:c.signal});
      const text=await r.text();
      return {ok:true,status:r.status,url:r.url,headers:r.headers,text:text.slice(0,250000)};
    }catch(e){return {ok:false,error:e.name==='AbortError'?'timeout':'blocked'};}
    finally{clearTimeout(t);}
  };
  try{
    onProgress({label:'تحميل الصفحة العامة',percent:10});
    const first=await publicGet(target.url,10000);
    if(!first.ok) return {ok:false,error:first.error,scope:'public-surface-discovery'};
    const base=new URL(first.url),doc=new DOMParser().parseFromString(first.text,'text/html');
    const resources=[],forms=[],pages=[clean(first.url)],seenPages=new Set(pages),endpoints=[];
    const addResource=(kind,url,method='GET',extra={})=>{
      const u=resolve(url,base); if(!u)return;
      resources.push({kind,url:clean(u),method,...extra});
    };
    const addEndpoint=(method,url,source,type='code')=>{
      const u=resolve(url,base); if(!u || !sameOrigin(u))return;
      const item={method:method.toUpperCase(),url:clean(u),source,type};
      if(!endpoints.some(x=>x.method===item.method&&x.url===item.url&&x.source===item.source))endpoints.push(item);
    };
    const scanDocument=(d,pageUrl)=>{
      const b=new URL(pageUrl);
      d.querySelectorAll('script[src]').forEach(x=>addResource('script',x.getAttribute('src')));
      d.querySelectorAll('link[href]').forEach(x=>addResource('link',x.getAttribute('href')));
      d.querySelectorAll('img[src],source[src],video[src],audio[src]').forEach(x=>addResource('asset',x.getAttribute('src')));
      d.querySelectorAll('iframe[src]').forEach(x=>addResource('iframe',x.getAttribute('src')));
      d.querySelectorAll('a[href]').forEach(x=>{
        const u=resolve(x.getAttribute('href'),b);
        if(u&&sameOrigin(u)&&['http:','https:'].includes(new URL(u).protocol)&&!new URL(u).pathname.match(/\.(zip|pdf|jpg|jpeg|png|gif|webp|mp4|mp3)$/i)) pages.push(clean(u));
      });
      d.querySelectorAll('form').forEach(x=>{
        const method=(x.getAttribute('method')||'GET').toUpperCase(),u=resolve(x.getAttribute('action')||pageUrl,b);
        if(u)forms.push({method,url:clean(u),fields:[...x.querySelectorAll('input[name],textarea[name],select[name]')].map(i=>i.getAttribute('name')).filter(Boolean)});
        if(u)addEndpoint(method,u,pageUrl,'form');
      });
    };
    scanDocument(doc,first.url);
    onProgress({label:'تحليل الصفحة والروابط',percent:30});
    const inline=[...doc.querySelectorAll('script:not([src])')].map(x=>x.textContent||'');
    const scripts=[...new Set(resources.filter(x=>x.kind==='script').map(x=>x.url))].slice(0,40);
    const codeSources=[
      {url:first.url,kind:'html',text:first.text},
      ...inline.map((text,i)=>({url:first.url+'#inline-script-'+(i+1),kind:'javascript',text}))
    ];
    for(const url of scripts){
      const sr=await publicGet(url,7000);
      if(sr.ok)codeSources.push({url,kind:'javascript',text:sr.text});
    }
    const stylesheets=[...new Set(resources.filter(x=>x.kind==='link'&&/\.css(?:\?|$)/i.test(x.url)).map(x=>x.url))].slice(0,20);
    for(const url of stylesheets){
      const sr=await publicGet(url,6000);
      if(sr.ok)codeSources.push({url,kind:'css',text:sr.text});
    }
    const methodRegex=/\b(fetch|axios|XMLHttpRequest|\$\.ajax|\$\.get|\$\.post)\s*\(/gi;
    const stringRegex=/['"`]((?:https?:\/\/|\/)[^'"`\s<>]{1,500})['"`]/g;
    const methodMap={fetch:'GET',get:'GET',post:'POST',ajax:'GET',axios:'GET',XMLHttpRequest:'GET'};
    for(const src of codeSources){
      let m;
      while((m=methodRegex.exec(src.text))!==null){
        const method=methodMap[m[1].toLowerCase()]||'GET';
        const windowText=src.text.slice(m.index,m.index+500);
        const s=windowText.match(/['"`]((?:https?:\/\/|\/)[^'"`\s<>]{1,500})['"`]/);
        if(s)addEndpoint(method,s[1],src.url,'javascript');
      }
      while((m=stringRegex.exec(src.text))!==null){
        const raw=m[1];
        if(/\.(?:js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)(?:\?|$)/i.test(raw))continue;
        if(/(?:\/api\/|\/graphql(?:\/|$)|\/rest\/|\/ajax\/|\/json(?:\/|$)|\/search(?:\/|$)|\/upload(?:\/|$)|\/auth(?:\/|$))/i.test(raw)) addEndpoint('GET',raw,src.url,'path-hint');
      }
    }
    onProgress({label:'استكشاف الصفحات العامة',percent:55});
    const crawlQueue=[...new Set(pages)].filter(u=>sameOrigin(u)).slice(0,20);
    for(const url of crawlQueue){
      if(seenPages.has(url) && url!==first.url) continue;
      seenPages.add(url);
      const pr=await publicGet(url,6000);
      if(!pr.ok)continue;
      const pd=new DOMParser().parseFromString(pr.text,'text/html');
      codeSources.push({url:pr.url,kind:'html',text:pr.text});
      scanDocument(pd,pr.url);
      [...pd.querySelectorAll('script:not([src])')].slice(0,10).forEach((x,i)=>codeSources.push({url:pr.url+'#inline-script-'+(i+1),kind:'javascript',text:x.textContent||''}));
      for(const s of [...pd.querySelectorAll('script[src]')].map(x=>resolve(x.getAttribute('src'),new URL(pr.url))).filter(Boolean).slice(0,8)){
        const sr=await publicGet(s,5000); if(sr.ok) codeSources.push({url:s,kind:'javascript',text:sr.text});
      }
      for(const s of [...pd.querySelectorAll('link[href]')].map(x=>resolve(x.getAttribute('href'),new URL(pr.url))).filter(u=>u&&/\.css(?:\?|$)/i.test(u)).slice(0,6)){
        const sr=await publicGet(s,5000); if(sr.ok) codeSources.push({url:s,kind:'css',text:sr.text});
      }
      if(seenPages.size>=20)break;
    }
    onProgress({label:'فحص الملفات العامة',percent:75});
    const robots=await publicGet(new URL('/robots.txt',base).href,5000);
    const sitemap=await publicGet(new URL('/sitemap.xml',base).href,5000);
    const uniqueResources=resources.filter((x,i,a)=>i===a.findIndex(y=>y.kind===x.kind&&y.method===x.method&&y.url===x.url));
    const uniqueEndpoints=endpoints.filter((x,i,a)=>i===a.findIndex(y=>y.method===x.method&&y.url===x.url&&y.type===x.type));
    const uniqueForms=forms.filter((x,i,a)=>i===a.findIndex(y=>y.method===x.method&&y.url===x.url));
    onProgress({label:'اكتمل الاستكشاف',percent:100});
    return {
      ok:true,target:target.display,finalUrl:first.url,status:first.status,title:doc.title||'',
      resources:uniqueResources,endpoints:uniqueEndpoints,forms:uniqueForms,
      files:codeSources.map(x=>({url:x.url,kind:x.kind||'text',type:'public-file-content',content:(x.text||'').slice(0,120000)})),
      pages:[...seenPages],
      robots:{available:robots.ok,status:robots.status||null},
      sitemap:{available:sitemap.ok,status:sitemap.status||null},
      counts:{resources:uniqueResources.length,endpoints:uniqueEndpoints.length,forms:uniqueForms.length,files:codeSources.length,pages:seenPages.size},
      scope:'public-surface-discovery'
    };
  }catch(e){
    return {ok:false,error:e.name==='AbortError'?'timeout':(e.message||'blocked'),scope:'public-surface-discovery'};
  }finally{clearTimeout(timer);}
}
