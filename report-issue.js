/* Student feedback form: prepares a GitHub issue without storing private data. */
(()=>{'use strict';
const target='https://github.com/sudleedy/student-opportunities-nyc/issues/new';
function init(){
 const btn=document.createElement('button');
 btn.type='button';btn.id='sob-report-button';btn.textContent='⚑ Report an Issue';
 const footer=document.querySelector('footer');
 if(!footer)return;
 footer.prepend(btn);
 const modal=document.createElement('div');modal.id='sob-report-modal';modal.hidden=true;
 modal.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="sob-report-heading"><button type="button" id="sob-report-close" aria-label="Close report form">×</button><h2 id="sob-report-heading">Report an issue</h2><p>Help us keep Student Opportunities NYC accurate and easy to use.</p><form id="sob-report-form"><label for="sob-report-kind">What needs fixing?</label><select id="sob-report-kind" required><option value="Outdated program information">Outdated program information</option><option value="Incorrect eligibility or deadline">Incorrect eligibility or deadline</option><option value="Broken program link">Broken program link</option><option value="Website bug">Website bug</option><option value="Other feedback">Other feedback</option></select><label for="sob-report-details">Describe the issue</label><textarea id="sob-report-details" maxlength="2000" rows="5" required minlength="10" placeholder="What is wrong, and what should be corrected?"></textarea><p class="sob-report-small">Do not include personal information. Reports are public on GitHub. A free GitHub account is required to submit.</p><button type="submit" class="sob-report-send">Continue to submit report ↗</button></form><p class="sob-report-small" id="sob-report-feedback" role="status"></p></section>';
 document.body.appendChild(modal);
 const style=document.createElement('style');
 style.textContent='#sob-report-button{margin:0 12px 10px;padding:10px 16px;border-radius:10px;background:#fff;color:#19253d;border:1px solid #c9d3e1;font:inherit;font-weight:750;cursor:pointer}#sob-report-button:hover{background:#eaf0f8}#sob-report-modal[hidden]{display:none}#sob-report-modal{position:fixed;inset:0;z-index:110;background:#13223ac4;display:grid;place-items:center;padding:16px}#sob-report-modal section{background:white;color:#19253d;border-radius:18px;padding:26px;width:min(490px,100%);max-height:92vh;overflow:auto;text-align:left}#sob-report-modal h2{margin:5px 0 8px}#sob-report-modal p{line-height:1.5;color:#5c6b80}#sob-report-close{float:right;cursor:pointer;border:0;border-radius:9px;font-size:23px;padding:4px 11px;background:#ecf0f5}#sob-report-modal label{display:block;font-weight:700;margin:15px 0 7px}#sob-report-modal select,#sob-report-modal textarea{width:100%;border:1px solid #c6d0de;border-radius:10px;padding:11px;color:#19253d;font:inherit}#sob-report-modal textarea{resize:vertical}#sob-report-modal .sob-report-send{border:0;background:#19253d;color:white;padding:13px 17px;border-radius:10px;font-weight:750;cursor:pointer;margin-top:14px}#sob-report-modal .sob-report-small{font-size:12px}';
 document.head.appendChild(style);
 const close=()=>{modal.hidden=true;btn.focus()};
 btn.onclick=()=>{modal.hidden=false;document.getElementById('sob-report-kind').focus()};
 document.getElementById('sob-report-close').onclick=close;
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
 document.getElementById('sob-report-form').onsubmit=e=>{
  e.preventDefault();
  const kind=document.getElementById('sob-report-kind').value;
  const detail=document.getElementById('sob-report-details').value.trim();
  if(detail.length<10){document.getElementById('sob-report-feedback').textContent='Please provide at least 10 characters.';return}
  const id=new URLSearchParams(location.search).get('id');
  const program=(window.PROGRAMS||[]).find(p=>p.id===id);
  const page=location.origin+location.pathname+(id?'?id='+encodeURIComponent(id):'');
  const body='**Problem:** '+kind+'\n\n**Page:** '+page+(program?'\n**Program:** '+program.title:'')+'\n\n**Details:**\n'+detail+'\n\nPlease verify before making corrections.';
  const url=new URL(target);url.searchParams.set('title',kind+(program?' — '+program.title:''));url.searchParams.set('body',body);
  window.open(url.href,'_blank','noopener,noreferrer');
  document.getElementById('sob-report-feedback').textContent='A GitHub report page has opened. Sign in to GitHub and click Submit new issue to finish.';
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();