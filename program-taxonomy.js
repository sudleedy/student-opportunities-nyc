/* Curated subject facets for the reviewed Student Opportunities NYC catalog.
   Topic matches reflect documented program content, not current admissions or guaranteed placements.
   Unknown/Supabase-created programs can opt in with a "topics" array of approved topic keys. */
(function(root){
'use strict';
const TOPICS = [["biology","Biology"],["machine-learning","Machine Learning & AI"],["coding","Coding & Programming"],["chemistry","Chemistry"],["nasa","NASA Programs"],["space-science","Space Science"],["engineering","Engineering"]];
const KINDS = [["research","Research"],["internship","Internship"],["volunteering","Volunteering"],["other","Other programs (courses, competitions, etc.)"]];
const curated = {
  "biology": [
    "columbia-brainyac",
    "nybg-high-school-explainer",
    "amnh-science-alliance",
    "brooklyn-botanic-garden-apprentice",
    "rockefeller-university-jumpstart",
    "columbia-science-honors-program",
    "cshl-urban-barcode-research-program",
    "cshl-urban-barcode-project",
    "queens-botanical-garden-volunteers",
    "msk-hopp-summer-student-program",
    "staten-island-zoo-junior-docent",
    "biobus-junior-scientists",
    "staten-island-zoo-teen-volunteers",
    "wave-hill-werm",
    "wave-hill-forest-project",
    "bronx-zoo-project-true",
    "rockefeller-ssrp-2027",
    "rockefeller-summer-neuroscience-program",
    "genes-in-space-student-contest",
    "queens-botanical-growing-justice",
    "brooklyn-bridge-park-tides",
    "genspace-biorocket-research",
    "weill-cornell-hprep-2027",
    "rocking-the-boat-environmental-science",
    "natural-areas-sun-high-school-internship",
    "rise-environmentor-research",
    "snug-harbor-farm-stewardship",
    "snug-harbor-water-stewardship",
    "snug-harbor-environmental-tree-stewardship"
  ],
  "machine-learning": [
    "girls-who-code-pathways",
    "technovation-challenge",
    "nyu-tandon-machine-learning",
    "all-star-code-weekend-ai-intensive",
    "kode-with-klossy-tech-workshops",
    "google-code-next-chelsea-lab"
  ],
  "coding": [
    "columbia-science-honors-program",
    "girls-who-code-pathways",
    "technovation-challenge",
    "congressional-app-challenge",
    "nyu-gstem-spring-data-science",
    "nyu-tandon-cs4cs",
    "nyu-tandon-iesosc",
    "nyu-tandon-machine-learning",
    "nyu-tandon-computer-engineering-good",
    "all-star-code-summer-intensive",
    "all-star-code-weekend-ai-intensive",
    "kode-with-klossy-tech-workshops",
    "google-code-next-chelsea-lab",
    "girls-who-code-clubs",
    "usaco-online-programming-contests",
    "cmu-3cs-virtual-college-computer-science"
  ],
  "chemistry": [
    "columbia-science-honors-program",
    "nyssef-isef-research-fair"
  ],
  "nasa": [
    "nasa-techrise-challenge-2026-27"
  ],
  "space-science": [
    "columbia-science-honors-program",
    "amnh-science-alliance",
    "ccny-crest-hires",
    "nasa-techrise-challenge-2026-27",
    "genes-in-space-student-contest"
  ],
  "engineering": [
    "columbia-science-honors-program",
    "nyu-tandon-arise",
    "mit-think-scholars-program",
    "nyssef-isef-research-fair",
    "nyu-tandon-iesosc",
    "nyu-tandon-design-invent-innovate",
    "nyu-tandon-computer-engineering-good",
    "ace-mentor-greater-ny",
    "ccny-crest-hires",
    "nasa-techrise-challenge-2026-27"
  ]
};
const topicKeys = new Set(TOPICS.map(pair=>pair[0]));
const tagsByProgram = new Map();
for(const [topic,ids] of Object.entries(curated)){
 for(const id of ids){
  if(!tagsByProgram.has(id))tagsByProgram.set(id,[]);
  tagsByProgram.get(id).push(topic);
 }
}
function topicsFor(program){
 const tagged=Array.isArray(program.topics)?program.topics.filter(tag=>typeof tag==='string'&&topicKeys.has(tag)):[];
 return [...new Set([...(tagsByProgram.get(program.id)||[]),...tagged])];
}
/* Normalize organizer wording without rewriting the original program type.
   Research competitions and internship-style apprenticeships are meaningful
   discovery matches, but a generic course is never mislabeled as an internship.
   "Other" keeps every curated program reachable by its opportunity type. */
function kindsFor(program){
 const type=String(program.type||'').toLowerCase();
 const title=String(program.title||'').toLowerCase();
 const result=[];
 if(/\bresearch\b/.test(type)||/\bresearch\b/.test(title)||
    ['nyssef-isef-research-fair','mit-think-scholars-program','rocking-the-boat-environmental-science'].includes(program.id))result.push('research');
 if(/\bintern(?:s|ship|ships)?\b/.test(type)||/\bintern(?:s|ship|ships)?\b/.test(title)||
    /\bapprenticeships?\b/.test(type)||/\bapprenticeships?\b/.test(title))result.push('internship');
 if(/\bvolunteer(?:s|ing)?\b/.test(type)||/\bvolunteer(?:s|ing)?\b/.test(title))result.push('volunteering');
 return result.length?result:['other'];
}
function matchesFacets(program,selectedTopics,selectedKinds){
 const topics=selectedTopics||new Set(),kinds=selectedKinds||new Set();
 return (!topics.size||topicsFor(program).some(tag=>topics.has(tag)))&&
        (!kinds.size||kindsFor(program).some(kind=>kinds.has(kind)));
}
const api=Object.freeze({TOPICS,KINDS,topicsFor,kindsFor,matchesFacets});
root.SOBProgramTaxonomy=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
