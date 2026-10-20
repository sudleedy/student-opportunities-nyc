/* Display-state and sortable priority for the student opportunity directory.
   A deadline is not proof of open enrollment; only recently verified catalog
   states may be shown as confirmed open, opening soon, or closed. */
(function(root){
'use strict';
const DAY=86400000;
const iso=raw=>typeof raw==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw);
function deadlineTime(program){
 const raw=program.deadlineISO;
 if(!iso(raw))return null;
 const n=new Date(raw+'T23:59:59').getTime();
 return Number.isFinite(n)?n:null;
}
function verifiedRecently(program,now=Date.now()){
 if(program.sourceStatus!=='current'||!iso(program.verified))return false;
 const t=new Date(program.verified+'T12:00:00Z').getTime();
 if(!Number.isFinite(t))return false;
 const age=(now-t)/DAY;
 return age>=-1&&age<=60;
}
function displayState(program,now=Date.now()){
 if(!verifiedRecently(program,now))return 'unknown';
 const s=program.applicationState;
 if(!['open','upcoming','closed'].includes(s))return 'unknown';
 // An expired saved date cannot confirm that a new application cycle is open.
 if((s==='open'||s==='upcoming')&&deadlineTime(program)!==null&&deadlineTime(program)<now)return 'unknown';
 return s;
}
function category(program,now,mode){
 const state=displayState(program,now),date=deadlineTime(program);
 const hasFuture=date!==null&&date>=now;
 if(mode==='az')return {open:0,upcoming:1,unknown:2,closed:3}[state];
 if(state==='closed')return mode==='deadline'?5:6;
 if(mode==='deadline'){
  if(hasFuture&&(state==='open'||state==='upcoming'))return 0;
  if(state==='open')return 1;
  if(state==='upcoming')return 2;
  return hasFuture?3:4;
 }
 // Default: verified open with the nearest future closing dates first.
 if(state==='open')return hasFuture?0:1;
 if(state==='upcoming')return hasFuture?2:3;
 return hasFuture?4:5;
}
function sortPrograms(programs,mode='default',now=Date.now()){
 return programs.slice().sort((a,b)=>{
  const k=category(a,now,mode)-category(b,now,mode);
  if(k!==0)return k;
  if(mode!=='az'){
   const ad=deadlineTime(a),bd=deadlineTime(b);
   const aa=ad!==null&&ad>=now,bb=bd!==null&&bd>=now;
   if(aa&&bb&&ad!==bd)return ad-bd;
  }
  return String(a.title||'').localeCompare(String(b.title||''))||
         String(a.id||'').localeCompare(String(b.id||''));
 });
}
const api=Object.freeze({deadlineTime,verifiedRecently,displayState,sortPrograms});
root.SOBProgramOrder=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
