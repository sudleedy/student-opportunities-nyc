/* Run: node --test tests/test_program_filters.cjs */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const taxonomy = require(path.join(ROOT, 'program-taxonomy.js'));
const order = require(path.join(ROOT, 'program-order.js'));
const search = require(path.join(ROOT, 'program-search.js'));
const raw = fs.readFileSync(path.join(ROOT, 'programs-data.js'), 'utf8');
const found = raw.match(/window\.PROGRAMS\s*=\s*(\[[\s\S]*\])\s*;\s*$/);
assert.ok(found, 'Bundled program catalog is valid');
const programs = JSON.parse(found[1]);
const byId = new Map(programs.map(program => [program.id,program]));
const selected = (ids) => new Set(ids);
test('reviewed catalog identity and facet menus',()=>{
 assert.equal(programs.length,170);
 assert.equal(byId.size,programs.length);
 assert.equal(taxonomy.TOPICS.length,32);
 assert.equal(taxonomy.TOPIC_GROUPS.length,3);
 assert.ok(taxonomy.TOPICS.some(pair=>pair[0]==='arts-design'));
 assert.ok(taxonomy.TOPICS.some(pair=>pair[0]==='scholarships'));
 assert.deepEqual(taxonomy.KINDS.map(pair=>pair[0]),['research','internship','volunteering','other']);
 assert.ok(programs.every(p=>taxonomy.kindsFor(p).length>=1),'every program is filterable by a type');
 for(const [key] of taxonomy.TOPICS){
  assert.ok(programs.some(p=>taxonomy.topicsFor(p).includes(key)),key+' must match at least one actual record');
 }
});
test('all curated topic values and recognized kinds are valid',()=>{
 const knownTopics = new Set(taxonomy.TOPICS.map(pair=>pair[0]));
 const knownKinds = new Set(taxonomy.KINDS.map(pair=>pair[0]));
 for(const p of programs){
  for(const topic of taxonomy.topicsFor(p))assert.ok(knownTopics.has(topic),p.id);
  for(const kind of taxonomy.kindsFor(p))assert.ok(knownKinds.has(kind),p.id);
 }
});
test('NASA stays specific to a NASA program, not unrelated space biology',()=>{
 assert.ok(programs.filter(p=>taxonomy.topicsFor(p).includes('nasa')).length>=8);
 assert.ok(taxonomy.topicsFor(byId.get('nasa-techrise-challenge-2026-27')).includes('nasa'));
 assert.ok(taxonomy.topicsFor(byId.get('genes-in-space-student-contest')).includes('space-science'));
 assert.ok(!taxonomy.topicsFor(byId.get('genes-in-space-student-contest')).includes('nasa'));
});
test('chemistry and astronomy match confirmed Columbia Science Honors offerings',()=>{
 const shp=byId.get('columbia-science-honors-program');
 assert.ok(taxonomy.topicsFor(shp).includes('chemistry'));
 assert.ok(taxonomy.topicsFor(shp).includes('space-science'));
 assert.ok(taxonomy.topicsFor(byId.get('nyssef-isef-research-fair')).includes('chemistry'));
});
test('research internships may appear in both types',()=>{
 const bio=byId.get('genspace-biorocket-research');
 assert.deepEqual(taxonomy.kindsFor(bio),['research','internship']);
 assert.ok(taxonomy.kindsFor(byId.get('snug-harbor-water-stewardship')).includes('volunteering'));
 assert.deepEqual(taxonomy.kindsFor(byId.get('rockefeller-university-jumpstart')),['research']);
 assert.deepEqual(taxonomy.kindsFor(byId.get('all-star-code-summer-intensive')),['other']);
 assert.ok(taxonomy.kindsFor(byId.get('columbia-brainyac')).includes('internship'));
 assert.ok(taxonomy.kindsFor(byId.get('nyssef-isef-research-fair')).includes('research'));
});
test('checkbox OR within each filter and AND across filters',()=>{
 const nasa=byId.get('nasa-techrise-challenge-2026-27');
 const biotech=byId.get('genspace-biorocket-research');
 const trees=byId.get('snug-harbor-environmental-tree-stewardship');
 assert.ok(taxonomy.matchesFacets(nasa,selected(['nasa','biology']),selected([])));
 assert.ok(taxonomy.matchesFacets(biotech,selected(['biology','chemistry']),selected(['research','volunteering'])));
 assert.ok(!taxonomy.matchesFacets(nasa,selected(['nasa']),selected(['internship'])));
 assert.ok(!taxonomy.matchesFacets(trees,selected(['coding']),selected(['volunteering'])));
 assert.ok(taxonomy.matchesFacets(trees,selected([]),selected([])));
});
test('unreviewed dynamic records can only opt into recognized topics',()=>{
 const p={id:'made-up',title:'Sample coding workshop',type:'Technology Workshop',topics:['coding','nasa','invalid','coding']};
 assert.deepEqual(taxonomy.topicsFor(p),['coding','nasa']);
 assert.deepEqual(taxonomy.kindsFor(p),['other']);
 assert.deepEqual(taxonomy.topicsFor({id:'made-up',topics:'biology'}),[]);
});
test('homepage supplies accessible menus and invokes the facet matcher',()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const js=fs.readFileSync(path.join(ROOT,'directory-ui.js'),'utf8');
 for(const key of ['topic','kind','grade']){
  assert.ok(html.includes('id="'+key+'-dropdown"'),key+' dropdown missing');
  assert.ok(html.includes('id="'+key+'-options"'),key+' options missing');
  assert.ok(html.includes('id="'+key+'-summary-text"'),key+' summary missing');
 }
 assert.ok(html.includes('program-taxonomy.js?v=5'));
 assert.ok(html.indexOf('program-taxonomy.js?v=5')<html.indexOf('program-order.js?v=1'));
 assert.ok(html.indexOf('program-order.js?v=1')<html.indexOf('program-search.js?v=2'));
 assert.ok(html.indexOf('program-search.js?v=2')<html.indexOf('directory-ui.js?v=28'));
 assert.ok(js.includes("taxonomy.matchesFacets(p,selected('topic'),selected('kind'))"));
 assert.ok(js.includes('const PAGE_SIZE=9'));
 assert.ok(js.includes("for(const key of Object.keys(choices)){checked[key].clear()"));
});

