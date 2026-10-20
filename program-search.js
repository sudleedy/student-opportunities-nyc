/* Keyword search for the student opportunity directory.
   Every search word may appear anywhere in a program's searchable fields:
   "nyu arise" matches "NYU Tandon ARISE"; word order and punctuation do
   not need to match. No fuzzy substitutions or fabricated aliases. */
(function(root){
'use strict';
function normalize(text){
 return String(text??'').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g,' ')
  .trim();
}
function matchesProgram(program,query,taxonomy){
 const tokens=normalize(query).split(/\s+/).filter(Boolean);
 if(!tokens.length)return true;
 const topicLabels=taxonomy?taxonomy.topicsFor(program).map(key=>
  taxonomy.TOPICS.find(([value])=>value===key)?.[1]||key):[];
 const content=normalize([
  program.title,program.org,program.summary,program.whatYouDo,
  program.subject,program.type,program.eligibility,program.location,
  program.borough,...topicLabels
 ].join(' '));
 return tokens.every(token=>content.includes(token));
}
const api=Object.freeze({normalize,matchesProgram});
root.SOBProgramSearch=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
