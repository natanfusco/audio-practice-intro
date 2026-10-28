/* Development-only QA. Generates a tone in memory; never requests microphone access. */
(function(){
const out=document.getElementById('results'),status=document.getElementById('status');
const show=(message)=>{const li=document.createElement('li');li.textContent='✓ '+message;out.append(li);};
const assert=(value,message)=>{if(!value)throw new Error(message);};
const openV1=(name,state)=>new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);req.onupgradeneeded=()=>req.result.createObjectStore('states',{keyPath:'key'});req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('states','readwrite');tx.objectStore('states').put({key:'demo',version:1,data:state});tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);};});
document.getElementById('run').addEventListener('click',async()=>{
 document.getElementById('run').disabled=true;status.textContent='Executando teste técnico com áudio sintético, sem microfone…';out.replaceChildren();let context,controller,oscillator;
 try{
  const AudioContext=window.AudioContext||window.webkitAudioContext;context=new AudioContext();await context.resume();const destination=context.createMediaStreamDestination();oscillator=context.createOscillator();oscillator.frequency.value=330;oscillator.connect(destination);oscillator.start();
  controller=new HOFRecorder.VoiceRecorder({secureContext:true,getUserMedia:async()=>destination.stream});
  const captured=new Promise((resolve,reject)=>{const off=controller.subscribe(s=>{if(s.phase==='draft'){off();resolve(controller.draft);}else if(s.phase==='error'){off();reject(new Error(s.message));}});});
  await controller.start();await new Promise(resolve=>setTimeout(resolve,650));controller.stop();const draft=await captured;
  assert(draft.blob.size>0,'Captura vazia');show('MediaRecorder real gerou um áudio '+draft.mime+' sem solicitar o microfone.');
  const decodedAudio=await context.decodeAudioData(await draft.blob.arrayBuffer());assert(decodedAudio.duration>0,'Áudio não decodificável');show('O navegador decodificou o áudio gravado: '+decodedAudio.duration.toFixed(2)+' s.');
  const role='qa-r6-'+Date.now(),store=new HOFStore(role),state=HOF.planImport(HOF.emptyState(),window.QA_PACKAGE,{namespace:'demo'}).next;
  await openV1(store.name,state);await store.open();const before=await store.load('demo');assert(before.version===1,'Migração apagou estado');show('Migração de IndexedDB v1 para v2 preservou o conteúdo.');
  const s=state.students[0],u=s.hubs[0].utterances[0],rid='qa-recording-'+Date.now();
  const created=HOFPractice.addAttempt(s,{hubId:'present',utterance:u,rating:'with_support',recording:{id:rid,mime:draft.mime,durationMs:draft.durationMs}});state.students[0]=created.student;
  const row={id:rid,studentId:s.profile.id,mime:draft.mime,createdAt:draft.createdAt,blob:draft.blob};await store.saveWithRecordings('demo',state,1,[row]);
  const saved=await store.load('demo'),stored=await store.getRecording('demo',s.profile.id,rid);assert(saved.data.students[0].practice.attempts.length===1&&stored.blob.size===draft.blob.size,'Estado/áudio não persistiram');show('Tentativa e Blob foram salvos juntos no IndexedDB.');
  const bytes=await HOFStudentBackup.create(saved.data.students[0],[stored],true),backup=await HOFStudentBackup.decode(bytes.bytes),plan=HOFStudentBackup.planRestore(HOF.emptyState(),backup,'demo');
  const restoredStore=new HOFStore(role+'-restore');await restoredStore.open();await restoredStore.saveWithRecordings('demo',plan.next,0,plan.rows);const restored=await restoredStore.getRecording('demo',s.profile.id,rid);
  assert(HOFStudentBackup.equalBytes(new Uint8Array(await restored.blob.arrayBuffer()),new Uint8Array(await draft.blob.arrayBuffer())),'Bytes mudaram no backup');show('ZIP exportado, validado e restaurado em outro banco com os mesmos bytes de áudio.');
  const latest=await store.load('demo');await store.save('demo',latest.data,latest.version);let conflict=false;try{await store.saveWithRecordings('demo',latest.data,latest.version,[{...row,id:rid+'-conflict'}]);}catch{conflict=true;}assert(conflict&&!await store.getRecording('demo',s.profile.id,rid+'-conflict'),'Conflito deixou áudio órfão');show('Conflito entre versões abortou a transação sem deixar áudio órfão.');
  const current=await store.load('demo');let duplicate=false;try{await store.saveWithRecordings('demo',current.data,current.version,[row]);}catch{duplicate=true;}assert(duplicate&&(await store.load('demo')).version===current.version,'Falha binária alterou estado');show('Falha de áudio duplicado reverteu também a gravação do estado.');
  sessionStorage.setItem('hof-r6-qa-db',store.name);sessionStorage.setItem('hof-r6-qa-recording',rid);sessionStorage.setItem('hof-r6-qa-student',s.profile.id);
  status.textContent='PASS — 7 verificações reais concluídas. Áudio sintético; nenhum microfone foi solicitado.';
 }catch(err){status.textContent='FAIL — '+err.message;console.error(err);}
 finally{try{controller?.destroy();}catch{}try{oscillator?.stop();}catch{}try{await context?.close();}catch{}document.getElementById('run').disabled=false;}
});
document.getElementById('reopen').addEventListener('click',async()=>{try{const name=sessionStorage.getItem('hof-r6-qa-db');if(!name)throw new Error('Execute o teste primeiro.');const store=new HOFStore('qa');store.name=name;await store.open();const state=await store.load('demo'),row=await store.getRecording('demo',sessionStorage.getItem('hof-r6-qa-student'),sessionStorage.getItem('hof-r6-qa-recording'));assert(row?.blob.size>0&&state.data.students[0].practice.attempts.length===1,'Dados ausentes');status.textContent='PASS — após recarregar, tentativa e áudio foram recuperados do IndexedDB.';}catch(err){status.textContent='FAIL — '+err.message;}});
})();
