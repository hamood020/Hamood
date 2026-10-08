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

function ensurePageShell(){
 const main=document.querySelector('.main'); if(!main)return;
 if(!document.getElementById('page-profile')){
   const p=document.createElement('div');p.id='page-profile';p.className='hidden';
   p.innerHTML='<div id="accessProfileSummary" class="cards"></div><div class="panel"><div class="toolbar"><div><h2>جهات المتابعة</h2><div class="muted">حدد الجهات التي تتابعها. ستنعكس مباشرة على المشاريع والتقارير الظاهرة لك.</div></div><button class="btn primary" style="width:auto" onclick="openMyEntitySelection()">تعديل جهات المتابعة</button></div><div id="accessProfileEntities" class="empty">جاري التحميل...</div></div><div class="panel"><h2>صلاحيات الحساب</h2><div id="accessProfilePermissions"></div></div>';
   main.appendChild(p);
 }
 if(!document.getElementById('page-users')){
   const p=document.createElement('div');p.id='page-users';p.className='hidden';
   p.innerHTML='<div class="um-wrap"><div class="um-hero"><div><div class="um-crumb">إدارة النظام / المستخدمون</div><h2>إدارة المستخدمين</h2><p>إدارة حسابات الموظفين والأدوار وفترات الصلاحية والجهات المسندة إليهم.</p></div><button class="btn primary um-add" onclick="openUserForm()">＋ إضافة مستخدم</button></div><div class="um-filters panel"><div class="um-filter-grid"><div class="field"><label>اسم المستخدم</label><input id="usersSearch" placeholder="مثال: user01" oninput="filterAdminUsers()"></div><div class="field"><label>الاسم</label><input id="usersNameFilter" placeholder="ابحث بالاسم" oninput="filterAdminUsers()"></div><div class="field"><label>الدور</label><select id="usersRoleFilter" onchange="filterAdminUsers()"><option value="">الكل</option><option value="admin">مدير النظام</option><option value="editor">محرر</option><option value="viewer">مشاهد</option><option value="temporary_viewer">مشاهد مؤقت</option></select></div><div class="field"><label>الحالة</label><select id="usersStatusFilter" onchange="filterAdminUsers()"><option value="">الكل</option><option value="active">فعال</option><option value="inactive">غير فعال</option></select></div><div class="field"><label>الجهة المسندة</label><select id="usersEntityFilter" onchange="filterAdminUsers()"><option value="">كل الجهات</option></select></div></div></div><div class="panel um-table-panel"><div class="um-table-head"><div><h3>قائمة المستخدمين</h3><div id="usersAdminCount" class="muted"></div></div><button class="btn" onclick="loadUsersAdmin()">تحديث</button></div><div id="usersAdminBox" class="empty">جاري التحميل...</div></div></div>';
   main.appendChild(p);
 }
 const nav=document.querySelector('.nav');
 if(nav&&!document.getElementById('userProfileNav')){
   const b=document.createElement('button');b.id='userProfileNav';b.dataset.page='profile';b.onclick=function(){window.showPage('profile',this)};b.innerHTML='<span class="ico">◉</span><span>ملفي الشخصي</span>';nav.appendChild(b);
 }
 if(nav&&!document.getElementById('userAdminNav')){
   const b=document.createElement('button');b.id='userAdminNav';b.dataset.page='users';b.className='hidden';b.onclick=function(){window.showPage('users',this)};b.innerHTML='<span class="ico">⚙</span><span>إدارة المستخدمين</span>';nav.appendChild(b);
 }
}
async function loadProfilePage(){
 if(!profile)await getProfile();
 const uid=profile?.id; if(!uid)return;
 const [a,e]=await Promise.all([
   client.from('user_entity_assignments_view').select('*').eq('user_id',uid).order('government_entity'),
   client.from('government_entities').select('id,name,code').order('name')
 ]);
 const projectsR=await client.from('projects').select('id,government_entity_id');
 const assigned=(a.data||[]);
 const pids=(projectsR.data||[]).filter(p=>assigned.some(x=>x.government_entity_id===p.government_entity_id)).length;
 document.getElementById('accessProfileSummary').innerHTML=[
   ['اسم الموظف',profile.full_name||profile.username||'—'],
   ['الدور',roleLabel[profile.role]||profile.role],
   ['الجهات المخصصة',assigned.length],
   ['المشاريع التابعة',pids]
 ].map(x=>'<div class="card"><div class="label">'+escA(x[0])+'</div><div class="value" style="font-size:18px">'+escA(x[1])+'</div></div>').join('');
 document.getElementById('accessProfileEntities').innerHTML=assigned.length?'<table><thead><tr><th>الجهة</th><th>الرمز</th></tr></thead><tbody>'+assigned.map(x=>'<tr><td>'+escA(x.government_entity)+'</td><td>'+escA(x.code||'—')+'</td></tr>').join('')+'</tbody></table>':'<div class="empty">لم يتم تخصيص جهات لهذا الحساب بعد.</div>';
 document.getElementById('accessProfilePermissions').innerHTML='<div class="metric"><span>الدور</span><b>'+escA(roleLabel[profile.role]||profile.role)+'</b></div><div class="metric"><span>الحساب</span><b class="'+(profile.is_active?'ok':'bad')+'">'+(profile.is_active?'نشط':'غير نشط')+'</b></div><div class="metric"><span>بداية الصلاحية</span><b>'+escA(profile.access_starts_at?new Date(profile.access_starts_at).toLocaleString('ar-OM'):'بدون حد')+'</b></div><div class="metric"><span>نهاية الصلاحية</span><b>'+escA(profile.access_expires_at?new Date(profile.access_expires_at).toLocaleString('ar-OM'):'بدون حد')+'</b></div>';
}
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
 const box=document.getElementById('usersAdminBox'); if(!box)return; box.innerHTML='جاري التحميل...';
 const r=await client.from('user_management').select('*').order('display_name');
 if(r.error){box.innerHTML='<div class="bad">'+escA(r.error.message)+'</div>';return}
 if(!r.data?.length){box.innerHTML='<div class="empty">لا يوجد مستخدمون.</div>';return}
 window.__icvAdminUsers=r.data||[];const count=document.getElementById('usersAdminCount');if(count)count.textContent='إجمالي المستخدمين: '+window.__icvAdminUsers.length;box.innerHTML='<div class="table-wrap"><table><thead><tr><th>الموظف</th><th>اسم المستخدم</th><th>الدور</th><th>الحالة</th><th>الجهات</th><th>بداية الصلاحية</th><th>نهاية الصلاحية</th><th>إجراء</th></tr></thead><tbody>'+window.__icvAdminUsers.map(u=>'<tr data-user-row data-role="'+escA(u.role||'')+'" data-active="'+(u.is_active?'1':'0')+'"><td><b>'+escA(u.display_name||'—')+'</b></td><td>'+escA(u.username||'—')+'</td><td>'+escA(roleLabel[u.role]||u.role)+'</td><td><span class="'+(u.access_status==='نشط'?'ok':'warn')+'">'+escA(u.access_status||'—')+'</span></td><td>'+Number(u.assigned_entities||0)+'</td><td>'+escA(u.access_starts_at?new Date(u.access_starts_at).toLocaleDateString('ar-OM'):'بدون حد')+'</td><td>'+escA(u.access_expires_at?new Date(u.access_expires_at).toLocaleDateString('ar-OM'):'بدون نهاية')+'</td><td><button class="btn" onclick="openUserFormById(\''+u.user_id+'\')">تعديل</button> <button class="btn" onclick="openEntityAssignment(\''+u.user_id+'\',\''+escA(u.display_name||u.username)+'\')">الجهات</button></td></tr>').join('')+'</tbody></table></div>';filterAdminUsers();
};
window.filterAdminUsers=()=>{const q=(document.getElementById('usersSearch')?.value||'').trim().toLowerCase(),n=(document.getElementById('usersNameFilter')?.value||'').trim().toLowerCase(),role=document.getElementById('usersRoleFilter')?.value||'',status=document.getElementById('usersStatusFilter')?.value||'',entity=document.getElementById('usersEntityFilter')?.value||'';let shown=0;document.querySelectorAll('#usersAdminBox [data-user-row]').forEach(row=>{const hit=!q||row.textContent.toLowerCase().includes(q),nhit=!n||row.dataset.name.toLowerCase().includes(n),rhit=!role||row.dataset.role===role,shit=!status||(status==='active'?row.dataset.active==='1':row.dataset.active!=='1'),ehit=!entity||row.dataset.entities.split(',').includes(entity);row.style.display=hit&&nhit&&rhit&&shit&&ehit?'':'none';if(hit&&nhit&&rhit&&shit&&ehit)shown++});const c=document.getElementById('usersAdminCount');if(c)c.textContent='المستخدمون المعروضون: '+shown+' من '+(window.__icvAdminUsers||[]).length};
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

