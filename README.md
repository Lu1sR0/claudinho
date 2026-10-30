# Claudinho

🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)

O seu Claude Code, agora com mais vida. Um app de desktop que conversa com o **Claude Code** de verdade (pelo SDK oficial de agentes) e desenha a conversa sobre papéis de parede ASCII vivos, com o Clawd do seu lado: 15 temas animados com música e sons, 278 animações da biblioteca ASCII Magic, papéis de parede do Wallpaper Engine, vídeos, imagens e GIFs seus.

Site: [meuclaudinho.com.br](https://meuclaudinho.com.br) · Feito por [Luis Roberto](https://luisrobertoportifolio.com)

## Instalar

1. Instale o [Claude Code](https://code.claude.com/docs/en/setup) e entre com a sua conta (o Claudinho usa o Claude Code que está no seu computador).
2. Baixe o instalador em [Releases](../../releases/latest) (`Claudinho-Setup.exe`) e abra. Windows 10 ou 11.
3. Depois de instalado, o Claudinho se atualiza sozinho: baixa a versão nova em segundo plano e avisa na barra lateral (também em Personalizar → Geral → Atualizações).
4. O instalador não é assinado: se o Windows mostrar "O Windows protegeu o seu computador", clique em **Mais informações → Executar assim mesmo**.

**Como o Claudinho entra no Claude**: por padrão, com o login do próprio Claude Code (o seu plano). Em Personalizar → Geral → Conta dá pra usar uma **chave de API da Anthropic** no lugar (cobrada por uso); a chave fica cifrada pelo sistema.

## Desenvolver

```bash
npm install
npm start          # abre o app
npm run dist       # gera o instalador em dist/
```

## Como usar

- **Pasta do projeto** (barra lateral): a pasta onde o Claude Code trabalha.
- **Conversas**: "Todas" mostra as conversas do Claude Code de todos os projetos (as do terminal, do app do Claude na aba Code e das outras janelas), com o nome do projeto em cada uma; "Esta pasta" mostra só as da pasta atual. A lista sincroniza sozinha quando qualquer conversa muda, e o botão ⟳ força na hora. Abrir uma conversa de outro projeto leva a janela para a pasta dele. As conversas do claude.ai (chat da web/app) não aparecem: elas ficam nos servidores da Anthropic, sem acesso oficial.
- **Modelo e permissões**: escolha na barra lateral. Em "Perguntar", cada ferramenta que precisa de aprovação aparece como um cartão com Permitir, Sempre nesta sessão e Negar.
- **Temas**: peça ao Claude (*"deixa o chat com a Honu Lagoon"*), digite `/tema`, `/tema lareira`, `/tema padrão`, ou use o botão 🎨 Temas.
- **Biblioteca**: a aba Biblioteca do seletor tem 278 animações da [ASCII Magic](https://www.ascii-magic.com/ascii) (MIT), de 9 categorias: paisagens, cidades, cosmos, clima e natureza, animais, algoritmos, arcade, datas e mascotes (a lista fica em `tools/indice-magia.mjs`), com busca e categorias. `/fundo gato` abre a busca; o Claude também procura e aplica (*"põe um fundo de chuva"*).
- **Meus**: crie no [ASCII Motion](https://www.ascii-motion.com), exporte como JSON e importe (botão, `/importar` ou arrastando o arquivo para a aba). Sessões `.asciimtn` sem camadas também entram.
- **Anexos**: clipe no campo de mensagem, arrastar arquivos para a janela ou colar imagens (Ctrl+V). Imagens vão para o Claude; os outros arquivos ele abre pelo caminho.
- **Comandos**: digite `/` para ver os comandos do app e os do Claude Code (skills, `/compact`, `/review`…). Setas escolhem, Tab completa, Enter executa. Os comandos do app também atendem pelo nome em inglês e espanhol (`/theme`, `/fondo`, `/background`, `/new`, `/nueva`, `/import`, `/customize`).
- **Esforço**: a barrinha ao lado do modelo define quanto o Claude pensa (padrão a máximo). Permissões e modelo abrem um menu que explica cada opção.
- **Conversas**: fixar no topo, duplicar, exportar em Markdown, renomear e apagar (menu ⋯). A busca (Ctrl+K) procura também dentro das mensagens.
- **Respostas**: copiar, ler em voz alta e **ramificar daqui** (nova conversa a partir daquela resposta; a original fica intacta). Hora em cada mensagem.
- **Enquanto o Claude trabalha**: o que você enviar entra na fila e sai quando ele terminar. O plano dele (lista de tarefas) fica fixo acima do campo, e o medidor ao lado do botão mostra quanto do contexto já foi usado.
- **Avisos**: com a janela em segundo plano, uma notificação avisa quando o Claude termina ou precisa de aprovação. Ctrl+Shift+Espaço mostra o Claudinho de qualquer lugar. Ctrl+/ lista os atalhos.
- **Clawd**: o mascote do Claude Code está em todo lugar. Na abertura ele se monta com ladrilhos; na tela inicial ele segue o mouse com os olhos, acena quando você passa por cima, pula e solta faíscas no clique e dorme se você fica parado; ao lado do campo de mensagem ele acompanha o Claude (pensa, digita, chama você, pula quando termina); na barra lateral e no "pensando" ele balança e digita. Dá pra **pegar o Clawd** ao lado do campo: ele balança pendurado no mouse, cai quando você solta (e fica tonto se for arremessado) e volta andando pro lugar; clique nele e ele pula e fala (tem muitas falas). De vez em quando ele espia de trás da barra lateral quando você passa o mouse num projeto. Ele também é o ícone do app; o atalho **Claudinho** na pasta abre o app com esse ícone.
- **Várias janelas**: abra uma conversa em outra janela (menu ⋯ da conversa) ou uma janela nova com Ctrl+Shift+N; cada janela tem a sua conversa.
- **Barra lateral**: grupos (pastas que abrem e fecham; arraste conversas para elas) e cores para as conversas, no menu ⋯.
- **Respostas longas** vêm dobradas, com um índice dos títulos e "Ler a resposta inteira".
- **Janelinhas flutuantes** (arraste pelo título, redimensione pelo canto e fixe no alfinete para ela ficar aberta no mesmo lugar, mesmo depois de fechar o app): **Alterações da conversa** (botão no topo: todos os arquivos mudados, com diff e "desfazer a partir daqui"), o **plano** do Claude destacado e o **player de música** (no botão de som).
- **Clique direito** no papel de parede abre um menu radial. `!comando` no campo pede ao Claude para rodar no terminal. Clique direito num bloquinho do trilho volta os arquivos para antes dali.
- **Enquanto o Claude trabalha**: o raciocínio aparece num bloco recolhível, cada ferramenta vira um bloquinho no trilho do topo (clique para ir até ela), edições aparecem como diff (+/−), e o papel de parede reage (ondas, ritmo).
- **Desfazer**: passe o mouse numa mensagem sua e clique na seta: os arquivos que o Claude mudou a partir dali voltam ao que eram (com prévia antes).
- **Perguntas do Claude** viram um formulário com as opções; **textos colados grandes** viram um anexo que dá pra abrir e editar; **título automático** para conversas novas; aviso e "continuar sozinho" quando o limite do plano estoura.
- **Personalizar** (barra lateral ou `/personalizar`):
  - **Geral**: **idioma** (português, inglês ou espanhol; começa no idioma do sistema), enviar com Enter ou Ctrl+Enter, **desempenho** (Automático, Máximo ou Leve), mostrar raciocínio, título automático, Clawd, papel de parede que reage, notificações e a **conta** (login do Claude Code ou chave de API).
  - **Fundo**: imagens, GIFs e vídeos seus como papel de parede (também arrastando para a aba Meus), e papéis de parede de vídeo e de página do **Wallpaper Engine** (os de cena só rodam dentro dele), com ajuste, escurecer, desfocar e som do vídeo.
  - **Cores**: paletas prontas, cor de destaque, do texto e do vidro, opacidade e desfoque do vidro, vidro claro ou escuro.
  - **Fontes**: fonte da interface e do código (da internet ou seus arquivos .ttf/.otf/.woff), tamanho do texto e largura da conversa.
  - **Sons**: um som seu para enviar, terminar, pedido de aprovação, erro, clique no papel de parede e abrir o app.
  - **Música**: suas músicas tocando em sequência ou aleatórias, no lugar da música dos temas ou junto (controles também no botão de som).
  - **Ícone e nome**: ícone da janela e da barra de tarefas, opcionalmente na barra lateral, e o nome do app.
  - Os arquivos ficam copiados em `%APPDATA%\Claudinho\pessoal`; "Restaurar tudo" volta ao padrão.
- **Uso do plano** (botão de fôlego no topo): o Clawd treina na academia; vai cansando conforme a sessão de 5 horas enche e dorme quando bate o limite, com a hora em que libera. Mostra também a semana e por modelo.
- **Clawd conversa**: de tempos em tempos ele comenta o projeto, conta curiosidades do Claude e da Anthropic, dá dicas do app e traz novidades (uma busca rápida por dia). Clique nele para ouvir a próxima. Dá pra desligar em Personalizar → Geral.
- **Créditos**: na barra lateral, quem fez cada arte e cada parte do app.
- **Som**: botão no topo (começa desligado).
- `/nova` começa uma conversa nova.

## Estrutura

- `src/main.js`: a janela e a ponte com o Claude Code (`query()` do `@anthropic-ai/claude-agent-sdk`), permissões e as ferramentas de tema que o Claude pode chamar.
- `src/preload.cjs`: as chamadas que a janela pode fazer.
- `src/renderer/`: a interface (`index.html`, `app.css`, `app.js`) e o motor dos papéis de parede (`wallpapers/`).
- `src/renderer/wallpapers/arte.mjs`: toca as peças da ASCII Magic e as animações importadas; `magia-indice.js` é gerado por `node tools/indice-magia.mjs`.
- `docs/pesquisa-melhorias.md`: o que os usuários mais pedem ao Claude e conceitos de design, com o que já foi feito e o que falta.
- `src/renderer/personalizar.js`: o painel Personalizar (cores, fontes, sons, música, ícone e nome).
- `src/renderer/extras.js`, `clawd-arte.js`, `clawd.js`, `interface.js`, `os.js`: raciocínio, diffs, desfazer, perguntas, limites, o Clawd, o trilho de atividade, as janelinhas e o menu radial.
- `src/renderer/simulador.js`: abre a interface num navegador comum com respostas de mentira, para mexer no visual sem o Claude Code.
- `src/renderer/i18n/`: os textos da interface em português (`pt-BR.js`, o original), inglês (`en.js`) e espanhol (`es.js`); `i18n.js` traz o `t("chave")`, que cai no português quando falta uma tradução.
  - Pra adicionar um idioma: copie `en.js` (ex.: `fr.js`) e traduza, ponha o `<script>` dele em `src/renderer/index.html` e o `import` em `src/main.js`, registre o nome em `IDIOMAS` e o prefixo em `idiomaDe()` (no `i18n.js`) e rode `node tools/confere-i18n.mjs`.

## Testes

- `node tools/teste-sdk.mjs`: uma pergunta curta pelo SDK, para conferir o login e o streaming.
- `node tools/confere-i18n.mjs`: confere se toda chave de tradução existe nos três idiomas.
- `VIVO_LOG=1 VIVO_TESTE="mensagem" npm start`: envia a mensagem ao abrir e registra os eventos no terminal (`VIVO_ANEXO=arquivo` anexa um arquivo).
- `node`/testes: com `VIVO_PASTA` ou `VIVO_JS` o app usa um perfil separado (`%APPDATA%\Claudinho-teste`), então os testes não mexem nas suas configurações e rodam com o app aberto.
- `VIVO_MOTION=arquivo.json`: importa uma animação do ASCII Motion ao abrir. `VIVO_JS="expressão" VIVO_FOTO=tela.png`: roda um código na janela e salva uma foto dela.

## Licença e créditos

Código sob a licença MIT (veja `LICENSE`). As animações da biblioteca vêm do pacote [ascii-magic-art](https://www.ascii-magic.com/ascii) (MIT). O Claude Agent SDK é da Anthropic e segue os termos dela.

O Claudinho é um projeto independente de fã. Não é afiliado nem endossado pela Anthropic. Claude, Claude Code e Clawd são marcas da Anthropic.
