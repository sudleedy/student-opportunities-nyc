(()=>{'use strict';
const items=window.PROGRAMS||[],store=window.BeaconStore,el=id=>document.getElementById(id);
const cards=el('cards'),count=el('count'),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [id,field] of [['category','type'],['subject','subject'],['location','location']]){
 const select=el(id);[...new Set(items.map(o=>o[field]))].sort().forEach(v=>select.add(new Option(v,v)));
}
const saved=el('savedOnly');saved.checked=new URLSearchParams(location.search).get('saved')==='1';
function deadline(p){if(!p.deadlineISO)return [1,Infinity];let d=Date.parse(p.deadlineISO+'T23:59:59');return d>=Date.now()?[0,d]:[2,d]}
function render(){
 const q=el('search').value.trim().toLowerCase();
 let results=items.filter(o=>
 (!el('category').value||o.type===el('category').value)&&
 (!el('subject').value||o.subject===el('subject').value)&&
 (!el('location').value||o.location===el('location').value)&&
 (!el('grade').value||(o.grades||[]).includes(Number(el('grade').value)))&&
 (!saved.checked||store.get(o.id).favorited)&&
 (!el('progress').value||(store.get(o.id).application_status===el('progress').value && (store.get(o.id).favorited||store.get(o.id).notes||store.get(o.id).application_status!=='Interested')))&&
 (!q||[o.title,o.org,o.summary,o.subject,o.eligibility].join(' ').toLowerCase().includes(q)));
 const mode=el('sort').value;
 if(mode==='deadline')results.sort((a,b)=>deadline(a)[0]-deadline(b)[0]||deadline(a)[1]-deadline(b)[1]||a.title.localeCompare(b.title));
 if(mode==='az')results.sort((a,b)=>a.title.localeCompare(b.title));
 count.textContent=results.length+' result'+(results.length===1?'':'s');
 cards.innerHTML=results.length?results.map(o=>{
 const isFav=Boolean(store.get(o.id).favorited);
 return '<article class="card"><span class="pill">'+safe(o.type)+'</span><h3>'+safe(o.title)+'</h3><p>'+safe(o.summary)+'</p><p class="deadline-line">📅 '+safe(o.deadline)+'</p><div class="meta">'+safe(o.org)+' · '+safe(o.location)+'</div><div class="card-actions"><a class="open-detail" href="program.html?id='+encodeURIComponent(o.id)+'">View details →</a><button class="favorite-button" type="button" data-id="'+safe(o.id)+'" aria-pressed="'+isFav+'" aria-label="'+(isFav?'Remove favorite':'Save favorite')+'">'+(isFav?'♥':'♡')+'</button></div></article>'}).join(''):'<div class="empty">No matches found. Try different filters or save a program.</div>';
}
cards.addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(b)store.save(b.dataset.id,{favorited:!store.get(b.dataset.id).favorited})});
['search','category','subject','location','grade','sort','progress'].forEach(id=>el(id).addEventListener('input',render));
saved.addEventListener('change',()=>{const u=new URL(location.href);saved.checked?u.searchParams.set('saved','1'):u.searchParams.delete('saved');history.replaceState({},'',u.pathname+u.search+u.hash);render()});
store.watch(render);el('year').textContent=new Date().getFullYear();render();
})();