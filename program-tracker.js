(()=>{'use strict';
const id=new URLSearchParams(location.search).get('id'),item=(window.PROGRAMS||[]).find(p=>p.id===id),store=window.BeaconStore;
if(!item||!store)return;
const parent=document.querySelector('.layout > div');if(!parent)return;
const panel=document.createElement('section');panel.className='panel sob-tracker';
const futureDate=item.deadlineISO&&/^\\d{4}-\\d{2}-\\d{2}$/.test(item.deadlineISO)&&new Date(item.deadlineISO+'T23:59:59').getTime()>Date.now();
const calendarButton=futureDate?'<button id="sob-calendar" type="button">📅 Add deadline to calendar</button>':'';
panel.innerHTML='<h2>My application tracker</h2><p>Bookmark this opportunity and keep your next steps organized.</p><div class="sob-track-actions"><button id="sob-fav-program" type="button">♡ Save favorite</button><button id="sob-copy-link" type="button">Copy shareable link</button>${calendarButton}</div><form id="sob-track-form"><label for="sob-status">My progress</label><select id="sob-status"><option>Interested</option><option>Planning to apply</option><option>Applied</option><option>Completed</option></select><label for="sob-notes">My notes (optional)</label><textarea id="sob-notes" rows="5" maxlength="1500" placeholder="Important requirements, questions to ask, next steps…"></textarea><p class="small">Avoid passwords, school IDs, or other sensitive personal information.</p><button type="submit" class="button sob-track-submit">Save progress</button><p id="sob-track-feedback" role="status" class="small"></p></form>';
parent.insertBefore(panel,parent.querySelector('.panel:last-child'));
const css=document.createElement('style');css.textContent='.sob-track-actions{display:flex;gap:11px;flex-wrap:wrap;margin:16px 0}.sob-track-actions button{background:#fff0e8;border:1px solid #e6baa7;color:#793f2c;border-radius:9px;padding:11px 14px;cursor:pointer;font:inherit;font-weight:750}.sob-track-actions button[aria-pressed=true]{background:#ffe3d3}.sob-tracker label{display:block;font-weight:750;margin:18px 0 7px}.sob-tracker select,.sob-tracker textarea{display:block;width:100%;font:inherit;color:#19253d;padding:12px;border:1px solid #c7d1df;border-radius:10px}.sob-tracker .sob-track-submit{border:0;cursor:pointer;margin:16px 0 7px}.sob-tracker p{margin-bottom:10px}.sob-tracker textarea{resize:vertical}';document.head.append(css);
const fav=document.getElementById('sob-fav-program'),form=document.getElementById('sob-track-form'),status=document.getElementById('sob-status'),notes=document.getElementById('sob-notes'),feedback=document.getElementById('sob-track-feedback');
let dirty=false;
const refresh=()=>{const data=store.get(id),f=Boolean(data.favorited);fav.textContent=f?'♥ Saved to favorites':'♡ Save favorite';fav.setAttribute('aria-pressed',String(f));if(!dirty){status.value=data.application_status||'Interested';notes.value=data.notes||''}};
refresh();store.watch(refresh);
form.addEventListener('input',()=>dirty=true);
fav.addEventListener('click',async()=>{const ok=await store.save(id,{favorited:!store.get(id).favorited});feedback.textContent=ok?'Favorite updated.':'Save failed. Please try again.'});
form.addEventListener('submit',async e=>{e.preventDefault();feedback.textContent='Saving…';const ok=await store.save(id,{application_status:status.value,notes:notes.value});if(ok){dirty=false;feedback.textContent='Progress saved.'}else feedback.textContent='Could not save progress. Please try again.'});
if(futureDate)document.getElementById('sob-calendar').addEventListener('click',()=>{
 const escICS=s=>String(s||'').replace(/\\\\/g,'\\\\\\\\').replace(/\r?\n/g,'\\\\n').replace(/,/g,'\\\\,').replace(/;/g,'\\\\;');
 const day=item.deadlineISO.replace(/-/g,''),next=new Date(item.deadlineISO+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
 const end=next.toISOString().slice(0,10).replace(/-/g,'');
 const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Student Opportunity Beacon//Deadline//EN','BEGIN:VEVENT','UID:'+encodeURIComponent(item.id)+'@student-opportunity-beacon','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\\.\\d{3}/,''),
 'DTSTART;VALUE=DATE:'+day,'DTEND;VALUE=DATE:'+end,'SUMMARY:'+escICS(item.title+' — application deadline'),
 'DESCRIPTION:'+escICS('Verify deadline and time zone with the official organizer. Listed deadline: '+item.deadline),
 'URL:'+item.url,'END:VEVENT','END:VCALENDAR'].join('\\r\\n');
 const link=document.createElement('a');const url=URL.createObjectURL(new Blob([body],{type:'text/calendar;charset=utf-8'}));
 link.href=url;link.download='deadline-'+item.id+'.ics';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 feedback.textContent='Calendar file created. Confirm the exact cutoff time on the official program website.';
});
document.getElementById('sob-copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);feedback.textContent='Link copied.'}catch{feedback.textContent='Copy the page address from your browser to share it.'}});
})();