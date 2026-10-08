import './styles.css';
import { inspectDwg } from './dwg.js';

const app=document.querySelector('#app');

app.innerHTML=[
'<div class="app-shell">',
'<aside class="sidebar"><div class="brand"><div class="brand-mark">N</div><div><strong>NOB</strong><span>GEO DATA PLATFORM</span></div></div>',
'<nav class="nav">',
'<button class="nav-item active" data-section="overview">⌂ الرئيسية</button>',
'<button class="nav-item" data-section="source">▣ ملف المصدر</button>',
'<button class="nav-item" data-section="entities">◇ جميع العناصر</button>',
'<button class="nav-item" data-section="equipment">⚡ المعدات</button>',
'<button class="nav-item" data-section="feeders">⌁ المغذيات والمسارات</button>',
'<button class="nav-item" data-section="geo">◎ البيانات الجغرافية</button>',
'<button class="nav-item" data-section="search">⌕ البحث</button>',
'<button class="nav-item" data-section="qa">✓ الجودة والتحقق</button>',
'</nav><div class="sidebar-bottom"><div class="source-mini"><span class="dot"></span><div><small>المصدر</small><strong>GEO.dwg</strong></div></div><div class="version">NOB · Extraction Engine</div></div></aside>',
'<main class="main"><header class="topbar"><div><div class="eyebrow">GEO / ENGINEERING DATA</div><h1>لوحة التحكم الرئيسية</h1><p>نحوّل الرسم الهندسي الكامل إلى قاعدة بيانات قابلة للبحث والتحليل والاستفادة.</p></div><div class="top-actions"><label class="upload-btn">استيراد GEO.dwg<input id="file" type="file" accept=".dwg"></label><button class="ghost" id="refresh">تحديث</button></div></header>',
'<section id="overview" class="section active-section">',
'<div class="hero"><div class="hero-copy"><div class="hero-label">PROJECT NOB</div><h2>كل بيانات الرسم في مكان واحد</h2><p>نستخرج العناصر الهندسية، الطبقات، النصوص، البلوكات، المعدات، المغذيات، المسارات، الكابلات والوصلات، ثم نبني بينها علاقات وبيانات جغرافية قابلة للاستخدام.</p><div class="hero-actions"><label class="primary-btn">ابدأ استخراج الملف<input id="fileHero" type="file" accept=".dwg"></label><button class="secondary-btn" data-go="entities">استعراض بنية البيانات</button></div></div><div class="hero-orbit"><div class="orbit o1"></div><div class="orbit o2"></div><div class="orbit o3"></div><div class="core">GEO<br><b>DWG</b></div></div></div>',
'<div class="stats"><article class="stat"><span>Objects</span><strong id="objects">—</strong><small>جميع كائنات DWG</small></article><article class="stat"><span>Entities</span><strong id="entities">—</strong><small>العناصر الهندسية</small></article><article class="stat"><span>Layers</span><strong id="layers">—</strong><small>طبقات الرسم</small></article><article class="stat"><span>Blocks</span><strong id="blocks">—</strong><small>البلوكات والرموز</small></article><article class="stat"><span>Text / MTEXT</span><strong id="texts">—</strong><small>النصوص والبيانات</small></article><article class="stat"><span>Geometry</span><strong id="geometry">—</strong><small>الخطوط والمسارات</small></article></div>',
'<div class="grid-main"><section class="panel wide"><div class="panel-head"><div><h3>ماذا سنستخرج من GEO.dwg؟</h3><p>كل طبقة من الملف لها مكان مستقل داخل المنصة.</p></div><span class="ready">ARCHITECTURE READY</span></div><div class="module-grid">',
'<div class="module"><b>01</b><strong>العناصر الخام</strong><span>LINE · POLYLINE · ARC · CIRCLE · SPLINE · HATCH وغيرها</span></div>',
'<div class="module"><b>02</b><strong>المعدات</strong><span>RMU · EOS · Recloser · Substation · Pole ومكونات الشبكة</span></div>',
'<div class="module"><b>03</b><strong>المغذيات</strong><span>رقم المغذي، اسمه، مساره، نقاطه، وعلاقته بالمعدات</span></div>',
'<div class="module"><b>04</b><strong>الكابلات والوصلات</strong><span>HV/MV Cable · Joint · ST.JOINT · Extra Cable</span></div>',
'<div class="module"><b>05</b><strong>البيانات الجغرافية</strong><span>إحداثيات CAD الأصلية + طبقة تحويل جغرافي منفصلة</span></div>',
'<div class="module"><b>06</b><strong>العلاقات</strong><span>Feeder → Route → Cable → Joint → Equipment</span></div>',
'</div></section>',
'<section class="panel"><div class="panel-head"><div><h3>حالة الاستخراج</h3><p id="statusText">بانتظار ملف المصدر</p></div></div><div class="pipeline"><div class="step done"><i>1</i><span>Source</span><em>جاهز</em></div><div class="step"><i>2</i><span>Decode DWG</span><em>بانتظار</em></div><div class="step"><i>3</i><span>Normalize</span><em>بانتظار</em></div><div class="step"><i>4</i><span>Classify</span><em>بانتظار</em></div><div class="step"><i>5</i><span>Network</span><em>بانتظار</em></div><div class="step"><i>6</i><span>GeoJSON</span><em>بانتظار</em></div></div><div class="progress"><div id="bar"></div></div></section>',
'<section class="panel"><div class="panel-head"><div><h3>مركز الوصول السريع</h3><p>الأقسام التي سنبنيها فوق البيانات المستخرجة.</p></div></div><div class="quick"><button data-go="equipment"><b>⚡</b><span>المعدات<small>RMU / EOS / Recloser</small></span><i>›</i></button><button data-go="feeders"><b>⌁</b><span>المغذيات<small>Route & Network</small></span><i>›</i></button><button data-go="geo"><b>◎</b><span>الخريطة<small>GeoJSON & Coordinates</small></span><i>›</i></button><button data-go="search"><b>⌕</b><span>البحث<small>اسم / رقم / طبقة / Handle</small></span><i>›</i></button></div></section></div>',
'<section class="panel"><div class="panel-head"><div><h3>مبدأ NOB</h3><p>لا نفقد أي معلومة أثناء التحويل.</p></div></div><div class="principles"><div><strong>المصدر محفوظ</strong><span>GEO.dwg يبقى كما هو ولا نكتب فوقه.</span></div><div><strong>لا حذف</strong><span>العناصر غير المصنفة تبقى في البيانات الخام.</span></div><div><strong>الإحداثيات أصلية</strong><span>نحتفظ بإحداثيات CAD ونفصل أي تحويل جغرافي.</span></div><div><strong>QA مستمر</strong><span>نقارن أعداد المصدر مع أعداد كل مرحلة.</span></div></div></section>',
'</section>',
'<section id="entities" class="section"><div class="page-title"><span>DATASET</span><h2>جميع العناصر</h2><p>قاعدة العناصر الخام: Handle وDXF Type وLayer وGeometry.</p></div><div class="empty-state"><b>RAW ENTITIES</b><strong>سيظهر هنا كل عنصر مستخرج من GEO.dwg</strong><span>لا يتم إسقاط العناصر غير المعروفة.</span></div></section>',
'<section id="equipment" class="section"><div class="page-title"><span>NETWORK ASSETS</span><h2>المعدات</h2><p>RMU وEOS وRecloser والمحطات والأعمدة والمكونات الأخرى.</p></div><div class="empty-state"><b>EQUIPMENT INDEX</b><strong>سجل موحد لكل معدة</strong><span>الاسم · الرقم · النوع · الإحداثيات · الطبقة · المغذي.</span></div></section>',
'<section id="feeders" class="section"><div class="page-title"><span>NETWORK</span><h2>المغذيات والمسارات</h2><p>تحويل الرسم إلى شبكة قابلة للفهم والتحليل.</p></div><div class="empty-state"><b>FEEDER NETWORK</b><strong>Feeder → Route → Cable → Joint → Equipment</strong><span>المسارات ستبنى من الهندسة الفعلية والنصوص والعلاقات المكانية.</span></div></section>',
'<section id="geo" class="section"><div class="page-title"><span>GEOSPATIAL</span><h2>البيانات الجغرافية</h2><p>إحداثيات الرسم ومسارات الشبكة وطبقات GeoJSON.</p></div><div class="empty-state"><b>GEOJSON ENGINE</b><strong>الخريطة ستكون نتيجة البيانات المستخرجة.</strong><span>إحداثيات CAD الأصلية محفوظة، والتحويل الجغرافي منفصل.</span></div></section>',
'<section id="search" class="section"><div class="page-title"><span>SEARCH</span><h2>البحث الشامل</h2><p>بحث واحد في جميع البيانات.</p></div><div class="search-box"><input placeholder="ابحث عن RMU أو EOS أو Feeder أو Layer أو Handle..." id="globalSearch"><button>بحث</button></div><div class="empty-state compact"><strong>سيبحث NOB في جميع مجموعات البيانات</strong><span>رقم المعدة · اسم المغذي · النص · الطبقة · نوع العنصر · الإحداثيات.</span></div></section>',
'<section id="source" class="section"><div class="page-title"><span>SOURCE</span><h2>ملف المصدر</h2><p>فحص GEO.dwg قبل وبعد الاستخراج.</p></div><div class="source-card"><div><span>اسم الملف</span><strong id="sourceName">GEO.dwg</strong></div><div><span>الحجم</span><strong id="sourceSize">—</strong></div><div><span>الحالة</span><strong class="green">READ ONLY</strong></div></div></section>',
'<section id="qa" class="section"><div class="page-title"><span>QUALITY ASSURANCE</span><h2>الجودة والتحقق</h2><p>التأكد من عدم فقدان أي عنصر بين المصدر والبيانات النهائية.</p></div><div class="qa-grid"><div class="qa-card"><b>RAW = NORMALIZED</b><span>مطابقة أعداد العناصر</span></div><div class="qa-card"><b>CLASSIFIED + UNKNOWN</b><span>لا توجد عناصر مفقودة</span></div><div class="qa-card"><b>GEOMETRY CHECK</b><span>فحص الإحداثيات والمسارات</span></div><div class="qa-card"><b>RELATION CHECK</b><span>فحص علاقات المعدات والمغذيات</span></div></div></section>',
'<div id="toast" class="toast"></div><div class="footer">NOB — GEO Data Platform · المصدر للقراءة فقط</div></main></div>'
].join('');

