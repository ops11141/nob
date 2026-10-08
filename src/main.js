import { normalizeTarget } from './security.js';

const app = document.querySelector('#app');
const RUNNER_URL = (localStorage.getItem('nobRunnerUrl') || 'http://127.0.0.1:8787').replace(/\/$/, '');

app.innerHTML = `
<div class="nob-app">
  <header class="top">
    <div class="brand"><span class="brand-mark">N</span><div><b>NOB</b><small>DEEP SECURITY ENGINE</small></div></div>
    <div id="engineState" class="engine-state"><i></i><span>محرك الفحص</span><b>جاري التحقق</b></div>
  </header>

  <main>
    <nav class="tool-nav"><button id="kaliToolsBtn" type="button">أدوات كالي</button></nav>
    <section class="hero">
      <div class="eyebrow">NOB / UNIFIED WEBSITE INTELLIGENCE</div>
      <h1>افحص موقعك بالكامل<br><em>من رابط واحد.</em></h1>
      <p>أدخل رابط الموقع. NOB ينسّق محركات الاستطلاع والفحص على جهازك، ثم يجمع النتائج في تقرير واحد بدل عرض عشرات الأدوات بشكل منفصل.</p>

      <form id="scanForm" class="url-box">
        <span class="url-icon">⌁</span>
        <input id="target" type="text" inputmode="url" autocomplete="off" spellcheck="false" placeholder="example.com" aria-label="رابط الموقع">
        <button id="scanBtn" type="submit">ابدأ الفحص الشامل <span>←</span></button>
      </form>
      <div class="consent">للمواقع التي تملكها أو لديك تصريح صريح بفحصها فقط.</div>
      <div id="inputError" class="input-error"></div>
    </section>


    <section id="kaliToolsPage" class="kali-page hidden">
      <div class="result-head">
        <div><span>KALI TOOLKIT / LOCAL ENGINES</span><h2>أدوات كالي</h2></div>
        <button id="kaliBackBtn" type="button">العودة</button>
      </div>
      <div class="kali-workspace">
        <aside class="kali-sidebar">
          <div class="kali-brand">KALI <small>TOOLKIT</small></div>
          <div class="kali-menu">
            <button class="kali-menu-item active" data-tool="proxy">Burp Suite</button>
            <button class="kali-menu-item" data-tool="sql">SQLmap</button>
            <button class="kali-menu-item" data-tool="wp">WPScan</button>
            <button class="kali-menu-item" data-tool="zap">OWASP ZAP</button>
            <button class="kali-menu-item" data-tool="meta">Metasploit</button>
            <button class="kali-menu-item" data-tool="hydra">Hydra</button>
          </div>
        </aside>
        <div class="kali-console">
          <div class="kali-toolbar"><div><b id="kaliToolTitle">Burp Suite</b><span id="kaliToolState">جاهز</span></div><button id="kaliOpenBtn" type="button">فتح الأداة</button></div>
          <div class="kali-targetbar"><label>Target</label><input id="kaliTarget" type="text" placeholder="example.com" autocomplete="off"><button id="kaliRunBtn" type="button">تشغيل</button><button id="kaliStatusBtn" type="button">فحص التوفر</button></div>
          <div class="kali-tabs"><button class="active">Dashboard</button><button>Request</button><button>Response</button><button>Console</button><button>Results</button></div>
          <div id="kaliToolPanel" class="kali-tool-panel"></div>
          <div class="kali-commandbar"><input id="kaliCommandInput" type="text" dir="ltr" autocomplete="off" spellcheck="false" placeholder="اكتب أمر الأداة ثم اضغط Enter"><button id="kaliCommandBtn" type="button">تنفيذ الأمر</button></div><pre id="kaliToolOutput" class="kali-terminal">NOB KALI CONSOLE
جاهز لتلقي أوامر الأداة.</pre>
        </div>
      </div>
    </section>

    <section id="scanPanel" class="scan-panel hidden">
      <div class="target-line"><span>الهدف</span><strong id="targetLabel">—</strong><button id="newScan" type="button">فحص جديد</button></div>
      <div class="progress-wrap"><div id="progressBar"></div></div>
      <div class="stages">
        <div data-stage="dns"><i>01</i><span>DNS & Discovery</span><b>انتظار</b></div>
        <div data-stage="web"><i>02</i><span>Web Fingerprint</span><b>انتظار</b></div>
        <div data-stage="network"><i>03</i><span>Services & Ports</span><b>انتظار</b></div>
        <div data-stage="security"><i>04</i><span>Security Assessment</span><b>انتظار</b></div>
        <div data-stage="correlation"><i>05</i><span>Correlation</span><b>انتظار</b></div>
      </div>
      <div id="scanMessage" class="scan-message">جاري تجهيز الفحص…</div>
    </section>

    <section id="results" class="results hidden">
      <div class="result-head">
        <div><span>UNIFIED INTELLIGENCE</span><h2>نتيجة الفحص</h2></div>
        <div id="resultBadge" class="result-badge">اكتمل</div>
      </div>

      <div id="summaryGrid" class="summary-grid"></div>
      <div class="intel-grid">
        <article class="intel-card wide"><div class="card-title"><b>الأصول والاتصال</b><span>DNS / IP / HTTP</span></div><div id="assetData" class="data-list"></div></article>
        <article class="intel-card"><div class="card-title"><b>التقنيات</b><span>FINGERPRINT</span></div><div id="techData" class="chips"></div></article>
        <article class="intel-card"><div class="card-title"><b>WAF / CDN</b><span>DEFENSE LAYER</span></div><div id="wafData" class="data-list"></div></article>
        <article class="intel-card wide"><div class="card-title"><b>الخدمات والمنافذ</b><span>NMAP</span></div><div id="portsData" class="ports"></div></article>
        <article class="intel-card"><div class="card-title"><b>TLS</b><span>SSL/TLS</span></div><div id="tlsData" class="data-list"></div></article>
        <article class="intel-card"><div class="card-title"><b>الملاحظات</b><span>ASSESSMENT</span></div><div id="findingData" class="findings"></div></article>
      </div>

      <details class="raw"><summary>عرض مخرجات المحركات الخام</summary><div id="rawData"></div></details>

      <section id="publicIntel" class="public-intel">
        <div class="result-head">
          <div><span>PUBLIC DATA SURFACE</span><h2>استخراج المعلومات العامة</h2></div>
          <button id="extractPublicBtn" type="button">استخراج المعلومات</button>
        </div>
        <p class="intel-note">يستخرج فقط ما هو متاح للعامة من الموقع المصرح بفحصه: الصفحات والملفات العامة والواجهات والنماذج وrobots.txt وsitemap.xml. لا يتم الدخول إلى قواعد بيانات أو تجاوز صلاحيات الوصول.</p>
        <div id="publicIntelStatus" class="scan-message">لم يبدأ الاستخراج بعد.</div>
        <div id="publicIntelData" class="intel-grid"></div>
      </section>

      <section id="ftpBrowser" class="public-intel">
        <div class="result-head">
          <div><span>AUTHORIZED FILE ACCESS</span><h2>استعراض FTP</h2></div>
          <button id="ftpListBtn" type="button">اتصال واستعراض</button>
        </div>
        <p class="intel-note">للوصول المصرح به فقط. أدخل بيانات حساب FTP/FTPS تملك صلاحية استخدامه. لا توجد وظيفة لتخمين كلمات المرور أو تجاوز تسجيل الدخول.</p>
        <div class="ftp-form">
          <input id="ftpHost" type="text" placeholder="ftp.example.com" autocomplete="off">
          <input id="ftpPort" type="number" value="21" min="1" max="65535" placeholder="21">
          <select id="ftpTls"><option value="false">FTP</option><option value="true">FTPS</option></select>
          <input id="ftpUser" type="text" value="anonymous" placeholder="Username" autocomplete="off">
          <input id="ftpPass" type="password" placeholder="Password" autocomplete="new-password">
          <input id="ftpPath" type="text" value="/" placeholder="/">
        </div>
        <div id="ftpStatus" class="scan-message">لم يتم الاتصال بعد.</div>
        <div id="ftpData" class="intel-grid"></div>
      </section>

      <section id="dbBrowser" class="public-intel">
        <div class="result-head">
          <div><span>AUTHORIZED DATABASE ACCESS</span><h2>استعراض قاعدة البيانات</h2></div>
          <div class="db-actions"><button id="dbSchemaBtn" type="button">اكتشاف الجداول</button><button id="dbQueryBtn" type="button">تنفيذ قراءة</button></div>
        </div>
        <p class="intel-note">للوصول المصرح به فقط. الاتصال يتطلب حسابًا تملكه. يسمح NOB بعمليات القراءة فقط: SELECT / SHOW / DESCRIBE / EXPLAIN، ولا يدعم تجاوز الدخول أو تعديل البيانات.</p>
        <div class="ftp-form">
          <select id="dbEngine"><option value="mysql">MySQL</option><option value="mariadb">MariaDB</option><option value="postgresql">PostgreSQL</option></select>
          <input id="dbHost" type="text" placeholder="db.example.com" autocomplete="off">
          <input id="dbPort" type="number" value="3306" min="1" max="65535">
          <input id="dbName" type="text" placeholder="Database" autocomplete="off">
          <input id="dbUser" type="text" placeholder="Username" autocomplete="off">
          <input id="dbPass" type="password" placeholder="Password" autocomplete="new-password">
        </div>
        <textarea id="dbQuery" rows="4" placeholder="SELECT * FROM table LIMIT 50"></textarea>
        <div id="dbStatus" class="scan-message">لم يتم الاتصال بقاعدة البيانات بعد.</div>
        <div id="dbData" class="intel-grid"></div>
      </section>
    </section>

    <section id="offline" class="offline hidden">
      <div class="offline-icon">!</div>
      <h3>محرك الفحص غير متصل</h3>
      <p>الواجهة جاهزة، لكن محرك NOB على جهازك لم يستجب. شغّل NOB Runner ثم أعد المحاولة.</p>
      <button id="retryEngine" type="button">إعادة التحقق</button>
    </section>
  </main>

  <footer><span>NOB</span> · Unified Cyber Defense · الفحص المصرح به فقط</footer>
</div>`;

