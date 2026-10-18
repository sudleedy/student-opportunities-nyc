/* Submit student-suggested opportunities using an existing signed-in account. */
(()=>{'use strict';
const section=document.getElementById('contribute');if(!section)return;
const heading=section.querySelector('h2');
section.innerHTML='';
if(heading)section.appendChild(heading);
const intro=document.createElement('p');intro.textContent='Know a program we missed? Suggest it here. We review official information before publishing.';
section.appendChild(intro);
const form=document.createElement('form');form.id='suggestion-form';
form.innerHTML='<div class="suggestion-fields"><label>Program name *<input name="program_name" maxlength="140" required placeholder="Name of the opportunity"></label>'+
'<label>Organization *<input name="organization" maxlength="140" required placeholder="Who runs the program?"></label>'+
'<label class="wide">Official program website *<input type="url" name="official_url" maxlength="500" required placeholder="https://…"></label>'+
'<label class="wide">Why should we add it? (optional)<textarea name="details" maxlength="2000" rows="4" placeholder="Who can apply, what students do, or details worth checking"></textarea></label></div>'+
'<button type="submit">Send program suggestion →</button><p class="suggestion-note">Do not include personal contact details or private information. Sign-in is required to prevent spam.</p><p id="suggestion-feedback" role="status" aria-live="polite"></p>';
section.appendChild(form);
const css=document.createElement('style');
css.textContent='.suggestion-fields{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin:20px 0}.suggestion-fields label{font-size:13px;font-weight:750;color:#2b3d57}.suggestion-fields .wide{grid-column:1/-1}.suggestion-fields input,.suggestion-fields textarea{width:100%;display:block;font:inherit;padding:12px;margin-top:6px;border:1.5px solid #8298b6;border-radius:10px;background:#fff;color:#243451;box-shadow:0 1px 3px rgba(25,37,61,.04)}.suggestion-fields input:focus-visible,.suggestion-fields textarea:focus-visible{outline:3px solid #e59678;outline-offset:2px;border-color:#526b90}.suggestion-fields textarea{resize:vertical}.contribute form button{border:0;border-radius:10px;background:#19253d;color:#fff;padding:12px 19px;font:inherit;font-weight:800;cursor:pointer}.contribute form button:disabled{opacity:.6}.suggestion-note{font-size:12px!important}@media(max-width:650px){.suggestion-fields{grid-template-columns:1fr}.suggestion-fields .wide{grid-column:auto}}';
document.head.appendChild(css);
form.addEventListener('submit',async e=>{
 e.preventDefault();
 const feedback=document.getElementById('suggestion-feedback');
 const btn=form.querySelector('[type=submit]');
 const data=new FormData(form);
 let official_url=String(data.get('official_url')||'').trim();
 try{const u=new URL(official_url);if(u.protocol!=='https:')throw Error('HTTPS required');official_url=u.href}catch{feedback.textContent='Please enter the official HTTPS program website.';return}
 const draft={program_name:String(data.get('program_name')||'').trim(),organization:String(data.get('organization')||'').trim(),official_url,details:String(data.get('details')||'').trim()};
 if(!draft.program_name||!draft.organization)return;
 btn.disabled=true;feedback.textContent='Sending your suggestion…';
 const store=window.BeaconStore;
 const res=store?.submitSuggestion?await store.submitSuggestion(draft):{ok:false,message:'Account sign-in is still loading. Try again soon.'};
 feedback.textContent=res.message||'Please try again.';
 if(res.ok)form.reset();
 btn.disabled=false;
});
})();