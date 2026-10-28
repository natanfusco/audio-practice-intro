from pathlib import Path
import json
root=Path(__file__).resolve().parent
src=root/'src';dist=root/'dist'
dist.mkdir(exist_ok=True)
style=(src/'style.css').read_text()
core=(src/'core.js').read_text();store=(src/'store.js').read_text();app=(src/'app.js').read_text();audio=(src/'audio.js').read_text();recorder=(src/'recorder.js').read_text();practice=(src/'practice.js').read_text();backup=(src/'backup.js').read_text();ziplib=(root/'vendor/jszip.min.js').read_text()
demo_source = root/'data/demo-conteudo.json'
if not demo_source.exists():
    demo_source = dist/'demo-conteudo.json'
demo=json.loads(demo_source.read_text())
# Enrich only the demonstration with a separate presentation sentence, keeping it explicitly fictitious.
h=demo['hubs'][0]
u=json.loads(json.dumps(h['utterances'][0]));u['id']='presentation-present-001';u['type']='presentation';u['sourceQuestion']=None
h['utterances']=[item for item in h['utterances'] if item['id']!=u['id']]+[u];h['presentations']=[{'id':'presentation-present','title':'Minha apresentação','utteranceIds':[u['id']]}]
demo_json=json.dumps(demo,ensure_ascii=False).replace('</','<\\/')
for role in ['teacher','student']:
 title='Professor' if role=='teacher' else 'Aluno'
 html='''<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="description" content="House of Fluency — hub universal de prática de pronúncia. Conteúdo individual por JSON."><title>HoF · '''+title+''' · Pronunciation Practice</title><style>'''+style+'''</style></head><body><a class="skip" href="#main">Ir para o conteúdo</a><div id="app"><p class="loading">Preparando sua House…</p></div><dialog id="dialog" aria-label="Operação de conteúdo"></dialog><noscript>Ative o JavaScript para usar o hub.</noscript><script>window.HOF_ROLE='''+json.dumps(role)+''';window.HOF_DEMO='''+demo_json+''';</script><script>'''+ziplib+'\n'+core+'\n'+store+'\n'+audio+'\n'+recorder+'\n'+practice+'\n'+backup+'\n'+app+'''</script></body></html>'''
 (dist/('hof-'+role+'.html')).write_text(html)
(dist/'demo-conteudo.json').write_text(json.dumps(demo,ensure_ascii=False,indent=2)+'\n')
schema_source = root/'hof-content.schema.json'
(dist/'hof-content.schema.json').write_text(schema_source.read_text())
index="""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>House of Fluency · R7</title><style>"""+style+"""</style></head><body><header class="course-header"><div class="course-brand">HOUSE OF FLUENCY · ENGLISH COACHING</div><h1>Pronunciation Practice</h1><p class="course-meta">R7 · Hubs, gravação e revisão final</p></header><main class="main"><div class="hero"><div class="hero-copy"><p class="eyebrow">Sua House de pronúncia</p><h1>Escolha seu espaço</h1><p>Conteúdo individual por JSON. O mesmo sistema para todos os alunos.</p></div></div><div class="cards"><article class="card"><h2>Professor</h2><p>Cadastre alunos, importe conteúdos e exporte o material individual.</p><a class="btn primary" href="hof-teacher.html">Abrir professor ↗</a></article><article class="card"><h2>Aluno</h2><p>Importe seu JSON, pratique suas frases e grave sua voz.</p><a class="btn primary" href="hof-student.html">Abrir aluno ↗</a></article><article class="card"><h2>Demonstração</h2><p>Um arquivo de exemplo com Present e uma aula fictícia datada.</p><a class="btn" href="demo-conteudo.json" download>Baixar JSON de demonstração</a></article></div><div class="notice">Os cadastros reais começam vazios. A demonstração fica em uma área separada. As vozes disponíveis dependem do navegador e do aparelho.</div></main></body></html>"""
(dist/'index.html').write_text(index)
print('Built: teacher, student, index, demo JSON, schema')
