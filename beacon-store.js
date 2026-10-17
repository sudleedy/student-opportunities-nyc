/* Guest storage and optional Supabase synchronization. */
(()=>{'use strict';
const KEY='sob-guest-v1',config=window.SOB_AUTH_CONFIG||{};
let guest={},account={},user=null,db=null,ready=false;const watchers=[];
try{guest=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
const enabled=Boolean(config.supabaseUrl&&config.publishableKey);
const current=()=>user?account:guest;
const get=id=>current()[id]||{favorited:false,notes:'',application_status:'Interested'};
const notify=()=>{watchers.forEach(f=>f());document.querySelectorAll('[data-saved-count]').forEach(e=>e.textContent=Object.values(current()).filter(x=>x.favorited).length)};
function message(t){const el=document.getElementById('sob-sync-status');if(el)el.textContent=t}
async function save(id,changes){
 if(user&&!ready){message('Account data has not loaded. Try again shortly.');return false}
 const prior=get(id),next={...prior,...changes};next.notes=String(next.notes||'').slice(0,1500);
 if(!['Interested','Planning to apply','Applied','Completed'].includes(next.application_status))next.application_status='Interested';
 current()[id]=next;notify();
 if(!user){try{localStorage.setItem(KEY,JSON.stringify(guest));message('Saved to this browser.')}catch{message('Could not save in this browser.')}return true}
 const {error}=await db.from('student_saves').upsert({user_id:user.id,program_id:id,...next},{onConflict:'user_id,program_id'});
 if(error){current()[id]=prior;notify();message('Account sync failed; try again.');return false}
 message('Saved to your account.');return true;
}
function authNotice(){
 const el=document.getElementById('sob-auth-message');if(el)el.textContent=user?'Signed in. Your saved work syncs between devices.':enabled?'Sign in to sync favorites and notes.':'Sign-in setup pending. You can save programs in this browser meanwhile.';
}
async function session(s){
 user=s?.user||null;account={};ready=false;notify();authNotice();
 if(!user)return;
 const{data,error}=await db.from('student_saves').select('program_id,favorited,notes,application_status').eq('user_id',user.id);
 if(error){message('Could not load account saves; contact the site administrator.');return}
 for(const row of data||[])account[row.program_id]={favorited:row.favorited,notes:row.notes,application_status:row.application_status};
 ready=true;notify();authNotice();
}
function initUI(){
 const nav=document.querySelector('header .nav');if(!nav)return;
 const controls=document.createElement('div');controls.className='sob-header-actions';
 controls.innerHTML='<a href="./?saved=1#opportunities">♥ Saved (<span data-saved-count>0</span>)</a> <button type="button" id="sob-account-button">Sign in</button>';nav.appendChild(controls);
 const panel=document.createElement('div');panel.id='sob-panel';panel.hidden=true;
 panel.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="sob-title"><button type="button" id="sob-close" aria-label="Close">×</button><h2 id="sob-title">Save your opportunities</h2><p id="sob-auth-message"></p><form id="sob-login-form"><label for="sob-email">Email</label><input id="sob-email" type="email" autocomplete="email" required><button type="submit">Send a sign-in link</button></form><button type="button" id="sob-logout" hidden>Sign out</button><p class="fine">No password needed. Save only application notes, not confidential personal information. Guest data stays in this browser.</p><p role="status" id="sob-sync-status"></p></section>';
 document.body.appendChild(panel);
 const css=document.createElement('style');css.textContent='.sob-header-actions{display:flex;align-items:center;gap:12px;font-size:13px;font-weight:700}.sob-header-actions a{text-decoration:none;white-space:nowrap}.sob-header-actions button,#sob-panel button{font:inherit;font-weight:700;cursor:pointer;background:#19253d;color:#fff;border:0;border-radius:9px;padding:11px 14px}.sob-header-actions button{white-space:nowrap}#sob-panel[hidden]{display:none}#sob-panel{position:fixed;inset:0;background:#12203bb0;display:grid;place-items:center;z-index:100;padding:20px}#sob-panel section{background:white;width:min(460px,100%);padding:25px;border-radius:18px}#sob-panel section h2{margin:8px 0}#sob-close{float:right}#sob-panel input{display:block;width:100%;padding:12px;border:1px solid #c6cfda;border-radius:8px;margin:8px 0}#sob-panel label{font-weight:700}#sob-panel p{line-height:1.5;color:#52647a}#sob-panel .fine{font-size:12px}#sob-panel button[hidden],#sob-login-form[hidden]{display:none}@media(max-width:900px){header .nav{flex-wrap:wrap}.sob-header-actions{margin-left:auto}}';document.head.appendChild(css);
 const open=document.getElementById('sob-account-button'),form=document.getElementById('sob-login-form'),logout=document.getElementById('sob-logout');
 const refresh=()=>{open.textContent=user?'Account':enabled?'Sign in':'Sign in (soon)';form.hidden=Boolean(user)||!enabled;logout.hidden=!user;authNotice()};
 open.onclick=()=>{refresh();panel.hidden=false};document.getElementById('sob-close').onclick=()=>panel.hidden=true;
 panel.addEventListener('click',e=>{if(e.target===panel)panel.hidden=true});document.addEventListener('keydown',e=>{if(e.key==='Escape')panel.hidden=true});
 form.onsubmit=async e=>{e.preventDefault();if(!db)return;message('Sending sign-in link…');const email=document.getElementById('sob-email').value.trim();const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname+location.search}});message(error?'Sign-in email could not be sent.':'Check your email for your sign-in link.')};
 logout.onclick=async()=>{await db.auth.signOut();refresh()};
 watchers.push(refresh);notify();
}
async function init(){
 initUI();if(!enabled)return;
 try{
  await new Promise((ok,bad)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';s.onload=ok;s.onerror=bad;document.head.appendChild(s)});
  db=window.supabase.createClient(config.supabaseUrl,config.publishableKey);
  db.auth.onAuthStateChange((event,s)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT')setTimeout(()=>session(s),0)});
  const{data}=await db.auth.getSession();await session(data.session);
 }catch{message('Sign-in is temporarily unavailable. Guest favorites still work.')}
}
window.BeaconStore={get,save,watch:f=>watchers.push(f),count:()=>Object.values(current()).filter(x=>x.favorited).length,enabled:()=>enabled};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();