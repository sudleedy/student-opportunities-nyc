/* Saved-opportunity comparison, subject-based suggestions, and opt-in calendar file. */
(()=>{'use strict';
const programs=window.PROGRAMS||[],store=window.BeaconStore;
const optionHost=document.getElementById('dash-compare-options');
const resultHost=document.getElementById('dash-compare-result');
const suggestionHost=document.getElementById('dash-suggestions');
const downloadButton=document.getElementById('dash-calendar-download');
const feedback=document.getElementById('dash-tool-feedback');
const googleHost=document.getElementById('dash-google-calendar-list');
if(!optionHost||!resultHost||!suggestionHost||!downloadButton||!store)return;
const selected=new Set();
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const future=p=>/^\d{4}-\d{2}-\d{2}$/.test(p.deadlineISO||'')&&new Date(p.deadlineISO+'T23:59:59').getTime()>Date.now();
const saved=()=>programs.filter(p=>store.get(p.id).favorited);
function renderComparison(){
 const choices=saved().slice().sort((a,b)=>a.title.localeCompare(b.title));
 const savedIds=new Set(choices.map(p=>p.id));
 for(const id of Array.from(selected))if(!savedIds.has(id))selected.delete(id);
 optionHost.innerHTML=choices.length?choices.map(p=>'<label class="dash-compare-choice"><input type="checkbox" value="'+escapeHtml(p.id)+'" '+(selected.has(p.id)?'checked':'')+'><span>'+escapeHtml(p.title)+'</span></label>').join(''):
  '<p class="small">Save some programs first to compare them here.</p>';
 const chosen=choices.filter(p=>selected.has(p.id));
 if(!chosen.length){resultHost.innerHTML='<p class="small">Choose up to three saved programs to see their details side by side.</p>';return}
 const rows=[['What you do',p=>p.whatYouDo||p.summary],['Who can apply',p=>p.eligibility],['Application deadline',p=>p.deadline],['Cost / compensation',p=>p.cost],['Location',p=>p.location],['Organizer review',p=>(p.sourceChecked||'Unrecorded')+' · '+(p.sourceStatus==='current'?'Cycle reviewed':'Current dates not confirmed')]];
 resultHost.innerHTML='<table><thead><tr><th scope="col">Compare</th>'+chosen.map(p=>'<th scope="col"><a href="program.html?id='+encodeURIComponent(p.id)+'">'+escapeHtml(p.title)+'</a></th>').join('')+'</tr></thead><tbody>'+
 rows.map(([name,value])=>'<tr><th scope="row">'+escapeHtml(name)+'</th>'+chosen.map(p=>'<td>'+escapeHtml(value(p)||'Not confirmed')+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
}
optionHost.addEventListener('change',event=>{
 const input=event.target.closest('input[type="checkbox"]');if(!input)return;
 if(input.checked&&selected.size>=3&&!selected.has(input.value)){
  input.checked=false;feedback.textContent='Compare up to three programs at a time.';return;
 }
 if(input.checked)selected.add(input.value);else selected.delete(input.value);
 feedback.textContent='';renderComparison();
});
function renderRecommendations(){
 const favorites=saved(),weights=new Map();
 for(const p of favorites)if(p.subject)weights.set(p.subject,(weights.get(p.subject)||0)+1);
 if(!weights.size){suggestionHost.innerHTML='<p class="small">Save a favorite to get suggestions based on your interests. We do not guess your grade or eligibility.</p>';return}
 const candidates=programs.filter(p=>!store.get(p.id).favorited&&weights.has(p.subject)&&p.applicationState!=='closed'&&(!p.deadlineISO||future(p)))
  .sort((a,b)=>(weights.get(b.subject)-weights.get(a.subject))||a.title.localeCompare(b.title)).slice(0,3);
 suggestionHost.innerHTML=candidates.length?candidates.map(p=>'<article class="dash-recommendation"><strong>'+escapeHtml(p.title)+'</strong><p>'+escapeHtml(p.subject)+' · '+escapeHtml(p.org)+'</p><p>'+escapeHtml(p.whatYouDo||p.summary||'')+'</p><a href="program.html?id='+encodeURIComponent(p.id)+'">See details and eligibility →</a></article>').join(''):
  '<p class="small">You have saved the opportunities in those subjects. Explore other interests in the directory.</p>';
}
function renderGoogleCalendar(){
 if(!googleHost)return;
 const deadlines=saved().filter(future).sort((a,b)=>a.deadlineISO.localeCompare(b.deadlineISO));
 if(!deadlines.length){
  googleHost.innerHTML='<p class="small">Save a program with a confirmed future deadline to add it to Google Calendar.</p>';
  return;
 }
 googleHost.innerHTML=deadlines.map(p=>{
  const iso=p.deadlineISO.replace(/-/g,'');
  const details='Verify the exact application cutoff and eligibility with the organizer. Published deadline: '+(p.deadline||'Not specified')+
   (p.url?'\nOfficial program website: '+p.url:'');
  const params=new URLSearchParams({
   action:'TEMPLATE',text:p.title+' — application deadline',
   dates:iso+'/'+dateAfter(p.deadlineISO),details
  });
  const url='https://calendar.google.com/calendar/render?'+params.toString();
  return '<div class="dash-google-row"><span>'+escapeHtml(p.title)+' <small>('+escapeHtml(p.deadlineISO)+')</small></span>'+
   '<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer" aria-label="Add '+escapeHtml(p.title)+' deadline to Google Calendar">Add to Google Calendar ↗</a></div>';
 }).join('');
}
function escapeCalendar(s){return String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function dateAfter(iso){const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10).replace(/-/g,'')}
downloadButton.addEventListener('click',()=>{
 const list=saved().filter(future).sort((a,b)=>a.deadlineISO.localeCompare(b.deadlineISO));
 if(!list.length){feedback.textContent='No future dated deadlines among saved programs. Unknown or past dates are excluded.';return}
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Student Opportunities NYC//Saved Deadlines//EN','CALSCALE:GREGORIAN'];
 for(const p of list){
  lines.push('BEGIN:VEVENT','UID:'+p.id+'-deadline@student-opportunities-nyc.com','DTSTAMP:'+stamp,
   'DTSTART;VALUE=DATE:'+p.deadlineISO.replace(/-/g,''),'DTEND;VALUE=DATE:'+dateAfter(p.deadlineISO),
   'SUMMARY:'+escapeCalendar(p.title+' — application deadline'),
   'DESCRIPTION:'+escapeCalendar('Check exact time and eligibility with the organizer. '+(p.deadline||'')),
   'URL:'+escapeCalendar(/^https:\/\//i.test(p.url||'')?p.url:''));
  for(const days of [7,1])lines.push('BEGIN:VALARM','TRIGGER:-P'+days+'D','ACTION:DISPLAY','DESCRIPTION:'+escapeCalendar('Check '+p.title+' application deadline'),'END:VALARM');
  lines.push('END:VEVENT');
 }
 lines.push('END:VCALENDAR');
 const blob=new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='student-opportunities-deadlines.ics';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
 feedback.textContent='Calendar file ready with 7-day and 1-day reminders for '+list.length+' saved deadlines. Import it into your calendar app; reminder support varies. Verify organizer cutoff times.';
});
function render(){renderComparison();renderRecommendations();renderGoogleCalendar();downloadButton.disabled=!saved().some(future)}
store.watch(render);
document.addEventListener('sob-catalog-ready',render);
document.addEventListener('sob-programs-updated',render);
render();
})();
