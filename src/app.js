(function(){
'use strict';
const C=HOF,role=window.HOF_ROLE,teacher=role==='teacher',store=new HOFStore(role);
const audio=new HOFAudio.PracticeAudio();
const P=HOFPractice,B=HOFStudentBackup,recorder=new HOFRecorder.VoiceRecorder();
let captureContext=null,draftUrl=null,captureTimer=null,modalUrls=[];
let audioSettings={rate:.9,gap:3,repetitions:2};
const app={namespace:'real',state:C.emptyState(),version:0,view:'home',hubId:null,sectionId:'all',lessonId:'all',ready:false,busy:false,preview:false,filter:''};
const root=document.getElementById('app'),dialog=document.getElementById('dialog');let toastTimer;
const e=(tag,props={},children=[])=>{const node=document.createElement(tag);for(const [k,v]of Object.entries(props)){if(v===null||v===undefined)continue;if(k==='class')node.className=v;else if(k==='text')node.textContent=v;else if(k.startsWith('on'))node.addEventListener(k.slice(2).toLowerCase(),v);else if(k==='disabled')node.disabled=v;else if(k==='value')node.value=v;else node.setAttribute(k,v);}for(const child of (Array.isArray(children)?children:[children])){if(child!==null&&child!==undefined)node.append(child instanceof Node?child:document.createTextNode(String(child)));}return node;};
const button=(label,fn,cls='',props={})=>e('button',{type:'button',class:'btn '+cls,onClick:fn,...props},label);
const badge=(label,cls='')=>e('span',{class:'pill '+cls},label);
const current=()=>app.state.students.find(s=>s.profile.id===(teacher?app.state.activeStudentId:app.state.boundStudentId));
const enabled=()=>app.ready&&!app.busy;
const allHubs=s=>{const actual=s?.hubs||[];return [...C.skeleton().filter(h=>!actual.some(a=>a.id===h.id)),...actual].sort((a,b)=>a.order-b.order||a.title.localeCompare(b.title));};
const setView=(view,hubId=null)=>{if(!canNavigate())return;audio.stop();app.view=view;app.hubId=hubId;app.sectionId='all';app.lessonId='all';render();window.scrollTo?.({top:0,behavior:'instant'});};
function toast(message,bad=false){let n=document.getElementById('toast');if(n)n.remove();n=e('div',{id:'toast',class:'toast'+(bad?' error':''),role:bad?'alert':'status'},message);document.body.append(n);clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.remove(),6500);}
function fail(err){toast(err?.message||String(err),true);}
function download(data,name,type='application/json'){const blob=data instanceof Blob?data:new Blob([typeof data==='string'||ArrayBuffer.isView(data)?data:JSON.stringify(data,null,2)],{type});const url=URL.createObjectURL(blob);const a=e('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function filename(s){return (s||'aluno').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,45)||'aluno';}
async function save(next,message,media={}){if(!enabled())return false;app.busy=true;try{const saved=await store.saveWithRecordings(app.namespace,next,app.version,media.puts||[],media.deletes||[]);app.state=saved.data;app.version=saved.version;if(message)toast(message+(store.temporary?' Apenas nesta sessão.':''));return true;}catch(err){fail(err);return false;}finally{app.busy=false;render();}}
async function switchNamespace(ns){if(!canNavigate())return;audio.stop();if(app.busy||!app.ready)return;try{const saved=await store.load(ns);app.namespace=ns;app.state=saved.data;app.version=saved.version;app.view='home';app.hubId=null;app.preview=false;render();}catch(err){fail(err);}}
function closeDialog(){clearModalMedia();if(audio.status.key==='voice-test')audio.stop();if(dialog.open)dialog.close();dialog.replaceChildren();}
function modal(title,subtitle,contents){clearModalMedia();dialog.setAttribute('aria-labelledby','modal-title');dialog.replaceChildren(e('div',{class:'dialog-head'},[e('div',{},[e('h2',{id:'modal-title'},title),e('p',{class:'help'},subtitle)]),button('×',closeDialog,'close',{'aria-label':'Fechar'})]),e('div',{class:'dialog-body'},contents));if(!dialog.open)dialog.showModal();dialog.querySelector('button')?.focus();}
function initials(name){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
function selectedStudent(s){if(!canNavigate())return;audio.stop();app.state.activeStudentId=s.profile.id;app.view='student';app.hubId=null;app.filter='';render();}
function leaveStudent(){if(!canNavigate())return;app.state.activeStudentId=null;app.preview=false;setView('home');}
function stat(n,label){return e('div',{class:'stat'},[e('span',{class:'value'},n),e('span',{class:'label'},label)]);}
function hero(kicker,title,desc,action=null){return e('section',{class:'hero'},[e('div',{class:'hero-copy'},[e('p',{class:'eyebrow'},kicker),e('h1',{},title),e('p',{},desc),e('span',{class:'rule'})]),action?e('div',{class:'hero-aside'},action):null]);}
function empty(title,desc,action=null,symbol='↗'){return e('div',{class:'empty'},[e('span',{class:'empty-symbol','aria-hidden':'true'},symbol),e('h2',{},title),e('p',{},desc),action]);}
function importButton(label='Importar JSON',cls='primary'){return button('↥  '+label,openImport,cls,{disabled:!enabled()});}
function render(){
 if(['speaking','waiting'].includes(audio.status.state))audio.stop('Prática parada ao mudar de tela.');
 const s=current(),studentView=!teacher||app.preview;
 root.replaceChildren();
 if(app.namespace==='demo')root.append(e('div',{class:'demo-banner'},'Demonstração · conteúdo fictício, separado dos seus alunos.'));
 const controls=e('div',{class:'course-tools'});
 if(app.preview)controls.append(button('← Professor',()=>{audio.stop();app.preview=false;setView('student');},'small'));
 else if(teacher)controls.append(button('Alunos',leaveStudent,'small'));
 if(s)controls.append(button('⌂ Hubs',()=>setView(teacher&&!app.preview?'student':'home'),'small'));
 if(!app.preview)controls.append(importButton('Importar JSON','small'));
 if(!teacher&&s)controls.append(button('My Practice',()=>setView('practice'),'small'));
 controls.append(button('🔊 Voz americana',openAudioSettings,'small'),button('Ajuda',openGuide,'small'));
 if(app.namespace==='demo')controls.append(button('Sair da demonstração',()=>switchNamespace('real'),'small'));
 const header=e('header',{class:'course-header'},[e('div',{class:'course-brand'},'HOUSE OF FLUENCY · ENGLISH COACHING'),e('h1',{},'Pronunciation Practice'),e('div',{class:'course-meta'},[badge(app.preview?'PRÉVIA DO ALUNO':teacher?'PROFESSOR':'ALUNO','student'),e('span',{},s?s.profile.displayName:teacher?'Seu espaço de ensino':'Seu espaço de prática')]),controls]);
 const main=e('main',{class:'main',id:'main',tabindex:'-1'});
 main.append(e('div',{class:'recording-banner',hidden:'','data-recording-banner':'',role:'status'}));
 if(!app.ready)main.append(e('div',{class:'notice error',role:'alert'},[e('strong',{},'Armazenamento indisponível. '),'Você pode usar um modo temporário e baixar o conteúdo antes de sair. Nada será salvo neste navegador.',button('Usar modo temporário',async()=>{store.temporary=true;app.ready=true;const v=await store.load('real');app.state=v.data;app.version=v.version;render();},'small')]));
 else if(store.temporary)main.append(e('div',{class:'notice'},'Modo temporário: os dados existem só nesta sessão. Exporte seu conteúdo antes de fechar.'));
 if(app.preview)main.append(e('div',{class:'notice info'},'Prévia do conteúdo deste aluno. As tentativas reais dele não são sincronizadas com o professor.'));
 if(app.view==='hub'||app.view==='practice'){
  const h=allHubs(s).find(x=>x.id===app.hubId);
  main.append(e('nav',{class:'path','aria-label':'Caminho do conteúdo'},[button('← Voltar',()=>{if(!canNavigate())return;if(app.view==='hub'&&app.lessonId!=='all'){audio.stop();app.lessonId='all';app.sectionId='all';render();}else setView(teacher&&!app.preview?'student':'home');},'back-button'),button('⌂ Hubs',()=>setView(teacher&&!app.preview?'student':'home'),'home-button'),e('span',{},app.view==='practice'?'My Practice':h?.title||'Hub')]));
 }
 if(app.view==='hub')renderHub(main,s,studentView);
 else if(app.view==='practice')renderPractice(main);
 else if(teacher&&!app.preview){if(s)renderTeacherStudent(main,s);else renderTeacherHome(main);}
 else renderStudentHome(main,s);
 main.append(e('footer',{class:'footer'},[e('span',{},'House of Fluency English Coaching'),e('span',{},'R7 · conteúdo e prática local · JSON 1.1.0')]));
 root.append(header,main);
 updatePlayback(audio.status);updateRecorderUI(recorder.state);
}
function navButton(label,num,active,fn,count=null){return e('button',{type:'button',class:'navbtn'+(active?' active':''),onClick:fn,...(active?{'aria-current':'page'}:{})},[e('span',{class:'navnum','aria-hidden':'true'},num),e('span',{},label),count===null?null:e('span',{class:'count-pill'},count)]);}
function renderTeacherHome(main){
 const students=app.state.students;
 main.append(hero('House of Fluency · Professor','Alunos & conteúdos','Organize os conteúdos de cada aluno e entregue novas práticas por JSON. O mesmo sistema acompanha todas as jornadas.',button('+ Cadastrar aluno',()=>openStudentForm(),'primary',{disabled:!enabled()})));
 main.append(e('div',{class:'stats'},[stat(students.length,'alunos cadastrados'),stat(students.reduce((n,s)=>n+s.hubs.filter(h=>h.utterances.length).length,0),'hubs com conteúdo'),stat(students.reduce((n,s)=>n+C.count(s),0),'frases no acervo')]));
 const header=e('div',{class:'section-head'},[e('h2',{},'Sua House'),button('Baixar backup do professor',()=>{download(C.makeBackup(app.state,app.namespace==='demo'),'HoF-backup-professor.json');toast('Backup administrativo baixado. Não envie este arquivo aos alunos.');},'small',{disabled:!students.length})]);main.append(header);
 if(!students.length){main.append(empty('Cadastre seu primeiro aluno','Cadastre um aluno para gerar seu identificador. Depois, baixe o modelo dele e preencha o conteúdo em JSON.',e('div',{class:'actions center'},[button('Cadastrar primeiro aluno',()=>openStudentForm(),'primary',{disabled:!enabled()}),button('Explorar demonstração',loadDemo,'',{disabled:!enabled()})])));}
 else{
  const input=e('input',{type:'search',class:'input search',placeholder:'Buscar aluno pelo nome…','aria-label':'Buscar aluno',value:app.filter,onInput:ev=>{app.filter=ev.target.value;refreshCards();}});
  main.append(e('div',{class:'toolbar'},[input,button('Restaurar backup',()=>openImport('backup'),'small')]));
  const cards=e('div',{class:'cards'});main.append(cards);
  function refreshCards(){cards.replaceChildren();const filtered=students.filter(s=>s.profile.displayName.toLocaleLowerCase().includes(app.filter.toLocaleLowerCase()));for(const s of filtered)cards.append(e('article',{class:'card student-card'},[e('div',{class:'student-top'},[e('span',{class:'avatar','aria-hidden':'true'},initials(s.profile.displayName)),e('div',{},[e('h3',{},s.profile.displayName),e('p',{},'Conteúdo individual · JSON')])]),e('div',{class:'card-meta'},[e('span',{class:'chip'},s.hubs.filter(h=>h.utterances.length).length+' hubs com conteúdo'),e('span',{class:'chip'},C.count(s)+' frases')]),e('div',{class:'id'},s.profile.id),button('Abrir aluno  ↗',()=>selectedStudent(s),'small')]));if(!filtered.length)cards.append(e('p',{class:'muted'},'Nenhum aluno encontrado.'));}
  refreshCards();
 }
 main.append(e('div',{class:'panel aside-card'},[e('h3',{},'Conteúdo individual por aluno'),e('p',{},'O aluno recebe o HTML universal uma vez. Nas próximas entregas, você envia apenas o JSON individual com os novos conteúdos.'),e('div',{class:'actions'},[button('Como funciona',openGuide,'small'),students.length?button('Abrir demonstração',loadDemo,'small',{disabled:!enabled()}):button('Restaurar backup',()=>openImport('backup'),'small')])]));
}
function openStudentForm(record=null){
 const name=e('input',{id:'student-name',class:'input',maxlength:'100',required:'',placeholder:'Como você chama este aluno?',value:record?.profile.displayName||'',autocomplete:'off'});
 const msg=e('p',{class:'help',role:'alert'});
 const form=e('form',{},[e('div',{class:'field'},[e('label',{for:'student-name'},'Nome de exibição'),name]),record?e('p',{class:'id'},'ID permanente: '+record.profile.id):e('p',{class:'help'},'O sistema vai gerar um identificador permanente. Alunos com nomes iguais continuam sendo cadastros distintos.'),msg,e('div',{class:'actions'},[e('button',{type:'submit',class:'btn primary'},record?'Salvar nome':'Cadastrar aluno'),button('Cancelar',closeDialog,'ghost')])]);
 form.addEventListener('submit',async ev=>{ev.preventDefault();if(!enabled())return;const displayName=name.value.trim();if(!displayName){msg.textContent='Informe o nome.';return;}const next=C.clone(app.state);let sid;
 if(record){sid=record.profile.id;next.students.find(s=>s.profile.id===sid).profile.displayName=displayName;}
 else{sid='student-'+C.id();next.students.push(C.student({id:sid,displayName}));}
 next.activeStudentId=sid;
 if(await save(next,record?'Nome atualizado.':'Aluno cadastrado.')){closeDialog();app.view='student';render();}
 });
 modal(record?'Editar nome':'Bem-vindo à House.',record?'O identificador e os conteúdos serão preservados.':'Cada cadastro tem seu próprio conteúdo.',form);setTimeout(()=>name.focus(),0);
}
function exportContent(s,onlyHub=null){try{const p=C.exportPackage(s,onlyHub?[onlyHub]:null,app.namespace==='demo');download(p,'HoF-'+filename(s.profile.displayName)+(onlyHub?'-'+filename(onlyHub):'-conteudo')+'.json');toast('JSON individual baixado. Confira o nome antes de enviar.');}catch(err){fail(err);}}
function renderTeacherStudent(main,s){

 main.append(hero('Acervo individual',s.profile.displayName,'Importe as frases deste aluno, confira o material e exporte somente o conteúdo dele.',button('Prévia do aluno  ↗',()=>{app.preview=true;setView('home');},'',{disabled:!enabled()})));
 main.append(e('p',{class:'id'},'Identificador permanente: '+s.profile.id));
 main.append(e('div',{class:'toolbar'},[importButton('Importar conteúdo'),button(C.count(s)?'Exportar todos os hubs':'Baixar modelo deste aluno',()=>exportContent(s)),button('Editar nome',()=>openStudentForm(s),'ghost small')]));
 main.append(e('div',{class:'stats'},[stat(s.hubs.filter(h=>h.utterances.length).length,'hubs com conteúdo'),stat(C.count(s),'frases disponíveis'),stat(s.importedPackages.length,'pacotes recebidos')]));
 main.append(e('div',{class:'section-head'},[e('h2',{},'Hubs deste aluno'),e('span',{class:'muted'},'Novos hubs podem chegar pelo JSON')]));renderHubs(main,s);
 const notes=e('textarea',{id:'teacher-notes',class:'notes',maxlength:'50000',placeholder:'Registre horários a confirmar, respostas ambíguas ou observações privadas…',value:s.teacherOnly.notes});
 const panel=e('section',{class:'panel'},[e('h3',{},'Notas e pendências do professor'),e('p',{},'Estas notas ficam fora do JSON do aluno. Para preservá-las em outra máquina, baixe o backup do professor.'),e('label',{class:'sr-only',for:'teacher-notes'},'Notas privadas do professor'),notes,button('Salvar notas',async()=>{const next=C.clone(app.state);next.students.find(x=>x.profile.id===s.profile.id).teacherOnly.notes=notes.value;await save(next,'Notas salvas.');},'small')]);main.append(panel);
 main.append(e('p',{class:'help'},'O acervo do professor não recebe automaticamente o progresso do aluno. As gravações e o progresso ficam no aparelho do aluno. Esta prévia não recebe tentativas automaticamente.'));
}
function renderStudentHome(main,s){
 main.append(hero('Sua House de pronúncia',s?'Seus hubs de prática':'Sua prática começa aqui',s?'Escolha um hub. Depois, ouça suas frases, pratique os grupos de fala e junte tudo no seu ritmo.':'Importe seu JSON para transformar suas próprias frases em um espaço de prática. Seu conteúdo fica neste navegador.'));
 if(!s){if(!teacher)main.append(button('Restaurar backup com áudios',openStudentRestore,'small'));main.append(empty('Seu espaço está pronto para receber você.','Use o arquivo JSON enviado pelo professor. O primeiro arquivo identifica seu perfil; os próximos acrescentam ou atualizam seus hubs.',e('div',{class:'actions center'},[importButton('Importar meu conteúdo'),button('Ver demonstração',loadDemo,'',{disabled:!enabled()})])));main.append(e('div',{class:'section-head',style:'margin-top:30px'},[e('h2',{},'Seus próximos espaços'),e('span',{class:'muted'},'Preenchidos pelo JSON')]));renderHubs(main,null);return;}
 main.append(e('div',{class:'stats'},[stat(s.hubs.filter(h=>h.utterances.length).length,'hubs com conteúdo'),stat(C.count(s),'frases para explorar'),stat(s.hubs.reduce((n,h)=>n+h.presentations.length,0),'apresentações')]));
 main.append(e('div',{class:'section-head'},[e('h2',{},'Hubs disponíveis'),button('Cópia do meu conteúdo',()=>exportContent(s),'small')]));renderHubs(main,s);
 main.append(e('div',{class:'panel aside-card'},[e('h3',{},'Do texto à sua voz.'),e('div',{class:'step'},[e('span',{class:'step-no'},'01'),e('p',{},[e('strong',{},'Explore a frase'),'Abra um cartão para ver grupos, ligações e pronúncia.'])]),e('div',{class:'step'},[e('span',{class:'step-no'},'02'),e('p',{},[e('strong',{},'Ouça e pratique'),'Ouça a frase, selecione um grupo e repita com intervalos.'])]),e('div',{class:'step'},[e('span',{class:'step-no'},'03'),e('p',{},[e('strong',{},'Encontre sua voz'),'Grave, compare por escuta e acompanhe sua prática no My Practice.'])])]));
 if(!teacher)main.append(e('section',{class:'panel'},[e('h3',{},'Seu conteúdo e sua voz'),e('p',{},'Faça um backup com os áudios para recuperar suas tentativas em outro aparelho.'),e('div',{class:'actions'},[button('Baixar backup com áudios',exportStudentBackup),button('Restaurar backup',openStudentRestore)])]),resetSection());
}
function hubTile(icon,title,description,stats,action){return e('button',{type:'button',class:'hub-card',onClick:action},[e('span',{class:'hub-icon','aria-hidden':'true'},icon),e('span',{class:'hub-title'},title),e('span',{class:'hub-description'},description),e('span',{class:'hub-body'},stats)]);}
function formatDate(date){if(!date)return 'Data não informada';const [y,m,d]=date.split('-');return d+'/'+m+'/'+y;}
function renderHubs(main,s){
 const grid=e('div',{class:'hub-grid'});
 const icons={present:'☀',past:'↶',future:'↗',classroom:'▤'};
 for(const h of allHubs(s)){
  const desc=h.id==='classroom'?'Frases criadas em aula, organizadas por encontro.':h.id==='present'?'Hábitos e rotinas · Present Simple':h.id==='past'?'Experiências · Past Simple':h.id==='future'?'Planos · Future Simple':'Conteúdo personalizado de prática.';
  const responses=h.utterances.filter(u=>u.type==='response').length;
  const parts=h.sections.filter(sec=>h.utterances.some(u=>u.sectionId===sec.id)).map(sec=>sec.title);
  const body=[e('span',{class:'status '+(h.utterances.length?'available':'pending')},h.utterances.length?'✓ Conteúdo disponível':'○ Aguardando JSON'),e('span',{class:'hub-kv'},[e('span',{},[e('b',{},responses),responses===1?' frase':' frases']),e('span',{},[e('b',{},h.presentations.length),h.presentations.length===1?' apresentação':' apresentações'])]),e('small',{},parts.length?parts.join(' · '):'Você preenche este hub com o JSON do aluno.')];
  if(h.lessons?.length)body.push(e('small',{},h.lessons.length+(h.lessons.length===1?' aula registrada':' aulas registradas')));
  grid.append(hubTile(icons[h.id]||'◈',h.title,desc,body,()=>setView('hub',h.id)));
 }
 if(s&&(!teacher||app.preview))grid.append(hubTile('◉','My Practice','Revisão, tentativas e gravações neste aparelho.',[e('span',{class:'status available'},teacher?'Prévia sem progresso do aluno':P.stats(s).practiced+(P.stats(s).practiced===1?' frase praticada nesta versão':' frases praticadas nesta versão'))],()=>setView('practice')));
 main.append(grid);
}
function renderHub(main,s,studentView){
 const hub=allHubs(s).find(h=>h.id===app.hubId);if(!hub){app.view='home';render();return;}
 const lesson=(hub.lessons||[]).find(l=>l.id===app.lessonId);
 main.append(hero('Pronunciation Practice · '+hub.title,lesson?lesson.title:hub.title,lesson?formatDate(lesson.date):hub.utterances.length?'Explore suas frases e apresentações. Toque em um grupo para ouvir.':'Este hub será preenchido com o JSON individual do aluno.'));
 if(teacher&&!app.preview&&s)main.append(e('div',{class:'toolbar'},[importButton('Importar conteúdo'),button('Exportar este hub',()=>{const record=C.clone(s);if(!record.hubs.some(h=>h.id===hub.id))record.hubs.push(C.clone(hub));exportContent(record,hub.id);})]));
 const lessons=hub.lessons||[];
 if(lessons.length&&app.lessonId==='all'){
  const cards=e('div',{class:'hub-grid lesson-grid'});
  [...lessons].sort((a,b)=>(b.date||'').localeCompare(a.date||'')||a.title.localeCompare(b.title)).forEach(l=>cards.append(hubTile('▤',l.title,formatDate(l.date),[e('span',{class:'status '+(hub.utterances.some(u=>u.lessonId===l.id)?'available':'pending')},hub.utterances.filter(u=>u.lessonId===l.id).length+(hub.utterances.filter(u=>u.lessonId===l.id).length===1?' frase':' frases'))],()=>{if(!canNavigate())return;audio.stop();app.lessonId=l.id;app.sectionId='all';render();})));
  if(hub.utterances.some(u=>!u.lessonId))cards.append(hubTile('◷','Sem aula vinculada','Conteúdo anterior ou sem data informada.',[e('span',{class:'status pending'},'Data não informada')],()=>{if(!canNavigate())return;app.lessonId='$unassigned';app.sectionId='all';render();}));
  main.append(cards,button('Ver todas as frases deste hub',()=>{if(!canNavigate())return;app.lessonId='*';app.sectionId='all';render();},'primary'));return;
 }
 const pool=hub.utterances.filter(u=>!lessons.length||app.lessonId==='*'||app.lessonId==='all'||app.lessonId==='$unassigned'&&!u.lessonId||u.lessonId===app.lessonId);
 if(!pool.length){main.append(empty('Este espaço ainda está vazio.','Importar este conteúdo não apaga os outros hubs.',app.preview?null:importButton('Importar JSON')));return;}
 const poolIds=new Set(pool.map(u=>u.id));const presentations=hub.presentations.filter(p=>p.utteranceIds.every(id=>poolIds.has(id)));
 main.append(audioNotice());
 const tabs=e('div',{class:'tabs','aria-label':'Filtrar conteúdo'});
 const opts=[['all','Todas as frases'],...hub.sections.filter(sec=>pool.some(u=>u.sectionId===sec.id&&u.type==='response')).sort((a,b)=>a.order-b.order).map(sec=>[sec.id,sec.title])];
 if(presentations.length)opts.push(['presentation','Apresentação']);
 for(const [id,title]of opts)tabs.append(button(title,()=>{if(!canNavigate())return;audio.stop();app.sectionId=id;render();},'tab'+(app.sectionId===id?' active':''),{'aria-pressed':String(app.sectionId===id)}));main.append(tabs);
 if(app.sectionId==='all'||app.sectionId==='presentation')for(const p of presentations){
  const para=e('div',{class:'paragraph'});p.utteranceIds.forEach(uid=>{const u=pool.find(x=>x.id===uid);if(u)para.append(e('button',{type:'button',class:'inline-phrase',onClick:()=>focusPhrase(uid)},u.text),document.createTextNode(' '));});
  main.append(e('section',{class:'panel presentation-panel'},[e('h2',{},p.title),e('p',{class:'help'},'Toque em uma frase do parágrafo para abrir sua prática.'),para]));
 }
 let utterances=pool.filter(u=>app.sectionId==='presentation'?u.type==='presentation':app.sectionId==='all'||u.sectionId===app.sectionId&&u.type==='response');
 if(app.sectionId==='all')utterances=[...utterances.filter(u=>u.type==='response'),...utterances.filter(u=>u.type==='presentation')];
 if(!utterances.length)main.append(e('p',{class:'muted'},'Nenhuma frase nesta seção.'));
 utterances.forEach((u,i)=>main.append(phraseCard(u,i+1,hub)));
}
function focusPhrase(uid){let node=[...document.querySelectorAll('[data-phrase]')].find(n=>n.dataset.phrase===uid);if(!node){app.sectionId='presentation';render();node=[...document.querySelectorAll('[data-phrase]')].find(n=>n.dataset.phrase===uid);}if(node){node.open=true;node.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});node.querySelector('summary').focus({preventScroll:true});}}
function groupLine(groups,field,cls='',key='',onGroup=null){
 const line=e('div',{class:'layer-text '+cls});
 groups.forEach((g,i)=>{if(i)line.append(e('span',{class:'divider','aria-label':'pausa possível'},'|'));
 const props={class:'group','data-audio-key':key,'data-group':String(i)};
 if(onGroup){const node=e('button',{...props,type:'button',onClick:()=>onGroup(i),'aria-label':'Ouvir grupo '+(i+1)+': '+g.text},g[field]);line.append(node);}else line.append(e('span',props,g[field]));});return line;
}
function phraseCard(u,index,hub){
 const key=(current()?.profile.id||'preview')+'::'+hub.id+'::'+u.id;
 const details=e('details',{class:'phrase','data-phrase':u.id});details.append(e('summary',{},[e('span',{class:'phrase-num'},String(index).padStart(2,'0')),e('span',{class:'phrase-title'},u.text)]));
 const body=e('div',{class:'phrase-body'}),groupSelect=e('select',{'aria-label':'Grupo para praticar'},u.groups.map((g,i)=>e('option',{value:String(i)},'Grupo '+(i+1))));
 const mode=e('select',{'aria-label':'Modo de prática'},[['listen','Ouvir frase'],['group','Repetir um grupo'],['repeat','Todos os grupos'],['build','Juntar do início'],['backchain','Juntar pelo final'],['shadow','Shadowing · falar junto']].map(([value,label])=>e('option',{value},label)));
 const reference=e('select',{'aria-label':'Referência de áudio'},[e('option',{value:'auto'},u.audio.mode==='file'?'Arquivo da frase + voz nos grupos':'Voz americana'),...(u.audio.mode==='file'?[e('option',{value:'tts'},'Usar voz americana em tudo')]:[])]);
 const settings={rate:audioSettings.rate,gap:audioSettings.gap,repetitions:audioSettings.repetitions};
 const speed=e('select',{'aria-label':'Velocidade'},[[.7,'0,70× · mais lento'],[.85,'0,85×'],[.9,'0,90×'],[1,'1× · normal']].map(([v,l])=>e('option',{value:String(v)},l)));speed.value=String(settings.rate);
 const gap=e('select',{'aria-label':'Intervalo para repetir'},[1,2,3,5,8,10].map(n=>e('option',{value:String(n)},n+' s')));gap.value=String(settings.gap);
 const reps=e('select',{'aria-label':'Repetições por trecho'},[1,2,3,4,5].map(n=>e('option',{value:String(n)},n+'×')));reps.value=String(settings.repetitions);
 const play=(override={})=>{if(recorder.active){toast('Pare a gravação antes de ouvir a referência.',true);return;}return audio.play(u,{key,mode:mode.value,selected:Number(groupSelect.value),rate:Number(speed.value),gap:Number(gap.value),repetitions:Number(reps.value),reference:reference.value,...override}).catch(fail);};
 const status=e('p',{class:'playback-status','data-playback-status':key,role:'status','aria-live':'polite'},'Pronto para ouvir.');
 if(u.sourceQuestion)body.append(e('details',{class:'question'},[e('summary',{},'Pergunta de origem'),e('p',{},u.sourceQuestion)]));
 const groupsLayer=e('div',{class:'layer'},[e('span',{class:'layer-label'},'Grupos de fala'),groupLine(u.groups,'text','',key,i=>{groupSelect.value=String(i);play({mode:'group',selected:i,repetitions:1});})]);
 const linksLayer=e('div',{class:'layer'},[e('span',{class:'layer-label'},'Ligações · ‿'),groupLine(u.groups,'connected','connected',key)]);
 const phonLayer=e('div',{class:'layer'},[e('span',{class:'layer-label'},'Pronúncia'),groupLine(u.groups,'pronunciation','phonetic',key)]);
 const supports=e('div',{class:'support-controls'});
 const titleToggle=button('✓ Frase',()=>{const title=details.querySelector('.phrase-title');const visible=titleToggle.getAttribute('aria-pressed')==='true';title.textContent=visible?'Frase oculta · use o áudio':u.text;titleToggle.textContent=visible?'Frase':'✓ Frase';titleToggle.setAttribute('aria-pressed',String(!visible));},'small',{'aria-pressed':'true'});supports.append(titleToggle);
 for(const [label,target]of [['Grupos',groupsLayer],['Ligações',linksLayer],['Pronúncia',phonLayer]]){
 const toggle=button('✓ '+label,()=>{target.hidden=!target.hidden;toggle.textContent=(target.hidden?'':'✓ ')+label;toggle.setAttribute('aria-pressed',String(!target.hidden));},'small',{'aria-pressed':'true'});supports.append(toggle);
 }
 body.append(e('div',{class:'support-intro'},[e('span',{},'Apoios de leitura'),supports]),groupsLayer,linksLayer,phonLayer);
 const lesson=(hub.lessons||[]).find(l=>l.id===u.lessonId);if(lesson)body.append(e('p',{class:'lesson-tag'},'▤ '+lesson.title+' · '+formatDate(lesson.date)));
 if(u.tips.length){const tips=e('details',{class:'tips'},[e('summary',{},'Dicas de pronúncia')]);for(const tip of u.tips)tips.append(e('p',{},[e('strong',{},tip.label+': '),tip.body]));body.append(tips);}
 const panel=e('section',{class:'practice-panel','aria-label':'Prática de pronúncia'},[e('h3',{},'🔊 Praticar esta frase'),e('div',{class:'practice-fields'},[labelled('Modo',mode),labelled('Grupo',groupSelect),labelled('Velocidade',speed),labelled('Intervalo',gap),labelled('Repetições',reps)]),u.audio.mode==='file'?labelled('Referência',reference):null,e('div',{class:'actions'},[button('▶ Iniciar prática',()=>play(),'primary'),button('■ Parar',()=>audio.stop(),'stop-audio',{'data-stop-key':key,disabled:true}),button('⚙ Voz americana',openAudioSettings,'small')]),status]);
 body.append(panel,recordPanel(u,hub,key),e('div',{class:'phrase-footer'},[e('span',{},'| pausa possível · ‿ ligação · toque no grupo para ouvir'),e('span',{class:'chip'},'Autoavaliação · sem nota automática')]));
 if(u.audio.reviewStatus==='unreviewed')body.append(e('p',{class:'help',style:'margin:14px 0 0'},'Pronúncia aproximada: use o áudio como apoio e confirme dúvidas com seu professor. A voz pode realizar algumas ligações de outra forma.'));
 if(current()?.history.some(h=>h.hubId===hub.id&&h.utteranceId===u.id))body.append(e('p',{class:'help'},'Conteúdo atualizado. A versão anterior foi preservada no histórico local.'));
 details.append(body);details.addEventListener('toggle',()=>{if(!details.open&&audio.status.key===key)audio.stop();});return details;
}
function labelled(label,node){return e('label',{class:'practice-field'},[e('span',{},label),node]);}
function audioNotice(){const box=e('div',{class:'notice audio-notice','data-audio-notice':''});fillAudioNotice(box);return box;}
function fillAudioNotice(box){const voices=audio.voices();box.replaceChildren(e('strong',{},voices.length?'🔊 Referência: inglês americano. ':'🔇 Voz americana ainda não disponível. '),document.createTextNode(voices.length?'Escolha uma voz e toque nos grupos para ouvir.':'O conteúdo continua disponível. Confira as vozes instaladas neste navegador.'),button('Escolher voz',openAudioSettings,'small'));}
function updatePlayback(state){
 for(const n of document.querySelectorAll('[data-audio-key]')){const active=n.dataset.audioKey===state.key&&state.indices?.includes(Number(n.dataset.group));n.classList.toggle('is-speaking',active&&state.state==='speaking');n.classList.toggle('is-your-turn',active&&state.state==='waiting');}
 for(const n of document.querySelectorAll('[data-playback-status]'))if(n.dataset.playbackStatus===state.key){n.textContent=state.message;n.classList.toggle('playback-error',state.state==='error');}
 for(const n of document.querySelectorAll('[data-stop-key]')){n.disabled=!(n.dataset.stopKey===state.key&&['speaking','waiting'].includes(state.state));}
 if(state.state==='idle')for(const n of document.querySelectorAll('[data-playback-status]'))n.textContent=state.message;
}
function openAudioSettings(){
 if(recorder.active){toast('Pare a gravação antes de ouvir a referência.',true);return;}
 const select=e('select',{'aria-label':'Voz americana disponível'}),desc=e('p',{class:'help'});
 const populate=()=>{const voices=audio.voices();select.replaceChildren(...voices.map(v=>e('option',{value:v.voiceURI},v.name+' · '+v.lang+(v.localService?' · local':' · pode usar internet'))));select.disabled=!voices.length;if(voices.some(v=>v.voiceURI===audio.voiceURI))select.value=audio.voiceURI;desc.textContent=voices.length?'Somente vozes en-US são listadas. A qualidade e as ligações variam conforme a voz do aparelho.':'Nenhuma voz en-US foi encontrada. Instale uma voz de inglês dos Estados Unidos nas opções do aparelho ou tente outro navegador. Não trocamos para outro idioma automaticamente.';};populate();
 select.addEventListener('change',()=>{try{audio.setVoice(select.value);toast('Voz americana selecionada.');}catch(err){fail(err);}});
 const content=e('div',{},[labelled('Voz de referência',select),desc,button('Atualizar lista de vozes',()=>{audio.voiceChange();populate();},'small'),e('p',{class:'help',style:'margin-top:15px'},'A fala é gerada a partir do inglês limpo. Não lemos os símbolos da pronúncia. Grupos isolados podem ter uma entonação diferente da frase inteira.'),e('div',{class:'actions'},[button('Ouvir teste',()=>{const u={id:'voice-test',text:'Welcome to your pronunciation practice.',groups:[{text:'Welcome to your pronunciation practice.'}],audio:{mode:'tts',url:null}};audio.play(u,{key:'voice-test',rate:.9}).catch(fail);},'primary'),button('Parar',()=>audio.stop()),button('Fechar',closeDialog,'ghost')]),e('p',{class:'playback-status','data-playback-status':'voice-test',role:'status'},'Toque em Ouvir teste para conferir a voz.')]);
 modal('Voz americana','Escolha a referência que o aluno vai ouvir.',content);
 // Voice availability may arrive asynchronously after the dialog opens.
 const off=audio.subscribeVoices(()=>{if(dialog.open&&select.isConnected)populate();});dialog.addEventListener('close',off,{once:true});
}
function renderPractice(main){
 const s=current();main.append(hero('My Practice','Sua prática, no seu ritmo.','Reveja suas frases, acompanhe tentativas e ouça suas gravações. A autoavaliação é sua percepção, não uma nota automática.'));
 if(!s){main.append(empty('Importe seu conteúdo para começar.','Você também pode restaurar um backup com áudios.',button('Restaurar backup',openStudentRestore,'primary')));return;}
 if(teacher){main.append(empty('O progresso fica no aparelho do aluno.','A prévia do professor permite consultar o material, mas não cria tentativas nem recebe gravações automaticamente.'));return;}
 const stats=P.stats(s);main.append(e('div',{class:'stats'},[stat(stats.practiced+'/'+stats.total,'frases com tentativa nesta versão'),stat(stats.attempts,'tentativas registradas'),stat(stats.review,'frases na revisão')]));
 main.append(e('div',{class:'toolbar'},[button('Baixar backup com áudios',exportStudentBackup,'primary'),button('Restaurar backup',openStudentRestore)]));
 const filter=app.practiceFilter||'all';const tabs=e('div',{class:'tabs'});
 const choices=[['all','Todas'],['review','Minha revisão'],['needs_practice','Preciso praticar'],['with_support','Com apoio'],['independent','Sem apoio'],['unpracticed','Ainda sem tentativa'],['trash','Lixeira ('+stats.deleted+')']];
 for(const [value,label]of choices)tabs.append(button(label,()=>{if(!canNavigate())return;audio.stop();app.practiceFilter=value;render();},'tab'+(filter===value?' active':''),{'aria-pressed':String(filter===value)}));main.append(tabs);
 if(filter==='trash'){
  const attempts=P.data(s).attempts.filter(a=>a.deletedAt).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));
  if(!attempts.length)main.append(empty('Sua lixeira está vazia.','Tentativas movidas para cá poderão ser restauradas.'));
  for(const a of attempts)main.append(e('article',{class:'panel'},[e('h3',{},a.snapshot.text),e('p',{class:'help'},formatWhen(a.createdAt)+' · versão '+a.contentRevision),e('div',{class:'actions'},[button('Restaurar tentativa',async()=>{await savePracticeStudent(P.trash(current(),a.id,true),'Tentativa restaurada.');}),a.recordingId?button('Baixar áudio',()=>downloadAttempt(a)):null,button('Excluir definitivamente…',()=>openPurge(a),'danger small')])]));return;
 }
 let shown=0;
 for(const h of allHubs(s))for(const u of h.utterances){const q=P.summary(s,h.id,u);const show=filter==='all'||filter==='review'&&q.review||filter==='unpracticed'&&!q.current.length||filter==='needs_practice'&&(q.latest?.rating==='needs_practice'||q.outdated)||['with_support','independent'].includes(filter)&&q.latest?.rating===filter;
 if(show){main.append(e('p',{class:'practice-hub-label'},h.title),phraseCard(u,++shown,h));}}
 if(!shown)main.append(empty('Nenhuma frase neste filtro.','Você pode marcar frases para revisar ou registrar uma tentativa.'));
}
function openGuide(){if(!canNavigate())return;
 if(!teacher){modal('Sua prática, passo a passo.','O conteúdo é seu; os registros ficam neste aparelho.',[
 e('ol',{class:'preview-list'},[e('li',{},'Importe o JSON enviado pelo professor e abra um hub.'),e('li',{},'Ouça a frase ou pratique os grupos com pausas para repetir.'),e('li',{},'Toque em Gravar minha voz, autorize o microfone e depois pare a gravação.'),e('li',{},'Ouça, compare com a referência e salve a tentativa.'),e('li',{},'Escolha sua autoavaliação e marque frases para revisar no My Practice.'),e('li',{},'Baixe um backup com áudios para recuperar tudo em outro aparelho.')]),
 e('p',{class:'help'},'A comparação é por escuta. Não há uma porcentagem automática de acerto. O microfone exige um navegador e uma página que permitam a captura.'),
 e('div',{class:'actions'},[button('Conferir este navegador',openCompatibility),button('Ver demonstração',()=>{closeDialog();loadDemo();}),button('Fechar',closeDialog,'primary')])]);return;}
 modal('Seu fluxo, simplificado.','Conteúdo separado do sistema.',[
 e('ol',{class:'preview-list'},[e('li',{},'Cadastre um aluno. O identificador gerado será permanente.'),e('li',{},'Baixe o modelo desse aluno e preserve seu ID ao preparar o JSON.'),e('li',{},'Importe o JSON na ficha do aluno, confira a prévia e confirme.'),e('li',{},'Use a prévia do aluno e exporte o JSON individual.'),e('li',{},'Envie hof-student.html uma vez e o JSON. Para atualizar, envie só um novo JSON.'),e('li',{},'Guarde também um backup do professor: os dados são locais.')]),e('p',{class:'help'},'Para adicionar conteúdo sem criar conflitos, mantenha os IDs de hubs e frases e aumente a revisão de cada item alterado. Ausência de um item não o apaga.'),e('div',{class:'actions'},[button('Conferir este navegador',openCompatibility),button('Entendi',closeDialog,'primary')])]);}