const $ = id => document.getElementById(id);
const stageNames = ['dns','web','network','security','correlation'];

function setEngine(ok, text=''){
  const el=$('engineState');
  el.classList.toggle('online',!!ok);
  el.classList.toggle('offline-state',!ok);
  el.querySelector('b').textContent=text || (ok?'جاهز':'غير متصل');
}
async function checkEngine(){
  try{
    const r=await fetch(RUNNER_URL+'/health',{cache:'no-store'});
    const d=await r.json();
    setEngine(!!d.ok,d.ok?'جاهز':'غير متصل');
    return !!d.ok;
  }catch{
    setEngine(false,'غير متصل');
    return false;
  }
}
function stage(name,state='active',message=''){
  document.querySelectorAll('[data-stage]').forEach(x=>{
    const idx=stageNames.indexOf(x.dataset.stage), cur=stageNames.indexOf(name);
    x.classList.toggle('active',x.dataset.stage===name && state!=='done');
    x.classList.toggle('done',cur>=0 && idx<cur || (x.dataset.stage===name&&state==='done'));
  });
  if(message) $('scanMessage').textContent=message;
}
function progress(v){$('progressBar').style.width=Math.max(0,Math.min(100,v))+'%';}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function targetHost(value){try{return new URL(value).hostname}catch{return value}}