test('every reviewed program can be found by a canonical type including Other',()=>{
 const groups = Object.fromEntries(taxonomy.KINDS.map(([key])=>[key,[]]));
 for(const program of programs){
  for(const kind of taxonomy.kindsFor(program))groups[kind].push(program.id);
 }
 assert.equal(new Set(Object.values(groups).flat()).size,programs.length);
 assert.ok(groups.other.includes('girls-who-code-pathways'));
 assert.ok(groups.other.includes('coolidge-scholarship'));
 assert.ok(groups.research.includes('columbia-brainyac'));
 assert.ok(groups.internship.includes('brooklyn-botanic-garden-apprentice'));
 assert.ok(groups.volunteering.includes('queens-library-teen-volunteer'));
 assert.ok(taxonomy.topicsFor(byId.get('amnh-science-alliance')).includes('space-science'));
});
test('priority uses verified application status instead of assuming a date proves open',()=>{
 const now=new Date('2026-10-19T16:00:00Z').getTime();
 const make=(id,app,deadline,verified='2026-10-18',sourceStatus='current')=>
  ({id,title:id,applicationState:app,deadlineISO:deadline,verified,sourceStatus});
 const entries=[
  make('closed','closed','2026-11-01'),
  make('unknown-future','unknown','2026-10-20'),
  make('upcoming','upcoming','2026-10-22'),
  make('open-late','open','2026-11-12'),
  make('open-soon','open','2026-10-21'),
  make('open-no-date','open',null),
  make('unknown-no-date','unknown',null),
  make('expired-open','open','2026-10-01'),
  make('stale-open','open','2026-10-23','2026-01-01')
 ];
 assert.equal(order.displayState(entries[7],now),'unknown');
 assert.equal(order.displayState(entries[8],now),'unknown');
 assert.deepEqual(order.sortPrograms(entries,'default',now).map(x=>x.id),
  ['open-soon','open-late','open-no-date','upcoming','unknown-future','stale-open','expired-open','unknown-no-date','closed']);
 assert.deepEqual(order.sortPrograms(entries,'deadline',now).slice(0,3).map(x=>x.id),
  ['open-soon','upcoming','open-late']);
 assert.equal(order.sortPrograms(entries,'az',now).at(-1).id,'closed');
 assert.equal(entries[0].id,'closed','sort did not mutate original ordering');
});
test('verified upcoming with expired published deadline becomes unconfirmed',()=>{
 const now=new Date('2026-10-19T16:00:00Z').getTime();
 assert.equal(order.displayState({applicationState:'upcoming',sourceStatus:'current',verified:'2026-10-18',deadlineISO:'2026-09-30'},now),'unknown');
});

