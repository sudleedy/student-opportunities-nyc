(()=>{'use strict';
const items=window.PROGRAMS||[],store=window.BeaconStore,el=id=>document.getElementById(id);
const cards=el('cards'),count=el('count'),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [id,field] of [['category','type'],['subject','subject'],['location','location']]){
 const select=el(id);[...new Set(items.map(o=>o[field]))].sort().forEach(v=>select.add(new Option(v,v)));
}
const saved=el('savedOnly');saved.checked=new URLSearchParams(location.search).get('saved')==='1';
const PAGE_SIZE=9,pagers=[el('pagination-top'),el('pagination-bottom')];
const requestedPage=Number(new URLSearchParams(location.search).get('page')||1);
let page=Number.isSafeInteger(requestedPage)&&requestedPage>0?requestedPage:1;
function syncPage(){
 const url=new URL(location.href);
 if(page>1)url.searchParams.set('page',String(page));else url.searchParams.delete('page');
 history.replaceState({},'',url.pathname+url.search+url.hash);
}
function renderPager(total){
 if(!total){pagers.forEach(p=>p.innerHTML='');return}
 const pages=Math.ceil(total/PAGE_SIZE),first=(page-1)*PAGE_SIZE+1,last=Math.min(page*PAGE_SIZE,total);
 const buttons=[];
 for(let n=1;n<=pages;n++){
  if(pages>7&&n!==1&&n!==pages&&Math.abs(n-page)>2){
   if(n===2||n===pages-1)buttons.push('<span class="pagination-ellipsis" aria-hidden="true">…</span>');
   continue;
  }
  buttons.push('<button type="button" data-page="'+n+'" '+(page===n?'aria-current="page" ':'')+'aria-label="Page '+n+'">'+n+'</button>');
 }
 const html='<span class="pagination-summary">Showing '+first+'–'+last+' of '+total+'</span>'+
  '<button type="button" data-page="'+(page-1)+'" '+(page===1?'disabled ':'')+'aria-label="Previous page">← Previous</button>'+
  buttons.join('')+
  '<button type="button" data-page="'+(page+1)+'" '+(page===pages?'disabled ':'')+'aria-label="Next page">Next →</button>';
 pagers.forEach(p=>p.innerHTML=html);
}
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
 const pages=Math.max(1,Math.ceil(results.length/PAGE_SIZE));
 if(page>pages){page=pages;syncPage()}
 const visibleResults=results.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 count.textContent=results.length+' result'+(results.length===1?'':'s');
 cards.innerHTML=results.length?visibleResults.map(o=>{
 const isFav=Boolean(store.get(o.id).favorited);
 return '<article class="card"><span class="pill">'+safe(o.type)+'</span><h3>'+safe(o.title)+'</h3><p>'+safe(o.summary)+'</p><p class="deadline-line">📅 '+safe(o.deadline)+'</p><div class="meta">'+safe(o.org)+' · '+safe(o.location)+'</div><div class="card-actions"><a class="open-detail" href="program.html?id='+encodeURIComponent(o.id)+'">View details →</a><button class="favorite-button" type="button" data-id="'+safe(o.id)+'" aria-pressed="'+isFav+'" aria-label="'+(isFav?'Remove favorite':'Save favorite')+'">'+(isFav?'♥':'♡')+'</button></div></article>'}).join(''):'<div class="empty">No matches found. Try different filters or save a program.</div>';
 renderPager(results.length);
}
cards.addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(b)store.save(b.dataset.id,{favorited:!store.get(b.dataset.id).favorited})});
['search','category','subject','location','grade','sort','progress'].forEach(id=>el(id).addEventListener('input',()=>{page=1;syncPage();render()}));
saved.addEventListener('change',()=>{
 const u=new URL(location.href);
 saved.checked?u.searchParams.set('saved','1'):u.searchParams.delete('saved');
 page=1;history.replaceState({},'',u.pathname+u.search+u.hash);syncPage();render();
});
pagers.forEach(p=>p.addEventListener('click',e=>{
 const button=e.target.closest('button[data-page]');
 if(!button||button.disabled)return;
 const next=Number(button.dataset.page);
 if(!Number.isSafeInteger(next)||next<1)return;
 page=next;syncPage();render();
 el('opportunities').scrollIntoView({behavior:'smooth',block:'start'});
}));
const backTop=el('back-to-top');
const updateTop=()=>backTop.classList.toggle('visible',window.scrollY>400);
window.addEventListener('scroll',updateTop,{passive:true});
backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
document.addEventListener('sob-programs-updated',render);
store.watch(render);el('year').textContent=new Date().getFullYear();render();updateTop();
})();