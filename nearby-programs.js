/* Additional NYC DYCD program sites for the SAME nine-card opportunity list.
 * Borough is optional; browser GPS is only used locally and never sent to the dataset.
 * City sites are labeled unverified, unlike the individually reviewed curated catalog.
 */
(()=>{'use strict';
const SOURCE='https://data.cityofnewyork.us/resource/ebkm-iyma.json';
const DIRECTORY='https://discoverdycd.dycdconnect.nyc/program-public?nt=1';
const POLICY='https://data.cityofnewyork.us/Social-Services/DYCD-Program-Sites/ebkm-iyma';
const boros=['Brooklyn','Manhattan','Queens','Bronx','Staten Island'];
const types=/\\b(compass high|ladders for leaders|summer youth employment|syep|beacon|cornerstone|advance\\s*&\\s*earn|learn\\s*&\\s*earn|train\\s*&\\s*earn|high school youth|youth council|workforce|internship|job readiness|careerready|career first|emerging leaders)\\b/i;
const boroughEl=document.getElementById('nearby-borough'),locate=document.getElementById('nearby-position');
const refresh=document.getElementById('nearby-refresh'),feedback=document.getElementById('nearby-feedback');
if(!boroughEl||!locate||!refresh||!feedback)return;
let rows=[],coords=null,mode='none',running=0,busy=false,status='Choose a borough to include additional NYC youth programs.',cache=new Map();
const notify=()=>{
 feedback.textContent=status;
 document.dispatchEvent(new Event('sob-nearby-updated'));
};
const setBusy=value=>{busy=value;locate.disabled=value;refresh.disabled=value||mode==='none';boroughEl.disabled=value};
try{const prior=localStorage.getItem('sob-borough-v1');if(boros.includes(prior))boroughEl.value=prior}catch{}
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

function asItem(r){
 const activity=explain(r),site=nameOf(r),boro=boroOf(r);
 const typ=String(r.program_type||'DYCD youth program').trim();
 const text=[typ,r.program_area].filter(Boolean).join(' ').toLowerCase();
 const subject=/compass|beacon|cornerstone/.test(text)?'Community & Leadership':/leadership|council/.test(text)?'Community & Leadership':'Careers & Business';
 const rawGrades=/compass[\\s-]*high/.test(text)?[9,10]:[];
 return {
  kind:'city',id:'city:'+typ+':'+site+':'+(r.zipcode||''),
  title:site,org:String(r.provider||'City-funded provider'),type:typ,subject,
  location:boro,borough:boro,zipcode:r.zipcode||'',distance:r.distance,
  whatYouDo:activity.activity,eligibility:activity.audience,grades:rawGrades,
  summary:activity.activity,modelUrl:activity.url,url:DIRECTORY,
  date:String(r.date||''),sourceStatus:'city',sourceChecked:'',deadline:null,
  applicationState:'unknown',costCategory:'unknown',payCategory:'unknown',deliveryMode:'unknown'
 };
}
async function load(force=false){
 const borough=boroughEl.value,nearby=mode==='gps'?coords:null;
 if(!borough&&!nearby){running++;rows=[];setBusy(false);status='Choose a borough to include local city programs alongside the main listings.';notify();return}
 const key=nearby?'gps':borough,token=++running;
 setBusy(true);status='Looking up NYC-funded program locations…';notify();
 try{
  const year=new Date().getFullYear(),params=new URLSearchParams();
  params.set('$select','date,program_area,program_type,service_category,provider,program_site_name,borough,zipcode,latitude,longitude');
  params.set('$where','date >= '+(year-1)+(nearby?'':" AND borough = '"+borough+"'"));
  params.set('$order','date DESC');params.set('$limit',nearby?'7500':'2500');
  let data=force?null:cache.get(key);
  if(!data){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),16000);
   try{const response=await fetch(SOURCE+'?'+params.toString(),{signal:controller.signal,headers:{Accept:'application/json'}});
    if(!response.ok)throw Error('City data unavailable');
    data=await response.json();if(!Array.isArray(data))throw Error('Unexpected city data');cache.set(key,data);
   }finally{clearTimeout(timer)}
  }
  if(token!==running)return;
  rows=prepare(data,nearby,borough).map(asItem);
  status=rows.length?'Added '+rows.length+' city-funded program sites to the main results. Activities and openings vary by provider.':
  'No matching NYC youth program sites found. The curated programs are still available.';
 }catch{
  if(token!==running)return;
  rows=[];
  status='City data is temporarily unavailable. Curated listings still work; you can check discoverDYCD directly.';
 }finally{if(token===running){setBusy(false);notify()}}
}
boroughEl.addEventListener('change',()=>{
 mode=boroughEl.value?'borough':'none';coords=null;
 try{if(mode==='borough')localStorage.setItem('sob-borough-v1',boroughEl.value);else localStorage.removeItem('sob-borough-v1')}catch{}
 load();
});
refresh.addEventListener('click',()=>load(true));
locate.addEventListener('click',()=>{
 if(!navigator.geolocation){status='Your browser does not support location permission. Choose a borough instead.';notify();return}
 status='Waiting for optional browser location permission…';notify();
 navigator.geolocation.getCurrentPosition(({coords:c})=>{
  const lat=Number(c.latitude),lon=Number(c.longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<40.45||lat>40.95||lon< -74.3||lon> -73.65){
   status='This location is outside NYC. Choose a borough instead.';notify();return;
  }
  coords={lat,lon};mode='gps';boroughEl.value='';load();
 },()=>{status='Location permission was not granted. Choose your borough instead.';notify()},
 {enableHighAccuracy:false,timeout:12000,maximumAge:900000});
});
mode=boroughEl.value?'borough':'none';
window.NearbyCatalog={getItems:()=>rows, getStatus:()=>status, isLoading:()=>busy, directory:DIRECTORY, policy:POLICY};
if(mode==='borough')load();else notify();
})();
