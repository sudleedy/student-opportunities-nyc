/* Secure program catalog management, powered by Supabase RLS. */
(()=>{'use strict';
const el=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const original=window.StudentCatalog?.originals||new Map();
const rows=new Map(),editor=el('manager-editor'),listing=el('manager-list'),status=el('manager-message');
const search=el('manager-search'),filter=el('manager-filter');
const types=['Research','Internship','College Preparation','Scholarship','Volunteering','Leadership','Competition','Technology Program','Arts Program','Other'];
const keys=['title','org','type','subject','location','summary','details','eligibility','deadline','deadlineISO','deadlineNote','status','cost','commitment','preparation','url','verified','applicationNote','grades','costCategory','payCategory','deliveryMode','applicationState'];
let db=null,available=false,loading=true,page=1,editing=null,changed=false;
const escField=(name,label,value,type='text',extra='')=>'<label>'+escape(label)+
 (type==='textarea'?'<textarea name="'+name+'" '+extra+'>'+escape(value)+'</textarea>':
 '<input name="'+name+'" type="'+type+'" value="'+escape(value)+'" '+extra+'>')+'</label>';
const choose=(name,label,value,options)=>'<label>'+escape(label)+'<select name="'+name+'">'+options.map(([v,t])=>'<option value="'+escape(v)+'" '+(String(value||'')===v?'selected':'')+'>'+escape(t)+'</option>').join('')+'</select></label>';
const opts=values=>values.map(v=>[v,v]);
function fullList(){
 const merged=new Map(original);
 for(const [id,row] of rows){
  if(!row.is_archived||!merged.has(id))merged.set(id,{...(original.get(id)||{}),id,...(row.program_data||{})});
 }
 return [...merged.values()].sort((a,b)=>(a.title||'').localeCompare(b.title||''));
}
function syncLive(id){
 const entries=window.PROGRAMS||[],idx=entries.findIndex(p=>p.id===id),row=rows.get(id);
 if(row?.is_archived||(!row&&!original.has(id))){
  if(idx>=0)entries.splice(idx,1);
 }else{
  const current={...(original.get(id)||{}),id,...(row?.program_data||{})};
  if(idx>=0)Object.assign(entries[idx],current);
  else entries.push(current);
 }
 document.dispatchEvent(new Event('sob-programs-updated'));
}
function isArchived(id){return Boolean(rows.get(id)?.is_archived)}
function containsDirty(){
 if(!editing||!changed)return true;
 return confirm('Discard the unsaved program edits?');
}
function render(){
 const candidates=fullList().filter(p=>(!filter.value||(filter.value==='archived')===isArchived(p.id))&&
  (!search.value.trim()||[p.title,p.org,p.subject].join(' ').toLowerCase().includes(search.value.trim().toLowerCase())));
 const total=fullList().length,active=fullList().filter(p=>!isArchived(p.id)).length;
 const pages=Math.max(1,Math.ceil(candidates.length/8));page=Math.min(page,pages);
 listing.innerHTML=candidates.slice((page-1)*8,page*8).map(p=>{
  const hidden=isArchived(p.id),managed=rows.has(p.id);
  return '<article class="admin-record"><div><h3>'+escape(p.title)+'</h3><p>'+escape(p.org||'')+' · '+escape(p.subject||'')+'</p>'+
   '<p>'+(hidden?'Archived — hidden from students':managed?'Customized listing':'Original listing')+'</p></div>'+
   '<div class="admin-actions"><button type="button" data-edit="'+escape(p.id)+'">Edit</button>'+
   '<button type="button" data-archive="'+escape(p.id)+'">'+(hidden?'Unarchive':'Archive')+'</button>'+
   (managed?'<button type="button" data-revert="'+escape(p.id)+'">Remove override</button>':'')+'</div></article>';
 }).join('')||'<div class="notice">No matching programs.</div>';
 el('manager-pager').innerHTML=pages>1?'<button type="button" data-page="'+(page-1)+'" '+(page===1?'disabled':'')+'>← Previous</button><span>Page '+page+' of '+pages+'</span><button type="button" data-page="'+(page+1)+'" '+(page===pages?'disabled':'')+'>Next →</button>':'';
 status.textContent='Showing '+candidates.length+' of '+total+' entries. '+active+' active, '+(total-active)+' archived.'+
  (available?' You can add and edit programs.':loading?' Loading saved catalog changes…':' Edits are temporarily unavailable; check your database connection.');
}
function startEditor(id=null,draft=null){
 if(!containsDirty())return;
 const p=draft||fullList().find(x=>x.id===id)||{};
 editing=id||'new';changed=false;
 const val=(key,defaultValue='')=>p[key]??defaultValue;
 const isNew=!id;
 editor.hidden=false;
 editor.innerHTML='<h3>'+(isNew?'Add a program':'Edit '+escape(p.title))+'</h3>'+
 '<p class="admin-note">Only publish information verified against the official program website. Required fields are marked *.</p>'+
 '<form id="manage-program-form"><div class="admin-edit-grid">'+
 (isNew?escField('id','Permanent program ID *',val('id'),'text','required pattern="[a-z0-9][a-z0-9-]{2,119}" maxlength="120"'):'' )+
 escField('title','Program name *',val('title'),'text','required maxlength="140"')+
 escField('org','Organization *',val('org'),'text','required maxlength="140"')+
 choose('type','Program type',val('type','Other'),opts(types))+
 escField('subject','Subject / interest',val('subject'),'text','maxlength="90"')+
 escField('location','Location',val('location','New York City'),'text','maxlength="120"')+
 escField('grades','Eligible grades (comma-separated, e.g. 9,10)',(val('grades',[])||[]).join(','),'text','pattern="[0-9, ]*"')+
 choose('costCategory','Participation fee',val('costCategory','unknown'),[['unknown','Not confirmed'],['free','Free'],['fee','Tuition / participation fee']])+
 choose('payCategory','Compensation',val('payCategory','unknown'),[['unknown','Not confirmed'],['paid','Paid / stipend'],['unpaid','Unpaid']])+
 choose('deliveryMode','Format',val('deliveryMode','unknown'),[['unknown','Not confirmed'],['in-person','In person'],['remote','Remote / online'],['hybrid','Hybrid']])+
 choose('applicationState','Applications',val('applicationState','unknown'),[['unknown','Not confirmed'],['open','Confirmed open'],['upcoming','Opening soon'],['closed','Closed']])+
 escField('url','Official website URL *',val('url'),'url','required maxlength="500"')+
 escField('deadlineISO','Confirmed exact deadline (optional)',val('deadlineISO'),'date')+
 escField('verified','Date information verified',val('verified'),'date')+
 escField('deadline','Deadline wording *',val('deadline','Check official website'),'text','required maxlength="240"')+
 escField('status','Application status wording',val('status','Check official website'),'text','maxlength="180"')+
 escField('cost','Cost / compensation description',val('cost'),'text','maxlength="300"')+
 escField('commitment','Time commitment',val('commitment'),'text','maxlength="300"')+
 escField('eligibility','Eligibility',val('eligibility'),'textarea','maxlength="1400" class="wide"')+
 '<div class="wide">'+escField('summary','Homepage short description *',val('summary'),'textarea','required maxlength="500"')+'</div>'+
 '<div class="wide">'+escField('details','Full description *',val('details'),'textarea','required maxlength="4000"')+'</div>'+
 '<div class="wide">'+escField('preparation','How to prepare',val('preparation'),'textarea','maxlength="1500"')+'</div>'+
 '<div class="wide">'+escField('deadlineNote','Deadline verification note',val('deadlineNote'),'textarea','maxlength="500"')+'</div>'+
 '<div class="wide">'+escField('applicationNote','Application details',val('applicationNote'),'textarea','maxlength="700"')+'</div>'+
 '</div><div class="admin-actions"><button class="primary" type="submit" '+(!available?'disabled':'')+'>Save program</button><button type="button" id="manager-cancel">Cancel</button><span id="manager-edit-feedback" role="status"></span></div></form>';
 editor.scrollIntoView({behavior:'smooth',block:'start'});
}
async function save(form){
 if(!available)return;
 const formdata=new FormData(form),id=editing==='new'?String(formdata.get('id')||'').trim().toLowerCase():editing;
 if(!/^[a-z0-9][a-z0-9-]{2,119}$/.test(id)){el('manager-edit-feedback').textContent='Use a lowercase program ID with hyphens.';return}
 if(editing==='new'&&(original.has(id)||rows.has(id))){el('manager-edit-feedback').textContent='This program ID already exists.';return}
 const p={};
 for(const key of keys){
  if(key==='grades')p.grades=[...new Set(String(formdata.get(key)||'').split(',').map(Number).filter(n=>Number.isInteger(n)&&n>=9&&n<=12))];
  else if(key==='deadlineISO')p[key]=String(formdata.get(key)||'')||null;
  else p[key]=String(formdata.get(key)||'').trim();
 }
 try{const parsed=new URL(p.url);if(parsed.protocol!=='https:')throw Error('HTTPS only')}
 catch{el('manager-edit-feedback').textContent='Enter an official HTTPS website URL.';return}
 if(!p.title||!p.org||!p.summary||!p.details||!p.deadline){el('manager-edit-feedback').textContent='Fill in all required fields.';return}
 const button=form.querySelector('[type=submit]');button.disabled=true;el('manager-edit-feedback').textContent='Saving…';
 const payload={program_id:id,program_data:p,is_archived:false,updated_at:new Date().toISOString()};
 const {data,error}=await db.from('catalog_programs').upsert(payload,{onConflict:'program_id'}).select('program_id,program_data,is_archived,updated_at').single();
 if(error){el('manager-edit-feedback').textContent='Could not save: '+error.message;button.disabled=false;return}
 rows.set(id,data);syncLive(id);changed=false;editor.hidden=true;editing=null;render();
 status.textContent='Published '+p.title+'. Refresh the public website to see it.';
}
async function changeArchive(id,archived){
 if(!available||!containsDirty())return;
 const p=fullList().find(x=>x.id===id);if(!p)return;
 if(!confirm((archived?'Archive':'Restore')+' '+p.title+'?'+(archived?' It will disappear from public browsing but student saves will remain.':'')))return;
 const record=rows.get(id);
 const payload={program_id:id,program_data:record?.program_data||{},is_archived:archived,updated_at:new Date().toISOString()};
 const {data,error}=await db.from('catalog_programs').upsert(payload,{onConflict:'program_id'}).select().single();
 if(error){status.textContent='Could not update: '+error.message;return}
 rows.set(id,data);syncLive(id);render();
}
async function revert(id){
 if(!available||!containsDirty()||!rows.has(id))return;
 if(!confirm('Remove the custom catalog entry for '+id+'? Original listings return to their bundled version; newly added programs disappear.'))return;
 const {error}=await db.from('catalog_programs').delete().eq('program_id',id);
 if(error){status.textContent='Could not restore: '+error.message;return}
 rows.delete(id);syncLive(id);render();
}
async function load(){
 if(!db)return;
 loading=true;render();
 try{
  const {data,error}=await db.from('catalog_programs').select('program_id,program_data,is_archived,updated_at').limit(1000);
  if(error)throw error;
  available=true;loading=false;rows.clear();
  for(const row of data||[])rows.set(row.program_id,row);
  render();
 }catch(error){
  available=false;loading=false;render();
  status.textContent='Showing built-in programs, but edits are unavailable. '+(error?.message||'Could not load the catalog table')+'. Check the Supabase setup or click Refresh.';
 }
}
function fillSuggestion(d){
 el('tab-management').click();
 const title=d.program_name||'',org=d.organization||'',url=d.official_url||'';
 const id=title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
 startEditor(null,{id,title,org,url,summary:d.details||'',details:d.details||'',verified:''});
}
el('manager-new').addEventListener('click',()=>startEditor());
el('manager-refresh').addEventListener('click',()=>{if(containsDirty())load()});
search.addEventListener('input',()=>{page=1;render()});
filter.addEventListener('change',()=>{page=1;render()});
el('manager-pager').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b||b.disabled||!containsDirty())return;page=Number(b.dataset.page);render()});
listing.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.edit)startEditor(button.dataset.edit);
 else if(button.dataset.archive)changeArchive(button.dataset.archive,!isArchived(button.dataset.archive));
 else if(button.dataset.revert)revert(button.dataset.revert);
});
editor.addEventListener('input',()=>{changed=true});
editor.addEventListener('submit',e=>{e.preventDefault();save(e.target)});
editor.addEventListener('click',e=>{if(e.target.id==='manager-cancel'&&containsDirty()){editor.hidden=true;editing=null;changed=false}});
document.addEventListener('sob-use-suggestion',e=>fillSuggestion(e.detail));
// Always show the bundled program list even before the database answers.
render();
document.addEventListener('sob-catalog-ready',()=>{if(!editing)render()});
document.addEventListener('sob-admin-ready',e=>{db=e.detail.db;load()});
})();