function openCompatibility(){
 if(!canNavigate())return;
 const row=(label,value)=>e('div',{class:'compat-row'},[e('strong',{},label),e('span',{},value)]);
 const voices=row('Voz americana',audio.voices().length?audio.voices().length+' voz(es) en-US disponível(is).':'Nenhuma voz en-US disponível neste momento.');
 const voiceValue=voices.lastElementChild;
 modal('Seu navegador','Esta conferência não solicita microfone e não testa a qualidade do som.',[
 e('div',{class:'compat-list'},[
 row('Gravação',recorder.support()||'Recursos disponíveis. A permissão será solicitada ao tocar em Gravar.'),
 voices,
 row('Dados locais',!app.ready?'Armazenamento indisponível.':store.temporary?'Modo temporário: os dados serão perdidos ao fechar.':'Banco local aberto. Mantenha um backup fora do navegador.'),
 row('Backup','Depois de baixar o ZIP, confira o arquivo em Downloads. Para validar a recuperação, restaure em outro navegador com o mesmo HTML.')]),
 e('p',{class:'help'},'Abra o HTML em um navegador completo. O visualizador de anexos do WhatsApp pode limitar áudio e gravação. Disponibilidade de recursos não garante permissão, espaço livre ou funcionamento em todos os aparelhos.'),
 e('div',{class:'actions'},[button('Configurar voz americana',openAudioSettings),button('Fechar',closeDialog,'primary')])]);
 const off=audio.subscribeVoices(v=>{voiceValue.textContent=v.length?v.length+' voz(es) en-US disponível(is).':'Nenhuma voz en-US disponível neste momento.';});
 dialog.addEventListener('close',off,{once:true});
}

