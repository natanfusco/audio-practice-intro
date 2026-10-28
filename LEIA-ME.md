# House of Fluency — Pronunciation Practice — R7

Comece por COMECE-AQUI.md: arquivos de uso e roteiro de aceitação em aparelho real. A R7 adiciona Ajuda → Conferir este navegador, títulos acessíveis nas janelas e foco ao abrir; preserva os dados e o contrato de conteúdo.

A versão mantém gravação por frase, comparação por escuta, autoavaliação, tentativas, revisão e backup com áudio. Mantém os hubs e o visual do material Month 3 Teacher v2.4.1.

## Arquivos e início

Extraia o ZIP e abra index.html. Os dois aplicativos independentes estão em dist/hof-teacher.html e dist/hof-student.html.
Cada HTML inclui o código necessário; não precisa instalar bibliotecas ou manter a pasta src para usar.
O sistema continua universal: o mesmo HTML do aluno recebe conteúdos individuais por JSON. As versões reais começam vazias. A demonstração fica separada.
Os JSONs de conteúdo das R4/R5 continuam aceitos (formatos 1.0.0 e 1.1.0). Não é necessário recriar os arquivos de conteúdo para usar a R7.
O conjunto inicial de Guilherme continua em data/Guilherme_Present_R5.json, sem mudanças nas frases. Contém sete respostas e cinco frases da apresentação; Past e Future continuam pendentes de confirmação.

## Atualizar da R5

1. Guarde uma cópia do conteúdo e o backup do professor antes de trocar de arquivo ou aparelho.
2. Baixe os HTMLs R7 e feche abas de versões antigas.
3. Passe a usar os HTMLs atualizados; nas próximas entregas de frases, continue enviando apenas o JSON.

Na mesma origem, a R6 migra o banco local do navegador da versão 1 para 2, preservando o conteúdo e acrescentando o armazenamento binário de áudios. Após a migração, use a R7: as versões antigas não abrem esse banco atualizado. Trocar pasta/origem, navegador ou aparelho pode exigir importar o conteúdo ou restaurar um backup.

## Fluxo do aluno

1. Abra um hub e uma frase.
2. Ouça a referência e pratique os grupos, como na R5.
3. Toque em Gravar minha voz e autorize o microfone quando o navegador solicitar.
4. Toque em Parar gravação.
5. Na janela da tentativa, ouça sua voz e use Referência → minha voz para comparar por escuta.
6. Escolha uma autoavaliação, se quiser, e clique em Salvar tentativa.
7. Marque Revisar depois para incluir a frase no My Practice.

A gravação não é salva automaticamente ao parar. Ela fica como rascunho até Salvar tentativa. Você pode baixar ou descartar o rascunho.
Enquanto há gravação em andamento ou rascunho não salvo, trocar de tela/perfil/importar outro conteúdo fica bloqueado para evitar perda ou associação ao aluno errado.
O microfone é liberado ao parar, cancelar ou sair da página. Se mudar para outra aba durante a captura, o sistema tenta finalizar a gravação.
Se faltar espaço ou houver conflito entre abas, a transação falha sem alterar os dados anteriores; o rascunho continua disponível para baixar ou tentar salvar novamente.

## Autoavaliação e progresso

Estados disponíveis:
- Preciso praticar.
- Consigo com apoio.
- Consigo sem apoio.

Você pode registrar uma autoavaliação sem áudio. Uma gravação também pode ser salva sem autoavaliação.
Cada escolha cria um registro com a frase e a versão praticada. Apenas ouvir a referência não cria uma tentativa automaticamente.
My Practice mostra frases com tentativa na versão atual, total de tentativas e fila de revisão. Os filtros separam revisão, autoavaliações, frases sem tentativa e lixeira.
Esses indicadores medem prática e percepção do aluno. Não são porcentagens automáticas de acerto, certificação ou análise fonética.

## Histórico e comparação

Histórico guarda data/hora, versão da frase, autoavaliação e gravação quando houver.
A comparação alterna referência e gravação. Ela usa o texto da versão praticada, mesmo quando a frase atual já mudou.
Se o conteúdo de prática mudar, a tentativa anterior permanece no histórico, mas não representa prática da nova versão. O cartão pede uma nova tentativa.
Alterar apenas uma dica ou título não invalida a prática anterior.
A voz sintética depende das vozes en-US disponíveis no aparelho. O backup não empacota a voz sintética do sistema nem baixa arquivos de referência externos; ele guarda os áudios gravados pelo aluno.
O áudio do aluno pode ser baixado individualmente. Formato e reprodução dependem do navegador; não há conversão automática entre WebM/Opus, MP4 e outros formatos.

## Lixeira

Mover uma tentativa para a lixeira é reversível e preserva o áudio. Ela deixa de contar no progresso ativo.
Restaurar devolve a tentativa ao histórico.
Excluir definitivamente exige digitar APAGAR e remove tentativa e áudio local juntos. Faça backup antes: não há recuperação sem backup depois disso.
Mover para a lixeira não libera espaço de armazenamento; a liberação ocorre na exclusão definitiva.
Nenhuma gravação é apagada automaticamente por idade ou quantidade de tentativas.

## Backup com áudio

