# House of Fluency — Pronunciation Practice

Versão R7 preservada em 28/10/2026, antes de novas alterações.

Sistema universal de prática de pronúncia com conteúdo individual por JSON, navegação por hubs, grupos de fala, ligações, pronúncia aproximada, referência americana, gravação local, comparação por escuta, autoavaliação, revisão e backup ZIP com áudio.

## Usar

Abra `dist/index.html` e escolha professor ou aluno. Os arquivos `dist/hof-teacher.html` e `dist/hof-student.html` são independentes e incluem todo o código necessário.

O professor recebe o aplicativo administrativo. Cada aluno recebe o HTML universal e somente seu JSON individual. O conteúdo real começa vazio; a demonstração é fictícia e separada.

## Reconstruir e testar

```sh
python3 build.py
node tests/core.test.js
node tests/r5.test.js
node tests/r6.test.js
```

97 testes passaram na revisão R7. Não é necessário instalar pacotes para essas verificações. JSZip 3.10.1 está incluído em `vendor/`, com sua licença.

## Arquivos

- `src/`: código-fonte da R7.
- `dist/`: HTMLs prontos, schema e demonstração.
- `data/demo-conteudo.json`: conteúdo fictício para teste.
- `hof-content.schema.json`: contrato de conteúdo.
- `LEIA-ME.md` e `COMECE-AQUI.md`: guias originais da entrega.
- `VALIDACAO.md`: verificações realizadas e limites conhecidos.
- `R7-CHECKPOINT.json`: tamanhos e SHA-256 dos arquivos originais preservados.
- `build*_qa.py` e `tests/`: ferramentas de desenvolvimento; páginas `qa-*` não fazem parte dos HTMLs de uso.

## Conteúdo privado

Este repositório é público. O JSON real de Guilherme, as pendências individuais, gravações e backups pessoais foram excluídos. Referências a esses arquivos nos guias originais dizem respeito à entrega particular ao professor; eles não estão neste repositório. O JSON individual permanece separado do sistema.

## Limites de validação

Importação JSON, restauração pela interface e reprodução de áudio sintético foram verificadas. Layout conferido em larguras de 320, 360, 768 e 1280 pixels. Microfone humano, qualidade das vozes en-US, aparelhos físicos e download efetivo no navegador do usuário ainda dependem de conferência no aparelho real. Não há nota automática de pronúncia nem sincronização com servidor.

O checkpoint preserva o comportamento da R7. Nenhuma funcionalidade foi alterada para salvar esta versão no GitHub.
