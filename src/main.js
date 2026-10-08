import './styles.css';
import { inspectDwg } from './dwg.js';

const app=document.querySelector('#app');
app.innerHTML=[
'<div class="shell">',
'<header class="top"><div class="brand"><div class="logo">NOB</div><div><div class="title">منصة بيانات GEO</div><div class="sub">استخراج وتحليل DWG — بدون تعديل الملف الأصلي</div></div></div><div class="badge">GEO Data Platform · v0.1</div></header>',
'<section class="upload" id="drop"><h2>ابدأ بتحليل ملف GEO.dwg</h2><p>اسحب ملف DWG هنا أو اختره. التحليل يتم محليًا داخل المتصفح، ولا يتم رفع الملف إلى خادم.</p><label class="primary">اختيار ملف DWG<input id="file" type="file" accept=".dwg,application/acad"></label><div class="progress"><div class="bar" id="bar"></div></div><div class="status" id="status">بانتظار ملف المصدر.</div></section>',
'<section class="grid">',
'<div class="card"><div class="k">إجمالي Objects</div><div class="v" id="objects">—</div></div>',
'<div class="card"><div class="k">Entities</div><div class="v" id="entities">—</div></div>',
'<div class="card"><div class="k">Model Space</div><div class="v" id="model">—</div></div>',
'<div class="card"><div class="k">Layers</div><div class="v" id="layers">—</div></div>',
'<div class="card"><div class="k">Linetypes</div><div class="v" id="ltypes">—</div></div>',
'<div class="card"><div class="k">Classes</div><div class="v" id="classes">—</div></div>',
'<div class="card"><div class="k">أنواع العناصر</div><div class="v" id="types">—</div></div>',
'<div class="card"><div class="k">حالة المصدر</div><div class="v" id="source">—</div></div>',
'</section>',
'<section class="layout"><div class="panel"><h2>توزيع أنواع عناصر الرسم</h2><div class="panelbody"><table class="table"><thead><tr><th>النوع</th><th>العدد</th></tr></thead><tbody id="typeRows"><tr><td colspan="2">لم يتم التحليل بعد</td></tr></tbody></table></div></div>',
'<div class="panel"><h2>سجل التنفيذ</h2><div class="log" id="log">NOB ready.</div></div></section>',
'<div class="footer">NOB — المصدر يبقى كما هو. النتائج المستقبلية تشمل المعدات والمغذيات والمسارات والكابلات والوصلات وGeoJSON.</div>',
'</div>'
].join('');

const $=id=>document.getElementById(id);
const log=msg=>{$('log').textContent+='\n'+msg;$('log').scrollTop=$('log').scrollHeight};
function progress(p,msg){$('bar').style.width=p+'%';$('status').textContent=msg;log('['+p+'%] '+msg)}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
async function run(file){
 try{
  $('status').className='status';$('source').textContent='...';
  const result=await inspectDwg(file,progress);
  for(const [k,id] of [['objects','objects'],['entities','entities'],['modelEntities','model'],['layers','layers'],['ltypes','ltypes'],['classes','classes']])$(id).textContent=(result.counts[k]??0).toLocaleString('en-US');
  $('types').textContent=Object.keys(result.entityTypes).length.toLocaleString('en-US');$('source').textContent='OK';
  $('status').className='status ok';$('status').textContent='تم تحليل '+result.source.name+' بنجاح.';
  const rows=Object.entries(result.entityTypes).sort((a,b)=>b[1]-a[1]);
  $('typeRows').innerHTML=rows.length?rows.map(([k,v])=>'<tr><td>'+escapeHtml(k)+'</td><td>'+v.toLocaleString('en-US')+'</td></tr>').join(''):'<tr><td colspan="2">لم تُستخرج الأنواع.</td></tr>';
  log('Analysis complete. Database keys: '+result.databaseKeys.join(', '));
 }catch(err){$('source').textContent='ERROR';$('status').className='status error';$('status').textContent=err.message||String(err);log('ERROR: '+(err.stack||err))}
}
$('file').addEventListener('change',e=>e.target.files[0]&&run(e.target.files[0]));
const drop=$('drop');
for(const ev of ['dragenter','dragover'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')});
for(const ev of ['dragleave','drop'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')});
drop.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)run(f)});
