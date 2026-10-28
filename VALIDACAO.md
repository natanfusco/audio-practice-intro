# Validação R7 — 28/10/2026

## Conferido nesta rodada

- Reexecutados os 97 testes automatizados, todos passaram. Sintaxe de todos os módulos verificada.
- Importação pelo seletor de arquivos do JSON de Guilherme, prévia de 12 frases e confirmação. Verificadas sete respostas e cinco frases da apresentação.
- Layout de aluno em iframe com larguras de 320, 360, 768 e 1280 px. No espaço útil de 305/345/753/1265 px, o conteúdo expandido permaneceu dentro da largura. Conferidos hubs, frase longa e prévia de importação. Isso não emula sistema operacional, toque ou permissão de um celular físico.
- Janela de prévia a 320 px: largura interna 271 px, margem dentro da tela, sem transbordamento horizontal.
- Restauração pela interface: seletor ZIP → Conferir backup → prévia → Restaurar conteúdo e áudios. Backup de demonstração com três frases, uma tentativa e um WAV de um segundo gerado por código, sem voz humana.
- Histórico restaurado exibiu a tentativa e reproduziu o WAV até o estado Gravação concluída.
- Ajuda → Conferir este navegador mostrou ausência de voz en-US, necessidade de contexto seguro e armazenamento aberto, coerentes com este ambiente. Nenhum acesso ao microfone foi solicitado.
- As janelas têm nome acessível pelo título e recebem foco ao abrir, inclusive quando uma prévia substitui outra janela.
- Logs observados: mensagens da extensão do ambiente; nenhum erro da aplicação identificado no percurso verificado.
- Os HTMLs de teste usam bancos isolados e são excluídos do pacote de uso.

## Aceitação que permanece externa

Microfone humano, qualidade da voz de referência, Android/iPhone físicos, abertura local e permissões, download efetivo do backup pelo navegador do usuário, recuperação entre aparelhos e formatos, quota real. O mecanismo de geração e restauração já foi exercitado; nesta rodada a seleção de um ZIP e confirmação da recuperação também foram conferidas pela interface. O evento de download não havia sido observado na R6; não foi certificado como funcionando no aparelho do usuário. Veja COMECE-AQUI.md.

Sem porcentagem automática de acerto. Nenhum perfil, tentativa ou áudio de teste integra os HTMLs universais.

---

## Evidências preservadas da R6

# Validação R6

## Automática — 97 testes

32 testes do contrato de conteúdo, 26 de reprodução/prática da R5 e 39 novos testes R6 passaram.
Cobertura nova: solicitação de microfone somente no início, parar/liberar tracks, rascunho, permissão negada, microfone ausente, concessão tardia, timeout, gravação curta, limite de duração, desconexão, duplicação de stop, contexto inseguro, formato, autoavaliação, revisão, versionamento, lixeira, exclusão, separação do conteúdo, ZIP, duplicação de backup, corrupção, caminhos, conflito de aluno/tentativa, armazenamento temporário e ordem de comparação.
Os testes de captura unitários usam dispositivos simulados. Os testes binários unitários conferem bytes e integridade; não classificam pronúncia.

## Chrome — 8 verificações técnicas reais, sem microfone

Página técnica isolada, com tom gerado por AudioContext e ligado a MediaStreamAudioDestinationNode; nenhum getUserMedia real foi solicitado.
1. MediaRecorder real gerou um áudio WebM/Opus.
2. AudioContext decodificou o áudio (aproximadamente 0,60 s).
3. Migração de banco IndexedDB v1 para v2 preservou o conteúdo.
4. Tentativa e Blob foram salvos juntos no IndexedDB.
5. ZIP gerado, validado e restaurado em outro banco com os mesmos bytes de áudio.
6. Conflito de versão abortou sem áudio órfão.
7. Falha por áudio duplicado reverteu também a atualização do estado.
8. Após recarregar a página, tentativa e áudio foram recuperados.

Um problema de contexto dos temporizadores nativos foi detectado na primeira execução e corrigido em captura e reprodução antes da execução que passou.

## Interface

- Conteúdo da versão anterior continuou disponível na mesma origem.
- Cartão com gravação, autoavaliação e histórico exibido corretamente.
- Autoavaliação sem gravação foi salva e contou como 1/1 frase com tentativa atual.
- Marcar revisão atualizou a fila e o My Practice.
- Persistência da autoavaliação e revisão após reconstrução/recarregamento.
- Aviso de contexto não seguro exibido na prévia HTTP, sem solicitar microfone.
- Backup preparado com um link explícito de download. O evento de download ZIP não foi observado pela automação; a leitura do gerenciador interno de downloads foi bloqueada pela política do navegador. Não houve tentativa de contornar esse bloqueio.

## Teste integrado da interface com áudio sintético

Uma variante técnica usa a mesma interface e código, mas fornece um MediaStream de tom sintético ao lugar do microfone e grava em um banco isolado. Nela foram conferidos os botões Gravar/Parar, o rascunho de aproximadamente oito segundos, a reprodução até o estado Gravação concluída, a escolha de autoavaliação, o salvamento de tentativa e Blob e a exibição no histórico como gravação de voz. Nenhuma permissão de microfone foi solicitada. Esta variante não integra os HTMLs do produto.

## Ainda precisa de conferência

- Download efetivo do ZIP no navegador do usuário e seleção desse arquivo pela interface de restauração. O mecanismo de geração/validação/restauração foi exercitado diretamente no navegador.
- Microfone humano e qualidade sonora de referência.
- Android/iPhone físicos e abertura local de HTMLs.
- Falta de espaço real/quota. A atomicidade foi exercitada por conflito e erro binário em IndexedDB real, mas não foi forçada a lotação do disco.
- Compatibilidade de reprodução entre formatos e navegadores diferentes.

Não foi atribuída nota automática de pronúncia. Os áudios e cadastros de teste não estão embutidos nos HTMLs entregues.
