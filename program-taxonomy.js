/* Multi-label topic taxonomy: broad all-program coverage and curated focused tags.
   Specific tags signal documented subjects, not a guaranteed internship placement. */
(function(root){
'use strict';
const TOPIC_GROUPS=[["STEM",[["biology","Biology & Life Science"],["chemistry","Chemistry"],["neuroscience","Neuroscience"],["health-medicine","Health & Medicine"],["machine-learning","Machine Learning & AI"],["coding","Coding & Programming"],["data-science","Data Science"],["cybersecurity","Cybersecurity"],["engineering","Engineering"],["robotics","Robotics & Makerspaces"],["nasa","NASA Programs"],["space-science","Space Science & Astronomy"],["earth-science","Earth & Climate Science"],["environmental-studies","Environment & Conservation"],["mathematics","Mathematics"],["science-research","General Science & Research"],["technology-computing","Technology & Computing"]]],["Arts & Media",[["arts-design","Visual Arts & Design"],["filmmaking","Film & Video"],["photography","Photography"],["writing-journalism","Writing & Journalism"],["media-communications","Media & Communications"],["music-performance","Music & Performance"]]],["Careers & Community",[["leadership","Leadership & Civic Engagement"],["community-service","Community Service & Volunteering"],["education-mentoring","Teaching & Mentoring"],["business","Business & Entrepreneurship"],["finance","Finance & Economics"],["career-prep","Career Exploration"],["college-prep","College Preparation"],["scholarships","Scholarships & Financial Aid"],["community-general","Community Programs"]]]];
const TOPICS=TOPIC_GROUPS.flatMap(group=>group[1]);
const KINDS=[["research","Research"],["internship","Internship"],["volunteering","Volunteering"],["other","Other programs (courses, competitions, etc.)"]];
const BASE_TOPIC_BY_SUBJECT={
  "Science & Research": "science-research",
  "Technology & Coding": "technology-computing",
  "Environment & Sustainability": "environmental-studies",
  "Arts & Design": "arts-design",
  "Media & Journalism": "media-communications",
  "Community & Leadership": "community-general",
  "College & Career Prep": "college-prep",
  "Careers & Business": "career-prep",
  "Finance & Entrepreneurship": "business",
  "Scholarships & Financial Aid": "scholarships"
};
const curated={
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
  "chemistry": [
    "columbia-science-honors-program",
    "nyssef-isef-research-fair",
    "acs-project-seed-chemistry-research",
    "acs-us-national-chemistry-olympiad-2027",
    "acs-chemclub-high-school"
  ],
  "neuroscience": [
    "columbia-brainyac",
    "rockefeller-summer-neuroscience-program"
  ],
  "health-medicine": [
    "columbia-brainyac",
    "msk-hopp-summer-student-program",
    "weill-cornell-hprep-2027",
    "rockefeller-summer-neuroscience-program"
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
    "cmu-3cs-virtual-college-computer-science",
    "nasa-space-apps-challenge-2026"
  ],
  "data-science": [
    "nyu-gstem-spring-data-science",
    "ccny-crest-hires",
    "nyu-tandon-machine-learning",
    "nasa-exoplanet-watch-citizen-science",
    "nasa-planet-hunters-tess-citizen-science",
    "nasa-space-umbrella-helio-citizen-science"
  ],
  "cybersecurity": [
    "nyu-tandon-cs4cs",
    "cyberpatriot-high-school-competition",
    "girls-who-code-pathways"
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
    "nasa-techrise-challenge-2026-27",
    "nasa-space-apps-challenge-2026",
    "ace-greater-ny-scholarship"
  ],
  "robotics": [
    "nyu-tandon-iesosc",
    "nyu-tandon-design-invent-innovate",
    "nyu-tandon-computer-engineering-good"
  ],
  "nasa": [
    "nasa-techrise-challenge-2026-27",
    "nasa-space-apps-challenge-2026",
    "nasa-exoplanet-watch-citizen-science",
    "nasa-planet-hunters-tess-citizen-science",
    "nasa-backyard-worlds-planet-nine",
    "nasa-space-umbrella-helio-citizen-science",
    "nasa-globe-observer-earth-science",
    "nasa-galaxy-zoo-tidal-tales"
  ],
  "space-science": [
    "columbia-science-honors-program",
    "amnh-science-alliance",
    "ccny-crest-hires",
    "nasa-techrise-challenge-2026-27",
    "genes-in-space-student-contest",
    "usaaao-astronomy-astrophysics-olympiad",
    "nasa-space-apps-challenge-2026",
    "nasa-exoplanet-watch-citizen-science",
    "nasa-planet-hunters-tess-citizen-science",
    "nasa-backyard-worlds-planet-nine",
    "nasa-space-umbrella-helio-citizen-science",
    "nasa-galaxy-zoo-tidal-tales"
  ],
  "earth-science": [
    "ccny-crest-hires",
    "cuny-crest-weather-camp",
    "nasa-globe-observer-earth-science",
    "rise-environmentor-research",
    "rocking-the-boat-environmental-science",
    "wave-hill-werm"
  ],
  "environmental-studies": [
    "nasa-globe-observer-earth-science",
    "wave-hill-aces",
    "snug-harbor-green-energy-workshops"
  ],
  "mathematics": [
    "columbia-science-honors-program",
    "usaco-online-programming-contests",
    "usaaao-astronomy-astrophysics-olympiad",
    "nyu-tandon-machine-learning",
    "schoolhouse-free-online-sat-bootcamp"
  ],
  "arts-design": [],
  "filmmaking": [
    "wnyc-radio-rookies",
    "bric-teen-filmmaking-bootcamp",
    "bric-teen-media-fellowship",
    "reelworks-narrative-lab",
    "reelworks-documentary-lab",
    "reelworks-film-school-friday",
    "reelworks-summer-documentary-lab",
    "reelworks-fall-supported-lab",
    "ghetto-film-school-new-york-fellows",
    "bronx-documentary-youth-photo-league"
  ],
  "photography": [
    "bric-teen-photography-bootcamp",
    "bronx-documentary-youth-photo-league"
  ],
  "writing-journalism": [
    "bpl-bookmatch-teen",
    "wnyc-radio-rookies",
    "brooklyn-history-summer-scholars",
    "princeton-summer-journalism-program",
    "scholastic-art-writing-awards",
    "girls-write-now-journey-mentorship",
    "girls-write-now-mentorship-on-demand"
  ],
  "media-communications": [],
  "music-performance": [
    "carnegie-nyo-usa-2027",
    "carnegie-nyo-jazz-2027",
    "soniqlab-staten-teen-dj-workshops"
  ],
  "leadership": [
    "nyc-student-advisory-councils",
    "mayor-s-youth-leadership-council",
    "bronx-museum-teen-council",
    "bpl-teen-night-council",
    "queens-museum-teens-institute"
  ],
  "community-service": [
    "queens-library-peer-to-peer-collective",
    "new-york-cares-teen-volunteer",
    "nypl-teen-reading-ambassadors",
    "nypl-teen-civics-ambassadors",
    "nasa-globe-observer-earth-science"
  ],
  "education-mentoring": [
    "nybg-high-school-explainer",
    "nysci-science-career-ladder-explainer",
    "bpl-storyteen",
    "nypl-teen-reading-ambassadors",
    "schoolhouse-free-online-sat-bootcamp",
    "ace-mentor-greater-ny",
    "minds-matter-nyc"
  ],
  "business": [
    "diamond-challenge",
    "futures-and-options-urban-leadership-fellows",
    "nyu-tandon-iesosc"
  ],
  "finance": [
    "diamond-challenge",
    "futures-and-options-urban-leadership-fellows",
    "collegeboard-bigfuture-scholarships"
  ],
  "career-prep": [
    "nyc-ladders-for-leaders",
    "summer-youth-employment-program-syep",
    "nysci-stem-nights-teen-events",
    "nyu-college-access-leadership-institute"
  ],
  "college-prep": [
    "princeton-summer-journalism-program",
    "nypl-iccan-college-career-access",
    "seo-scholars-nyc",
    "minds-matter-nyc"
  ],
  "scholarships": [
    "scholastic-art-writing-awards",
    "youngarts-national-arts-competition",
    "artlab-staten-summer-studio-scholarship"
  ],
  "community-general": [],
  "science-research": [
    "amnh-science-communication-internship-scip",
    "nysci-stem-nights-teen-events"
  ],
  "technology-computing": [
    "nyu-tandon-digital-design-ux",
    "nyu-tandon-extending-reality-xr"
  ]
};
const topicKeys=new Set(TOPICS.map(([key])=>key));
const tagsByProgram=new Map();
for(const [topic,ids] of Object.entries(curated)){
 for(const id of ids){
  if(!tagsByProgram.has(id))tagsByProgram.set(id,[]);
  tagsByProgram.get(id).push(topic);
 }
}
function topicsFor(program){
 const tagged=Array.isArray(program.topics)?program.topics.filter(tag=>typeof tag==='string'&&topicKeys.has(tag)):[];
 const broadTag=BASE_TOPIC_BY_SUBJECT[program.subject];
 return [...new Set([...(tagsByProgram.get(program.id)||[]),...tagged,...(broadTag?[broadTag]:[])])];
}
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
const api=Object.freeze({TOPIC_GROUPS,TOPICS,KINDS,topicsFor,kindsFor,matchesFacets});
root.SOBProgramTaxonomy=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
