/* Location-aware city program discovery from NYC Open Data (DYCD Program Sites).
 * Never stores or sends browser GPS coordinates. Additional sites are visibly
 * separated from the hand-verified opportunity directory.
 */
(()=>{'use strict';
const host=document.getElementById('local-discovery');if(!host)return;
const SOURCE='https://data.cityofnewyork.us/resource/ebkm-iyma.json';
const DIRECTORY='https://discoverdycd.dycdconnect.nyc/program-public?nt=1';
const POLICY='https://data.cityofnewyork.us/Social-Services/DYCD-Program-Sites/ebkm-iyma';
const boros=['Brooklyn','Manhattan','Queens','Bronx','Staten Island'];
const types=/\\b(compass high|ladders for leaders|summer youth employment|syep|beacon|cornerstone|advance\\s*&\\s*earn|learn\\s*&\\s*earn|train\\s*&\\s*earn|high school youth|youth council|workforce|internship|job readiness|careerready|career first|emerging leaders)\\b/i;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
host.innerHTML='<div class="local-heading"><div><p class="local-kicker">AUTOMATIC NYC PROGRAM DISCOVERY</p><h2>Discover more programs near you</h2><p>Explore youth programs and internship providers from official NYC Open Data. Choose a borough, or optionally allow your browser to find nearby sites.</p></div><a href="'+DIRECTORY+'" target="_blank" rel="noopener noreferrer">Search the full NYC program directory ↗</a></div>'+
'<div class="local-controls"><label for="local-borough">Your borough</label><select id="local-borough"><option value="">Choose a borough</option>'+boros.map(b=>'<option value="'+b+'">'+b+'</option>').join('')+'</select>'+
'<button type="button" id="local-position">◎ Use my location</button><button type="button" id="local-refresh" disabled>Refresh results</button></div>'+
'<p id="local-feedback" class="local-feedback" role="status" aria-live="polite">Choose a borough to load additional NYC youth program locations. Your borough preference stays in this browser.</p>'+
'<div id="local-results" class="local-grid"></div>'+
'<p class="local-disclaimer">These are <strong>DYCD-funded program sites</strong>, not independently checked application openings. They may include after-school, career-readiness, and other youth services. Confirm your grade eligibility, registration, costs and openings with the provider. <a href="'+POLICY+'" target="_blank" rel="noopener noreferrer">NYC Open Data source ↗</a>. We do not store or transmit GPS coordinates.</p>';
const boroughEl=host.querySelector('#local-borough'),feedback=host.querySelector('#local-feedback'),results=host.querySelector('#local-results');
const refresh=host.querySelector('#local-refresh'),locate=host.querySelector('#local-position');
let active=0,coords=null,cache=new Map(),lastKey='';
try{const saved=localStorage.getItem('sob-borough-v1');if(boros.includes(saved))boroughEl.value=saved}catch{}
const asNumber=value=>Number.isFinite(Number(value))?Number(value):null;
const miles=(a,b,c,d)=>{
 const toRad=x=>x*Math.PI/180;
 const deltaLat=toRad(c-a),deltaLon=toRad(d-b);
 const n=Math.sin(deltaLat/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(deltaLon/2)**2;
 return 3959*2*Math.atan2(Math.sqrt(n),Math.sqrt(Math.max(0,1-n)));
};
const nameOf=r=>String(r.program_site_name||r.provider||'Program site').trim();
const normalizeBoro=s=>String(s||'').toLowerCase().replace(/\\s+/g,' ').trim();
const boroOf=r=>{const b=normalizeBoro(r.borough);if(b==='staten island')return 'Staten Island';return boros.find(k=>normalizeBoro(k)===b)||String(r.borough||'NYC')};
const relevant=r=>{
 const text=[r.program_type,r.program_area].filter(Boolean).join(' ');
 return types.test(text)||String(r.service_category||'').toLowerCase().includes('jobs and internships')&&/youth|high school|student|internship|career|employment/i.test(text);
};
function prepare(rows,nearby){
 const found=new Map(),yearNow=new Date().getFullYear();
 for(const r of rows){
  if(!r||!relevant(r))continue;
  const year=Number(r.date),lat=asNumber(r.latitude),lon=asNumber(r.longitude);
  if(Number.isFinite(year)&&year<yearNow-1)continue;
  const title=nameOf(r),type=String(r.program_type||'DYCD youth program').trim(),boro=boroOf(r);
  if(!title||title.length<3||!boros.includes(boro))continue;
  const distance=nearby&&lat!==null&&lon!==null?miles(nearby.lat,nearby.lon,lat,lon):null;
  if(nearby&&(distance===null||distance>12))continue;
  const code=String(r.zipcode||'').replace(/[^0-9]/g,'').slice(0,5);
  const key=[type,title,code].map(x=>x.toLowerCase()).join('|');
  if(!found.has(key)||year>Number(found.get(key).date||0))found.set(key,{...r,program_type:type,program_site_name:title,borough:boro,zipcode:code,distance});
 }
 const candidates=[...found.values()];
 candidates.sort((a,b)=>nearby?(a.distance??Infinity)-(b.distance??Infinity)||Number(b.date)-Number(a.date):Number(b.date)-Number(a.date)||nameOf(a).localeCompare(nameOf(b)));
 return candidates.slice(0,18);
}
function paint(found,label){
 if(!found.length){results.innerHTML='<div class="local-empty">No matching high-school or youth program locations were found for this search. Try another borough or the full official directory.</div>';feedback.textContent='No matches found '+label+'.';return}
 results.innerHTML=found.map(r=>{
  const type=escape(r.program_type||'Youth program'),name=escape(nameOf(r)),provider=escape(r.provider||'City-funded provider');
  const place=escape([r.borough,r.zipcode].filter(Boolean).join(' · ')),dist=r.distance===null?'':' · '+r.distance.toFixed(1)+' mi away';
  return '<article class="local-program"><span class="local-tag">'+type+'</span><h3>'+name+'</h3><p>'+provider+'</p><p class="local-place">📍 '+place+escape(dist)+'</p><p class="local-unknown">Application status not verified</p><a href="'+DIRECTORY+'" target="_blank" rel="noopener noreferrer" aria-label="Verify '+name+' in NYC directory">Check program &amp; availability ↗</a></article>';
 }).join('');
 feedback.textContent='Showing '+found.length+' additional NYC-funded youth program locations '+label+'. Check the official directory before applying.';
}
async function search(borough,nearby,force=false){
 const queryKey=nearby?'gps':borough;if(!queryKey)return;
 const run=++active,lastLabel=nearby?'near your location':'in '+borough;
 lastKey=queryKey;refresh.disabled=true;locate.disabled=true;boroughEl.disabled=true;
 feedback.textContent='Loading official NYC youth program sites '+lastLabel+'…';
 results.innerHTML='';
 try{
  const year=new Date().getFullYear();
  const params=new URLSearchParams();
  params.set('$select','date,program_area,program_type,service_category,provider,program_site_name,borough,zipcode,latitude,longitude');
  params.set('$where',"date >= "+(year-1)+(nearby?'':" AND borough = '"+borough+"'"));
  params.set('$order','date DESC');params.set('$limit',nearby?'7500':'2500');
  const url=SOURCE+'?'+params.toString();
  let rows=!force?cache.get(queryKey):null;
  if(!rows){
   const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),16000);
   try{
    const response=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Official data is temporarily unavailable');
    rows=await response.json();if(!Array.isArray(rows))throw new Error('Invalid city data');
    cache.set(queryKey,rows);
   }finally{clearTimeout(timer)}
  }
  if(run!==active)return;
  paint(prepare(rows,nearby),lastLabel);
 }catch(e){
  if(run!==active)return;
  feedback.textContent='Could not load the city dataset right now. You can still search NYC’s official program directory directly.';
  results.innerHTML='<p class="local-empty">Program data is temporarily unavailable. <a href="'+DIRECTORY+'" target="_blank" rel="noopener noreferrer">Search discoverDYCD ↗</a></p>';
 }finally{if(run===active){refresh.disabled=false;locate.disabled=false;boroughEl.disabled=false}}
}
boroughEl.addEventListener('change',()=>{
 coords=null;const b=boroughEl.value;
 try{if(b)localStorage.setItem('sob-borough-v1',b);else localStorage.removeItem('sob-borough-v1')}catch{}
 if(!b){active++;lastKey='';results.innerHTML='';feedback.textContent='Choose a borough to find youth programs.';refresh.disabled=true;return}
 search(b,null);
});
refresh.addEventListener('click',()=>{if(coords)search('',coords,true);else if(boroughEl.value)search(boroughEl.value,null,true)});
locate.addEventListener('click',()=>{
 if(!navigator.geolocation){feedback.textContent='Your browser does not support location sharing. Choose your borough instead.';return}
 locate.disabled=true;feedback.textContent='Waiting for optional browser location permission…';
 navigator.geolocation.getCurrentPosition(({coords:c})=>{
  locate.disabled=false;
  // Browser coordinates are used for distance calculations locally, never included in a request.
  const lat=Number(c.latitude),lon=Number(c.longitude);
  if(lat<40.45||lat>40.95||lon< -74.3||lon> -73.65){
   feedback.textContent='The location is outside NYC. Please select a borough to explore NYC programs.';return;
  }
  coords={lat,lon};boroughEl.value='';search('',coords);
 },()=>{
  locate.disabled=false;feedback.textContent='Location permission was not granted. Choose your borough instead.';
 },{enableHighAccuracy:false,timeout:12000,maximumAge:900000});
});
if(boroughEl.value)search(boroughEl.value,null);
})();
