/* Run: node --test tests/test_program_filters.cjs */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const taxonomy = require(path.join(ROOT, 'program-taxonomy.js'));
const raw = fs.readFileSync(path.join(ROOT, 'programs-data.js'), 'utf8');
const found = raw.match(/window\.PROGRAMS\s*=\s*(\[[\s\S]*\])\s*;\s*$/);
assert.ok(found, 'Bundled program catalog is valid');
const programs = JSON.parse(found[1]);
const byId = new Map(programs.map(program => [program.id,program]));
const selected = (ids) => new Set(ids);
test('reviewed catalog identity and facet menus',()=>{
 assert.equal(programs.length,159);
 assert.equal(byId.size,programs.length);
 assert.deepEqual(taxonomy.TOPICS.map(pair=>pair[0]),['biology','machine-learning','coding','chemistry','nasa','space-science','engineering']);
 assert.deepEqual(taxonomy.KINDS.map(pair=>pair[0]),['research','internship','volunteering']);
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
 assert.deepEqual(programs.filter(p=>taxonomy.topicsFor(p).includes('nasa')).map(p=>p.id),['nasa-techrise-challenge-2026-27']);
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
 assert.deepEqual(taxonomy.kindsFor(byId.get('all-star-code-summer-intensive')),[]);
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
 assert.deepEqual(taxonomy.kindsFor(p),[]);
 assert.deepEqual(taxonomy.topicsFor({id:'made-up',topics:'biology'}),[]);
});
test('homepage supplies accessible menus and invokes the facet matcher',()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const js=fs.readFileSync(path.join(ROOT,'directory-ui.js'),'utf8');
 for(const key of ['subject','topic','kind','grade']){
  assert.ok(html.includes('id="'+key+'-dropdown"'),key+' dropdown missing');
  assert.ok(html.includes('id="'+key+'-options"'),key+' options missing');
  assert.ok(html.includes('id="'+key+'-summary-text"'),key+' summary missing');
 }
 assert.ok(html.includes('program-taxonomy.js?v=1'));
 assert.ok(html.indexOf('program-taxonomy.js?v=1')<html.indexOf('directory-ui.js?v=24'));
 assert.ok(js.includes("taxonomy.matchesFacets(p,selected('topic'),selected('kind'))"));
 assert.ok(js.includes('const PAGE_SIZE=9'));
 assert.ok(js.includes("for(const key of Object.keys(choices)){checked[key].clear()"));
});
