/* Published admin deadline edits. Static catalog remains available if Supabase is offline. */
(()=>{'use strict';
const cfg=window.SOB_AUTH_CONFIG||{},items=window.PROGRAMS||[];
const ready=(async()=>{
 if(!cfg.supabaseUrl||!cfg.publishableKey)return;
 try{
  const url=cfg.supabaseUrl+'/rest/v1/program_updates?select=program_id,deadline_text,deadline_iso,status_text,review_note,verified_at';
  const response=await fetch(url,{headers:{apikey:cfg.publishableKey,Accept:'application/json'}});
  if(!response.ok)throw new Error('Deadline updates unavailable (HTTP '+response.status+')');
  const data=await response.json();
  if(!Array.isArray(data))throw new Error('Unexpected timeline response');
  const byId=new Map(items.map(p=>[p.id,p]));
  for(const row of data){
   const program=byId.get(row.program_id);if(!program)continue;
   program.deadline=row.deadline_text;
   program.deadlineISO=row.deadline_iso;
   program.status=row.status_text;
   program.deadlineNote=row.review_note||'Deadline reviewed by Student Opportunities NYC; confirm details on organizer website.';
   program.verified=row.verified_at;
  }
  document.dispatchEvent(new Event('sob-programs-updated'));
 }catch(err){
  console.warn('Using catalog deadlines until live updates are available.',err);
 }
})();
window.ProgramUpdates={ready};
})();