test('every program has at least one topic and all 32 topics have candidates',()=>{
 assert.ok(programs.every(p=>taxonomy.topicsFor(p).length>0),'catalog topic coverage must be 100%');
 const allTags=programs.flatMap(p=>taxonomy.topicsFor(p));
 assert.ok(taxonomy.TOPICS.every(([key])=>allTags.includes(key)),'no empty selectable topic');
 assert.ok(programs.filter(p=>taxonomy.topicsFor(p).includes('chemistry')).length>=5);
 assert.ok(programs.filter(p=>taxonomy.topicsFor(p).includes('nasa')).length>=8);
 assert.ok(programs.filter(p=>taxonomy.topicsFor(p).includes('space-science')).length>=11);
 for(const topic of ['arts-design','college-prep','media-communications','community-general','scholarships']){
  assert.ok(programs.filter(p=>taxonomy.topicsFor(p).includes(topic)).length>0,topic);
 }
});
test('11 new reviewed programs are present with non-fabricated enrollment states',()=>{
 const ids=['acs-project-seed-chemistry-research','acs-us-national-chemistry-olympiad-2027','acs-chemclub-high-school','usaaao-astronomy-astrophysics-olympiad','nasa-space-apps-challenge-2026','nasa-exoplanet-watch-citizen-science','nasa-planet-hunters-tess-citizen-science','nasa-backyard-worlds-planet-nine','nasa-space-umbrella-helio-citizen-science','nasa-globe-observer-earth-science','nasa-galaxy-zoo-tidal-tales'];
 for(const id of ids)assert.ok(byId.has(id),id+' missing');
 assert.equal(byId.get('acs-project-seed-chemistry-research').applicationState,'unknown');
 assert.equal(byId.get('usaaao-astronomy-astrophysics-olympiad').applicationState,'unknown');
 assert.equal(byId.get('acs-us-national-chemistry-olympiad-2027').applicationState,'upcoming');
 assert.equal(byId.get('acs-chemclub-high-school').deadlineISO,'2026-11-01');
 assert.equal(byId.get('nasa-space-apps-challenge-2026').deadlineISO,'2026-11-15');
 assert.ok(taxonomy.kindsFor(byId.get('nasa-exoplanet-watch-citizen-science')).includes('volunteering'));
});
test('topic group headings counts and all new source-linked detail pages',()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const js=fs.readFileSync(path.join(ROOT,'directory-ui.js'),'utf8');
 assert.ok(js.includes('taxonomy.TOPIC_GROUPS.flatMap'));
 assert.ok(js.includes('topic-option-count'));
 assert.ok(html.includes('programs-data.js?v=15'));
 assert.ok(html.includes('program-taxonomy.js?v=5'));
 assert.ok(html.includes('directory-ui.js?v=28'));
 const pages=['program.html','dashboard.html','admin.html'];
 for(const page of pages){
  assert.ok(fs.readFileSync(path.join(ROOT,page),'utf8').includes('programs-data.js?v=15'),page+' cache');
 }
 const dir=fs.readFileSync(path.join(ROOT,'program-directory.html'),'utf8');
 const map=fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8');
 for(const p of programs){
  assert.ok(dir.includes('./program.html?id='+p.id),p.id+' absent from directory');
  assert.ok(map.includes('program.html?id='+p.id),p.id+' absent from sitemap');
 }
});


