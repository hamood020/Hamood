(function(){
  'use strict';

  function escV(v){
    if(typeof window.esc==='function') return window.esc(v);
    return String(v??'').replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]});
  }
  function moneyV(v){return Number(v||0).toLocaleString('en-US',{maximumFractionDigits:2});}
  function pctV(v){return Number(v||0).toFixed(1)+'%';}

  function sortedReports(rows){
    return (rows||[]).slice().sort(function(a,b){
      const ay=Number(a?.annual_period||0), by=Number(b?.annual_period||0);
      const aq=Number(String(a?.quarter||'').replace(/\D/g,''))||0;
      const bq=Number(String(b?.quarter||'').replace(/\D/g,''))||0;
      return (ay*10+aq)-(by*10+bq)||String(a?.created_at||'').localeCompare(String(b?.created_at||''));
    });
  }

  function goodsPercentage(projectId, reports){
    const rows=sortedReports((reports||[]).filter(function(r){return String(r.project_id)===String(projectId)}));
    let goods={made_in_oman:0,local_supplier:0,direct_import:0,sme_purchase:0};
    let found=false;
    rows.forEach(function(r){
      const d=r.report_data||{}, p=d.purchases||{};
      const cumulative=String(d.report_type||'ربعي منفصل').includes('تراكمي');
      const vals={
        made_in_oman:Number(p.made_in_oman||0),
        local_supplier:Number(p.local_supplier||0),
        direct_import:Number(p.direct_import||0),
        sme_purchase:Number(p.sme_purchase||0)
      };
      if(Object.values(vals).some(function(x){return x>0})) found=true;
      if(cumulative) goods=vals;
      else Object.keys(goods).forEach(function(k){goods[k]+=vals[k]});
    });
    const total=Object.values(goods).reduce(function(a,v){return a+v},0);
    if(!found || !total) return null;
    const localValue=goods.made_in_oman*0.70 + goods.local_supplier*0.18 + goods.sme_purchase*0.18;
    return localValue/total*100;
  }

  function compliance(project){
    const made=String(project.made_in_oman_status||'').trim();
    const sme=String(project.sme_10_status||'').trim();
    if(made==='غير مستوفي' || sme==='غير مستوفي') return false;
    if(made==='مستوفي' && sme==='مستوفي') return true;
    const oman=Number(project.omanization_pct||0);
    const smePct=Number(project.sme_pct||0);
    const lc=Number(project.local_content_project_pct||0);
    return oman>=30 && smePct>=10 && lc>=70;
  }

  function projectMetrics(project,reports){
    return {
      oman:Number(project.omanization_pct||0),
      sme:Number(project.sme_pct||0),
      goods:goodsPercentage(project.id,reports),
      local:Number(project.local_content_project_pct||0),
      ok:compliance(project)
    };
  }

  function ensureStyles(){
    if(document.getElementById('icvCompaniesSafeStyles')) return;
    const st=document.createElement('style');
    st.id='icvCompaniesSafeStyles';
    st.textContent=[
      '.companies-page-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:18px}',
      '.companies-page-kpis .card{min-height:104px}',
      '.companies-filter-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px;margin-top:16px}',
      '.companies-status{display:inline-flex;align-items:center;justify-content:center;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:800;white-space:nowrap}',
      '.companies-ok{background:#e8f6ef;color:#16734f;border:1px solid #cce8d9}',
      '.companies-bad{background:#fdeceb;color:#b13d35;border:1px solid #f1d1ce}',
      '.companies-name{font-weight:800;color:var(--primary2);text-decoration:none}',
      '.companies-name:hover{text-decoration:underline}',
      '.companies-card-summary{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:16px 0}',
      '.companies-card-summary .summary-box{background:#f8fafc;border:1px solid var(--line);border-radius:12px;padding:12px;text-align:center}',
      '.companies-card-summary small{display:block;color:var(--muted);font-size:11px}',
      '.companies-card-summary b{display:block;margin-top:5px;font-size:18px}',
      '.companies-table table,.companies-modal-table table{min-width:980px}',
      '.companies-modal-table{overflow:auto}',
      '.companies-modal-actions{display:flex;gap:8px;justify-content:flex-start;margin-bottom:14px}',
      '.companies-modal-head{display:flex;align-items:center;justify-content:space-between;gap:15px}',
      '.companies-modal-note{background:#f2f8f6;border-right:4px solid var(--primary);padding:12px;margin:12px 0;color:var(--ink);border-radius:6px}',
      '@media(max-width:1100px){.companies-page-kpis{grid-template-columns:repeat(2,1fr)}.companies-card-summary{grid-template-columns:repeat(3,1fr)}.companies-filter-grid{grid-template-columns:1fr 1fr}}',
      '@media(max-width:760px){.companies-page-kpis{grid-template-columns:1fr 1fr}.companies-card-summary{grid-template-columns:1fr 1fr}.companies-filter-grid{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(st);
  }

  function closeCompanyModal(){
    const el=document.getElementById('icvCompaniesModal');
    if(el) el.remove();
  }

  function exportCompanyExcel(company, stats, reports){
    try{
    if(typeof XLSX==='undefined'){alert('مكتبة Excel غير متاحة حالياً. أعد تحديث الصفحة ثم حاول مرة أخرى.');return;}
    const generated=new Date().toLocaleDateString('ar-OM',{year:'numeric',month:'long',day:'numeric'});
    const projectRows=stats.projects||[];
    const wb=XLSX.utils.book_new();
    const C={green:'16734F',dark:'123D32',light:'EAF4F1',pale:'F6F9F8',line:'D7E2DE',white:'FFFFFF',red:'B13D35',amber:'B7791F',ink:'17212B',muted:'667085'};
    const border={top:{style:'thin',color:{rgb:C.line}},bottom:{style:'thin',color:{rgb:C.line}},left:{style:'thin',color:{rgb:C.line}},right:{style:'thin',color:{rgb:C.line}}};
    const base={font:{name:'Arial',sz:10,color:{rgb:C.ink}},alignment:{vertical:'center',wrapText:true},border:border};
    function styleRange(ws,rows,cols,style){for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){const cell=ws[XLSX.utils.encode_cell({r:r,c:col})];if(cell)cell.s=Object.assign({},base,style)}}
    function title(ws,text,lastCol){ws['A1']={v:text,t:'s',s:{font:{name:'Arial',sz:18,bold:true,color:{rgb:C.white}},fill:{fgColor:{rgb:C.green}},alignment:{horizontal:'center',vertical:'center'}}};ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:lastCol}}];ws['!rows']=[{hpt:32}]}
    function header(ws,row,count){for(let col=0;col<count;col++){const cell=ws[XLSX.utils.encode_cell({r:row,c:col})];if(cell)cell.s={font:{name:'Arial',sz:10,bold:true,color:{rgb:C.white}},fill:{fgColor:{rgb:C.dark}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:border}}}
    function finish(ws,rtl){ws['!sheetView']={rightToLeft:rtl!==false,showGridLines:false};}

    // 1) Executive dashboard
    const cover=[['تقرير متابعة المحتوى المحلي للشركة'],['اسم الشركة',company.name],['تاريخ الإصدار',generated],[],['ملخص تنفيذي'],['عدد المشاريع',stats.count],['إجمالي قيمة المشاريع (ر.ع)',stats.value],['المشاريع المستوفية',stats.ok],['المشاريع غير المستوفية',stats.bad],['نسبة الاستيفاء',stats.rate/100],['متوسط السلع',stats.avgGoods==null?null:stats.avgGoods/100],[],['مؤشرات التقرير','القيمة','الملاحظة'],['التعمين','بيانات كل مشروع في ورقة التفاصيل','وفق آخر بيانات المشروع'],['SME','بيانات كل مشروع في ورقة التفاصيل','وفق بيانات المشروع'],['السلع','بيانات كل مشروع في ورقة التفاصيل','محسوبة من بيانات التقارير'],['المحتوى المحلي الكلي','بيانات كل مشروع في ورقة التفاصيل','وفق بيانات المشروع']];
    const ws0=XLSX.utils.aoa_to_sheet(cover);ws0['!cols']=[{wch:30},{wch:36},{wch:34}];title(ws0,'تقرير متابعة المحتوى المحلي للشركة',2);ws0['!rows']=[{hpt:34},{hpt:22},{hpt:22},{hpt:10},{hpt:24}];
    for(let r=1;r<cover.length;r++)for(let col=0;col<3;col++){const cell=ws0[XLSX.utils.encode_cell({r:r,c:col})];if(cell)cell.s=Object.assign({},base,{alignment:{horizontal:col===0?'right':'center',vertical:'center',wrapText:true}})}
    [4,12].forEach(r=>{for(let col=0;col<3;col++){const cell=ws0[XLSX.utils.encode_cell({r:r,c:col})];if(cell)cell.s={font:{name:'Arial',sz:11,bold:true,color:{rgb:C.white}},fill:{fgColor:{rgb:C.dark}},alignment:{horizontal:'right',vertical:'center'},border:border}}});
    ws0['B9'].z='0.0%';ws0['B10'].z='0.0%';ws0['B6'].z='#,##0.00';finish(ws0);XLSX.utils.book_append_sheet(wb,ws0,'الملخص التنفيذي');

    // 2) Project details — complete project record
    const detail=[['م','اسم المشروع','الجهة الحكومية','الشركة المنفذة','رقم المناقصة','حالة المشروع','قطاع العمل','قيمة المشروع (ر.ع)','نسبة الإنجاز','تاريخ البداية','تاريخ الانتهاء الأصلي','تاريخ الانتهاء الحالي','الاستشاري','التعمين','SME','السلع','المحتوى المحلي الكلي','الحالة']];
    projectRows.forEach(function(p,i){const m=projectMetrics(p,reports);detail.push([i+1,p.project_name||'—',p.government_entities?.name||'—',company.name||'—',p.tender_type||p.serial_no||'—',p.project_status||'—',p.work_sector||'—',Number(p.total_project_value||0),Number(p.progress_pct||0)/100,p.start_date||p.project_start_date||'—',p.original_end_date||p.end_date||'—',p.end_date||'—',p.consultant||'—',m.oman/100,m.sme/100,m.goods==null?null:m.goods/100,m.local/100,m.ok?'مستوفٍ':'غير مستوفٍ'])});
    const ws1=XLSX.utils.aoa_to_sheet(detail);ws1['!cols']=[{wch:6},{wch:34},{wch:25},{wch:24},{wch:18},{wch:14},{wch:18},{wch:18},{wch:13},{wch:15},{wch:18},{wch:18},{wch:22},{wch:12},{wch:12},{wch:12},{wch:20},{wch:15}];ws1['!freeze']={xSplit:0,ySplit:1};ws1['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:detail.length-1,c:17}})};header(ws1,0,18);
    for(let r=1;r<detail.length;r++)for(let col=0;col<18;col++){const cell=ws1[XLSX.utils.encode_cell({r:r,c:col})];if(!cell)continue;cell.s=Object.assign({},base,{alignment:{horizontal:[1,2,3,4,5,6,9,10,11,12].includes(col)?'right':'center',vertical:'center',wrapText:true}});if(col===7)cell.z='#,##0.00';if([8,13,14,15,16].includes(col)&&typeof cell.v==='number')cell.z='0.0%';if(col===17)cell.s.font={name:'Arial',sz:10,bold:true,color:{rgb:cell.v==='مستوفٍ'?C.green:C.red}}}finish(ws1);XLSX.utils.book_append_sheet(wb,ws1,'تفاصيل المشاريع');

    // 3) Current workforce and salary snapshot
    const workforce=[['م','المشروع','إجمالي القوى العاملة','العمانيون','الأجانب','نسبة التعمين','رواتب العمانيين (ر.ع)','رواتب الأجانب (ر.ع)']];
    projectRows.forEach(function(p,i){const rs=reports.filter(r=>String(r.project_id)===String(p.id)).sort((a,b)=>(Number(a.annual_period||0)*10+Number(String(a.quarter||'').replace(/\D/g,'')))-(Number(b.annual_period||0)*10+Number(String(b.quarter||'').replace(/\D/g,''))));const latest=rs[rs.length-1],d=latest?.report_data||{},cats=Array.isArray(d.workforce_categories)?d.workforce_categories:[],om=cats.reduce((a,x)=>a+Number(x?.omani||0),0),fo=cats.reduce((a,x)=>a+Number(x?.foreign||0),0),om2=Number(d.omani_total||d.omani_workers||om||0),fo2=Number(d.foreign_total||d.foreign_workers||fo||0),tot=om2+fo2;const sal=cumulativeSalariesLocal(rs);workforce.push([i+1,p.project_name||'—',tot,om2,fo2,tot?om2/tot:0,sal.omani,sal.foreign])});
    const ws2=XLSX.utils.aoa_to_sheet(workforce);ws2['!cols']=[{wch:6},{wch:38},{wch:20},{wch:14},{wch:14},{wch:14},{wch:23},{wch:22}];ws2['!freeze']={xSplit:0,ySplit:1};header(ws2,0,8);for(let r=1;r<workforce.length;r++)for(let col=0;col<8;col++){const cell=ws2[XLSX.utils.encode_cell({r:r,c:col})];if(!cell)continue;cell.s=base;if([5].includes(col)&&typeof cell.v==='number')cell.z='0.0%';if([6,7].includes(col)&&typeof cell.v==='number')cell.z='#,##0.00'}finish(ws2);XLSX.utils.book_append_sheet(wb,ws2,'القوى العاملة والرواتب');

    // 4) Financial detail from all reports
    const fin=[['المشروع','السنة','الربع','نوع التقرير','رواتب العمانيين','رواتب الأجانب','صنع في عمان','مورد محلي','استيراد مباشر','مشتريات SME','خدمات محلية','خدمات أجنبية','خدمات SME','مقاولات محلية','مقاولات أجنبية','مقاولات SME']];
    projectRows.forEach(function(p){reports.filter(r=>String(r.project_id)===String(p.id)).forEach(function(r){const d=r.report_data||{},pg=d.purchases||{},sg=d.services||{},cg=d.subcontracts||{};fin.push([p.project_name||'—',r.annual_period||'—',r.quarter||'—',d.report_type||'—',Number(d.omani_salary||0),Number(d.foreign_salary||0),Number(pg.made_in_oman||0),Number(pg.local_supplier||0),Number(pg.direct_import||0),Number(pg.sme_purchase||0),Number(sg.local_service||0),Number(sg.foreign_service||0),Number(sg.sme_service||0),Number(cg.local||0),Number(cg.foreign||0),Number(cg.sme||0)])})});
    const ws3=XLSX.utils.aoa_to_sheet(fin);ws3['!cols']=[{wch:34},{wch:10},{wch:10},{wch:18},{wch:18},{wch:18},{wch:18},{wch:16},{wch:17},{wch:15},{wch:17},{wch:17},{wch:15},{wch:17},{wch:17},{wch:15}];ws3['!freeze']={xSplit:0,ySplit:1};ws3['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:fin.length-1,c:15}})};header(ws3,0,16);for(let r=1;r<fin.length;r++)for(let col=0;col<16;col++){const cell=ws3[XLSX.utils.encode_cell({r:r,c:col})];if(!cell)continue;cell.s=base;if(col>=4&&typeof cell.v==='number')cell.z='#,##0.00'}finish(ws3);XLSX.utils.book_append_sheet(wb,ws3,'تفاصيل التقارير');

    // 5) Clean company/project status view
    const status=[['م','المشروع','الجهة الحكومية','قيمة المشروع (ر.ع)','التعمين','SME','السلع','المحتوى المحلي الكلي','الحالة']];
    projectRows.forEach(function(p,i){const m=projectMetrics(p,reports);status.push([i+1,p.project_name||'—',p.government_entities?.name||'—',Number(p.total_project_value||0),m.oman/100,m.sme/100,m.goods==null?null:m.goods/100,m.local/100,m.ok?'مستوفٍ':'غير مستوفٍ'])});
    const ws4=XLSX.utils.aoa_to_sheet(status);ws4['!cols']=[{wch:6},{wch:40},{wch:28},{wch:20},{wch:13},{wch:12},{wch:12},{wch:22},{wch:16}];ws4['!freeze']={xSplit:0,ySplit:1};ws4['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:status.length-1,c:8}})};header(ws4,0,9);for(let r=1;r<status.length;r++)for(let col=0;col<9;col++){const cell=ws4[XLSX.utils.encode_cell({r:r,c:col})];if(!cell)continue;cell.s=base;if(col===3&&typeof cell.v==='number')cell.z='#,##0.00';if([4,5,6,7].includes(col)&&typeof cell.v==='number')cell.z='0.0%';if(col===8)cell.s.font={name:'Arial',sz:10,bold:true,color:{rgb:cell.v==='مستوفٍ'?C.green:C.red}}}finish(ws4);XLSX.utils.book_append_sheet(wb,ws4,'المؤشرات المختصرة');

    const safe=String(company.name||'شركة').replace(/[\\/:*?"<>|]/g,'-').trim()||'شركة';
    XLSX.writeFile(wb,'تقرير شركة - '+safe+'.xlsx');
    }catch(err){console.error('Company Excel export error:',err);alert('تعذر إنشاء ملف Excel.\n'+(err?.message||err));}
  }
  function cumulativeSalariesLocal(rows){let om=0,fo=0;for(const r of (rows||[]).sort((a,b)=>(Number(a.annual_period||0)*10+Number(String(a.quarter||'').replace(/\D/g,'')))-(Number(b.annual_period||0)*10+Number(String(b.quarter||'').replace(/\D/g,'')))){const d=r.report_data||{},cum=String(d.salary_input_type||'رواتب الربع').includes('تراكمية'),a=Number(d.omani_salary||0),b=Number(d.foreign_salary||0);if(cum){om=a;fo=b}else{om+=a;fo+=b}}return{omani:om,foreign:fo}}

  function exportCompanyPDF(company, stats, reports){
    const rows=stats.projects.map(function(p,i){
      const m=projectMetrics(p,reports);
      return '<tr><td>'+String(i+1)+'</td><td>'+escV(p.project_name||'—')+'</td><td>'+escV(p.government_entities?.name||'—')+'</td><td>'+moneyV(p.total_project_value)+'</td><td>'+pctV(m.oman)+'</td><td>'+pctV(m.sme)+'</td><td>'+(m.goods==null?'—':pctV(m.goods))+'</td><td>'+pctV(m.local)+'</td><td><span class="status '+(m.ok?'ok':'bad')+'">'+(m.ok?'مستوفٍ':'غير مستوفٍ')+'</span></td></tr>';
    }).join('');
    const generated=new Date().toLocaleDateString('ar-OM',{year:'numeric',month:'long',day:'numeric'});
    const w=window.open('','_blank','width=1200,height=900');
    if(!w){alert('يرجى السماح بالنوافذ المنبثقة لتصدير التقرير.');return;}
    w.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير شركة - '+escV(company.name)+'</title><style>\n@page{size:A4 landscape;margin:14mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#17212b;margin:0;font-size:11px;background:#fff}.header{border-bottom:3px solid #16734f;padding-bottom:12px;margin-bottom:18px}.brand{font-size:18px;font-weight:800;color:#16734f}.title{font-size:21px;font-weight:800;margin:7px 0}.meta{color:#667085}.summary{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:15px 0 20px}.box{border:1px solid #d9e2e8;border-radius:7px;padding:10px;text-align:center;background:#f8fafc}.box small{display:block;color:#667085}.box b{display:block;font-size:16px;margin-top:5px}.ok{color:#16734f;font-weight:800}.bad{color:#b13d35;font-weight:800}h2{font-size:14px;margin:16px 0 8px}table{width:100%;border-collapse:collapse;table-layout:fixed}th{background:#eef5f2;color:#1f3b31;font-weight:800}th,td{border:1px solid #cfd8dc;padding:7px 5px;text-align:center;vertical-align:middle;word-wrap:break-word}th:nth-child(2){width:22%}th:nth-child(3){width:16%}.status{display:inline-block;padding:4px 8px;border-radius:10px}.status.ok{background:#e8f6ef}.status.bad{background:#fdeceb}.note{margin:12px 0;padding:9px 12px;background:#f2f8f6;border-right:4px solid #16734f}.footer{margin-top:18px;color:#667085;font-size:9px;display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:8px}@media print{.no-print{display:none}}</style></head><body><div class="header"><div class="brand">منصة متابعة المحتوى المحلي ICV FollowUp</div><div class="title">تقرير متابعة المحتوى المحلي للشركة</div><div><b>الشركة:</b> '+escV(company.name)+'</div><div class="meta">تاريخ إصدار التقرير: '+generated+'</div></div><div class="summary"><div class="box"><small>عدد المشاريع</small><b>'+stats.count+'</b></div><div class="box"><small>قيمة المشاريع (ر.ع)</small><b>'+moneyV(stats.value)+'</b></div><div class="box"><small>مستوفٍ</small><b class="ok">'+stats.ok+'</b></div><div class="box"><small>غير مستوفٍ</small><b class="bad">'+stats.bad+'</b></div><div class="box"><small>نسبة الاستيفاء</small><b>'+pctV(stats.rate)+'</b></div><div class="box"><small>متوسط السلع</small><b>'+(stats.avgGoods==null?'—':pctV(stats.avgGoods))+'</b></div></div><div class="note">يعرض هذا التقرير نتائج مشاريع الشركة وفق البيانات المسجلة في المنصة، ولا يتطلب إعادة إدخال بيانات المحتوى المحلي.</div><h2>تفاصيل مشاريع الشركة ومؤشرات المحتوى المحلي</h2><table><thead><tr><th>م</th><th>المشروع</th><th>الجهة الحكومية</th><th>قيمة المشروع (ر.ع)</th><th>التعمين (%)</th><th>SME (%)</th><th>السلع (%)</th><th>المحتوى المحلي الكلي (%)</th><th>الحالة</th></tr></thead><tbody>'+rows+'</tbody></table><div class="footer"><span>منصة ICV FollowUp</span><span>تقرير شركة — '+escV(company.name)+'</span></div><script>window.onload=function(){setTimeout(function(){window.print()},350)}</script></body></html>');
    w.document.close();
  }

  function openCompanyModal(company, stats, reports){
    closeCompanyModal();
    const overlay=document.createElement('div');
    overlay.id='icvCompaniesModal';
    overlay.style='position:fixed;inset:0;background:#0008;z-index:1000;padding:18px;overflow:auto';
    const rows=stats.projects.map(function(p,i){
      const m=projectMetrics(p,reports);
      return '<tr>'+
        '<td>'+String(i+1)+'</td>'+
        '<td><a href="#" class="companies-name" data-project-id="'+escV(p.id)+'">'+escV(p.project_name||'—')+'</a></td>'+
        '<td>'+escV(p.government_entities?.name||'—')+'</td>'+
        '<td>'+moneyV(p.total_project_value)+'</td>'+
        '<td>'+pctV(m.oman)+'</td>'+
        '<td>'+pctV(m.sme)+'</td>'+
        '<td>'+(m.goods==null?'—':pctV(m.goods))+'</td>'+
        '<td>'+pctV(m.local)+'</td>'+
        '<td><span class="companies-status '+(m.ok?'companies-ok':'companies-bad')+'">'+(m.ok?'مستوفٍ':'غير مستوفٍ')+'</span></td>'+
      '</tr>';
    }).join('');

    overlay.innerHTML='<div class="panel" style="max-width:1250px;margin:0 auto;background:var(--bg)">'+
      '<div class="companies-modal-head">'+
        '<div><h2 style="margin:0">شركة '+escV(company.name)+'</h2><div class="muted">تقرير متابعة الشركة ومشاريعها</div></div>'+
        '<button type="button" class="btn" id="closeCompanyModalBtn">إغلاق</button>'+
      '</div>'+
      '<div class="companies-modal-actions"><button type="button" class="btn primary" id="exportCompanyPdfBtn">تصدير تقرير PDF</button><button type="button" class="btn" id="exportCompanyExcelBtn">تصدير Excel</button></div>'+
      '<div class="companies-card-summary">'+
        '<div class="summary-box"><small>عدد المشاريع</small><b>'+stats.count+'</b></div>'+
        '<div class="summary-box"><small>قيمة المشاريع (ر.ع)</small><b>'+moneyV(stats.value)+'</b></div>'+
        '<div class="summary-box"><small>مستوفٍ</small><b class="ok">'+stats.ok+'</b></div>'+
        '<div class="summary-box"><small>غير مستوفٍ</small><b class="bad">'+stats.bad+'</b></div>'+
        '<div class="summary-box"><small>نسبة الاستيفاء</small><b>'+pctV(stats.rate)+'</b></div>'+
        '<div class="summary-box"><small>متوسط السلع</small><b>'+(stats.avgGoods==null?'—':pctV(stats.avgGoods))+'</b></div>'+
      '</div>'+
      '<div class="companies-modal-note">هذه الصفحة تجمع نتائج مشاريع الشركة من بيانات المشاريع وتقاريرها المسجلة، ولا تتطلب إعادة إدخال بيانات المحتوى المحلي.</div>'+
      '<h3>مشاريع الشركة ومؤشرات المحتوى المحلي</h3>'+
      '<div class="companies-modal-table"><table><thead><tr>'+
        '<th>م</th><th>المشروع</th><th>الجهة الحكومية</th><th>قيمة المشروع (ر.ع)</th>'+
        '<th>التعمين (%)</th><th>SME (%)</th><th>السلع (%)</th><th>المحتوى المحلي الكلي (%)</th><th>الحالة</th>'+
      '</tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '</div>';
    document.body.appendChild(overlay);
    document.getElementById('closeCompanyModalBtn').onclick=closeCompanyModal;
    document.getElementById('exportCompanyPdfBtn').onclick=function(){exportCompanyPDF(company,stats,reports)};
    document.getElementById('exportCompanyExcelBtn').onclick=function(){exportCompanyExcel(company,stats,reports)};
    overlay.addEventListener('click',function(e){
      if(e.target===overlay) closeCompanyModal();
      const link=e.target.closest('[data-project-id]');
      if(link){
        e.preventDefault();
        const id=link.getAttribute('data-project-id');
        closeCompanyModal();
        if(typeof window.openICVProject==='function') window.openICVProject(id);
        else if(typeof window.viewProject==='function') window.viewProject(id);
      }
    });
  }

  async function renderCompaniesSafe(){
    ensureStyles();
    const root=document.getElementById('page-companies');
    if(!root) return;
    root.innerHTML='<div class="panel"><h2>الشركات</h2><p class="muted">جاري تحميل بيانات الشركات...</p></div>';
    try{
    const dbx=window.__icvDb||window.__icvAccessClient;
    if(!dbx){
      root.innerHTML='<div class="panel"><h2>الشركات</h2><p class="bad">تعذر الاتصال بقاعدة البيانات.</p></div>';
      return;
    }

    let projects=Array.isArray(window.projects)?window.projects:[];
    let reports=Array.isArray(window.reports)?window.reports:[];
    if(!projects.length){
      const pr=await dbx.from('projects').select('*,government_entities(name),companies(name)').order('project_name');
      if(pr.error) throw pr.error;
      projects=pr.data||[];
    }
    if(!reports.length){
      const rr=await dbx.from('quarterly_reports').select('*').order('annual_period').order('quarter');
      if(rr.error) throw rr.error;
      reports=rr.data||[];
    }
    const result=await dbx.from('companies').select('*').order('name');
    if(result.error){
      root.innerHTML='<div class="panel"><h2>الشركات</h2><p class="bad">'+escV(result.error.message)+'</p></div>';
      return;
    }

    const allCompanies=result.data||[];
    const companies=allCompanies.filter(function(c){
      return projects.some(function(p){return String(p.implementing_company_id||'')===String(c.id)});
    });

    function statsFor(c){
      const ps=projects.filter(function(p){return String(p.implementing_company_id||'')===String(c.id)});
      const ms=ps.map(function(p){return projectMetrics(p,reports)});
      const ok=ms.filter(function(m){return m.ok}).length;
      const bad=ps.length-ok;
      return {
        projects:ps,count:ps.length,
        value:ps.reduce(function(a,p){return a+Number(p.total_project_value||0)},0),
        ok:ok,bad:bad,rate:ps.length?ok/ps.length*100:0,
        avgGoods:(ms.filter(function(m){return m.goods!=null}).length?ms.filter(function(m){return m.goods!=null}).reduce(function(a,m){return a+m.goods},0)/ms.filter(function(m){return m.goods!=null}).length:null)
      };
    }

    const summaries=companies.map(function(c){return statsFor(c)});
    const totalProjects=summaries.reduce(function(a,s){return a+s.count},0);
    const totalValue=summaries.reduce(function(a,s){return a+s.value},0);
    const totalOk=summaries.reduce(function(a,s){return a+s.ok},0);
    const totalBad=summaries.reduce(function(a,s){return a+s.bad},0);

    root.innerHTML='<div class="companies-page-kpis">'+
      '<div class="card"><div class="label">إجمالي الشركات المنفذة</div><div class="value">'+companies.length+'</div></div>'+
      '<div class="card"><div class="label">إجمالي المشاريع</div><div class="value">'+totalProjects+'</div><div class="sub">مشروع</div></div>'+
      '<div class="card"><div class="label">إجمالي قيمة المشاريع</div><div class="value">'+moneyV(totalValue)+'</div><div class="sub">ريال عماني</div></div>'+
      '<div class="card"><div class="label">المشاريع المستوفية</div><div class="value ok">'+totalOk+'</div></div>'+
      '<div class="card"><div class="label">المشاريع غير المستوفية</div><div class="value bad">'+totalBad+'</div></div>'+
      '</div>'+
      '<div class="panel">'+
        '<div class="toolbar"><div><h2>الشركات المنفذة</h2><div class="muted">متابعة الشركات المنفذة للمشاريع ومدى استيفائها لمتطلبات المحتوى المحلي.</div></div></div>'+
        '<div class="companies-filter-grid">'+
          '<div class="field"><label>البحث باسم الشركة</label><input id="companiesSearch" class="search" placeholder="اسم الشركة"></div>'+
          '<div class="field"><label>حالة الاستيفاء</label><select id="companiesCompliance"><option value="">كل الحالات</option><option value="ok">مستوفٍ</option><option value="bad">غير مستوفٍ</option></select></div>'+
          '<div class="field"><label>حالة المشروع</label><select id="companiesProjectStatus"><option value="">كل الحالات</option><option>مسند</option><option>قيد التنفيذ</option><option>منتهي</option><option>متعثر</option></select></div>'+
          '<div class="field"><label>السنة</label><select id="companiesYear"><option value="">كل السنوات</option>'+Array.from(new Set(reports.map(function(r){return r.annual_period}).filter(Boolean))).sort().map(function(y){return '<option value="'+escV(y)+'">'+escV(y)+'</option>'}).join('')+'</select></div>'+
        '</div>'+
        '<div id="companiesTable" class="table-wrap" style="margin-top:16px"></div>'+
      '</div>';

    function renderTable(){
      const q=(document.getElementById('companiesSearch')?.value||'').trim().toLowerCase();
      const complianceFilter=document.getElementById('companiesCompliance')?.value||'';
      const statusFilter=document.getElementById('companiesProjectStatus')?.value||'';
      const yearFilter=document.getElementById('companiesYear')?.value||'';

      const filtered=companies.map(function(c){return {company:c,stats:statsFor(c)}}).filter(function(x){
        if(q && !String(x.company.name||'').toLowerCase().includes(q)) return false;
        if(complianceFilter==='ok' && !x.stats.ok) return false;
        if(complianceFilter==='bad' && !x.stats.bad) return false;
        if(statusFilter && !x.stats.projects.some(function(p){return p.project_status===statusFilter})) return false;
        if(yearFilter){
          const ids=new Set(reports.filter(function(r){return String(r.annual_period)===String(yearFilter)}).map(function(r){return String(r.project_id)}));
          if(!x.stats.projects.some(function(p){return ids.has(String(p.id))})) return false;
        }
        return true;
      });

      document.getElementById('companiesTable').innerHTML='<table><thead><tr>'+
        '<th>م</th><th>الشركة المنفذة</th><th>عدد المشاريع</th><th>قيمة المشاريع (ر.ع)</th>'+
        '<th>مستوفٍ</th><th>غير مستوفٍ</th><th>نسبة الاستيفاء</th><th>عرض</th>'+
      '</tr></thead><tbody>'+filtered.map(function(x,i){
        return '<tr>'+
          '<td>'+String(i+1)+'</td>'+
          '<td><a href="#" class="companies-name" data-company-id="'+escV(x.company.id)+'">'+escV(x.company.name)+'</a></td>'+
          '<td>'+x.stats.count+'</td><td>'+moneyV(x.stats.value)+'</td>'+
          '<td><span class="companies-status companies-ok">'+x.stats.ok+'</span></td>'+
          '<td><span class="companies-status companies-bad">'+x.stats.bad+'</span></td>'+
          '<td><span class="companies-status '+(x.stats.rate>=70?'companies-ok':'companies-bad')+'">'+pctV(x.stats.rate)+'</span></td>'+
          '<td><button type="button" class="btn primary company-safe-view" data-company-id="'+escV(x.company.id)+'">عرض</button></td>'+
        '</tr>';
      }).join('')+'</tbody></table>';

      root.querySelectorAll('[data-company-id]').forEach(function(el){
        el.addEventListener('click',function(e){
          e.preventDefault();e.stopPropagation();
          const c=companies.find(function(x){return String(x.id)===String(el.getAttribute('data-company-id'))});
          if(c) openCompanyModal(c,statsFor(c),reports);
        });
      });
    }

    ['companiesSearch','companiesCompliance','companiesProjectStatus','companiesYear'].forEach(function(id){
      const el=document.getElementById(id);
      if(el){el.addEventListener('input',renderTable);el.addEventListener('change',renderTable);}
    });
    renderTable();
    }catch(err){
      console.error('Companies page error:',err);
      const root=document.getElementById('page-companies');
      if(root) root.innerHTML='<div class="panel"><h2>الشركات</h2><p class="bad">تعذر تحميل صفحة الشركات: '+escV(err?.message||err)+'</p></div>';
    }
  }

  window.icvCompaniesPage=renderCompaniesSafe;
  setTimeout(function(){
    const page=document.getElementById('page-companies');
    if(page && !page.classList.contains('hidden')) renderCompaniesSafe();
  },200);
  if(new URLSearchParams(location.search).get('page')==='companies') setTimeout(renderCompaniesSafe,250);
})();

// FINAL companies-page routing override: always use the current companies design.
(function(){
  const previousShowPage=window.showPage;
  window.showPage=function(n,b){
    if(n==='companies'){
      document.querySelectorAll('[id^="page-"]').forEach(function(x){x.classList.add('hidden')});
      const page=document.getElementById('page-companies');
      if(page) page.classList.remove('hidden');
      document.querySelectorAll('.nav button').forEach(function(x){x.classList.remove('active')});
      if(b) b.classList.add('active');
      if(window.pageTitle) pageTitle.textContent='الشركات';
      if(typeof window.icvCompaniesPage==='function') return window.icvCompaniesPage();
      if(page) page.innerHTML='<div class="panel"><h2>الشركات</h2><p class="bad">تعذر تحميل تصميم صفحة الشركات الجديدة.</p></div>';
      return;
    }
    return previousShowPage?.(n,b);
  };
  window.icvCompaniesPageReady=true;
})();