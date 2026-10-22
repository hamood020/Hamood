/* Contracts and indicator workspace. Additive UI; project pages and calculations remain untouched. */
(() => {
  "use strict";
  const PAGE_ID = "page-contracts";
  const TYPES_FALLBACK = [
    {code:"future_cities",name_ar:"المدن المستقبلية",name_en:"Future cities",family:"project_like",sort_order:10},
    {code:"framework_it",name_ar:"العقد الإطاري لتقنية المعلومات",name_en:"IT framework agreement",family:"framework",sort_order:20},
    {code:"framework_vehicles",name_ar:"العقد الإطاري للمركبات",name_en:"Vehicles framework agreement",family:"framework",sort_order:30},
    {code:"framework_trucks_equipment",name_ar:"العقد الإطاري للشاحنات والمعدات",name_en:"Trucks and equipment framework agreement",family:"framework",sort_order:40},
    {code:"framework_student_desks",name_ar:"العقد الإطاري للأدراج الطلابية",name_en:"Student desks framework agreement",family:"framework",sort_order:50},
    {code:"framework_school_books",name_ar:"العقد الإطاري للكتب المدرسية",name_en:"School books framework agreement",family:"framework",sort_order:60},
    {code:"maintenance",name_ar:"عقود الصيانة",name_en:"Maintenance contracts",family:"service",sort_order:70},
    {code:"catering",name_ar:"عقود التغذية",name_en:"Catering contracts",family:"service",sort_order:80},
    {code:"supplies",name_ar:"التوريدات",name_en:"Supplies",family:"supply",sort_order:90}
  ];
  const METRIC_FALLBACK = [
    {code:"local_content_ratio",group_code:"value",title_ar:"نسبة المحتوى المحلي من إجمالي قيمة العقود الحكومية",formula_ar:"مجموع المحتوى المحلي المحقق ÷ إجمالي قيمة العقود الداخلة في نطاق القياس × 100",scope_note_ar:"الصيغ الأصلية في Excel مكسورة (#REF!).",target_period:.17,target_annual:.25,workbook_actual:null,workbook_source_status:"missing_formula",sort_order:10},
    {code:"omanization_compliance",group_code:"compliance",title_ar:"نسبة العقود المستوفية لمتطلبات التعمين",formula_ar:"عدد العقود المؤهلة المستوفية للتعمين ÷ عدد العقود المؤهلة قيد التنفيذ والمنتهية في 2026 × 100",scope_note_ar:"مرجع Excel: 22 من 34 عقدًا؛ القيمة مرجعية وليست نتيجة حية.",target_period:.53,target_annual:.8,workbook_actual:22/34,workbook_numerator:22,workbook_denominator:34,workbook_source_status:"available",sort_order:20},
    {code:"sme_compliance",group_code:"compliance",title_ar:"نسبة العقود المستوفية لمتطلبات المؤسسات الصغيرة والمتوسطة",formula_ar:"عدد العقود المؤهلة المستوفية لحد الإسناد للمؤسسات الصغيرة والمتوسطة ÷ عدد العقود المؤهلة × 100",scope_note_ar:"مرجع Excel: 19 من 34 عقدًا؛ القيمة مرجعية وليست نتيجة حية.",target_period:.47,target_annual:.7,workbook_actual:19/34,workbook_numerator:19,workbook_denominator:34,workbook_source_status:"available",sort_order:30},
    {code:"made_in_oman_compliance",group_code:"compliance",title_ar:"نسبة العقود الملتزمة بشراء المنتجات العمانية",formula_ar:"عدد المشاريع المؤهلة المستوفية لخطة المنتجات العمانية ÷ عدد المشاريع المؤهلة × 100",scope_note_ar:"مرجع Excel: 17 من 34 عقدًا؛ يجب مراجعة نطاق المقام قبل اعتماد النتيجة الحية.",target_period:.47,target_annual:.7,workbook_actual:.5,workbook_numerator:17,workbook_denominator:34,workbook_source_status:"available",sort_order:40},
    {code:"sme_award_value",group_code:"value",title_ar:"نسبة قيمة العقود المسندة للمؤسسات الصغيرة والمتوسطة",formula_ar:"قيمة الإسناد للمؤسسات الصغيرة والمتوسطة (مباشر + من الباطن) ÷ إجمالي قيمة المشتريات والمناقصات المشمولة × 100",scope_note_ar:"لا توجد نتيجة أو مستهدفات إجمالية صالحة في Excel.",target_period:null,target_annual:null,workbook_actual:null,workbook_source_status:"missing_formula",sort_order:50},
    {code:"sme_award_direct",parent_code:"sme_award_value",group_code:"value",title_ar:"أ) نسبة قيمة الإسناد للمؤسسات الصغيرة والمتوسطة (مباشر)",formula_ar:"قيمة الإسناد المباشر للمؤسسات الصغيرة والمتوسطة ÷ إجمالي المشتريات المباشرة المشمولة × 100",scope_note_ar:"لا توجد نتيجة أو مستهدفات لهذا الفرع في Excel.",target_period:null,target_annual:null,workbook_actual:null,workbook_source_status:"missing_formula",sort_order:51},
    {code:"sme_award_subcontract",parent_code:"sme_award_value",group_code:"value",title_ar:"ب) نسبة قيمة الإسناد للمؤسسات الصغيرة والمتوسطة (من الباطن)",formula_ar:"قيمة عقود الباطن المسندة للمؤسسات الصغيرة والمتوسطة ÷ إجمالي قيمة عقود الباطن المشمولة × 100",scope_note_ar:"المستهدف المرحلي الظاهر في Excel هو 13% فقط.",target_period:.13,target_annual:null,workbook_actual:null,workbook_source_status:"missing_formula",sort_order:52},
    {code:"local_product_purchase_share",group_code:"value",title_ar:"نسبة مشتريات المنتج المحلي من إجمالي المشتريات الحكومية",formula_ar:"قيمة مشتريات المنتجات المحلية ÷ إجمالي المشتريات الحكومية أو المشتريات ذات الصلة بالعقود × 100",scope_note_ar:"الصيغ الأصلية في Excel مكسورة (#REF!).",target_period:.07,target_annual:.1,workbook_actual:null,workbook_source_status:"missing_formula",sort_order:60}
  ];

  const state = {
    tab:"registry", loaded:false, loading:false, error:"", editing:null, selectedId:null,
    search:"", typeFilter:"", statusFilter:"", types:TYPES_FALLBACK, records:[],
    participants:[], reports:[], items:[], indicators:METRIC_FALLBACK, entities:[], companies:[],
    showForm:false, showReportForm:false, reportContractId:null,
    showImport:false, importBusy:false, importWorkbookName:"", importSheets:[],
    importSelectedSheets:[], importCandidates:[], importBatch:[], importWarnings:[],
    importIgnoredSheets:[], importStats:null, importError:""
  };
  const root = () => document.getElementById(PAGE_ID);
  const client = () => window.__icvAccessClient;
  const profile = () => window.__icvProfile || {};
  const canEdit = () => !!(window.ICV && window.ICV.canEdit && window.ICV.canEdit(profile()));
  const isAdmin = () => profile().role === "admin";
  const en = () => (window.ICVLanguage && window.ICVLanguage.get ? window.ICVLanguage.get()==="en" : localStorage.getItem("icv-ui-language")==="en");
  const T = (ar, english) => en() ? (english || ar) : ar;
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const n = (v) => { const z = Number(v); return Number.isFinite(z) ? z : 0; };
  const present = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
  const money = (v) => present(v) ? n(v).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:3}) : "—";
  const pct = (v) => v === null || v === undefined || !Number.isFinite(Number(v)) ? "—" : (n(v)*100).toLocaleString("en-US",{maximumFractionDigits:1})+"%";
  const dateOnly = (v) => v ? String(v).slice(0,10) : "—";
  const byId = (arr,id) => arr.find(x=>x.id===id);
  const typeOf = (code) => state.types.find(x=>x.code===code) || TYPES_FALLBACK.find(x=>x.code===code) || {code:code,name_ar:code,name_en:code,family:"supply"};
  const typeLabel = (code) => { const t=typeOf(code); return T(t.name_ar,t.name_en); };
  const categoryLabel = (code) => ({
    made_in_oman:T("منتج صنع في عُمان","Made-in-Oman product"),
    local_supplier:T("مورد محلي","Local supplier"),
    direct_import:T("استيراد مباشر","Direct import"),
    local_service:T("خدمة محلية","Local service"),
    foreign_service:T("خدمة أجنبية","Foreign service"),
    omani_wages:T("رواتب العمانيين","Omani wages"),
    non_omani_wages:T("رواتب غير العمانيين","Non-Omani wages"),
    other:T("بند آخر","Other item")
  })[code]||code;
  const entityLabel = (id) => { const e=byId(state.entities,id); return e ? e.name : "—"; };
  const companyLabel = (id) => { const c=byId(state.companies,id); return c ? c.name : "—"; };
  const message = (txt, kind) => { if (window.ICV && window.ICV.showMessage) window.ICV.showMessage(txt,kind||"success"); else alert(txt); };
  const statusLabel = (s) => ({ "مسند":T("مسند","Assigned"),"قيد التنفيذ":T("قيد التنفيذ","In progress"),"منتهي":T("منتهي","Completed"),"متعثر":T("متعثر","Stalled"),"مسودة":T("مسودة","Draft") })[s] || s || "—";

  function render() {
    const el=root(); if(!el) return;
    if(state.loading) { el.innerHTML='<div class="panel"><div class="muted">'+T("جارٍ تحميل بيانات العقود والمؤشرات...","Loading contracts and indicators...")+'</div></div>'; return; }
    if(state.error) {
      el.innerHTML='<section class="panel ct-error"><div class="ct-error-icon">!</div><h2>'+T("قسم العقود غير جاهز بعد","Contracts module is not ready")+'</h2><p>'+esc(state.error)+'</p><p class="muted">'+T("هذه الرسالة تعني أن ترحيل قاعدة البيانات الإضافي غير مطبق بعد. لم يتم تغيير جداول المشاريع الحالية.","This means the additive database migration has not been applied yet. Existing project tables remain untouched.")+'</p><button class="btn" data-ct-action="retry">'+T("إعادة المحاولة","Retry")+'</button></section>';
      addStyle(); return;
    }
    const count=state.records.length;
    const total=state.records.filter(c=>c.value_basis!=="framework_ceiling"&&c.value_basis!=="not_provided").reduce((a,c)=>a+n(c.contract_value),0);
    const ceilings=state.records.filter(c=>c.value_basis==="framework_ceiling").reduce((a,c)=>a+n(c.contract_value),0);
    const active=state.records.filter(c=>c.contract_status==="قيد التنفيذ").length;
    const near=state.records.filter(c=>c.end_date && new Date(c.end_date+"T00:00:00")>=new Date() && new Date(c.end_date+"T00:00:00")<=new Date(Date.now()+30*86400000)).length;
    el.innerHTML =
      '<div class="ct-shell">'+
        '<div class="ct-hero"><div><div class="ct-eyebrow">'+T("توسعة مستقلة عن المشاريع الإنمائية","An isolated extension to development projects")+'</div><h1>'+T("المشاريع والعقود","Projects & Contracts")+'</h1><p>'+T("سجل مستقل لأنواع العقود المختلفة، مع الاحتفاظ بنماذج المشاريع الإنمائية والتقارير الحالية كما هي.","Separate register for different contract types while leaving the existing development-project workflow intact.")+'</p></div><div class="ct-hero-actions"><button class="btn ct-secondary" data-ct-action="refresh">↻ '+T("تحديث البيانات","Refresh data")+'</button>'+(canEdit()?'<button class="btn ct-secondary" data-ct-action="import">⇧ '+T("استيراد Excel","Import Excel")+'</button><button class="btn primary" data-ct-action="add">＋ '+T("إضافة سجل","Add record")+'</button>':'')+'</div></div>'+
        '<div class="ct-safeguard"><strong>ⓘ '+T("حدود التغيير","Change boundary")+'</strong><span>'+T("هذه الصفحة تستخدم جداول العقود الجديدة فقط. لا تعدّل جدول projects ولا تقرأ تقارير المشاريع بغرض الكتابة عليها.","This page only writes to the new contract tables. It does not modify the projects table or existing project reports.")+'</span></div>'+
        '<div class="ct-kpis">'+
          '<div class="ct-kpi"><span>'+T("سجلات العقود","Contract records")+'</span><b>'+count.toLocaleString("en-US")+'</b><small>'+T("العقد الإطاري يسجل مرة واحدة","Each framework is counted once")+'</small></div>'+
          '<div class="ct-kpi"><span>'+T("قيمة العقود","Contract value")+'</span><b>'+money(total)+' <small>'+T("ر.ع","OMR")+'</small></b><small>'+T("لا تشمل أسقف الاتفاقيات الإطارية","Excludes framework ceilings")+'</small></div>'+
          '<div class="ct-kpi"><span>'+T("سقف الاتفاقيات الإطارية","Framework ceilings")+'</span><b>'+money(ceilings)+' <small>'+T("ر.ع","OMR")+'</small></b><small>'+T("معروض منفصلًا لتجنب جمعه مع قيم العقود","Shown separately to avoid double counting")+'</small></div>'+
          '<div class="ct-kpi"><span>'+T("قيد التنفيذ","In progress")+'</span><b>'+active.toLocaleString("en-US")+'</b><small>'+T("حسب حالة سجل العقد","By contract status")+'</small></div>'+
          '<div class="ct-kpi"><span>'+T("تنتهي خلال 30 يومًا","Ending in 30 days")+'</span><b>'+near.toLocaleString("en-US")+'</b><small>'+T("من السجلات ذات تاريخ انتهاء معروف","Known end dates only")+'</small></div>'+
        '</div>'+
        '<div class="ct-tabs"><button class="'+(state.tab==="registry"?"active":"")+'" data-ct-tab="registry">'+T("سجل العقود","Contract register")+'</button><button class="'+(state.tab==="indicators"?"active":"")+'" data-ct-tab="indicators">'+T("مؤشرات Excel","Workbook indicators")+'</button></div>'+
        (state.showImport ? renderImportPanel() : "")+
        (state.tab==="registry" ? renderRegistry() : renderIndicators())+
      '</div>';
    addStyle();
  }

  function renderRegistry() {
    const filtered=filteredRecords();
    const listRows=filtered.map(c=>{
      const t=typeOf(c.contract_type_code);
      return '<tr><td><b>'+esc(c.title)+'</b><small class="ct-cell-sub">'+esc(c.tender_number||"—")+'</small></td>'+
        '<td>'+esc(T(t.name_ar,t.name_en))+'</td><td>'+esc(entityLabel(c.government_entity_id))+'</td>'+
        '<td>'+esc(companyLabel(c.implementing_company_id))+'</td><td><span class="ct-status">'+esc(statusLabel(c.contract_status))+'</span></td>'+
        '<td class="ct-num">'+money(c.contract_value)+(c.value_basis==="framework_ceiling"?'<small class="ct-cell-sub">'+T("سقف اتفاقية","Framework ceiling")+'</small>':c.value_basis==="not_provided"?'<small class="ct-cell-sub">'+T("قيمة غير محددة","Value not specified")+'</small>':"")+'</td><td>'+esc(dateOnly(c.end_date))+'</td>'+
        '<td><div class="ct-row-actions"><button class="btn ct-small" data-ct-action="details" data-id="'+esc(c.id)+'">'+T("تفاصيل","Details")+'</button>'+
        (canEdit()?'<button class="btn ct-small" data-ct-action="edit" data-id="'+esc(c.id)+'">'+T("تعديل","Edit")+'</button>':'')+
        (isAdmin()?'<button class="btn ct-small danger" data-ct-action="delete" data-id="'+esc(c.id)+'">'+T("حذف","Delete")+'</button>':'')+
        '</div></td></tr>';
    }).join("");
    const options=state.types.map(t=>'<option value="'+esc(t.code)+'" '+(state.typeFilter===t.code?"selected":"")+'>'+esc(T(t.name_ar,t.name_en))+'</option>').join("");
    let html='<section class="panel ct-panel"><div class="ct-panel-head"><div><h2>'+T("سجل المشاريع والعقود الأخرى","Other projects and contracts")+'</h2><p class="muted">'+T("العقد الإطاري يظهر مرة واحدة؛ الجهات والموردون المسجلون تحته في شاشة التفاصيل.","A framework agreement appears once; its beneficiary entities and suppliers are managed in Details.")+'</p></div><span class="ct-count">'+filtered.length+' / '+state.records.length+'</span></div>'+
      '<div class="ct-filters"><input id="ct-search" class="search" placeholder="'+T("بحث بالاسم أو رقم المناقصة أو الجهة","Search title, tender or entity")+'" value="'+esc(state.search)+'"/>'+
      '<select id="ct-type-filter" class="ct-select"><option value="">'+T("كل أنواع العقود","All contract types")+'</option>'+options+'</select>'+
      '<select id="ct-status-filter" class="ct-select"><option value="">'+T("كل الحالات","All statuses")+'</option>'+["مسند","قيد التنفيذ","منتهي","متعثر","مسودة"].map(s=>'<option '+(state.statusFilter===s?"selected":"")+'>'+s+'</option>').join("")+'</select>'+
      '<button class="btn" data-ct-action="clear-filter">'+T("مسح الفلاتر","Clear filters")+'</button></div>'+
      '<div class="table-wrap"><table class="ct-table"><thead><tr><th>'+T("العقد / رقم المناقصة","Contract / Tender")+'</th><th>'+T("النوع","Type")+'</th><th>'+T("الجهة","Entity")+'</th><th>'+T("الشركة / المورد","Company / Supplier")+'</th><th>'+T("الحالة","Status")+'</th><th>'+T("القيمة (ر.ع)","Value (OMR)")+'</th><th>'+T("الانتهاء","End date")+'</th><th>'+T("الإجراءات","Actions")+'</th></tr></thead><tbody id="ct-results-body">'+(listRows||'<tr><td colspan="8" class="ct-empty">'+T("لا توجد سجلات مطابقة. أضف سجلًا جديدًا أو غيّر عوامل التصفية.","No matching records. Add a record or adjust filters.")+'</td></tr>')+'</tbody></table></div></section>';
    if(state.showForm) html+=renderContractForm();
    if(state.selectedId) html+=renderDetails(state.selectedId);
    return html;
  }

  function filteredRecords() {
    let rows=state.records.slice();
    if(state.typeFilter) rows=rows.filter(x=>x.contract_type_code===state.typeFilter);
    if(state.statusFilter) rows=rows.filter(x=>x.contract_status===state.statusFilter);
    const q=state.search.trim().toLowerCase();
    if(q) rows=rows.filter(c=>[c.title,c.tender_number,entityLabel(c.government_entity_id),companyLabel(c.implementing_company_id),typeLabel(c.contract_type_code)].some(v=>String(v||"").toLowerCase().includes(q)));
    return rows.sort((a,b)=>String(a.title).localeCompare(String(b.title),"ar"));
  }

  function optionList(items, selected, includeBlank, blankLabel) {
    return (includeBlank?'<option value="">'+esc(blankLabel||"—")+'</option>':"")+items.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===selected?"selected":"")+'>'+esc(x.name)+'</option>').join("");
  }
  function detailFields(code, details) {
    details=details||{};
    const add=(key,label,value,help)=>'<label class="ct-field"><span>'+label+'</span><input name="detail_'+key+'" value="'+esc(value||"")+'" />'+(help?'<small>'+help+'</small>':"")+'</label>';
    if(code==="future_cities") return add("scope","نطاق / مرحلة المشروع",details.scope,"يخص هذا النوع ولا يغيّر نموذج المشاريع الإنمائية الحالي.")+add("location","الموقع أو المدينة",details.location,"");
    if(code.indexOf("framework_")===0) return add("framework_period","مدة / فترة الاتفاقية",details.framework_period,"")+add("goods_scope","فئة التوريد",details.goods_scope,"");
    if(code==="maintenance"||code==="catering") return add("service_scope","نطاق الخدمة",details.service_scope,"")+add("workforce_notes","ملاحظات القوى العاملة",details.workforce_notes,"");
    if(code==="supplies") return add("items_description","وصف التوريدات",details.items_description,"")+add("origin_requirement","متطلب المنشأ المحلي",details.origin_requirement,"")+add("company_type","نوع الشركة",details.company_type,"");
    return add("item_description","وصف المجال / البند",details.item_description,"");
  }

  function renderContractForm() {
    const c=state.editing||{};
    const code=c.contract_type_code||state.types[0]?.code||"supplies";
    const d=c.details||{};
    return '<section class="panel ct-form-panel"><div class="ct-panel-head"><div><h2>'+(c.id?T("تعديل سجل العقد","Edit contract"):T("إضافة عقد أو مشروع آخر","Add contract or other project"))+'</h2><p class="muted">'+T("يُحفظ السجل في جداول العقود الجديدة فقط. الحقول الإضافية تتغير حسب النوع.","This record is saved only in the new contracts tables. Extra fields depend on the selected type.")+'</p></div><button class="btn" data-ct-action="cancel-form">× '+T("إلغاء","Cancel")+'</button></div>'+
    '<form id="ct-contract-form"><div class="ct-form-grid">'+
      '<label class="ct-field"><span>'+T("نوع السجل","Record type")+' *</span><select name="contract_type_code" id="ct-form-type" required>'+state.types.map(t=>'<option value="'+esc(t.code)+'" '+(code===t.code?"selected":"")+'>'+esc(T(t.name_ar,t.name_en))+'</option>').join("")+'</select></label>'+
      '<label class="ct-field ct-wide"><span>'+T("اسم العقد / المشروع","Contract / project title")+' *</span><input name="title" required value="'+esc(c.title||"")+'" maxlength="400"/></label>'+
      '<label class="ct-field"><span>'+T("رقم المناقصة","Tender number")+'</span><input name="tender_number" value="'+esc(c.tender_number||"")+'"/></label>'+
      '<label class="ct-field"><span>'+T("الجهة الحكومية","Government entity")+'</span><select name="government_entity_id">'+optionList(state.entities,c.government_entity_id,true,T("عقد متعدد الجهات / غير محدد","Multi-entity / not specified"))+'</select></label>'+
      '<label class="ct-field"><span>'+T("الشركة المنفذة / المورد الرئيسي","Implementer / main supplier")+'</span><select name="implementing_company_id">'+optionList(state.companies,c.implementing_company_id,true,T("عدة موردين / غير محدد","Multiple suppliers / not specified"))+'</select></label>'+
      '<label class="ct-field"><span>'+T("الاستشاري","Consultant")+'</span><input name="consultant" value="'+esc(c.consultant||"")+'"/></label>'+
      '<label class="ct-field"><span>'+T("قطاع العمل / المجال","Sector / field")+'</span><input name="sector" value="'+esc(c.sector||"")+'"/></label>'+
      '<label class="ct-field"><span>'+T("حالة العقد","Contract status")+'</span><select name="contract_status">'+["مسند","قيد التنفيذ","منتهي","متعثر","مسودة"].map(s=>'<option '+((c.contract_status||"مسند")===s?"selected":"")+'>'+s+'</option>').join("")+'</select></label>'+
      '<label class="ct-field"><span>'+T("قيمة العقد (ر.ع)","Contract value (OMR)")+'</span><input name="contract_value" type="number" min="0" step="0.001" value="'+esc(c.contract_value??"")+'"/></label>'+
      '<label class="ct-field"><span>'+T("طبيعة القيمة","Value basis")+'</span><select name="value_basis">'+[['contract_value','قيمة العقد'],['framework_ceiling','سقف اتفاقية إطارية'],['not_provided','غير متوفرة']].map(a=>'<option value="'+a[0]+'" '+((c.value_basis||"contract_value")===a[0]?"selected":"")+'>'+T(a[1],({"contract_value":"Contract value","framework_ceiling":"Framework ceiling","not_provided":"Not provided"}[a[0]]))+'</option>').join("")+'</select></label>'+
      '<label class="ct-field"><span>'+T("الصرف الفعلي حتى الآن (ر.ع)","Spend to date (OMR)")+'</span><input name="current_spend" type="number" min="0" step="0.001" value="'+esc(c.current_spend??"")+'"/></label>'+
      '<label class="ct-field"><span>'+T("تاريخ البدء","Start date")+'</span><input name="start_date" type="date" value="'+esc(c.start_date||"")+'"/></label>'+
      '<label class="ct-field"><span>'+T("تاريخ الانتهاء الحالي","Current end date")+'</span><input name="end_date" type="date" value="'+esc(c.end_date||"")+'"/></label>'+
      '<label class="ct-field"><span>'+T("تاريخ الانتهاء الأصلي","Original end date")+'</span><input name="original_end_date" type="date" value="'+esc(c.original_end_date||c.end_date||"")+'"/></label>'+
      '<label class="ct-field"><span>'+T("خطة المحتوى المحلي","Local content plan")+'</span><select name="has_local_content_plan"><option value="">'+T("غير محدد","Not specified")+'</option><option value="true" '+(c.has_local_content_plan===true?"selected":"")+'>'+T("نعم","Yes")+'</option><option value="false" '+(c.has_local_content_plan===false?"selected":"")+'>'+T("لا","No")+'</option></select></label>'+
      '<label class="ct-field"><span>'+T("نوع الشركة (للتوريدات)","Company type (supplies)")+'</span><input name="company_type" value="'+esc(c.company_type||"")+'"/></label>'+
      '<label class="ct-field"><span>'+T("نوع المناقصة","Tender type")+'</span><input name="tender_type" value="'+esc(c.tender_type||"")+'"/></label>'+
      '<div class="ct-form-divider ct-wide"><b>'+T("حقول خاصة بنوع السجل","Type-specific fields")+'</b><p class="muted">'+T("لا تؤثر هذه الحقول في الجداول أو الحسابات الخاصة بالمشاريع الإنمائية.","These fields do not affect development project tables or calculations.")+'</p></div>'+
      detailFields(code,d)+
      '<label class="ct-field ct-wide"><span>'+T("ملاحظات","Notes")+'</span><textarea name="notes" rows="3">'+esc((d.notes)||"")+'</textarea></label>'+
    '</div><div class="ct-form-actions"><button class="btn primary" type="submit">'+T("حفظ السجل","Save record")+'</button><button class="btn" type="button" data-ct-action="cancel-form">'+T("إلغاء","Cancel")+'</button></div></form></section>';
  }

  function renderDetails(id) {
    const c=byId(state.records,id); if(!c) return "";
    const ps=state.participants.filter(p=>p.contract_id===id);
    const rs=state.reports.filter(r=>r.contract_id===id).sort((a,b)=>String(b.report_year).localeCompare(String(a.report_year))||String(b.report_quarter).localeCompare(String(a.report_quarter))||String(b.created_at).localeCompare(String(a.created_at)));
    const framework=typeOf(c.contract_type_code).family==="framework";
    let h='<section class="panel ct-detail-panel"><div class="ct-panel-head"><div><h2>'+esc(c.title)+'</h2><p class="muted">'+esc(typeLabel(c.contract_type_code))+' · '+esc(c.tender_number||"—")+'</p></div><button class="btn" data-ct-action="close-details">× '+T("إغلاق التفاصيل","Close details")+'</button></div>'+
      '<div class="ct-detail-grid"><div><span>'+T("الجهة","Entity")+'</span><b>'+esc(entityLabel(c.government_entity_id))+'</b></div><div><span>'+T("الشركة","Company")+'</span><b>'+esc(companyLabel(c.implementing_company_id))+'</b></div><div><span>'+T("قيمة العقد","Contract value")+'</span><b>'+money(c.contract_value)+' '+T("ر.ع","OMR")+'</b></div><div><span>'+T("الصرف","Spend")+'</span><b>'+money(c.current_spend)+' '+T("ر.ع","OMR")+'</b></div></div>';
    if(framework) {
      h+='<div class="ct-subhead"><div><h3>'+T("الجهات المستفيدة والموردون","Beneficiaries and suppliers")+'</h3><p class="muted">'+T("يُسجّل العقد الإطاري مرة واحدة، ثم صف لكل جهة مستفيدة ومورد ومبلغها.","Store the framework once, then a row for each beneficiary, supplier and value.")+'</p></div></div>';
      h+='<div class="table-wrap"><table class="ct-table"><thead><tr><th>'+T("الجهة","Entity")+'</th><th>'+T("المورد","Supplier")+'</th><th>'+T("القيمة المسندة","Awarded value")+'</th><th>'+T("الصرف","Spend")+'</th><th>'+T("الحالة","Status")+'</th>'+(isAdmin()?'<th></th>':"")+'</tr></thead><tbody>'+
      (ps.map(p=>'<tr><td>'+esc(entityLabel(p.government_entity_id))+'</td><td>'+esc(companyLabel(p.company_id))+'</td><td class="ct-num">'+money(p.assigned_value)+'</td><td class="ct-num">'+money(p.spend_amount)+'</td><td>'+esc(p.status||"—")+'</td>'+(isAdmin()?'<td><button class="btn ct-small danger" data-ct-action="delete-participation" data-id="'+esc(p.id)+'">'+T("حذف","Delete")+'</button></td>':"")+'</tr>').join("")||'<tr><td colspan="6" class="ct-empty">'+T("لم تتم إضافة جهات أو موردين بعد.","No beneficiary entities or suppliers have been added yet.")+'</td></tr>')+'</tbody></table></div>';
      if(canEdit()) h+='<form id="ct-participation-form" class="ct-inline-form"><input type="hidden" name="contract_id" value="'+esc(id)+'"/><label class="ct-field"><span>'+T("الجهة المستفيدة","Beneficiary entity")+'</span><select name="government_entity_id" required>'+optionList(state.entities,"",false)+'</select></label><label class="ct-field"><span>'+T("المورد","Supplier")+'</span><select name="company_id">'+optionList(state.companies,"",true,T("غير محدد","Not specified"))+'</select></label><label class="ct-field"><span>'+T("القيمة المسندة","Awarded value")+'</span><input name="assigned_value" type="number" min="0" step=".001"/></label><label class="ct-field"><span>'+T("الصرف","Spend")+'</span><input name="spend_amount" type="number" min="0" step=".001"/></label><button class="btn primary" type="submit">'+T("إضافة الجهة / المورد","Add entity / supplier")+'</button></form>';
    }
    h+='<div class="ct-subhead"><div><h3>'+T("التقارير والبيانات المعتمدة","Reports and approved data")+'</h3><p class="muted">'+T("المؤشرات الرسمية تعتمد فقط على التقارير المعتمدة. البيانات غير المعتمدة لا تُحسب كإنجاز رسمي.","Official indicators use approved reports only. Unapproved reports are not counted as achieved performance.")+'</p></div>'+(canEdit()?'<button class="btn primary" data-ct-action="add-report" data-id="'+esc(id)+'">＋ '+T("إضافة تقرير","Add report")+'</button>':"")+'</div>';
    h+='<div class="ct-report-list">'+(rs.map(r=>{
      const d=r.report_data||{};
      const lines=state.items.filter(item=>item.report_id===r.id);
      return '<div class="ct-report-row"><div><b>'+esc(r.report_quarter+" "+r.report_year)+'</b><small>'+T("القيمة المحلية","Local content")+': '+money(d.local_content_achieved)+' '+T("ر.ع","OMR")+'</small></div><span class="ct-report-state '+(r.report_status==="approved"?"approved":"")+'">'+esc(({draft:"مسودة",submitted:"مقدم",under_review:"تحت المراجعة",approved:"معتمد",rejected:"مرفوض"}[r.report_status])||r.report_status)+'</span></div>'+
        (lines.length?'<div class="ct-saved-lines">'+lines.map(item=>'<span>'+esc(categoryLabel(item.category_code))+' · '+money(item.amount)+' '+T("ر.ع","OMR")+(item.company_id?' · '+esc(companyLabel(item.company_id)):"")+'</span>').join("")+'</div>':"");
    }).join("")||'<div class="ct-empty">'+T("لا توجد تقارير مسجلة.","No reports recorded.")+'</div>')+'</div>';
    if(state.showReportForm && state.reportContractId===id) h+=renderReportForm(id);
    h+='</section>';
    return h;
  }

  function reportItemRow() {
    const categories = [
      ["made_in_oman", T("منتج صنع في عُمان", "Made-in-Oman product")],
      ["local_supplier", T("مورد محلي", "Local supplier")],
      ["direct_import", T("استيراد مباشر", "Direct import")],
      ["local_service", T("خدمة محلية", "Local service")],
      ["foreign_service", T("خدمة أجنبية", "Foreign service")],
      ["omani_wages", T("رواتب العمانيين", "Omani wages")],
      ["non_omani_wages", T("رواتب غير العمانيين", "Non-Omani wages")],
      ["other", T("بند آخر", "Other item")]
    ];
    const categoryOptions = categories.map(x=>'<option value="'+x[0]+'">'+esc(x[1])+'</option>').join("");
    return '<div class="ct-item-row">'+
      '<label class="ct-field"><span>'+T("فئة التكلفة","Cost category")+'</span><select data-item-field="category_code">'+categoryOptions+'</select></label>'+
      '<label class="ct-field"><span>'+T("طريقة الإسناد","Award route")+'</span><select data-item-field="procurement_route"><option value="not_applicable">'+T("غير منطبق","Not applicable")+'</option><option value="direct">'+T("مباشر","Direct")+'</option><option value="subcontract">'+T("من الباطن","Subcontract")+'</option></select></label>'+
      '<label class="ct-field"><span>'+T("المورد / الشركة","Supplier / company")+'</span><select data-item-field="company_id">'+optionList(state.companies,"",true,T("غير محدد","Not specified"))+'</select></label>'+
      '<label class="ct-field"><span>'+T("قيمة البند (ر.ع)","Item amount (OMR)")+'</span><input data-item-field="amount" type="number" min="0" step="0.001" value=""/></label>'+
      '<label class="ct-field"><span>'+T("معامل معتمد (اختياري، من 0 إلى 1)","Approved coefficient (optional, 0 to 1)")+'</span><input data-item-field="content_coefficient" type="number" min="0" max="1" step="0.000001" value=""/></label>'+
      '<label class="ct-field"><span>'+T("المحتوى المحلي المحقق (ر.ع)","Achieved local content (OMR)")+'</span><input data-item-field="local_content_amount" type="number" min="0" step="0.001" value=""/></label>'+
      '<label class="ct-field"><span>'+T("منشأة صغيرة أو متوسطة؟","SME?")+'</span><select data-item-field="is_sme"><option value="">'+T("غير محدد","Not specified")+'</option><option value="true">'+T("نعم","Yes")+'</option><option value="false">'+T("لا","No")+'</option></select></label>'+
      '<label class="ct-field"><span>'+T("منتج عماني؟","Omani product?")+'</span><select data-item-field="is_omani_product"><option value="">'+T("غير محدد","Not specified")+'</option><option value="true">'+T("نعم","Yes")+'</option><option value="false">'+T("لا","No")+'</option></select></label>'+
      '<div class="ct-item-row-remove"><button type="button" class="btn ct-small" data-ct-action="remove-item-row">'+T("حذف البند","Remove line")+'</button></div>'+
    '</div>';
  }

  function renderReportForm(id) {
    const input=(name,label,type,value,step)=>'<label class="ct-field"><span>'+label+'</span><input name="'+name+'" type="'+type+'" '+(step?'step="'+step+'"':"")+' '+(type==="number"?'min="0"':"")+' value="'+esc(value??"")+'"/></label>';
    const flag=(name,label)=>'<label class="ct-field"><span>'+label+'</span><select name="'+name+'"><option value="">'+T("غير مقيم","Not assessed")+'</option><option value="true">'+T("مستوفٍ","Compliant")+'</option><option value="false">'+T("غير مستوفٍ","Not compliant")+'</option></select></label>';
    const contract=byId(state.records,id)||{};
    const family=typeOf(contract.contract_type_code).family;
    const needsWorkforce=family==="project_like"||family==="service";
    const statuses=[["draft","مسودة"],["submitted","مقدم"],["under_review","تحت المراجعة"]];
    if(isAdmin()) statuses.push(["approved","معتمد"]);
    const workforceSection=needsWorkforce
      ? '<div class="ct-form-divider ct-wide"><b>'+T("العمالة والرواتب","Workforce and wages")+'</b><p class="muted">'+T("يظهر هذا القسم للمشاريع وعقود الخدمات مثل الصيانة والتغذية.","This section is shown for project-like records and service contracts such as maintenance and catering.")+'</p></div>'+
        input("workforce_omani",T("عدد العمانيين","Omani workforce"),"number","","1")+
        input("workforce_non_omani",T("عدد غير العمانيين","Non-Omani workforce"),"number","","1")+
        input("omani_wages",T("رواتب العمانيين (ر.ع)","Omani wages (OMR)"),"number","","0.001")+
        input("non_omani_wages",T("رواتب غير العمانيين (ر.ع)","Non-Omani wages (OMR)"),"number","","0.001")+
        flag("omanization_compliant",T("استيفاء التعمين","Omanization compliant"))
      : "";
    const statusSection='<div class="ct-form-divider ct-wide"><b>'+T("حالة الاستيفاء","Compliance status")+'</b><p class="muted">'+T("لا تدخل قيمة غير مقيمة على أنها مستوفية. اتركها غير مقيمة إذا لم تتوفر أدلة.","Do not treat an unassessed value as compliant. Leave it unassessed if evidence is unavailable.")+'</p></div>'+
      flag("sme_compliant",T("استيفاء متطلبات SME","SME requirement compliant"))+
      flag("made_in_oman_compliant",T("استيفاء المنتجات العمانية","Made-in-Oman compliant"));
    const financialSection='<div class="ct-form-divider ct-wide"><b>'+T("القيم المالية للمؤشرات","Financial indicator inputs")+'</b><p class="muted">'+T("أدخل الإجماليات الموثقة من التقرير. تظل معاملات الاحتساب غير المحددة غير مستخدمة.","Enter totals supported by the report. Unconfirmed coefficients are not automatically applied.")+'</p></div>'+
      input("local_content_achieved",T("المحتوى المحلي المحقق التراكمي حتى الفترة (ر.ع)","Cumulative achieved local content to date (OMR)"),"number","","0.001")+
      input("direct_procurement_total",T("إجمالي المشتريات المباشرة المشمولة","Covered direct procurement value"),"number","","0.001")+
      input("direct_sme_awards",T("إسناد مباشر لـ SME","Direct SME awards"),"number","","0.001")+
      input("subcontract_procurement_total",T("إجمالي عقود الباطن المشمولة","Covered subcontract value"),"number","","0.001")+
      input("subcontract_sme_awards",T("إسناد من الباطن لـ SME","SME subcontract awards"),"number","","0.001")+
      input("local_product_purchase",T("قيمة المنتجات المحلية المشتراة","Local products purchased"),"number","","0.001")+
      input("total_government_purchases",T("إجمالي المشتريات الحكومية المشمولة","Covered government purchases"),"number","","0.001");
    return '<div class="ct-report-form"><h3>'+T("بيانات التقرير","Report data")+'</h3><p class="muted">'+T("يختلف هذا النموذج حسب عائلة العقد. إذا كانت التقارير تراكمية فأدخل آخر إجمالي معتمد حتى هذه الفترة؛ المؤشرات تستخدم أحدث تقرير معتمد داخل سنة القياس ولا تجمع الإجماليات التراكمية المتكررة. البنود التفصيلية اختيارية، ولا يُطبّق معامل محتوى محلي تلقائيًا ما لم يُدخل معامل معتمد.","This form varies by contract family. For cumulative reports, enter the latest approved cumulative total to this period; indicators use the latest approved report within the measurement year and do not add repeated cumulative totals. Line items are optional; no coefficient is applied unless approved.")+'</p>'+
      '<form id="ct-report-form"><input type="hidden" name="contract_id" value="'+esc(id)+'"/><div class="ct-form-grid">'+
      input("report_year",T("السنة","Year"),"number",new Date().getFullYear(),"1")+
      '<label class="ct-field"><span>'+T("الفترة","Period")+'</span><select name="report_quarter"><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option><option>ANNUAL</option></select></label>'+
      '<label class="ct-field"><span>'+T("الحالة","Status")+'</span><select name="report_status">'+statuses.map(x=>'<option value="'+x[0]+'">'+T(x[1],({"draft":"Draft","submitted":"Submitted","under_review":"Under review","approved":"Approved"}[x[0]]))+'</option>').join("")+'</select></label>'+
      workforceSection+statusSection+financialSection+
      '<div class="ct-form-divider ct-wide"><b>'+T("تفصيل بنود التقرير (اختياري)","Report line items (optional)")+'</b><p class="muted">'+T("أضف بندًا لكل فئة تكلفة أو مورد تريد تتبعه. المعامل فارغ افتراضيًا حتى يتم اعتماده.","Add one line for each cost category or supplier you want to track. The coefficient stays blank until approved.")+'</p></div>'+
      '<div class="ct-item-lines ct-wide">'+reportItemRow()+'</div><div class="ct-wide"><button type="button" class="btn" data-ct-action="add-item-row">＋ '+T("إضافة بند آخر","Add another line")+'</button></div>'+
      '</div><div class="ct-form-actions"><button class="btn primary" type="submit">'+T("حفظ التقرير","Save report")+'</button><button class="btn" type="button" data-ct-action="cancel-report">'+T("إلغاء","Cancel")+'</button></div></form></div>';
  }

  function indicatorLive(code) {
    const projects=Array.isArray(window.projects)?window.projects:[];
    const contracts=state.records;
    // Workbook indicators are explicitly measured for 2026; do not accidentally take a later-year report.
    const approved=latestApprovedReports(2026);
    const reportByContract=new Map(approved.map(r=>[r.contract_id,r]));
    const overlaps2026=x=>(!x.start_date||String(x.start_date).slice(0,4)<="2026")&&(!x.end_date||String(x.end_date).slice(0,4)>="2026");
    const ends2026=x=>x.end_date&&String(x.end_date).slice(0,4)==="2026";
    const active=x=>["قيد التنفيذ","In progress","in_progress"].includes(x.contract_status||x.project_status);
    const projectScope=projects.filter(p=>ends2026(p)&&active(p));
    const serviceScope=contracts.filter(c=>(c.contract_type_code==="maintenance"||c.contract_type_code==="catering")&&ends2026(c)&&active(c));

    if(code==="omanization_compliance"||code==="sme_compliance") {
      const field=code==="omanization_compliance"?"omanization_status":"sme_10_status";
      const flag=code==="omanization_compliance"?"omanization_compliant":"sme_compliant";
      const rows=projectScope.map(p=>assessment(p[field]));
      serviceScope.forEach(c=>{const r=reportByContract.get(c.id); rows.push(r&&r.report_data? (r.report_data[flag]===true?true:r.report_data[flag]===false?false:null):null);});
      if(!rows.length||rows.some(v=>v===null)) return null;
      const eligible=rows.filter(v=>v!=="na");
      return eligible.length?{actual:eligible.filter(Boolean).length/eligible.length,num:eligible.filter(Boolean).length,den:eligible.length}:null;
    }

    if(code==="made_in_oman_compliance") {
      const rows=projectScope.map(p=>assessment(p.made_in_oman_status));
      if(!rows.length||rows.some(v=>v===null)) return null;
      const eligible=rows.filter(v=>v!=="na");
      return eligible.length?{actual:eligible.filter(Boolean).length/eligible.length,num:eligible.filter(Boolean).length,den:eligible.length}:null;
    }

    const contracts2026=contracts.filter(overlaps2026);
    const contractReports=contracts2026.map(c=>({c,r:reportByContract.get(c.id)}));
    const hasAllReports=contracts2026.length>0&&contractReports.every(x=>x.r&&x.r.report_status==="approved"&&x.r.report_data);

    if(code==="local_content_ratio") {
      let denominator=0,numerator=0,complete=true;
      const projectsInScope=projects.filter(overlaps2026);
      projectsInScope.forEach(p=>{
        const hasApproved=(window.reports||[]).some(r=>r.project_id===p.id&&["معتمد","approved"].includes(String(r.status||"")));
        if(p.total_project_value==null||p.total_local_content==null||!hasApproved) complete=false;
        else { denominator+=n(p.total_project_value); numerator+=n(p.total_local_content); }
      });
      if(contracts2026.length&&!hasAllReports) complete=false;
      contractReports.forEach(x=>{
        const d=x.r&&x.r.report_data;
        if(!x.r||!d||x.c.contract_value==null||d.local_content_achieved==null) complete=false;
        else { denominator+=n(x.c.contract_value); numerator+=n(d.local_content_achieved); }
      });
      return complete&&denominator>0?{actual:numerator/denominator,num:numerator,den:denominator}:null;
    }

    if(code==="sme_award_direct"||code==="sme_award_subcontract"||code==="sme_award_value") {
      if(!hasAllReports) return null;
      const required=code==="sme_award_direct"
        ?["direct_sme_awards","direct_procurement_total"]
        :code==="sme_award_subcontract"
          ?["subcontract_sme_awards","subcontract_procurement_total"]
          :["direct_sme_awards","direct_procurement_total","subcontract_sme_awards","subcontract_procurement_total"];
      if(contractReports.some(x=>required.some(k=>x.r.report_data[k]===undefined||x.r.report_data[k]===null||x.r.report_data[k]===""))) return null;
      let directSME=0,directTotal=0,subSME=0,subTotal=0;
      contractReports.forEach(x=>{
        const d=x.r.report_data;
        directSME+=n(d.direct_sme_awards); directTotal+=n(d.direct_procurement_total);
        subSME+=n(d.subcontract_sme_awards); subTotal+=n(d.subcontract_procurement_total);
      });
      if(code==="sme_award_direct") return directTotal>0?{actual:directSME/directTotal,num:directSME,den:directTotal}:null;
      if(code==="sme_award_subcontract") return subTotal>0?{actual:subSME/subTotal,num:subSME,den:subTotal}:null;
      const den=directTotal+subTotal,num=directSME+subSME;
      return den>0?{actual:num/den,num:num,den:den}:null;
    }

    if(code==="local_product_purchase_share") {
      if(!hasAllReports||contractReports.some(x=>x.r.report_data.local_product_purchase==null||x.r.report_data.total_government_purchases==null)) return null;
      const local=contractReports.reduce((a,x)=>a+n(x.r.report_data.local_product_purchase),0);
      const total=contractReports.reduce((a,x)=>a+n(x.r.report_data.total_government_purchases),0);
      return total>0?{actual:local/total,num:local,den:total}:null;
    }
    return null;
  }

  function assessment(value) {
    const v=String(value||"").trim().toLowerCase();
    if(["مستوفي","مستوفٍ","مستوف","متوافق","compliant","met"].includes(v)) return true;
    if(["غير مستوفي","غير مستوفٍ","غير مستوف","غير متوافق","not compliant","noncompliant","not met"].includes(v)) return false;
    if(["غير منطبق","لا ينطبق","not applicable","n/a","na"].includes(v)) return "na";
    return null;
  }
  function latestApprovedReports(year) {
    const map=new Map();
    const quarterRank=q=>q==="ANNUAL"?5:(Number(String(q||"").replace(/\\D/g,""))||0);
    state.reports.filter(r=>r.report_status==="approved"&&(year==null||n(r.report_year)===Number(year))).sort((a,b)=>
      quarterRank(a.report_quarter)-quarterRank(b.report_quarter)||
      String(a.updated_at||a.created_at).localeCompare(String(b.updated_at||b.created_at))
    ).forEach(r=>map.set(r.contract_id,r));
    return Array.from(map.values());
  }

  function renderIndicators() {
    const groups = [
      {title:T("المحتوى المحلي والمشتريات","Local content and purchases"),codes:["local_content_ratio","sme_award_value","sme_award_direct","sme_award_subcontract","local_product_purchase_share"]},
      {title:T("مؤشرات الامتثال","Compliance indicators"),codes:["omanization_compliance","sme_compliance","made_in_oman_compliance"]}
    ];
    let html='<section class="ct-panel"><div class="ct-panel-head"><div><h2>'+T("مؤشرات الأداء الواردة في ملف Excel","Performance indicators from the Excel workbook")+'</h2><p class="muted">'+T("تظهر أهداف 2026 والمرجع التاريخي، وتُحسب النتيجة الحية من البيانات المعتمدة عند توفرها. المرجع ليس نتيجة حية.","2026 targets and the historical reference are shown separately. Live results use approved data when available.")+'</p></div></div>'+
      '<div class="ct-indicator-warning"><b>'+T("ملاحظة مهمة","Important note")+'</b><span>'+T("مؤشرا المحتوى المحلي الكلي ومشتريات المنتجات المحلية يحتويان #REF! في المصنف، لذلك لم نضع قيمة فعلية بديلة. كما أن نطاق مؤشر المنتجات العمانية يحتاج تأكيدًا لأن المقام في Excel (34) قد لا يطابق عنوان المؤشر.","The workbook has #REF! for the total local-content and local-product-purchase formulas, so no substitute actual is invented. The Made-in-Oman KPI scope also needs confirmation because the workbook denominator (34) may not match its title.")+'</span></div>';
    groups.forEach(g=>{
      html+='<h3 class="ct-group-title">'+g.title+'</h3><div class="ct-indicator-grid">';
      g.codes.forEach(code=>{
        const row=state.indicators.find(x=>x.code===code)||METRIC_FALLBACK.find(x=>x.code===code); if(!row)return;
        const live=indicatorLive(code);
        const target=row.target_annual!=null?row.target_annual:row.target_period;
        const actual=live?live.actual:null;
        const hasReference=row.workbook_actual!=null;
        const badgeClass=actual==null||target==null?"pending":(actual>=target?"met":"under");
        const badgeText=actual==null?T("بانتظار بيانات","Awaiting data"):target==null?T("لا يوجد مستهدف معتمد","No approved target"):actual>=target?T("حقق الهدف","Target met"):T("دون الهدف","Below target");
        html+='<article class="ct-indicator-card"><div class="ct-indicator-top"><span class="ct-indicator-kind">'+(row.group_code==="compliance"?T("امتثال","Compliance"):T("قيمة مالية","Financial value"))+'</span><span class="ct-indicator-status '+badgeClass+'">'+badgeText+'</span></div>'+
          '<h4>'+esc(T(row.title_ar,row.title_en||row.title_ar))+'</h4>'+
          '<div class="ct-main-actual"><span>'+T("نتيجة المنصة الحالية","Current live result")+'</span><b>'+(actual!=null?pct(actual):"—")+'</b></div>'+
          '<div class="ct-metric-facts"><div><span>'+T("المستهدف المرحلي","Period target")+'</span><b>'+pct(row.target_period)+'</b></div><div><span>'+T("المستهدف السنوي 2026","2026 annual target")+'</span><b>'+pct(row.target_annual)+'</b></div><div><span>'+T("مرجع Excel","Excel reference")+'</span><b>'+(hasReference?pct(row.workbook_actual):T("غير متوفر","Unavailable"))+'</b></div></div>'+
          (live?'<div class="ct-live-ratio">'+T("البسط / المقام الحالي","Current numerator / denominator")+': <b>'+money(live.num)+' / '+money(live.den)+'</b></div>':"")+
          '<div class="ct-formula"><b>'+T("المعادلة","Formula")+'</b><p>'+esc(T(row.formula_ar,row.formula_en||row.formula_ar))+'</p></div>'+
          '<p class="ct-metric-note">'+esc(row.scope_note_ar||"")+'</p></article>';
      });
      html+='</div>';
    });
    html+='<section class="panel ct-reference-table"><h3>'+T("مرجع Excel الأصلي","Original Excel reference")+'</h3><p class="muted">'+T("القيم 64.7% و55.9% و50% محفوظة كمرجع من الملف: 22/34 و19/34 و17/34. لا تُستخدم بديلًا عن النتيجة الحالية للمنصة.","The 64.7%, 55.9% and 50% values are stored as workbook references: 22/34, 19/34 and 17/34. They do not replace the live platform result.")+'</p><div class="table-wrap"><table class="ct-table"><thead><tr><th>'+T("المؤشر","Indicator")+'</th><th>'+T("المحقق في Excel","Workbook actual")+'</th><th>'+T("البسط","Numerator")+'</th><th>'+T("المقام","Denominator")+'</th><th>'+T("الهدف المرحلي","Period target")+'</th><th>'+T("هدف 2026","2026 target")+'</th></tr></thead><tbody>'+
      state.indicators.filter(x=>x.workbook_actual!=null).map(r=>'<tr><td>'+esc(T(r.title_ar,r.title_en||r.title_ar))+'</td><td>'+pct(r.workbook_actual)+'</td><td class="ct-num">'+money(r.workbook_numerator)+'</td><td class="ct-num">'+money(r.workbook_denominator)+'</td><td>'+pct(r.target_period)+'</td><td>'+pct(r.target_annual)+'</td></tr>').join("")+
      '</tbody></table></div></section>';
    return html;
  }


  const IMPORT_RULES = [
    {sheet:"المدن المستقبلية",typeCode:"future_cities",mode:"simple"},
    {sheet:"العقد الإطاري لتقنية المعلومات",typeCode:"framework_it",mode:"wide"},
    {sheet:"العقد الإطاري للمركبات",typeCode:"framework_vehicles",mode:"wide"},
    {sheet:"العقد الإطاري للشاحنات والمعدات",typeCode:"framework_trucks_equipment",mode:"wide"},
    {sheet:"العقد الإطاري للادراج الطلابية",typeCode:"framework_student_desks",mode:"supplier_rows"},
    {sheet:"العقد الإطاري للكتب المدرسية",typeCode:"framework_school_books",mode:"supplier_rows"},
    {sheet:"عقود الصيانة",typeCode:"maintenance",mode:"simple"},
    {sheet:"عقود التغذية",typeCode:"catering",mode:"simple"},
    {sheet:"التوريدات",typeCode:"supplies",mode:"simple"}
  ];

  function importNormalize(value) {
    return String(value==null?"":value).normalize("NFKC")
      .replace(/[\u064B-\u065F\u0670\u0640]/g,"")
      .replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
      .toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");
  }
  function importText(value) {
    if(value==null) return "";
    if(value instanceof Date) return value.toISOString().slice(0,10);
    return String(value).trim();
  }
  function importNumber(value) {
    if(typeof value==="number") return Number.isFinite(value)?value:null;
    const raw=importText(value);
    if(!raw||/^#/.test(raw)) return null;
    const clean=raw.replace(/OMR/gi,"").replace(/ريال\s*عماني|ر\.?\s*ع\.?/g,"").replace(/[,٬\s]/g,"").replace(/[^\d.\-]/g,"");
    if(!clean||!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(clean)) return null;
    const result=Number(clean);
    return Number.isFinite(result)?result:null;
  }
  function importDate(value) {
    if(value instanceof Date&&!Number.isNaN(value.getTime())) return value.toISOString().slice(0,10);
    if(typeof value==="number"&&value>20000&&value<80000) {
      const d=new Date(Date.UTC(1899,11,30)+Math.round(value)*86400000);
      return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10);
    }
    const raw=importText(value);
    if(!raw||/^#/.test(raw)) return null;
    let m=raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if(m) return m[1]+"-"+String(m[2]).padStart(2,"0")+"-"+String(m[3]).padStart(2,"0");
    const parsed=new Date(raw);
    return !Number.isNaN(parsed.getTime())&&/\d/.test(raw)?parsed.toISOString().slice(0,10):null;
  }
  function importHeaderIndex(headers, terms, exact) {
    const normalized=headers.map(importNormalize);
    for(const term of terms) {
      const wanted=importNormalize(term);
      const idx=normalized.findIndex(v=>exact?v===wanted:v.includes(wanted));
      if(idx>=0) return idx;
    }
    return -1;
  }
  function importCell(row, index) { return index>=0?row[index]:null; }
  function importRowSnapshot(headers,row) {
    const out={};
    headers.forEach((h,i)=>{
      const key=importText(h), value=row[i];
      if(!key||value==null||value==="") return;
      out[key]=value instanceof Date?value.toISOString():value;
    });
    return out;
  }
  function importFindMaster(collection, name) {
    const wanted=importNormalize(name);
    if(!wanted) return null;
    const matches=collection.filter(x=>importNormalize(x.name)===wanted);
    return matches.length===1?matches[0]:null;
  }
  function importBool(value) {
    const v=importNormalize(value);
    if(["نعم","yes","true","1","موجود"].includes(v)) return true;
    if(["لا","no","false","0","غيرموجود"].includes(v)) return false;
    return null;
  }
  function importStatus(value, family) {
    const raw=importText(value);
    if(!raw) return family==="framework"||family==="project_like"?"قيد التنفيذ":"مسند";
    const v=importNormalize(raw);
    if(v.includes("متعثر")) return "متعثر";
    if(v.includes("منتهي")||v.includes("مكتمل")) return "منتهي";
    if(v.includes("مسند")) return "مسند";
    if(v.includes("تنفيذ")||v.includes("جاري")||v.includes("قيد")) return "قيد التنفيذ";
    return raw;
  }
  function importSheetRule(name) {
    const normalized=importNormalize(name);
    return IMPORT_RULES.find(rule=>importNormalize(rule.sheet)===normalized)||null;
  }
  function importKey(contract, context) {
    const code=contract.contract_type_code||"";
    const family=typeOf(code).family;
    const base=code+"|"+importNormalize(contract.tender_number)+"|"+importNormalize(contract.title);
    return family==="framework"?base:base+"|"+importNormalize(context||"");
  }
  function importExistingKey(c) {
    const details=c.details||{};
    const entity=details.workbook_source_entity_name||entityLabel(c.government_entity_id);
    const company=details.workbook_source_company_name||companyLabel(c.implementing_company_id);
    return importKey(c, String(entity==="—"?"":entity)+"|"+String(company==="—"?"":company));
  }
  function importCreateBase(rule, sheetName, headers, row, sourceRow) {
    const titleIdx=importHeaderIndex(headers,["اسم المشروع","اسم العقد"],false);
    const entityIdx=importHeaderIndex(headers,["الجهة الحكومية","الجهة"],false);
    const companyIdx=importHeaderIndex(headers,["الجهة المنفذة","الشركة المنفذة","الشركات","المقاول","المورد"],false);
    const tenderIdx=importHeaderIndex(headers,["رقم نوع المناقصة","رقم المناقصة"],false);
    const statusIdx=importHeaderIndex(headers,["حالة العقد","حالة المشروع","حالة"],false);
    const startIdx=importHeaderIndex(headers,["تاريخ البدء","تاريخ البداية"],false);
    const endIdx=importHeaderIndex(headers,["تاريخ الانتهاء","تاريخ الانتهاء"],false);
    const valueIdx=importHeaderIndex(headers,["قيمة المشروع الاجمالي","قيمة العقد","القيمة التعاقدية"],true);
    const spendIdx=importHeaderIndex(headers,["اجمالي التكلفة في العقد","اجمالي التكلفة في المشروع","اجمالي الصرف الفعلي"],true);
    const planIdx=importHeaderIndex(headers,["خطة المحتوى المحلي"],false);
    const consultantIdx=importHeaderIndex(headers,["الاستشاري"],false);
    const sectorIdx=importHeaderIndex(headers,["قطاع العمل","المجال"],false);
    const companyTypeIdx=importHeaderIndex(headers,["نوع الشركة"],false);
    const tenderTypeIdx=importHeaderIndex(headers,["نوع المناقصة"],false);
    const title=importText(importCell(row,titleIdx));
    const entityName=importText(importCell(row,entityIdx));
    const companyName=importText(importCell(row,companyIdx));
    const entity=importFindMaster(state.entities,entityName);
    const company=importFindMaster(state.companies,companyName);
    const tender=importText(importCell(row,tenderIdx))||null;
    const start=importDate(importCell(row,startIdx));
    const end=importDate(importCell(row,endIdx));
    const value=importNumber(importCell(row,valueIdx));
    let status=importStatus(importCell(row,statusIdx),typeOf(rule.typeCode).family);
    const details={
      workbook_source_entity_name:entityName||null,
      workbook_source_company_name:companyName||null,
      workbook_snapshot:importRowSnapshot(headers,row),
      workbook_imported_at:new Date().toISOString()
    };
    const missing=[];
    if(entityName&&!entity) { details.unmapped_entity_name=entityName; missing.push({kind:"entity",name:entityName}); }
    if(companyName&&!company) { details.unmapped_company_name=companyName; missing.push({kind:"company",name:companyName}); }
    const record={
      contract:{
        contract_type_code:rule.typeCode,title,tender_number:tender,
        government_entity_id:entity?entity.id:null,implementing_company_id:company?company.id:null,
        consultant:importText(importCell(row,consultantIdx))||null,
        sector:importText(importCell(row,sectorIdx))||null,
        contract_status:status,contract_value:value,
        value_basis:value===null?"not_provided":"contract_value",
        current_spend:importNumber(importCell(row,spendIdx)),
        start_date:start,end_date:end,original_end_date:end,
        has_local_content_plan:importBool(importCell(row,planIdx)),
        company_type:importText(importCell(row,companyTypeIdx))||null,
        tender_type:importText(importCell(row,tenderTypeIdx))||null,
        details,source_sheet:sheetName,source_row:sourceRow,
        source_reference:"excel-import|"+importKey({contract_type_code:rule.typeCode,tender_number:tender,title},String(entityName||"")+"|"+String(companyName||""))
      },
      participations:[],
      meta:{rule,sheetName,sourceRow,entityName,companyName,missing,skippedDuplicate:false}
    };
    if(value===null&&rule.mode==="simple") record.contract.value_basis="not_provided";
    return record;
  }
  function importNonBlank(row) {
    return Array.isArray(row)&&row.some(v=>v!==null&&v!==undefined&&String(v).trim()!=="");
  }
  function importWideSupplierIndices(headers) {
    const endDateIdx=importHeaderIndex(headers,["تاريخ الانتهاء"],false);
    const fieldIdx=importHeaderIndex(headers,["المجال"],false);
    const start=Math.max(0,(endDateIdx>=0?endDateIdx:fieldIdx)+1);
    let end=headers.length;
    for(let i=start;i<headers.length;i++) {
      const h=importNormalize(headers[i]);
      if(!h||h.startsWith(importNormalize("اجمالي"))||h.includes(importNormalize("المحتوى المحلي"))||h.startsWith(importNormalize("نسبة"))||h.includes(importNormalize("ملاحظات"))) { end=i;break; }
    }
    const indices=[];
    for(let i=start;i<end;i++) if(importText(headers[i])) indices.push(i);
    return {start,end,indices};
  }
  function importBuildCandidates() {
    const selected=state.importSheets.filter(s=>state.importSelectedSheets.includes(s.actualName));
    const candidates=[], warnings=[], warningKeys=new Set();
    const seenCandidates=new Set();
    let rowsRead=0,skippedBlank=0,skippedInvalid=0;
    const addWarning=(kind,name,sheetName,rowNo)=>{
      const key=kind+"|"+importNormalize(name)+"|"+sheetName;
      if(!warningKeys.has(key)){warningKeys.add(key);warnings.push({kind,name,sheetName,rowNo});}
    };
    for(const sh of selected) {
      const rule=sh.rule, allRows=sh.rows||[];
      if(!allRows.length) continue;
      const headers=(allRows[0]||[]).map(v=>importText(v));
      if(importHeaderIndex(headers,["اسم المشروع","اسم العقد"],false)<0) {
        addWarning("missing_title_header","",sh.actualName,1); skippedInvalid+=Math.max(0,allRows.length-1);continue;
      }
      const dataRows=allRows.slice(1).map((row,i)=>({row:row||[],sourceRow:i+2})).filter(x=>importNonBlank(x.row));
      rowsRead+=dataRows.length;
      if(rule.mode==="simple") {
        for(const item of dataRows) {
          const candidate=importCreateBase(rule,sh.actualName,headers,item.row,item.sourceRow);
          if(!candidate.contract.title) { skippedInvalid++;continue; }
          if(candidate.meta.missing) candidate.meta.missing.forEach(m=>addWarning("unmapped_"+m.kind,m.name,sh.actualName,item.sourceRow));
          candidates.push(candidate);
        }
        continue;
      }

      const groups=new Map();
      if(rule.mode==="wide") {
        const supplierInfo=importWideSupplierIndices(headers);
        const entityIdx=importHeaderIndex(headers,["الجهة الحكومية","الجهة"],false);
        const tenderIdx=importHeaderIndex(headers,["رقم المناقصة"],false);
        const titleIdx=importHeaderIndex(headers,["اسم العقد"],false);
        const statusIdx=importHeaderIndex(headers,["حالة العقد"],false);
        const startIdx=importHeaderIndex(headers,["تاريخ البدء"],false);
        const endIdx=importHeaderIndex(headers,["تاريخ الانتهاء"],false);
        const rowTotalIdx=importHeaderIndex(headers,["اجمالي الطلب في العقد للجهة","اجمالي الطلب في العقد","اجمالي تكلفة المورد في العقد"],false);
        const frameworkFieldIdx=importHeaderIndex(headers,["المجال"],false);
        for(const item of dataRows) {
          const row=item.row, title=importText(importCell(row,titleIdx));
          if(!title) { skippedInvalid++;continue; }
          const tender=importText(importCell(row,tenderIdx));
          const key=importKey({contract_type_code:rule.typeCode,title,tender_number:tender},"");
          let group=groups.get(key);
          if(!group) {
            const candidate=importCreateBase(rule,sh.actualName,headers,row,item.sourceRow);
            candidate.contract.title=title;
            candidate.contract.tender_number=tender||null;
            candidate.contract.value_basis="not_provided";
            candidate.contract.contract_value=null;
            candidate.contract.current_spend=0;
            candidate.contract.government_entity_id=null;
            candidate.contract.implementing_company_id=null;
            candidate.contract.consultant=null;
            candidate.contract.sector=importText(importCell(row,frameworkFieldIdx))||candidate.contract.sector;
            candidate.contract.details={workbook_source_entity_name:null,workbook_source_company_name:null,workbook_rows:[],unmapped_entity_rows:[],unmapped_supplier_names:[],workbook_imported_at:new Date().toISOString()};
            candidate.contract.source_reference="excel-import|"+key;
            candidate.participations=[];
            candidate.meta={rule,sheetName:sh.actualName,sourceRow:item.sourceRow,entityName:"",companyName:"",missing:[],skippedDuplicate:false};
            group=candidate; groups.set(key,group);
          }
          const entityName=importText(importCell(row,entityIdx));
          const entity=importFindMaster(state.entities,entityName);
          const rowInfo={source_row:item.sourceRow,entity_name:entityName||null,workbook_totals:{},unmapped_supplier_values:[]};
          for(let i=supplierInfo.end;i<headers.length;i++) {
            if(importText(headers[i])&&row[i]!==null&&row[i]!==undefined&&row[i]!=="") rowInfo.workbook_totals[importText(headers[i])]=row[i] instanceof Date?row[i].toISOString():row[i];
          }
          let rowSupplierTotal=0;
          for(const idx of supplierInfo.indices) {
            const amount=importNumber(row[idx]);
            const supplierName=importText(headers[idx]);
            if(amount===null||amount<=0||!supplierName) continue;
            rowSupplierTotal+=amount;
            const company=importFindMaster(state.companies,supplierName);
            if(!entity||!company) {
              if(!entity) addWarning("unmapped_entity",entityName,sh.actualName,item.sourceRow);
              if(!company) {
                addWarning("unmapped_company",supplierName,sh.actualName,item.sourceRow);
                group.contract.details.unmapped_supplier_names.push(supplierName);
                rowInfo.unmapped_supplier_values.push({supplier:supplierName,amount:amount});
              }
              continue;
            }
            group.participations.push({
              government_entity_id:entity.id,company_id:company.id,assigned_value:null,spend_amount:amount,
              status:importStatus(importCell(row,statusIdx),"framework"),notes:null,
              details:{workbook_supplier_column:supplierName,source_entity_name:entityName},
              source_sheet:sh.actualName,source_row:item.sourceRow
            });
          }
          if(entityName&&!entity) {
            group.contract.details.unmapped_entity_rows.push({source_row:item.sourceRow,entity_name:entityName});
            rowInfo.unmapped_supplier_values=rowInfo.unmapped_supplier_values.concat(supplierInfo.indices.map(idx=>({supplier:importText(headers[idx]),amount:importNumber(row[idx])})).filter(x=>x.amount>0&&!rowInfo.unmapped_supplier_values.some(y=>y.supplier===x.supplier)));
          }
          const reportedTotal=importNumber(importCell(row,rowTotalIdx));
          rowInfo.reported_order_total=reportedTotal;
          rowInfo.supplier_column_total=rowSupplierTotal;
          const rowSpend=reportedTotal!==null&&(reportedTotal>0||rowSupplierTotal===0)?reportedTotal:rowSupplierTotal;
          group.contract.current_spend=n(group.contract.current_spend)+rowSpend;
          group.contract.source_row=Math.min(group.contract.source_row||item.sourceRow,item.sourceRow);
          if(!group.contract.start_date) group.contract.start_date=importDate(importCell(row,startIdx));
          if(!group.contract.end_date) { group.contract.end_date=importDate(importCell(row,endIdx));group.contract.original_end_date=group.contract.end_date; }
          if(rowInfo.unmapped_supplier_values.length===0) delete rowInfo.unmapped_supplier_values;
          group.contract.details.workbook_rows.push(rowInfo);
        }
        groups.forEach(candidate=>{
          candidate.contract.details.unmapped_supplier_names=[...new Set(candidate.contract.details.unmapped_supplier_names)];
          candidates.push(candidate);
        });
      } else if(rule.mode==="supplier_rows") {
        const titleIdx=importHeaderIndex(headers,["اسم العقد"],false);
        const entityIdx=importHeaderIndex(headers,["الجهة"],false);
        const companyIdx=importHeaderIndex(headers,["الشركات","الشركة","المورد"],false);
        const tenderIdx=importHeaderIndex(headers,["رقم المناقصة"],false);
        const amountIdx=importHeaderIndex(headers,["اجمالي تكلفة المورد في العقد","اجمالي تكلفة المزود في العقد","اجمالي تكلفة المورد"],false);
        const lcIdx=headers.findIndex(h=>{const v=importNormalize(h);return v.includes(importNormalize("المحتوى المحلي"))&&!v.includes(importNormalize("نسبة"));});
        const ratioIdx=importHeaderIndex(headers,["نسبة المحتوى المحلي"],false);
        const statusIdx=importHeaderIndex(headers,["حالة العقد"],false);
        const sectorIdx=importHeaderIndex(headers,["المجال"],false);
        for(const item of dataRows) {
          const row=item.row, title=importText(importCell(row,titleIdx));
          if(!title) {skippedInvalid++;continue;}
          const tender=importText(importCell(row,tenderIdx));
          const key=importKey({contract_type_code:rule.typeCode,title,tender_number:tender},"");
          let group=groups.get(key);
          if(!group) {
            group=importCreateBase(rule,sh.actualName,headers,row,item.sourceRow);
            group.contract.title=title;group.contract.tender_number=tender||null;
            group.contract.value_basis="not_provided";group.contract.contract_value=null;
            group.contract.current_spend=null;
            group.contract.details={workbook_source_entity_name:null,workbook_source_company_name:null,workbook_rows:[],unmapped_entity_rows:[],unmapped_supplier_names:[],workbook_imported_at:new Date().toISOString()};
            group.contract.source_reference="excel-import|"+key;
            group.participations=[];
            group.meta={rule,sheetName:sh.actualName,sourceRow:item.sourceRow,entityName:"",companyName:"",missing:[],skippedDuplicate:false};
            groups.set(key,group);
          }
          const entityName=importText(importCell(row,entityIdx));
          const companyName=importText(importCell(row,companyIdx));
          const entity=importFindMaster(state.entities,entityName);
          const company=importFindMaster(state.companies,companyName);
          const amount=importNumber(importCell(row,amountIdx));
          const localContent=importNumber(importCell(row,lcIdx));
          const workbookRatio=importNumber(importCell(row,ratioIdx));
          const rowSnapshot=importRowSnapshot(headers,row);
          group.contract.details.workbook_rows.push({source_row:item.sourceRow,entity_name:entityName,company_name:companyName,amount,workbook_local_content:localContent,workbook_ratio:workbookRatio,raw:rowSnapshot});
          if(amount!==null) group.contract.details.workbook_total_supplier_value=n(group.contract.details.workbook_total_supplier_value)+amount;
          if(entityName&&!entity) addWarning("unmapped_entity",entityName,sh.actualName,item.sourceRow);
          if(companyName&&!company) { addWarning("unmapped_company",companyName,sh.actualName,item.sourceRow);group.contract.details.unmapped_supplier_names.push(companyName); }
          if(!entity&&entityName) group.contract.details.unmapped_entity_rows.push({source_row:item.sourceRow,entity_name:entityName});
          if(entity&&company&&amount!==null&&amount>0) {
            group.participations.push({
              government_entity_id:entity.id,company_id:company.id,assigned_value:amount,spend_amount:null,
              status:importStatus(importCell(row,statusIdx),"framework"),
              notes:null,details:{workbook_local_content:localContent,workbook_ratio:workbookRatio,workbook_source_amount:amount,workbook_source_field:importText(headers[amountIdx]),sector:importText(importCell(row,sectorIdx))},
              source_sheet:sh.actualName,source_row:item.sourceRow
            });
          }
          group.contract.source_row=Math.min(group.contract.source_row||item.sourceRow,item.sourceRow);
        }
        groups.forEach(candidate=>{
          candidate.contract.details.unmapped_supplier_names=[...new Set(candidate.contract.details.unmapped_supplier_names)];
          candidates.push(candidate);
        });
      }
    }

    const existing=new Set(state.records.map(importExistingKey));
    const seen=new Set();
    candidates.forEach(candidate=>{
      const context=String(candidate.meta.entityName||candidate.meta.companyName||"");
      const key=importKey(candidate.contract,context);
      const duplicate=existing.has(key)||seen.has(key);
      candidate.meta.skippedDuplicate=duplicate;
      if(duplicate) addWarning("duplicate",candidate.contract.title,candidate.meta.sheetName,candidate.meta.sourceRow);
      else seen.add(key);
    });
    state.importCandidates=candidates;
    state.importBatch=candidates.filter(c=>!c.meta.skippedDuplicate).map(c=>({contract:c.contract,participations:c.participations,meta:c.meta}));
    state.importWarnings=warnings;
    state.importStats={
      sheetsSelected:selected.length,rowsRead,recordsDetected:candidates.length,
      newRecords:state.importBatch.length,duplicates:candidates.filter(c=>c.meta.skippedDuplicate).length,
      participations:state.importBatch.reduce((sum,c)=>sum+c.participations.length,0),
      skippedBlank,skippedInvalid,
      unresolved:warnings.filter(w=>w.kind==="unmapped_entity"||w.kind==="unmapped_company").length
    };
  }

  function loadImportFile(file) {
    if(!file) return;
    if(!window.XLSX||typeof window.XLSX.read!=="function") {
      state.importError=T("مكتبة قراءة Excel غير متاحة. أعد تحميل الصفحة وحاول مجددًا.","Excel reader is unavailable. Reload the page and try again.");render();return;
    }
    state.importBusy=true;state.importError="";state.importWorkbookName=file.name;render();
    const reader=new FileReader();
    reader.onerror=()=>{
      state.importBusy=false;state.importError=T("تعذر قراءة الملف المختار.","The selected file could not be read.");render();
    };
    reader.onload=()=>{
      try {
        const wb=window.XLSX.read(reader.result,{type:"array",cellDates:true});
        state.importSheets=[];
        state.importIgnoredSheets=[];
        wb.SheetNames.forEach(name=>{
          const rule=importSheetRule(name);
          if(!rule){state.importIgnoredSheets.push(name);return;}
          const ws=wb.Sheets[name];
          const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null,blankrows:true});
          state.importSheets.push({actualName:name,rule,rows});
        });
        state.importSelectedSheets=state.importSheets.map(x=>x.actualName);
        state.importBusy=false;
        if(!state.importSheets.length) state.importError=T("لم أجد أيًا من أوراق العقود المعروفة في الملف. لم تُحفظ أي بيانات.","No supported contract sheets were found. No data has been saved.");
        importBuildCandidates();
        render();
      } catch(err) {
        console.error("Excel import preview failed",err);
        state.importBusy=false;state.importError=T("تعذر تحليل الملف. تأكد أنه ملف Excel صالح وغير محمي بكلمة مرور.","The file could not be parsed. Verify it is a valid, unprotected Excel workbook.");render();
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function renderImportPanel() {
    const stats=state.importStats;
    const supported=state.importSheets.map(sh=>{
      const selected=state.importSelectedSheets.includes(sh.actualName);
      const rowCount=Math.max(0,(sh.rows||[]).length-1);
      return '<label class="ct-import-sheet"><input type="checkbox" data-ct-import-sheet value="'+esc(sh.actualName)+'" '+(selected?"checked":"")+'/><span><b>'+esc(sh.actualName)+'</b><small>'+esc(typeLabel(sh.rule.typeCode))+' · '+rowCount.toLocaleString("en-US")+' '+T("صفوف في الورقة","sheet rows")+'</small></span></label>';
    }).join("");
    const preview=(state.importCandidates||[]).slice(0,12).map(c=>
      '<tr><td>'+esc(c.contract.title)+'</td><td>'+esc(typeLabel(c.contract.contract_type_code))+'</td><td>'+esc(c.meta.sheetName)+' · '+c.meta.sourceRow+'</td><td class="ct-num">'+money(c.contract.current_spend)+'</td><td>'+c.participations.length+'</td><td><span class="ct-status '+(c.meta.skippedDuplicate?"ct-dup":"")+'">'+(c.meta.skippedDuplicate?T("مكرر — سيُتجاوز","Duplicate — skipped"):T("جديد","New"))+'</span></td></tr>'
    ).join("");
    const warnings=(state.importWarnings||[]).slice(0,18).map(w=>{
      const label=w.kind==="unmapped_entity"?T("جهة غير مطابقة","Unmatched entity"):w.kind==="unmapped_company"?T("شركة/مورد غير مطابق","Unmatched company/supplier"):w.kind==="duplicate"?T("تكرار","Duplicate"):T("مشكلة في الورقة","Sheet issue");
      return '<li><b>'+label+':</b> '+esc(w.name||"—")+' <small>('+esc(w.sheetName||"")+ (w.rowNo?" · "+w.rowNo:"") +')</small></li>';
    }).join("");
    return '<section class="panel ct-import-panel"><div class="ct-panel-head"><div><h2>'+T("استيراد بقية المشاريع والعقود من Excel","Import additional projects and contracts from Excel")+'</h2><p class="muted">'+T("معاينة فقط أولًا. لن تُحفظ أي بيانات إلا بعد الضغط على زر الاستيراد، ولا يتم استيراد المشاريع الإنمائية أو أوراق المؤشرات كعقود جديدة.","Preview first. Nothing is saved until you import; development projects and KPI/report sheets are not imported as new contracts.")+'</p></div><button class="btn" data-ct-action="close-import">× '+T("إغلاق","Close")+'</button></div>'+
      '<div class="ct-import-safety"><b>'+T("حماية البيانات","Data safeguard")+'</b><span>'+T("يستورد هذا المعالج السجلات الأساسية والمشاركات فقط. لا ينشئ تقارير معتمدة، ولا يغيّر جدول المشاريع الحالي. أوراق المؤشرات تُسجل مسبقًا كمرجع منفصل.","This wizard imports registry records and participations only. It creates no approved reports and does not change the existing projects table. KPI sheets are stored separately as reference definitions.")+'</span></div>'+
      '<label class="ct-import-file"><span>'+T("اختر ملف Excel","Choose Excel workbook")+'</span><input id="ct-import-file" type="file" accept=".xlsx,.xls,.xlsm" /><small>'+(state.importWorkbookName?T("الملف المختار: ","Selected file: ")+esc(state.importWorkbookName):T("يدعم .xlsx و.xls و.xlsm. تتم القراءة محليًا في المتصفح.","Supports .xlsx, .xls, and .xlsm. The file is read locally in the browser."))+'</small></label>'+
      (state.importBusy?'<p class="muted">'+T("تتم قراءة الملف وبناء المعاينة...","Reading workbook and preparing preview...")+'</p>':"")+
      (state.importError?'<div class="ct-import-error">'+esc(state.importError)+'</div>':"")+
      (state.importSheets.length?'<h3 class="ct-group-title">'+T("أوراق العقود التي يمكن استيرادها","Supported contract sheets")+'</h3><div class="ct-import-sheets">'+supported+'</div>':"")+
      (state.importIgnoredSheets.length?'<p class="ct-import-muted">'+T("أوراق تم استثناؤها من الاستيراد لتجنب التكرار: ","Sheets excluded to avoid duplicate imports: ")+esc(state.importIgnoredSheets.join("، "))+'</p>':"")+
      (stats?'<div class="ct-import-stats"><div><span>'+T("الصفوف المقروءة","Rows read")+'</span><b>'+stats.rowsRead+'</b></div><div><span>'+T("العقود المكتشفة","Contracts detected")+'</span><b>'+stats.recordsDetected+'</b></div><div><span>'+T("سجلات جديدة","New records")+'</span><b>'+stats.newRecords+'</b></div><div><span>'+T("المشاركات التابعة","Participations")+'</span><b>'+stats.participations+'</b></div><div><span>'+T("المكررات المستثناة","Duplicates skipped")+'</span><b>'+stats.duplicates+'</b></div><div><span>'+T("علاقات تحتاج مطابقة","Unmatched relationships")+'</span><b>'+stats.unresolved+'</b></div></div>':"")+
      (state.importCandidates.length?'<h3 class="ct-group-title">'+T("معاينة أول 12 سجلًا","Preview first 12 records")+'</h3><div class="table-wrap"><table class="ct-table"><thead><tr><th>'+T("العقد / المشروع","Contract / project")+'</th><th>'+T("النوع","Type")+'</th><th>'+T("المصدر","Source")+'</th><th>'+T("الصرف/المدفوعات (ر.ع)","Spend/orders (OMR)")+'</th><th>'+T("المشاركات","Participants")+'</th><th>'+T("الحالة","Disposition")+'</th></tr></thead><tbody>'+preview+'</tbody></table></div>':"")+
      (warnings?'<div class="ct-import-warnings"><b>'+T("ملاحظات تحتاج انتباهك","Items to review")+'</b><ul>'+warnings+'</ul>'+(state.importWarnings.length>18?'<small>'+T("يعرض أهم 18 ملاحظة فقط؛ عدد الملاحظات الكامل: ","Showing first 18 items; total warnings: ")+state.importWarnings.length+'</small>':"")+'</div>':"")+
      '<div class="ct-form-actions"><button class="btn primary" data-ct-action="execute-import" '+(!state.importBatch.length||state.importBusy?"disabled":"")+'>'+T("استيراد ","Import ")+state.importBatch.length.toLocaleString("en-US")+' '+T("سجل جديد","new records")+'</button><button class="btn" data-ct-action="reset-import">'+T("إعادة اختيار ملف","Choose another file")+'</button></div>'+
      '<p class="ct-import-muted">'+T("تُحفظ الصفوف التي لا تطابق جهة أو شركة في لقطة المصدر مع تنبيه للمراجعة؛ لا تُنشأ بيانات رئيسية جديدة تلقائيًا. وتبقى كل المؤشرات الحية بانتظار التقارير المعتمدة.","Rows with unmatched entities/companies remain in the source snapshot with a warning; no master data is auto-created. Live indicators still wait for approved reports.")+'</p></section>';
  }

  async function executeImport() {
    if(!canEdit()||state.importBusy||!state.importBatch.length) return;
    if(state.importBatch.length>500){message(T("قسّم الاستيراد إلى مجموعات أصغر من 500 سجل.","Split the import into batches of fewer than 500 records."),"error");return;}
    state.importBusy=true;render();
    try {
      const payload=state.importBatch.map(c=>({contract:c.contract,participations:c.participations}));
      const r=await client().rpc("import_contract_batch",{p_batch:payload});
      if(r.error) throw r.error;
      const summary=r.data||{};
      state.showImport=false;state.importBusy=false;state.importWorkbookName="";state.importSheets=[];
      state.importSelectedSheets=[];state.importCandidates=[];state.importBatch=[];state.importWarnings=[];state.importStats=null;state.importIgnoredSheets=[];state.importError="";
      await load(true);
      message(T("اكتمل الاستيراد الذري: ","Atomic import complete: ")+(summary.inserted_contracts||0)+T(" سجل عقد و"," contracts and ")+(summary.inserted_participations||0)+T(" مشاركة. لم تُنشأ تقارير معتمدة."," participations. No approved reports were created."));
    } catch(err) {
      state.importBusy=false;
      state.importError=window.ICV&&window.ICV.friendlyError?window.ICV.friendlyError(err):String(err&&err.message||err);
      render();
    }
  }

  function addStyle() {
    if(document.getElementById("icv-contracts-style")) return;
    const style=document.createElement("style"); style.id="icv-contracts-style";
    style.textContent=[
      ".ct-shell{display:grid;gap:16px;min-width:0}.ct-hero{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:22px 24px;border-radius:18px;background:linear-gradient(115deg,#073f38,#0f766e);color:#fff;box-shadow:0 12px 28px #063b3520}.ct-hero h1{margin:2px 0 7px;font-size:24px}.ct-hero p{margin:0;max-width:780px;color:#dcece7;font-size:12px;line-height:1.8}.ct-eyebrow{font-size:11px;color:#dacb98;font-weight:800}.ct-hero-actions{display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0}.ct-hero .btn{white-space:nowrap}.ct-secondary{color:#fff;background:#ffffff10;border-color:#ffffff55}.ct-safeguard{display:flex;gap:10px;align-items:start;padding:10px 14px;background:#f0f7f5;border:1px solid #d5e9e4;border-radius:12px;color:#315a53;font-size:11px;line-height:1.8}.ct-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.ct-kpi{background:var(--card,#fff);border:1px solid var(--line);border-radius:14px;padding:16px;min-width:0;box-shadow:var(--shadow)}.ct-kpi>span,.ct-kpi>small{display:block;color:var(--muted);font-size:11px}.ct-kpi>b{display:block;font-size:23px;margin:9px 0;direction:ltr;text-align:right;overflow-wrap:anywhere}.ct-kpi>b small{font-size:11px;color:var(--muted)}.ct-kpi>small{font-size:10px;line-height:1.6}.ct-tabs{display:flex;gap:8px;border-bottom:1px solid var(--line);padding-bottom:8px}.ct-tabs button{border:1px solid var(--line);border-radius:10px;background:var(--card,#fff);padding:9px 16px;color:var(--ink);font:inherit;font-size:12px;cursor:pointer}.ct-tabs button.active{background:var(--primary);border-color:var(--primary);color:#fff;font-weight:800}.ct-panel{background:var(--card,#fff);border:1px solid var(--line);border-radius:16px;padding:18px;min-width:0;box-shadow:var(--shadow)}.ct-panel-head{display:flex;align-items:start;justify-content:space-between;gap:14px;margin-bottom:14px}.ct-panel-head h2{margin:0 0 4px;font-size:16px}.ct-panel-head p{margin:0}.ct-count{border-radius:999px;background:var(--soft);color:var(--primary2);padding:5px 9px;font-size:11px;font-weight:800;white-space:nowrap}.ct-filters{display:grid;grid-template-columns:minmax(220px,1fr) minmax(170px,220px) minmax(140px,180px) auto;gap:8px;margin-bottom:12px}.ct-filters .search,.ct-select{height:40px;border:1px solid var(--line);border-radius:10px;background:var(--card,#fff);color:var(--ink);padding:0 10px;font:inherit;font-size:12px;min-width:0}.ct-table{width:100%;border-collapse:collapse;min-width:850px;background:var(--card,#fff)}.ct-table th{padding:11px 10px;background:var(--bg);color:var(--muted);font-size:10px;text-align:right;white-space:nowrap;border-bottom:1px solid var(--line)}.ct-table td{padding:11px 10px;font-size:11px;border-bottom:1px solid var(--line);vertical-align:middle}.ct-table tr:last-child td{border-bottom:0}.ct-table td small{display:block}.ct-cell-sub{color:var(--muted);margin-top:3px;direction:ltr;text-align:right}.ct-num{font-variant-numeric:tabular-nums;direction:ltr;text-align:right;white-space:nowrap}.ct-row-actions{display:flex;gap:5px;flex-wrap:wrap}.ct-small{font-size:10px;padding:6px 8px;border-radius:8px;white-space:nowrap}.ct-small.danger{color:#b91c1c;background:#fff5f5;border-color:#f3d4d4}.ct-status{display:inline-block;border-radius:999px;background:var(--soft);color:var(--primary2);padding:4px 8px;white-space:nowrap;font-size:10px}.ct-empty{text-align:center;color:var(--muted);padding:28px!important}.ct-form-panel,.ct-detail-panel{margin-top:14px}.ct-form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ct-field{display:flex;flex-direction:column;gap:6px;min-width:0;color:var(--ink);font-size:11px;font-weight:700}.ct-field>span{color:var(--muted)}.ct-field input,.ct-field select,.ct-field textarea{width:100%;min-width:0;min-height:39px;border:1px solid var(--line);border-radius:9px;padding:8px 10px;background:var(--card,#fff);color:var(--ink);font:inherit;font-weight:400}.ct-field textarea{resize:vertical}.ct-field small{font-size:10px;line-height:1.6;color:var(--muted);font-weight:400}.ct-wide{grid-column:1/-1}.ct-form-divider{border-top:1px solid var(--line);padding-top:12px;margin-top:4px}.ct-form-divider p{margin:5px 0 0}.ct-form-actions{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}.ct-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:18px}.ct-detail-grid>div{background:var(--bg);border-radius:10px;padding:11px;min-width:0}.ct-detail-grid span{display:block;font-size:10px;color:var(--muted);margin-bottom:4px}.ct-detail-grid b{font-size:12px;overflow-wrap:anywhere}.ct-subhead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;margin-bottom:10px}.ct-subhead h3,.ct-subhead p{margin:0}.ct-subhead h3,.ct-report-form h3,.ct-reference-table h3{font-size:14px}.ct-subhead p{font-size:10px;line-height:1.7}.ct-inline-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;align-items:end;padding:12px;background:var(--bg);border-radius:12px;margin-top:10px}.ct-inline-form .btn{min-height:39px}.ct-report-list{display:grid;gap:8px}.ct-report-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--line);border-radius:10px;padding:10px 12px}.ct-report-row small{display:block;color:var(--muted);font-size:10px;margin-top:4px}.ct-report-state{font-size:10px;border-radius:999px;background:#f6f3e8;color:#725b1e;padding:5px 9px;white-space:nowrap}.ct-report-state.approved{background:#e1f4e7;color:#166534}.ct-report-form{margin-top:12px;padding:14px;border:1px dashed var(--line);border-radius:12px}.ct-report-form h3{margin:0 0 5px}.ct-report-form>p{margin:0 0 13px;line-height:1.8}.ct-indicator-warning{display:flex;flex-direction:column;gap:4px;border:1px solid #f0dfad;background:#fff9e9;color:#765319;border-radius:12px;padding:12px 14px;font-size:11px;line-height:1.8;margin:12px 0}.ct-group-title{font-size:15px;margin:18px 0 10px}.ct-indicator-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ct-indicator-card{background:var(--card,#fff);border:1px solid var(--line);border-radius:14px;padding:16px;min-width:0;box-shadow:var(--shadow)}.ct-indicator-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.ct-indicator-kind{font-size:10px;color:var(--muted)}.ct-indicator-status{font-size:10px;border-radius:999px;padding:5px 8px;background:#f2f4f7;color:#667085;white-space:nowrap}.ct-indicator-status.met{background:#e1f4e7;color:#166534}.ct-indicator-status.under{background:#fff0d7;color:#854d0e}.ct-indicator-card h4{font-size:13px;line-height:1.8;margin:12px 0}.ct-main-actual{border-radius:10px;background:var(--bg);padding:12px;display:flex;align-items:center;justify-content:space-between;gap:8px}.ct-main-actual span{font-size:10px;color:var(--muted)}.ct-main-actual b{font-size:24px;direction:ltr;font-variant-numeric:tabular-nums}.ct-metric-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}.ct-metric-facts>div{border:1px solid var(--line);border-radius:9px;padding:9px;min-width:0}.ct-metric-facts span{display:block;font-size:10px;color:var(--muted);line-height:1.5}.ct-metric-facts b{display:block;font-size:12px;margin-top:5px;direction:ltr;text-align:right;white-space:nowrap}.ct-live-ratio{font-size:10px;color:var(--muted);margin-top:8px}.ct-formula{margin-top:10px;background:#f7faf9;border:1px solid #e4eeeb;padding:10px;border-radius:9px}.ct-formula b{font-size:10px;color:#477066}.ct-formula p{font-size:11px;margin:5px 0 0;line-height:1.8;color:#3c5550}.ct-metric-note{font-size:10px;color:var(--muted);line-height:1.8;margin:10px 0 0}.ct-reference-table{margin-top:14px}.ct-error{padding:26px}.ct-error h2{margin:8px 0}.ct-error p{line-height:1.8}.ct-error-icon{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#fff0d7;color:#854d0e;font-weight:900;font-size:18px}.ct-item-lines{display:grid;gap:10px}.ct-item-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px;background:var(--bg);border:1px solid var(--line);border-radius:12px}.ct-item-row-remove{grid-column:1/-1;display:flex;justify-content:flex-start}.ct-saved-lines{display:flex;gap:6px;flex-wrap:wrap;padding:6px 10px 11px}.ct-saved-lines span{font-size:10px;background:var(--bg);border-radius:8px;padding:4px 7px;color:var(--muted)}.ct-form-panel,.ct-detail-panel{scroll-margin-top:20px}",
      "@media(max-width:1120px){.ct-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.ct-filters{grid-template-columns:1fr 1fr}.ct-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ct-form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ct-inline-form{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media(max-width:720px){.ct-hero{display:block;padding:18px}.ct-hero h1{font-size:21px}.ct-hero-actions{margin-top:12px}.ct-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ct-kpi{padding:12px}.ct-kpi>b{font-size:19px}.ct-filters{grid-template-columns:1fr}.ct-form-grid{grid-template-columns:1fr}.ct-wide{grid-column:auto}.ct-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ct-inline-form{grid-template-columns:1fr}.ct-indicator-grid{grid-template-columns:1fr}.ct-metric-facts{grid-template-columns:repeat(3,minmax(0,1fr))}.ct-item-row{grid-template-columns:1fr}.ct-item-row-remove{grid-column:auto}.ct-panel{padding:13px}.ct-panel-head{align-items:start}.ct-panel-head h2{font-size:14px}.ct-report-row{align-items:start}.ct-subhead{align-items:start;flex-direction:column}}"
    ].join("");
    document.head.appendChild(style);
  }

  async function load(force) {
    if(state.loading) return;
    if(state.loaded&&!force){render();return;}
    state.loading=true; state.error=""; render();
    const db=client();
    if(!db){state.loading=false;state.error=T("تعذر الاتصال بعميل قاعدة البيانات. أعد تحميل الصفحة بعد تسجيل الدخول.","Database client unavailable. Reload after signing in.");render();return;}
    try {
      const res=await Promise.all([
        db.from("contract_types").select("*").eq("is_active",true).order("sort_order"),
        db.from("contracts").select("*").order("created_at",{ascending:false}).limit(2000),
        db.from("contract_participations").select("*").order("created_at",{ascending:false}).limit(5000),
        db.from("contract_reports").select("*").order("created_at",{ascending:false}).limit(5000),
        db.from("contract_report_items").select("*").order("created_at",{ascending:false}).limit(10000),
        db.from("contract_indicator_definitions").select("*").eq("is_active",true).order("sort_order"),
        db.from("government_entities").select("id,name,code").order("name"),
        db.from("companies").select("id,name,company_type").order("name")
      ]);
      const err=res.find(x=>x.error);
      if(err) throw err.error;
      state.types=res[0].data||TYPES_FALLBACK;
      state.records=res[1].data||[];
      state.participants=res[2].data||[];
      state.reports=res[3].data||[];
      state.items=res[4].data||[];
      state.indicators=res[5].data&&res[5].data.length?res[5].data:METRIC_FALLBACK;
      state.entities=res[6].data||[];
      state.companies=res[7].data||[];
      state.loaded=true;
    } catch(e) {
      console.error("contracts page load",e);
      const msg=String(e&&e.message||e||"");
      state.error=/contract_types|contracts|contract_participations|contract_reports|contract_report_items|contract_indicator_definitions|relation .* does not exist|schema cache/i.test(msg)
        ? T("جداول العقود الجديدة غير موجودة في قاعدة البيانات الحالية. يلزم مراجعة وتطبيق ملف migration على بيئة اختبار أولًا؛ لم يتم تغيير جداول المشاريع الحالية.","The new contracts tables are not present in this database yet. Review and apply the migration in a test environment first; existing project tables have not been changed.")
        : (window.ICV&&window.ICV.friendlyError?window.ICV.friendlyError(e):msg);
    } finally { state.loading=false; render(); }
  }

  async function saveContract(form) {
    if(!canEdit()){message(T("لا تملك صلاحية إضافة أو تعديل العقود.","You do not have permission to edit contracts."),"error");return;}
    const fd=new FormData(form), value=(k)=>String(fd.get(k)||"").trim();
    const code=value("contract_type_code"), title=value("title");
    if(!code||!title){message(T("أدخل نوع السجل واسم العقد.","Choose a record type and enter a title."),"error");return;}
    const details={};
    Array.from(form.querySelectorAll("[name^='detail_']")).forEach(el=>{const v=String(el.value||"").trim();if(v)details[el.name.slice(7)]=v;});
    const previous=state.editing&&state.editing.details||{};
    if(previous.notes && !details.notes) details.notes=previous.notes;
    if(value("notes")) details.notes=value("notes");
    const maybeNumber=(k)=>value(k)===""?null:Number(value(k));
    const maybeDate=(k)=>value(k)||null;
    const plan=value("has_local_content_plan");
    const payload={
      contract_type_code:code,title,
      tender_number:value("tender_number")||null,
      government_entity_id:value("government_entity_id")||null,
      implementing_company_id:value("implementing_company_id")||null,
      consultant:value("consultant")||null,sector:value("sector")||null,
      contract_status:value("contract_status")||"مسند",
      contract_value:maybeNumber("contract_value"),value_basis:value("value_basis")||"contract_value",
      current_spend:maybeNumber("current_spend"),start_date:maybeDate("start_date"),end_date:maybeDate("end_date"),
      original_end_date:maybeDate("original_end_date"),
      has_local_content_plan:plan===""?null:plan==="true",
      company_type:value("company_type")||details.company_type||null,tender_type:value("tender_type")||null,
      details,updated_at:new Date().toISOString(),updated_by:profile().id||null
    };
    if(payload.start_date&&payload.end_date&&payload.end_date<payload.start_date){message(T("تاريخ الانتهاء يجب ألا يسبق تاريخ البدء.","End date cannot be before start date."),"error");return;}
    const db=client();
    let res;
    if(state.editing&&state.editing.id) res=await db.from("contracts").update(payload).eq("id",state.editing.id).select().single();
    else {payload.created_by=profile().id||null;res=await db.from("contracts").insert(payload).select().single();}
    if(res.error){message(window.ICV?window.ICV.friendlyError(res.error):res.error.message,"error");return;}
    state.showForm=false; state.editing=null; state.selectedId=res.data.id; state.tab="registry";
    message(T("تم حفظ سجل العقد.","Contract saved."));
    await load(true);
  }

  async function saveParticipation(form) {
    if(!canEdit()) return;
    const fd=new FormData(form), get=k=>String(fd.get(k)||"").trim();
    if(!get("contract_id")||!get("government_entity_id")){message(T("اختر العقد والجهة المستفيدة.","Select a contract and beneficiary entity."),"error");return;}
    const numOrNull=k=>get(k)===""?null:Number(get(k));
    const payload={contract_id:get("contract_id"),government_entity_id:get("government_entity_id"),company_id:get("company_id")||null,assigned_value:numOrNull("assigned_value"),spend_amount:numOrNull("spend_amount"),status:"قيد التنفيذ",notes:null,created_by:profile().id||null,updated_by:profile().id||null};
    const r=await client().from("contract_participations").insert(payload);
    if(r.error){message(window.ICV?window.ICV.friendlyError(r.error):r.error.message,"error");return;}
    message(T("تمت إضافة الجهة / المورد.","Beneficiary / supplier added."));
    await load(true);
  }

  async function saveReport(form) {
    if(!canEdit()) return;
    const fd=new FormData(form), get=k=>String(fd.get(k)||"").trim();
    const contractId=get("contract_id"), year=Number(get("report_year"));
    if(!contractId||!year||year<2000||year>2200){message(T("تحقق من العقد والسنة.","Check the contract and report year."),"error");return;}
    const asNum=k=>get(k)===""?null:Number(get(k));
    const asBool=k=>get(k)===""?null:get(k)==="true";
    const lineItems=Array.from(form.querySelectorAll(".ct-item-row")).map(row=>{
      const val=k=>String(row.querySelector('[data-item-field="'+k+'"]')?.value||"").trim();
      const amount=val("amount")===""?null:Number(val("amount"));
      const coefficient=val("content_coefficient")===""?null:Number(val("content_coefficient"));
      let local=val("local_content_amount")===""?null:Number(val("local_content_amount"));
      if(local===null&&coefficient!==null&&amount!==null) local=amount*coefficient;
      return {
        category_code:val("category_code"),
        procurement_route:val("procurement_route")||"not_applicable",
        company_id:val("company_id")||null,
        amount:amount,
        content_coefficient:coefficient,
        local_content_amount:local,
        is_sme:val("is_sme")===""?null:val("is_sme")==="true",
        is_omani_product:val("is_omani_product")===""?(val("category_code")==="made_in_oman"?true:null):val("is_omani_product")==="true",
        notes:null
      };
    }).filter(x=>x.category_code&&x.amount!==null&&Number.isFinite(x.amount));
    for(const item of lineItems){
      if(item.amount<0||!Number.isFinite(item.amount)){message(T("تحقق من مبالغ البنود.","Check line item amounts."),"error");return;}
      if(item.content_coefficient!==null&&(!Number.isFinite(item.content_coefficient)||item.content_coefficient<0||item.content_coefficient>1)){message(T("المعامل يجب أن يكون بين صفر وواحد.","Coefficient must be between zero and one."),"error");return;}
      if(item.local_content_amount!==null&&(!Number.isFinite(item.local_content_amount)||item.local_content_amount<0||item.local_content_amount>item.amount)){message(T("المحتوى المحلي للبند يجب أن يكون بين صفر وقيمة البند.","Line local content must be between zero and the line amount."),"error");return;}
    }

    const reportData={
      workforce_omani:asNum("workforce_omani"),workforce_non_omani:asNum("workforce_non_omani"),
      omani_wages:asNum("omani_wages"),non_omani_wages:asNum("non_omani_wages"),
      omanization_compliant:asBool("omanization_compliant"),sme_compliant:asBool("sme_compliant"),made_in_oman_compliant:asBool("made_in_oman_compliant"),
      local_content_achieved:asNum("local_content_achieved"),
      direct_procurement_total:asNum("direct_procurement_total"),direct_sme_awards:asNum("direct_sme_awards"),
      subcontract_procurement_total:asNum("subcontract_procurement_total"),subcontract_sme_awards:asNum("subcontract_sme_awards"),
      local_product_purchase:asNum("local_product_purchase"),total_government_purchases:asNum("total_government_purchases")
    };
    const wageCodes=["omani_wages","non_omani_wages"];
    const purchaseCodes=["made_in_oman","local_supplier","direct_import"];
    const eligibleFinancial=item=>!wageCodes.includes(item.category_code);
    const goodsLines=lineItems.filter(item=>purchaseCodes.includes(item.category_code));
    const directLines=lineItems.filter(item=>item.procurement_route==="direct"&&eligibleFinancial(item));
    const subLines=lineItems.filter(item=>item.procurement_route==="subcontract"&&eligibleFinancial(item));
    const hasAnyLocal= lineItems.length>0 && lineItems.every(item=>item.local_content_amount!==null);
    if(reportData.local_content_achieved===null&&hasAnyLocal) reportData.local_content_achieved=lineItems.reduce((a,x)=>a+x.local_content_amount,0);
    if(reportData.direct_procurement_total===null&&directLines.length) reportData.direct_procurement_total=directLines.reduce((a,x)=>a+x.amount,0);
    if(reportData.direct_sme_awards===null&&directLines.length&&directLines.every(x=>x.is_sme!==null)) reportData.direct_sme_awards=directLines.filter(x=>x.is_sme).reduce((a,x)=>a+x.amount,0);
    if(reportData.subcontract_procurement_total===null&&subLines.length) reportData.subcontract_procurement_total=subLines.reduce((a,x)=>a+x.amount,0);
    if(reportData.subcontract_sme_awards===null&&subLines.length&&subLines.every(x=>x.is_sme!==null)) reportData.subcontract_sme_awards=subLines.filter(x=>x.is_sme).reduce((a,x)=>a+x.amount,0);
    if(reportData.local_product_purchase===null&&goodsLines.length&&goodsLines.every(x=>x.is_omani_product!==null)) reportData.local_product_purchase=goodsLines.filter(x=>x.is_omani_product).reduce((a,x)=>a+x.amount,0);
    if(reportData.total_government_purchases===null&&goodsLines.length) reportData.total_government_purchases=goodsLines.reduce((a,x)=>a+x.amount,0);

    const status=get("report_status")||"draft";
    if(status==="approved"&&!isAdmin()){message(T("اعتماد التقارير متاح لمدير النظام فقط.","Only the system administrator can approve reports."),"error");return;}
    const payload={contract_id:contractId,report_year:year,report_quarter:get("report_quarter")||"Q1",report_status:status,report_data:reportData,submitted_at:status==="draft"?null:new Date().toISOString(),approved_at:status==="approved"?new Date().toISOString():null,approved_by:status==="approved"?(profile().id||null):null,created_by:profile().id||null,updated_by:profile().id||null};
    const r=await client().from("contract_reports").insert(payload).select("id").single();
    if(r.error){message(window.ICV?window.ICV.friendlyError(r.error):r.error.message,"error");return;}
    if(lineItems.length){
      const prepared=lineItems.map(item=>({...item,report_id:r.data.id,created_by:profile().id||null}));
      const ir=await client().from("contract_report_items").insert(prepared);
      if(ir.error) {
        // Supabase JS has no client transaction; best-effort rollback prevents a partial report.
        const undo=await client().from("contract_reports").delete().eq("id",r.data.id);
        state.showReportForm=false; state.reportContractId=null;
        if(undo.error) message(T("تعذر حفظ بنود التقرير وتعذر التراجع عن سجل التقرير. سجّل رقم التقرير واطلب مراجعة المسؤول قبل إعادة الإدخال: ","Report line items failed and rollback failed. Record this report ID and ask an administrator before retrying: ")+r.data.id,"error");
        else message(T("تعذر حفظ البنود التفصيلية؛ أُلغي التقرير بالكامل. راجع البنود وحاول مجددًا.","Line items could not be saved, so the report was rolled back. Review the entries and try again."),"error");
        await load(true);
        return;
      }
    }
    state.showReportForm=false; state.reportContractId=null;
    message(T("تم حفظ التقرير. لا يدخل في المؤشرات الرسمية إلا عند اعتماده.","Report saved. It counts in official indicators only after approval."));
    await load(true);
  }

  async function removeContract(id) {
    if(!isAdmin()) return;
    const c=byId(state.records,id); if(!c)return;
    if(!confirm(T("هل تريد حذف سجل العقد المحدد؟ سيتم حذف تقاريره ومشاركاته التابعة.","Delete the selected contract and its dependent reports/participations?"))) return;
    const r=await client().from("contracts").delete().eq("id",id);
    if(r.error){message(window.ICV?window.ICV.friendlyError(r.error):r.error.message,"error");return;}
    state.selectedId=null; message(T("تم حذف سجل العقد.","Contract deleted.")); await load(true);
  }

  async function removeParticipation(id) {
    if(!isAdmin()) return;
    if(!confirm(T("تأكيد حذف سجل مشاركة الجهة / المورد؟","Delete this entity/supplier participation?")))return;
    const r=await client().from("contract_participations").delete().eq("id",id);
    if(r.error){message(window.ICV?window.ICV.friendlyError(r.error):r.error.message,"error");return;}
    message(T("تم حذف المشاركة.","Participation deleted."));await load(true);
  }

  function handleClick(ev) {
    const tab=ev.target.closest("[data-ct-tab]");
    if(tab){state.tab=tab.dataset.ctTab;render();return;}
    const b=ev.target.closest("[data-ct-action]"); if(!b)return;
    const action=b.dataset.ctAction, id=b.dataset.id;
    if(action==="retry"||action==="refresh"){state.loaded=false;load(true);return;}
    if(action==="add"){state.editing=null;state.showForm=true;state.selectedId=null;render();return;}
    if(action==="cancel-form"){state.showForm=false;state.editing=null;render();return;}
    if(action==="edit"){state.editing=byId(state.records,id);state.showForm=true;state.selectedId=null;render();return;}
    if(action==="details"){state.selectedId=id;state.showForm=false;state.showReportForm=false;render();return;}
    if(action==="close-details"){state.selectedId=null;state.showReportForm=false;render();return;}
    if(action==="delete"){removeContract(id);return;}
    if(action==="delete-participation"){removeParticipation(id);return;}
    if(action==="add-report"){state.selectedId=id;state.showReportForm=true;state.reportContractId=id;render();return;}
    if(action==="add-item-row"){const wrap=root().querySelector(".ct-item-lines");if(wrap)wrap.insertAdjacentHTML("beforeend",reportItemRow());return;}
    if(action==="remove-item-row"){b.closest(".ct-item-row")?.remove();return;}
    if(action==="cancel-report"){state.showReportForm=false;state.reportContractId=null;render();return;}
    if(action==="clear-filter"){state.search="";state.typeFilter="";state.statusFilter="";render();return;}
  }
  function handleChange(ev) {
    if(ev.target.id==="ct-type-filter"){state.typeFilter=ev.target.value;updateRows();return;}
    if(ev.target.id==="ct-status-filter"){state.statusFilter=ev.target.value;updateRows();return;}
    if(ev.target.id==="ct-form-type"){
      const form=ev.target.closest("form"); const oldDetails={};
      if(form) Array.from(form.querySelectorAll("[name^='detail_']")).forEach(el=>{oldDetails[el.name.slice(7)]=el.value;});
      state.editing=Object.assign({},state.editing||{}, {contract_type_code:ev.target.value,details:oldDetails});
      const formSection=root().querySelector(".ct-form-panel"); if(formSection) formSection.outerHTML=renderContractForm();
    }
  }
  function updateRows() {
    const tbody=root()&&root().querySelector("#ct-results-body"); if(!tbody)return;
    const rows=filteredRecords().map(c=>'<tr><td><b>'+esc(c.title)+'</b><small class="ct-cell-sub">'+esc(c.tender_number||"—")+'</small></td><td>'+esc(typeLabel(c.contract_type_code))+'</td><td>'+esc(entityLabel(c.government_entity_id))+'</td><td>'+esc(companyLabel(c.implementing_company_id))+'</td><td><span class="ct-status">'+esc(statusLabel(c.contract_status))+'</span></td><td class="ct-num">'+money(c.contract_value)+'</td><td>'+esc(dateOnly(c.end_date))+'</td><td><div class="ct-row-actions"><button class="btn ct-small" data-ct-action="details" data-id="'+esc(c.id)+'">'+T("تفاصيل","Details")+'</button>'+(canEdit()?'<button class="btn ct-small" data-ct-action="edit" data-id="'+esc(c.id)+'">'+T("تعديل","Edit")+'</button>':"")+(isAdmin()?'<button class="btn ct-small danger" data-ct-action="delete" data-id="'+esc(c.id)+'">'+T("حذف","Delete")+'</button>':"")+'</div></td></tr>').join("");
    tbody.innerHTML=rows||'<tr><td colspan="8" class="ct-empty">'+T("لا توجد سجلات مطابقة.","No matching records.")+'</td></tr>';
    const c=root().querySelector(".ct-count"); if(c)c.textContent=filteredRecords().length+" / "+state.records.length;
  }
  function handleInput(ev) {
    if(ev.target.id==="ct-search"){state.search=ev.target.value;updateRows();}
  }
  function handleSubmit(ev) {
    const form=ev.target;
    if(form.id==="ct-contract-form"){ev.preventDefault();saveContract(form);return;}
    if(form.id==="ct-participation-form"){ev.preventDefault();saveParticipation(form);return;}
    if(form.id==="ct-report-form"){ev.preventDefault();saveReport(form);return;}
  }

  function open() {
    const el=root(); if(!el)return;
    addStyle();
    if(!el.dataset.bound) {
      el.dataset.bound="1";
      el.addEventListener("click",handleClick);
      el.addEventListener("change",handleChange);
      el.addEventListener("input",handleInput);
      el.addEventListener("submit",handleSubmit);
    }
    return load(false);
  }

  window.icvContracts={open:open,refresh:()=>load(true),goIndicators:()=>{state.tab="indicators";render();}};
  window.icvPages=window.icvPages||{};
  window.icvPages.contracts=open;
})();