test('STEM is a heading, not a duplicate selectable STEM topic',()=>{
 const headings=taxonomy.TOPIC_GROUPS.map(([name])=>name);
 assert.deepEqual(headings,['STEM','Arts & Media','Careers & Community']);
 assert.ok(!taxonomy.TOPICS.some(([key])=>key==='stem'));
 assert.ok(taxonomy.TOPIC_GROUPS[0][1].some(([key])=>key==='science-research'));
 assert.ok(taxonomy.TOPIC_GROUPS[0][1].some(([key])=>key==='technology-computing'));
 assert.ok(!taxonomy.TOPICS.some(([key])=>key==='general-stem'),'avoid redundant General STEM subject');
 assert.ok(!programs.some(p=>taxonomy.topicsFor(p).includes('stem')));
});
test('STEM category retains science, technology, and environment listings',()=>{
 const categoryTopics=new Set(taxonomy.TOPIC_GROUPS[0][1].map(([key])=>key));
 const relevant=new Set(['Science & Research','Technology & Coding','Environment & Sustainability']);
 for(const p of programs.filter(p=>relevant.has(p.subject))){
  assert.ok(taxonomy.topicsFor(p).some(tag=>categoryTopics.has(tag)),p.id+' missing from STEM heading');
 }
 const matching=programs.filter(p=>taxonomy.topicsFor(p).some(tag=>categoryTopics.has(tag)));
 assert.ok(matching.length>=85,'STEM category should retain all STEM programs');
 for(const id of ['ace-mentor-greater-ny','schoolhouse-free-online-sat-bootcamp',
   'amnh-science-communication-internship-scip','wave-hill-aces',
   'nysci-stem-nights-teen-events','nyu-tandon-digital-design-ux',
   'nyu-tandon-extending-reality-xr','ace-greater-ny-scholarship',
   'snug-harbor-green-energy-workshops']){
  assert.ok(taxonomy.topicsFor(byId.get(id)).some(tag=>categoryTopics.has(tag)),id+' missing');
 }
});
test('STEM category does not pull unrelated listings into its subjects',()=>{
 const stemKeys=new Set(taxonomy.TOPIC_GROUPS[0][1].map(([key])=>key));
 for(const id of ['youngarts-national-arts-competition','coolidge-scholarship',
   'reelworks-documentary-lab','dorot-summer-teen-internship']){
  assert.ok(!taxonomy.topicsFor(byId.get(id)).some(tag=>stemKeys.has(tag)),id+' not STEM');
 }
 assert.deepEqual(taxonomy.topicsFor({id:'new-chem',topics:['chemistry']}),['chemistry']);
 assert.deepEqual(taxonomy.topicsFor({id:'new-stem',topics:['stem']}),[]);
 assert.ok(taxonomy.topicsFor({id:'new-school',subject:'Technology & Coding'}).includes('technology-computing'));
});

test('single Topics filter replaces the old redundant Interest filter',()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const js=fs.readFileSync(path.join(ROOT,'directory-ui.js'),'utf8');
 assert.ok(html.includes('id="topic-dropdown"'));
 for(const id of ['subject-title','subject-dropdown','subject-options','subject-summary-text']){
  assert.ok(!html.includes('id="'+id+'"'),id+' should be removed');
 }
 assert.ok(!js.includes("subject:{placeholder:"),'no subject checkbox option');
 assert.ok(!js.includes("selectedAny('subject'"),'no remaining subject filter restriction');
 assert.ok(html.includes('directory-ui.js?v=28'),'fresh UI script requested');
 assert.ok(html.includes('grid-column:span 2'),'filter grid should have no unused second-row gap');
});
test('all program subjects remain discoverable by one or more topic choices',()=>{
 const groups=taxonomy.TOPIC_GROUPS.map(([heading])=>heading);
 assert.deepEqual(groups,['STEM','Arts & Media','Careers & Community']);
 assert.equal(programs.length,170);
 for(const p of programs){
  const tags=taxonomy.topicsFor(p);
  assert.ok(tags.length>0,p.id+' has no topic choices');
  assert.ok(tags.some(t=>taxonomy.TOPICS.some(([key])=>key===t)),p.id+' tags are not available in Topics');
  assert.ok(taxonomy.matchesFacets(p,selected(tags),selected([])),p.id+' not searchable with topics');
 }
});

test('keyword search matches NYU ARISE without requiring adjacent words',()=>{
 const p=byId.get('nyu-tandon-arise');
 assert.ok(p,'NYU Tandon ARISE is in the catalog');
 for(const query of ['nyu arise','NYU ARISE','nyu tandon arise','arise nyu','  nyu   arise  ','nyu, arise']){
  assert.ok(search.matchesProgram(p,query,taxonomy),query+' should find NYU ARISE');
 }
 assert.ok(!search.matchesProgram(p,'nyu nonexistentword',taxonomy),'all query words must match');
 assert.ok(!search.matchesProgram(byId.get('columbia-brainyac'),'nyu arise',taxonomy),'unrelated listing');
});
test('keyword search still finds other programs and topic labels',()=>{
 assert.ok(search.matchesProgram(byId.get('acs-project-seed-chemistry-research'),'project seed',taxonomy));
 assert.ok(search.matchesProgram(byId.get('nasa-techrise-challenge-2026-27'),'nasa engineering',taxonomy));
 assert.ok(search.matchesProgram(byId.get('nyu-tandon-arise'),'  ',taxonomy));
 assert.ok(search.matchesProgram(byId.get('nyu-tandon-arise'),'ArIsE',taxonomy));
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const ui=fs.readFileSync(path.join(ROOT,'directory-ui.js'),'utf8');
 assert.ok(html.includes('program-search.js?v=2'));
 assert.ok(ui.includes('search.matchesProgram(p,q,taxonomy)'));
 assert.ok(html.includes('position:static;display:flex;align-items:center;'));
 assert.ok(!html.includes('position:sticky;top:0'));
 assert.ok(html.includes('background:#223d65'));
 assert.ok(ui.includes('role="heading" aria-level="3"'));
 for(const name of ['STEM','Arts & Media','Careers & Community']){
  assert.ok(taxonomy.TOPIC_GROUPS.some(([group])=>group===name),name);
 }
});

