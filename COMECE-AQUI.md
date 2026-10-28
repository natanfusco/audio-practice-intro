# House of Fluency — entrega R7

## O que usar

- Professor: dist/hof-teacher.html.
- Aluno: dist/hof-student.html + o JSON individual.
- Guilherme: data/Guilherme_Present_R5.json. São sete respostas e uma apresentação com cinco frases. Past/Future aguardam esclarecimentos de conteúdo; veja Pendencias_Guilherme.md.

Abra dist/index.html para escolher o aplicativo. Cada HTML funciona sozinho, com seu código incluído. O ZIP é o pacote do professor: não envie o pacote completo aos alunos, pois contém fonte e o JSON de Guilherme. Para outro aluno, envie apenas hof-student.html e o JSON correspondente.

Os HTMLs universais não contêm os cadastros reais. Novas aulas entram por JSON, com data informada por você. O JSON de conteúdo não inclui gravações nem progresso. Preserve os IDs e aumente as revisões quando alterar conteúdo.

Se Guilherme já foi cadastrado com um ID diferente de guilherme-hof-001, use o ID do cadastro existente no conteúdo preparado. Não crie um segundo cadastro para contornar a validação.

## Conferência no seu aparelho — cerca de cinco minutos

Esta é a etapa de aceitação que depende de você. Não é preciso autorizar outra rodada de código para começar.

1. Guarde os backups anteriores. Abra o HTML atualizado num navegador completo, fora do visualizador de anexos do WhatsApp. Mantenha a mesma pasta/origem quando possível.
2. Importe o JSON individual, confira o nome e confirme. Abra Present, Part A e Part B; confira também Minha rotina.
3. Em Ajuda → Conferir este navegador, veja os recursos disponíveis. Em Voz americana, escolha uma voz en-US e ouça uma frase. A lista depende do sistema e pode demorar a carregar.
4. Em uma frase, toque em Gravar minha voz e autorize o microfone no navegador. Fale por alguns segundos, pare, ouça, compare e salve a tentativa. Confira se o som está inteligível e sem cortes.
5. Recarregue a página, abra a mesma frase e confira a tentativa e o áudio no Histórico.
6. No My Practice, escolha Baixar backup com áudios e clique no link Baixar ZIP do backup. Confirme que existe um ZIP não vazio em Downloads.
7. Em outro navegador ou aparelho, abra o mesmo HTML e use Restaurar backup; selecione o ZIP completo, confira a prévia e confirme. Confira nome, frases, tentativa e reprodução do áudio. Não apague o original para testar.
8. Se for usar celular, repita os passos de voz, microfone e backup no aparelho real. Layout estreito testado no computador não confirma compatibilidade de Android/iPhone.

Resultado para me enviar: aparelho e navegador; voz americana funcionou (sim/não); gravação funcionou; áudio permaneceu após recarregar; ZIP baixou e restaurou; mensagem de erro ou captura da tela em que parou, se houver.

## Se algo não funcionar

- Sem voz americana: abra as configurações de voz e confira as vozes en-US disponíveis no aparelho. O texto e a autoavaliação continuam utilizáveis.
- Sem gravação: confira a permissão do microfone e abra em um navegador que permita captura. A conferência de recursos não solicita permissão nem garante acesso ao microfone. HTTPS ou arquivo local autorizado dependem do navegador; este pacote não inclui hospedagem.
- Dados não aparecem: confirme navegador, perfil, pasta/origem e aluno. Use o backup correspondente; os dados não são sincronizados.
- ZIP não baixou: mantenha a janela de backup aberta e confira as notificações do próprio navegador. Não considere o backup concluído sem verificar o arquivo.
- Voz artificial não corresponde à pronúncia aproximada: confira com o professor. A escrita é um apoio aproximado e o áudio depende da voz selecionada; não existe nota fonética automática.

## Situação da entrega

A revisão técnica local da R7 está concluída: 97 testes automatizados passaram; importação JSON e restauração de ZIP pela interface foram verificadas; áudio sintético restaurado foi reproduzido; telas estreitas foram medidas sem transbordamento nos estados verificados. Ajuda inclui a conferência do navegador e as janelas recebem título acessível e foco ao abrir.

A aceitação em aparelho real continua pendente: microfone humano, qualidade da voz americana, download efetivo pelo navegador do usuário e recuperação entre aparelhos. Não é uma homologação em todos os navegadores.
