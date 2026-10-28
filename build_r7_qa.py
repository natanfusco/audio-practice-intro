from pathlib import Path
root=Path(__file__).resolve().parent
html=(root/'dist/hof-student.html').read_text()
for kind in ['restore','responsive-student']:
    (root/('dist/qa-'+kind+'.html')).write_text(html.replace('store=new HOFStore(role);',"store=new HOFStore(role+'-r7-"+kind+"');"))
(root/'dist/qa-responsive.html').write_text('''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>R7 · largura</title><style>body{background:#220404;color:white;font:16px system-ui}iframe{display:block;width:360px;height:850px;border:2px solid #d4af37;margin:10px auto}</style><h1>Teste de layout; não é um aparelho físico</h1><label for="width">Largura</label><select id="width"><option>320</option><option selected>360</option><option>768</option><option>1280</option></select><iframe title="Aluno em teste" src="qa-responsive-student.html"></iframe><script>document.getElementById('width').onchange=e=>document.querySelector('iframe').style.width=e.target.value+'px';</script></html>''')
print('Development QA pages generated; exclude qa-* from delivery.')
