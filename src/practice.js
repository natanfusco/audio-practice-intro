(function(root){
'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.HOF;
const RATINGS=['needs_practice','with_support','independent'];
const LABELS={needs_practice:'Preciso praticar',with_support:'Consigo com apoio',independent:'Consigo sem apoio'};
const data=s=>s.practice||{attempts:[],review:[]};
const key=(hubId,utteranceId)=>hubId+'::'+utteranceId;
function requirePhrase(student,hubId,utteranceId){const hub=student.hubs.find(h=>h.id===hubId),u=hub?.utterances.find(u=>u.id===utteranceId);if(!u)throw new Error('Esta frase não está mais disponível neste perfil.');return u;}
function history(student,hubId,u,includeDeleted=false){return data(student).attempts.filter(a=>a.hubId===hubId&&a.utteranceId===u.id&&(includeDeleted||!a.deletedAt)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));}
function summary(student,hubId,u){const all=history(student,hubId,u),sig=C.practiceSignature(u),current=all.filter(a=>a.signature===sig);return {all,current,latest:current[0]||null,review:data(student).review.some(r=>r.hubId===hubId&&r.utteranceId===u.id),outdated:all.length>0&&!current.length};}
function stats(student){let practiced=0,independent=0,total=0;for(const h of student.hubs)for(const u of h.utterances){total++;const s=summary(student,h.id,u);if(s.current.length)practiced++;if(s.latest?.rating==='independent')independent++;}return {total,practiced,independent,attempts:data(student).attempts.filter(a=>!a.deletedAt).length,review:data(student).review.length,deleted:data(student).attempts.filter(a=>a.deletedAt).length};}
function addAttempt(student,{hubId,utterance,rating=null,recording=null,createdAt=new Date().toISOString(),id='attempt-'+C.id()}){
 requirePhrase(student,hubId,utterance.id);if(rating!==null&&!RATINGS.includes(rating))throw new Error('Autoavaliação inválida.');
 if(!recording&&!rating)throw new Error('Escolha uma autoavaliação ou grave sua voz.');
 const next=C.clone(student);next.practice=C.clone(data(student));
 const a={id,hubId,utteranceId:utterance.id,createdAt,contentRevision:utterance.revision,signature:C.practiceSignature(utterance),snapshot:C.clone(utterance),rating,kind:recording?'recording':'self_assessment',recordingId:recording?.id||null,mime:recording?.mime||null,durationMs:recording?.durationMs||null,deletedAt:null};
 validateAttempt(a);if(next.practice.attempts.some(x=>x.id===id))throw new Error('Tentativa já registrada.');next.practice.attempts.push(a);validatePractice(next.practice);return {student:next,attempt:a};
}
function markReview(student,hubId,utteranceId,on){requirePhrase(student,hubId,utteranceId);const next=C.clone(student);next.practice=C.clone(data(student));next.practice.review=next.practice.review.filter(r=>key(r.hubId,r.utteranceId)!==key(hubId,utteranceId));if(on)next.practice.review.push({hubId,utteranceId,addedAt:new Date().toISOString()});return next;}
function trash(student,id,restore=false){const next=C.clone(student);next.practice=C.clone(data(student));const a=next.practice.attempts.find(a=>a.id===id);if(!a)throw new Error('Tentativa não encontrada.');a.deletedAt=restore?null:new Date().toISOString();return next;}
function purge(student,id){const next=C.clone(student);next.practice=C.clone(data(student));const a=next.practice.attempts.find(a=>a.id===id);if(!a?.deletedAt)throw new Error('Mova a tentativa para a lixeira antes de excluir definitivamente.');next.practice.attempts=next.practice.attempts.filter(a=>a.id!==id);return {student:next,recordingId:a.recordingId};}
function object(x,keys){if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(x,k)))throw new Error('Registro de prática inválido.');}
function id(x){if(typeof x!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(x))throw new Error('Identificador de prática inválido.');}
function date(x){if(typeof x!=='string'||!/^\d{4}-\d\d-\d\dT/.test(x)||!Number.isFinite(Date.parse(x)))throw new Error('Data de tentativa inválida.');}
function validateAttempt(a){
 object(a,['id','hubId','utteranceId','createdAt','contentRevision','signature','snapshot','rating','kind','recordingId','mime','durationMs','deletedAt']);
 for(const k of ['id','hubId','utteranceId'])id(a[k]);date(a.createdAt);if(a.deletedAt!==null)date(a.deletedAt);
 C.validateUtterance(a.snapshot);
 if(a.snapshot.id!==a.utteranceId||a.snapshot.revision!==a.contentRevision||a.signature!==C.practiceSignature(a.snapshot))throw new Error('A tentativa não corresponde à versão da frase.');
 if(a.rating!==null&&!RATINGS.includes(a.rating))throw new Error('Autoavaliação desconhecida.');
 if(!['recording','self_assessment'].includes(a.kind))throw new Error('Tipo de tentativa inválido.');
 if(a.kind==='recording'){id(a.recordingId);if(typeof a.mime!=='string'||!/^audio\/(webm|ogg|mp4|wav|mpeg)(;.*)?$/i.test(a.mime)||!Number.isFinite(a.durationMs)||a.durationMs<250||a.durationMs>600000)throw new Error('Metadados de áudio inválidos.');}
 else if(a.recordingId!==null||a.mime!==null||a.durationMs!==null||!a.rating)throw new Error('Registro de autoavaliação inválido.');
}
function validatePractice(p){object(p,['attempts','review']);if(!Array.isArray(p.attempts)||p.attempts.length>2000||!Array.isArray(p.review)||p.review.length>2000)throw new Error('Quantidade de registros de prática inválida.');const ids=new Set(),recordings=new Set();for(const a of p.attempts){validateAttempt(a);if(ids.has(a.id))throw new Error('Tentativa duplicada.');ids.add(a.id);if(a.recordingId){if(recordings.has(a.recordingId))throw new Error('Gravação usada por tentativas diferentes.');recordings.add(a.recordingId);}}if(recordings.size>500)throw new Error('Limite de 500 gravações por perfil atingido. Baixe um backup e gerencie suas tentativas antes de salvar outra gravação.');const rs=new Set();for(const r of p.review){object(r,['hubId','utteranceId','addedAt']);id(r.hubId);id(r.utteranceId);date(r.addedAt);const k=key(r.hubId,r.utteranceId);if(rs.has(k))throw new Error('Revisão duplicada.');rs.add(k);}return p;}
function mergePractice(student,incoming){validatePractice(incoming);const next=C.clone(student);next.practice=C.clone(data(student));const map=new Map(next.practice.attempts.map(a=>[a.id,a]));let added=0;for(const a of incoming.attempts){if(map.has(a.id)){if(!C.same({...map.get(a.id),deletedAt:null},{...a,deletedAt:null}))throw new Error('Conflito na tentativa '+a.id+'. Nenhuma alteração foi aplicada.');}else{requirePhrase(next,a.hubId,a.utteranceId);map.set(a.id,C.clone(a));added++;}}next.practice.attempts=[...map.values()];for(const r of incoming.review){requirePhrase(next,r.hubId,r.utteranceId);if(!next.practice.review.some(x=>key(x.hubId,x.utteranceId)===key(r.hubId,r.utteranceId)))next.practice.review.push(C.clone(r));}validatePractice(next.practice);return {student:next,added};}
const api={RATINGS,LABELS,data,key,requirePhrase,history,summary,stats,addAttempt,markReview,trash,purge,validateAttempt,validatePractice,mergePractice};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HOFPractice=api;
})(globalThis);