function toolOutput(data,name){
  const r=data?.results?.[name];
  return r?.stdout||'';
}
function parseIps(text){
  const set=new Set();
  for(const m of text.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)) set.add(m[0]);
  return [...set].slice(0,20);
}
function parsePorts(text){
  const rows=[];
  for(const line of text.split(/\r?\n/)){
    const m=line.match(/^\s*(\d+)\/(tcp|udp)\s+(open|closed|filtered)\s+([^\s]+)(?:\s+(.*))?$/i);
    if(m) rows.push({port:m[1],proto:m[2],state:m[3],service:m[4],version:m[5]||''});
  }
  return rows.slice(0,40);
}
function parseTech(text){
  const found=new Set();
  const summary=text.match(/Summary\s*:\s*(.+)/i)?.[1];
  if(summary) summary.split(/,\s*/).forEach(x=>{const s=x.trim();if(s)found.add(s)});
  for(const line of text.split(/\r?\n/)){
    const m=line.match(/^\s*\[\s*([^\]]+)\s*\]/);
    if(m) found.add(m[1].trim());
  }
  return [...found].slice(0,24);
}
function parseWaf(text){
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const hit=lines.find(x=>/is behind|waf|firewall/i.test(x));
  return hit ? [hit] : ['لم يتم تأكيد WAF من المحرك.'];
}
function parseTls(text){
  const out=[];
  const protos=[...text.matchAll(/SSLv[23]|TLSv1(?:\.0|\.1|\.2|\.3)?/gi)].map(m=>m[0]);
  [...new Set(protos)].forEach(x=>out.push(x));
  const cert=text.match(/Common Name:\s*([^\n]+)/i); if(cert) out.push('CN: '+cert[1].trim());
  return out.length?out:['لم تتوفر نتيجة TLS.'];
}
function parseFindings(data){
  const all=[];
  const nikto=toolOutput(data,'nikto');
  if(/OSVDB|vulnerab|outdated|interesting/i.test(nikto)) all.push('Nikto: توجد مؤشرات تستحق المراجعة.');
  const nmap=toolOutput(data,'nmap');
  if(/open\s+/i.test(nmap)) all.push('تم العثور على خدمات مفتوحة؛ راجع الخدمات والإصدارات.');
  const waf=toolOutput(data,'wafw00f');
  if(/is behind/i.test(waf)) all.push('تم التعرف على طبقة WAF.');
  if(!all.length) all.push('لم تُستخرج ملاحظة عالية الثقة من الملخص الآلي.');
  return all;
}
function renderResults(data,target){
  const nmap=toolOutput(data,'nmap'), what=toolOutput(data,'whatweb'), dns=toolOutput(data,'dnsrecon');
  const httpx=toolOutput(data,'httpx'), waf=toolOutput(data,'wafw00f'), tls=toolOutput(data,'sslscan');
  const ips=[...new Set([...parseIps(nmap),...parseIps(dns),...parseIps(httpx)])];
  const ports=parsePorts(nmap);
  const tech=[...new Set([...parseTech(what),...parseTech(httpx)])];
  const findings=parseFindings(data);
  $('summaryGrid').innerHTML=[
    ['الأصول',ips.length||'—','IP / DNS'],
    ['المنافذ',ports.length,'OPEN SERVICES'],
    ['التقنيات',tech.length,'FINGERPRINTS'],
    ['المحركات',Object.values(data.results||{}).filter(x=>x.ok).length+'/'+Object.keys(data.results||{}).length,'ENGINES']
  ].map(x=>`<div class="summary-card"><span>${x[0]}</span><strong>${esc(x[1])}</strong><small>${x[2]}</small></div>`).join('');
  $('assetData').innerHTML=[
    `<div><span>النطاق</span><b>${esc(targetHost(target))}</b></div>`,
    `<div><span>IP</span><b>${esc(ips.join(' · ')||'لم يظهر')}</b></div>`,
    `<div><span>النطاقات الفرعية</span><b>${esc(data.results?.subfinder?.stdout?.split(/\r?\n/).filter(Boolean).length||'—')}</b></div>`
  ].join('');
  $('techData').innerHTML=tech.length?tech.map(x=>`<span>${esc(x)}</span>`).join(''):'<em>لم تُحدد</em>';
  $('wafData').innerHTML=parseWaf(waf).map(x=>`<div><span>WAF</span><b>${esc(x)}</b></div>`).join('');
  $('portsData').innerHTML=ports.length?ports.map(p=>`<div class="port-row"><b>${p.port}/${p.proto}</b><span>${esc(p.service)}</span><small>${esc(p.version||p.state)}</small></div>`).join(''):'<em>لا توجد منافذ مفتوحة ظاهرة في الملخص.</em>';
  $('tlsData').innerHTML=parseTls(tls).map(x=>`<div><span>TLS</span><b>${esc(x)}</b></div>`).join('');
  $('findingData').innerHTML=findings.map(x=>`<div class="finding"><i>•</i><span>${esc(x)}</span></div>`).join('');
  $('rawData').innerHTML=Object.entries(data.results||{}).map(([k,v])=>`<section><b>${esc(k)}</b><pre>${esc((v.stdout||v.stderr||'').slice(0,16000))}</pre></section>`).join('');
  $('results').classList.remove('hidden');
}