function resetSection(){const d=e('details',{class:'danger-zone'},[e('summary',{},'Trocar perfil neste navegador')]);d.append(e('p',{},'A troca remove o conteúdo, as tentativas e os áudios deste perfil local. Baixe um backup completo antes.'),button('Baixar backup com áudios',exportStudentBackup,'small'),button('Trocar perfil…',()=>{
 if(!canNavigate())return;const input=e('input',{class:'input',placeholder:'Digite TROCAR','aria-label':'Digite TROCAR para confirmar'}),err=e('p',{class:'help',role:'alert'});
 modal('Trocar perfil local?','O conteúdo e os áudios deste perfil serão removidos deste navegador.',[e('p',{class:'help'},'Esta ação não pode ser desfeita sem um backup. Primeiro baixe seu backup; depois digite TROCAR.'),input,err,e('div',{class:'actions'},[button('Baixar backup completo',exportStudentBackup),button('Confirmar troca',async()=>{if(input.value!=='TROCAR'){err.textContent='Digite TROCAR para confirmar.';return;}const sid=current()?.profile.id;const deletes=P.data(current()).attempts.filter(a=>a.recordingId).map(a=>({studentId:sid,id:a.recordingId}));if(await save(C.emptyState(),'Perfil local removido.',{deletes})){closeDialog();setView('home');}},'danger'),button('Cancelar',closeDialog,'ghost')])]);},'small ghost'));return d;}
