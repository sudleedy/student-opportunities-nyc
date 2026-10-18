(()=>{'use strict';
const byId=id=>document.getElementById(id);
const escapeText=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null,records=[];
const container=byId('suggestions-list'),message=byId('suggestions-message');
function render(){
 const target=byId('suggestions-filter').value;
 const found=records.filter(r=>!target||r.review_status===target);
 message.textContent='Showing '+found.length+' of '+records.length+' suggestions.';
 container.innerHTML=found.map(r=>'<article class="admin-edit-card" data-suggestion="'+r.id+'">'+
 '<h3>'+escapeText(r.program_name)+'</h3>'+
 '<p class="admin-note">'+escapeText(r.organization)+' · '+escapeText(r.review_status)+'</p>'+
 '<p>'+escapeText(r.details||'No notes')+'</p>'+
 '<div class="admin-actions"><a href="'+escapeText(r.official_url)+'" target="_blank" rel="noopener noreferrer">Official website ↗</a>'+
 '<button type="button" data-decision="Approved">Approve</button>'+
 '<button type="button" data-decision="Declined">Decline</button>'+
 '<button type="button" data-draft="1">Create program listing</button>'+
 '<span class="suggestion-feedback" role="status"></span></div></article>').join('')||'<div class="notice">No suggestions found.</div>';
}
async function load(){
 if(!db)return;
 message.textContent='Loading suggestions…';
 const response=await db.from('program_suggestions')
  .select('id,program_name,organization,official_url,details,review_status').order('id',{ascending:false}).limit(250);
 if(response.error){message.textContent='Please run the new Supabase setup SQL to enable suggestions.';return}
 records=response.data||[];render();
}
container.addEventListener('click',async e=>{
 const btn=e.target.closest('button');
 if(!btn)return;
 const card=btn.closest('[data-suggestion]');
 const record=records.find(r=>r.id===Number(card?.dataset.suggestion));
 if(!record)return;
 if(btn.dataset.draft){
  document.dispatchEvent(new CustomEvent('sob-use-suggestion',{detail:record}));
  return;
 }
 const choice=btn.dataset.decision;
 if(!['Approved','Declined'].includes(choice)||!db)return;
 btn.disabled=true;card.querySelector('.suggestion-feedback').textContent='Saving…';
 const response=await db.from('program_suggestions').update({
  review_status:choice,reviewed_at:new Date().toISOString()
 }).eq('id',record.id).select('id,review_status').single();
 if(response.error){
  btn.disabled=false;card.querySelector('.suggestion-feedback').textContent='Save failed: '+response.error.message;
  return;
 }
 record.review_status=response.data.review_status;render();
});
byId('suggestions-filter').addEventListener('change',render);
byId('suggestions-refresh').addEventListener('click',load);
document.addEventListener('sob-admin-ready',e=>{db=e.detail.db;load()});
})();