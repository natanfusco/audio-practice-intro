(function(root){
'use strict';
class Store{
 constructor(role){this.name='hof-practice-'+role+'-v1';this.db=null;this.temporary=false;this.memory=new Map();this.audioMemory=new Map();}
 open(){return new Promise((resolve,reject)=>{let request;try{request=indexedDB.open(this.name,2);}catch(e){reject(e);return;}
 request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('states'))db.createObjectStore('states',{keyPath:'key'});if(!db.objectStoreNames.contains('recordings'))db.createObjectStore('recordings',{keyPath:'key'});};
 request.onsuccess=()=>{this.db=request.result;this.db.onversionchange=()=>this.db.close();resolve();};
 request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Feche outras abas deste aplicativo e tente novamente.'));
 });}
 async load(key){if(this.temporary)return HOF.clone(this.memory.get(key)||{key,version:0,data:HOF.emptyState()});return new Promise((resolve,reject)=>{const tx=this.db.transaction('states','readonly'),req=tx.objectStore('states').get(key);req.onsuccess=()=>resolve(req.result||{key,version:0,data:HOF.emptyState()});req.onerror=()=>reject(req.error);});}
 audioKey(namespace,studentId,id){return namespace+'::'+studentId+'::'+id;}
 async getRecording(namespace,studentId,id){const key=this.audioKey(namespace,studentId,id);if(this.temporary)return this.audioMemory.get(key)||null;return new Promise((resolve,reject)=>{const tx=this.db.transaction('recordings','readonly'),req=tx.objectStore('recordings').get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}
 async getRecordings(namespace,studentId,ids){const unique=[...new Set(ids)];const rows=[];for(const id of unique){const row=await this.getRecording(namespace,studentId,id);if(!row)throw new Error('A gravação '+id+' não foi encontrada. O backup não foi criado incompleto.');rows.push(row);}return rows;}
 async save(key,data,expected){return this.saveWithRecordings(key,data,expected);}
 async saveWithRecordings(key,data,expected,puts=[],deletes=[]){
 const value={key,version:expected+1,data:HOF.clone(data)};
 const rows=puts.map(r=>{if(!(r.blob instanceof Blob)||!r.blob.size)throw new Error('Arquivo de áudio vazio ou inválido.');return {...r,key:this.audioKey(key,r.studentId,r.id),namespace:key};});
 const deleteKeys=deletes.map(r=>this.audioKey(key,r.studentId,r.id));
 if(this.temporary){const current=this.memory.get(key);if((current?.version||0)!==expected)throw new Error('Dados alterados em outra operação. Recarregue e tente novamente.');if(rows.some(r=>this.audioMemory.has(r.key)))throw new Error('Esta gravação já existe. Nenhuma alteração foi aplicada.');for(const k of deleteKeys)this.audioMemory.delete(k);for(const r of rows)this.audioMemory.set(r.key,r);this.memory.set(key,value);return value;}
 return new Promise((resolve,reject)=>{let conflict=false;const tx=this.db.transaction(['states','recordings'],'readwrite'),states=tx.objectStore('states'),recordings=tx.objectStore('recordings'),req=states.get(key);
 req.onsuccess=()=>{if((req.result?.version||0)!==expected){conflict=true;tx.abort();return;}states.put(value);for(const k of deleteKeys)recordings.delete(k);for(const row of rows)recordings.add(row);};
 tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(new Error(conflict?'Os dados mudaram em outra aba. Recarregue a página antes de salvar.':'Não foi possível salvar. O armazenamento pode estar cheio, indisponível ou conter um áudio com este ID. Os dados anteriores foram preservados; você ainda pode baixar a gravação não salva.'));tx.onerror=()=>{};
 });}
}
root.HOFStore=Store;if(typeof module!=='undefined'&&module.exports)module.exports=Store;
})(globalThis);
