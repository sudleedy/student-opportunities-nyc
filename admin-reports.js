(()=>{'use strict';
const el=id=>document.getElementById(id);
const notice=el('admin-notice'),dashboard=el('dashboard'),message=el('admin-message');
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null,rows=[];
const choices=['Pending','In Progress','Resolved'];
function safePage(url){
 try{const u=new URL(url);if(u.origin===location.origin&&u.pathname.startsWith(new URL('./',location.href).pathname))return u.href}catch{}
 return null;
}
function render(){
 for(const status of choices){const id=status==='In Progress'?'progress':status.toLowerCase();el(id).textContent=rows.filter(r=>r.status===status).length}
 el('total').textContent=rows.length;
 const category=el('category-filter').value,status=el('status-filter').value;
 const subset=rows.filter(r=>(!status||r.status===status)&&(!category||r.category===category));
 el('reports').innerHTML=subset.length?subset.map(r=>{
  const page=safePage(r.page_url);
  const date=r.created_at?new Date(r.created_at).toLocaleString():'Date unavailable';
  return '<article class="report" data-report-id="'+safe(r.id)+'"><div class="report-top"><span class="tag">'+safe(r.category)+'</span><span class="when">'+safe(date)+'</span></div>'+
   '<h2>'+safe(r.program_id?'Program: '+r.program_id.replace(/-/g,' '):'Website feedback')+'</h2>'+
   '<div class="report-body">'+safe(r.details)+'</div>'+
   '<div class="report-meta">'+(page?'<a href="'+safe(page)+'" target="_blank" rel="noopener noreferrer">Open reported page ↗</a>':'Page information unavailable')+'</div>'+
   '<div class="report-actions"><label for="report-status-'+safe(r.id)+'">Status</label><select id="report-status-'+safe(r.id)+'" class="report-status" aria-label="Report status">'+choices.map(s=>'<option'+(r.status===s?' selected':'')+'>'+safe(s)+'</option>').join('')+'</select><button type="button" class="save-status">Save status</button><button type="button" class="delete-report" aria-label="Permanently delete report '+safe(r.id)+'">Delete report</button><span class="report-feedback" role="status"></span></div></article>';
 }).join(''):'<div class="notice">No reports match these filters.</div>';
}
function refreshCategories(){
 const options=[...new Set(rows.map(r=>r.category))].sort();
 const sel=el('category-filter'),prior=sel.value;
 sel.innerHTML='<option value="">All categories</option>'+options.map(v=>'<option>'+safe(v)+'</option>').join('');
 sel.value=options.includes(prior)?prior:'';
}
async function load(){
 message.textContent='Loading reports…';
 const {data,error}=await db.from('student_reports').select('id,category,details,program_id,page_url,created_at,status').order('created_at',{ascending:false}).limit(250);
 if(error){message.textContent='Could not load reports. Check Supabase policies and refresh.';return}
 rows=data||[];
 refreshCategories();
 message.textContent=rows.length===250?'Showing the latest 250 reports.':'Showing '+rows.length+' report'+(rows.length===1?'':'s')+'.';
 render();
}
async function start(){
 try{
  if(!window.supabase||!window.SOB_AUTH_CONFIG?.supabaseUrl)throw Error('Missing setup');
  db=window.supabase.createClient(window.SOB_AUTH_CONFIG.supabaseUrl,window.SOB_AUTH_CONFIG.publishableKey);
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user){notice.textContent='Sign in on the homepage with your administrator Google account, then return to this page.';return}
  const {data:allowed,error}=await db.rpc('is_report_admin');
  if(error){notice.textContent='Dashboard setup is incomplete. Run supabase-admin-setup.sql in the Supabase SQL Editor, then authorize your administrator account.';return}
  if(!allowed){notice.textContent='Access restricted. This account is not authorized to view student reports.';return}
  notice.hidden=true;dashboard.hidden=false;
  if(window.StudentCatalog)await window.StudentCatalog.ready;
  document.dispatchEvent(new CustomEvent('sob-admin-ready',{detail:{db}}));
  await load();
 }catch(e){console.error('Admin dashboard',e);notice.textContent='Unable to load administrator tools. Please refresh and check your connection.'}
}
el('reports').addEventListener('click',async e=>{
 const button=e.target.closest('button.save-status');if(!button||!db)return;
 const card=button.closest('[data-report-id]'),id=Number(card.dataset.reportId),selection=card.querySelector('select.report-status'),feedback=card.querySelector('.report-feedback');
 if(!choices.includes(selection.value)||!Number.isSafeInteger(id))return;
 button.disabled=true;feedback.textContent='Saving…';
 const {data,error}=await db.from('student_reports').update({status:selection.value}).eq('id',id).select('id,status').single();
 if(error){feedback.textContent='Could not update status. Please try again.'}
 else{const row=rows.find(r=>r.id===id);if(row)row.status=data.status;render();const fresh=el('reports').querySelector('[data-report-id="'+id+'"] .report-feedback');if(fresh)fresh.textContent='Saved.'}
 button.disabled=false;
});
el('reports').addEventListener('click',async e=>{
 const button=e.target.closest('button.delete-report');
 if(!button||!db)return;
 const card=button.closest('[data-report-id]');
 if(!card)return;
 const id=Number(card.dataset.reportId),report=rows.find(r=>r.id===id);
 if(!Number.isSafeInteger(id)||!report)return;
 const context=report.program_id?' for '+report.program_id.replace(/-/g,' '):'';
 const confirmed=window.confirm('Permanently delete this '+report.category+' report'+context+'?\n\nThis action cannot be undone.');
 if(!confirmed)return;
 const buttons=card.querySelectorAll('button');
 buttons.forEach(b=>b.disabled=true);
 const feedback=card.querySelector('.report-feedback');
 feedback.textContent='Deleting…';
 const {data,error}=await db.from('student_reports').delete().eq('id',id).select('id');
 if(error||!data||data.length!==1){
  feedback.textContent='Could not delete this report. Check admin permissions and try again.';
  buttons.forEach(b=>b.disabled=false);
  return;
 }
 rows=rows.filter(r=>r.id!==id);
 refreshCategories();
 render();
 message.textContent='Report #'+id+' permanently deleted. '+rows.length+' report'+(rows.length===1?'':'s')+' remaining in the current list.';
});
el('status-filter').addEventListener('change',render);
el('category-filter').addEventListener('change',render);
el('refresh').addEventListener('click',load);
start();
})();