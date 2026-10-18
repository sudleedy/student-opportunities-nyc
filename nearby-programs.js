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
const types=/\b(compass high|ladders for leaders|summer youth employment|syep|beacon|cornerstone|advance\s*&\s*earn|learn\s*&\s*earn|train\s*&\s*earn|high school youth|youth council|workforce|internship|job readiness|careerready|career first|emerging leaders)\b/i;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
host.innerHTML='<div class="local-heading"><div><p class="local-kicker">AUTOMATIC NYC PROGRAM DISCOVERY</p><h2>Discover more programs near you</h2><p>See what you could do at local youth programs. Choose a borough or optionally find nearby sites. Activities vary by provider.</p></div><a href="'+DIRECTORY+'" target="_blank" rel="noopener noreferrer">Search the full NYC program directory ↗</a></div>'+
'<div class="local-controls"><label for="local-borough">Your borough</label><select id="local-borough"><option value="">Choose a borough</option>'+boros.map(b=>'<option value="'+b+'">'+b+'</option>').join('')+'</select>'+
'<button type="button" id="local-position">◎ Use my location</button><button type="button" id="local-refresh" disabled>Refresh results</button></div>'+
'<p id="local-feedback" class="local-feedback" role="status" aria-live="polite">Choose a borough to load additional NYC youth program locations. Your borough preference stays in this browser.</p>'+
'<nav id="local-pagination-top" class="local-pagination" aria-label="Nearby program pages (top)"></nav>'+
'<div id="local-results" class="local-grid"></div>'+
'<nav id="local-pagination-bottom" class="local-pagination" aria-label="Nearby program pages (bottom)"></nav>'+
'<p class="local-disclaimer">These are <strong>DYCD-funded program sites</strong>, not independently checked application openings. The examples above describe typical activities for each program type, not a verified schedule at a specific site. They may include after-school, career-readiness, and other youth services. Confirm your grade eligibility, registration, costs and openings with the provider. <a href="'+POLICY+'" target="_blank" rel="noopener noreferrer">NYC Open Data source ↗</a>. We do not store or transmit GPS coordinates.</p>';
const boroughEl=host.querySelector('#local-borough'),feedback=host.querySelector('#local-feedback'),results=host.querySelector('#local-results');
const refresh=host.querySelector('#local-refresh'),locate=host.querySelector('#local-position');
const PER_PAGE=9, pagers=[host.querySelector('#local-pagination-top'),host.querySelector('#local-pagination-bottom')];
let active=0,coords=null,cache=new Map(),lastKey='',visible=[],page=1,visibleLabel='';
try{const saved=localStorage.getItem('sob-borough-v1');if(boros.includes(saved))boroughEl.value=saved}catch{}
const asNumber=value=>Number.isFinite(Number(value))?Number(value):null;
const miles=(a,b,c,d)=>{
 const toRad=x=>x*Math.PI/180;
 const deltaLat=toRad(c-a),deltaLon=toRad(d-b);
 const n=Math.sin(deltaLat/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(deltaLon/2)**2;
 return 3959*2*Math.atan2(Math.sqrt(n),Math.sqrt(Math.max(0,1-n)));
};
const nameOf=r=>String(r.program_site_name||r.provider||'Program site').trim();
const normalizeBoro=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const boroOf=r=>{const b=normalizeBoro(r.borough);if(b==='staten island')return 'Staten Island';return boros.find(k=>normalizeBoro(k)===b)||String(r.borough||'NYC')};
const relevant=r=>{
 const text=[r.program_type,r.program_area].filter(Boolean).join(' ');
 return types.test(text)||String(r.service_category||'').toLowerCase().includes('jobs and internships')&&/youth|high school|student|internship|career|employment/i.test(text);
};

/* The city lists locations and program types, but not individual site activity schedules.
   Examples below describe DYCD program models, not guaranteed local offerings. */
function explain(r){
 const name=String(r.program_type||'').toLowerCase()+' '+String(r.program_area||'').toLowerCase();
 const model=(activity,audience,url)=>({activity,audience,url});
 if(/\bladders?\s*(?:for)?\s*leaders\b|\blfl\b/.test(name))
  return model('Practice interviews, resumes and workplace skills, then seek a paid professional summer internship. Actual work depends on the company placement.','Generally NYC high school or college students ages 16–24 with prior work or volunteer experience.','https://www.nyc.gov/site/dycd/families/nyc-ladders-for-leaders.page');
 if(/\blearn\s*(?:&|and)\s*earn\b/.test(name))
  return model('Get academic and college-application help, learn workplace skills, join service projects and leadership activities, and potentially complete a paid summer internship.','Generally eligible NYC high school juniors and seniors ages 16–21.','https://www.nyc.gov/site/dycd/services/jobs-internships/learn-and-earn.page');
 if(/\bwork\s*,?\s*learn\s*(?:&|and)\s*grow\b|\bwlg\b/.test(name))
  return model('Try career-readiness workshops, explore college courses or credit, and gain paid work experience. Activities depend on the program track.','Generally NYC students ages 16–20; school and program criteria vary.','https://www.nyc.gov/site/dycd/services/jobs-internships/work-learn-grow-employment-program.page');
 if(/\bcareer\s*ready\b|\bcareerready\b|\bcareerfirst\b/.test(name))
  return model('Explore careers in group sessions, practice team and job skills, and do paid projects or summer work, depending on your age and program track.','Some tracks require enrollment at participating NYC schools or designated communities.','https://www.nyc.gov/site/dycd/services/jobs-internships/syep-career-ready.page');
 if(/\bsyep\b|summer youth employment/.test(name))
  return model('Explore careers and practice communication and teamwork through paid summer activities. Students ages 14–15 usually complete project-based work; older teens may have jobs at partner worksites.','Usually NYC residents ages 14–24 who meet employment eligibility rules.','https://www.nyc.gov/site/dycd/services/jobs-internships/about-syep.page');
 if(/\bcompass[\s-]*high\b/.test(name))
  return model('Work with other ninth- and tenth-graders on hands-on projects, develop leadership and study skills, and explore education or career interests. Topics vary by location.','Designed for students in grades 9–10.','https://www.nyc.gov/site/dycd/services/after-school/youth-empowered-programs.page');
 if(/\bcompass[\s-]*explore\b/.test(name))
  return model('Explore one interest through creative, project-based after-school activities, working in groups and building confidence and leadership.','Serves several age groups; ask whether this site has teen sessions.','https://www.nyc.gov/site/dycd/services/after-school/youth-empowered-programs.page');
 if(/\bcompass\b/.test(name))
  return model('Join supervised after-school learning and enrichment activities. Ask the provider which projects and age groups this particular location offers.','COMPASS serves different school grades; some sites may not accept high-school students.','https://www.nyc.gov/site/dycd/services/after-school/COMPASS_program_model.page');
 if(/\bbeacon\b|\bcornerstone\b/.test(name))
  return model('Join community-center programs that may include art, recreation, fitness, group learning and neighborhood activities. Available classes depend on the center.','Children, teens and adults may attend different sessions; ask about the teen schedule.','https://www.nyc.gov/site/dycd/services/DYCD_universal_applications.page');
 if(/\badvance\s*(?:&|and)\s*earn\b|\btrain\s*(?:&|and)\s*earn\b/.test(name))
  return model('Explore jobs, train for credentials in fields such as healthcare or technology, and potentially complete a paid internship with job-search assistance.','Primarily for ages 16–24 who are out of school and out of work—not usually enrolled high-school students.','https://www.nyc.gov/site/dycd/services/jobs-internships.page');
 if(/\bnda\b|neighborhood development area/.test(name))
  return model('Get educational or college-planning support, develop leadership and conflict-resolution skills, and explore careers. Specific services vary.','The provider must confirm its age groups and participation requirements.','https://www.nyc.gov/site/dycd/services/services.page');
 if(/\byouth council\b|youth leadership/.test(name))
  return model('Talk with other youth about neighborhood issues, help organize projects and practice teamwork, public speaking and leadership.','Council ages and activities vary by organizer.','https://www.nyc.gov/site/dycd/services/services.page');
 if(/\binternship\b|\bworkforce\b|\bjob readiness\b|\bcareer\b/.test(name))
  return model('Take part in career exploration, job preparation or work experience. The city record does not say what this particular placement involves.','Contact the provider about age, school enrollment, paid work and schedule rules.','https://www.nyc.gov/site/dycd/services/jobs-internships.page');
 return model('The city lists this program location, but does not publish the actual workshops, classes or tasks. Ask the provider for a current list of activities.','Age, grade and registration requirements have not been confirmed.','https://www.nyc.gov/site/dycd/services/services.page');
}

function prepare(rows,nearby,borough){
 const found=new Map(),yearNow=new Date().getFullYear();
 for(const r of rows){
  if(!r||!relevant(r))continue;
  const year=Number(r.date),lat=asNumber(r.latitude),lon=asNumber(r.longitude);
  if(Number.isFinite(year)&&year<yearNow-1)continue;
  const title=nameOf(r),type=String(r.program_type||'DYCD youth program').trim(),boro=boroOf(r);
  if(!title||title.length<3||!boros.includes(boro)||(borough&&boro!==borough))continue;
  const distance=nearby&&lat!==null&&lon!==null?miles(nearby.lat,nearby.lon,lat,lon):null;
  if(nearby&&(distance===null||distance>12))continue;
  const code=String(r.zipcode||'').replace(/[^0-9]/g,'').slice(0,5);
  const key=[type,title,code].map(x=>x.toLowerCase()).join('|');
  if(!found.has(key)||year>Number(found.get(key).date||0))found.set(key,{...r,program_type:type,program_site_name:title,borough:boro,zipcode:code,distance});
 }
 const candidates=[...found.values()];
 candidates.sort((a,b)=>nearby?(a.distance??Infinity)-(b.distance??Infinity)||Number(b.date)-Number(a.date):Number(b.date)-Number(a.date)||nameOf(a).localeCompare(nameOf(b)));
 return candidates;
}
function renderPager(){
 const total=visible.length, pages=Math.ceil(total/PER_PAGE);
 if(pages<=1){pagers.forEach(p=>p.innerHTML='');return;}
 const first=(page-1)*PER_PAGE+1,last=Math.min(page*PER_PAGE,total);
 const buttons=[];
 for(let n=1;n<=pages;n++){
  if(pages>7&&n!==1&&n!==pages&&Math.abs(n-page)>2){
   if(n===2||n===pages-1)buttons.push('<span class="local-pagination-ellipsis" aria-hidden="true">…</span>');
   continue;
  }
  buttons.push('<button type="button" data-local-page="'+n+'" '+(n===page?'aria-current="page" ':'')+'aria-label="Nearby programs page '+n+'">'+n+'</button>');
 }
 const html='<span class="local-pagination-summary">Showing '+first+'–'+last+' of '+total+' programs</span>'+
 '<button type="button" data-local-page="'+(page-1)+'" '+(page===1?'disabled ':'')+'aria-label="Previous nearby programs page">← Previous</button>'+
 buttons.join('')+
 '<button type="button" data-local-page="'+(page+1)+'" '+(page===pages?'disabled ':'')+'aria-label="Next nearby programs page">Next →</button>';
 pagers.forEach(p=>p.innerHTML=html);
}
function clearResults(){
 visible=[];page=1;visibleLabel='';
 pagers.forEach(p=>p.innerHTML='');
 results.innerHTML='';
}
function renderPage(){
 const total=visible.length;
 if(!total){results.innerHTML='<div class="local-empty">No matching high-school or youth program locations were found for this search. Try another borough or the full official directory.</div>';feedback.textContent='No matches found '+visibleLabel+'.';renderPager();return;}
 const first=(page-1)*PER_PAGE,last=Math.min(page*PER_PAGE,total);
 results.innerHTML=visible.slice(first,last).map(r=>{
  const type=escape(r.program_type||'Youth program'),name=escape(nameOf(r)),provider=escape(r.provider||'City-funded provider');
  const place=escape([r.borough,r.zipcode].filter(Boolean).join(' · ')),dist=r.distance===null?'':' · '+r.distance.toFixed(1)+' mi away';
  const activity=explain(r);
  return '<article class="local-program"><span class="local-tag">'+type+'</span><h3>'+name+'</h3><p>'+provider+'</p><div class="local-activity"><strong>What you might do</strong><p>'+escape(activity.activity)+'</p></div><p class="local-audience"><strong>Who it is usually for:</strong> '+escape(activity.audience)+'</p><p class="local-place">📍 '+place+escape(dist)+'</p><p class="local-unknown">Application status not verified · City data year: '+escape(r.date||'Unknown')+'</p><a class="local-model-link" href="'+activity.url+'" target="_blank" rel="noopener noreferrer">Read about this program type ↗</a><a href="'+DIRECTORY+'" target="_blank" rel="noopener noreferrer" aria-label="Verify '+name+' in NYC directory">Check program &amp; availability ↗</a></article>';
 }).join('');
 feedback.textContent='Showing '+(first+1)+'–'+last+' of '+total+' NYC-funded youth program locations '+visibleLabel+'. Application status varies; check the official directory.';
 renderPager();
}
function paint(found,label){
 visible=found;page=1;visibleLabel=label;
 renderPage();
}
pagers.forEach(p=>p.addEventListener('click',e=>{
 const button=e.target.closest('button[data-local-page]');
 if(!button||button.disabled)return;
 const next=Number(button.dataset.localPage),pages=Math.ceil(visible.length/PER_PAGE);
 if(!Number.isSafeInteger(next)||next<1||next>pages||next===page)return;
 page=next;renderPage();
 results.scrollIntoView({behavior:'smooth',block:'start'});
}));

async function search(borough,nearby,force=false){
 const queryKey=nearby?'gps':borough;if(!queryKey)return;
 const run=++active,lastLabel=nearby?'near your location':'in '+borough;
 lastKey=queryKey;refresh.disabled=true;locate.disabled=true;boroughEl.disabled=true;
 clearResults();
 feedback.textContent='Loading official NYC youth program sites '+lastLabel+'…';
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
  paint(prepare(rows,nearby,borough),lastLabel);
 }catch(e){
  if(run!==active)return;
  feedback.textContent='Could not load the city dataset right now. You can still search NYC’s official program directory directly.';
  clearResults();
  results.innerHTML='<p class="local-empty">Program data is temporarily unavailable. <a href="'+DIRECTORY+'" target="_blank" rel="noopener noreferrer">Search discoverDYCD ↗</a></p>';
 }finally{if(run===active){refresh.disabled=false;locate.disabled=false;boroughEl.disabled=false}}
}
boroughEl.addEventListener('change',()=>{
 coords=null;const b=boroughEl.value;
 try{if(b)localStorage.setItem('sob-borough-v1',b);else localStorage.removeItem('sob-borough-v1')}catch{}
 if(!b){active++;lastKey='';clearResults();feedback.textContent='Choose a borough to find youth programs.';refresh.disabled=true;return}
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
