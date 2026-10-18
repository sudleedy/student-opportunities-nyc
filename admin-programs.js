/* Administrator timeline editor. All writes use Supabase RLS-backed admin privileges. */
(()=>{'use strict';
const el=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const programs=window.PROGRAMS||[],byId=new Map(programs.map(p=>[p.id,p]));
const overrides=new Map();
const message=el('timeline-message'),list=el('timeline-list');
const filters={search:el('timeline-search'),type:el('timeline-filter')};
let db=null,page=1,initialized=false;
const PAGE_SIZE=10;
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const dateDays=iso=>{
 if(!iso)return null;
 const t=Date.parse(iso+'T12:00:00Z');if(!Number.isFinite(t))return null;
 const now=Date.parse(today()+'T12:00:00Z');return Math.round((t-now)/86400000);
};
const reviewAge=iso=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return Infinity;
 return Math.floor((Date.parse(today()+'T12:00:00Z')-Date.parse(iso+'T12:00:00Z'))/86400000);
};
function fields(p){
 const r=overrides.get(p.id)||{};
 return {date:r.deadline_iso??p.deadlineISO??'',deadline:r.deadline_text??p.deadline,
  status:r.status_text??p.status,note:r.review_note??p.deadlineNote??'',reviewed:r.verified_at??p.verified??'',
  modified:r.updated_at??null,edited:overrides.has(p.id)};
}
function flags(p){
 const f=fields(p),days=dateDays(f.date);
 return {days,soon:days!==null&&days>=0&&days<=30,overdue:days!==null&&days<0,
  unknown:days===null,review:reviewAge(f.reviewed)>=60};
}
function statusTags(p){
 const t=flags(p),items=[];
 if(t.soon)items.push('<span class="timeline-tag urgent">Due '+(t.days===0?'today':'in '+t.days+' days')+'</span>');
 if(t.overdue)items.push('<span class="timeline-tag expired">Date passed</span>');
 if(t.unknown)items.push('<span class="timeline-tag">Date unconfirmed</span>');
 if(t.review)items.push('<span class="timeline-tag urgent">Needs review</span>');
 if(!t.review&&t.days!==null&&t.days>30)items.push('<span class="timeline-tag">Upcoming deadline</span>');
 return items.join('');
}
function summary(){
 const values=programs.map(flags);
 el('deadline-soon').textContent=values.filter(f=>f.soon).length;
 el('deadline-passed').textContent=values.filter(f=>f.overdue).length;
 el('deadline-unknown').textContent=values.filter(f=>f.unknown).length;
 el('deadline-review').textContent=values.filter(f=>f.review).length;
}
function order(p){
 const f=flags(p);
 if(f.soon)return [0,f.days];
 if(f.days!==null&&f.days>30)return [1,f.days];
 if(f.overdue)return [2,-f.days];
 if(f.review)return [3,0];
 return [4,0];
}
function render(){
 summary();
 const q=filters.search.value.trim().toLowerCase(),which=filters.type.value;
 const rows=programs.filter(p=>{
  const f=flags(p);
  return (!q||[p.title,p.org,p.type,p.subject].join(' ').toLowerCase().includes(q))&&
   (!which||Boolean(f[which]));
 }).sort((a,b)=>{const x=order(a),y=order(b);return x[0]-y[0]||x[1]-y[1]||a.title.localeCompare(b.title)});
 const isFiltered=Boolean(q||which);
 message.textContent=isFiltered
  ? 'Showing '+rows.length+' of '+programs.length+' catalog programs matching your selection. Admin edits are published immediately.'
  : 'Showing all '+programs.length+' catalog programs. Admin edits are published immediately.';
 const max=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
 page=Math.min(page,max);
 const visible=rows.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 list.innerHTML=visible.length?visible.map(p=>{
  const f=fields(p);
  return '<article class="timeline-card"><div class="timeline-head"><div><h3>'+safe(p.title)+'</h3><p>'+safe(p.org)+' · '+safe(p.subject)+'</p></div><div class="timeline-tags">'+statusTags(p)+'</div></div>'+
  '<form class="timeline-edit" data-id="'+safe(p.id)+'"><div class="timeline-fields">'+
  '<div><label for="date-'+safe(p.id)+'">Known deadline date</label><input id="date-'+safe(p.id)+'" name="deadline_iso" type="date" value="'+safe(f.date)+'"></div>'+
  '<div><label for="status-'+safe(p.id)+'">Application status shown to students</label><input id="status-'+safe(p.id)+'" name="status_text" type="text" maxlength="180" required value="'+safe(f.status)+'"></div>'+
  '<div class="wide"><label for="deadline-'+safe(p.id)+'">Deadline wording shown to students</label><input id="deadline-'+safe(p.id)+'" name="deadline_text" type="text" maxlength="240" required value="'+safe(f.deadline)+'"></div>'+
  '<div class="wide"><label for="note-'+safe(p.id)+'">Verification / deadline note</label><textarea id="note-'+safe(p.id)+'" name="review_note" maxlength="500" rows="2">'+safe(f.note)+'</textarea></div>'+
  '</div><div class="timeline-actions"><button type="submit">Save & mark reviewed</button>'+
  (f.edited?'<button type="button" class="reset">Restore catalog dates</button>':'')+
  '<a href="'+safe(p.url)+'" rel="noopener noreferrer" target="_blank">Check official source ↗</a>'+
  '<span class="timeline-feedback" role="status"></span></div>'+
  '<p class="timeline-note">Last reviewed: '+safe(f.reviewed||'Not recorded')+(f.edited?' · Edited in admin dashboard':' · Original catalog entry')+'</p></form></article>';
 }).join(''):'<div class="notice">No programs match that search or filter.</div>';
 el('timeline-pager').innerHTML=max>1?
  '<button type="button" data-page="'+(page-1)+'" '+(page===1?'disabled':'')+'>← Previous</button>'+
  '<span>Page '+page+' of '+max+' ('+rows.length+' programs)</span>'+
  '<button type="button" data-page="'+(page+1)+'" '+(page===max?'disabled':'')+'>Next →</button>':
  '<span>'+rows.length+' program'+(rows.length===1?'':'s')+'</span>';
}
async function load(){
 if(!db)return;
 message.textContent='Loading published timeline edits…';
 const {data,error}=await db.from('program_updates').select('program_id,deadline_text,deadline_iso,status_text,review_note,verified_at,updated_at').limit(500);
 if(error){message.textContent='Timeline database not ready. Run supabase-program-timelines.sql in the Supabase SQL Editor, then click Refresh dates.';return}
 overrides.clear();for(const entry of data||[])overrides.set(entry.program_id,entry);
 render();
}
async function save(form){
 if(!db)return;
 const id=form.dataset.id,p=byId.get(id)||programs.find(o=>o.id===id),feedback=form.querySelector('.timeline-feedback');
 if(!p)return;
 const buttons=form.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);
 feedback.textContent='Saving…';
 const payload={program_id:id,deadline_text:form.elements.deadline_text.value.trim(),
   deadline_iso:form.elements.deadline_iso.value||null,status_text:form.elements.status_text.value.trim(),
   review_note:form.elements.review_note.value.trim(),verified_at:today(),updated_at:new Date().toISOString()};
 if(!payload.deadline_text||!payload.status_text){feedback.textContent='Please enter deadline wording and application status.';buttons.forEach(b=>b.disabled=false);return}
 const {data,error}=await db.from('program_updates').upsert(payload,{onConflict:'program_id'})
  .select('program_id,deadline_text,deadline_iso,status_text,review_note,verified_at,updated_at').single();
 if(error){feedback.textContent='Could not save: '+error.message;buttons.forEach(b=>b.disabled=false);return}
 overrides.set(id,data);render();message.textContent='Saved '+p.title+'. Changes are available to website visitors after they load or refresh the page.';
}
async function reset(form){
 const id=form.dataset.id,p=byId.get(id)||programs.find(o=>o.id===id);if(!p||!overrides.has(id)||!db)return;
 if(!confirm('Restore the original catalog dates for '+p.title+'? The public update will be deleted.'))return;
 const feedback=form.querySelector('.timeline-feedback');feedback.textContent='Restoring…';
 const {error}=await db.from('program_updates').delete().eq('program_id',id);
 if(error){feedback.textContent='Could not restore: '+error.message;return}
 overrides.delete(id);render();message.textContent='Restored original catalog details for '+p.title+'.';
}
list.addEventListener('submit',async e=>{
 const form=e.target.closest('form.timeline-edit');if(!form)return;
 e.preventDefault();await save(form);
});
list.addEventListener('click',async e=>{
 const btn=e.target.closest('button.reset');if(btn)await reset(btn.closest('form.timeline-edit'));
});
el('timeline-pager').addEventListener('click',e=>{
 const button=e.target.closest('button[data-page]');if(!button||button.disabled)return;
 page=Number(button.dataset.page);render();el('timeline-panel').scrollIntoView({behavior:'smooth',block:'start'});
});
filters.search.addEventListener('input',()=>{page=1;render()});
filters.type.addEventListener('change',()=>{page=1;render()});
el('timeline-refresh').addEventListener('click',load);
const panels={reports:'reports-panel',timelines:'timeline-panel',descriptions:'descriptions-panel',management:'management-panel',suggestions:'suggestions-panel',insights:'insights-panel'};
const tabNames=Object.keys(panels);
function switchTab(active){
 const selected=tabNames.includes(active)?active:'reports';
 for(const name of tabNames){
  const chosen=name===selected;
  el(panels[name]).hidden=!chosen;
  const tab=el('tab-'+name);
  tab.classList.toggle('tab-active',chosen);
  tab.setAttribute('aria-selected',String(chosen));
 }
 const hash=selected==='reports'?'':'#'+selected;
 history.replaceState(null,'',location.pathname+location.search+hash);
}
for(const name of tabNames)el('tab-'+name).addEventListener('click',()=>switchTab(name));
// Select the deep-linked tab immediately, even while authentication/catalog requests load.
const tabFromUrl=()=>tabNames.includes(location.hash.slice(1))?location.hash.slice(1):'reports';
switchTab(tabFromUrl());
window.addEventListener('hashchange',()=>switchTab(tabFromUrl()));
document.addEventListener('sob-programs-updated',()=>{render()});
document.addEventListener('sob-admin-ready',e=>{
 db=e.detail.db;initialized=true;
 switchTab(tabNames.includes(location.hash.slice(1))?location.hash.slice(1):'reports');
 load();
});
})();