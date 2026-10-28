/* HoF R5 — speech and media playback with a single cancellable practice session. */
(function(root){
'use strict';
const american=v=>typeof v.lang==='string'&&v.lang.replaceAll('_','-').toLowerCase()==='en-us';
function stepsFor(u,mode='listen',selected=0,repetitions=2){
 const g=u.groups,all=g.map((_,i)=>i),out=[];
 if(!g.length)throw new Error('Esta frase não tem grupos.');
 const add=(indices,repeat=1)=>{const text=indices.length===g.length?u.text:indices.map(i=>g[i].text).join(' ');for(let r=0;r<repeat;r++)out.push({text,indices,full:indices.length===g.length,repeat:r+1,totalRepeats:repeat});};
 const n=Math.min(5,Math.max(1,Math.round(repetitions)||1));
 if(mode==='listen')add(all);
 else if(mode==='group'){if(!Number.isInteger(selected)||selected<0||selected>=g.length)throw new Error('Selecione um grupo válido.');add([selected],n);}
 else if(mode==='repeat')for(let i=0;i<g.length;i++)add([i],n);
 else if(mode==='build')for(let i=0;i<g.length;i++)add(all.slice(0,i+1),n);
 else if(mode==='backchain')for(let i=g.length-1;i>=0;i--)add(all.slice(i),n);
 else if(mode==='shadow')add(all,n);
 else throw new Error('Modo de prática desconhecido.');
 return out;
}
class PracticeAudio{
 constructor(env={}){
  this.synth=env.synth??root.speechSynthesis;this.Utterance=env.Utterance??root.SpeechSynthesisUtterance;this.Audio=env.Audio??root.Audio;
  this.setTimer=env.setTimer||setTimeout.bind(root);this.clearTimer=env.clearTimer||clearTimeout.bind(root);
  this.token=0;this.cleanups=[];this.listeners=new Set();this.voiceListeners=new Set();this.voiceURI=null;this.status={state:'idle',key:null,message:'Pronto para ouvir.'};
  this.voiceChange=()=>{const voices=this.voices();if(!voices.some(v=>v.voiceURI===this.voiceURI))this.voiceURI=voices[0]?.voiceURI||null;for(const fn of this.voiceListeners)fn(voices);};
  this.synth?.addEventListener?.('voiceschanged',this.voiceChange);this.voiceChange();
 }
 voices(){try{return (this.synth?.getVoices?.()||[]).filter(american);}catch{return [];}}
 setVoice(uri){if(!this.voices().some(v=>v.voiceURI===uri))throw new Error('Selecione uma voz americana disponível.');this.stop();this.voiceURI=uri;}
 subscribe(fn){this.listeners.add(fn);fn(this.status);return()=>this.listeners.delete(fn);}
 subscribeVoices(fn){this.voiceListeners.add(fn);fn(this.voices());return()=>this.voiceListeners.delete(fn);}
 emit(state){this.status={...this.status,...state};for(const fn of this.listeners)fn(this.status);}
 stop(message='Prática parada.'){
  this.token++;for(const fn of this.cleanups.splice(0))fn();try{this.synth?.cancel();}catch{}
  this.emit({state:'idle',key:null,indices:[],message});
 }
 sleep(ms,token){return new Promise(resolve=>{let finished=false;let timer;const done=()=>{if(finished)return;finished=true;this.clearTimer(timer);this.cleanups=this.cleanups.filter(x=>x!==done);resolve(token===this.token);};timer=this.setTimer(done,ms);this.cleanups.push(done);});}
 speak(text,rate,token){
  return new Promise((resolve,reject)=>{
   if(!this.synth||!this.Utterance){reject(new Error('Este navegador não oferece voz sintética. O texto continua disponível.'));return;}
   const voices=this.voices(),voice=voices.find(v=>v.voiceURI===this.voiceURI)||voices[0];
   if(!voice){reject(new Error('Nenhuma voz en-US disponível. Abra as opções de voz ou use um navegador com uma voz americana instalada.'));return;}
   this.voiceURI=voice.voiceURI;
   const u=new this.Utterance(text);u.voice=voice;u.lang='en-US';u.rate=rate;u.pitch=1;u.volume=1;
   let settled=false,timer;
   const finish=(err=null)=>{if(settled)return;settled=true;this.clearTimer(timer);u.onend=null;u.onerror=null;this.cleanups=this.cleanups.filter(x=>x!==cancel);if(err)reject(err);else resolve(token===this.token);};
   const cancel=()=>finish();this.cleanups.push(cancel);
   u.onend=()=>finish();u.onerror=event=>{
    if(token!==this.token){finish();return;}
    const msg=event.error==='not-allowed'?'O navegador bloqueou o áudio. Toque em Ouvir novamente.':event.error==='network'?'A voz escolhida depende de conexão e não respondeu. Tente outra voz americana.':'Não foi possível reproduzir esta voz. Selecione outra voz en-US e tente novamente.';
    finish(new Error(msg));
   };
   timer=this.setTimer(()=>{finish(new Error('A voz não concluiu a reprodução. Pare e tente outra voz.'));try{this.synth.cancel();}catch{}},Math.min(180000,Math.max(20000,text.split(/\s+/).length*1600)));
   try{this.synth.speak(u);}catch(err){finish(new Error('Não foi possível iniciar a voz deste navegador.'));}
  });
 }
 playFile(url,rate,token){return new Promise((resolve,reject)=>{
  if(!this.Audio){reject(new Error('Áudio indisponível neste navegador.'));return;}
  const audio=new this.Audio();audio.preload='none';audio.src=url;audio.playbackRate=rate;audio.preservesPitch=true;
  let settled=false,timer;const finish=(err=null)=>{if(settled)return;settled=true;this.clearTimer(timer);audio.onended=null;audio.onerror=null;this.cleanups=this.cleanups.filter(x=>x!==cancel);audio.pause();audio.removeAttribute?.('src');audio.load?.();if(err)reject(err);else resolve(token===this.token);};
  const cancel=()=>finish();this.cleanups.push(cancel);audio.onended=()=>finish();audio.onerror=()=>finish(new Error(url.startsWith('blob:')?'Esta gravação não pôde ser reproduzida neste navegador. Baixe o áudio ou tente outro navegador.':'O arquivo de áudio não pôde ser carregado. Você pode escolher Voz americana como referência.'));
  timer=this.setTimer(()=>finish(new Error('O arquivo de áudio não respondeu. Tente novamente ou escolha Voz americana.')),180000);
  try{const p=audio.play();p?.catch(()=>finish(new Error('O navegador não iniciou o áudio. Toque novamente no botão de escuta.')));}catch{finish(new Error('Não foi possível abrir o áudio.'));}
 });}
 async play(u,{key=u.id,mode='listen',selected=0,repetitions=2,gap=3,rate=0.9,reference='auto'}={}){
  this.stop('Preparando áudio…');const token=this.token;
  const steps=stepsFor(u,mode,selected,repetitions),speed=Math.max(.65,Math.min(1.1,Number(rate)||.9));
  const gapMs=Math.max(1,Math.min(10,Number(gap)||3))*1000;
  try{
   for(let i=0;i<steps.length;i++){
    if(token!==this.token)return;const step=steps[i];const file=step.full&&u.audio.mode==='file'&&reference!=='tts';
    this.emit({state:'speaking',key,indices:step.indices,step:i+1,total:steps.length,mode,message:(mode==='shadow'?'Fale junto · ':file?'Áudio de referência · ':'Voz americana · ')+(i+1)+'/'+steps.length});
    const ok=file?await this.playFile(u.audio.url,speed,token):await this.speak(step.text,speed,token);
    if(!ok||token!==this.token)return;
    if(mode!=='listen'){
     this.emit({state:'waiting',key,indices:step.indices,message:'Sua vez · repita o trecho ('+Math.round(gapMs/1000)+' s)'});
     if(!await this.sleep(gapMs,token)||token!==this.token)return;
    }
   }
   if(token===this.token)this.emit({state:'complete',key,indices:[],message:'Prática concluída. Você pode ouvir novamente.'});
  }catch(err){if(token===this.token){for(const fn of this.cleanups.splice(0))fn();this.emit({state:'error',key,indices:[],message:err.message});}}
 }
 async playRecording(url,{key='recording'}={}){
  this.stop('Preparando sua gravação…');const token=this.token;
  try{this.emit({state:'speaking',key,indices:[],message:'Ouvindo sua gravação…'});const ok=await this.playFile(url,1,token);if(ok&&token===this.token)this.emit({state:'complete',key,message:'Gravação concluída.'});}
  catch(err){if(token===this.token)this.emit({state:'error',key,indices:[],message:err.message});}
 }
 async compare(u,url,{key='comparison',rate=.9,reference='auto'}={}){
  this.stop('Preparando comparação…');const token=this.token;
  try{
   this.emit({state:'speaking',key,indices:u.groups.map((_,i)=>i),message:'1/2 · Ouça a referência.'});
   const ok=u.audio.mode==='file'&&reference!=='tts'?await this.playFile(u.audio.url,rate,token):await this.speak(u.text,rate,token);
   if(!ok||token!==this.token)return;
   this.emit({state:'waiting',key,indices:[],message:'Agora, a sua gravação…'});
   if(!await this.sleep(500,token)||token!==this.token)return;
   this.emit({state:'speaking',key,indices:[],message:'2/2 · Ouça sua voz.'});
   const played=await this.playFile(url,1,token);if(played&&token===this.token)this.emit({state:'complete',key,indices:[],message:'Compare por escuta. A autoavaliação é sua; não é uma nota automática.'});
  }catch(err){if(token===this.token)this.emit({state:'error',key,indices:[],message:err.message});}
 }
 destroy(){this.stop();this.synth?.removeEventListener?.('voiceschanged',this.voiceChange);this.listeners.clear();this.voiceListeners.clear();}
}
const api={PracticeAudio,stepsFor,american};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HOFAudio=api;
})(globalThis);
