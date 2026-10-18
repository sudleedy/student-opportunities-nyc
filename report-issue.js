/* Student feedback form: private Supabase submissions from signed-in students. */
(()=>{'use strict';

function init(){
 const btn=document.createElement('button');
 btn.type='button';btn.id='sob-report-button';btn.textContent='⚑ Report an Issue';
 const footer=document.querySelector('footer');
 if(!footer)return;
 footer.prepend(btn);
 const headerNav=document.querySelector('header .nav');
 if(headerNav){
  const top=btn.cloneNode(true);
  top.id='sob-report-header';
  top.textContent='⚑ Report an Issue';
  top.className='sob-report-top';
  const account=headerNav.querySelector('.sob-header-actions');
  account?headerNav.insertBefore(top,account):headerNav.appendChild(top);
  top.addEventListener('click',()=>openReport());
 }
 const modal=document.createElement('div');modal.id='sob-report-modal';modal.hidden=true;
 modal.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="sob-report-heading"><button type="button" id="sob-report-close" aria-label="Close report form">×</button><h2 id="sob-report-heading">Report an issue</h2><p>Help us keep Student Opportunities NYC accurate and easy to use.</p><form id="sob-report-form"><label for="sob-report-kind">What needs fixing?</label><select id="sob-report-kind" required><option value="Outdated program information">Outdated program information</option><option value="Incorrect eligibility or deadline">Incorrect eligibility or deadline</option><option value="Broken program link">Broken program link</option><option value="Website bug">Website bug</option><option value="Other feedback">Other feedback</option></select><label for="sob-report-details">Describe the issue</label><textarea id="sob-report-details" maxlength="2000" rows="5" required minlength="10" placeholder="What is wrong, and what should be corrected?"></textarea><p class="sob-report-small">Please sign in with Google or email first. Reports are private and visible to the site administrator. Do not include sensitive personal information.</p><button type="submit" class="sob-report-send">Submit report</button></form><p class="sob-report-small" id="sob-report-feedback" role="status"></p></section>';
 document.body.appendChild(modal);
 const style=document.createElement('style');
 style.textContent='#sob-report-button{margin:0 12px 10px;padding:10px 16px;border-radius:10px;background:#fff;color:#19253d;border:1px solid #c9d3e1;font:inherit;font-weight:750;cursor:pointer}#sob-report-button:hover{background:#eaf0f8}.sob-report-top{font:inherit;font-size:14px;font-weight:800;background:#fff0e9;color:#8d351b;border:2px solid #e99779;border-radius:10px;padding:11px 14px;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px #87402012}.sob-report-top:hover,.sob-report-top:focus-visible{background:#ffe0d1;border-color:#bf5a35}.sob-report-send:disabled{opacity:.6;cursor:wait}@media(max-width:900px){.sob-report-top{margin-left:auto}}@media(max-width:560px){.sob-report-top{font-size:13px;padding:10px 12px}}#sob-report-modal[hidden]{display:none}#sob-report-modal{position:fixed;inset:0;z-index:110;background:#13223ac4;display:grid;place-items:center;padding:16px}#sob-report-modal section{background:white;color:#19253d;border-radius:18px;padding:26px;width:min(490px,100%);max-height:92vh;overflow:auto;text-align:left}#sob-report-modal h2{margin:5px 0 8px}#sob-report-modal p{line-height:1.5;color:#5c6b80}#sob-report-close{float:right;cursor:pointer;border:0;border-radius:9px;font-size:23px;padding:4px 11px;background:#ecf0f5}#sob-report-modal label{display:block;font-weight:700;margin:15px 0 7px}#sob-report-modal select,#sob-report-modal textarea{width:100%;border:1px solid #c6d0de;border-radius:10px;padding:11px;color:#19253d;font:inherit}#sob-report-modal textarea{resize:vertical}#sob-report-modal .sob-report-send{border:0;background:#19253d;color:white;padding:13px 17px;border-radius:10px;font-weight:750;cursor:pointer;margin-top:14px}#sob-report-modal .sob-report-small{font-size:12px}';
 document.head.appendChild(style);
 const close=()=>{modal.hidden=true;btn.focus()};
 const openReport=()=>{modal.hidden=false;document.getElementById('sob-report-kind').focus()};
 btn.onclick=openReport;
 document.getElementById('sob-report-close').onclick=close;
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
 document.getElementById('sob-report-form').onsubmit=async e=>{
  e.preventDefault();
  const kind=document.getElementById('sob-report-kind').value;
  const detail=document.getElementById('sob-report-details').value.trim();
  const status=document.getElementById('sob-report-feedback');
  if(detail.length<10){status.textContent='Please provide at least 10 characters.';return}
  const form=e.currentTarget;
  const submit=form.querySelector('button[type="submit"]');
  submit.disabled=true;status.textContent='Submitting report…';
  const id=new URLSearchParams(location.search).get('id');
  const page=location.origin+location.pathname+(id?'?id='+encodeURIComponent(id):'');
  try{
   const result=await window.BeaconStore.submitReport(kind,detail,id,page);
   status.textContent=result.message;
   if(result.ok)form.reset();
  }catch(err){console.error('Report submission failed',err);status.textContent='Report submission failed. Please refresh and try again.'}
  finally{submit.disabled=false}

 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();