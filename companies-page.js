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

    const dbx=window.__icvDb||window.__icvAccessClient;
    if(!dbx){
      root.innerHTML='<div class="panel"><h2>الشركات</h2><p class="bad">تعذر الاتصال بقاعدة البيانات.</p></div>';
      return;
    }

    const projects=window.projects||[];
    const reports=window.reports||[];
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
  }

  window.icvCompaniesPage=renderCompaniesSafe;
  if(new URLSearchParams(location.search).get('page')==='companies') setTimeout(renderCompaniesSafe,0);
})();