(()=>{'use strict';
const el=id=>document.getElementById(id),safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const items=window.PROGRAMS||[],store=window.BeaconStore;
const remaining=iso=>{
 if(!iso||!/^\d{4}-\d{2}-\d{2}$/.test(iso))return null;
 return Math.ceil((new Date(iso+'T23:59:59').getTime()-Date.now())/86400000);
};
function card(p,info,days){
 const notes=info.notes?'<p>Note: '+safe(info.notes.slice(0,180))+(info.notes.length>180?'…':'')+'</p>':'';
 return '<article class="dash-card"><div><h3>'+safe(p.title)+'</h3>'+
 '<span class="dash-pill">'+safe(info.application_status||'Interested')+'</span>'+
 (info.favorited?'<span class="dash-pill">♥ Saved</span>':'')+
 (days!==null&&days>=0&&days<=30?'<span class="dash-pill soon">'+(days===0?'Due today':days+' days left')+'</span>':'')+
 '<p>'+safe(p.deadline||'Deadline unknown')+' · '+safe(p.org)+'</p>'+notes+
 '</div><a href="program.html?id='+encodeURIComponent(p.id)+'">View & update →</a></article>';
}
function render(){
 const list=items.map(p=>({program:p,info:store.get(p.id),days:remaining(p.deadlineISO)}));
 const tracked=list.filter(x=>x.info.favorited||x.info.notes||x.info.application_status&&x.info.application_status!=='Interested');
 const upcoming=list.filter(x=>x.days!==null&&x.days>=0&&x.days<=30&&x.info.favorited)
  .sort((a,b)=>a.days-b.days);
 el('dash-saved').textContent=list.filter(x=>x.info.favorited).length;
 el('dash-upcoming').textContent=upcoming.length;
 el('dash-planning').textContent=list.filter(x=>x.info.application_status==='Planning to apply').length;
 el('dash-applied').textContent=list.filter(x=>x.info.application_status==='Applied').length;
 el('dash-deadlines').innerHTML=upcoming.length?upcoming.map(x=>card(x.program,x.info,x.days)).join(''):
  '<p class="small">No deadlines within the next 30 days among your saved programs.</p>';
 el('dash-list').innerHTML=tracked.length?tracked.map(x=>card(x.program,x.info,x.days)).join(''):
  '<p class="small">No tracked opportunities yet. <a href="./#opportunities">Explore programs and save your favorites.</a></p>';
 el('dash-feedback').textContent=tracked.length+' tracked program'+(tracked.length===1?'':'s')+'. Save programs and update their progress to see them here.';
}
store.watch(render);
document.addEventListener('sob-programs-updated',render);
document.addEventListener('sob-catalog-ready',render);
Promise.allSettled([window.StudentCatalog?.ready,window.ProgramUpdates?.ready,window.ProgramDescriptions?.ready].filter(Boolean)).then(render);
render();
})();