function openImport(initial='content'){
 if(!canNavigate())return;audio.stop();
 const file=e('input',{type:'file',id:'json-file',accept:'.json,application/json,text/plain',class:'input','aria-label':'Selecionar arquivo JSON'});
 const paste=e('textarea',{id:'json-paste',class:'json-input',placeholder:'Cole aqui o JSON completo…',spellcheck:'false'});
 const error=e('div',{role:'alert'}),name=e('p',{class:'filename'});let text='';
 const inspect=async()=>{if(!enabled())return;try{error.replaceChildren();const value=paste.value.trim()||text;if(!value)throw new Error('Escolha um arquivo ou cole seu JSON.');await previewImport(value);}catch(err){error.replaceChildren(e('div',{class:'notice error'},err.message));}};
 const pane=e('div',{},[e('div',{class:'file-area'},[e('label',{for:'json-file'},'Selecionar arquivo JSON'),e('p',{},initial==='backup'?'Selecione um backup administrativo do professor.':'Conteúdo do aluno: até 5 MiB. A prévia não altera seus dados.'),file,name]),e('details',{style:'margin:20px 0'},[e('summary',{style:'cursor:pointer;min-height:44px;padding-top:10px'},'Ou colar o código JSON'),e('label',{class:'sr-only',for:'json-paste'},'Código JSON'),paste]),error,e('div',{class:'actions'},[button('Conferir importação',inspect,'primary'),button('Cancelar',closeDialog,'ghost')]),e('p',{class:'help',style:'margin:18px 0 0'},teacher&&app.state.activeStudentId?'Aluno selecionado: '+current()?.profile.displayName+'. Para cadastrar outro aluno a partir de um arquivo, volte primeiro à lista de alunos.':'Nenhum arquivo será enviado a um servidor. A importação acontece neste navegador.')]);
 file.addEventListener('change',async()=>{const f=file.files[0];if(!f)return;try{if(f.size>20*1024*1024)throw new Error('Arquivo maior que 20 MiB. Conteúdos têm limite de 5 MiB.');text=await f.text();paste.value='';name.textContent=f.name+' · '+Math.ceil(f.size/1024)+' KB';error.replaceChildren();}catch(err){text='';file.value='';error.replaceChildren(e('div',{class:'notice error'},err.message));}});
 modal(initial==='backup'?'Restaurar backup':'Traga suas frases para a House.',teacher?'Importe um conteúdo individual ou um backup administrativo.':'Use o JSON enviado pelo professor. Arquivos de outro aluno serão bloqueados.',pane);
}
async function previewImport(text){
 if(new TextEncoder().encode(text).length>20*1024*1024)throw new Error('Arquivo maior que 20 MiB.');
 let raw;try{raw=JSON.parse(text);}catch{throw new Error('JSON inválido. Confira vírgulas e aspas.');}
 if(raw?.format===C.BACKUP&&!teacher)throw new Error('Este é um backup do professor e não pode ser importado na versão do aluno.');
 if(!raw||![C.CONTENT,C.BACKUP].includes(raw.format))throw new Error('Formato não reconhecido. Selecione um JSON de conteúdo HoF.');
 const ns=raw.isDemo===true?'demo':'real';const loaded=await store.load(ns);
 if(app.namespace===ns)loaded.data.activeStudentId=app.state.activeStudentId;
 if(raw.format===C.BACKUP){const plan=C.planBackup(loaded.data,raw,{namespace:ns});showBackupPreview(plan,loaded.version,ns);return;}
 const p=C.parsePackage(text),plan=C.planImport(loaded.data,p,{role,namespace:ns});showContentPreview(plan,loaded.version,ns);
}
function previewStat(value,label){return e('div',{class:'preview-stat'},[e('strong',{},value),e('span',{},label)]);}
function showContentPreview(plan,expected,ns){
 const {stats}=plan,p=plan.package;
 const content=e('div',{},[badge(ns==='demo'?'DEMONSTRAÇÃO':'CONTEÚDO INDIVIDUAL',ns==='demo'?'demo':'student'),e('div',{class:'panel',style:'margin-top:15px'},[e('h3',{},p.student.displayName),e('div',{class:'id'},p.student.id),e('p',{class:'help',style:'margin:10px 0 0'},p.hubs.map(h=>h.title).join(' · '))])]);
 if(stats.alreadyImported)content.append(e('div',{class:'notice info'},'Este pacote já foi importado. Nada será duplicado.'));
 else{
 content.append(e('div',{class:'preview-grid'},[previewStat(stats.newPhrases,'frases novas'),previewStat(stats.updatedPhrases,'frases atualizadas'),previewStat(stats.newHubs,'hubs novos'),previewStat(stats.duplicatePhrases,'frases repetidas'),previewStat(stats.oldItems,'itens antigos ignorados'),previewStat(stats.metadataUpdated,'hubs atualizados'),previewStat(stats.newLessons||0,'aulas novas')]));
 if(stats.newStudent)content.append(e('div',{class:'notice info'},teacher?'Este arquivo vai cadastrar o aluno identificado acima.':'Seu perfil será vinculado ao aluno identificado acima. Confirme se o nome está correto.'));
 if(stats.nameChanged)content.append(e('div',{class:'notice'},'O nome de exibição será atualizado. O identificador do aluno permanece igual.'));
 if(stats.practiceChanged)content.append(e('div',{class:'notice'},stats.practiceChanged+' frase(s) tiveram conteúdo de prática alterado. A versão anterior será preservada no histórico.'));
 const samples=p.hubs.flatMap(h=>h.utterances.map(u=>({hub:h.title,text:u.text}))).slice(0,4);
 if(samples.length){content.append(e('p',{class:'help'},'Amostra do arquivo recebido:'),e('ul',{class:'mini-list'},samples.map(x=>e('li',{},[e('strong',{},x.hub),x.text]))));}
 content.append(e('p',{class:'help'},'Hubs e frases que não aparecem neste arquivo serão preservados. A confirmação aplica todas as alterações juntas.'));
 }
 const confirm=button(stats.alreadyImported?'Abrir conteúdo':teacher&&stats.newStudent?'Cadastrar e importar':'Confirmar importação',async()=>{
  if(!enabled())return;app.busy=true;confirm.disabled=true;
  try{
   const saved=stats.alreadyImported?await store.load(ns):await store.save(ns,plan.next,expected);
   app.namespace=ns;app.state=saved.data;app.version=saved.version;app.state.activeStudentId=p.student.id;
   app.view=teacher?'student':'home';app.hubId=null;app.lessonId='all';app.preview=false;closeDialog();toast(stats.alreadyImported?'Conteúdo já importado. Nenhuma duplicação.':'Importação concluída.'+(store.temporary?' Apenas nesta sessão.':''));
  }catch(err){fail(err);confirm.disabled=false;}finally{app.busy=false;render();}
 },'primary');
 content.append(e('div',{class:'actions'},[confirm,button('Voltar',()=>openImport(),'ghost'),button('Cancelar',closeDialog,'ghost')]));
 modal('Confira antes de importar.','A prévia ainda não alterou o conteúdo.',content);
}
function showBackupPreview(plan,expected,ns){
 const stats=plan.stats;
 const confirm=button('Restaurar e mesclar backup',async()=>{if(!enabled())return;app.busy=true;confirm.disabled=true;try{const saved=await store.save(ns,plan.next,expected);app.namespace=ns;app.state=saved.data;app.state.activeStudentId=null;app.version=saved.version;app.view='home';app.preview=false;closeDialog();toast('Backup restaurado. Os cadastros existentes foram preservados.');}catch(err){fail(err);confirm.disabled=false;}finally{app.busy=false;render();}},'primary');
 modal('Restaurar acervo do professor','A restauração mescla os registros por identificador e revisão.',[badge(ns==='demo'?'BACKUP DE DEMONSTRAÇÃO':'BACKUP ADMINISTRATIVO',ns==='demo'?'demo':''),e('div',{class:'preview-grid'},[previewStat(stats.students,'alunos no backup'),previewStat(stats.newPhrases,'frases novas'),previewStat(stats.updatedPhrases,'frases atualizadas')]),e('p',{class:'help'},stats.oldItems+' itens antigos serão ignorados. '+stats.notesMerged+' conjuntos de notas serão acrescentados sem apagar as notas atuais.'),e('div',{class:'notice'},'Nenhum aluno ausente do arquivo será apagado. Conflitos de mesma revisão precisam ser resolvidos antes de restaurar.'),e('div',{class:'actions'},[confirm,button('Cancelar',closeDialog,'ghost')])]);
}
async function loadDemo(){
 if(!canNavigate())return;audio.stop();if(!enabled())return;
 try{const loaded=await store.load('demo');let saved=loaded;const sid=window.HOF_DEMO.student.id;
 if(teacher||!loaded.data.boundStudentId||loaded.data.boundStudentId===sid){
  const target=C.clone(loaded.data);target.activeStudentId=null;
  const plan=C.planImport(target,window.HOF_DEMO,{role,namespace:'demo'});
  if(!plan.stats.alreadyImported)saved=await store.save('demo',plan.next,loaded.version);
 }
 app.state=saved.data;app.version=saved.version;app.namespace='demo';
 app.state.activeStudentId=app.state.students.find(x=>x.profile.id===sid)?.profile.id||app.state.students[0]?.profile.id||null;
 app.view=teacher?'student':'home';app.hubId=null;app.lessonId='all';app.preview=false;render();
 }catch(err){fail(err);}
}
function canNavigate(){if(recorder.active){toast('Pare a gravação antes de mudar de tela.',true);return false;}if(recorder.draft){openDraftModal();toast('Salve, baixe ou descarte a gravação antes de mudar de tela.');return false;}return true;}
function clearModalMedia(){if(audio.status.key?.startsWith('attempt:')||audio.status.key?.startsWith('draft:'))audio.stop();for(const url of modalUrls)URL.revokeObjectURL(url);modalUrls=[];}
function formatWhen(date){return new Date(date).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}
function durationLabel(ms){const n=Math.max(0,Math.floor(ms/1000));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
async function savePracticeStudent(student,message,media={}){if(teacher){toast('A prévia do professor não registra tentativas do aluno.',true);return false;}const next=C.clone(app.state),index=next.students.findIndex(s=>s.profile.id===student.profile.id);if(index<0){fail(new Error('Perfil não encontrado.'));return false;}next.students[index]=student;return save(next,message,media);}
function recordPanel(u,hub,key){
 if(teacher)return e('div',{class:'notice preview-practice'},'Gravação e autoavaliação ficam na versão do aluno. Esta prévia não cria registros de desempenho.');
 const s=current(),q=P.summary(s,hub.id,u);
 const label=q.outdated?'↻ Conteúdo atualizado · pratique esta versão':q.latest?(q.latest.rating?P.LABELS[q.latest.rating]:'Tentativa registrada · sem autoavaliação'):'○ Ainda sem tentativa nesta versão';
 const panel=e('section',{class:'record-panel','aria-label':'Minha voz e minhas tentativas'},[e('h3',{},'🎙 Minha voz'),e('span',{class:'practice-state '+(q.outdated?'updated':'')},label),e('p',{class:'help'},'Grave depois de ouvir, por até dois minutos. O microfone só é solicitado ao tocar em Gravar; sua voz fica neste aparelho.'),e('div',{class:'actions'},[button('● Gravar minha voz',()=>startCapture(u,hub,key),'record-start',{'data-record-start':key}),button('■ Parar gravação',()=>recorder.stop(),'small',{'data-record-stop':key,disabled:true}),button('Histórico ('+q.all.length+')',()=>openAttemptHistory(u,hub),'small')]),e('p',{class:'record-status','data-record-status':key,role:'status'},'Pronto para gravar.'),e('div',{class:'rating-panel'},[e('p',{},'Como você se saiu nesta frase?'),e('div',{class:'actions'},P.RATINGS.map(r=>button(P.LABELS[r],async()=>{if(!canNavigate()||!enabled())return;const result=P.addAttempt(current(),{hubId:hub.id,utterance:u,rating:r});if(await savePracticeStudent(result.student,'Autoavaliação registrada.')){if(app.view==='hub')focusPhrase(u.id);}},'small '+(q.latest?.rating===r?'selected-rating':''),{'aria-pressed':String(q.latest?.rating===r)})))]),button(q.review?'★ Na minha revisão':'☆ Revisar depois',async()=>{if(!canNavigate()||!enabled())return;if(await savePracticeStudent(P.markReview(current(),hub.id,u.id,!q.review),q.review?'Frase retirada da revisão.':'Frase adicionada à revisão.'))if(app.view==='hub')focusPhrase(u.id);},'small',{'aria-pressed':String(q.review)})]);
 if(recorder.support())panel.append(e('p',{class:'help microphone-help'},recorder.support()));
 return panel;
}
async function startCapture(u,hub,key){
 if(teacher||!enabled())return;if(recorder.draft){openDraftModal();return;}if(recorder.active){toast('Uma gravação já está em andamento.',true);return;}
 audio.stop();captureContext={namespace:app.namespace,studentId:current().profile.id,hubId:hub.id,utterance:C.clone(u),key};
 try{await recorder.start();}catch(err){fail(err);}
}
let lastRecordPhase='idle';
function updateRecorderUI(state){
 const changed=lastRecordPhase!==state.phase;lastRecordPhase=state.phase;
 if(state.phase==='recording'&&changed){clearInterval(captureTimer);captureTimer=setInterval(()=>{for(const n of document.querySelectorAll('[data-recording-timer]'))n.textContent=durationLabel(Date.now()-recorder.startedAt);},1000);}
 if(state.phase!=='recording'){clearInterval(captureTimer);captureTimer=null;}
 for(const n of document.querySelectorAll('[data-record-start]'))n.disabled=teacher||!enabled()||recorder.active||!!recorder.draft;
 for(const n of document.querySelectorAll('[data-record-stop]')){n.disabled=!(captureContext?.key===n.dataset.recordStop&&['requesting','recording'].includes(state.phase));n.textContent=state.phase==='requesting'?'Cancelar solicitação':'■ Parar gravação';}
 for(const n of document.querySelectorAll('[data-record-status]'))n.textContent=captureContext?.key===n.dataset.recordStatus?state.message:'Pronto para gravar.';
 const banner=document.querySelector('[data-recording-banner]');
 if(banner){banner.hidden=!recorder.active&&!recorder.draft&&state.phase!=='error';banner.replaceChildren();
 if(recorder.active)banner.append(e('strong',{},state.phase==='recording'?'● Gravando sua voz':'Microfone'),e('span',{'data-recording-timer':'','aria-hidden':'true'},durationLabel(state.durationMs)),e('span',{},state.message),button(state.phase==='requesting'?'Cancelar solicitação':'Parar gravação',()=>recorder.stop(),'small',{disabled:state.phase==='stopping'}));
 else if(recorder.draft)banner.append(e('strong',{},'Gravação ainda não salva'),e('span',{},durationLabel(recorder.draft.durationMs)),button('Abrir gravação',openDraftModal,'small'));
 else if(state.phase==='error')banner.append(e('span',{},state.message),button('Fechar aviso',()=>{captureContext=null;recorder.clearDraft();},'small'));
 }
 if(state.phase==='draft'&&changed){if(draftUrl)URL.revokeObjectURL(draftUrl);draftUrl=URL.createObjectURL(recorder.draft.blob);openDraftModal();}
}
function openDraftModal(){
 if(!recorder.draft||!captureContext)return;
 const draft=recorder.draft,ctx=captureContext,key='draft:'+ctx.key;if(!draftUrl)draftUrl=URL.createObjectURL(draft.blob);
 const rating=e('select',{'aria-label':'Autoavaliação desta gravação'},[e('option',{value:''},'Salvar sem autoavaliação'),...P.RATINGS.map(r=>e('option',{value:r},P.LABELS[r]))]);
 const msg=e('p',{class:'help',role:'alert'}),confirm=button('Salvar tentativa',async()=>{
 if(!enabled())return;audio.stop();confirm.disabled=true;
 try{
  if(app.namespace!==ctx.namespace||current()?.profile.id!==ctx.studentId)throw new Error('O perfil mudou. Baixe esta gravação antes de continuar.');
  const recording={id:'recording-'+C.id(),mime:draft.mime,durationMs:draft.durationMs};
  const result=P.addAttempt(current(),{hubId:ctx.hubId,utterance:ctx.utterance,rating:rating.value||null,recording,createdAt:draft.createdAt});
  const ok=await savePracticeStudent(result.student,'Tentativa e áudio salvos neste aparelho.',{puts:[{id:recording.id,studentId:ctx.studentId,mime:draft.mime,createdAt:draft.createdAt,blob:draft.blob}]});
  if(ok){recorder.clearDraft();captureContext=null;if(draftUrl)URL.revokeObjectURL(draftUrl);draftUrl=null;closeDialog();render();if(app.view==='hub')focusPhrase(ctx.utterance.id);}
  else{msg.textContent='Não foi salvo. Sua gravação continua disponível para baixar ou tentar salvar novamente.';confirm.disabled=false;}
 }catch(err){msg.textContent=err.message;confirm.disabled=false;}
 },'primary');
 modal('Sua gravação está pronta.','Ouça, compare e escolha se deseja salvar.',[e('p',{class:'draft-phrase'},ctx.utterance.text),e('p',{class:'help'},durationLabel(draft.durationMs)+' · '+Math.ceil(draft.blob.size/1024)+' KB · ainda não salva'),draft.warning?e('div',{class:'notice'},draft.warning):null,e('div',{class:'actions'},[button('▶ Ouvir minha voz',()=>audio.playRecording(draftUrl,{key})),button('⇄ Referência → minha voz',()=>audio.compare(ctx.utterance,draftUrl,{key})),button('■ Parar',()=>audio.stop())]),e('p',{class:'playback-status','data-playback-status':key,role:'status'},'Compare por escuta. O sistema não calcula acerto de pronúncia.'),labelled('Minha autoavaliação',rating),msg,e('div',{class:'actions'},[confirm,button('Baixar áudio',()=>download(draft.blob,'HoF-gravacao-nao-salva.'+B.ext(draft.mime),draft.mime)),button('Descartar…',confirmDiscardDraft,'ghost')])]);
}
function confirmDiscardDraft(){
 if(!recorder.draft)return;const d=recorder.draft;
 modal('Descartar a gravação não salva?','Esta tentativa ainda não está no histórico.',[e('p',{class:'help'},'Você pode baixar o áudio antes de descartar.'),e('div',{class:'actions'},[button('Baixar áudio',()=>download(d.blob,'HoF-gravacao-nao-salva.'+B.ext(d.mime),d.mime)),button('Descartar esta gravação',()=>{audio.stop();recorder.clearDraft();captureContext=null;if(draftUrl)URL.revokeObjectURL(draftUrl);draftUrl=null;closeDialog();render();},'danger'),button('Voltar',openDraftModal,'ghost')])]);
}
async function downloadAttempt(a){
 try{const row=await store.getRecording(app.namespace,current().profile.id,a.recordingId);if(!row)throw new Error('O arquivo desta gravação não foi encontrado. Restaure seu backup para recuperá-lo.');download(row.blob,'HoF-'+filename(current().profile.displayName)+'-'+filename(a.utteranceId)+'-'+a.id+'.'+B.ext(a.mime),a.mime);}catch(err){fail(err);}
}
function openAttemptHistory(u,hub){
 if(!canNavigate())return;audio.stop();const s=current(),attempts=P.history(s,hub.id,u),namespace=app.namespace,studentId=s.profile.id;
 const list=e('div',{class:'attempt-list'});let shown=0;const more=button('Mostrar mais tentativas',append,'small');
 function append(){const next=attempts.slice(shown,shown+20);shown+=next.length;for(const a of next){
  const old=a.signature!==C.practiceSignature(u),key='attempt:'+a.id;
  const card=e('article',{class:'attempt-card'},[e('div',{class:'attempt-head'},[e('strong',{},formatWhen(a.createdAt)),e('span',{class:'chip'},'Versão '+a.contentRevision+(old?' · anterior':' · atual'))]),e('p',{},a.rating?P.LABELS[a.rating]:'Sem autoavaliação'),e('p',{class:'help'},a.kind==='recording'?durationLabel(a.durationMs)+' · gravação de voz':'Autoavaliação sem gravação')]);
  if(old)card.append(e('details',{},[e('summary',{},'Frase desta tentativa'),e('p',{},a.snapshot.text)]));
  let url=null;
  async function play(compare){try{if(!url){const row=await store.getRecording(namespace,studentId,a.recordingId);if(!row)throw new Error('Áudio não encontrado. Você pode restaurar um backup.');if(!card.isConnected)return;url=URL.createObjectURL(row.blob);modalUrls.push(url);}if(compare)await audio.compare(a.snapshot,url,{key});else await audio.playRecording(url,{key});}catch(err){fail(err);}}
  const actions=e('div',{class:'actions'});
  if(a.recordingId)actions.append(button('Ouvir minha voz',()=>play(false),'small'),button('Comparar com esta versão',()=>play(true),'small'),button('Baixar áudio',()=>downloadAttempt(a),'small'),button('Parar',()=>audio.stop(),'small'));
  actions.append(button('Mover para lixeira',async()=>{audio.stop();if(await savePracticeStudent(P.trash(current(),a.id),'Tentativa movida para a lixeira. Você pode restaurá-la no My Practice.'))openAttemptHistory(u,hub);},'small ghost'));card.append(actions,e('p',{class:'playback-status','data-playback-status':key,role:'status'},'Registro local de prática.'));list.append(card);
 }more.hidden=shown>=attempts.length;}
 append();modal('Minhas tentativas',u.text,[attempts.length?e('p',{class:'help'},attempts.length+' registro(s). As comparações usam a frase da versão em que você praticou.'):e('p',{class:'help'},'Ainda não há tentativas salvas para esta frase.'),list,more,button('Fechar',closeDialog,'ghost')]);
}
function openPurge(a){
 if(!canNavigate())return;const input=e('input',{class:'input',placeholder:'Digite APAGAR','aria-label':'Digite APAGAR para excluir definitivamente'}),err=e('p',{class:'help',role:'alert'});
 modal('Excluir definitivamente?','A tentativa e seu áudio local serão removidos.',[e('p',{},a.snapshot.text),e('p',{class:'help'},'Esta ação não pode ser desfeita sem um backup. Baixe seu backup antes e digite APAGAR para confirmar.'),input,err,e('div',{class:'actions'},[button('Baixar backup completo',exportStudentBackup),button('Excluir definitivamente',async()=>{if(input.value!=='APAGAR'){err.textContent='Digite APAGAR para confirmar.';return;}const result=P.purge(current(),a.id),deletes=result.recordingId?[{studentId:current().profile.id,id:result.recordingId}]:[];if(await savePracticeStudent(result.student,'Tentativa excluída definitivamente.',{deletes})){closeDialog();render();}},'danger'),button('Cancelar',closeDialog,'ghost')])]);
}
async function exportStudentBackup(){
 if(teacher){toast('O backup de prática é feito na versão do aluno.',true);return;}if(!canNavigate()||!enabled())return;const s=current();if(!s)return;audio.stop();app.busy=true;
 try{toast('Preparando o backup com os áudios…');const ids=P.data(s).attempts.filter(a=>a.recordingId).map(a=>a.recordingId);const rows=await store.getRecordings(app.namespace,s.profile.id,ids);const backup=await B.create(s,rows,app.namespace==='demo');const url=URL.createObjectURL(new Blob([backup.bytes],{type:'application/zip'})),name='HoF-'+filename(s.profile.displayName)+'-backup-com-audios.zip';modal('Backup pronto para baixar','Confirme o download pelo link abaixo.',[e('p',{class:'help'},backup.manifest.practice.attempts.length+' tentativa(s) · '+backup.manifest.recordings.length+' áudio(s) · '+(backup.bytes.length/1024/1024).toFixed(2)+' MiB. O arquivo inclui o conteúdo e a lixeira.'),e('div',{class:'actions'},[e('a',{class:'btn primary',href:url,download:name},'Baixar ZIP do backup'),button('Fechar',closeDialog,'ghost')]),e('p',{class:'help'},'Guarde o ZIP completo. Não descompacte nem recomprima para restaurar no sistema.')]);modalUrls.push(url);}
 catch(err){fail(err);}finally{app.busy=false;updateRecorderUI(recorder.state);}
}
function openStudentRestore(){
 if(!app.ready){toast('O armazenamento está indisponível. Escolha o modo temporário antes de restaurar.',true);return;}
 if(teacher){toast('Use a versão do aluno para restaurar um backup de prática.',true);return;}if(!canNavigate())return;audio.stop();
 const file=e('input',{type:'file',accept:'.zip,application/zip','aria-label':'Selecionar backup ZIP com áudios',class:'input'}),error=e('p',{class:'help',role:'alert'}),info=e('p',{class:'help'});let selected=null;
 file.addEventListener('change',()=>{selected=file.files[0]||null;info.textContent=selected?selected.name+' · '+(selected.size/1024/1024).toFixed(1)+' MiB':'';});
 const pane=e('div',{},[e('p',{class:'help'},'Selecione o ZIP gerado por Baixar backup com áudios. Não descompacte nem recomprima. O conteúdo do aluno atual será preservado em caso de erro.'),file,info,error]);
 const inspect=button('Conferir backup',async()=>{
 if(!enabled())return;if(!selected){error.textContent='Escolha um arquivo ZIP.';return;}if(selected.size>B.MAX_ARCHIVE){error.textContent='Arquivo maior que 110 MiB.';return;}inspect.disabled=true;error.textContent='Conferindo conteúdo e áudios…';
 try{
  const decoded=await B.decode(selected),ns=decoded.manifest.isDemo?'demo':'real',loaded=await store.load(ns),plan=B.planRestore(loaded.data,decoded,ns),puts=[];
  for(const row of plan.rows){const existing=await store.getRecording(ns,plan.studentId,row.id);if(existing){if(existing.mime!==row.mime||!B.equalBytes(new Uint8Array(await existing.blob.arrayBuffer()),new Uint8Array(await row.blob.arrayBuffer())))throw new Error('Uma gravação com este ID possui outro conteúdo. Nenhum dado foi alterado.');}else puts.push(row);}
  if(!pane.isConnected)return;
  const apply=button('Restaurar conteúdo e áudios',async()=>{
   if(!enabled())return;app.busy=true;apply.disabled=true;
   try{const saved=await store.saveWithRecordings(ns,plan.next,loaded.version,puts);app.namespace=ns;app.state=saved.data;app.version=saved.version;app.view='practice';app.practiceFilter='all';app.preview=false;closeDialog();toast('Backup restaurado. Conteúdo, tentativas e áudios disponíveis neste aparelho.');}
   catch(err){fail(err);apply.disabled=false;}finally{app.busy=false;render();}
  },'primary');
  modal('Confira seu backup.',plan.stats.student,[badge(ns==='demo'?'DEMONSTRAÇÃO':'BACKUP DO ALUNO',ns==='demo'?'demo':''),e('div',{class:'preview-grid'},[previewStat(plan.stats.newPhrases,'frases novas'),previewStat(plan.stats.newAttempts,'tentativas novas'),previewStat(puts.length,'áudios novos')]),e('p',{class:'help'},plan.stats.recordings+' áudios conferidos. Registros existentes serão preservados. O backup inclui a lixeira, quando houver.'),e('div',{class:'actions'},[apply,button('Cancelar',closeDialog,'ghost')])]);
 }catch(err){if(pane.isConnected){error.textContent=err.message;inspect.disabled=false;}}
 },'primary');pane.append(e('div',{class:'actions'},[inspect,button('Cancelar',closeDialog,'ghost')]));modal('Restaurar backup com áudios','Conteúdo e prática do mesmo aluno, em um único ZIP.',pane);
}

async function init(){try{await store.open();const saved=await store.load('real');if(saved.data?.stateVersion!==1)throw new Error('Dados locais incompatíveis.');app.state=saved.data;app.version=saved.version;app.ready=true;}catch(err){console.warn('HoF: armazenamento local indisponível.',err.message);}render();}
dialog.addEventListener('close',()=>{clearModalMedia();if(audio.status.key==='voice-test')audio.stop();});
dialog.addEventListener('click',ev=>{if(ev.target===dialog){const r=dialog.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)closeDialog();}});
window.addEventListener('pageshow',event=>{if(event.persisted)toast('Se você alterou dados em outra aba, recarregue antes de importar.');});
audio.subscribe(updatePlayback);
audio.subscribeVoices(()=>{for(const box of document.querySelectorAll('[data-audio-notice]'))fillAudioNotice(box);});
window.addEventListener('pagehide',()=>{audio.stop();recorder.stop();recorder.release();});
window.addEventListener('beforeunload',event=>{if(recorder.active||recorder.draft){event.preventDefault();event.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&recorder.active)recorder.stop();});
recorder.subscribe(updateRecorderUI);
init();
})();
