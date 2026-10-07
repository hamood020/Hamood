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


function reportKey(r){return Number(r&&r.annual_period||0)*10+(Number(String(r&&r.quarter||'').replace(/\D/g,''))||0);}
function sortCompanyReports(rows){return (rows||[]).slice().sort(function(a,b){return reportKey(a)-reportKey(b)||String(a.created_at||'').localeCompare(String(b.created_at||''));});}
function latestCompanyReport(rows){var a=sortCompanyReports(rows),ok=a.filter(function(r){return String(r.status||'').includes('معتمد');});return ok.length?ok[ok.length-1]:(a.length?a[a.length-1]:null);}
function cumulativeCompanyFinancials(rows){
  var o={made_in_oman:0,local_supplier:0,direct_import:0,sme_purchase:0,local_service:0,foreign_service:0,sme_service:0,sub_local:0,sub_foreign:0,sub_sme:0};
  sortCompanyReports(rows).forEach(function(r){var d=r.report_data||{},cum=String(d.report_type||'ربعي منفصل').includes('تراكمي'),p=d.purchases||{},s=d.services||{},c=d.subcontracts||{},v={made_in_oman:Number(p.made_in_oman||0),local_supplier:Number(p.local_supplier||0),direct_import:Number(p.direct_import||0),sme_purchase:Number(p.sme_purchase||0),local_service:Number(s.local_service||0),foreign_service:Number(s.foreign_service||0),sme_service:Number(s.sme_service||0),sub_local:Number(c.local||0),sub_foreign:Number(c.foreign||0),sub_sme:Number(c.sme||0)};Object.keys(o).forEach(function(k){o[k]=cum?v[k]:o[k]+v[k];});});
  return o;
}
function excelStyles(){
  var border={top:{style:'thin',color:{rgb:'D9E2E0'}},bottom:{style:'thin',color:{rgb:'D9E2E0'}},left:{style:'thin',color:{rgb:'D9E2E0'}},right:{style:'thin',color:{rgb:'D9E2E0'}}};
  return {
    title:{font:{name:'Arial',sz:18,bold:true,color:{rgb:'FFFFFF'}},fill:{patternType:'solid',fgColor:{rgb:'176B5F'}},alignment:{horizontal:'center',vertical:'center'}},
    subtitle:{font:{name:'Arial',sz:10,color:{rgb:'52615E'}},fill:{patternType:'solid',fgColor:{rgb:'EAF4F2'}},alignment:{horizontal:'right',vertical:'center',readingOrder:2}},
    header:{font:{name:'Arial',sz:10,bold:true,color:{rgb:'FFFFFF'}},fill:{patternType:'solid',fgColor:{rgb:'176B5F'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:border},
    cell:{font:{name:'Arial',sz:10,color:{rgb:'24312F'}},alignment:{vertical:'center',wrapText:true,readingOrder:2},border:border},
    ok:{font:{name:'Arial',sz:10,bold:true,color:{rgb:'166534'}},fill:{patternType:'solid',fgColor:{rgb:'DCFCE7'}},alignment:{horizontal:'center',vertical:'center'}},
    bad:{font:{name:'Arial',sz:10,bold:true,color:{rgb:'B91C1C'}},fill:{patternType:'solid',fgColor:{rgb:'FEE2E2'}},alignment:{horizontal:'center',vertical:'center'}},
    kpi:{font:{name:'Arial',sz:11,bold:true,color:{rgb:'176B5F'}},fill:{patternType:'solid',fgColor:{rgb:'F4F8F7'}},alignment:{horizontal:'right',vertical:'center',readingOrder:2},border:border}
  };
}
function makeExcelSheet(rows,title,subtitle,widths){
  var ws=XLSX.utils.aoa_to_sheet([[],[],[]].concat(rows)),S=excelStyles(),range=XLSX.utils.decode_range(ws['!ref']);
  ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:rows[0].length-1}},{s:{r:1,c:0},e:{r:1,c:rows[0].length-1}}];
  ws['A1']={v:title,t:'s',s:S.title};ws['A2']={v:subtitle,t:'s',s:S.subtitle};
  for(var r=2;r<=range.e.r;r++)for(var c=0;c<=range.e.c;c++){var cell=ws[XLSX.utils.encode_cell({r:r,c:c})];if(cell)cell.s=S.cell;}
  for(var c2=0;c2<rows[0].length;c2++){var h=ws[XLSX.utils.encode_cell({r:3,c:c2})];if(h)h.s=S.header;}
  ws['!cols']=(widths||[]).map(function(w){return {wch:w};});
  ws['!rows']=[];ws['!rows'][0]={hpt:30};ws['!rows'][1]={hpt:22};ws['!rows'][3]={hpt:34};
  ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:3,c:0},e:{r:range.e.r,c:range.e.c}})};
  ws['!sheetViews']=[{rightToLeft:true}];
  ws['!freeze']={xSplit:0,ySplit:4};
  return ws;
}
function exportCompanyExcel(company,projects,allReports){
  if(typeof XLSX==='undefined'){alert('مكتبة Excel غير متاحة.');return;}
  try{
    var S=excelStyles(),wb=XLSX.utils.book_new(),date=new Date().toLocaleDateString('ar-OM');
    var ps=projects.filter(function(p){return String(p.implementing_company_id||'')===String(company.id);}),by={};
    (allReports||[]).forEach(function(r){(by[r.project_id]||(by[r.project_id]=[])).push(r);});
    var stats=ps.map(function(p){
      var rr=by[p.id]||[],lr=latestCompanyReport(rr),d=lr&&lr.report_data||{},f=cumulativeCompanyFinancials(rr),wf=Number(d.workforce_total||0),om=Number(d.omani_total||0),fr=Number(d.foreign_total||0);
      var oman=Number(p.omanization_pct!=null?p.omanization_pct:(wf?om/wf*100:0)),smeVal=f.sub_local+f.sub_foreign+f.sub_sme+f.sme_service,sme=Number(p.sme_pct!=null?p.sme_pct:(Number(p.total_project_value||0)?smeVal/Number(p.total_project_value||0)*100:0)),lc=Number(p.local_content_project_pct||0);
      return {p:p,rr:rr,latest:lr,d:d,f:f,wf:wf,om:om,fr:fr,oman:oman,sme:sme,lc:lc,ok:oman>=30&&sme>=10&&lc>=70};
    });
    var totalValue=ps.reduce(function(a,p){return a+Number(p.total_project_value||0);},0),okCount=stats.filter(function(x){return x.ok;}).length;
    var totalSpend=stats.reduce(function(a,x){var f=x.f,d=x.d;return a+Number(d.omani_salary||0)+Number(d.foreign_salary||0)+f.made_in_oman+f.local_supplier+f.direct_import+f.sme_purchase+f.local_service+f.foreign_service+f.sme_service+f.sub_local+f.sub_foreign+f.sub_sme;},0);
    var totalLC=stats.reduce(function(a,x){var f=x.f,d=x.d;return a+Number(d.omani_salary||0)*.8+Number(d.foreign_salary||0)*.2+f.made_in_oman*.7+f.local_supplier*.18+f.direct_import*.06+f.sme_purchase*.18+f.local_service*.7+f.foreign_service*.1+(f.sub_local+f.sub_foreign+f.sub_sme)*.7;},0);

    var rows=[['المؤشر','القيمة','التوضيح'],['اسم الشركة',company.name||'—','الشركة المنفذة المرتبطة بالمشاريع'],['تاريخ التقرير',date,'تاريخ إنشاء الملف'],['عدد المشاريع',ps.length,'عدد المشاريع المرتبطة بالشركة'],['إجمالي قيمة المشاريع',totalValue,'ر.ع'],['المشاريع المستوفية',okCount,'تعمين ≥ 30% + SME ≥ 10% + محتوى محلي ≥ 70%'],['المشاريع غير المستوفية',ps.length-okCount,'تحتاج إلى متابعة'],['نسبة الاستيفاء',ps.length?okCount/ps.length:0,'المستوفية ÷ إجمالي المشاريع'],['إجمالي الصرف المسجل',totalSpend,'ر.ع — من التقارير المحفوظة'],['المحتوى المحلي المحسوب',totalLC,'ر.ع — وفق معاملات الحساب الحالية']];
    var ws=makeExcelSheet(rows,'تقرير الشركة — الملخص التنفيذي','منصة ICV FollowUp | '+date,[28,24,68]);ws['B8'].z='#,##0.00';ws['B11'].z='0.0%';ws['B12'].z='#,##0.00';ws['B13'].z='#,##0.00';XLSX.utils.book_append_sheet(wb,ws,'الملخص التنفيذي');

    rows=[['م','المشروع','الجهة الحكومية','رقم المناقصة / المرجع','حالة المشروع','قيمة المشروع (ر.ع)','تاريخ البداية','تاريخ الانتهاء','آخر تقرير','التعمين','SME','المحتوى المحلي','الحالة النهائية']];
    stats.forEach(function(x,i){var p=x.p,lr=x.latest;rows.push([i+1,p.project_name||'—',p.government_entities&&p.government_entities.name||'—',p.tender_type||p.serial_no||'—',p.project_status||'—',Number(p.total_project_value||0),p.start_date||'—',p.end_date||'—',lr?(String(lr.annual_period||'')+' '+String(lr.quarter||'')):'—',x.oman/100,x.sme/100,x.lc/100,x.ok?'مستوفٍ':'غير مستوفٍ']);});
    ws=makeExcelSheet(rows,'تقرير الشركة — تفاصيل المشاريع','كل مشروع مرتبط بالشركة مع مؤشرات الامتثال',[6,36,28,22,18,18,15,15,16,12,12,15,18]);
    for(var i=4;i<=rows.length;i++){ws['F'+i].z='#,##0.00';ws['J'+i].z='0.0%';ws['K'+i].z='0.0%';ws['L'+i].z='0.0%';var st=ws['M'+i];if(st)st.s=st.v==='مستوفٍ'?S.ok:S.bad;}XLSX.utils.book_append_sheet(wb,ws,'تفاصيل المشاريع');

    rows=[['م','المشروع','آخر تقرير','إجمالي العمالة','العمانيون','غير العمانيين','التعمين','رواتب العمانيين (ر.ع)','رواتب غير العمانيين (ر.ع)','الحالة']];
    stats.forEach(function(x,i){var d=x.d;rows.push([i+1,x.p.project_name||'—',x.latest?(String(x.latest.annual_period||'')+' '+String(x.latest.quarter||'')):'—',x.wf,x.om,x.fr,x.oman/100,Number(d.omani_salary||0),Number(d.foreign_salary||0),x.oman>=30?'مستوفٍ':'غير مستوفٍ']);});
    ws=makeExcelSheet(rows,'تقرير الشركة — القوى العاملة والرواتب','القوى العاملة والرواتب من آخر تقرير معتمد، أو آخر تقرير متاح',[6,36,16,16,14,16,12,22,24,18]);
    for(i=4;i<=rows.length;i++){ws['G'+i].z='0.0%';ws['H'+i].z='#,##0.00';ws['I'+i].z='#,##0.00';var st2=ws['J'+i];if(st2)st2.s=st2.v==='مستوفٍ'?S.ok:S.bad;}XLSX.utils.book_append_sheet(wb,ws,'القوى العاملة والرواتب');

    rows=[['م','المشروع','الفترة','صنع في عمان','مورد محلي','استيراد مباشر','مشتريات SME','خدمات محلية','خدمات أجنبية','خدمات SME','عقود باطن محلية','عقود باطن أجنبية','عقود باطن SME','إجمالي القيم المالية']];
    stats.forEach(function(x,i){var f=x.f,total=f.made_in_oman+f.local_supplier+f.direct_import+f.sme_purchase+f.local_service+f.foreign_service+f.sme_service+f.sub_local+f.sub_foreign+f.sub_sme;rows.push([i+1,x.p.project_name||'—',x.rr.map(function(r){return String(r.annual_period||'')+' '+String(r.quarter||'');}).join('، ')||'—',f.made_in_oman,f.local_supplier,f.direct_import,f.sme_purchase,f.local_service,f.foreign_service,f.sme_service,f.sub_local,f.sub_foreign,f.sub_sme,total]);});
    ws=makeExcelSheet(rows,'تقرير الشركة — التفاصيل المالية','القيم محسوبة حسب نوع التقرير: الربعي يضاف تراكمياً، والتراكمي يستبدل القيمة السابقة',[6,34,30,17,17,17,17,17,17,17,18,18,18,22]);
    for(i=4;i<=rows.length;i++)for(var col of ['D','E','F','G','H','I','J','K','L','M','N'])ws[col+i].z='#,##0.00';XLSX.utils.book_append_sheet(wb,ws,'التفاصيل المالية');

    rows=[['المؤشر','المستهدف','المتوسط الفعلي / المحسوب','الوحدة','الحالة','طريقة القراءة'],['التعمين',.30,stats.length?stats.reduce(function(a,x){return a+x.oman;},0)/stats.length/100:0,'%',stats.length&&stats.every(function(x){return x.oman>=30;})?'مستوفٍ':'غير مستوفٍ','كل مشروع مقابل حد 30%'],['SME',.10,stats.length?stats.reduce(function(a,x){return a+x.sme;},0)/stats.length/100:0,'%',stats.length&&stats.every(function(x){return x.sme>=10;})?'مستوفٍ':'غير مستوفٍ','كل مشروع مقابل حد 10%'],['المحتوى المحلي',.70,stats.length?stats.reduce(function(a,x){return a+x.lc;},0)/stats.length/100:0,'%',stats.length&&stats.every(function(x){return x.lc>=70;})?'مستوفٍ':'غير مستوفٍ','كل مشروع مقابل حد 70%'],['نسبة استيفاء المشاريع',1,ps.length?okCount/ps.length:0,'%',ps.length&&okCount===ps.length?'مستوفٍ':'غير مستوفٍ','المشاريع المستوفية ÷ إجمالي المشاريع']];
    ws=makeExcelSheet(rows,'تقرير الشركة — المؤشرات والامتثال','ملخص تنفيذي للمدير مع حدود الامتثال',[28,16,24,12,18,52]);
    for(i=4;i<=rows.length;i++){ws['B'+i].z='0.0%';ws['C'+i].z='0.0%';var st3=ws['E'+i];if(st3)st3.s=st3.v==='مستوفٍ'?S.ok:S.bad;}XLSX.utils.book_append_sheet(wb,ws,'المؤشرات');

    wb.Props={Title:'تقرير الشركة - '+(company.name||'شركة'),Subject:'متابعة المحتوى المحلي',Author:'ICV FollowUp'};
    XLSX.writeFile(wb,'ICV - تقرير الشركة الكامل - '+String(company.name||'شركة').replace(/[\\/:*?"<>|]/g,'-')+'.xlsx');
  }catch(err){console.error(err);alert('تعذر إنشاء ملف Excel: '+(err.message||err));}
}

function openModal(company,projects,allReports){
  var ps=projects.filter(function(p){return String(p.implementing_company_id||'')===String(company.id);});
  var ok=ps.filter(function(p){return metric(p).ok;}).length;
  var total=ps.reduce(function(a,p){return a+Number(p.total_project_value||0);},0);
  var ov=document.createElement('div');ov.className='icv-co-modal';ov.id='icvCompanyModal';
  var rows=ps.map(function(p,i){
    var m=metric(p);
    return '<tr><td>'+String(i+1)+'</td><td>'+esc(p.project_name||'—')+'</td><td>'+esc(p.government_entities&&p.government_entities.name||'—')+'</td><td>'+money(p.total_project_value)+'</td><td>'+pct(m.oman)+'</td><td>'+pct(m.sme)+'</td><td>'+pct(m.local)+'</td><td><span class="icv-co-status '+(m.ok?'icv-co-ok':'icv-co-bad')+'">'+(m.ok?'مستوفٍ':'غير مستوفٍ')+'</span></td></tr>';
  }).join('');
  ov.innerHTML='<div class="panel"><div class="toolbar"><div><h2>شركة '+esc(company.name)+'</h2><div class="muted">تفاصيل مشاريع الشركة ومؤشرات المحتوى المحلي</div></div><button class="btn" id="icvCoClose">إغلاق</button></div>'+
    '<div class="icv-co-actions"><button class="btn primary" id="icvCoPdf">تصدير تقرير PDF</button><button class="btn" id="icvCoExcel">تصدير Excel — التقرير الكامل</button></div>'+
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
  document.getElementById('icvCoExcel').onclick=function(){exportCompanyExcel(company,projects,allReports);};
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
    var rr=await db.from('quarterly_reports').select('*').order('annual_period').order('quarter');
    if(rr.error)throw rr.error;
    var companies=cr.data||[],projects=pr.data||[],allReports=rr.data||[];
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
      root.querySelectorAll('[data-id]').forEach(function(el){el.onclick=function(e){e.preventDefault();var c=companies.find(function(x){return String(x.id)===String(el.getAttribute('data-id'));});if(c)openModal(c,projects,allReports);};});
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