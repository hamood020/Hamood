(function(){
'use strict';

function esc(v){
  return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function money(v){return Number(v||0).toLocaleString('en-US',{maximumFractionDigits:2});}
function pct(v){return Number(v||0).toFixed(1)+'%';}

function styles(){
  if(document.getElementById('icvCompaniesModernStyles'))return;
  var s=document.createElement('style');
  s.id='icvCompaniesModernStyles';
  s.textContent=
  '.icv-co-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:18px}'+
  '.icv-co-kpis .card{min-height:105px}.icv-co-kpis .label{color:var(--muted);font-size:13px}.icv-co-kpis .value{font-size:25px;font-weight:800;margin-top:9px}'+
  '.icv-co-filters{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px;margin:16px 0}'+
  '.icv-co-status{display:inline-block;padding:5px 10px;border-radius:20px;font-weight:800;font-size:12px}'+
  '.icv-co-ok{background:#e8f6ef;color:#16734f}.icv-co-bad{background:#fdeceb;color:#b13d35}'+
  '.icv-co-name{font-weight:800;color:var(--primary2);cursor:pointer}.icv-co-modal{position:fixed;inset:0;background:#0008;z-index:9999;overflow:auto;padding:22px}'+
  '.icv-co-modal .panel{max-width:1250px;margin:0 auto;background:var(--bg);padding:22px}'+
  '.icv-co-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:16px 0}.icv-co-summary>div{background:#f8fafc;border:1px solid var(--line);border-radius:12px;padding:12px;text-align:center}.icv-co-summary small{display:block;color:var(--muted)}.icv-co-summary b{display:block;font-size:19px;margin-top:5px}'+
  '.icv-co-actions{display:flex;gap:8px;margin:14px 0}@media(max-width:1100px){.icv-co-kpis{grid-template-columns:repeat(2,1fr)}.icv-co-filters{grid-template-columns:1fr 1fr}.icv-co-summary{grid-template-columns:repeat(3,1fr)}}@media(max-width:700px){.icv-co-filters{grid-template-columns:1fr}.icv-co-summary{grid-template-columns:1fr 1fr}}';
  document.head.appendChild(s);
}

function metric(p){
  var oman=Number(p.omanization_pct||0);
  var sme=Number(p.sme_pct||0);
  var local=Number(p.local_content_project_pct||0);
  var ok=(oman>=30&&sme>=10&&local>=70);
  if(String(p.made_in_oman_status||'')==='غير مستوفي'||String(p.sme_10_status||'')==='غير مستوفي')ok=false;
  return {oman:oman,sme:sme,local:local,ok:ok};
}

function openModal(company,projects){
  var ps=projects.filter(function(p){return String(p.implementing_company_id||'')===String(company.id);});
  var ok=ps.filter(function(p){return metric(p).ok;}).length;
  var total=ps.reduce(function(a,p){return a+Number(p.total_project_value||0);},0);
  var ov=document.createElement('div');ov.className='icv-co-modal';ov.id='icvCompanyModal';
  var rows=ps.map(function(p,i){
    var m=metric(p);
    return '<tr><td>'+String(i+1)+'</td><td>'+esc(p.project_name||'—')+'</td><td>'+esc(p.government_entities&&p.government_entities.name||'—')+'</td><td>'+money(p.total_project_value)+'</td><td>'+pct(m.oman)+'</td><td>'+pct(m.sme)+'</td><td>'+pct(m.local)+'</td><td><span class="icv-co-status '+(m.ok?'icv-co-ok':'icv-co-bad')+'">'+(m.ok?'مستوفٍ':'غير مستوفٍ')+'</span></td></tr>';
  }).join('');
  ov.innerHTML='<div class="panel"><div class="toolbar"><div><h2>شركة '+esc(company.name)+'</h2><div class="muted">تفاصيل مشاريع الشركة ومؤشرات المحتوى المحلي</div></div><button class="btn" id="icvCoClose">إغلاق</button></div>'+
    '<div class="icv-co-actions"><button class="btn primary" id="icvCoPdf">تصدير تقرير PDF</button><button class="btn" id="icvCoExcel">تصدير Excel</button></div>'+
    '<div class="icv-co-summary"><div><small>المشاريع</small><b>'+ps.length+'</b></div><div><small>قيمة المشاريع</small><b>'+money(total)+' ر.ع</b></div><div><small>مستوفٍ</small><b class="icv-co-ok">'+ok+'</b></div><div><small>غير مستوفٍ</small><b class="icv-co-bad">'+(ps.length-ok)+'</b></div><div><small>نسبة الاستيفاء</small><b>'+pct(ps.length?ok/ps.length*100:0)+'</b></div></div>'+
    '<div class="table-wrap"><table><thead><tr><th>م</th><th>المشروع</th><th>الجهة الحكومية</th><th>القيمة</th><th>التعمين</th><th>SME</th><th>المحتوى المحلي</th><th>الحالة</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  document.body.appendChild(ov);
  document.getElementById('icvCoClose').onclick=function(){ov.remove();};
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.getElementById('icvCoPdf').onclick=function(){
    var w=window.open('','_blank','width=1200,height=900');
    if(!w){alert('يرجى السماح بالنوافذ المنبثقة.');return;}
    w.document.write('<html dir="rtl"><head><meta charset="utf-8"><title>تقرير شركة</title><style>body{font-family:Arial;padding:30px}h1{color:#16734f}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:center}th{background:#eef5f2}.ok{color:#16734f;font-weight:bold}.bad{color:#b13d35;font-weight:bold}</style></head><body><h1>تقرير متابعة المحتوى المحلي</h1><h2>شركة '+esc(company.name)+'</h2><p>تاريخ الإصدار: '+new Date().toLocaleDateString('ar-OM')+'</p><table><thead><tr><th>م</th><th>المشروع</th><th>الجهة</th><th>القيمة</th><th>التعمين</th><th>SME</th><th>المحتوى المحلي</th><th>الحالة</th></tr></thead><tbody>'+rows+'</tbody></table><script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body></html>');
    w.document.close();
  };
  document.getElementById('icvCoExcel').onclick=function(){
    if(typeof XLSX==='undefined'){alert('مكتبة Excel غير متاحة.');return;}
    var data=[['م','المشروع','الجهة الحكومية','قيمة المشروع (ر.ع)','التعمين','SME','المحتوى المحلي','الحالة']];
    ps.forEach(function(p,i){var m=metric(p);data.push([i+1,p.project_name||'',p.government_entities&&p.government_entities.name||'',Number(p.total_project_value||0),m.oman/100,m.sme/100,m.local/100,m.ok?'مستوفٍ':'غير مستوفٍ']);});
    var ws=XLSX.utils.aoa_to_sheet(data),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'تفاصيل المشاريع');XLSX.writeFile(wb,'تقرير شركة - '+String(company.name||'شركة').replace(/[\\/:*?"<>|]/g,'-')+'.xlsx');
  };
}

async function renderCompanies(){
  styles();
  var root=document.getElementById('page-companies');
  if(!root)return;
  root.innerHTML='<div class="panel"><h2>الشركات</h2><p class="muted">جاري تحميل بيانات الشركات...</p></div>';
  try{
    var db=window.__icvAccessClient||window.__icvDb;
    if(!db)throw new Error('اتصال قاعدة البيانات غير متاح');
    var cr=await db.from('companies').select('*').order('name');
    if(cr.error)throw cr.error;
    var pr=await db.from('projects').select('*,government_entities(name)').order('project_name');
    if(pr.error)throw pr.error;
    var companies=cr.data||[],projects=pr.data||[];
    companies=companies.filter(function(c){return projects.some(function(p){return String(p.implementing_company_id||'')===String(c.id);});});
    var totalValue=projects.reduce(function(a,p){return a+Number(p.total_project_value||0);},0);
    var totalOk=projects.filter(function(p){return metric(p).ok;}).length;
    var totalBad=projects.length-totalOk;
    root.innerHTML='<div class="icv-co-kpis"><div class="card"><div class="label">إجمالي الشركات المنفذة</div><div class="value">'+companies.length+'</div></div><div class="card"><div class="label">إجمالي المشاريع</div><div class="value">'+projects.length+'</div></div><div class="card"><div class="label">إجمالي قيمة المشاريع</div><div class="value">'+money(totalValue)+'</div><div class="muted">ر.ع</div></div><div class="card"><div class="label">المشاريع المستوفية</div><div class="value icv-co-ok">'+totalOk+'</div></div><div class="card"><div class="label">المشاريع غير المستوفية</div><div class="value icv-co-bad">'+totalBad+'</div></div></div>'+
      '<div class="panel"><div class="toolbar"><div><h2>الشركات المنفذة</h2><div class="muted">متابعة الشركات ومشاريعها ومؤشرات المحتوى المحلي.</div></div></div>'+
      '<div class="icv-co-filters"><div class="field"><label>البحث باسم الشركة</label><input id="icvCoSearch" placeholder="اسم الشركة"></div><div class="field"><label>حالة الاستيفاء</label><select id="icvCoFilter"><option value="">الكل</option><option value="ok">مستوفٍ</option><option value="bad">غير مستوفٍ</option></select></div></div>'+
      '<div id="icvCoTable" class="table-wrap"></div></div>';
    function draw(){
      var q=(document.getElementById('icvCoSearch').value||'').toLowerCase().trim(),f=document.getElementById('icvCoFilter').value;
      var list=companies.map(function(c){var ps=projects.filter(function(p){return String(p.implementing_company_id||'')===String(c.id);}),ok=ps.filter(function(p){return metric(p).ok;}).length;return {c:c,ps:ps,ok:ok};}).filter(function(x){if(q&&!String(x.c.name||'').toLowerCase().includes(q))return false;if(f==='ok'&&!x.ok)return false;if(f==='bad'&&x.ok===x.ps.length)return false;return true;});
      document.getElementById('icvCoTable').innerHTML='<table><thead><tr><th>م</th><th>الشركة المنفذة</th><th>عدد المشاريع</th><th>قيمة المشاريع</th><th>مستوفٍ</th><th>غير مستوفٍ</th><th>نسبة الاستيفاء</th><th>عرض</th></tr></thead><tbody>'+list.map(function(x,i){return '<tr><td>'+(i+1)+'</td><td><a class="icv-co-name" data-id="'+esc(x.c.id)+'">'+esc(x.c.name)+'</a></td><td>'+x.ps.length+'</td><td>'+money(x.ps.reduce(function(a,p){return a+Number(p.total_project_value||0);},0))+'</td><td><span class="icv-co-status icv-co-ok">'+x.ok+'</span></td><td><span class="icv-co-status icv-co-bad">'+(x.ps.length-x.ok)+'</span></td><td>'+pct(x.ps.length?x.ok/x.ps.length*100:0)+'</td><td><button class="btn primary" data-id="'+esc(x.c.id)+'">عرض</button></td></tr>';}).join('')+'</tbody></table>';
      root.querySelectorAll('[data-id]').forEach(function(el){el.onclick=function(e){e.preventDefault();var c=companies.find(function(x){return String(x.id)===String(el.getAttribute('data-id'));});if(c)openModal(c,projects);};});
    }
    document.getElementById('icvCoSearch').oninput=draw;document.getElementById('icvCoFilter').onchange=draw;draw();
  }catch(e){
    console.error(e);
    root.innerHTML='<div class="panel"><h2>الشركات</h2><p class="bad">تعذر تحميل صفحة الشركات: '+esc(e.message||e)+'</p></div>';
  }
}
window.icvCompaniesPage=renderCompanies;
if(new URLSearchParams(location.search).get('page')==='companies')setTimeout(renderCompanies,50);
})();