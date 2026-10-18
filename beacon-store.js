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
 const detail=document.getElementById('sob-current-account');
 if(detail){detail.hidden=!user;detail.textContent=user?'Signed in as '+String(user.email||user.user_metadata?.full_name||'your account'):'';}
}
async function refreshAdminLink(){
 const link=document.getElementById('sob-admin-dashboard');
 if(!link)return;
 link.hidden=true;
 if(!user||!db)return;
 const activeId=user.id;
 const {data,error}=await db.rpc('is_report_admin');
 if(!error&&data&&user?.id===activeId)link.hidden=false;
}
async function session(s){
 const incoming=s?.user||null;
 if(incoming&&user?.id===incoming.id&&ready)return;
 user=incoming;account={};ready=false;notify();authNotice();
 if(!user){refreshAdminLink();return}
 const{data,error}=await db.from('student_saves').select('program_id,favorited,notes,application_status').eq('user_id',user.id);
 if(error){message('Could not load account saves; contact the site administrator.');return}
 for(const row of data||[])account[row.program_id]={favorited:row.favorited,notes:row.notes,application_status:row.application_status};
 ready=true;notify();authNotice();
 refreshAdminLink();
}
function initUI(){
 const nav=document.querySelector('header .nav');if(!nav)return;
 const controls=document.createElement('div');controls.className='sob-header-actions';
 controls.innerHTML='<a href="./dashboard.html">My Dashboard</a> <a href="./?saved=1#opportunities">♥ Saved (<span data-saved-count>0</span>)</a> <button type="button" id="sob-account-button">Sign in</button>';nav.appendChild(controls);
 const panel=document.createElement('div');panel.id='sob-panel';panel.hidden=true;
 panel.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="sob-title"><button type="button" id="sob-close" aria-label="Close">×</button><h2 id="sob-title">Save your opportunities</h2><p id="sob-auth-message"></p><p id="sob-current-account" class="sob-current-account" hidden></p><div id="sob-google-container"><button type="button" id="sob-google-login">Continue with Google</button><p class="fine">Or use an email sign-in link:</p></div><form id="sob-login-form"><label for="sob-email">Email</label><input id="sob-email" type="email" autocomplete="email" required><button type="submit">Send a sign-in link</button></form><a href="./admin.html" id="sob-admin-dashboard" hidden>Manage reports, programs &amp; site statistics →</a><button type="button" id="sob-logout" hidden>Sign out</button><p class="fine">No password needed. Save only application notes, not confidential personal information. Guest data stays in this browser.</p><p role="status" id="sob-sync-status"></p></section>';
 document.body.appendChild(panel);
 const css=document.createElement('style');css.textContent='.sob-header-actions{display:flex;align-items:center;gap:12px;font-size:13px;font-weight:700}.sob-header-actions a{text-decoration:none;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;border:1px solid #d6dfec;border-radius:10px;padding:11px 14px;background:#fff;color:#24334d;font-size:14px;transition:background .15s,border-color .15s}.sob-header-actions a:hover,.sob-header-actions a:focus-visible{background:#fff0ea;border-color:#e78c67}.sob-header-actions button,#sob-panel button{font:inherit;font-weight:700;cursor:pointer;background:#19253d;color:#fff;border:0;border-radius:9px;padding:11px 14px}.sob-header-actions button{white-space:nowrap}#sob-panel[hidden]{display:none}#sob-panel{position:fixed;inset:0;background:#12203bb0;display:grid;place-items:center;z-index:100;padding:20px}#sob-panel section{background:white;width:min(460px,100%);padding:25px;border-radius:18px}#sob-panel section h2{margin:8px 0}#sob-close{float:right}#sob-panel input{display:block;width:100%;padding:12px;border:1px solid #c6cfda;border-radius:8px;margin:8px 0}#sob-panel label{font-weight:700}#sob-panel p{line-height:1.5;color:#52647a}#sob-panel .fine{font-size:12px}#sob-panel button[hidden],#sob-login-form[hidden],#sob-google-container[hidden],#sob-admin-dashboard[hidden]{display:none}#sob-admin-dashboard{display:block;margin:13px 0;padding:12px 14px;background:#fff0e9;color:#873819;border-radius:10px;font-weight:750;text-decoration:none}#sob-google-login{background:white!important;color:#19253d!important;border:1px solid #bdc7d5!important;width:100%;margin:12px 0 2px}#sob-google-login:hover{background:#f3f6fa!important}@media(max-width:900px){header .nav{flex-wrap:wrap}.sob-header-actions{margin-left:auto}}@media(max-width:600px){.sob-header-actions{order:3;flex:1 1 100%;width:100%;margin:0;flex-wrap:wrap;justify-content:center;gap:7px}.sob-header-actions a,.sob-header-actions button{min-height:44px;padding:10px 12px;font-size:13px}.sob-header-actions a{white-space:normal;flex:1 1 auto}#sob-panel{padding:12px;align-items:center;overflow-y:auto}#sob-panel section{max-height:calc(100dvh - 24px);overflow-y:auto;overscroll-behavior:contain;padding:19px}.sob-header-actions button{flex:1 1 auto}}';css.textContent+='.sob-header-actions #sob-account-button{max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}.sob-current-account{overflow-wrap:anywhere;font-weight:750;color:#19253d!important;padding:12px;background:#f3f6fb;border:1px solid #d6dfec;border-radius:9px}@media(max-width:600px){.sob-header-actions #sob-account-button{max-width:100%;flex:1 1 100%}}';document.head.appendChild(css);
 const open=document.getElementById('sob-account-button'),form=document.getElementById('sob-login-form'),logout=document.getElementById('sob-logout');
 const googleContainer=document.getElementById('sob-google-container');
 const refresh=()=>{
 const email=user?String(user.email||'').trim():'';
 const name=user?String(user.user_metadata?.full_name||user.user_metadata?.name||'').trim():'';
 open.textContent=user?(email||name||'My account'):enabled?'Sign in':'Sign in (soon)';
 open.title=user?'Signed in as '+(email||name||'your account'):'Open sign-in';
 open.setAttribute('aria-label',open.title);
 form.hidden=Boolean(user)||!enabled;googleContainer.hidden=Boolean(user)||!enabled;logout.hidden=!user;authNotice()
};
 open.onclick=()=>{refresh();panel.hidden=false};document.getElementById('sob-close').onclick=()=>panel.hidden=true;
 panel.addEventListener('click',e=>{if(e.target===panel)panel.hidden=true});document.addEventListener('keydown',e=>{if(e.key==='Escape')panel.hidden=true});
 document.getElementById('sob-google-login').onclick=async()=>{if(!db){message('Sign-in service is loading. Please try again.');return}message('Redirecting to Google…');const {error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname+location.search}});if(error)message('Google sign-in could not start. Please check that Google is enabled in Supabase.')};
 form.onsubmit=async e=>{e.preventDefault();if(!db)return;message('Sending sign-in link…');const email=document.getElementById('sob-email').value.trim();const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname+location.search}});message(error?'Sign-in email could not be sent.':'Check your email for your sign-in link.')};
 logout.onclick=async()=>{await db.auth.signOut();refresh()};
 watchers.push(refresh);notify();
}
async function init(){
 initUI();if(!enabled)return;
 try{
  await new Promise((ok,bad)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';s.onload=ok;s.onerror=bad;document.head.appendChild(s)});
  db=window.supabase.createClient(config.supabaseUrl,config.publishableKey);
  // INITIAL_SESSION handles returning OAuth redirects and restored browser sessions.
  // Do not race it against a separate getSession() call, which could reset signed-in UI.
  db.auth.onAuthStateChange((event,s)=>{
    if(['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT','TOKEN_REFRESHED','USER_UPDATED'].includes(event)){
      setTimeout(()=>session(s),0);
    }
  });
  const fragment=new URLSearchParams(location.hash.slice(1));
  const query=new URLSearchParams(location.search);
  const authError=fragment.get('error_description')||query.get('error_description');
  if(authError)message('Google sign-in response: '+authError.slice(0,220));
 }catch{message('Sign-in is temporarily unavailable. Guest favorites still work.')}
}
async function submitReport(kind,details,programId,pageUrl){
 if(!db)return {ok:false,message:'Sign-in is still loading. Please try again.'};
 const {data:{user:active},error:authError}=await db.auth.getUser();
 if(authError||!active)return {ok:false,message:'Please sign in with Google or email before submitting a report.'};
 const {error}=await db.from('student_reports').insert({
  user_id:active.id,category:kind,details:details.slice(0,2000),
  program_id:programId||null,page_url:pageUrl.slice(0,500)
 });
 return error?{ok:false,message:'Report could not be sent. The reporting database may not be set up yet.'}:{ok:true,message:'Report submitted. Thank you for helping improve Student Opportunities NYC!'};
}
async function submitSuggestion(draft){
 if(!db)return {ok:false,message:'Sign-in is still loading. Try again shortly.'};
 const {data:{user:active},error:authError}=await db.auth.getUser();
 if(authError||!active)return {ok:false,message:'Please sign in using the Account button before suggesting a program.'};
 const {error}=await db.from('program_suggestions').insert({
  user_id:active.id,program_name:draft.program_name,
  organization:draft.organization,official_url:draft.official_url,details:draft.details
 });
 return error?{ok:false,message:'Could not submit. The suggestion database may not be set up yet.'}:
  {ok:true,message:'Thank you! Your suggestion was sent to the site administrator for review.'};
}
window.BeaconStore={get,save,submitReport,submitSuggestion,watch:f=>watchers.push(f),count:()=>Object.values(current()).filter(x=>x.favorited).length,enabled:()=>enabled};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();