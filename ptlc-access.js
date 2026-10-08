(()=>{ 
const URL='https://bmwtrnosqosbkezdswcx.supabase.co',KEY='sb_publishable_Ge88ZuNnqW89l0SMfw_mvQ_nY2BzpPr';
const client=window.supabase.createClient(URL,KEY); window.__icvAccessClient=client;
const roleLabel={admin:'مدير النظام',editor:'محرر',viewer:'مشاهد',temporary_viewer:'مشاهد مؤقت'};
const escA=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const toastA=m=>{if(window.toast)window.toast(m);else alert(m)};
let profile=null, originalShowPage=window.showPage;

async function getProfile(){
 const {data:{session}}=await client.auth.getSession(); if(!session)return null;
 const {data,error}=await client.from('user_profiles').select('*').eq('id',session.user.id).single();
 if(error||!data)return null; profile=data; window.__icvProfile=data; return data;
}
function valid(p){
 const now=Date.now();
 return p?.is_active!==false && (!p.access_starts_at||new Date(p.access_starts_at).getTime()<=now) && (!p.access_expires_at||new Date(p.access_expires_at).getTime()>=now);
}
function applyRoleUI(){
 if(!profile)return;
 document.body.dataset.role=profile.role||'viewer';
 const admin=profile.role==='admin', editor=admin||profile.role==='editor';
 const nav=document.getElementById('userAdminNav'); if(nav)nav.classList.toggle('hidden',!admin);
 document.querySelectorAll('button').forEach(b=>{
   const oc=b.getAttribute('onclick')||'';
   if(/openProject\(|saveProject\(|openReport\(|openPlan\(/.test(oc)) b.classList.toggle('hidden',!editor);
 });
 const name=document.getElementById('userName'),role=document.getElementById('userRole');
 if(name)name.textContent=profile.full_name||profile.username||'المستخدم';
 if(role)role.textContent=roleLabel[profile.role]||profile.role||'مشاهد';
}
async function loginWithUsername(){
 const field=document.getElementById('email'), pass=document.getElementById('password'), msg=document.getElementById('authMsg');
 const raw=(field?.value||'').trim().toLowerCase(), password=pass?.value||'';
 if(!raw||!password){if(msg)msg.textContent='أدخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور.';return}
 if(msg)msg.textContent='جارٍ تسجيل الدخول...';
 const email=raw.includes('@')?raw:raw+'@icv-new.local';
 const r=await client.auth.signInWithPassword({email,password});
 if(r.error){if(msg)msg.textContent='فشل تسجيل الدخول: '+r.error.message;return}
 const {data:p,error:pe}=await client.from('user_profiles').select('*').eq('id',r.data.user.id).single();
 if(pe||!p){await client.auth.signOut();if(msg)msg.textContent='تعذر تحميل صلاحيات الحساب.';return}
 if(!valid(p)){await client.auth.signOut();if(msg)msg.textContent='الحساب غير نشط أو أن فترة الصلاحية غير سارية.';return}
 profile=p;window.__icvProfile=p;
 if(typeof window.boot==='function') await window.boot(r.data.session);
 ensurePageShell();applyRoleUI();
 if(window.icvStructure?.renderDashboard){window.icvStructure.renderDashboard();window.icvStructure.renderProjects();window.icvStructure.renderLocalContent();}

}
window.login=loginWithUsername;

function injectProfileStyle(){if(document.getElementById('icv-profile-style'))return;const s=document.createElement('style');s.id='icv-profile-style';s.textContent='*{box-sizing:border-box}.profile-page{padding:0 0 8px}.profile-page-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.profile-page-head h2{margin:0 0 6px;font-size:28px;color:var(--text,#17211b)}.profile-page-head p{margin:0;color:var(--muted,#6b7770);font-size:13px}.profile-user-card{background:#fff;border:1px solid #e2e8e4;border-radius:15px;box-shadow:0 4px 18px #142d2010;padding:22px;margin-bottom:18px}.profiletop{display:flex;gap:16px;align-items:center}.profile-avatar{width:64px;height:64px;border-radius:50%;background:#e4f2eb;color:#0f5132;display:grid;place-items:center;font-size:24px;font-weight:800;flex:none}.profile-user-card h3{margin:0 0 5px;font-size:20px}.profile-user-meta{color:#6b7770;font-size:13px;margin-top:2px}.profile-active-badge{display:inline-block;background:#eaf8ef;color:#087443;border-radius:20px;padding:5px 10px;font-size:12px;font-weight:800;margin-top:6px}.profile-entities{border-top:1px solid #e8eeea;margin-top:18px;padding-top:16px}.profile-entities-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.profile-entities-head b{font-size:13px}.profile-entity-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.profile-entity{background:#f7faf8;border:1px solid #dce8e1;border-radius:9px;padding:9px 13px;font-size:13px;font-weight:700}.profile-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:18px}.profile-kpi{background:#fff;border:1px solid #e2e8e4;border-radius:13px;padding:18px;box-shadow:0 4px 18px #142d2010}.profile-kpi .num{font-size:28px;font-weight:850}.profile-kpi .label{color:#6b7770;font-size:13px}.profile-kpi .green{color:#087443}.profile-kpi .orange{color:#b76b00}.profile-kpi .red{color:#c62828}.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.profile-card{background:#fff;border:1px solid #e2e8e4;border-radius:15px;box-shadow:0 4px 18px #142d2010;overflow:hidden}.profile-card.full{grid-column:1/-1}.profile-card-head{padding:16px 18px;border-bottom:1px solid #e8eeea;display:flex;justify-content:space-between;align-items:center;gap:10px}.profile-card-head h3{margin:0;font-size:16px}.profile-muted{color:#6b7770;font-size:13px}.profile-filter{padding:12px 18px;border-bottom:1px solid #e8eeea;display:flex;gap:8px;flex-wrap:wrap}.profile-filter button{border:1px solid #dfe7e2;background:#fff;padding:7px 13px;border-radius:9px;font-size:12px;font-weight:700}.profile-filter button.active{background:#0f5132;color:#fff;border-color:#0f5132}.profile-row{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #eef2ef}.profile-row:last-child{border:0}.profile-icon{width:35px;height:35px;border-radius:9px;display:grid;place-items:center;background:#fff0f0;color:#c62828;font-size:11px;font-weight:800;flex:none}.profile-icon.orange{background:#fff6e8;color:#b76b00}.profile-row-main{flex:1;min-width:0}.profile-row-main strong{display:block;font-size:13px}.profile-row-main span{font-size:12px;color:#6b7770}.profile-open{color:#0f5132;font-size:12px;font-weight:800;border:0;background:none;cursor:pointer;font-family:inherit;white-space:nowrap}.profile-table{width:100%;border-collapse:collapse;font-size:12px}.profile-table th,.profile-table td{text-align:right;padding:13px 16px;border-bottom:1px solid #eef2ef}.profile-table th{background:#fafcfb;color:#5d6a63}.profile-status{padding:5px 9px;border-radius:15px;font-size:11px;font-weight:800}.profile-status.red{background:#fff0f0;color:#c62828}.profile-status.orange{background:#fff6e8;color:#b76b00}.profile-task-wrap,.profile-activity-wrap{padding:4px 18px}.profile-task,.profile-activity{padding:12px 0;border-bottom:1px solid #eef2ef;font-size:12px}.profile-task:last-child,.profile-activity:last-child{border:0}.profile-task{display:flex;gap:12px}.profile-check{width:18px;height:18px;border:1.5px solid #b9c7bf;border-radius:5px;flex:none;background:#fff;padding:0;cursor:pointer}.profile-task.done .profile-check{background:#0f5132;border-color:#0f5132;position:relative}.profile-task.done .profile-check:after{content:"✓";color:#fff;font-weight:900;position:absolute;inset:0;display:grid;place-items:center}.profile-task.done .profile-row-main{text-decoration:line-through;color:#7b8780}.profile-task small,.profile-activity small{display:block;color:#6b7770;margin-top:4px}.profile-security{margin-top:18px;background:#fff;border:1px solid #e2e8e4;border-radius:15px;box-shadow:0 4px 18px #142d2010;padding:18px 20px;display:flex;justify-content:space-between;align-items:center}.profile-security h3{margin:0 0 5px;font-size:15px}.profile-security p{margin:0;color:#6b7770;font-size:12px}.profile-empty{text-align:center;color:#6b7770;padding:20px;font-size:12px}.profile-show-all{border:1px solid #dfe7e2;background:#fff;padding:8px 13px;border-radius:9px;font-weight:700;color:#0f5132;margin:10px 18px 14px;cursor:pointer}@media(max-width:900px){.profile-kpis{grid-template-columns:1fr 1fr}.profile-grid{grid-template-columns:1fr}.profile-card.full{grid-column:auto}}@media(max-width:600px){.profile-page-head{align-items:flex-start;flex-direction:column}.profile-kpis{grid-template-columns:1fr}.profile-security{align-items:flex-start;flex-direction:column;gap:12px}.profiletop{align-items:flex-start}}';document.head.appendChild(s)}injectProfileStyle();function ensurePageShell(){injectProfileStyle();
 const main=document.querySelector('.main'); if(!main)return;
 const p=document.getElementById('page-profile')||document.createElement('div');
 p.id='page-profile';p.className='hidden';
 if(!p.querySelector('#accessProfileSummary'))p.innerHTML='<div class="profile-page"><div class="profile-page-head"><div><h2>ملفي الشخصي</h2><p>مساحة عملك لمتابعة المشاريع والتقارير والتنبيهات المرتبطة بك</p></div></div><section class="profile-user-card"><div class="profiletop"><div class="profile-avatar" id="profileHeadInitials">م</div><div><h3 id="profileHeadName">المستخدم</h3><div class="profile-user-meta">اسم المستخدم: <span id="profileHeadUsername">—</span></div><div class="profile-user-meta" id="profileHeadRole">—</div><span class="profile-active-badge">● الحساب نشط</span></div></div><div class="profile-entities"><div class="profile-entities-head"><b>الجهات الحكومية المسندة إليّ</b><button class="btn primary" style="width:auto" id="profileEntitiesBtn">تعديل الجهات</button></div><div id="accessProfileEntities" class="profile-entity-list"><span class="profile-empty">جاري التحميل...</span></div></div></section><div id="accessProfileSummary" class="profile-kpis"></div><div id="accessProfileAlerts"></div><div class="profile-grid"><section class="profile-card"><div class="profile-card-head"><h3>📝 مهامي</h3><button class="btn primary" style="width:auto" id="profileAddTaskBtn">+ إضافة مهمة</button></div><div id="accessProfileTasks" class="profile-task-wrap"><div class="profile-empty">جاري التحميل...</div></div></section><section class="profile-card"><div class="profile-card-head"><h3>🕐 آخر الأنشطة</h3><span class="profile-muted">آخر التحديثات</span></div><div id="accessProfileActivity" class="profile-activity-wrap"><div class="profile-empty">جاري التحميل...</div></div></section></div><section class="profile-security"><div><h3>🔐 أمان الحساب</h3><p>تغيير الرقم السري متاح في أي وقت. صلاحياتك والجهات المسندة إليك تُدار من قبل مدير النظام.</p></div><button class="btn primary" style="width:auto" id="profilePasswordBtn">تغيير الرقم السري</button></section></div>';
 if(!p.parentElement)main.appendChild(p);
 const usersPage=document.getElementById('page-users')||document.createElement('div');usersPage.id='page-users';usersPage.className=usersPage.className||'hidden';
 if(!usersPage.querySelector('.um-wrap')){usersPage.innerHTML='<div class="um-wrap"><div class="um-hero"><div><div class="um-crumb">إدارة النظام / المستخدمون</div><h2>إدارة المستخدمين</h2><p>إدارة حسابات الموظفين والأدوار وفترات الصلاحية والجهات المسندة إليهم.</p></div><button class="btn primary um-add" onclick="openUserForm()">＋ إضافة مستخدم</button></div><div class="um-filters panel"><div class="um-filter-grid"><div class="field"><label>اسم المستخدم</label><input id="usersSearch" placeholder="مثال: user01" oninput="filterAdminUsers()"></div><div class="field"><label>الاسم</label><input id="usersNameFilter" placeholder="ابحث بالاسم" oninput="filterAdminUsers()"></div><div class="field"><label>الدور</label><select id="usersRoleFilter" onchange="filterAdminUsers()"><option value="">الكل</option><option value="admin">مدير النظام</option><option value="editor">محرر</option><option value="viewer">مشاهد</option><option value="temporary_viewer">مشاهد مؤقت</option></select></div><div class="field"><label>الحالة</label><select id="usersStatusFilter" onchange="filterAdminUsers()"><option value="">الكل</option><option value="active">فعال</option><option value="inactive">غير فعال</option></select></div><div class="field"><label>الجهة المسندة</label><select id="usersEntityFilter" onchange="filterAdminUsers()"><option value="">كل الجهات</option></select></div></div></div><div class="panel um-table-panel"><div class="um-table-head"><div><h3>قائمة المستخدمين</h3><div id="usersAdminCount" class="muted"></div></div><button class="btn" onclick="loadUsersAdmin()">تحديث</button></div><div id="usersAdminBox" class="empty">جاري التحميل...</div></div></div>';if(!usersPage.parentElement)main.appendChild(usersPage);}
 const nav=document.querySelector('.nav');
 if(nav&&!document.getElementById('userProfileNav')){const b=document.createElement('button');b.id='userProfileNav';b.dataset.page='profile';b.onclick=function(){window.showPage('profile',this)};b.innerHTML='<span class="ico">◉</span><span>ملفي الشخصي</span>';nav.appendChild(b)}
 if(nav&&!document.getElementById('userAdminNav')){const b=document.createElement('button');b.id='userAdminNav';b.dataset.page='users';b.className='hidden';b.onclick=function(){window.showPage('users',this)};b.innerHTML='<span class="ico">⚙</span><span>إدارة المستخدمين</span>';nav.appendChild(b)}
 document.getElementById('profileEntitiesBtn')?.addEventListener('click',openMyEntitySelection);
 document.getElementById('profileAddTaskBtn')?.addEventListener('click',openMyTaskForm);
 document.getElementById('profilePasswordBtn')?.addEventListener('click',openChangePassword);
}

function renderMyTasks(rows){
 const el=document.getElementById('accessProfileTasks'); if(!el)return;
 if(!rows?.length){el.innerHTML='<div class="profile-empty">لا توجد مهام مسجلة حاليًا.</div>';return}
 el.innerHTML=rows.slice(0,10).map(t=>{
   const priority=t.priority||t.priority_level||'متوسطة';
   const cls=priority==='عالية'?'red':priority==='منخفضة'?'green':'orange';
   const title=t.task_name||t.action_required||t.title||'مهمة متابعة';
   const project=t.project_name||t.project?.project_name||'بدون مشروع';
   const due=t.due_date?new Date(t.due_date).toLocaleDateString('ar-OM'):'بدون تاريخ';
   const done=String(t.status||'').toLowerCase().includes('مكتمل')||String(t.status||'').toLowerCase().includes('done');
   return '<div class="profile-task '+(done?'done':'')+'"><button class="profile-check" type="button" data-task-id="'+escA(t.id)+'" aria-label="إنجاز المهمة"></button><div class="profile-row-main"><strong>'+escA(title)+'</strong><small>'+escA(project)+' · '+escA(due)+' · <b class="'+cls+'">أولوية '+escA(priority)+'</b></small></div></div>';
 }).join('');
 el.querySelectorAll('[data-task-id]').forEach(btn=>btn.onclick=async()=>{
   const row=rows.find(x=>String(x.id)===String(btn.dataset.taskId)); if(!row)return;
   const next=String(row.status||'')==='مكتمل'?'مفتوح':'مكتمل';
   const {error}=await client.from('employee_followups').update({status:next}).eq('id',row.id).eq('assigned_to',profile.id);
   if(error){toastA(error.message);return}
   btn.parentElement.classList.toggle('done',next==='مكتمل');
   window.icvSaveSuccess?.('تم تحديث حالة المهمة');
 });
}
function renderMyActivity(rows){
 const el=document.getElementById('accessProfileActivity');if(!el)return;
 const items=(rows||[]).slice(0,6);
 el.innerHTML=items.length?items.map(t=>'<div class="profile-activity"><b>'+escA(t.action_required||t.task_name||t.title||'تم تحديث مهمة متابعة')+'</b><small>'+escA(t.updated_at?new Date(t.updated_at).toLocaleString('ar-OM'):t.created_at?new Date(t.created_at).toLocaleString('ar-OM'):'آخر تحديث')+'</small></div>').join(''):'<div class="profile-empty">لا توجد أنشطة مسجلة حاليًا.</div>';
}
window.openMyTaskForm=function(){
 document.getElementById('myTaskModal')?.remove();
 const d=document.createElement('div');d.id='myTaskModal';d.className='modal';d.innerHTML='<div class="modal-card"><div class="modal-head"><div><h2>إضافة مهمة</h2><div class="muted">إضافة متابعة شخصية إلى ملفك.</div></div><button class="close" onclick="this.closest(\'.modal\').remove()">×</button></div><div class="form-grid"><div class="field full"><label>المهمة</label><input id="myTaskName" placeholder="اكتب المهمة"></div><div class="field"><label>المشروع</label><input id="myTaskProject" placeholder="اختياري"></div><div class="field"><label>تاريخ الاستحقاق</label><input id="myTaskDue" type="date"></div><div class="field"><label>الأولوية</label><select id="myTaskPriority"><option value="عالية">عالية</option><option value="متوسطة" selected>متوسطة</option><option value="منخفضة">منخفضة</option></select></div><div class="field full"><label>ملاحظات</label><textarea id="myTaskNotes" rows="3" placeholder="اختياري"></textarea></div></div><div id="myTaskMsg"></div><div class="modal-foot"><button class="btn primary" onclick="saveMyTask()">إضافة المهمة</button><button class="btn" onclick="this.closest(\'.modal\').remove()">إلغاء</button></div></div>';
 document.body.appendChild(d);
};
window.saveMyTask=async function(){
 const name=document.getElementById('myTaskName')?.value.trim(),msg=document.getElementById('myTaskMsg');
 if(!name){if(msg)msg.innerHTML='<div class="bad">اكتب اسم المهمة أولاً.</div>';return}
 const body={assigned_to:profile.id,employee_name:profile.full_name||profile.username||'المستخدم',action_required:name,due_date:document.getElementById('myTaskDue')?.value||null,status:'مفتوح',notes:((document.getElementById('myTaskProject')?.value||'')+' '+(document.getElementById('myTaskNotes')?.value||'')).trim()};
 const {error}=await client.from('employee_followups').insert(body);
 if(error){if(msg)msg.innerHTML='<div class="bad">'+escA(error.message)+'</div>';return}
 document.getElementById('myTaskModal')?.remove();await loadProfilePage();window.icvSaveSuccess?.('تم إضافة المهمة');
};
window.openChangePassword=function(){
 document.getElementById('changePasswordModal')?.remove();
 const d=document.createElement('div');d.id='changePasswordModal';d.className='modal';d.innerHTML='<div class="modal-card"><div class="modal-head"><div><h2>تغيير الرقم السري</h2><div class="muted">سيتم تحديث كلمة مرور حسابك فقط.</div></div><button class="close" onclick="this.closest(\'.modal\').remove()">×</button></div><div class="form-grid"><div class="field full"><label>كلمة المرور الجديدة</label><input id="newPassword" type="password" minlength="8"></div><div class="field full"><label>تأكيد كلمة المرور</label><input id="newPassword2" type="password" minlength="8"></div></div><div id="changePasswordMsg"></div><div class="modal-foot"><button class="btn primary" onclick="saveNewPassword()">حفظ</button><button class="btn" onclick="this.closest(\'.modal\').remove()">إلغاء</button></div></div>';
 document.body.appendChild(d);
};
window.saveNewPassword=async function(){
 const a=document.getElementById('newPassword')?.value||'',b=document.getElementById('newPassword2')?.value||'',msg=document.getElementById('changePasswordMsg');
 if(a.length<8){msg.innerHTML='<div class="bad">كلمة المرور يجب أن تكون 8 أحرف على الأقل.</div>';return}
 if(a!==b){msg.innerHTML='<div class="bad">تأكيد كلمة المرور غير مطابق.</div>';return}
 const {error}=await client.auth.updateUser({password:a});
 if(error){msg.innerHTML='<div class="bad">'+escA(error.message)+'</div>';return}
 document.getElementById('changePasswordModal')?.remove();window.icvSaveSuccess?.('تم تغيير الرقم السري بنجاح');
};
async function loadProfilePage(){
 if(!profile)await getProfile();const uid=profile?.id;if(!uid)return;
 const [a,pr,rr,pl,tasks]=await Promise.all([
  client.from('user_entity_assignments_view').select('*').eq('user_id',uid).order('government_entity'),
  client.from('projects').select('id,project_name,serial_no,government_entity_id,project_status,start_date,end_date,local_content_plan,omanization_pct,sme_pct,total_project_value,notes').order('project_name'),
  client.from('quarterly_reports').select('id,project_id,quarter,annual_period,status,created_at').order('created_at',{ascending:false}),
  client.from('local_content_plans').select('project_id,status,created_at').order('created_at',{ascending:false}),
  client.from('employee_followups').select('*').eq('assigned_to',uid).order('due_date',{ascending:true})
 ]);
 const assigned=a.data||[],all=pr.data||[],reports=rr.data||[],plans=pl.data||[],taskRows=tasks.data||[],admin=profile.role==='admin',ids=new Set(assigned.map(x=>x.government_entity_id));
 const projects=admin?all:all.filter(x=>ids.has(x.government_entity_id));window.__icvProfileAssignedIds=admin?[...new Set(all.map(x=>x.government_entity_id).filter(Boolean))]:[...ids];
 const pids=new Set(projects.map(x=>x.id)),myReports=reports.filter(x=>pids.has(x.project_id)),planIds=new Set(plans.map(x=>x.project_id));
 const latest=new Set(myReports.map(x=>x.project_id+'|'+x.annual_period+'|'+x.quarter));
 const now=new Date(),year=now.getFullYear(),q=Math.floor(now.getMonth()/3)+1,missing=[],due=[];
 projects.forEach(p=>{if(!p.start_date||new Date(p.start_date)>now)return;const key=p.id+'|'+year+'|Q'+q;if(latest.has(key))return;const d=new Date(year,q*3,0);d.setDate(d.getDate()+30);const days=Math.ceil((d-now)/86400000);if(days>=0&&days<=10)due.push({p,days});else if(days<0)missing.push({p,days:Math.abs(days)})});
 const attention=[];const pct=v=>{let n=Number(v||0);if(n<=1)n*=100;return n.toFixed(1)+'%'};projects.forEach(p=>{if(Number(p.omanization_pct||0)<.30)attention.push({p,t:'التعمين أقل من 30%',k:'red'});if(Number(p.sme_pct||0)<.10)attention.push({p,t:'SME أقل من 10%',k:'red'});if(p.project_status==='متعثر')attention.push({p,t:'المشروع متعثر',k:'orange'});if(!p.local_content_plan&&!planIds.has(p.id))attention.push({p,t:'لا توجد خطة محتوى محلي',k:'orange'})});
 const exp=projects.filter(p=>p.end_date).map(p=>({p,d:new Date(p.end_date)})).filter(x=>x.d>=now&&x.d<=new Date(now.getTime()+90*86400000)).sort((a,b)=>a.d-b.d),fmt=d=>d?new Date(d).toLocaleDateString('ar-OM'):'—';
 document.getElementById('accessProfileSummary').innerHTML=[['إجمالي المشاريع',projects.length,''],['قيد التنفيذ',projects.filter(p=>p.project_status==='قيد التنفيذ').length,'green'],['تحتاج متابعة',attention.length,'orange'],['تقارير تحتاج إجراء',missing.length+due.length,'red']].map(x=>'<div class="card"><div class="label">'+escA(x[0])+'</div><div class="value '+x[2]+'">'+x[1]+'</div></div>').join('');
 document.getElementById('accessProfileEntities').innerHTML=assigned.length?assigned.map(x=>'<span class="profile-entity">'+escA(x.government_entity)+'</span>').join(''):(admin?'<span class="profile-admin-note">مدير النظام: يتم عرض جميع المشاريع.</span>':'<span class="profile-empty">لم يتم تخصيص جهات لهذا الحساب.</span>');
 let h='<div class="profile-grid">';
 h+='<section class="profile-card full"><div class="profile-card-head"><h3>🔴 التقارير التي تحتاج إجراء</h3><span class="profile-muted">'+(missing.length+due.length)+' تقارير</span></div><div class="profile-filter"><button class="active" data-alert-filter="all">الكل</button><button data-alert-filter="missing">غير مستلم</button><button data-alert-filter="due">مستحق قريبًا</button></div><div id="myReportAlerts">';
 missing.forEach(x=>h+='<div class="profile-row report-row" data-type="missing"><div class="profile-icon">!</div><div class="profile-row-main"><strong>'+escA(x.p.project_name)+'</strong><span>Q'+q+' '+year+' — التقرير غير مستلم · متأخر '+x.days+' يوم</span></div><button class="profile-open" data-open-project="'+x.p.id+'">فتح المشروع ←</button></div>');
 due.forEach(x=>h+='<div class="profile-row report-row" data-type="due"><div class="profile-icon orange">!</div><div class="profile-row-main"><strong>'+escA(x.p.project_name)+'</strong><span>Q'+q+' '+year+' — مستحق خلال '+x.days+' أيام</span></div><button class="profile-open" data-open-project="'+x.p.id+'">فتح المشروع ←</button></div>');
 if(!missing.length&&!due.length)h+='<div class="profile-empty">لا توجد تقارير تحتاج إجراء حاليًا.</div>';
 h+='</div>'+(missing.length+due.length>5?'<button class="profile-show-all" data-toggle-list="myReportAlerts">إظهار الكل</button>':'')+'</section>';
 h+='<section class="profile-card"><div class="profile-card-head"><h3>📅 مشاريع تنتهي خلال 3 أشهر</h3><span class="profile-muted">'+exp.length+' مشاريع</span></div><div id="expiringProjects">';
 exp.forEach(x=>h+='<div class="profile-row"><div class="profile-icon orange">3M</div><div class="profile-row-main"><strong>'+escA(x.p.project_name)+'</strong><span>'+fmt(x.p.end_date)+' — متبقي '+Math.ceil((x.d-now)/86400000)+' يوم</span></div><button class="profile-open" data-open-project="'+x.p.id+'">فتح المشروع ←</button></div>');
 if(!exp.length)h+='<div class="profile-empty">لا توجد مشاريع تنتهي خلال 3 أشهر.</div>';
 h+='</div>'+(exp.length>5?'<button class="profile-show-all" data-toggle-list="expiringProjects">إظهار الكل</button>':'')+'</section>';
 h+='<section class="profile-card"><div class="profile-card-head"><h3>⚠️ مشاريع تحتاج متابعة</h3><span class="profile-muted">'+attention.length+'</span></div><div id="attentionProjects">';
 attention.forEach(x=>h+='<div class="profile-row"><div class="profile-icon '+(x.k==='red'?'':'orange')+'">'+(x.t.includes('تعمين')?'30%':x.t.includes('SME')?'SME':x.t.includes('خطة')?'📄':'!')+'</div><div class="profile-row-main"><strong>'+escA(x.p.project_name)+'</strong><span>'+x.t+'</span></div><button class="profile-open" data-open-project="'+x.p.id+'">فتح المشروع ←</button></div>');
 if(!attention.length)h+='<div class="profile-empty">لا توجد مشاريع تحتاج متابعة حاليًا.</div>';
 h+='</div>'+(attention.length>5?'<button class="profile-show-all" data-toggle-list="attentionProjects">إظهار الكل</button>':'')+'</section>';
 h+='<section class="profile-card full"><div class="profile-card-head"><h3>📋 التقارير التي تحتاج إجراء</h3><span class="profile-muted">آخر الحالات</span></div><div class="profile-table-wrap"><table class="profile-table"><thead><tr><th>المشروع</th><th>الفترة</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>';
 myReports.slice(0,10).forEach(r=>{const p=projects.find(x=>x.id===r.project_id);if(p)h+='<tr><td>'+escA(p.project_name)+'</td><td>'+escA((r.quarter||'')+' '+(r.annual_period||''))+'</td><td><span class="profile-status '+(String(r.status||'').includes('غير')?'red':'orange')+'">'+escA(r.status||'—')+'</span></td><td><button class="profile-open" data-open-project="'+p.id+'">فتح المشروع ←</button></td></tr>'});
 if(!myReports.length)h+='<tr><td colspan="4" class="profile-empty">لا توجد تقارير مسجلة.</td></tr>';
 h+='</tbody></table></div></section>';
 h+='<section class="profile-card"><div class="profile-card-head"><h3>📝 مهامي</h3><button class="btn primary" style="width:auto" id="profileAddTaskBtn">+ إضافة مهمة</button></div><div id="accessProfileTasks" class="profile-task-wrap">جاري التحميل...</div></section>';
 h+='<section class="profile-card"><div class="profile-card-head"><h3>🕐 آخر الأنشطة</h3><span class="profile-muted">آخر التحديثات</span></div><div id="accessProfileActivity" class="profile-activity-wrap">جاري التحميل...</div></section>';
 h+='</div><section class="profile-security"><div><h3>🔐 أمان الحساب</h3><p>تغيير الرقم السري متاح في أي وقت. صلاحياتك والجهات المسندة إليك تُدار من قبل مدير النظام.</p></div><button class="btn primary" style="width:auto" id="profilePasswordBtn">تغيير الرقم السري</button></section>';
 document.getElementById('accessProfileAlerts').innerHTML=h;
 document.getElementById('profileHeadName').textContent=profile.full_name||profile.username||'المستخدم';document.getElementById('profileHeadUsername').textContent=profile.username||'—';
 document.getElementById('profileHeadUsername').textContent=profile.username||'—';
 document.getElementById('profileHeadRole').textContent=roleLabel[profile.role]||profile.role||'مشاهد';
 document.getElementById('profileHeadInitials').textContent=(profile.full_name||profile.username||'م').trim().split(/\\s+/).slice(0,2).map(x=>x[0]).join('');
 setupProfileInteractions();renderMyTasks(taskRows);renderMyActivity(taskRows);
}

function setupProfileInteractions(){
 document.querySelectorAll('#accessProfileAlerts [data-open-project]').forEach(b=>b.onclick=()=>openMyProject(b.dataset.openProject));
 document.querySelectorAll('#accessProfileAlerts [data-toggle-list]').forEach(b=>b.onclick=()=>{const list=document.getElementById(b.dataset.toggleList);if(!list)return;const open=list.classList.toggle('expanded');b.textContent=open?'إخفاء':'إظهار الكل'});
 document.querySelectorAll('#accessProfileAlerts [data-alert-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('#accessProfileAlerts [data-alert-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const type=b.dataset.alertFilter,list=document.getElementById('myReportAlerts');Array.from(list.children).forEach((x,i)=>x.style.display=type==='all'?(i<5||list.classList.contains('expanded')?'flex':'none'):(x.dataset.type===type&&(list.classList.contains('expanded')||Array.from(list.querySelectorAll('[data-type="'+type+'"]')).indexOf(x)<5)?'flex':'none'))});
}
function limitProfileList(list){if(!list)return;Array.from(list.children).forEach((x,i)=>x.classList.toggle('icv-profile-extra',i>=5))}
window.openMyProject=id=>{if(typeof window.viewProject==='function')window.viewProject(id);else location.href='index.html?project='+encodeURIComponent(id)};
window.openMyEntitySelection=async function(){
 const uid=profile?.id;if(!uid)return;
 const [e,a]=await Promise.all([client.from('government_entities').select('id,name,code').order('name'),client.from('user_entity_assignments_view').select('government_entity_id').eq('user_id',uid)]);
 const selected=new Set((a.data||[]).map(x=>x.government_entity_id));
 const d=document.createElement('div');d.id='myEntityAccessModal';d.className='modal';d.innerHTML='<div class="modal-card"><div class="modal-head"><div><h2>جهات المتابعة</h2><div class="muted">حدد الجهات التي تتابعها</div></div><button class="close" onclick="this.closest(\'.modal\').remove()">×</button></div><div class="actions" style="margin:14px 0"><button class="btn" onclick="document.querySelectorAll(\'#myEntityAccessChecklist input\').forEach(x=>x.checked=true)">تحديد الكل</button><button class="btn" onclick="document.querySelectorAll(\'#myEntityAccessChecklist input\').forEach(x=>x.checked=false)">إلغاء الكل</button><input id="myEntityAccessSearch" class="search" style="flex:1" placeholder="بحث..." oninput="filterMyEntities()"></div><div id="myEntityAccessChecklist" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:55vh;overflow:auto">'+(e.data||[]).map(x=>'<label class="card" style="padding:10px;cursor:pointer"><input type="checkbox" value="'+x.id+'" '+(selected.has(x.id)?'checked':'')+'> '+escA(x.name)+(x.code?' <small class="muted">('+escA(x.code)+')</small>':'')+'</label>').join('')+'</div><div id="myEntityAccessMsg"></div><button class="btn primary" style="margin-top:14px;width:auto" onclick="saveMyEntitySelection()">حفظ الجهات</button></div>';
 document.body.appendChild(d);
};
window.filterMyEntities=()=>{const q=(document.getElementById('myEntityAccessSearch')?.value||'').toLowerCase();document.querySelectorAll('#myEntityAccessChecklist label').forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?'block':'none')};
window.saveMyEntitySelection=async()=>{
 const ids=[...document.querySelectorAll('#myEntityAccessChecklist input:checked')].map(x=>x.value);
 const r=await client.rpc('set_my_entity_assignments',{p_entity_ids:ids});
 const m=document.getElementById('myEntityAccessMsg');
 if(r.error){m.innerHTML='<div class="bad" style="padding:10px">'+escA(r.error.message)+'</div>';return}
 document.getElementById('myEntityAccessModal')?.remove();await loadProfilePage();toastA('تم حفظ جهات المتابعة');
};
window.loadUsersAdmin=async function(){
 if(profile?.role!=='admin')return;
 const box=document.getElementById('usersAdminBox');if(!box)return;
 box.innerHTML='جاري التحميل...';
 const [r,er]=await Promise.all([
   client.from('user_management').select('*').order('display_name'),
   client.from('government_entities').select('id,name').order('name')
 ]);
 if(r.error){box.innerHTML='<div class="bad">'+escA(r.error.message)+'</div>';return}
 const users=r.data||[];
 const ids=users.map(x=>x.user_id).filter(Boolean);
 let ar={data:[]};
 if(ids.length) ar=await client.from('user_entity_assignments').select('user_id,government_entity_id').in('user_id',ids);
 const amap={};(ar.data||[]).forEach(x=>{(amap[x.user_id]||(amap[x.user_id]=[])).push(x.government_entity_id)});
 window.__icvAdminUsers=users.map(x=>Object.assign({},x,{assigned_entity_ids:(amap[x.user_id]||[]).join(',')}));
 const ef=document.getElementById('usersEntityFilter');
 if(ef)ef.innerHTML='<option value="">كل الجهات</option>'+((er.data||[]).map(e=>'<option value="'+escA(e.id)+'">'+escA(e.name)+'</option>').join(''));
 const count=document.getElementById('usersAdminCount');if(count)count.textContent='إجمالي المستخدمين: '+window.__icvAdminUsers.length;
 if(!users.length){box.innerHTML='<div class="empty">لا يوجد مستخدمون.</div>';return}
 box.innerHTML='<div class="table-wrap"><table class="um-table"><thead><tr><th>المستخدم</th><th>الاسم</th><th>الدور</th><th>الحالة</th><th>الصلاحية</th><th>الجهات المسندة</th><th>بداية الصلاحية</th><th>نهاية الصلاحية</th><th>إجراءات</th></tr></thead><tbody>'+window.__icvAdminUsers.map(u=>{
   const initials=(u.display_name||u.username||'?').trim().split(/\\s+/).slice(0,2).map(x=>x[0]).join('');
   return '<tr data-user-row data-role="'+escA(u.role||'')+'" data-active="'+(u.is_active?'1':'0')+'" data-name="'+escA(u.display_name||'')+'" data-entities="'+escA(u.assigned_entity_ids||'')+'"><td><div class="um-user"><span class="um-avatar">'+escA(initials)+'</span><div><b>'+escA(u.username||'—')+'</b><small>حساب مستخدم</small></div></div></td><td><b>'+escA(u.display_name||'—')+'</b></td><td><span class="um-badge role-'+escA(u.role||'viewer')+'">'+escA(roleLabel[u.role]||u.role||'مشاهد')+'</span></td><td><span class="um-badge '+(u.is_active?'active':'inactive')+'">'+(u.is_active?'فعال':'غير فعال')+'</span></td><td>'+escA(roleLabel[u.role]||u.role||'مشاهد')+'</td><td><span class="um-entity-count">'+Number(u.assigned_entities||0)+'</span></td><td>'+escA(u.access_starts_at?new Date(u.access_starts_at).toLocaleDateString('ar-OM'):'بدون حد')+'</td><td>'+escA(u.access_expires_at?new Date(u.access_expires_at).toLocaleDateString('ar-OM'):'بدون نهاية')+'</td><td><div class="um-actions"><button class="icon-btn" title="الملف الشخصي" onclick="openUserProfile(\''+u.user_id+'\')">👤</button><button class="icon-btn" title="تعديل" onclick="openUserFormById(\''+u.user_id+'\')">✎</button><button class="icon-btn" title="الجهات" onclick="openEntityAssignment(\''+u.user_id+'\',\''+escA(u.display_name||u.username)+'\')">🏛</button></div></td></tr>';
 }).join('')+'</tbody></table></div>';
 filterAdminUsers();
}
window.filterAdminUsers=()=>{const q=(document.getElementById('usersSearch')?.value||'').trim().toLowerCase(),n=(document.getElementById('usersNameFilter')?.value||'').trim().toLowerCase(),role=document.getElementById('usersRoleFilter')?.value||'',status=document.getElementById('usersStatusFilter')?.value||'',entity=document.getElementById('usersEntityFilter')?.value||'';let shown=0;document.querySelectorAll('#usersAdminBox [data-user-row]').forEach(row=>{const hit=!q||row.textContent.toLowerCase().includes(q),nhit=!n||row.dataset.name.toLowerCase().includes(n),rhit=!role||row.dataset.role===role,shit=!status||(status==='active'?row.dataset.active==='1':row.dataset.active!=='1'),ehit=!entity||row.dataset.entities.split(',').includes(entity);row.style.display=hit&&nhit&&rhit&&shit&&ehit?'':'none';if(hit&&nhit&&rhit&&shit&&ehit)shown++});const cc=document.getElementById('usersAdminCount');if(cc)cc.textContent='المستخدمون المعروضون: '+shown+' من '+(window.__icvAdminUsers||[]).length};
window.openUserFormById=async uid=>{const r=await client.from('user_management').select('*').eq('user_id',uid).maybeSingle();if(r.error||!r.data)return toastA(r.error?.message||'تعذر تحميل المستخدم');openUserForm(r.data)};
window.openUserForm=function(user){
 const edit=!!user;document.getElementById('accessUserModal')?.remove();
 const d=document.createElement('div');d.id='accessUserModal';d.className='modal';
 d.innerHTML='<div class="modal-card"><div class="modal-head"><div><h2>'+(edit?'تعديل مستخدم':'إضافة مستخدم')+'</h2><div class="muted">'+(edit?'تعديل الدور وفترة الصلاحية':'إنشاء حساب جديد بنفس آلية المنصة السابقة')+'</div></div><button class="close" onclick="this.closest(\'.modal\').remove()">×</button></div><div class="form-grid"><div class="field"><label>اسم المستخدم</label><input id="au_username" '+(edit?'disabled':'')+' value="'+escA(user?.username||'')+'"></div><div class="field"><label>اسم الموظف</label><input id="au_name" value="'+escA(user?.display_name||'')+'"></div>'+(edit?'':'<div class="field"><label>كلمة المرور</label><input id="au_password" type="password" minlength="8"></div>')+'<div class="field"><label>الدور</label><select id="au_role"><option value="viewer">مشاهد</option><option value="editor">محرر</option><option value="admin">مدير النظام</option><option value="temporary_viewer">مشاهد مؤقت</option></select></div><div class="field"><label>بداية الصلاحية</label><input id="au_start" type="datetime-local"></div><div class="field"><label>نهاية الصلاحية</label><input id="au_end" type="datetime-local"></div>'+(edit?'<div class="field full"><label><input id="au_active" type="checkbox"> الحساب نشط</label></div>':'')+'</div><div id="accessUserMsg"></div><button class="btn primary" style="width:auto" onclick="saveAccessUser(\''+(user?.user_id||'')+'\')">'+(edit?'حفظ التعديلات':'إنشاء المستخدم')+'</button></div>';
 document.body.appendChild(d);
 if(user){au_role.value=user.role||'viewer';au_start.value=user.access_starts_at?new Date(user.access_starts_at).toISOString().slice(0,16):'';au_end.value=user.access_expires_at?new Date(user.access_expires_at).toISOString().slice(0,16):'';au_active.checked=user.is_active!==false}
};
window.saveAccessUser=async uid=>{
 const role=document.getElementById('au_role').value,start=document.getElementById('au_start').value||null,end=document.getElementById('au_end').value||null,msg=document.getElementById('accessUserMsg');
 if(start&&end&&new Date(end)<=new Date(start)){msg.innerHTML='<div class="bad">نهاية الصلاحية يجب أن تكون بعد البداية.</div>';return}
 const body=uid?{action:'update',user_id:uid,display_name:document.getElementById('au_name').value.trim(),role,is_active:document.getElementById('au_active').checked,access_starts_at:start?new Date(start).toISOString():null,access_expires_at:end?new Date(end).toISOString():null}:{action:'create',username:document.getElementById('au_username').value.trim(),password:document.getElementById('au_password').value,display_name:document.getElementById('au_name').value.trim(),role,access_starts_at:start?new Date(start).toISOString():null,access_expires_at:end?new Date(end).toISOString():null};
 msg.textContent='جاري الحفظ...';
 const r=await client.functions.invoke('manage-platform-user',{body});
 if(r.error||r.data?.error){msg.innerHTML='<div class="bad">'+escA(r.error?.message||r.data?.error)+'</div>';return}
 msg.innerHTML='<div class="ok">تم الحفظ بنجاح</div>';await window.loadUsersAdmin();setTimeout(()=>document.getElementById('accessUserModal')?.remove(),500);
};
window.openEntityAssignment=async(uid,name)=>{
 const [e,a]=await Promise.all([client.from('government_entities').select('id,name,code').order('name'),client.from('user_entity_assignments_view').select('government_entity_id').eq('user_id',uid)]);
 if(e.error||a.error)return toastA((e.error||a.error).message);
 const selected=new Set((a.data||[]).map(x=>x.government_entity_id));
 const d=document.createElement('div');d.id='accessEntityModal';d.className='modal';
 d.innerHTML='<div class="modal-card"><div class="modal-head"><div><h2>تحديد الجهات</h2><div class="muted">الموظف: '+escA(name)+'</div></div><button class="close" onclick="this.closest(\'.modal\').remove()">×</button></div><div class="actions" style="margin:14px 0"><button class="btn" onclick="document.querySelectorAll(\'#accessEntityChecklist input\').forEach(x=>x.checked=true)">تحديد الكل</button><button class="btn" onclick="document.querySelectorAll(\'#accessEntityChecklist input\').forEach(x=>x.checked=false)">إلغاء الكل</button><input id="accessEntitySearch" class="search" style="flex:1" placeholder="بحث..." oninput="filterAccessEntities()"></div><div id="accessEntityChecklist" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:55vh;overflow:auto">'+(e.data||[]).map(x=>'<label class="card access-entity-item" style="padding:10px;cursor:pointer"><input type="checkbox" value="'+x.id+'" '+(selected.has(x.id)?'checked':'')+'> '+escA(x.name)+(x.code?' <small class="muted">('+escA(x.code)+')</small>':'')+'</label>').join('')+'</div><div id="accessEntityMsg"></div><button class="btn primary" style="width:auto;margin-top:14px" onclick="saveAccessEntityAssignment(\''+uid+'\')">حفظ الجهات</button></div>';
 document.body.appendChild(d);
};
window.filterAccessEntities=()=>{const q=(document.getElementById('accessEntitySearch')?.value||'').toLowerCase();document.querySelectorAll('.access-entity-item').forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?'block':'none')};
window.saveAccessEntityAssignment=async uid=>{
 const ids=[...document.querySelectorAll('#accessEntityChecklist input:checked')].map(x=>x.value),m=document.getElementById('accessEntityMsg');
 const r=await client.rpc('set_user_entity_assignments',{p_user_id:uid,p_entity_ids:ids});
 if(r.error){m.innerHTML='<div class="bad">'+escA(r.error.message)+'</div>';return}
 document.getElementById('accessEntityModal')?.remove();await loadUsersAdmin();toastA('تم حفظ الجهات');
};

window.openUserProfile=async function(uid){
 const [u,a,p]=await Promise.all([
   client.from('user_management').select('*').eq('user_id',uid).maybeSingle(),
   client.from('user_entity_assignments_view').select('*').eq('user_id',uid).order('government_entity'),
   client.from('projects').select('id,project_name,government_entity_id,project_status,end_date,omanization_pct,sme_pct,local_content_plan,due_reports,received_reports,late_reports')
 ]);
 if(u.error||!u.data)return toastA(u.error?.message||'تعذر تحميل ملف الموظف');
 const user=u.data,assigned=a.data||[],ids=new Set(assigned.map(x=>x.government_entity_id)),projects=(p.data||[]).filter(x=>ids.has(x.government_entity_id));
 const now=new Date(),three=new Date(now);three.setMonth(three.getMonth()+3);
 const due=projects.reduce((n,x)=>n+Math.max(0,Number(x.due_reports||0)-Number(x.received_reports||0)),0),late=projects.reduce((n,x)=>n+Number(x.late_reports||0),0),ending=projects.filter(x=>x.end_date&&new Date(x.end_date)>=now&&new Date(x.end_date)<=three).length,lowOm=projects.filter(x=>x.omanization_pct!=null&&Number(x.omanization_pct)<30).length,lowSme=projects.filter(x=>x.sme_pct!=null&&Number(x.sme_pct)<10).length,stalled=projects.filter(x=>x.project_status==='متعثر').length,noPlan=projects.filter(x=>!x.local_content_plan).length;
 const initials=(user.display_name||user.username||'?').trim().split(/\\s+/).slice(0,2).map(x=>x[0]).join('');
 window.icvOpenUserProject=id=>{if(window.icvV2?.projectPage)window.icvV2.projectPage(id);else showPage('projects')};
 document.getElementById('accessUserProfileModal')?.remove();
 const d=document.createElement('div');d.id='accessUserProfileModal';d.className='modal';
 d.innerHTML='<div class="modal-card um-profile-modal"><div class="um-profile-head"><button class="close" onclick="this.closest(\'.modal\').remove()">×</button><div class="um-profile-main"><div class="um-profile-avatar">'+escA(initials)+'</div><div><h2>'+escA(user.display_name||user.username||'المستخدم')+'</h2><div>'+escA(user.username||'—')+' · '+escA(roleLabel[user.role]||user.role)+'</div></div></div></div><div class="um-profile-body"><div class="um-profile-grid"><div class="card"><h3>الجهات المسندة</h3><div class="um-entity-list">'+(assigned.length?assigned.map(x=>'<span>'+escA(x.government_entity||'—')+'</span>').join(''):'<em>لا توجد جهات مسندة</em>')+'</div></div><div class="card"><h3>ملخص المتابعة</h3><div class="um-metrics"><div><b>'+projects.length+'</b><small>مشاريع تحتاج متابعة</small></div><div><b>'+due+'</b><small>تقارير غير مسلمة</small></div><div><b>'+late+'</b><small>تقارير متأخرة</small></div><div><b>'+ending+'</b><small>تنتهي خلال 3 أشهر</small></div><div><b>'+lowOm+'</b><small>تعمين أقل من 30%</small></div><div><b>'+lowSme+'</b><small>SME أقل من 10%</small></div></div></div></div><div class="card"><h3>التنبيهات التي تحتاج متابعة</h3><div class="um-alerts">'+projects.filter(x=>Number(x.late_reports||0)>0).slice(0,5).map(x=>'<div class="um-alert danger" onclick="window.icvOpenUserProject(\''+x.id+'\')"><b>تقرير متأخر — '+escA(x.project_name)+'</b><small>عدد التقارير المتأخرة: '+Number(x.late_reports||0)+'</small></div>').join('')+projects.filter(x=>x.end_date&&new Date(x.end_date)>=now&&new Date(x.end_date)<=three).slice(0,5).map(x=>'<div class="um-alert" onclick="window.icvOpenUserProject(\''+x.id+'\')"><b>مشروع ينتهي خلال 3 أشهر — '+escA(x.project_name)+'</b><small>تاريخ الانتهاء: '+escA(new Date(x.end_date).toLocaleDateString('ar-OM'))+'</small></div>').join('')+projects.filter(x=>x.omanization_pct!=null&&Number(x.omanization_pct)<30).slice(0,5).map(x=>'<div class="um-alert danger" onclick="window.icvOpenUserProject(\''+x.id+'\')"><b>تعمين أقل من 30% — '+escA(x.project_name)+'</b><small>النسبة الحالية: '+Number(x.omanization_pct||0).toFixed(1)+'%</small></div>').join('')+projects.filter(x=>x.sme_pct!=null&&Number(x.sme_pct)<10).slice(0,5).map(x=>'<div class="um-alert" onclick="window.icvOpenUserProject(\''+x.id+'\')"><b>SME أقل من 10% — '+escA(x.project_name)+'</b><small>النسبة الحالية: '+Number(x.sme_pct||0).toFixed(1)+'%</small></div>').join('')+projects.filter(x=>x.project_status==='متعثر').slice(0,5).map(x=>'<div class="um-alert danger" onclick="window.icvOpenUserProject(\''+x.id+'\')"><b>مشروع متعثر — '+escA(x.project_name)+'</b><small>يحتاج متابعة مباشرة</small></div>').join('')+projects.filter(x=>!x.local_content_plan).slice(0,5).map(x=>'<div class="um-alert" onclick="window.icvOpenUserProject(\''+x.id+'\')"><b>لا توجد خطة محتوى محلي — '+escA(x.project_name)+'</b><small>اضغط لفتح صفحة المشروع</small></div>').join('')+'<div class="um-alert-empty" style="display:'+((late+ending+lowOm+lowSme+stalled+noPlan)===0?'block':'none')+'">لا توجد تنبيهات حالية.</div></div></div></div></div><div class="modal-foot"><button class="btn" onclick="this.closest(\'.modal\').remove()">إغلاق</button></div></div>';
 document.body.appendChild(d);
};
function injectUserManagementStyle(){if(document.getElementById('um-style'))return;const s=document.createElement('style');s.id='um-style';s.textContent='.um-wrap{min-width:0}.um-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;background:linear-gradient(135deg,var(--primary2),var(--primary));color:#fff;border-radius:18px;padding:22px;margin-bottom:16px}.um-crumb{font-size:10px;opacity:.7;margin-bottom:5px}.um-hero h2{margin:0 0 5px;font-size:22px}.um-hero p{margin:0;opacity:.82;font-size:11px}.um-add{background:#fff!important;color:var(--primary2)!important;border-color:#fff!important}.um-filter-grid{display:grid;grid-template-columns:1.3fr 1.3fr 1fr 1fr 1.3fr;gap:10px}.um-table-panel{padding:0;overflow:hidden}.um-table-head{padding:16px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line)}.um-table-head h3{margin:0;font-size:15px}.um-table{width:100%;border-collapse:collapse}.um-table th,.um-table td{padding:12px 13px;border-bottom:1px solid var(--line);text-align:right;font-size:11px;white-space:nowrap}.um-table th{font-size:10px;color:var(--muted);background:#fafbfc}.um-user{display:flex;align-items:center;gap:9px}.um-user small{display:block;color:var(--muted);font-size:9px;margin-top:2px}.um-avatar{width:34px;height:34px;border-radius:9px;background:var(--soft);color:var(--primary2);display:grid;place-items:center;font-weight:900}.um-badge{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:800}.um-badge.active{background:#eaf7ef;color:#087443}.um-badge.inactive{background:#f1f3f5;color:#667085}.um-badge.role-admin{background:#eaf2ff;color:#245ea8}.um-badge.role-editor{background:#eaf7ef;color:#087443}.um-badge.role-viewer{background:#f1f3f5;color:#667085}.um-badge.role-temporary_viewer{background:#fff4e5;color:#b54708}.um-entity-count{display:inline-grid;place-items:center;min-width:27px;height:27px;border-radius:8px;background:var(--soft);color:var(--primary2);font-weight:900}.um-actions{display:flex;gap:4px}.icon-btn{border:1px solid var(--line);background:#fff;border-radius:7px;padding:6px 8px;cursor:pointer}.icon-btn:hover{background:var(--soft)}.um-profile-modal{width:min(980px,100%);overflow:hidden}.um-profile-head{background:linear-gradient(135deg,var(--primary2),var(--primary));color:#fff;padding:22px}.um-profile-head .close{float:left;background:rgba(255,255,255,.14);color:#fff;border:0;border-radius:8px;width:32px;height:32px}.um-profile-main{display:flex;align-items:center;gap:13px}.um-profile-avatar{width:60px;height:60px;border-radius:16px;background:#fff;color:var(--primary2);display:grid;place-items:center;font-size:22px;font-weight:900}.um-profile-main h2{margin:0 0 4px}.um-profile-main div:last-child{font-size:11px;opacity:.8}.um-profile-body{padding:18px;background:#f7f9fb}.um-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.um-profile-body .card{padding:15px}.um-profile-body h3{margin:0 0 12px;font-size:13px}.um-entity-list{display:flex;flex-wrap:wrap;gap:7px}.um-entity-list span{padding:7px 9px;border-radius:8px;background:var(--soft);color:var(--primary2);font-size:10px;font-weight:700}.um-entity-list em{color:var(--muted);font-size:11px}.um-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.um-metrics div{background:#f8fafc;border-radius:9px;padding:10px}.um-metrics b{display:block;font-size:19px;color:var(--primary2)}.um-metrics small{font-size:9px;color:var(--muted)}.um-alerts{display:grid;gap:7px}.um-alert{padding:10px;border:1px solid var(--line);border-right:4px solid #b54708;border-radius:9px;background:#fff;cursor:pointer}.um-alert.danger{border-right-color:#b42318}.um-alert b{display:block;font-size:11px}.um-alert small{display:block;color:var(--muted);font-size:9px;margin-top:3px}.um-alert-empty{text-align:center;color:var(--muted);padding:15px;font-size:11px}@media(max-width:1050px){.um-filter-grid{grid-template-columns:1fr 1fr}}@media(max-width:700px){.um-hero{display:block}.um-add{margin-top:14px}.um-filter-grid{grid-template-columns:1fr}.um-profile-grid{grid-template-columns:1fr}.um-metrics{grid-template-columns:1fr 1fr}}';document.head.appendChild(s)}
injectUserManagementStyle();

window.showPage=async function(name,btn){
 ensurePageShell();
 if(name==='profile'){document.querySelectorAll('[id^="page-"]').forEach(x=>x.classList.add('hidden'));document.getElementById('page-profile')?.classList.remove('hidden');document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));btn?.classList.add('active');const t=document.getElementById('pageTitle');if(t)t.textContent='ملفي الشخصي';await loadProfilePage();return}
 if(name==='users'){if(profile?.role!=='admin')return;document.querySelectorAll('[id^="page-"]').forEach(x=>x.classList.add('hidden'));document.getElementById('page-users')?.classList.remove('hidden');document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));btn?.classList.add('active');const t=document.getElementById('pageTitle');if(t)t.textContent='إدارة المستخدمين';await loadUsersAdmin();return}
 if(name==='project'){const id=new URLSearchParams(location.search).get('project');if(id&&typeof window.viewProject==='function')return window.viewProject(id)}
 document.querySelectorAll('[id^="page-"]').forEach(x=>x.classList.add('hidden'));const target=document.getElementById('page-'+name);if(target)target.classList.remove('hidden');document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));btn?.classList.add('active');
 const titles={dashboard:'الصفحة الرئيسية',projects:'المشاريع',entities:'الجهات الحكومية',companies:'الشركات',reports:'التقارير الربع سنوية',plans:'خطط المحتوى المحلي',followups:'متابعة الموظفين',audit:'سجل التدقيق','local-content':'المحتوى المحلي',settings:'الإعدادات'};const t=document.getElementById('pageTitle');if(t)t.textContent=titles[name]||name;
 if(name==='dashboard'&&window.icvStructure?.renderDashboard)return window.icvStructure.renderDashboard();
 if(name==='projects'&&window.icvStructure?.renderProjects)return window.icvStructure.renderProjects();
 if(name==='local-content'&&window.icvStructure?.renderLocalContent)return window.icvStructure.renderLocalContent();
 if(name==='settings'&&window.icvStructure?.renderSettings)return window.icvStructure.renderSettings();
 if(name==='entities'&&typeof window.icvEntitiesPage==='function')return window.icvEntitiesPage();
 if(name==='companies'&&typeof window.icvCompaniesPage==='function')return window.icvCompaniesPage();
};
async function init(){
 ensurePageShell();
 profile=await getProfile();
 if(profile&&!valid(profile)){await client.auth.signOut();return}
 if(profile)window.__icvProfile=profile;
 applyRoleUI();
}
window.addEventListener('load',()=>setTimeout(init,200));
})();if(!document.getElementById('icv-profile-isolated')){const s=document.createElement('style');s.id='icv-profile-isolated';s.textContent="#page-profile .profile-alerts-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}#page-profile .profile-box{background:#fff;border:1px solid #e4ebe7;border-radius:14px;padding:20px;box-shadow:0 4px 18px rgba(20,45,32,.06)}#page-profile .profile-box.full-profile-box{grid-column:1/-1}#page-profile .profile-box-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #edf1ee}#page-profile .profile-filters{display:flex;gap:6px;flex-wrap:wrap}#page-profile .profile-filters .btn{width:auto;padding:6px 11px;font-size:11px}#page-profile .profile-filters .btn.active{background:var(--primary);color:#fff}#page-profile .icv-profile-list .profile-alert:nth-child(n+6),#page-profile .profile-projects tbody tr:nth-child(n+6){display:none}#page-profile .icv-profile-list.expanded .profile-alert:nth-child(n+6),#page-profile .profile-projects.expanded tbody tr:nth-child(n+6){display:flex}#page-profile .profile-projects.expanded tbody tr:nth-child(n+6){display:table-row}#page-profile .show-all-btn{display:inline-flex;margin:13px auto 0;border:1px solid #d8e4dd;background:#f8fbf9;color:var(--primary);border-radius:9px;padding:8px 18px;font-size:12px;font-weight:800;cursor:pointer}#page-profile .profile-alert{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #eef2ef;min-height:58px}#page-profile .profile-alert>div{flex:1}#page-profile .alert-icon{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;font-size:11px;font-weight:800;flex:none}#page-profile .alert-icon.red{background:#fff0f0;color:#c62828}#page-profile .alert-icon.orange{background:#fff6e8;color:#b76b00}#page-profile .link-btn{border:1px solid #dce7e0;border-radius:8px;padding:7px 10px;background:#fff;color:var(--primary);font-weight:800;cursor:pointer}#page-profile .profile-projects{border:1px solid #edf1ee;border-radius:10px;overflow:auto}#page-profile .profile-projects table{width:100%;border-collapse:collapse}#page-profile .profile-projects th,#page-profile .profile-projects td{padding:11px 9px;border-bottom:1px solid #eef2ef;text-align:right;white-space:nowrap;font-size:11px}#page-profile .table-link{border:0;background:none;color:var(--primary);font-weight:800;cursor:pointer;font:inherit}@media(max-width:900px){#page-profile .profile-alerts-grid{grid-template-columns:1fr}#page-profile .profile-box.full-profile-box{grid-column:auto}}";document.head.appendChild(s)}
