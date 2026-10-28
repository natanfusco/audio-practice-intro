/* HoF R4 — portable data engine. Shared by teacher and student; no DOM dependencies. */
(function(root){
'use strict';
const VERSION='1.1.0', CONTENT='hof.practice.content', BACKUP='hof.practice.teacher-backup';
const MAX_BYTES=5*1024*1024;
const clone=x=>JSON.parse(JSON.stringify(x));
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const same=(a,b)=>canonical(a)===canonical(b);
const norm=s=>s.replace(/\s+/gu,' ').trim();
const error=s=>{throw new Error(s);};
const id=()=>globalThis.crypto?.randomUUID?.()||'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function object(x,allowed,required=allowed,label='Objeto'){
 if(!x||Array.isArray(x)||typeof x!=='object')error(label+': objeto inválido.');
 for(const k of Object.keys(x))if(!allowed.includes(k))error(label+': campo não permitido: '+k+'.');
 for(const k of required)if(!Object.hasOwn(x,k))error(label+': campo obrigatório: '+k+'.');
}
function str(x,label,max=20000){if(typeof x!=='string'||!x.trim()||x.length>max)error(label+': texto vazio, inválido ou longo demais.');}
function identifier(x,label){if(typeof x!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(x))error(label+': identificador inválido.');}
function revision(x,label){if(!Number.isSafeInteger(x)||x<1)error(label+': revisão inválida.');}
function list(x,label,max=2000){if(!Array.isArray(x)||x.length>max)error(label+': lista inválida ou longa demais.');}
function unique(xs,label){const ids=new Set();for(const x of xs){if(ids.has(x.id))error(label+': identificador repetido ('+x.id+').');ids.add(x.id);}}
function validateUtterance(u){
 object(u,['id','revision','sectionId','type','sourceQuestion','text','groups','tips','audio','lessonId'],['id','revision','sectionId','type','sourceQuestion','text','groups','tips','audio']);
 if(u.lessonId!==undefined&&u.lessonId!==null)identifier(u.lessonId,'Aula');
 identifier(u.id,'Frase');revision(u.revision,u.id);identifier(u.sectionId,'Seção');
 if(!['response','presentation'].includes(u.type))error('Tipo de frase inválido.');
 if(u.sourceQuestion!==null)str(u.sourceQuestion,'Pergunta');
 str(u.text,'Frase');if(/[|‿]/u.test(u.text))error('A frase limpa não pode conter | ou ‿.');
 list(u.groups,'Grupos',100);if(!u.groups.length)error('A frase precisa de ao menos um grupo.');unique(u.groups,'Grupos');
 for(const g of u.groups){
  object(g,['id','text','connected','pronunciation','highlights']);identifier(g.id,'Grupo');
  for(const k of ['text','connected','pronunciation'])str(g[k],k);
  if(/[|‿]/u.test(g.text)||g.connected.includes('|'))error('Grupo com marcação inválida.');
  if(norm(g.connected.replaceAll('‿',' '))!==norm(g.text))error('As ligações precisam preservar o inglês do grupo.');
  list(g.highlights,'Destaques',100);
  for(const h of g.highlights){object(h,['text','occurrence','kind']);str(h.text,'Destaque');revision(h.occurrence,'Ocorrência');if(!['stress','reduction','sound'].includes(h.kind))error('Tipo de destaque inválido.');
   if(g.text.split(h.text).length-1<h.occurrence)error('Destaque não encontrado no grupo.');
  }
 }
 if(norm(u.groups.map(g=>g.text).join(' '))!==norm(u.text))error('Os grupos não correspondem à frase: '+u.id+'.');
 list(u.tips,'Dicas',100);unique(u.tips,'Dicas');
 for(const t of u.tips){object(t,['id','label','body']);identifier(t.id,'Dica');str(t.label,'Título da dica',200);str(t.body,'Dica');}
 object(u.audio,['mode','url','reviewStatus']);
 if(!['tts','file'].includes(u.audio.mode)||!['reviewed','unreviewed'].includes(u.audio.reviewStatus))error('Referência de áudio inválida.');
 if(u.audio.mode==='tts'&&u.audio.url!==null)error('Voz do dispositivo não usa URL.');
 if(u.audio.mode==='file'){
  if(typeof u.audio.url!=='string')error('Áudio de arquivo precisa de URL HTTPS.');
  let url;try{url=new URL(u.audio.url);}catch{error('URL de áudio inválida.');}
  if(url.protocol!=='https:'||url.username||url.password)error('Use uma URL HTTPS sem credenciais no áudio.');
 }
}
function validateHub(h,refs=false){
 object(h,['id','revision','title','order','sections','utterances','presentations','lessons'],['id','revision','title','order','sections','utterances','presentations']);identifier(h.id,'Hub');revision(h.revision,h.id);str(h.title,'Título',200);
 if(!Number.isSafeInteger(h.order)||h.order<0)error('Ordem do hub inválida.');
 if(h.lessons!==undefined){list(h.lessons,'Aulas',500);unique(h.lessons,'Aulas');for(const lesson of h.lessons){
 object(lesson,['id','title','date']);identifier(lesson.id,'Aula');str(lesson.title,'Título da aula',200);
 if(lesson.date!==null){if(typeof lesson.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(lesson.date)||!Number.isFinite(Date.parse(lesson.date+'T12:00:00Z'))||new Date(lesson.date+'T12:00:00Z').toISOString().slice(0,10)!==lesson.date)error('Data de aula inválida. Use AAAA-MM-DD ou null.');}
 }}
 list(h.sections,'Seções',100);unique(h.sections,'Seções');
 for(const s of h.sections){object(s,['id','title','order']);identifier(s.id,'Seção');str(s.title,'Título da seção',200);if(!Number.isSafeInteger(s.order)||s.order<0)error('Ordem da seção inválida.');}
 list(h.utterances,'Frases');unique(h.utterances,'Frases');for(const u of h.utterances)validateUtterance(u);
 list(h.presentations,'Apresentações',100);unique(h.presentations,'Apresentações');
 for(const p of h.presentations){object(p,['id','title','utteranceIds']);identifier(p.id,'Apresentação');str(p.title,'Título da apresentação',200);list(p.utteranceIds,'Frases da apresentação');if(!p.utteranceIds.length)error('Apresentação sem frases.');
  for(const uid of p.utteranceIds)identifier(uid,'Referência');if(new Set(p.utteranceIds).size!==p.utteranceIds.length)error('Frase duplicada na apresentação.');
 }
 if(refs){const lessons=new Set((h.lessons||[]).map(l=>l.id));for(const u of h.utterances)if(u.lessonId&&!lessons.has(u.lessonId))error('Aula não encontrada para a frase '+u.id+'.');const sections=new Set(h.sections.map(s=>s.id));const utterances=new Map(h.utterances.map(u=>[u.id,u]));
  for(const u of h.utterances)if(!sections.has(u.sectionId))error('Seção não encontrada para a frase '+u.id+'.');
  for(const p of h.presentations)for(const uid of p.utteranceIds)if(utterances.get(uid)?.type!=='presentation')error('Referência de apresentação ausente: '+uid+'.');
 }
}
function validatePackage(p){
 object(p,['format','schemaVersion','packageId','isDemo','student','speech','hubs']);
 if(p.format!==CONTENT)error('Este arquivo não é um JSON de conteúdo do aluno.');
 if(!['1.0.0',VERSION].includes(p.schemaVersion))error('Versão do JSON incompatível. Este HTML aceita '+VERSION+'.');
 identifier(p.packageId,'Pacote');if(typeof p.isDemo!=='boolean')error('Identificação de demonstração inválida.');
 object(p.student,['id','displayName']);identifier(p.student.id,'Aluno');str(p.student.displayName,'Nome',100);
 object(p.speech,['locale','style']);if(p.speech.locale!=='en-US'||p.speech.style!=='conversational')error('Use a referência en-US / conversational.');
 list(p.hubs,'Hubs',100);if(!p.hubs.length)error('O pacote precisa de ao menos um hub.');unique(p.hubs,'Hubs');
 if(p.hubs.reduce((n,h)=>n+(Array.isArray(h.utterances)?h.utterances.length:0),0)>2000)error('Máximo de 2.000 frases por pacote.');
 for(const h of p.hubs)validateHub(h);
 return p;
}
function parsePackage(text){if(new TextEncoder().encode(text).length>MAX_BYTES)error('Arquivo maior que 5 MiB.');let p;try{p=JSON.parse(text);}catch{error('JSON inválido. Confira vírgulas e aspas.');}return validatePackage(p);}
function skeleton(){return [['present','Present'],['past','Past'],['future','Future'],['classroom','Classroom']].map(([id,title],order)=>({id,revision:1,title,order,sections:id==='classroom'?[]:[{id:'part-a',title:'Part A',order:0},{id:'part-b',title:'Part B',order:1}],utterances:[],presentations:[]}));}
function student(profile){return {profile:clone(profile),hubs:[],importedPackages:[],teacherOnly:{notes:''},history:[]};}
function emptyState(){return {stateVersion:1,students:[],boundStudentId:null,activeStudentId:null};}
function count(s){return s.hubs.reduce((n,h)=>n+h.utterances.length,0);}
function mergeById(a,b){const map=new Map(a.map(x=>[x.id,clone(x)]));for(const x of b)map.set(x.id,clone(x));return [...map.values()];}
function practiceSignature(u){return canonical({text:u.text,groups:u.groups.map(g=>({id:g.id,text:g.text,connected:g.connected,pronunciation:g.pronunciation})),audio:u.audio.mode==='file'?{mode:'file',url:u.audio.url}:{mode:'tts',locale:'en-US'}});}
function planImport(state,p,{role='student',namespace='real'}={}){
 validatePackage(p);if(p.isDemo!==(namespace==='demo'))error('Abra este arquivo na área '+(p.isDemo?'de demonstração':'real')+'.');
 if(role==='student'&&state.boundStudentId&&state.boundStudentId!==p.student.id)error('Este JSON pertence a outro aluno. O conteúdo atual foi preservado.');
 if(role==='teacher'&&state.activeStudentId&&state.activeStudentId!==p.student.id)error('O JSON é de outro aluno. Selecione o cadastro correto ou volte à lista para cadastrar pelo arquivo.');
 const next=clone(state), stats={newStudent:false,nameChanged:false,newHubs:0,newPhrases:0,updatedPhrases:0,practiceChanged:0,duplicatePhrases:0,oldItems:0,metadataUpdated:0,newLessons:0,alreadyImported:false};
 let dest=next.students.find(s=>s.profile.id===p.student.id);
 const bytes=canonical(p);
 if(dest){const prev=dest.importedPackages.find(x=>x.id===p.packageId);if(prev){if(prev.canonical!==bytes)error('Este identificador de pacote já foi usado para outro conteúdo. Exporte uma nova entrega.');stats.alreadyImported=true;return {next:clone(state),stats,studentId:dest.profile.id,package:p};}}
 if(!dest){dest=student(p.student);next.students.push(dest);stats.newStudent=true;}
 stats.nameChanged=dest.profile.displayName!==p.student.displayName;dest.profile=clone(p.student);
 for(const incoming of p.hubs){
  let old=dest.hubs.find(h=>h.id===incoming.id);
  if(!old){validateHub(incoming,true);dest.hubs.push(clone(incoming));stats.newHubs++;stats.newLessons+=(incoming.lessons||[]).length;stats.newPhrases+=incoming.utterances.length;continue;}
  if(incoming.revision>=old.revision){
   const candidate={id:old.id,revision:incoming.revision,title:incoming.title,order:incoming.order,sections:mergeById(old.sections,incoming.sections),presentations:mergeById(old.presentations,incoming.presentations),lessons:mergeById(old.lessons||[],incoming.lessons||[])};
   const current={id:old.id,revision:old.revision,title:old.title,order:old.order,sections:old.sections,presentations:old.presentations,lessons:old.lessons||[]};
   if(incoming.revision===old.revision&&!same(candidate,current))error('Conflito no hub '+old.title+': altere sua revisão antes de importar metadados diferentes.');
   if(incoming.revision>old.revision){stats.newLessons+=(incoming.lessons||[]).filter(l=>!(old.lessons||[]).some(x=>x.id===l.id)).length;Object.assign(old,candidate);stats.metadataUpdated++;}
  }else stats.oldItems++;
  for(const u of incoming.utterances){
   const index=old.utterances.findIndex(x=>x.id===u.id);
   if(index<0){old.utterances.push(clone(u));stats.newPhrases++;continue;}
   const before=old.utterances[index];
   if(u.revision<before.revision){stats.oldItems++;continue;}
   if(u.revision===before.revision){if(!same(u,before))error('Conflito na frase '+u.id+': mesma revisão com conteúdo diferente.');stats.duplicatePhrases++;continue;}
   const changed=practiceSignature(before)!==practiceSignature(u);
   if(changed){dest.history.push({hubId:old.id,utteranceId:u.id,revision:before.revision,snapshot:clone(before)});stats.practiceChanged++;}
   old.utterances[index]=clone(u);stats.updatedPhrases++;
  }
  validateHub(old,true);
 }
 dest.importedPackages.push({id:p.packageId,canonical:bytes});
 next.activeStudentId=p.student.id;if(role==='student')next.boundStudentId=p.student.id;
 return {next,stats,studentId:p.student.id,package:p};
}
function exportPackage(record,hubIds=null,isDemo=false){
 const selected=hubIds?record.hubs.filter(h=>hubIds.includes(h.id)):record.hubs;
 const hubs=selected.length?clone(selected):skeleton();
 const p={format:CONTENT,schemaVersion:VERSION,packageId:'delivery-'+id(),isDemo,student:clone(record.profile),speech:{locale:'en-US',style:'conversational'},hubs};
 validatePackage(p);for(const h of p.hubs)validateHub(h,true);return p;
}
function makeBackup(state,isDemo=false){return {format:BACKUP,schemaVersion:VERSION,isDemo,exportedAt:new Date().toISOString(),students:state.students.map(s=>({profile:clone(s.profile),hubs:clone(s.hubs.length?s.hubs:skeleton()),teacherOnly:clone(s.teacherOnly)}))};}
function planBackup(state,b,{namespace='real'}={}){
 object(b,['format','schemaVersion','isDemo','exportedAt','students']);
 if(b.format!==BACKUP||!['1.0.0',VERSION].includes(b.schemaVersion))error('Backup do professor inválido ou incompatível.');
 if(typeof b.isDemo!=='boolean'||b.isDemo!==(namespace==='demo'))error('Use o backup na área correta: real ou demonstração.');
 str(b.exportedAt,'Data');if(!Number.isFinite(Date.parse(b.exportedAt)))error('Data inválida.');list(b.students,'Alunos',500);
 const ids=new Set();let next=clone(state);const total={students:0,newPhrases:0,updatedPhrases:0,oldItems:0,notesMerged:0};
 for(const entry of b.students){
  object(entry,['profile','hubs','teacherOnly']);object(entry.teacherOnly,['notes']);if(typeof entry.teacherOnly.notes!=='string'||entry.teacherOnly.notes.length>50000)error('Notas inválidas.');
  if(ids.has(entry.profile?.id))error('Aluno repetido no backup.');ids.add(entry.profile?.id);
  const p={format:CONTENT,schemaVersion:VERSION,packageId:'restore-'+id(),isDemo:b.isDemo,student:entry.profile,speech:{locale:'en-US',style:'conversational'},hubs:entry.hubs};
  next.activeStudentId=null;const plan=planImport(next,p,{role:'teacher',namespace});next=plan.next;
  const dest=next.students.find(s=>s.profile.id===p.student.id);
  if(entry.teacherOnly.notes&&!dest.teacherOnly.notes.includes(entry.teacherOnly.notes)){dest.teacherOnly.notes=dest.teacherOnly.notes?dest.teacherOnly.notes+'\n\n— Notas do backup —\n'+entry.teacherOnly.notes:entry.teacherOnly.notes;total.notesMerged++;}
  total.students++;total.newPhrases+=plan.stats.newPhrases;total.updatedPhrases+=plan.stats.updatedPhrases;total.oldItems+=plan.stats.oldItems;
 }
 next.activeStudentId=state.activeStudentId;return {next,stats:total};
}
const api={VERSION,CONTENT,BACKUP,MAX_BYTES,clone,canonical,same,norm,id,validatePackage,validateHub,validateUtterance,parsePackage,skeleton,student,emptyState,count,practiceSignature,planImport,exportPackage,makeBackup,planBackup};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HOF=api;
})(globalThis);
