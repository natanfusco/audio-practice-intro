from pathlib import Path
import json
root=Path(__file__).resolve().parent
sources=[root/'vendor/jszip.min.js']+[root/'src'/name for name in ['core.js','store.js','audio.js','recorder.js','practice.js','backup.js']]
package=json.dumps(json.loads((root/'data/demo-conteudo.json').read_text()),ensure_ascii=False).replace('</','<\\/')
script='\n'.join(p.read_text() for p in sources)+'\nwindow.QA_PACKAGE='+package+';\n'+(root/'tests/browser-qa.js').read_text()
html='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QA R6 · áudio sintético</title><style>body{font:16px system-ui;background:#fffdf8;color:#2a1a12;max-width:900px;margin:30px auto;padding:20px}button{padding:14px;margin:6px;border-radius:10px;border:2px solid #d4af37;background:#781313;color:white;font:inherit}li{line-height:1.8;margin:10px 0}#status{padding:20px;background:#fff4e3;border:2px solid #d4af37;border-radius:12px}</style></head><body><h1>Verificação técnica R6</h1><p>Esta página de desenvolvimento gera um tom sintético. Não solicita o microfone e não altera os cadastros do aplicativo.</p><button id="run">Executar teste sem microfone</button><button id="reopen">Reabrir gravação salva</button><p id="status" role="status">Pronto.</p><ol id="results"></ol><script>'''+script+'''</script></body></html>'''
(root/'dist/qa-r6.html').write_text(html)
