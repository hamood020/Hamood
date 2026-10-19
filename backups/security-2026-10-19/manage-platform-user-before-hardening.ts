import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 try{
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer ")) return json({ok:false,error:"جلسة الدخول غير صالحة"});
  const token=auth.replace("Bearer ","");
  const caller=createClient(url,anon,{global:{headers:{Authorization:"Bearer "+token}}});
  const {data:{user},error:ue}=await caller.auth.getUser();
  if(ue||!user) return json({ok:false,error:"تعذر التحقق من جلسة مدير النظام"});
  const admin=createClient(url,service);
  const {data:cp,error:pe}=await admin.from("user_profiles").select("id,role,is_active").eq("id",user.id).maybeSingle();
  if(pe) return json({ok:false,error:"تعذر قراءة صلاحيات الحساب: "+pe.message});
  if(cp?.role!=="admin"||cp?.is_active===false) return json({ok:false,error:"هذه العملية متاحة لمدير النظام فقط"});
  const body=await req.json(),action=String(body.action||"");
  if(action==="create"){
   const username=String(body.username||"").trim().toLowerCase(),display_name=String(body.display_name||"").trim(),password=String(body.password||""),role=String(body.role||"viewer");
   if(!/^[a-z0-9._-]{3,80}$/.test(username)) return json({ok:false,error:"اسم المستخدم يجب أن يحتوي على أحرف إنجليزية أو أرقام أو . _ -"});
   if(password.length<8) return json({ok:false,error:"كلمة المرور يجب ألا تقل عن 8 أحرف"});
   if(!["viewer","editor","admin","temporary_viewer"].includes(role)) return json({ok:false,error:"الدور غير صالح"});
   const {data:nu,error:ne}=await admin.auth.admin.createUser({email:username+"@icv-new.local",password,email_confirm:true,user_metadata:{full_name:display_name,username}});
   if(ne) return json({ok:false,error:"تعذر إنشاء حساب الدخول: "+ne.message});
   if(!nu?.user?.id) return json({ok:false,error:"تم إنشاء الحساب دون معرف مستخدم صالح"});
   const {error:pe2}=await admin.from("user_profiles").upsert({id:nu.user.id,username,full_name:display_name,role,is_active:true,access_starts_at:body.access_starts_at||null,access_expires_at:body.access_expires_at||null},{onConflict:"id"});
   if(pe2){await admin.auth.admin.deleteUser(nu.user.id);return json({ok:false,error:"تعذر إنشاء ملف المستخدم: "+pe2.message});}
   return json({ok:true,user_id:nu.user.id});
  }
  if(action==="update"){
   const user_id=String(body.user_id||""),role=String(body.role||"viewer");
   if(!user_id)return json({ok:false,error:"معرف المستخدم مطلوب"});
   if(!["viewer","editor","admin","temporary_viewer"].includes(role))return json({ok:false,error:"الدور غير صالح"});
   if(user_id===user.id&&role!=="admin")return json({ok:false,error:"لا يمكن إزالة صلاحية مدير النظام من حسابك الحالي"});
   const {error:au}=await admin.auth.admin.updateUserById(user_id,{user_metadata:{full_name:String(body.display_name||"").trim()}});
   if(au)return json({ok:false,error:"تعذر تحديث حساب الدخول: "+au.message});
   const {error:pu}=await admin.from("user_profiles").update({full_name:String(body.display_name||"").trim(),role,is_active:body.is_active!==false,access_starts_at:body.access_starts_at||null,access_expires_at:body.access_expires_at||null}).eq("id",user_id);
   if(pu)return json({ok:false,error:"تعذر تحديث ملف المستخدم: "+pu.message});
   return json({ok:true});
  }
  return json({ok:false,error:"عملية غير معروفة"});
 }catch(e){return json({ok:false,error:e?.message||String(e)});}
});