function injectUserManagementStyle(){if(document.getElementById('um-style'))return;const s=document.createElement('style');s.id='um-style';s.textContent='.um-wrap{min-width:0}.um-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;background:linear-gradient(135deg,var(--primary2),var(--primary));color:#fff;border-radius:18px;padding:22px;margin-bottom:16px}.um-crumb{font-size:10px;opacity:.7;margin-bottom:5px}.um-hero h2{margin:0 0 5px;font-size:22px}.um-hero p{margin:0;opacity:.82;font-size:11px}.um-add{background:#fff!important;color:var(--primary2)!important;border-color:#fff!important}.um-filter-grid{display:grid;grid-template-columns:1.3fr 1.3fr 1fr 1fr 1.3fr;gap:10px}.um-table-panel{padding:0;overflow:hidden}.um-table-head{padding:16px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line)}.um-table-head h3{margin:0;font-size:15px}.um-table{width:100%;border-collapse:collapse}.um-table th,.um-table td{padding:12px 13px;border-bottom:1px solid var(--line);text-align:right;font-size:11px;white-space:nowrap}.um-table th{font-size:10px;color:var(--muted);background:#fafbfc}.um-user{display:flex;align-items:center;gap:9px}.um-user small{display:block;color:var(--muted);font-size:9px;margin-top:2px}.um-avatar{width:34px;height:34px;border-radius:9px;background:var(--soft);color:var(--primary2);display:grid;place-items:center;font-weight:900}.um-badge{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:800}.um-badge.active{background:#eaf7ef;color:#087443}.um-badge.inactive{background:#f1f3f5;color:#667085}.um-badge.role-admin{background:#eaf2ff;color:#245ea8}.um-badge.role-editor{background:#eaf7ef;color:#087443}.um-badge.role-viewer{background:#f1f3f5;color:#667085}.um-badge.role-temporary_viewer{background:#fff4e5;color:#b54708}.um-entity-count{display:inline-grid;place-items:center;min-width:27px;height:27px;border-radius:8px;background:var(--soft);color:var(--primary2);font-weight:900}.um-actions{display:flex;gap:4px}.icon-btn{border:1px solid var(--line);background:#fff;border-radius:7px;padding:6px 8px;cursor:pointer}.icon-btn:hover{background:var(--soft)}@media(max-width:1050px){.um-filter-grid{grid-template-columns:1fr 1fr}}@media(max-width:700px){.um-hero{display:block}.um-add{margin-top:14px}.um-filter-grid{grid-template-columns:1fr}}';document.head.appendChild(s)}
injectUserManagementStyle();
window.showPage=async function(name,btn){
 ensurePageShell();
 if(name==='users'&&profile?.role!=='admin')return;
 document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');
 document.querySelectorAll('[id^="page-"]').forEach(x=>x.classList.add('hidden'));
 const target=document.getElementById('page-'+name);if(target)target.classList.remove('hidden');
 const titles={dashboard:'لوحة التحكم',projects:'المشاريع',entities:'الجهات الحكومية',companies:'الشركات',reports:'التقارير الربع سنوية',plans:'خطط المحتوى المحلي',followups:'متابعة الموظفين',audit:'سجل التدقيق',profile:'ملفي الشخصي',users:'إدارة المستخدمين'};
 const title=document.getElementById('pageTitle');if(title)title.textContent=titles[name]||name;
 if(name==='profile')await loadProfilePage();
 if(name==='users')await loadUsersAdmin();
 if(typeof originalShowPage==='function'&&['dashboard','projects','entities','companies','reports','plans','followups','audit'].includes(name)){
   originalShowPage(name,btn);
   ensurePageShell();
   if(name==='dashboard')setTimeout(applyRoleUI,50);
 }
 applyRoleUI();
};
async function init(){
 ensurePageShell();
 profile=await getProfile();
 if(profile&&!valid(profile)){await client.auth.signOut();return}
 if(profile)window.__icvProfile=profile;
 applyRoleUI();
}
window.addEventListener('load',()=>setTimeout(init,200));
})()async function loadUsersAdmin(){
 if(profile?.role!=='admin')return;
 const box=document.getElementById('usersAdminBox'); if(!box)return; box.innerHTML='جاري التحميل...';
 const [r,er]=await Promise.all([
   client.from('user_management').select('*').order('display_name'),
   client.from('government_entities').select('id,name').order('name')
 ]);
 if(r.error){box.innerHTML='<div class="bad">'+escA(r.error.message)+'</div>';return}
 window.__icvAdminUsers=r.data||[];
 const ef=document.getElementById('usersEntityFilter');
 if(ef)ef.innerHTML='<option value="">كل الجهات</option>'+((er.data||[]).map(e=>'<option value="'+escA(e.id)+'">'+escA(e.name)+'</option>').join(''));
 const count=document.getElementById('usersAdminCount');if(count)count.textContent='إجمالي المستخدمين: '+window.__icvAdminUsers.length;
 if(!window.__icvAdminUsers.length){box.innerHTML='<div class="empty">لا يوجد مستخدمون.</div>';return}
 box.innerHTML='<div class="table-wrap"><table class="um-table"><thead><tr><th>المستخدم</th><th>الاسم</th><th>الدور</th><th>الحالة</th><th>الصلاحية</th><th>الجهات المسندة</th><th>بداية الصلاحية</th><th>نهاية الصلاحية</th><th>إجراءات</th></tr></thead><tbody>'+window.__icvAdminUsers.map(u=>'<tr data-user-row data-role="'+escA(u.role||'')+'" data-active="'+(u.is_active?'1':'0')+'" data-name="'+escA(u.display_name||'')+'" data-entities="'+escA(u.assigned_entity_ids||'')+'"><td><div class="um-user"><span class="um-avatar">'+escA((u.display_name||u.username||'?').trim().split(/\\s+/).slice(0,2).map(x=>x[0]).join(''))+'</span><div><b>'+escA(u.username||'—')+'</b><small>حساب مستخدم</small></div></div></td><td><b>'+escA(u.display_name||'—')+'</b></td><td><span class="um-badge role-'+escA(u.role||'viewer')+'">'+escA(roleLabel[u.role]||u.role||'مشاهد')+'</span></td><td><span class="um-badge '+(u.is_active?'active':'inactive')+'">'+(u.is_active?'فعال':'غير فعال')+'</span></td><td>'+escA(roleLabel[u.role]||u.role||'مشاهد')+'</td><td><span class="um-entity-count">'+Number(u.assigned_entities||0)+'</span></td><td>'+escA(u.access_starts_at?new Date(u.access_starts_at).toLocaleDateString('ar-OM'):'بدون حد')+'</td><td>'+escA(u.access_expires_at?new Date(u.access_expires_at).toLocaleDateString('ar-OM'):'بدون نهاية')+'</td><td><div class="um-actions"><button class="icon-btn" title="الملف الشخصي" onclick="openUserProfile(\''+u.user_id+'\')">👤</button><button class="icon-btn" title="تعديل" onclick="openUserFormById(\''+u.user_id+'\')">✎</button><button class="icon-btn" title="الجهات" onclick="openEntityAssignment(\''+u.user_id+'\',\''+escA(u.display_name||u.username)+'\')">🏛</button></div></td></tr>').join('')+'</tbody></table></div>';
 filterAdminUsers();
}
window.filterAdminUsers=()=>{const q=(document.getElementById('usersSearch')?.value||'').trim().toLowerCase(),role=document.getElementById('usersRoleFilter')?.value||'',status=document.getElementById('usersStatusFilter')?.value||'';let shown=0;document.querySelectorAll('#usersAdminBox [data-user-row]').forEach(row=>{const hit=!q||row.textContent.toLowerCase().includes(q),rhit=!role||row.dataset.role===role,shit=!status||(status==='active'?row.dataset.active==='1':row.dataset.active!=='1');row.style.display=hit&&rhit&&shit?'':'none';if(hit&&rhit&&shit)shown++});const c=document.getElementById('usersAdminCount');if(c)c.textContent='المستخدمون المعروضون: '+shown+' من '+(window.__icvAdminUsers||[]).length};
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

