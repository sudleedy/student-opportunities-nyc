/* Admin-only editor for published program summaries and descriptions. */
(()=>{'use strict';
const el=id=>document.getElementById(id);
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const programs=window.PROGRAMS||[],programById=new Map(programs.map(p=>[p.id,p]));
const overrides=new Map(),list=el('description-list'),message=el('description-message');
const search=el('description-search'),filter=el('description-filter'),pager=el('description-pager');
const PAGE_SIZE=6;
let db=null,available=false,page=1;
const localDate=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const fields=p=>{
 const row=overrides.get(p.id);
 return {
  summary:row?.summary_text??p.summary??'',
  details:row?.details_text??p.details??p.summary??'',
  reviewed:row?.reviewed_at??null,
  edited:Boolean(row)
 };
};
const dirtyForm=()=>list.querySelector('form.description-edit[data-dirty="true"]');
function confirmDiscard(){
 if(!dirtyForm())return true;
 return window.confirm('You have unsaved description changes. Discard them?');
}
function matches(){
 const q=search.value.trim().toLowerCase(),which=filter.value;
 return programs.filter(p=>{
  const edited=overrides.has(p.id);
  return (!q||[p.title,p.org,p.subject,p.type].join(' ').toLowerCase().includes(q))&&
   (!which||(which==='edited'?edited:!edited));
 }).sort((a,b)=>a.title.localeCompare(b.title));
}
function render(){
 el('description-total').textContent=programs.length;
 el('description-edited').textContent=overrides.size;
 el('description-original').textContent=programs.length-overrides.size;
 const results=matches(),pageCount=Math.max(1,Math.ceil(results.length/PAGE_SIZE));
 page=Math.min(page,pageCount);
 const show=results.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 message.textContent=(search.value.trim()||filter.value
  ?'Showing '+results.length+' of '+programs.length+' programs matching your selection.'
  :'Showing all '+programs.length+' programs.')+
  (available?' Changes save to the public website.':' Database setup is needed before saving.');
 list.innerHTML=show.length?show.map(p=>{
  const f=fields(p),summaryId='desc-summary-'+safe(p.id),detailsId='desc-details-'+safe(p.id);
  return '<article class="description-card"><h3>'+safe(p.title)+'</h3>'+
   '<p class="description-meta">'+safe(p.org)+' · '+safe(p.subject)+'</p>'+
   '<span class="description-tag '+(f.edited?'edited':'')+'">'+(f.edited?'Edited in admin':'Original catalog')+'</span>'+
   '<form class="description-edit" data-id="'+safe(p.id)+'" data-dirty="false">'+
   '<label for="'+summaryId+'">Short description <span data-count="summary_text">'+f.summary.length+' / 500</span></label>'+
   '<textarea id="'+summaryId+'" name="summary_text" rows="3" required maxlength="500" '+(!available?'disabled ':'')+'>'+safe(f.summary)+'</textarea>'+
   '<label for="'+detailsId+'">Full program description <span data-count="details_text">'+f.details.length+' / 4000</span></label>'+
   '<textarea id="'+detailsId+'" name="details_text" rows="6" required maxlength="4000" '+(!available?'disabled ':'')+'>'+safe(f.details)+'</textarea>'+
   '<div class="description-actions"><button type="submit" '+(!available?'disabled ':'')+'>Save descriptions</button>'+
   (f.edited?'<button type="button" class="reset" '+(!available?'disabled ':'')+'>Restore originals</button>':'')+
   '<a href="program.html?id='+encodeURIComponent(p.id)+'" target="_blank" rel="noopener noreferrer">View public program ↗</a>'+
   '<a href="'+safe(p.url)+'" target="_blank" rel="noopener noreferrer">Official source ↗</a>'+
   '<span class="description-feedback" role="status"></span></div>'+
   (f.edited?'<details class="description-review"><summary>Compare with original catalog text</summary><p><strong>Short:</strong> '+safe(p.summary)+'</p><p><strong>Full:</strong> '+safe(p.details||p.summary)+'</p></details>':'')+
   '<p class="description-review">'+(f.edited?'Last saved review: '+safe(f.reviewed||'Date unavailable'):'Not edited in the admin dashboard')+'</p>'+
   '</form></article>';
 }).join(''):'<div class="notice">No programs match your search or filter.</div>';
 pager.innerHTML=pageCount>1?'<button type="button" data-page="'+(page-1)+'" '+(page===1?'disabled':'')+'>← Previous</button>'+
  '<span>Page '+page+' of '+pageCount+'</span>'+
  '<button type="button" data-page="'+(page+1)+'" '+(page===pageCount?'disabled':'')+'>Next →</button>':
  '<span>'+results.length+' program'+(results.length===1?'':'s')+'</span>';
}
async function load(){
 if(!db)return;
 message.textContent='Loading saved descriptions…';
 const {data,error}=await db.from('program_descriptions')
  .select('program_id,summary_text,details_text,reviewed_at,updated_at').limit(500);
 if(error){
  available=false;
  render();
  message.textContent='Description editing is not enabled yet. Run supabase-program-descriptions.sql in Supabase SQL Editor, then click Refresh descriptions.';
  return;
 }
 available=true;
 overrides.clear();
 for(const row of data||[])if(programById.has(row.program_id))overrides.set(row.program_id,row);
 render();
}
async function save(form){
 if(!db||!available)return;
 const p=programById.get(form.dataset.id)||programs.find(o=>o.id===form.dataset.id);
 if(!p)return;
 const summary=form.elements.summary_text.value.trim();
 const details=form.elements.details_text.value.trim();
 const feedback=form.querySelector('.description-feedback');
 if(!summary||!details){feedback.textContent='Both descriptions are required.';return}
 const buttons=form.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);
 feedback.textContent='Saving…';
 const payload={program_id:p.id,summary_text:summary,details_text:details,reviewed_at:localDate(),updated_at:new Date().toISOString()};
 const {data,error}=await db.from('program_descriptions').upsert(payload,{onConflict:'program_id'})
  .select('program_id,summary_text,details_text,reviewed_at,updated_at').single();
 if(error){
  feedback.textContent='Could not save: '+error.message;
  buttons.forEach(b=>b.disabled=false);
  return;
 }
 overrides.set(p.id,data);
 form.dataset.dirty='false';
 render();
 message.textContent='Saved descriptions for '+p.title+'. Visitors will see the updates after loading or refreshing the page.';
}
async function restore(form){
 if(!db||!available)return;
 const p=programById.get(form.dataset.id);
 if(!p||!overrides.has(p.id))return;
 if(!window.confirm('Restore original short and full descriptions for '+p.title+'? Your custom text will be deleted.'))return;
 const feedback=form.querySelector('.description-feedback');
 const buttons=form.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);
 feedback.textContent='Restoring…';
 const {error}=await db.from('program_descriptions').delete().eq('program_id',p.id);
 if(error){
  feedback.textContent='Could not restore: '+error.message;
  buttons.forEach(b=>b.disabled=false);
  return;
 }
 overrides.delete(p.id);
 form.dataset.dirty='false';
 render();
 message.textContent='Restored original catalog descriptions for '+p.title+'.';
}
list.addEventListener('input',e=>{
 const textarea=e.target.closest('textarea');
 if(!textarea)return;
 const form=textarea.closest('form.description-edit');
 form.dataset.dirty='true';
 const counter=form.querySelector('[data-count="'+textarea.name+'"]');
 if(counter)counter.textContent=textarea.value.length+' / '+(textarea.name==='summary_text'?'500':'4000');
});
list.addEventListener('submit',e=>{
 const form=e.target.closest('form.description-edit');
 if(!form)return;
 e.preventDefault();save(form);
});
list.addEventListener('click',e=>{
 const button=e.target.closest('button.reset');
 if(button)restore(button.closest('form.description-edit'));
});
search.addEventListener('input',e=>{
 if(!confirmDiscard()){e.target.value=e.target.dataset.lastValue||'';return}
 e.target.dataset.lastValue=e.target.value;page=1;render();
});
filter.addEventListener('change',e=>{
 if(!confirmDiscard()){e.target.value=e.target.dataset.lastValue||'';return}
 e.target.dataset.lastValue=e.target.value;page=1;render();
});
pager.addEventListener('click',e=>{
 const button=e.target.closest('button[data-page]');
 if(!button||button.disabled||!confirmDiscard())return;
 const next=Number(button.dataset.page);
 if(!Number.isSafeInteger(next)||next<1)return;
 page=next;render();
 el('descriptions-panel').scrollIntoView({behavior:'smooth',block:'start'});
});
el('description-refresh').addEventListener('click',()=>{if(confirmDiscard())load()});
document.addEventListener('sob-admin-ready',e=>{db=e.detail.db;load()});
})();
