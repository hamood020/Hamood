/* Additional internal API methods; loaded only by the isolated migration branch. */
(() => {
  if (!window.ICVApi) return;
  const api = window.ICVApi, base="/api";
  const id=v=>encodeURIComponent(String(v));
  async function csrf(){const r=await fetch(base+"/security/csrf",{credentials:"same-origin"});if(!r.ok)throw Error("تعذر تهيئة حماية الطلبات");return (await r.json()).token;}
  async function send(path,method="GET",body){const headers={Accept:"application/json"};let payload=body;if(body instanceof FormData){}else if(body!==undefined)headers["Content-Type"]="application/json";if(!["GET","HEAD"].includes(method))headers["X-CSRF-TOKEN"]=await csrf();if(body!==undefined&&!(body instanceof FormData))payload=JSON.stringify(body);const r=await fetch(base+path,{method,headers,body:payload,credentials:"same-origin"});if(r.status===204)return null;const data=await r.json().catch(()=>null);if(!r.ok)throw Error(data?.error||data?.title||"تعذر تنفيذ الطلب");return data;}
  api.reports.update=(projectId,reportId,data)=>send("/projects/"+id(projectId)+"/reports/"+id(reportId),"PUT",data);
  api.reports.upload=async(reportId,file)=>{const form=new FormData();form.append("file",file);return send("/files/reports/"+id(reportId),"POST",form);};
  api.reports.downloadUrl=(reportId,fileName)=>base+"/files/"+id(reportId)+"/"+encodeURIComponent(fileName);
  api.entities={list:()=>send("/entities"),create:data=>send("/entities","POST",data),update:(entityId,data)=>send("/entities/"+id(entityId),"PUT",data)};
  api.companies={list:()=>send("/companies"),create:data=>send("/companies","POST",data),update:(companyId,data)=>send("/companies/"+id(companyId),"PUT",data)};
  api.plans={list:projectId=>send("/projects/"+id(projectId)+"/plans"),create:(projectId,data)=>send("/projects/"+id(projectId)+"/plans","POST",data),update:(planId,data)=>send("/plans/"+id(planId),"PUT",data)};
  api.notes={list:projectId=>send("/projects/"+id(projectId)+"/notes"),create:(projectId,data)=>send("/projects/"+id(projectId)+"/notes","POST",data),update:(noteId,data)=>send("/notes/"+id(noteId),"PUT",data)};
})();
