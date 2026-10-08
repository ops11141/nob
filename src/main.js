import './styles.css';
import { normalizeTarget, runPassiveAssessment, runAuthorizedActiveAssessment } from './security.js';

const app = document.querySelector('#app');

app.innerHTML = `
<div class="app-shell">
  <aside class="sidebar">
    <div class="brand"><div class="brand-mark">N</div><div><strong>NOB</strong><span>CYBER DEFENSE PLATFORM</span></div></div>
    <nav class="nav">
      <button class="nav-item active" data-section="overview">⌂ الرئيسية</button>
      <button class="nav-item" data-section="scan">◉ فحص موقع</button>
      <button class="nav-item" data-section="active">⚡ تحقق نشط</button>
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
        <div class="active-mode"><div><strong>Authorized Active Validation</strong><span>HEAD / OPTIONS + تحليل الاستجابة — بدون تسجيل دخول أو تغيير بيانات أو تنفيذ استغلال.</span></div><button id="activeBtn">ابدأ التحقق النشط</button></div>
        <div id="activeResult" class="empty-state compact"><strong>لم يبدأ التحقق</strong><span>نفّذ فحصًا أساسيًا أولًا ثم شغّل التحقق النشط على نفس الهدف.</span></div>
      </div>
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
function setProgress(p,msg){$('bar').style.width=p+'%';$('statusText').textContent=msg;}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

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
    setProgress(100,'اكتمل الفحص الدفاعي');
    toast('اكتمل الفحص');
  }catch(e){setProgress(0,'تعذر إكمال الفحص');toast(e.message||'حدث خطأ غير متوقع');}
  finally{$('scanBtn').disabled=false;$('scanBtn').textContent='ابدأ الفحص';}
}

$('scanBtn').addEventListener('click',runScan);
$('activeBtn').addEventListener('click',async()=>{
  if(!state?.target){toast('نفّذ فحصًا أساسيًا أولًا.');return;}
  const b=$('activeBtn');b.disabled=true;b.textContent='جاري التحقق...';showSection('active');
  try{
    const r=await runAuthorizedActiveAssessment(state.target);
    renderFindings([...(state.findings||[]),...(r.findings||[])]);
    $('activeResult').innerHTML='<strong>اكتمل التحقق النشط</strong><span>'+esc(r.checks.map(x=>x.method+': '+(x.status??x.error)).join(' · '))+'</span>';
    toast('اكتمل التحقق النشط غير التخريبي');
  }catch(e){toast(e.message||'تعذر التحقق');}
  finally{b.disabled=false;b.textContent='ابدأ التحقق النشط';}
});
$('target').addEventListener('keydown',e=>{if(e.key==='Enter')runScan();});
$('reset').addEventListener('click',()=>location.reload());