async function deepScan(target){
  $('scanPanel').classList.remove('hidden'); $('results').classList.add('hidden'); $('offline').classList.add('hidden');
  $('targetLabel').textContent=target;
  progress(4); stage('dns','active','جمع معلومات DNS والاستطلاع العام…');
  await new Promise(r=>setTimeout(r,250));
  stage('web','active','بناء البصمة التقنية وطبقة الحماية…'); progress(22);
  try{
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),600000);
    const r=await fetch(RUNNER_URL+'/deep-scan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({target,timeout:90}),signal:controller.signal,cache:'no-store'});
    clearTimeout(timer);
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.ok) throw new Error(data.detail||data.error||'فشل محرك الفحص');
    stage('network','active','تحليل الخدمات والمنافذ…'); progress(48);
    await new Promise(r=>setTimeout(r,250));
    stage('security','active','تحليل WAF وTLS وطبقة الويب…'); progress(68);
    await new Promise(r=>setTimeout(r,250));
    stage('correlation','active','ربط النتائج وإخراج صورة موحدة…'); progress(88);
    renderResults(data,target);
    progress(100); stage('correlation','done','اكتمل الفحص الشامل.');
    $('resultBadge').textContent='اكتمل';
    return true;
  }catch(e){
    progress(0);
    $('scanPanel').classList.add('hidden');
    $('offline').classList.remove('hidden');
    $('offline').querySelector('p').textContent=e.name==='AbortError'?'انتهت مهلة الفحص.':'تعذر تشغيل محرك NOB: '+e.message;
    return false;
  }
}

