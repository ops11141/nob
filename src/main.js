const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = new URL('./styles.css', import.meta.url).href;
document.head.appendChild(styleLink);
import { normalizeTarget, runPassiveAssessment, runAuthorizedActiveAssessment, runBackendActiveAssessment, discoverPublicDataSurface } from './security.js';
import { KALI_TOOL_GROUPS, KALI_TOOL_COUNT } from './kali-tools.js';

const app = document.querySelector('#app');

app.innerHTML = `
<div class="app-shell">
  <aside class="sidebar">
    <div class="brand"><div class="brand-mark">N</div><div><strong>NOB</strong><span>CYBER DEFENSE PLATFORM</span></div></div>
    <nav class="nav">
      <button class="nav-item active" data-section="overview">⌂ الرئيسية</button>
      <button class="nav-item" data-section="scan">◉ فحص موقع</button>
      <button class="nav-item" data-section="active">⚡ تحقق نشط</button>
      <button class="nav-item" data-section="discovery">🔎 استكشاف البيانات</button>
      <button class="nav-item" data-section="kali">☠ ترسانة Kali</button>
      <button class="nav-item" data-section="findings">⚠ النتائج والمخاطر</button>
      <button class="nav-item" data-section="exposure">◈ البيانات المكشوفة</button>
      <button class="nav-item" data-section="headers">▣ HTTP / Headers</button>
      <button class="nav-item" data-section="technology">◇ التقنيات</button>
      <button class="nav-item" data-section="report">▤ التقرير</button>
      <button class="nav-item" data-section="about">✓ منهجية الفحص</button>
    </nav>
    <div class="sidebar-bottom">
      <div class="safe-badge"><span>●</span><div><small>وضع الفحص</small><strong>PASSIVE / SAFE</strong></div></div>
      <div class="version">NOB · Cyber Defense</div>
    </div>
  </aside>

  <main class="main">
    <header class="topbar">
      <div><div class="eyebrow">CYBER DEFENSE / WEB ASSESSMENT</div><h1>منصة فحص وحماية المواقع</h1><p>حلّل ما يظهر للعامة، اكتشف نقاط الضعف في الإعدادات، وصنّف خطورة البيانات المكشوفة.</p></div>
      <div class="top-actions"><button class="ghost" id="reset">إعادة ضبط</button></div>
    </header>

    <section id="overview" class="section active-section">
      <div class="hero security-hero">
        <div class="hero-copy">
          <div class="hero-label">NOB CYBER DEFENSE</div>
          <h2>اعرف ماذا يستطيع المهاجم رؤيته من الخارج</h2>
          <p>أدخل نطاقًا تملكه أو لديك تصريح بفحصه. يبدأ NOB بفحوصات دفاعية منخفضة المخاطر، ثم يحوّل النتائج إلى درجة أمنية واضحة وتوصيات قابلة للتنفيذ.</p>
          <div class="hero-actions"><button class="primary-btn" data-go="scan">ابدأ فحصًا آمنًا</button><button class="secondary-btn" data-go="about">شاهد المنهجية</button></div>
        </div>
        <div class="security-orbit"><div class="shield">NOB<br><b>SECURE</b></div><i></i><i></i><i></i></div>
      </div>

      <div class="stats">
        <article class="stat"><span>SECURITY SCORE</span><strong id="score">—</strong><small>من 100</small></article>
        <article class="stat"><span>CRITICAL</span><strong id="critical">0</strong><small>مخاطر حرجة</small></article>
        <article class="stat"><span>HIGH</span><strong id="high">0</strong><small>مخاطر عالية</small></article>
        <article class="stat"><span>MEDIUM</span><strong id="medium">0</strong><small>مخاطر متوسطة</small></article>
        <article class="stat"><span>LOW</span><strong id="low">0</strong><small>ملاحظات منخفضة</small></article>
        <article class="stat"><span>CHECKS</span><strong id="checks">0</strong><small>فحوصات منفذة</small></article>
      </div>

      <div class="grid-main">
        <section class="panel wide">
          <div class="panel-head"><div><h3>محرك التحليل الأمني</h3><p>من URL إلى تقييم واضح بدون استغلال أو تجاوز صلاحيات.</p></div><span class="ready">DEFENSIVE MODE</span></div>
          <div class="module-grid">
            <div class="module"><b>01</b><strong>الهدف والنطاق</strong><span>تحقق من URL وتحديد البروتوكول والنطاق بشكل آمن.</span></div>
            <div class="module"><b>02</b><strong>TLS / HTTPS</strong><span>فحص استخدام HTTPS ومؤشرات الحماية الأساسية.</span></div>
            <div class="module"><b>03</b><strong>Security Headers</strong><span>CSP · HSTS · X-Content-Type-Options وغيرها.</span></div>
            <div class="module"><b>04</b><strong>Cookies</strong><span>Secure · HttpOnly · SameSite عند توفر استجابة HTTP.</span></div>
            <div class="module"><b>05</b><strong>Information Exposure</strong><span>مؤشرات المعلومات التي قد تكشف تفاصيل غير ضرورية.</span></div>
            <div class="module"><b>06</b><strong>Risk Engine</strong><span>تصنيف Critical / High / Medium / Low مع سبب وتوصية.</span></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><div><h3>حالة الفحص</h3><p id="statusText">جاهز لفحص موقع مصرح لك به</p></div></div>
          <div class="pipeline">
            <div class="step done"><i>1</i><span>Target</span><em>جاهز</em></div>
            <div class="step" id="stepDns"><i>2</i><span>Public DNS</span><em>بانتظار</em></div>
            <div class="step" id="stepHttp"><i>3</i><span>HTTP Response</span><em>بانتظار</em></div>
            <div class="step" id="stepHeaders"><i>4</i><span>Headers</span><em>بانتظار</em></div>
            <div class="step" id="stepRisk"><i>5</i><span>Risk Analysis</span><em>بانتظار</em></div>
          </div>
          <div class="progress"><div id="bar"></div></div>
        </section>
        <section class="panel">
          <div class="panel-head"><div><h3>آخر نتيجة</h3><p>ملخص سريع للفحص الحالي.</p></div></div>
          <div id="lastResult" class="empty-state compact"><strong>لا يوجد فحص</strong><span>ابدأ من قسم «فحص موقع».</span></div>
        </section>
      </div>
    </section>

    <section id="scan" class="section">
      <div class="page-title"><span>SAFE ASSESSMENT</span><h2>فحص موقع</h2><p>الفحص هنا دفاعي وPassive؛ لا نحاول تسجيل الدخول أو استغلال الثغرات.</p></div>
      <div class="scan-card">
        <div class="target-input"><label>رابط الموقع</label><input id="target" type="url" inputmode="url" placeholder="https://example.com" autocomplete="off"><button id="scanBtn">ابدأ الفحص</button></div>
        <div class="consent"><span>✓</span> استخدم الفحص فقط على المواقع التي تملكها أو لديك تصريح صريح بفحصها.</div>
      </div>
      <div class="scan-note"><b>ملاحظة تقنية:</b> نسخة GitHub Pages تعمل داخل المتصفح، لذلك بعض اختبارات HTTP قد يمنعها CORS. عندها تُسجل كـ «غير قابل للقياس» بدل اعتبار الموقع ضعيفًا.</div>
      <div id="targetSummary" class="target-summary"></div>
    </section>

    <section id="active" class="section">
      <div class="page-title"><span>ACTIVE VALIDATION</span><h2>التحقق النشط</h2><p>طبقة اختبار نشطة غير تخريبية للتأكد من بعض المؤشرات بدل الاعتماد على التخمين.</p></div>
      <div class="scan-card">
        <div class="target-input backend-input"><label>NOB Backend</label><input id="backendUrl" type="url" inputmode="url" placeholder="https://nob-backend-scanner.example.workers.dev" autocomplete="off"><button id="saveBackend" type="button">حفظ الربط</button></div>
        <div id="backendStatus" class="scan-note"><b>حالة الخادم:</b> غير مربوط — سيستخدم الفحص المحلي للمتصفح.</div>
        <div class="active-mode"><div><strong>Authorized Active Validation</strong><span>الخادم يقرأ HEAD / OPTIONS / GET من خارج المتصفح، بدون تسجيل دخول أو تغيير بيانات أو تنفيذ استغلال.</span></div><button id="activeBtn">ابدأ التحقق النشط</button></div>
        <div id="activeResult" class="empty-state compact"><strong>لم يبدأ التحقق</strong><span>نفّذ فحصًا أساسيًا أولًا ثم شغّل التحقق النشط على نفس الهدف.</span></div>
      </div>
    </section>

    <section id="discovery" class="section">
      <div class="page-title"><span>PUBLIC DATA DISCOVERY</span><h2>استكشاف البيانات والطلبات</h2><p>يستخرج NOB البصمة العامة للصفحة والملفات والنماذج ومؤشرات الـ endpoints الظاهرة، بدون تسجيل دخول أو تجاوز حماية.</p></div>
      <div class="scan-card">
        <div class="active-mode"><div><strong>Public Surface Discovery</strong><span>HTML · JS · CSS · Forms · GET/POST/PUT/DELETE · API · صفحات عامة · Robots/Sitemap</span></div><button id="discoveryBtn">ابدأ الاستكشاف</button></div>
        <div id="discoveryResult" class="empty-state compact"><strong>لم يبدأ الاستكشاف</strong><span>نفّذ فحصًا أساسيًا أولًا ثم استكشف السطح العام لنفس الهدف.</span></div>
      </div>
      <div class="scan-card" style="margin-top:16px">
        <div class="target-input"><label>بحث داخل البيانات المستخرجة</label><input id="discoverySearch" type="search" placeholder="ابحث عن اسم ملف، endpoint، URL، كلمة، API..." autocomplete="off"><button id="clearDiscoverySearch" type="button">مسح</button></div>
        <div id="discoverySearchMeta" class="scan-note">لم يتم استخراج بيانات بعد.</div>
      </div>
      <div id="discoveryTable" class="finding-list"></div>
    </section>

    <section id="kali" class="section">
      <div class="page-title"><span>KALI SECURITY ARSENAL</span><h2>ترسانة أدوات Kali Linux</h2><p>واجهة موحدة لفهرسة أدوات Kali وتصنيفها وربطها لاحقًا بمحرك تنفيذ آمن. الصفحة لا تثبّت Kali داخل المتصفح ولا تشغّل أوامر على جهازك.</p></div>
      <div class="kali-toolbar scan-card">
        <div class="target-input">
          <label>بحث في أدوات Kali</label>
          <input id="kaliSearch" type="search" placeholder="ابحث: nmap، Burp، Wi-Fi، OSINT..." autocomplete="off">
          <button id="kaliClear" type="button">مسح</button>
        </div>
        <div class="kali-stats"><span><b id="kaliCount"></b> أداة مفهرسة</span><span><b id="kaliGroups"></b> أقسام</span><span><b>OFFICIAL</b> مرجع Kali</span></div>
      </div>
      <div class="scan-note kali-note"><b>مهم:</b> Kali يوفر مئات الأدوات عبر مجموعاته الرسمية، ومنها جمع المعلومات، الويب، الثغرات، كلمات المرور، اللاسلكي، الهندسة العكسية، الطب الشرعي وغيرها. سنفصل بين الأدوات الآمنة/الاستطلاعية والأدوات النشطة، ولن نجعل NOB منصة لاستغلال أهداف غير مصرح بها.</div>
      <div id="kaliCatalog" class="kali-catalog"></div>
    </section>

    <section id="findings" class="section">
      <div class="page-title"><span>RISK ENGINE</span><h2>النتائج والمخاطر</h2><p>كل ملاحظة لها مستوى خطورة وسبب وتوصية.</p></div>
      <div id="findingsList" class="finding-list"><div class="empty-state"><strong>لا توجد نتائج بعد</strong><span>شغّل فحصًا أولًا.</span></div></div>
    </section>

    <section id="exposure" class="section">
      <div class="page-title"><span>DATA EXPOSURE</span><h2>البيانات المكشوفة</h2><p>نصنف المعلومات الظاهرة للعامة بدون محاولة استخراج بيانات خاصة أو تجاوز الحماية.</p></div>
      <div class="exposure-grid" id="exposureGrid"><div class="empty-state"><strong>بانتظار الفحص</strong><span>ستظهر هنا مؤشرات الإفصاح العام، وليس بيانات الاعتماد أو المحتوى الخاص.</span></div></div>
    </section>

    <section id="headers" class="section">
      <div class="page-title"><span>HTTP SECURITY</span><h2>HTTP / Security Headers</h2><p>حالة أهم رؤوس الحماية عند توفر استجابة HTTP قابلة للقراءة.</p></div>
      <div id="headersTable" class="header-table"><div class="empty-state"><strong>لا توجد استجابة مفحوصة</strong><span>ابدأ فحصًا أولًا.</span></div></div>
    </section>

    <section id="technology" class="section">
      <div class="page-title"><span>TECHNOLOGY</span><h2>التقنيات والمؤشرات</h2><p>مؤشرات عامة يمكن استنتاجها من الاستجابة العامة فقط.</p></div>
      <div id="techGrid" class="tech-grid"><div class="empty-state"><strong>بانتظار الفحص</strong><span>لن نحاول اختراق الموقع لمعرفة التقنيات المخفية.</span></div></div>
    </section>

    <section id="report" class="section">
      <div class="page-title"><span>SECURITY REPORT</span><h2>التقرير</h2><p>ملخص قابل للمراجعة لنتيجة الفحص.</p></div>
      <div id="reportCard" class="report-card"><div class="empty-state"><strong>التقرير غير متاح</strong><span>نفذ فحصًا أولًا.</span></div></div>
    </section>

    <section id="about" class="section">
      <div class="page-title"><span>METHODOLOGY</span><h2>منهجية NOB</h2><p>نبدأ بالأمان والخصوصية قبل عمق الفحص.</p></div>
      <div class="principles security-principles">
        <div><strong>Passive أولًا</strong><span>لا استغلال للثغرات ولا تخطي للمصادقة.</span></div>
        <div><strong>لا بيانات خاصة</strong><span>لا نحاول جمع كلمات مرور أو Tokens أو بيانات مستخدمين.</span></div>
        <div><strong>عدم اليقين واضح</strong><span>إذا منع CORS قياس شيء، نعرضه كغير قابل للقياس بدل تخمين النتيجة.</span></div>
        <div><strong>الإصلاح أهم من الاكتشاف</strong><span>كل Finding مهم يتبعه تفسير وتوصية دفاعية.</span></div>
      </div>
      <div class="panel methodology-panel"><h3>مراحل التطوير</h3><div class="roadmap"><span>01 Passive URL</span><span>02 Headers & TLS</span><span>03 DNS & Exposure</span><span>04 Risk Scoring</span><span>05 Reports</span><span>06 Backend Scanner مُصرّح</span></div></div>
    </section>

    <div id="toast" class="toast"></div>
    <div class="footer">NOB — Cyber Defense Platform · للاستخدام الدفاعي والمصرح به فقط</div>
  </main>
</div>`;