window.showPage=async function(name,btn){
 ensurePageShell();
 if(name==='users'&&profile?.role!=='admin')return;
 document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');
 document.querySelectorAll('[id^="page-"]').forEach(x=>x.classList.add('hidden'));
 const target=document.getElementById('page-'+name);if(target)target.classList.remove('hidden');
 const titles={dashboard:'لوحة التحكم',projects:'المشاريع',entities:'الجهات الحكومية',companies:'الشركات',reports:'التقارير الربع سنوية',plans:'خطط المحتوى المحلي',followups:'متابعة الموظفين',audit:'سجل التدقيق',profile:'ملفي الشخصي',users:'إدارة المستخدمين'};
 const title=document.getElementById('pageTitle');if(title)title.textContent=titles[name]||name;
 if(name==='profile')await loadProfilePage();
 if(name==='users')await loadUsersAdmin();
 if(typeof originalShowPage==='function'&&['dashboard','projects','entities','companies','reports','plans','followups','audit'].includes(name)){
   originalShowPage(name,btn);
   ensurePageShell();
   if(name==='dashboard')setTimeout(applyRoleUI,50);
 }
 applyRoleUI();
};
async function init(){
 ensurePageShell();
 profile=await getProfile();
 if(profile&&!valid(profile)){await client.auth.signOut();return}
 if(profile)window.__icvProfile=profile;
 applyRoleUI();
}
window.addEventListener('load',()=>setTimeout(init,200));
})();