$('scanForm').addEventListener('submit',async e=>{
  e.preventDefault(); $('inputError').textContent='';
  let target;
  try{target=normalizeTarget($('target').value.trim());}
  catch(err){$('inputError').textContent=err.message||'أدخل رابطًا صحيحًا يبدأ بـ https://';return;}
  $('scanBtn').disabled=true;$('scanBtn').innerHTML='جاري الفحص… <span>◌</span>';
  const online=await checkEngine();
  if(!online){$('offline').classList.remove('hidden');$('scanBtn').disabled=false;$('scanBtn').innerHTML='ابدأ الفحص الشامل <span>←</span>';return;}
  await deepScan(target.url);
  $('scanBtn').disabled=false;$('scanBtn').innerHTML='ابدأ الفحص الشامل <span>←</span>';
});
$('extractPublicBtn').addEventListener('click',async()=>{
  const btn=$('extractPublicBtn'), status=$('publicIntelStatus'), out=$('publicIntelData');
  btn.disabled=true; btn.textContent='جاري الاستخراج…';
  status.textContent='جاري تحليل الصفحات والملفات العامة والواجهات…'; out.innerHTML='';
  try{
    const target=normalizeTarget($('target').value.trim());
    status.textContent='الاتصال بمحرك NOB لاستخراج المعلومات العامة…';
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),180000);
    const r=await fetch(RUNNER_URL+'/public-surface',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({target:target.url.toString(),timeout:120}),signal:controller.signal,cache:'no-store'});
    clearTimeout(timer);
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.ok) throw new Error(data.detail||data.error||'تعذر استخراج المعلومات العامة');
    const endpoints=(data.endpoints||[]).slice(0,120);
    const forms=(data.forms||[]).slice(0,60);
    const pages=(data.pages||[]).slice(0,60);
    const files=(data.files||[]).slice(0,80);
    out.innerHTML=[
      `<article class="intel-card wide"><div class="card-title"><b>ملخص الاستخراج</b><span>PUBLIC SURFACE</span></div><div class="data-list">
        <div><span>الصفحات</span><b>${pages.length}</b></div>
        <div><span>الملفات العامة</span><b>${files.length}</b></div>
        <div><span>الواجهات / المسارات</span><b>${endpoints.length}</b></div>
        <div><span>النماذج</span><b>${forms.length}</b></div>
        <div><span>robots.txt</span><b>${data.robots?.available?'متاح':'غير متاح'}</b></div>
        <div><span>sitemap.xml</span><b>${data.sitemap?.available?'متاح':'غير متاح'}</b></div>
      </div></article>`,
      `<article class="intel-card wide"><div class="card-title"><b>الواجهات والمسارات العامة</b><span>ENDPOINTS</span></div><div class="data-list">${endpoints.length?endpoints.map(x=>`<div><span>${esc(x.method)}</span><b>${esc(x.url)}</b></div>`).join(''):'<em>لم يتم العثور على مسارات عامة.</em>'}</div></article>`,
      `<article class="intel-card wide"><div class="card-title"><b>الملفات والمصادر العامة</b><span>FILES / CODE</span></div><div class="data-list">${files.length?files.map(x=>`<div><span>${esc(x.kind)}</span><b>${esc(x.url)}</b></div>`).join(''):'<em>لم يتم العثور على ملفات عامة.</em>'}</div></article>`,
      `<article class="intel-card wide"><div class="card-title"><b>النماذج العامة</b><span>FORMS</span></div><div class="data-list">${forms.length?forms.map(x=>`<div><span>${esc(x.method)}</span><b>${esc(x.url)}</b><small>${esc((x.fields||[]).join(', '))}</small></div>`).join(''):'<em>لم يتم العثور على نماذج عامة.</em>'}</div></article>`
    ].join('');
    status.textContent='اكتمل استخراج المعلومات العامة.';
  }catch(e){
    status.textContent='تعذر الاستخراج: '+(e.message||'خطأ غير معروف');
  }finally{
    btn.disabled=false; btn.textContent='استخراج المعلومات';
  }
});