const $ = id => document.getElementById(id);
let backendUrl=localStorage.getItem('nobBackendUrl')||'';
const sections = [...document.querySelectorAll('.section')];
let state = null;

function showSection(id){
  sections.forEach(s=>s.classList.toggle('active-section',s.id===id));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.section)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.go)));

function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800);}
function setProgress(p,msg){
  const percent=typeof p==='number'?p:(p?.percent??0);
  $('bar').style.width=percent+'%';
  $('statusText').textContent=msg;
  const step=p?.step;
  const map={dns:'stepDns',http:'stepHttp',headers:'stepHeaders',risk:'stepRisk'};
  if(step&&map[step]){
    const el=$(map[step]);
    const steps=[['stepDns','dns'],['stepHttp','http'],['stepHeaders','headers'],['stepRisk','risk']];
    steps.forEach(([id,key])=>{
      const node=$(id);
      const idx=steps.findIndex(x=>x[1]===key);
      const cur=steps.findIndex(x=>x[1]===step);
      node.classList.toggle('done',idx<cur);
      node.classList.toggle('active',idx===cur);
      node.querySelector('em').textContent=idx<cur?'تم':idx===cur?'جاري':'بانتظار';
    });
  }
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

function renderKaliCatalog(){
  const q=($('kaliSearch').value||'').trim().toLowerCase();
  const html=KALI_TOOL_GROUPS.map(group=>{
    const tools=group.tools.filter(t=>!q||t.join(' ').toLowerCase().includes(q));
    if(!tools.length)return '';
    return '<section class="kali-group"><div class="kali-group-head"><div><span>'+esc(group.icon)+'</span><div><h3>'+esc(group.name)+'</h3><small>'+tools.length+' أداة مطابقة</small></div></div><b>'+esc(group.id.toUpperCase())+'</b></div><div class="kali-tools">'+tools.map(t=>{
      const mode=t[3]==='safe'?'PUBLIC / SAFE':'ACTIVE / AUTHORIZED';
      const cls=t[3]==='safe'?'safe':'active';
      return '<article class="kali-tool"><div class="kali-tool-top"><span class="kali-tool-icon">›_</span><div><strong>'+esc(t[0])+'</strong><small>'+esc(t[2])+'</small></div><em class="'+cls+'">'+mode+'</em></div><p>'+esc(t[1])+'</p><div class="kali-tool-actions"><button type="button" class="kali-info" data-tool="'+esc(t[0])+'">معلومات</button><button type="button" class="kali-run" data-tool="'+esc(t[0])+'" data-mode="'+cls+'">فتح الأداة</button></div></article>';
    }).join('')+'</div></section>';
  }).join('');
  $('kaliCatalog').innerHTML=html||'<div class="empty-state"><strong>لا توجد أداة مطابقة</strong><span>جرّب اسم أداة أو قسمًا آخر.</span></div>';
  $('kaliCatalog').querySelectorAll('.kali-info').forEach(b=>b.addEventListener('click',()=>{
    const name=b.dataset.tool;
    window.open('https://www.kali.org/tools/?q='+encodeURIComponent(name),'_blank','noopener');
  }));
  $('kaliCatalog').querySelectorAll('.kali-run').forEach(b=>b.addEventListener('click',()=>{
    const name=b.dataset.tool;
    toast('تم اختيار '+name+' — محرك التنفيذ يحتاج NOB Runner على خادم Linux مصرح به.');
  }));
  $('kaliCount').textContent=KALI_TOOL_COUNT;
  $('kaliGroups').textContent=KALI_TOOL_GROUPS.length;
}

function renderFindings(findings=[]){
  const box=$('findingsList');
  if(!findings.length){box.innerHTML='<div class="empty-state compact"><strong>لم تظهر مخاطر قابلة للقياس</strong><span>قد يعني ذلك أن الفحوصات المتاحة لم ترصد مشكلة، وليس ضمانًا أن الموقع خالٍ من الثغرات.</span></div>';return;}
  box.innerHTML=findings.map(f=>`<article class="finding severity-${esc(f.severity.toLowerCase())}">
    <div class="finding-top"><span class="severity">${esc(f.severity)}</span><span class="finding-code">${esc(f.code)}</span></div>
    <h3>${esc(f.title)}</h3><p>${esc(f.reason)}</p><div class="recommendation"><b>التوصية:</b> ${esc(f.recommendation)}</div>
  </article>`).join('');
}

function renderExposure(items=[]){
  const box=$('exposureGrid');
  box.innerHTML=items.length?items.map(x=>`<div class="exposure-card"><span class="risk-dot ${esc(x.level.toLowerCase())}"></span><div><strong>${esc(x.name)}</strong><p>${esc(x.description)}</p></div><b>${esc(x.level)}</b></div>`).join(''):'<div class="empty-state compact"><strong>لا توجد مؤشرات إضافية</strong><span>لم يتم إثبات إفصاح إضافي من الفحوصات المتاحة.</span></div>';
}

function renderHeaders(headers=[]){
  const box=$('headersTable');
  box.innerHTML=headers.map(h=>`<div class="header-row"><div><strong>${esc(h.name)}</strong><span>${esc(h.description)}</span></div><b class="header-status ${h.present?'ok':'warn'}">${h.present?'PRESENT':'MISSING'}</b></div>`).join('');
}

function renderTech(tech=[]){
  $('techGrid').innerHTML=tech.length?tech.map(t=>`<div class="tech-card"><span>${esc(t.category)}</span><strong>${esc(t.name)}</strong><small>${esc(t.evidence)}</small></div>`).join(''):'<div class="empty-state compact"><strong>لا توجد مؤشرات تقنية مؤكدة</strong><span>لم يتم تخمين تقنيات غير ظاهرة.</span></div>';
}

function renderReport(result){
  $('reportCard').innerHTML=`<div class="report-head"><div><span>SECURITY ASSESSMENT</span><h3>${esc(result.target.display)}</h3><p>${new Date().toLocaleString('ar-SA')}</p></div><div class="score-ring"><strong>${result.score}</strong><small>/ 100</small></div></div>
  <div class="report-grid"><div><b>${result.findings.length}</b><span>إجمالي الملاحظات</span></div><div><b>${result.summary.critical}</b><span>حرجة</span></div><div><b>${result.summary.high}</b><span>عالية</span></div><div><b>${result.summary.medium}</b><span>متوسطة</span></div></div>
  <div class="report-disclaimer">هذا تقييم دفاعي محدود بنطاق الفحوصات المتاحة في المتصفح. لا يعتبر اختبار اختراق ولا يثبت خلو الموقع من الثغرات.</div>`;
}

async function runScan(){
  const raw=$('target').value.trim();
  let target;
  try{target=normalizeTarget(raw);}catch(e){toast(e.message);return;}
  $('scanBtn').disabled=true;$('scanBtn').textContent='جاري الفحص...';showSection('overview');setProgress(8,'تحقق من الهدف...');
  try{
    state=await runPassiveAssessment(target,p=>setProgress(p,'جاري '+p.label+'...'));
    $('score').textContent=state.score;
    $('critical').textContent=state.summary.critical;
    $('high').textContent=state.summary.high;
    $('medium').textContent=state.summary.medium;
    $('low').textContent=state.summary.low;
    $('checks').textContent=state.checks;
    $('lastResult').innerHTML=`<div class="result-score"><strong>${state.score}</strong><span>/100</span></div><b>${esc(state.target.display)}</b><small>${esc(state.statusMessage)}</small>`;
    $('targetSummary').innerHTML=`<div><span>HOST</span><strong>${esc(state.target.host)}</strong></div><div><span>PROTOCOL</span><strong>${esc(state.target.protocol.toUpperCase())}</strong></div><div><span>STATUS</span><strong>${esc(state.statusMessage)}</strong></div>`;
    renderFindings(state.findings);renderExposure(state.exposure);renderHeaders(state.headers);renderTech(state.technologies);renderReport(state);
    ['stepDns','stepHttp','stepHeaders','stepRisk'].forEach(id=>{const e=$(id);e.classList.remove('active');e.classList.add('done');e.querySelector('em').textContent='تم';});
    setProgress(100,'اكتمل الفحص الدفاعي');
    toast('اكتمل الفحص');
  }catch(e){setProgress(0,'تعذر إكمال الفحص');toast(e.message||'حدث خطأ غير متوقع');}
  finally{$('scanBtn').disabled=false;$('scanBtn').textContent='ابدأ الفحص';}
}

$('scanBtn').addEventListener('click',runScan);

$('backendUrl').value=backendUrl;
$('backendStatus').innerHTML=backendUrl?'<b>حالة الخادم:</b> مربوط — سيتم استخدام NOB Backend.':'<b>حالة الخادم:</b> غير مربوط — سيستخدم الفحص المحلي للمتصفح.';
$('saveBackend').addEventListener('click',()=>{
  const value=$('backendUrl').value.trim().replace(/\/$/,'');
  if(value){backendUrl=value;localStorage.setItem('nobBackendUrl',value);$('backendStatus').innerHTML='<b>حالة الخادم:</b> مربوط — '+esc(value);toast('تم حفظ رابط NOB Backend');}
  else{backendUrl='';localStorage.removeItem('nobBackendUrl');$('backendStatus').innerHTML='<b>حالة الخادم:</b> غير مربوط — سيستخدم الفحص المحلي للمتصفح.';toast('تم إلغاء ربط الخادم');}
});


let discoveryState=null;
function renderDiscoverySearch(){
  const q=($('discoverySearch').value||'').trim().toLowerCase();
  if(!discoveryState){$('discoverySearchMeta').textContent='لم يتم استخراج بيانات بعد.';return;}
  const all=[
    ...(discoveryState.files||[]).map(x=>({...x,kindLabel:'FILE CONTENT'})),
    ...(discoveryState.resources||[]).map(x=>({...x,kindLabel:'FILE'})),
    ...(discoveryState.endpoints||[]).map(x=>({...x,kindLabel:'ENDPOINT'})),
    ...(discoveryState.forms||[]).map(x=>({...x,kindLabel:'FORM'})),
    ...(discoveryState.pages||[]).map(url=>({url,method:'GET',kindLabel:'PAGE',source:'public page'}))
  ];
  const filtered=q?all.filter(x=>JSON.stringify(x).toLowerCase().includes(q)):all;
  $('discoverySearchMeta').textContent='النتائج: '+filtered.length+' من '+all.length+(q?' — البحث في الروابط والـ endpoints والنماذج ومحتوى الملفات العامة':' — جميع البيانات المستخرجة');
  $('discoveryTable').innerHTML=filtered.slice(0,300).map(x=>{
    const content=x.content||'';
    const idx=q&&content.toLowerCase().indexOf(q);
    const snippet=idx>=0?content.slice(Math.max(0,idx-120),idx+q.length+220):'';
    return '<article class="finding severity-low"><div class="finding-top"><span class="severity">'+esc(x.kindLabel)+'</span><span class="finding-code">'+esc(x.method||'GET')+'</span></div><h3>'+esc(x.url||'')+'</h3><p>'+esc(x.type||x.kind||'Public data')+'</p>'+(snippet?'<div class="code-snippet">'+esc(snippet)+'</div>':'')+'<div class="recommendation"><b>المصدر:</b> '+esc(x.source||'')+'</div></article>';
  }).join('') || '<div class="empty-state compact"><strong>لا توجد نتائج</strong><span>جرّب كلمة بحث أخرى.</span></div>';
}

$('discoveryBtn').addEventListener('click',async()=>{
  if(!state?.target){toast('نفّذ فحصًا أساسيًا أولًا.');return;}
  const b=$('discoveryBtn');b.disabled=true;b.textContent='جاري الاستكشاف...';showSection('discovery');$('discoverySearch').value='';
  try{
    const r=await discoverPublicDataSurface(state.target,p=>setProgress(p,p.label));
    if(!r.ok) throw new Error(r.error||'تعذر الاستكشاف');
    $('discoveryResult').innerHTML='<strong>اكتمل الاستكشاف العام</strong><span>'+esc('الملفات: '+r.counts.resources+' · مؤشرات endpoints: '+r.counts.endpoints+' · النماذج: '+r.counts.forms)+'</span>';
    discoveryState=r;
    renderDiscoverySearch();
    renderDiscoverySearch();
    toast('اكتمل استكشاف البيانات العامة');
  }catch(e){toast(e.message||'تعذر الاستكشاف');}
  finally{b.disabled=false;b.textContent='ابدأ الاستكشاف';}
});

$('activeBtn').addEventListener('click',async()=>{
  if(!state?.target){toast('نفّذ فحصًا أساسيًا أولًا.');return;}
  const b=$('activeBtn');b.disabled=true;b.textContent='جاري التحقق...';showSection('active');
  try{
    if(backendUrl){
      const r=await runBackendActiveAssessment(state.target,backendUrl);
      const entries=Object.entries(r.results||{});
      $('activeResult').innerHTML='<strong>اكتمل التحقق عبر NOB Backend</strong><span>هذه النتائج مقروءة من الخادم، لذلك لا تعتمد على CORS في متصفحك.</span><div class="active-checks">'+entries.map(([method,x])=>'<div class="active-check"><b>'+esc(method)+'</b><span class="active-status '+(x.status?'ok':'blocked')+'">'+esc(x.status??x.error??'غير متاح')+'</span><small>'+esc((x.allow?'Allow: '+x.allow+' · ':'')+(x.server?'Server: '+x.server:'')+(x.finalUrl?' · '+x.finalUrl:''))+'</small></div>').join('')+'</div>';
      toast('اكتمل التحقق عبر الخادم');
    }else{
      const r=await runAuthorizedActiveAssessment(state.target);
      renderFindings([...(state.findings||[]),...(r.findings||[])]);
      $('activeResult').innerHTML='<strong>اكتمل التحقق من المتصفح</strong><span>عند ظهور CORS / Browser restriction استخدم NOB Backend للحصول على القراءة الخادمية.</span><div class="active-checks">'+r.checks.map(x=>'<div class="active-check"><b>'+esc(x.method)+'</b><span class="active-status '+(x.status?'ok':'blocked')+'">'+esc(x.status??(x.error==='cors'?'CORS / Browser restriction':x.error==='timeout'?'TIMEOUT':'غير متاح'))+'</span><small>'+esc(x.allow?'Allow: '+x.allow:'لا يمكن قراءة الرؤوس من المتصفح عند منع CORS')+'</small></div>').join('')+'</div>';
      toast('اكتمل التحقق من المتصفح');
    }
  }catch(e){toast(e.message||'تعذر التحقق');}
  finally{b.disabled=false;b.textContent='ابدأ التحقق النشط';}
});
$('target').addEventListener('keydown',e=>{if(e.key==='Enter')runScan();});
$('reset').addEventListener('click',()=>location.reload());

$('discoverySearch').addEventListener('input',renderDiscoverySearch);
$('clearDiscoverySearch').addEventListener('click',()=>{$('discoverySearch').value='';renderDiscoverySearch();});
$('kaliSearch').addEventListener('input',renderKaliCatalog);
$('kaliClear').addEventListener('click',()=>{$('kaliSearch').value='';renderKaliCatalog();});
renderKaliCatalog();
