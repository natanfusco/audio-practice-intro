from pathlib import Path
import time
root=Path(__file__).resolve().parent
html=(root/'dist/hof-student.html').read_text()
html=html.replace("store=new HOFStore(role);", "store=new HOFStore(role+'-qa-ui-"+str(int(time.time()))+"');")
synthetic="""new HOFRecorder.VoiceRecorder({secureContext:true,getUserMedia:async()=>{const ctx=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();const dest=ctx.createMediaStreamDestination(),osc=ctx.createOscillator();osc.frequency.value=330;osc.connect(dest);osc.start();for(const track of dest.stream.getTracks()){const stop=track.stop.bind(track);track.stop=()=>{stop();try{osc.stop();}catch{}ctx.close();};}return dest.stream;}})"""
html=html.replace('new HOFRecorder.VoiceRecorder()',synthetic)
html=html.replace('<body>','<body><div style="background:#fff4e3;color:#781313;padding:10px;text-align:center;font:700 14px system-ui">TESTE DE INTERFACE · tom sintético, sem solicitar microfone · dados isolados</div>')
(root/'dist/qa-ui-r6.html').write_text(html)