$('ftpListBtn').addEventListener('click',async()=>{
  const btn=$('ftpListBtn'), status=$('ftpStatus'), out=$('ftpData');
  btn.disabled=true; btn.textContent='جاري الاتصال…'; out.innerHTML='';
  try{
    const host=$('ftpHost').value.trim();
    if(!host) throw new Error('أدخل عنوان FTP.');
    const body={
      host,
      port:Number($('ftpPort').value||21),
      tls:$('ftpTls').value==='true',
      username:$('ftpUser').value,
      password:$('ftpPass').value,
      path:$('ftpPath').value||'/',
      timeout:15
    };
    const r=await fetch(RUNNER_URL+'/ftp/list',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.ok) throw new Error(data.detail||data.error||'تعذر الاتصال بـFTP');
    status.textContent=`تم الاتصال بـ ${data.host} — المسار: ${data.path}`;
    const items=data.items||[];
    out.innerHTML=[
      `<article class="intel-card wide"><div class="card-title"><b>محتويات المجلد</b><span>${esc(data.tls?'FTPS':'FTP')}</span></div><div class="data-list">${items.length?items.map(x=>`<div><span>${esc(x.type)}</span><b>${esc(x.name)}</b><small>${x.size==null?'':esc(x.size+' bytes')}</small></div>`).join(''):'<em>المجلد فارغ أو لا توجد عناصر قابلة للعرض.</em>'}</div></article>`,
      `<article class="intel-card wide"><div class="card-title"><b>معاينة ملف نصي</b><span>حتى 250 KB</span></div><div class="data-list"><div><span>المسار</span><input id="ftpPreviewPath" type="text" value="${esc(data.path)}" placeholder="/path/file.json"><button id="ftpPreviewBtn" type="button">معاينة</button></div></div><pre id="ftpPreviewOut" class="ftp-preview"></pre></article>`
    ].join('');
    $('ftpPreviewBtn').addEventListener('click',async()=>{
      const p=$('ftpPreviewPath').value.trim(); if(!p)return;
      const rr=await fetch(RUNNER_URL+'/ftp/preview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...body,path:p}),cache:'no-store'});
      const dd=await rr.json().catch(()=>({}));
      $('ftpPreviewOut').textContent=rr.ok&&dd.ok?dd.content:(dd.detail||dd.error||'تعذر المعاينة');
    });
  }catch(e){
    status.textContent='تعذر الاتصال: '+(e.message||'خطأ غير معروف');
  }finally{
    btn.disabled=false; btn.textContent='اتصال واستعراض';
  }
});


$('dbSchemaBtn').addEventListener('click',async()=>{
  const btn=$('dbSchemaBtn'),status=$('dbStatus'),out=$('dbData');
  btn.disabled=true;btn.textContent='جاري الاكتشاف…';out.innerHTML='';
  try{
    const engine=$('dbEngine').value,host=$('dbHost').value.trim(),database=$('dbName').value.trim();
    if(!host||!$('dbUser').value) throw new Error('أدخل الخادم واسم المستخدم.');
    const qdb=database.replace(/'/g,"''");
    const query=engine==='postgresql'
      ? (database?"SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') AND table_catalog='"+qdb+"' ORDER BY table_schema, table_name, ordinal_position LIMIT 1000":"SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name, ordinal_position LIMIT 1000")
      : (database?"SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM information_schema.columns WHERE TABLE_SCHEMA='"+qdb+"' ORDER BY TABLE_NAME, ORDINAL_POSITION LIMIT 1000":"SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM information_schema.columns ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION LIMIT 1000");
    const body={engine,host,port:Number($('dbPort').value||(engine==='postgresql'?5432:3306)),database,username:$('dbUser').value,password:$('dbPass').value,query,timeout:30,max_rows:1000};
    status.textContent='جاري اكتشاف الجداول والأعمدة…';
    const r=await fetch(RUNNER_URL+'/db/query',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.ok) throw new Error(data.detail||data.error||'تعذر اكتشاف المخطط');
    status.textContent='تم اكتشاف '+(data.rowCount||0)+' سجل من مخطط قاعدة البيانات.';
    out.innerHTML=`<article class="intel-card wide"><div class="card-title"><b>مخطط قاعدة البيانات</b><span>${esc(data.engine)}</span></div><pre class="ftp-preview">${esc((data.rows||[]).join('\\n'))}</pre></article>`;
    $('dbQuery').value=query;
  }catch(e){status.textContent='تعذر الاكتشاف: '+(e.message||'خطأ غير معروف');}
  finally{btn.disabled=false;btn.textContent='اكتشاف الجداول';}
});

$('dbQueryBtn').addEventListener('click',async()=>{
  const btn=$('dbQueryBtn'), status=$('dbStatus'), out=$('dbData');
  btn.disabled=true; btn.textContent='جاري التنفيذ…'; out.innerHTML='';
  try{
    const engine=$('dbEngine').value;
    const host=$('dbHost').value.trim();
    const query=$('dbQuery').value.trim();
    if(!host) throw new Error('أدخل عنوان قاعدة البيانات.');
    if(!query) throw new Error('أدخل استعلام قراءة.');
    if(!/^(select|show|describe|desc|explain)\b/i.test(query) || /(;|--|\/\*|\*\/)/.test(query)){
      throw new Error('يسمح فقط باستعلام قراءة واحد بدون تعليقات أو أوامر متعددة.');
    }
    const body={
      engine,host,
      port:Number($('dbPort').value|| (engine==='postgresql'?5432:3306)),
      database:$('dbName').value.trim(),
      username:$('dbUser').value,
      password:$('dbPass').value,
      query,timeout:20,max_rows:200
    };
    const r=await fetch(RUNNER_URL+'/db/query',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.ok) throw new Error(data.detail||data.error||'تعذر تنفيذ الاستعلام');
    status.textContent=`تم تنفيذ قراءة مصرح بها — ${data.rowCount||0} صف.`;
    const rows=data.rows||[];
    out.innerHTML=`<article class="intel-card wide"><div class="card-title"><b>نتيجة القراءة</b><span>${esc(data.engine)}</span></div><pre class="ftp-preview">${esc(rows.join('\\n'))}</pre></article>`;
  }catch(e){
    status.textContent='تعذر التنفيذ: '+(e.message||'خطأ غير معروف');
  }finally{
    btn.disabled=false; btn.textContent='تنفيذ قراءة';
  }
});


$('kaliToolsBtn').addEventListener('click',async()=>{ $('kaliToolsPage').classList.remove('hidden'); $('scanPanel').classList.add('hidden'); $('results').classList.add('hidden'); window.scrollTo({top:0,behavior:'smooth'}); });
$('kaliBackBtn').addEventListener('click',()=>{ $('kaliToolsPage').classList.add('hidden'); window.scrollTo({top:0,behavior:'smooth'}); });
const kaliMeta={proxy:{title:'Burp Suite',desc:'HTTP/HTTPS Proxy workspace'},sql:{title:'SQLmap',desc:'SQL injection assessment workspace'},wp:{title:'WPScan',desc:'WordPress assessment workspace'},zap:{title:'OWASP ZAP',desc:'Web application assessment workspace'},meta:{title:'Metasploit',desc:'Framework information workspace'},hydra:{title:'Hydra',desc:'Authentication assessment workspace'}};
let activeKaliTool='proxy';
function kaliPanel(){
 const m=kaliMeta[activeKaliTool];
 $('kaliToolTitle').textContent=m.title;
 $('kaliToolState').textContent='READY';
 $('kaliToolPanel').innerHTML='<div class="kali-native-head"><span>KALI TOOL</span><h3>'+m.title+'</h3><p>'+m.desc+'</p></div><div class="kali-native-fields"><label>Target<input id="kaliNativeTarget" value="'+($('kaliTarget')?.value||$('target')?.value||'')+'" placeholder="https://example.com"></label><label>Timeout<input id="kaliNativeTimeout" type="number" value="120" min="10" max="180"></label></div><div class="kali-native-actions"><button type="button" id="kaliNativeRun">Run</button><button type="button" id="kaliNativeStatus">Status</button><button type="button" id="kaliNativeClear">Clear</button></div><div class="kali-native-meta"><span>ENGINE <b>Runner</b></span><span>PROFILE <b>Authorized</b></span><span>OUTPUT <b>Console</b></span></div>';
 $('kaliNativeRun').onclick=kaliRunNative;
 $('kaliNativeStatus').onclick=kaliStatusNative;
 $('kaliNativeClear').onclick=()=>{$('kaliToolOutput').textContent='NOB KALI CONSOLE\nCleared.';};
}
async function kaliCommand(){
 const input=$("kaliCommandInput"), out=$("kaliToolOutput");
 const command=input.value.trim(), target=($("kaliNativeTarget")?.value||$("kaliTarget")?.value||$("target")?.value||"").trim();
 if(!command){out.textContent="اكتب أمرًا أولًا.";input.focus();return;}
 if(!target){out.textContent="Target is required.";return;}
 out.textContent="> "+command+"\n\nجاري التنفيذ…";
 try{
  const r=await fetch(RUNNER_URL+"/kali-tools/command",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({tool:activeKaliTool,target,command,timeout:120}),cache:"no-store"});
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.detail||d.error||"فشل تنفيذ الأمر");
  out.textContent="> "+command+"\n\n"+(d.stdout||"")+(d.stderr?"\n"+d.stderr:"");
 }catch(e){out.textContent="> "+command+"\n\nخطأ: "+e.message;}
 input.focus();
}
async function kaliRunNative(){
 const target=$('kaliNativeTarget').value.trim(), timeout=Number($('kaliNativeTimeout').value)||120, out=$('kaliToolOutput');
 if(!target){out.textContent='Target is required.';return;}
 $('kaliTarget').value=target; out.textContent='Running '+kaliMeta[activeKaliTool].title+'…';
 try{const r=await fetch(RUNNER_URL+'/kali-tools/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tool:activeKaliTool,target,timeout})});const d=await r.json();out.textContent=(d.stdout||'')+(d.stderr?'\n'+d.stderr:'')||JSON.stringify(d,null,2);}
 catch(e){out.textContent='Runner error: '+e.message;}
}
async function kaliStatusNative(){
 const out=$('kaliToolOutput'); out.textContent='Checking '+kaliMeta[activeKaliTool].title+'…';
 try{const r=await fetch(RUNNER_URL+'/kali-tools/status',{cache:'no-store'}),d=await r.json();out.textContent=JSON.stringify(d.tools?.[activeKaliTool]||d,null,2);}
 catch(e){out.textContent='Runner error: '+e.message;}
}
document.querySelectorAll('.kali-menu-item').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.kali-menu-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeKaliTool=b.dataset.tool;kaliPanel();}));
$('kaliRunBtn')?.addEventListener('click',kaliRunNative);
$('kaliStatusBtn')?.addEventListener('click',kaliStatusNative);
$('kaliOpenBtn')?.addEventListener('click',()=>{kaliPanel();$('kaliToolState').textContent='OPEN';});
kaliPanel();
$("kaliCommandBtn")?.addEventListener("click",kaliCommand);
$("kaliCommandInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();kaliCommand();}});

document.querySelectorAll(".kali-status-btn").forEach(btn=>btn.addEventListener('click',async()=>{
  const key=btn.dataset.tool, status=document.querySelector('[data-status="'+key+'"]');
  btn.disabled=true; btn.textContent='جاري التحقق…';
  try{
    const r=await fetch(RUNNER_URL+'/kali-tools/status',{cache:'no-store'}); const d=await r.json();
    const item=d.tools&&d.tools[key]; status.textContent=item&&item.available?'متوفر في Runner':'غير مثبت في Runner';
    status.classList.toggle('ok',!!(item&&item.available));
  }catch(e){status.textContent='تعذر التحقق';}
  finally{btn.disabled=false;btn.textContent='فحص التوفر';}
}));

$('newScan').addEventListener('click',()=>{$('target').focus();window.scrollTo({top:0,behavior:'smooth'});});
$('retryEngine').addEventListener('click',checkEngine);
checkEngine();
