/* HoF R6: capture starts only after a user action. No upload or automatic save. */
(function(root){
'use strict';
const MAX_BYTES=8*1024*1024,MAX_MS=120000;
class VoiceRecorder{
 constructor(env={}){
  this.getUserMedia=env.getUserMedia||(root.navigator?.mediaDevices?.getUserMedia?.bind(root.navigator.mediaDevices));
  this.MediaRecorder=env.MediaRecorder||root.MediaRecorder;this.Blob=env.Blob||root.Blob;
  this.secure=env.secureContext??root.isSecureContext;this.now=env.now||Date.now;this.setTimer=env.setTimer||setTimeout.bind(root);this.clearTimer=env.clearTimer||clearTimeout.bind(root);
  this.listeners=new Set();this.token=0;this.state={phase:'idle',message:'Pronto para gravar.',durationMs:0};this.stream=null;this.recorder=null;this.timer=null;this.requestTimer=null;this.stopTimer=null;this.chunks=[];this.draft=null;
 }
 get active(){return ['requesting','recording','stopping'].includes(this.state.phase);}
 subscribe(fn){this.listeners.add(fn);fn(this.state);return()=>this.listeners.delete(fn);}
 emit(data){this.state={...this.state,...data};for(const fn of this.listeners)fn(this.state);}
 support(){if(this.secure===false)return 'O microfone precisa de uma página segura. Abra por HTTPS ou em um navegador que permita o arquivo local.';if(!this.getUserMedia||!this.MediaRecorder)return 'Este navegador não oferece gravação. Você pode continuar ouvindo e praticando com o texto.';return null;}
 release(){this.clearTimer(this.timer);this.clearTimer(this.requestTimer);this.clearTimer(this.stopTimer);this.timer=this.requestTimer=this.stopTimer=null;for(const t of this.stream?.getTracks?.()||[]){t.onended=null;try{t.stop();}catch{}}this.stream=null;}
 async start(){
  if(this.active||this.draft)throw new Error('Salve ou descarte a gravação atual antes de começar outra.');
  const unsupported=this.support();if(unsupported){this.emit({phase:'error',message:unsupported});throw new Error(unsupported);}
  const token=++this.token;this.emit({phase:'requesting',message:'Aguardando permissão do microfone…',durationMs:0});
  this.requestTimer=this.setTimer(()=>{if(token===this.token&&this.state.phase==='requesting'){this.token++;this.emit({phase:'error',message:'A permissão não foi concluída. Tente novamente quando estiver pronto.'});}},45000);
  try{
   const stream=await this.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
   if(token!==this.token){for(const t of stream.getTracks())t.stop();return false;}
   this.clearTimer(this.requestTimer);this.requestTimer=null;this.stream=stream;
   const candidates=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus','audio/webm'];
   const mime=candidates.find(m=>this.MediaRecorder.isTypeSupported?.(m));
   const mr=new this.MediaRecorder(stream,mime?{mimeType:mime}:undefined);this.recorder=mr;this.chunks=[];this.bytes=0;this.startedAt=this.now();this.stoppedAt=null;this.warning='';
   mr.ondataavailable=event=>{if(token!==this.token)return;if(event.data?.size){this.chunks.push(event.data);this.bytes+=event.data.size;if(this.bytes>MAX_BYTES){this.warning='O limite de tamanho foi atingido.';this.stop();}}};
   mr.onerror=()=>{if(token!==this.token)return;this.warning='A captura foi interrompida pelo navegador.';this.stop();};
   let finalized=false;
   mr.onstop=()=>{
    if(token!==this.token||finalized)return;finalized=true;const durationMs=Math.max(0,(this.stoppedAt||this.now())-this.startedAt);this.release();
    const type=mr.mimeType||this.chunks.find(b=>b.type)?.type||'';const blob=new this.Blob(this.chunks,{type});this.chunks=[];
    if(!blob.size||durationMs<250){this.emit({phase:'error',message:'A gravação ficou curta demais ou vazia. Tente novamente.',durationMs:0});return;}
    if(blob.size>MAX_BYTES){this.emit({phase:'error',message:'A gravação excedeu 8 MiB. Faça uma tentativa mais curta.',durationMs:0});return;}
    if(!/^audio\/(webm|ogg|mp4|wav|mpeg)(;.*)?$/i.test(type)){this.emit({phase:'error',message:'O navegador gerou um formato de áudio não reconhecido. Tente outro navegador.'});return;}
    this.draft={blob,mime:type,durationMs,createdAt:new Date(this.startedAt).toISOString(),warning:this.warning};
    this.emit({phase:'draft',message:this.warning?this.warning+' Ouça o trecho antes de salvar.':'Gravação pronta. Ouça e salve sua tentativa.',durationMs});
   };
   for(const track of stream.getAudioTracks?.()||[])track.onended=()=>{if(token===this.token&&this.state.phase==='recording'){this.warning='O microfone foi desconectado.';this.stop();}};
   mr.start(250);this.emit({phase:'recording',message:'Gravando sua voz…',durationMs:0});
   this.timer=this.setTimer(()=>{if(token===this.token){this.warning='Limite de dois minutos atingido.';this.stop();}},MAX_MS);
   return true;
  }catch(err){
   if(token!==this.token)return false;this.release();this.recorder=null;
   const message=err?.name==='NotAllowedError'?'Permissão do microfone negada. Você pode autorizar nas opções do navegador e tentar novamente.':err?.name==='NotFoundError'?'Nenhum microfone foi encontrado.':err?.name==='NotReadableError'?'O microfone está ocupado ou não pôde ser aberto.':'Não foi possível iniciar a gravação neste navegador.';
   this.emit({phase:'error',message});throw new Error(message);
  }
 }
 stop(){
  if(this.state.phase==='requesting'){this.token++;this.release();this.emit({phase:'idle',message:'Solicitação de microfone cancelada.'});return;}
  if(this.state.phase!=='recording')return;
  this.stoppedAt=this.now();this.emit({phase:'stopping',message:'Finalizando a gravação…'});
  try{if(this.recorder?.state!=='inactive')this.recorder.stop();else this.recorder?.onstop?.();}catch{this.release();this.emit({phase:'error',message:'Não foi possível finalizar esta gravação.'});return;}
  if(this.state.phase==='stopping')this.stopTimer=this.setTimer(()=>{if(this.state.phase==='stopping'){this.token++;this.release();this.emit({phase:'error',message:'O navegador não finalizou o áudio. Tente uma gravação mais curta.'});}},5000);
 }
 clearDraft(){if(this.active)throw new Error('Pare a gravação primeiro.');this.draft=null;this.emit({phase:'idle',message:'Pronto para gravar.',durationMs:0});}
 destroy(){this.token++;this.release();try{if(this.recorder?.state!=='inactive')this.recorder?.stop();}catch{}this.draft=null;this.listeners.clear();}
}
const api={VoiceRecorder,MAX_BYTES,MAX_MS};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HOFRecorder=api;
})(globalThis);