test('every reviewed program matches its official title, organization and stable identifier',()=>{
 for(const p of programs){
  for(const [kind,q] of [['title',p.title],['organization',p.org],['catalog identifier',p.id]]){
   assert.ok(search.matchesProgram(p,q,taxonomy),kind+' does not find '+p.id+' with '+q);
  }
 }
});
test('program and organizer acronyms work throughout the catalog',()=>{
 const examples=[
  ['amnh srmp','science-research-mentoring-program-srmp'],
  ['amnh scip','amnh-science-communication-internship-scip'],
  ['bpl teen techies','bpl-teen-techies'],
  ['brooklyn library storyteen','bpl-storyteen'],
  ['qpl teen volunteer','queens-library-teen-volunteer'],
  ['nypl civics','nypl-teen-civics-ambassadors'],
  ['cshl barcode','cshl-urban-barcode-research-program'],
  ['msk hopp','msk-hopp-summer-student-program'],
  ['nyu arise','nyu-tandon-arise'],
  ['new york university arise','nyu-tandon-arise'],
  ['ccny hires','ccny-crest-hires'],
  ['dycd syep','summer-youth-employment-program-syep'],
  ['nyas junior academy','nyas-junior-academy'],
  ['acs usnco','acs-us-national-chemistry-olympiad-2027'],
  ['nyo jazz','carnegie-nyo-jazz-2027'],
  ['rockefeller lab jumpstart','rockefeller-university-jumpstart'],
  ['college now','cuny-college-now-free-dual-enrollment'],
  ['psjp','princeton-summer-journalism-program'],
  ['ubrp','cshl-urban-barcode-research-program'],
  ['s prep','columbia-sprep']
 ];
 for(const [q,id] of examples)assert.ok(search.matchesProgram(byId.get(id),q,taxonomy),q+' should find '+id);
});
test('related terms and alternate names find the correct STEM and non-STEM entries',()=>{
 const examples=[
  ['chem project seed','acs-project-seed-chemistry-research'],
  ['programming machine learning','nyu-tandon-machine-learning'],
  ['artificial intelligence weekend','all-star-code-weekend-ai-intensive'],
  ['AI code next','google-code-next-chelsea-lab'],
  ['computer science cybersecurity','nyu-tandon-cs4cs'],
  ['math bootcamp','schoolhouse-free-online-sat-bootcamp'],
  ['scholarships coolidge','coolidge-scholarship'],
  ['financial aid coolidge','coolidge-scholarship'],
  ['community service library','queens-library-teen-volunteer'],
  ['intern bronx zoo','bronx-zoo-project-true'],
  ['sustainability garden','brooklyn-botanic-garden-apprentice'],
  ['space apps hackathon','nasa-space-apps-challenge-2026'],
  ['NYC summer jobs','summer-youth-employment-program-syep']
 ];
 for(const [q,id] of examples)assert.ok(search.matchesProgram(byId.get(id),q,taxonomy),q+' should find '+id);
});
test('aliases stay precise: unmatched words and unrelated institutions do not qualify',()=>{
 const noMatches=[
  ['amnh arise','nyu-tandon-arise'],
  ['nyu srmp','science-research-mentoring-program-srmp'],
  ['nyu cshl','cshl-urban-barcode-research-program'],
  ['chem coolidge','coolidge-scholarship'],
  ['ai coolidge','coolidge-scholarship'],
  ['nasa scholastic','scholastic-art-writing-awards'],
  ['randomkeyword','nyu-tandon-arise']
 ];
 for(const [q,id] of noMatches)assert.ok(!search.matchesProgram(byId.get(id),q,taxonomy),q+' should not find '+id);
 assert.ok(!search.matchesProgram(byId.get('brooklyn-museum-museum-apprentices'),'ai',taxonomy),
  'AI must be matched as a whole term, not as a substring of paid');
 assert.ok(search.matchesProgram({id:'demo',title:'Example Research',searchAliases:['new nickname']},'nickname',taxonomy));
 assert.ok(!search.matchesProgram({id:'demo',title:'Example Research',searchAliases:['new nickname']},'arise',taxonomy));
});
