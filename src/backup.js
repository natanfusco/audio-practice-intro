/* HoF R6: portable student ZIP backup. Audio bytes never enter course JSON. */
(function(root){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const C=node?require('./core.js'):root.HOF,P=node?require('./practice.js'):root.HOFPractice;
const Zip=node?require('../vendor/jszip.min.js'):root.JSZip;
const FORMAT='hof.practice.student-backup',MAX_TOTAL=100*1024*1024,MAX_ARCHIVE=110*1024*1024,MAX_AUDIO=8*1024*1024,MAX_MANIFEST=5*1024*1024;
const idPattern=/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/;
const mimePattern=/^audio\/(webm|ogg|mp4|wav|mpeg)(;.*)?$/i;
const fail=message=>{throw new Error(message);};
function ext(mime){return {webm:'webm',ogg:'ogg',mp4:'m4a',wav:'wav',mpeg:'mp3'}[mime.split(';')[0].split('/')[1]?.toLowerCase()]||'bin';}
const table=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[i]=c>>>0;}
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function equalBytes(a,b){return a.length===b.length&&a.every((v,i)=>v===b[i]);}
function obj(x,fields){if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!fields.includes(k))||fields.some(k=>!Object.hasOwn(x,k)))fail('Manifesto de backup inválido.');}
function validateManifest(m){
 obj(m,['format','backupVersion','backupId','isDemo','exportedAt','content','practice','recordings']);
 if(m.format!==FORMAT||m.backupVersion!==1||(typeof m.backupId!=='string'||!idPattern.test(m.backupId))||typeof m.isDemo!=='boolean'||(typeof m.exportedAt!=='string'||!Number.isFinite(Date.parse(m.exportedAt))))fail('Tipo ou versão de backup incompatível.');
 C.validatePackage(m.content);if(m.content.isDemo!==m.isDemo)fail('Área de demonstração inconsistente no backup.');P.validatePractice(m.practice);
 if(!Array.isArray(m.recordings)||m.recordings.length>500)fail('Quantidade de áudios inválida no backup.');
 const needed=new Map(m.practice.attempts.filter(a=>a.recordingId).map(a=>[a.recordingId,a]));const seen=new Set();let total=0;
 for(const r of m.recordings){obj(r,['id','file','mime','bytes','crc32']);if(typeof r.id!=='string'||!idPattern.test(r.id)||seen.has(r.id)||!mimePattern.test(r.mime)||r.file!=='audio/'+r.id+'.'+ext(r.mime)||!Number.isSafeInteger(r.bytes)||r.bytes<1||r.bytes>MAX_AUDIO||!Number.isSafeInteger(r.crc32)||r.crc32<0||r.crc32>0xffffffff)fail('Descritor de áudio inválido.');
 const attempt=needed.get(r.id);if(!attempt||attempt.mime!==r.mime)fail('Um áudio não corresponde às tentativas do backup.');seen.add(r.id);total+=r.bytes;
 }
 if(seen.size!==needed.size)fail('O backup está sem um ou mais áudios.');if(total>MAX_TOTAL)fail('O backup excede 100 MiB.');return m;
}
function inspectZip(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<22||bytes.length>MAX_ARCHIVE)fail('Arquivo ZIP vazio, inválido ou maior que 110 MiB.');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===bytes.length){end=i;break;}
 if(end<0)fail('Este arquivo não é um ZIP de backup válido.');
 const count=v.getUint16(end+10,true),size=v.getUint32(end+12,true),offset=v.getUint32(end+16,true);
 if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||v.getUint16(end+8,true)!==count||count<1||count>501||offset+size!==end)fail('Estrutura de ZIP não suportada.');
 const names=new Map(),spans=[];let pos=offset,total=0;
 const decode=arr=>new TextDecoder('utf-8',{fatal:true}).decode(arr);
 for(let i=0;i<count;i++){
  if(pos+46>end||v.getUint32(pos,true)!==0x02014b50)fail('Índice ZIP inválido.');
  const flags=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),crc=v.getUint32(pos+16,true),compressed=v.getUint32(pos+20,true),uncompressed=v.getUint32(pos+24,true),nl=v.getUint16(pos+28,true),el=v.getUint16(pos+30,true),cl=v.getUint16(pos+32,true),local=v.getUint32(pos+42,true);
  if((flags&9)||method!==0||compressed!==uncompressed||pos+46+nl+el+cl>end||local+30>offset)fail('Use um backup ZIP gerado por esta versão do sistema (sem senha e sem recompressão).');
  const name=decode(bytes.subarray(pos+46,pos+46+nl));
  if(!(name==='manifest.json'||/^audio\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}\.(webm|ogg|m4a|wav|mp3)$/.test(name))||names.has(name))fail('Arquivo inesperado ou repetido no ZIP.');
  if(uncompressed>(name==='manifest.json'?MAX_MANIFEST:MAX_AUDIO))fail('Um arquivo do backup excede o limite de tamanho.');
  if(v.getUint32(local,true)!==0x04034b50||v.getUint16(local+6,true)!==flags||v.getUint16(local+8,true)!==method||v.getUint32(local+14,true)!==crc||v.getUint32(local+18,true)!==compressed||v.getUint32(local+22,true)!==uncompressed)fail('Cabeçalhos ZIP inconsistentes.');
  const ln=v.getUint16(local+26,true),le=v.getUint16(local+28,true),start=local+30+ln+le,finish=start+compressed;
  if(finish>offset||decode(bytes.subarray(local+30,local+30+ln))!==name)fail('Caminho ou conteúdo ZIP inválido.');
  spans.push([local,finish]);names.set(name,{bytes:uncompressed,crc});total+=uncompressed;pos+=46+nl+el+cl;
 }
 spans.sort((a,b)=>a[0]-b[0]);for(let i=1;i<spans.length;i++)if(spans[i][0]<spans[i-1][1])fail('Arquivos ZIP sobrepostos.');
 if(pos!==end||!names.has('manifest.json')||total>MAX_TOTAL)fail('Backup incompleto ou maior que 100 MiB.');return names;
}
async function create(student,rows,isDemo=false){
 const practice=C.clone(P.data(student));P.validatePractice(practice);
 const backupId='backup-'+C.id(),content=C.exportPackage(student,null,isDemo);content.packageId='content-'+backupId;
 const manifest={format:FORMAT,backupVersion:1,backupId,isDemo,exportedAt:new Date().toISOString(),content,practice,recordings:[]};
 const byId=new Map(rows.map(r=>[r.id,r]));const zip=new Zip();let total=0;
 for(const a of practice.attempts)if(a.recordingId){const r=byId.get(a.recordingId);if(!r||!(r.blob instanceof Blob)||!r.blob.size)fail('Uma gravação está ausente. O backup não foi criado incompleto.');if(r.studentId!==student.profile.id||r.mime!==a.mime)fail('Áudio de outro aluno ou formato inconsistente.');const bytes=new Uint8Array(await r.blob.arrayBuffer());total+=bytes.length;if(bytes.length>MAX_AUDIO||total>MAX_TOTAL)fail('Os áudios excedem o limite deste backup. Baixe gravações individuais antes de gerenciar o espaço.');const file='audio/'+r.id+'.'+ext(r.mime);manifest.recordings.push({id:r.id,file,mime:r.mime,bytes:bytes.length,crc32:crc32(bytes)});zip.file(file,bytes,{binary:true,compression:'STORE',createFolders:false});}
 validateManifest(manifest);const json=JSON.stringify(manifest);if(new TextEncoder().encode(json).length>MAX_MANIFEST)fail('O histórico é maior que 5 MiB. O backup não foi truncado.');
 zip.file('manifest.json',json,{compression:'STORE'});const bytes=await zip.generateAsync({type:'uint8array',compression:'STORE',streamFiles:false});inspectZip(bytes);return {bytes,manifest};
}
async function decode(input){
 if(typeof input?.size==='number'&&input.size>MAX_ARCHIVE)fail('Arquivo maior que 110 MiB.');
 const bytes=input instanceof Uint8Array?input:new Uint8Array(await input.arrayBuffer());const names=inspectZip(bytes);
 let zip;try{zip=await Zip.loadAsync(bytes,{checkCRC32:true,createFolders:false});}catch{fail('O ZIP está corrompido. Nenhum dado foi alterado.');}
 let manifest;try{manifest=JSON.parse(await zip.file('manifest.json').async('string'));}catch{fail('O manifesto do backup não pôde ser lido.');}validateManifest(manifest);
 const expected=new Set(['manifest.json',...manifest.recordings.map(r=>r.file)]);if(expected.size!==names.size||[...names.keys()].some(n=>!expected.has(n)))fail('Arquivos do ZIP não correspondem ao manifesto.');
 const rows=[];for(const r of manifest.recordings){const data=await zip.file(r.file).async('uint8array');if(data.length!==r.bytes||crc32(data)!==r.crc32)fail('Um áudio está corrompido ou incompleto.');rows.push({id:r.id,studentId:manifest.content.student.id,mime:r.mime,createdAt:manifest.exportedAt,blob:new Blob([data],{type:r.mime})});}
 return {manifest,rows};
}
function planRestore(state,decoded,namespace='real'){
 const m=validateManifest(decoded.manifest);if(m.isDemo!==(namespace==='demo'))fail('Importe o backup na área correta: real ou demonstração.');
 const contentPlan=C.planImport(state,m.content,{role:'student',namespace});const next=contentPlan.next;const i=next.students.findIndex(s=>s.profile.id===m.content.student.id);const result=P.mergePractice(next.students[i],m.practice);next.students[i]=result.student;next.boundStudentId=m.content.student.id;next.activeStudentId=m.content.student.id;
 return {next,stats:{newAttempts:result.added,recordings:m.recordings.length,newPhrases:contentPlan.stats.newPhrases,student:m.content.student.displayName},studentId:m.content.student.id,rows:decoded.rows};
}
const api={FORMAT,MAX_TOTAL,MAX_ARCHIVE,MAX_AUDIO,MAX_MANIFEST,crc32,equalBytes,ext,validateManifest,inspectZip,create,decode,planRestore};if(node)module.exports=api;else root.HOFStudentBackup=api;
})(globalThis);
