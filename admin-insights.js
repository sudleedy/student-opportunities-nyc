(()=>{'use strict';
const byId=x=>document.getElementById(x);
let db=null;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayDiff=iso=>{
 if(!iso||!/^\d{4}-\d{2}-\d{2}$/.test(iso))return null;
 return Math.floor((Date.now()-Date.parse(iso+'T12:00:00Z'))/86400000);
};
const tiles=[
 ['active','Active programs'],['archived','Archived programs'],['suggestions','Suggestions received'],
 ['approved','Approved suggestions'],['checked','Deadlines reviewed'],['descriptions','Edited descriptions'],
 ['views30','Page loads: last 30 days'],['viewsAll','Page loads: all time']
];
async function load(){
 if(!db)return;
 const message=byId('insights-message');message.textContent='Loading statistics…';
 const results=await Promise.all([
  db.from('catalog_programs').select('program_id,is_archived'),
  db.from('program_suggestions').select('id,review_status').limit(1000),
  db.from('program_updates').select('program_id,verified_at').limit(1000),
  db.from('program_descriptions').select('program_id').limit(1000),
  db.from('site_page_counts').select('day,page_kind,views').order('day',{ascending:false}).limit(1000)
 ]);
 const [catalog,suggestions,dates,descs,traffic]=results;
 const original=window.StudentCatalog?.originalIds||new Set(window.PROGRAMS.map(p=>p.id));
 const archivedCount=(catalog.data||[]).filter(x=>x.is_archived).length;
 const newCount=(catalog.data||[]).filter(x=>!original.has(x.program_id)&&!x.is_archived).length;
 const stats={
  active:original.size+newCount-(catalog.data||[]).filter(x=>original.has(x.program_id)&&x.is_archived).length,
  archived:archivedCount,
  suggestions:suggestions.data?.length??'—',
  approved:suggestions.data?.filter(x=>x.review_status==='Approved').length??'—',
  checked:dates.data?.filter(x=>dayDiff(x.verified_at)!==null&&dayDiff(x.verified_at)<=60).length??'—',
  descriptions:descs.data?.length??'—',
  views30:traffic.data?traffic.data.filter(x=>{const days=dayDiff(x.day);return days!==null&&days>=0&&days<30}).reduce((a,b)=>a+Number(b.views||0),0):'—',
  viewsAll:traffic.data?traffic.data.reduce((a,b)=>a+Number(b.views||0),0):'—'
 };
 byId('insights-summary').innerHTML=tiles.map(([key,label])=>'<div class="stat"><strong>'+esc(stats[key])+'</strong><span>'+esc(label)+'</span></div>').join('');
 const byPage={home:0,program:0,dashboard:0};
 for(const p of traffic.data||[])if(Object.prototype.hasOwnProperty.call(byPage,p.page_kind))byPage[p.page_kind]+=Number(p.views||0);
 byId('insights-detail').innerHTML='<h3>Where visits happen</h3>'+
 '<p>Homepage: '+byPage.home.toLocaleString()+' · Program pages: '+byPage.program.toLocaleString()+' · Student dashboard: '+byPage.dashboard.toLocaleString()+'</p>'+
 '<p class="admin-note">Counts are approximate page loads, not unique visitors. No IPs, identifiers, URLs, or personal profiles are stored. Missing setup or high traffic beyond 1,000 daily records can make counts incomplete.</p>';
 const failed=results.filter(r=>r.error).length;
 message.textContent=failed?'Some statistics are unavailable. Complete the one-time Supabase setup and refresh.':'Latest aggregate metrics loaded.';
}
byId('insights-refresh').addEventListener('click',load);
document.addEventListener('sob-admin-ready',e=>{db=e.detail.db;load()});
})();