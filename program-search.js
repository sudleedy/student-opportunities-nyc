/* Synonym- and acronym-aware search across the entire program catalog.
   Each query term must match, but words can occur in any order and an
   organizer's known abbreviation or an equivalent subject term can stand in.
   Aliases assist discovery; they do not imply organizer affiliation. */
(function(root){
'use strict';
const SYNONYM_GROUPS=[
 ['ai','artificial intelligence','machine learning','ml'],
 ['coding','programming','computer science','cs','software development'],
 ['cybersecurity','cyber security','information security'],
 ['robotics','robot','robots'],
 ['math','mathematics'],
 ['bio','biology','life science','life sciences'],
 ['chem','chemistry'],
 ['astronomy','astrophysics','space science'],
 ['environment','environmental','ecology','conservation','sustainability'],
 ['climate','climate science','earth science'],
 ['intern','internship','internships','apprenticeship'],
 ['volunteer','volunteering','community service'],
 ['mentoring','mentor','mentorship'],
 ['scholarship','scholarships','financial aid'],
 ['contest','competition','challenge'],
 ['film','filmmaking','movie making'],
 ['photography','photo','photographic'],
 ['college prep','college preparation','college readiness'],
 ['dual enrollment','college credit','dual credit']
];
const ORGANIZER_ALIASES=[
 ['new york university',['nyu','new york uni']],
 ['city university of new york',['cuny']],
 ['city college of new york',['ccny','city college']],
 ['american museum of natural history',['amnh','natural history museum']],
 ['new york botanical garden',['nybg','bronx botanical garden']],
 ['brooklyn public library',['bpl','brooklyn library']],
 ['queens public library',['qpl','queens library']],
 ['new york public library',['nypl']],
 ['new york hall of science',['nysci']],
 ['cold spring harbor laboratory',['cshl','cold spring harbor','dna learning center']],
 ['memorial sloan kettering',['msk','mskcc','sloan kettering']],
 ['museum of modern art',['moma']],
 ['museum of the moving image',['momi']],
 ['wildlife conservation society',['wcs']],
 ['american chemical society',['acs']],
 ['new york academy of sciences',['nyas']],
 ['girls who code',['gwc']],
 ['girls write now',['gwn']],
 ['new york city public schools',['nycps','nyc public schools']],
 ['nyc public schools',['nycps']],
 ['department of youth and community development',['dycd']],
 ['department of youth community development',['dycd']],
 ['princeton university',['princeton']],
 ['massachusetts institute of technology',['mit']]
];
const PROGRAM_ALIASES={
 'nyu-tandon-arise':['arise program','applied research innovations in science and engineering','nyu summer research'],
 'science-research-mentoring-program-srmp':['amnh srmp','science research mentorship program','museum research mentoring'],
 'columbia-brainyac':['brainy ac','brain research apprenticeship','columbia brain research'],
 'rockefeller-university-jumpstart':['lab jumpstart','rockefeller lab jumpstart'],
 'rockefeller-ssrp-2027':['ssrp','rockefeller summer science research'],
 'rockefeller-summer-neuroscience-program':['snp','rockefeller neuroscience summer'],
 'summer-youth-employment-program-syep':['syep','nyc summer jobs','summer jobs','summer youth jobs'],
 'nyc-ladders-for-leaders':['l4l','nyc ladders'],
 'nyc-careerready-work-learn-grow':['wlg','work learn grow','career ready wlg'],
 'cuny-college-now-free-dual-enrollment':['college now','cuny dual enrollment'],
 'nyas-junior-academy':['nyas junior academy'],
 'cshl-urban-barcode-research-program':['ubrp','urban barcode research'],
 'cshl-urban-barcode-project':['ubp','dna barcoding project'],
 'columbia-science-honors-program':['shp','columbia science honors'],
 'columbia-sprep':['sprep','s prep','state precollege enrichment program'],
 'nyssef-isef-research-fair':['nyssef','isef','ny science fair'],
 'msk-hopp-summer-student-program':['hopp','msk hopp'],
 'ccny-crest-hires':['hires','remote sensing research','city college earth science'],
 'acs-us-national-chemistry-olympiad-2027':['usnco','us chemistry olympiad','chem olympiad'],
 'nasa-techrise-challenge-2026-27':['tech rise','nasa techrise'],
 'nasa-space-apps-challenge-2026':['space apps','nasa hackathon'],
 'genes-in-space-student-contest':['genes in space'],
 'carnegie-nyo-usa-2027':['nyo usa','national youth orchestra'],
 'carnegie-nyo-jazz-2027':['nyo jazz','national youth orchestra jazz'],
 'all-star-code-summer-intensive':['asc summer intensive'],
 'all-star-code-weekend-ai-intensive':['asc ai weekend'],
 'princeton-summer-journalism-program':['psjp'],
 'brooklyn-botanic-garden-apprentice':['gap','garden apprentice'],
 'nysci-science-career-ladder-explainer':['science career ladder','scl'],
 'nyu-tandon-cs4cs':['cs4cs','computer science for cybersecurity'],
 'nyu-tandon-computer-engineering-good':['ce4g'],
 'nyu-tandon-iesosc':['iesosc','smart cities'],
 'cuny-stem-research-academy':['cuny stem academy'],
 'biobus-junior-scientists':['biobus junior scientist'],
 'nasa-exoplanet-watch-citizen-science':['exoplanet watch'],
 'nasa-planet-hunters-tess-citizen-science':['planet hunters','tess'],
 'nasa-globe-observer-earth-science':['globe observer']
};
function normalize(text){
 return String(text??'').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g,' ')
  .trim();
}
const phrases=SYNONYM_GROUPS.flatMap((group,index)=>group
 .map(variant=>({words:normalize(variant).split(' '),index})))
 .sort((a,b)=>b.words.length-a.words.length);
function queryTerms(query){
 const words=normalize(query).split(/\s+/).filter(Boolean),terms=[];
 for(let i=0;i<words.length;){
  const phrase=phrases.find(({words:part})=>part.length>1&&
   part.every((word,j)=>words[i+j]===word));
  if(phrase){terms.push({value:phrase.words.join(' '),group:phrase.index});i+=phrase.words.length;continue}
  const word=words[i++];
  const group=SYNONYM_GROUPS.findIndex(entries=>entries.some(e=>normalize(e)===word));
  terms.push({value:word,group});
 }
 return terms;
}
function organizerAliases(program){
 const identity=normalize([program.org,program.title].join(' ')),aliases=[];
 for(const [source,alternatives] of ORGANIZER_ALIASES){
  if((' '+identity+' ').includes(' '+source+' '))aliases.push(...alternatives);
 }
 return aliases;
}
function programAliases(program){
 const supplied=Array.isArray(program.searchAliases)?program.searchAliases
  .filter(value=>typeof value==='string').slice(0,30):[];
 return [
  ...organizerAliases(program),
  ...(PROGRAM_ALIASES[program.id]||[]),
  ...supplied,
  // The stable program ID covers abbreviated IDs and alternate hyphenation
  // across every catalog item, not merely the curated aliases above.
  program.id||''
 ];
}
function searchableContent(program,taxonomy){
 const tags=taxonomy?taxonomy.topicsFor(program):[];
 const topics=taxonomy?tags.map(tag=>
  taxonomy.TOPICS.find(([key])=>key===tag)?.[1]||tag):[];
 const headings=taxonomy?taxonomy.TOPIC_GROUPS
  .filter(([,options])=>options.some(([key])=>tags.includes(key)))
  .map(([name])=>name):[];
 return normalize([
  program.title,program.org,program.summary,program.whatYouDo,
  program.subject,program.type,program.eligibility,program.location,
  program.borough,...topics,...headings,...programAliases(program)
 ].join(' '));
}
function containsTerm(content,words,term,allowPrefix){
 const value=normalize(term);
 if(!value)return false;
 if(value.includes(' '))return (' '+content+' ').includes(' '+value+' ');
 if(words.includes(value))return true;
 return allowPrefix&&value.length>=3&&words.some(word=>word.startsWith(value));
}
function matchesProgram(program,query,taxonomy){
 const terms=queryTerms(query);
 if(!terms.length)return true;
 const content=searchableContent(program,taxonomy),words=content.split(' ');
 return terms.every(({value,group})=>{
  if(containsTerm(content,words,value,true))return true;
  if(group<0)return false;
  return SYNONYM_GROUPS[group].some(variant=>containsTerm(content,words,variant,false));
 });
}
const api=Object.freeze({normalize,queryTerms,programAliases,searchableContent,matchesProgram});
root.SOBProgramSearch=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
