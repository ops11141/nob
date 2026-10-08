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
  const timer=setTimeout(()=>controller.abort(),10000);
  try{
    onProgress({label:'تحميل الصفحة العامة',percent:15});
    const response=await fetch(target.url,{method:'GET',redirect:'follow',credentials:'omit',cache:'no-store',signal:controller.signal});
    const html=await response.text();
    const doc=new DOMParser().parseFromString(html,'text/html');
    const base=new URL(response.url);
    const resolve=(value)=>{try{return new URL(value,base).href}catch{return null}};
    const resources=[];
    const add=(kind,url,method='GET',extra={})=>{
      const u=resolve(url); if(!u) return;
      resources.push({kind,url:u,method,...extra});
    };
    doc.querySelectorAll('script[src]').forEach(x=>add('script',x.getAttribute('src')));
    doc.querySelectorAll('link[href]').forEach(x=>add('link',x.getAttribute('href')));
    doc.querySelectorAll('img[src],source[src]').forEach(x=>add('asset',x.getAttribute('src')));
    doc.querySelectorAll('iframe[src]').forEach(x=>add('iframe',x.getAttribute('src')));
    doc.querySelectorAll('form').forEach(x=>{
      add('form',x.getAttribute('action')||base.href,(x.getAttribute('method')||'GET').toUpperCase(),{
        fields:[...x.querySelectorAll('input[name],textarea[name],select[name]')].map(i=>i.getAttribute('name')).filter(Boolean)
      });
    });
    const scripts=[...doc.querySelectorAll('script[src]')].map(x=>resolve(x.getAttribute('src'))).filter(Boolean);
    const endpointHints=[];
    onProgress({label:'تحليل الملفات والنماذج',percent:45});
    for(const url of scripts.slice(0,30)){
      try{
        const sr=await fetch(url,{credentials:'omit',cache:'no-store'});
        if(!sr.ok) continue;
        const text=await sr.text();
        const patterns=[
          /(?:fetch|axios\.(?:get|post|put|delete)|url\s*:)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
          /['"`]((?:https?:\/\/|\/)[^'"`\s]{2,300})['"`]/g
        ];
        for(const re of patterns){
          let m;
          while((m=re.exec(text))!==null){
            const raw=m[1];
            if(/^(\/|https?:\/\/)/i.test(raw)){
              const u=resolve(raw);
              if(u && !endpointHints.some(x=>x.url===u)) endpointHints.push({url:u,source:url});
            }
          }
        }
      }catch{}
    }
    onProgress({label:'تصنيف الطلبات العامة',percent:80});
    const unique=resources.filter((x,i,a)=>i===a.findIndex(y=>y.url===x.url&&y.method===x.method));
    const endpoints=endpointHints.filter(x=>x.url.startsWith(base.origin));
    onProgress({label:'اكتمل الاستكشاف',percent:100});
    return {
      ok:true,target:target.display,finalUrl:response.url,status:response.status,
      title:doc.title||'',resources:unique,endpoints,
      forms:unique.filter(x=>x.kind==='form'),
      counts:{resources:unique.length,endpoints:endpoints.length,forms:unique.filter(x=>x.kind==='form').length},
      scope:'public-surface-discovery'
    };
  }catch(e){
    return {ok:false,error:e.name==='AbortError'?'timeout':(e.message||'blocked'),scope:'public-surface-discovery'};
  }finally{clearTimeout(timer);}
}
