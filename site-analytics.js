/* Count aggregate page loads without IPs, cookies or user identifiers. */
(()=>{'use strict';
const config=window.SOB_AUTH_CONFIG||{};
if(!config.supabaseUrl||!config.publishableKey)return;
const page=document.body.dataset.pageKind||(
 location.pathname.endsWith('/dashboard.html')?'dashboard':
 location.pathname.endsWith('/program.html')?'program':'home');
if(!['home','program','dashboard'].includes(page))return;
fetch(config.supabaseUrl+'/rest/v1/rpc/record_site_page_view',{
 method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},
 body:JSON.stringify({kind:page}),keepalive:true
}).catch(()=>{});
})();