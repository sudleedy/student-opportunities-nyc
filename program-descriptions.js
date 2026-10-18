/* Public, read-only description overrides. Falls back to the bundled catalog. */
(()=>{'use strict';
const cfg=window.SOB_AUTH_CONFIG||{},items=window.PROGRAMS||[];
const ready=(async()=>{
 if(!cfg.supabaseUrl||!cfg.publishableKey)return;
 try{
  const url=cfg.supabaseUrl+'/rest/v1/program_descriptions?select=program_id,summary_text,details_text';
  const response=await fetch(url,{headers:{apikey:cfg.publishableKey,Accept:'application/json'}});
  if(!response.ok)throw new Error('Program descriptions unavailable (HTTP '+response.status+')');
  const rows=await response.json();
  if(!Array.isArray(rows))throw new Error('Unexpected description response');
  const byId=new Map(items.map(p=>[p.id,p]));
  for(const row of rows){
   const program=byId.get(row.program_id);
   if(!program)continue;
   if(typeof row.summary_text==='string'&&row.summary_text.trim())program.summary=row.summary_text;
   if(typeof row.details_text==='string'&&row.details_text.trim())program.details=row.details_text;
  }
  document.dispatchEvent(new Event('sob-programs-updated'));
 }catch(error){
  console.warn('Using original catalog descriptions until admin description updates are available.',error);
 }
})();
window.ProgramDescriptions={ready};
})();