Na versão do aluno, use Baixar backup com áudios. O sistema prepara o ZIP e mostra um link Baixar ZIP do backup. Clique no link e confirme que o arquivo chegou à sua pasta de downloads.
O ZIP contém:
- manifest.json: conteúdo do aluno, tentativas, versões praticadas, revisão e descritores dos áudios.
- audio/: arquivos gravados, incluindo os que ainda estão na lixeira.

Para recuperar em outro aparelho, abra o HTML R7, escolha Restaurar backup e selecione o ZIP completo. Confira a prévia e confirme Restaurar conteúdo e áudios.
Não descompacte ou recomprima o ZIP antes de restaurar no aplicativo. O importador aceita o formato ZIP sem recompressão gerado por esta versão.
Reimportar o mesmo backup não duplica tentativas. Registros locais existentes são preservados. IDs conflitantes com outro conteúdo bloqueiam a operação inteira.
Um backup de outro aluno é bloqueado se o navegador já estiver vinculado a um perfil diferente.
A validação confere integridade, correspondência entre áudios e tentativas, caminhos e limites antes de gravar. A restauração aplica os metadados e os arquivos em uma única transação.

A cópia do conteúdo em JSON não inclui gravações ou progresso. O backup administrativo do professor também não busca áudios no aparelho do aluno.
Nenhum áudio é enviado automaticamente ao professor ou a um servidor. Não há sincronização entre aparelhos nesta fase.

## Professor

Cadastro, importação e exportação de conteúdo continuam funcionando como antes.
A prévia do professor mostra o material, mas não registra tentativas do aluno nem exibe um progresso que não foi recebido.
O professor não tem acesso remoto aos áudios locais dos alunos. Para isso, será necessária uma integração futura.
Não confunda os formatos: JSON de conteúdo individual, JSON administrativo do professor e ZIP de prática do aluno têm funções diferentes.

## Microfone e navegador

O microfone só é solicitado depois de tocar em Gravar minha voz. A autorização é dada pelo usuário no navegador.
Use um navegador completo. Visualizadores de anexos do WhatsApp podem não permitir a captura.
A captura precisa de um contexto permitido pelo navegador, normalmente HTTPS ou um arquivo local autorizado. A prévia de desenvolvimento por HTTP pode mostrar um aviso e não oferecer microfone.
Negar permissão, não ter microfone ou usar um navegador sem MediaRecorder não bloqueia o texto, a referência ou a autoavaliação.
A gravação humana em aparelhos reais depende da conferência do professor descrita em COMECE-AQUI.md. Não foi usada uma voz humana ou um microfone pessoal nos testes desta rodada.

## Limites iniciais

- Até dois minutos por gravação, com finalização automática tentada no limite.
- Até 8 MiB por arquivo de áudio salvo.
- Até 500 gravações e 2.000 registros de tentativa por perfil.
- Backup: até 100 MiB de dados, com arquivo ZIP de entrada limitado a 110 MiB e manifesto de até 5 MiB.

Os limites não apagam dados antigos. Ao atingir um limite, o sistema informa e mantém o rascunho disponível para baixar, quando existir.
A capacidade real do navegador varia; IndexedDB local não substitui backup. Uma limpeza do navegador pode remover os dados.

## Validação e limites de teste

97 testes automatizados passaram: 32 de regressão de dados, 26 de áudio da R5 e 39 da R6.
O Chrome gravou e decodificou um tom sintético com MediaRecorder real, persistiu o Blob no IndexedDB e restaurou o ZIP em outro banco com os mesmos bytes. Também recuperou o áudio após recarregar.
A interface foi conferida para autoavaliação, revisão e histórico. Uma variante técnica com dados isolados também percorreu Gravar, Parar, ouvir o rascunho, salvar a tentativa e exibir o áudio no histórico, usando um tom sintético em vez de um microfone real. O link do ZIP foi preparado, mas o ambiente automatizado não confirmou um evento de download do ZIP; confira esse passo no seu navegador. O teste de geração, integridade e restauração do ZIP passou.
Microfone humano, qualidade da voz de referência, aparelhos físicos Android/iPhone, permissão em arquivos locais e situações reais de falta de espaço continuam pendentes da conferência no aparelho real descrita em COMECE-AQUI.md.

## Código-fonte

- src/core.js: conteúdo, importação, revisões e exportação.
- src/store.js: migração de IndexedDB e transação de conteúdo/prática/áudio.
- src/audio.js: voz, reprodução, sequências e comparação alternada.
- src/recorder.js: captura, finalização, permissões, limites e liberação do microfone.
- src/practice.js: tentativas, autoavaliação, revisão, lixeira e versões.
- src/backup.js: ZIP, manifesto, integridade e plano de restauração.
- src/app.js e src/style.css: interface.
- vendor/: JSZip 3.10.1 incluído localmente, com licença. Não usa CDN.
- build.py: gera os HTMLs independentes.
- build_qa.py, build_ui_qa.py e tests/browser-qa.js: verificação de desenvolvimento com tom sintético, sem solicitar microfone. A página técnica não é uma função de prática do aluno.

Para executar os testes: node tests/core.test.js; node tests/r5.test.js; node tests/r6.test.js.
Para reconstruir: python build.py. Os HTMLs da entrega já estão construídos.
