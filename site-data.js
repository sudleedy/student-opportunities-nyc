/* Public catalog overlays. Bundled data remains usable when network/setup is unavailable. */
(()=>{'use strict';
const items=window.PROGRAMS||[],config=window.SOB_AUTH_CONFIG||{};
const existing=new Set(items.map(p=>p.id)),fields=[
 'title','org','type','subject','location','summary','details','eligibility','deadline',
 'deadlineISO','deadlineNote','status','cost','commitment','preparation','url',
 'verified','applicationNote','grades','costCategory','payCategory','deliveryMode','applicationState'
];
const byId=new Map(items.map(p=>[p.id,p]));
const originals=new Map(items.map(p=>[p.id,JSON.parse(JSON.stringify(p))]));
let online=false;
function isValid(row){
 return row&&typeof row.program_id==='string'&&/^[a-z0-9][a-z0-9-]{2,119}$/.test(row.program_id);
}
function merge(row){
 if(!isValid(row))return;
 let p=byId.get(row.program_id);
 if(row.is_archived){
  if(p){const n=items.indexOf(p);if(n>=0)items.splice(n,1)}
  byId.delete(row.program_id);return;
 }
 if(!p){p={id:row.program_id};items.push(p);byId.set(row.program_id,p)}
 const data=row.program_data||{};
 for(const name of fields){
  if(Object.prototype.hasOwnProperty.call(data,name)){
   const value=data[name];
   if(name==='grades'){if(Array.isArray(value))p.grades=value.map(Number).filter(n=>Number.isInteger(n)&&n>=9&&n<=12)}
   else if(name==='deadlineISO'){p[name]=/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?value:null}
   else if(typeof value==='string')p[name]=value.slice(0,5000);
  }
 }
 p._managed=true;
}
const ready=(async()=>{
 if(!config.supabaseUrl||!config.publishableKey){document.dispatchEvent(new Event('sob-catalog-ready'));return}
 try{
  const resp=await fetch(config.supabaseUrl+'/rest/v1/catalog_programs?select=program_id,program_data,is_archived&limit=1000',
   {headers:{apikey:config.publishableKey,Accept:'application/json'}});
  if(!resp.ok)throw new Error('Catalog service unavailable');
  const rows=await resp.json();
  if(!Array.isArray(rows))throw new Error('Invalid catalog data');
  for(const row of rows)merge(row);
  online=true;
 }catch(e){console.info('Using bundled opportunity directory until dynamic catalog becomes available.')}
 document.dispatchEvent(new Event('sob-catalog-ready'));
 document.dispatchEvent(new Event('sob-programs-updated'));
})();
window.StudentCatalog={ready,items,originalIds:existing,originals,isOnline:()=>online};
})();