const $=id=>document.getElementById(id);
const sections=[...document.querySelectorAll('.section')];
function showSection(id){sections.forEach(s=>s.classList.toggle('active-section',s.id===id));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.section===id));window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.section)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.go)));
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600);}
function progress(p,msg){$('bar').style.width=p+'%';$('statusText').textContent=msg;}
async function analyze(file){
 try{
  progress(5,'قراءة الملف...');
  $('sourceName').textContent=file.name;
  $('sourceSize').textContent=(file.size/1024/1024).toFixed(2)+' MB';
  const r=await inspectDwg(file,progress);
  const c=r.counts;
  $('objects').textContent=(c.objects??0).toLocaleString('en-US');
  $('entities').textContent=(c.entities??0).toLocaleString('en-US');
  $('layers').textContent=(c.layers??0).toLocaleString('en-US');
  $('geometry').textContent=(c.modelEntities??0).toLocaleString('en-US');
  progress(100,'اكتمل التحليل الأولي — جاهز لبناء مجموعات البيانات');
  toast('تمت قراءة '+file.name+' بنجاح');
 }catch(e){progress(0,'تعذر التحليل: '+(e.message||e));toast('تعذر قراءة الملف');}
}
$('file').addEventListener('change',e=>e.target.files[0]&&analyze(e.target.files[0]));
$('fileHero').addEventListener('change',e=>e.target.files[0]&&analyze(e.target.files[0]));
$('refresh').addEventListener('click',()=>location.reload());
