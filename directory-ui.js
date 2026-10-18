(()=>{'use strict';
const items=window.PROGRAMS||[],store=window.BeaconStore,el=id=>document.getElementById(id);

const officialUrl=p=>{try{const url=new URL(p.url);return url.protocol==='https:'?url.href:null}catch{return null}};
const daysLeft=d=>d&&/^\d{4}-\d{2}-\d{2}$/.test(d)?Math.ceil((new Date(d+'T23:59:59')-Date.now())/86400000):null;
const reviewed=p=>p.sourceStatus==='current'&&p.verified&&/^\d{4}-\d{2}-\d{2}$/.test(p.verified)&&((Date.now()-new Date(p.verified+'T12:00:00Z'))/86400000)<=60&&((Date.now()-new Date(p.verified+'T12:00:00Z'))/86400000)>=-1;
const fee=p=>['free','fee'].includes(p.costCategory)?p.costCategory:/\bfree\b|no participation fee|no tuition/i.test(p.cost||'')?'free':'unknown';
const pay=p=>['paid','unpaid'].includes(p.payCategory)?p.payCategory:/\bpaid\b|stipend|paid hourly/i.test(p.cost||'')?'paid':'unknown';
const mode=p=>['in-person','remote','hybrid'].includes(p.deliveryMode)?p.deliveryMode:/online/i.test(p.location||'')&&!/hybrid/i.test(p.location||'')?'remote':'unknown';
const state=p=>reviewed(p)&&['open','closed','upcoming'].includes(p.applicationState)&&!(p.applicationState==='open'&&daysLeft(p.deadlineISO)!==null&&daysLeft(p.deadlineISO)<0)?p.applicationState:'unknown';
function badges(p){
 const labels=[],days=daysLeft(p.deadlineISO),status=state(p);
 if(status==='open')labels.push(['open','Applications open']);
 else if(status==='closed')labels.push(['closed','Applications closed']);
 else if(status==='upcoming')labels.push(['soon','Opening soon']);
 if(days!==null&&days>=0&&days<=14)labels.push(['soon','Deadline in '+days+' days']);
 if(days===null)labels.push(['','Next deadline unconfirmed']);
 if(p.sourceStatus==='limited')labels.push(['review','Current details unverified']);
 else if(p.sourceStatus==='program')labels.push(['review','Application dates unverified']);
 else if(!reviewed(p))labels.push(['review','Recheck application status']);
 const statusText=p.sourceStatus==='current'?'Organizer cycle checked':
  p.sourceStatus==='program'?'Program confirmed; current dates not confirmed':'Current intake needs verification';
 const source=officialUrl(p);
 const link=source?' · <a href="'+safe(source)+'" target="_blank" rel="noopener noreferrer">Official organizer ↗</a>':'';
 const date=p.sourceChecked?' · '+safe(p.sourceChecked):'';
 return '<div class="program-badges">'+labels.map(([c,t])=>'<span class="program-badge '+c+'">'+safe(t)+'</span>').join('')+'</div>'+
 '<p class="verified-line">'+safe(statusText)+date+link+'</p>';
}

const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields=id=>document.getElementById(id);
const cards=el('cards'),count=el('count'),saved=el('savedOnly');
const PAGE_SIZE=9,pagers=[el('pagination-top'),el('pagination-bottom')];
saved.checked=new URLSearchParams(location.search).get('saved')==='1';
const requested=Number(new URLSearchParams(location.search).get('page')||1);
let page=Number.isSafeInteger(requested)&&requested>0?requested:1,lastTotal=0;
const cityItems=()=>window.NearbyCatalog?.getItems()||[];
// Native checkboxes allow any number of choices within a filter category.
// Multiple checked choices use OR; distinct categories combine using AND.
const choices={
 subject:{placeholder:'All interests',options:()=>[...new Set([...items,...cityItems()].map(p=>p.subject).filter(Boolean))].sort().map(v=>[v,v])},
 grade:{placeholder:'Any grade',options:()=>[9,10,11,12].map(n=>[String(n),'Grade '+n])},
 'apply-filter':{placeholder:'Any status',options:()=>[['open','Verified open'],['upcoming','Opening soon'],['closed','Closed'],['unknown','Not confirmed']]},
 'cost-filter':{placeholder:'Any cost',options:()=>[['free','Free'],['fee','Has tuition or fees'],['unknown','Not confirmed']]},
 'mode-filter':{placeholder:'Any format',options:()=>[['in-person','In person'],['remote','Online'],['hybrid','Hybrid'],['unknown','Not confirmed']]},
 progress:{placeholder:'Any progress',options:()=>[['Interested','Interested'],['Planning to apply','Planning to apply'],['Applied','Applied'],['Completed','Completed']]},
 'source-filter':{placeholder:'All listings',options:()=>[['curated','Reviewed directory listings'],['city','NYC-funded program sites']]}
};
const checked=Object.fromEntries(Object.keys(choices).map(key=>[key,new Set()]));
const selected=key=>checked[key];
const advancedKeys=['apply-filter','cost-filter','mode-filter','progress','source-filter'];
function updateAdvancedCount(){
 const n=advancedKeys.reduce((sum,key)=>sum+checked[key].size,0)+(saved.checked?1:0);
 el('advanced-count').textContent=n?n+' selected':'optional';
}
const selectedAny=(key,value)=>!checked[key].size||checked[key].has(String(value));
function labelSelected(key,options){
 const picked=options.filter(([value])=>selected(key).has(value)).map(([,label])=>label);
 const name=picked.length?picked.length===1?picked[0]:picked[0]+' +'+(picked.length-1):choices[key].placeholder;
 el(key+'-summary-text').textContent=name;
 updateAdvancedCount();
}
function refreshOptions(){
 for(const [key,config] of Object.entries(choices)){
  const options=config.options();
  const allowed=new Set(options.map(([value])=>value));
  for(const value of checked[key])if(!allowed.has(value))checked[key].delete(value);
  const box=el(key+'-options');
  box.innerHTML=options.map(([value,label])=>
   '<label class="multi-choice"><input type="checkbox" value="'+safe(value)+'" '+(checked[key].has(value)?'checked ':'')+'><span>'+safe(label)+'</span></label>'
  ).join('')+
  '<div class="multi-options-footer"><button type="button" data-multi-clear="'+safe(key)+'">Clear</button><button type="button" class="multi-done" data-multi-done="'+safe(key)+'">Done</button></div>';
  labelSelected(key,options);
 }
}
function changeChoices(key){
 labelSelected(key,choices[key].options());
 page=1;syncPage();render();
}
for(const key of Object.keys(choices)){
 const box=el(key+'-options');
 box.addEventListener('change',e=>{
  const target=e.target;
  if(!target.matches('input[type="checkbox"]'))return;
  if(target.checked)checked[key].add(target.value);
  else checked[key].delete(target.value);
  changeChoices(key);
 });
 box.addEventListener('click',e=>{
  if(e.target.closest('[data-multi-clear]')){
   checked[key].clear();
   box.querySelectorAll('input[type="checkbox"]').forEach(input=>{input.checked=false});
   changeChoices(key);
  }
  if(e.target.closest('[data-multi-done]'))el(key+'-dropdown').open=false;
 });
 const dropdown=el(key+'-dropdown');
 dropdown.addEventListener('toggle',()=>{
  if(!dropdown.open)return;
  for(const other of Object.keys(choices))if(other!==key)el(other+'-dropdown').open=false;
 });
 dropdown.addEventListener('keydown',e=>{
  if(e.key==='Escape'){dropdown.open=false;dropdown.querySelector('summary')?.focus()}
 });
}
document.addEventListener('click',e=>{
 for(const key of Object.keys(choices)){
  const menu=el(key+'-dropdown');
  if(menu.open&&!menu.contains(e.target))menu.open=false;
 }
});

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
function deadline(p){
 if(p.kind==='city'||!p.deadlineISO)return [1,Infinity];
 const value=Date.parse(p.deadlineISO+'T23:59:59');
 return value>=Date.now()?[0,value]:[2,value];
}
function matches(p,q){
 const city=p.kind==='city';
 const progress=store.get(p.id);
 if(!selectedAny('source-filter',city?'city':'curated'))return false;
 if(!selectedAny('subject',p.subject))return false;
 // Within one category: any checked grade is a match. City programs with no
 // known grade information remain visible and are explicitly labeled unverified.
 if(selected('grade').size){
  const grades=(p.grades||[]).map(String);
  if(grades.length&&!grades.some(grade=>selected('grade').has(grade)))return false;
  if(!grades.length&&!city)return false;
 }
 if(!selectedAny('cost-filter',fee(p)))return false;
 if(!selectedAny('mode-filter',mode(p)))return false;
 if(!selectedAny('apply-filter',state(p)))return false;
 if(saved.checked&&(city||!progress.favorited))return false;
 if(selected('progress').size&&(city||!selectedAny('progress',progress.application_status)||!(progress.favorited||progress.notes||progress.application_status!=='Interested')))return false;
 return !q||[p.title,p.org,p.summary,p.whatYouDo,p.subject,p.type,p.eligibility,p.location,p.borough,p.zipcode].join(' ').toLowerCase().includes(q);
}
function mixResults(found){
 const order=el('sort').value;
 if(order==='az')return found.sort((a,b)=>(a.title||'').localeCompare(b.title||''));
 if(order==='deadline')return found.sort((a,b)=>deadline(a)[0]-deadline(b)[0]||deadline(a)[1]-deadline(b)[1]||(a.title||'').localeCompare(b.title||''));
 // Curated entries remain prominent while local city programs are visible on page 1.
 const curated=found.filter(p=>p.kind!=='city'),city=found.filter(p=>p.kind==='city'),out=[];
 let c=0,n=0;
 while(c<curated.length||n<city.length){
  if(c<curated.length)out.push(curated[c++]);
  if(c<curated.length)out.push(curated[c++]);
  if(n<city.length)out.push(city[n++]);
 }
 return out;
}
function renderCity(p){
 const name=safe(p.title),url=officialUrl(p),model=officialUrl({url:p.modelUrl});
 const places=[p.borough,p.zipcode].filter(Boolean).map(safe).join(' · ');
 const distance=Number.isFinite(p.distance)?' · '+p.distance.toFixed(1)+' miles away':'';
 return '<article class="card city-card">'+
  '<span class="pill">NYC-funded site</span><h3>'+name+'</h3>'+
  '<p class="city-provenance">'+safe(p.type)+' · City data '+safe(p.date||'date unknown')+' · Applications unverified</p>'+
  '<p class="activity-preview"><strong>What you might do:</strong> '+safe(p.whatYouDo)+'</p>'+
  '<p class="city-audience"><strong>Usually for:</strong> '+safe(p.eligibility)+'</p>'+
  '<p class="city-disclaimer">Examples of typical activities; this provider’s current schedule and eligibility have not been checked.</p>'+
  '<p class="meta">📍 '+places+safe(distance)+' · '+safe(p.org)+'</p>'+
  (model?'<a class="city-model" href="'+safe(model)+'" target="_blank" rel="noopener noreferrer">About this program type ↗</a>':'')+
  '<div class="card-actions">'+(url?'<a class="open-detail" href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">Check NYC program directory ↗</a>':'<span>City directory unavailable</span>')+'</div></article>';
}
function renderCurated(p){
 const isFav=Boolean(store.get(p.id).favorited);
 return '<article class="card"><span class="pill">'+safe(p.type)+'</span><h3>'+safe(p.title)+'</h3>'+badges(p)+
 '<p class="activity-preview"><strong>What you’ll do:</strong> '+safe(p.whatYouDo||p.summary)+'</p>'+
 '<p class="deadline-line">📅 '+safe(p.deadline)+'</p><div class="meta">'+safe(p.org)+' · '+safe(p.location)+'</div>'+
 '<div class="card-actions"><a class="open-detail" href="program.html?id='+encodeURIComponent(p.id)+'">View details →</a>'+
 '<button class="favorite-button" type="button" data-id="'+safe(p.id)+'" aria-pressed="'+isFav+'" aria-label="'+(isFav?'Remove favorite':'Save favorite')+'">'+(isFav?'♥':'♡')+'</button></div></article>';
}
function render(){
 const query=el('search').value.trim().toLowerCase(),results=mixResults([...items,...cityItems()].filter(p=>matches(p,query)));
 lastTotal=results.length;
 const pages=Math.max(1,Math.ceil(results.length/PAGE_SIZE));
 if(page>pages){page=pages;syncPage()}
 const shown=results.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 const cityCount=results.filter(x=>x.kind==='city').length;
 count.textContent=results.length+' result'+(results.length===1?'':'s')+(cityCount?' · '+cityCount+' city sites':'');
 cards.innerHTML=shown.length?shown.map(p=>p.kind==='city'?renderCity(p):renderCurated(p)).join(''):
 '<div class="empty">No matching programs. Try another interest or borough, or clear your filters.</div>';
 renderPager(results.length);
}
cards.addEventListener('click',e=>{
 const button=e.target.closest('button[data-id]');
 if(button)store.save(button.dataset.id,{favorited:!store.get(button.dataset.id).favorited});
});
const resetPage=()=>{page=1;syncPage();render()};
['search','sort'].forEach(id=>el(id).addEventListener('input',resetPage));
saved.addEventListener('change',()=>{
 const url=new URL(location.href);
 if(saved.checked)url.searchParams.set('saved','1');else url.searchParams.delete('saved');
 updateAdvancedCount();
 history.replaceState({},'',url.pathname+url.search+url.hash);
 resetPage();
});
el('clear-filters').addEventListener('click',()=>{
 ['search','sort'].forEach(id=>el(id).value='');
 for(const key of Object.keys(choices)){checked[key].clear();el(key+'-dropdown').open=false}
 refreshOptions();
 el('sort').value='default';
 saved.checked=false;
 updateAdvancedCount();
 const url=new URL(location.href);url.searchParams.delete('saved');
 history.replaceState({},'',url.pathname+url.search+url.hash);
 const borough=el('nearby-borough');
 if(borough.value){borough.value='';borough.dispatchEvent(new Event('change'))}
 resetPage();
});
pagers.forEach(p=>p.addEventListener('click',e=>{
 const button=e.target.closest('button[data-page]');
 if(!button||button.disabled)return;
 const next=Number(button.dataset.page),pages=Math.ceil(lastTotal/PAGE_SIZE);
 if(!Number.isSafeInteger(next)||next<1||next>pages)return;
 page=next;syncPage();render();
 el('opportunities').scrollIntoView({behavior:'smooth',block:'start'});
}));
const backTop=el('back-to-top');
const updateTop=()=>backTop.classList.toggle('visible',window.scrollY>400);
window.addEventListener('scroll',updateTop,{passive:true});
backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
document.addEventListener('sob-nearby-updated',()=>{refreshOptions();resetPage()});
document.addEventListener('sob-catalog-ready',()=>{refreshOptions();resetPage()});
document.addEventListener('sob-programs-updated',()=>{refreshOptions();render()});
store.watch(render);el('year').textContent=new Date().getFullYear();refreshOptions();render();updateTop();
})();
