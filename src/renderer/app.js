// The window: a Claude Code conversation drawn over a live ASCII wallpaper.
// Text streams in as Markdown; tool calls show as cards that fill in with
// their result; permission requests wait for a click; themes come from the
// picker, from /tema, or from Claude itself through the app's theme tools.

const $ = (id) => document.getElementById(id);
const col = $("col"), scroll = $("scroll"), entrada = $("entrada"), picker = $("picker"), banner = $("banner"), menu = $("menu");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const svg = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;
const ICONE = {
  copiar: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>'),
  ok: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  erro: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
  terminal: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="m7.5 9.5 3 2.5-3 2.5M12.5 15h4"/>'),
  arquivo: svg('<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5"/>'),
  editar: svg('<path d="M14.5 5.5 18.5 9.5 9 19H5v-4z"/>'),
  busca: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>'),
  web: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14.5 0 17M12 3.5c-2.5 2.5-2.5 14.5 0 17"/>'),
  tema: svg('<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.8-1.7H17a3.5 3.5 0 0 0 3.5-3.5c0-4.2-3.8-7.5-8.5-7.5z"/>'),
  ferramenta: svg('<path d="M14.5 6.5a4 4 0 0 0-5 5L4.5 16.5l3 3 5-5a4 4 0 0 0 5-5l-2.5 2.5-2-.5-.5-2z"/>'),
  escudo: svg('<path d="M12 3.5 4.5 7v5c0 4.2 3.2 7.6 7.5 8.5 4.3-.9 7.5-4.3 7.5-8.5V7z"/>'),
  mais: svg('<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>'),
  lapis: svg('<path d="M14.5 5.5 18.5 9.5 9 19H5v-4z"/>'),
  lixo: svg('<path d="M5 7.5h14M9.5 7.5V5h5v2.5M7 7.5l1 12h8l1-12"/>'),
  ouvir: svg('<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z"/><path d="M15.5 9a4 4 0 0 1 0 6"/>'),
  ramo: svg('<circle cx="7" cy="5.5" r="2"/><circle cx="7" cy="18.5" r="2"/><circle cx="17" cy="9" r="2"/><path d="M7 7.5v9M17 11c0 3-4 3.5-8.5 6"/>'),
  pino: svg('<path d="M9 4.5h6l-1 5 3 3H7l3-3zM12 12.5V20"/>'),
  exportar: svg('<path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5"/><path d="M5 16.5v2a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-2"/>'),
  pasta: svg('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'),
  janela: svg('<rect x="3.5" y="5.5" width="13" height="13" rx="2"/><path d="M8.5 5.5V4.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1"/>'),
  duplicar: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>'),
};
const horaAgora = () => new Date().toLocaleTimeString(idiomaAtual(), { hour: "2-digit", minute: "2-digit" });
const iconeDa = (nome) => (nome === "Bash" ? ICONE.terminal : /^(Read|NotebookRead)$/.test(nome) ? ICONE.arquivo : /^(Write|Edit|MultiEdit|NotebookEdit)$/.test(nome) ? ICONE.editar
  : /^(Glob|Grep|ToolSearch)$/.test(nome) ? ICONE.busca : /^Web/.test(nome) ? ICONE.web : nome.startsWith("mcp__claudinho__") ? ICONE.tema : ICONE.ferramenta);

// Markdown: raw HTML in Claude's text is shown as text, never run.
marked.use({ gfm: true, breaks: true, renderer: { html: ({ text }) => esc(text) } });
const md = (s) => marked.parse(s || "");
// Code blocks get a header with their language and a copy button.
function decora(el) {
  for (const pre of el.querySelectorAll("pre")) {
    if (pre.parentElement.classList.contains("codigo")) continue;
    const code = pre.querySelector("code"), lang = (code?.className.match(/language-(\S+)/) || [])[1] || t("app.codigo");
    const caixa = document.createElement("div"); caixa.className = "codigo";
    caixa.innerHTML = `<div class="codigo-topo"><span>${esc(lang)}</span><button>${ICONE.copiar}<span>${t("app.copiar")}</span></button></div>`;
    pre.replaceWith(caixa); caixa.append(pre);
    caixa.querySelector("button").onclick = (e) => copia(pre.innerText, e.currentTarget);
  }
}
function copia(texto, botao) {
  navigator.clipboard.writeText(texto).then(() => {
    const antes = botao.innerHTML; botao.innerHTML = `${ICONE.ok}<span>${t("app.copiado")}</span>`;
    setTimeout(() => (botao.innerHTML = antes), 1400);
  });
}

let rodando = false, segmento = null, bufferTexto = "", renderAgendado = false, pensando = null;
const ferramentas = new Map();

// ---- conversation -----------------------------------------------------------
const pertoDoFim = () => scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 280;
const desce = () => { if (pertoDoFim()) requestAnimationFrame(() => (scroll.scrollTop = scroll.scrollHeight)); };
const forcaDesce = () => requestAnimationFrame(() => scroll.scrollTo({ top: scroll.scrollHeight, behavior: "smooth" }));
function tiraBoas() { col.querySelector(".boas")?.remove(); }
function bloco(cls, html) { tiraBoas(); const el = document.createElement("div"); el.className = cls; if (html != null) el.innerHTML = html; col.append(el); desce(); return el; }
function meu(texto, anexos = [], imagens = 0, hora = horaAgora()) {
  const el = bloco("msg eu");
  if (hora) el.dataset.hora = hora;
  const desfaz = document.createElement("button");
  desfaz.className = "desfaz"; desfaz.title = t("app.desfazer"); desfaz.innerHTML = svg('<path d="M9 7.5 4.5 12 9 16.5"/><path d="M5 12h9.5a5 5 0 0 1 0 10H12"/>');
  desfaz.onclick = () => desfazDaqui(el);
  el.append(desfaz);
  if (anexos.length || imagens) {
    const a = document.createElement("div"); a.className = "msg-anexos";
    for (const x of anexos) {
      if (x.url) { const img = document.createElement("img"); img.src = x.url; img.alt = x.nome; img.title = x.nome; a.append(img); }
      else a.append(chipArquivo(x.nome));
    }
    if (imagens) a.append(chipArquivo(t("app.imagens", { n: imagens })));
    el.append(a);
  }
  if (texto) el.append(document.createTextNode(texto));
  forcaDesce();
}
function chipArquivo(nome) { const s = document.createElement("span"); s.className = "arq"; s.innerHTML = ICONE.arquivo; s.append(nome); return s; }
function aviso(texto, erro = false) { bloco("aviso" + (erro ? " erro" : ""), esc(texto)); }

function mostraPensando(tokens) {
  if (!pensando) pensando = bloco("pensando", `${mosaicoMini()}<b>${t("app.pensando")}</b><span class="n"></span>`);
  if (tokens) pensando.querySelector(".n").textContent = `${tokens >= 1000 ? (tokens / 1000).toLocaleString(idiomaAtual(), { maximumFractionDigits: 1 }) + t("app.mil") : tokens} tokens`;
}
function tiraPensando() { pensando?.remove(); pensando = null; }

function fechaSegmento() {
  if (!segmento) return;
  segmento.classList.remove("cursor");
  segmento.querySelector(".corpo").innerHTML = md(bufferTexto); decora(segmento);
  acoesResposta(segmento, bufferTexto, horaAgora());
  window.camadas?.(segmento);
  segmento = null; bufferTexto = "";
}
// Under each reply: copy, read aloud, branch the conversation from here, and
// when it came. The branch button shows once the reply's id is known.
function acoesResposta(el, texto, hora) {
  const acoes = document.createElement("div");
  acoes.className = "acoes";
  acoes.innerHTML = `<button data-a="copiar" title="${t("app.copiarResposta")}">${ICONE.copiar}</button><button data-a="ouvir" title="${t("app.lerEmVoz")}">${ICONE.ouvir}</button><button data-a="ramo" class="ramo" title="${t("app.ramificarDaqui")}">${ICONE.ramo}</button>${hora ? `<time>${hora}</time>` : ""}`;
  acoes.querySelector('[data-a="copiar"]').onclick = (e) => copia(texto, e.currentTarget);
  acoes.querySelector('[data-a="ouvir"]').onclick = (e) => leEmVoz(texto, e.currentTarget);
  acoes.querySelector('[data-a="ramo"]').onclick = () => ramifica(el.dataset.uuid);
  el.append(acoes);
}
// Read aloud: Markdown and code left out; a second click stops.
function leEmVoz(texto, botao) {
  const fala = speechSynthesis;
  if (fala.speaking) { fala.cancel(); document.querySelectorAll(".acoes .falando").forEach((b) => b.classList.remove("falando")); return; }
  const limpo = texto.replace(/```[\s\S]*?```/g, t("app.trechoCodigo")).replace(/`([^`]*)`/g, "$1").replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*_~|]+/g, " ").replace(/\s+/g, " ").trim();
  const u = new SpeechSynthesisUtterance(limpo);
  u.lang = idiomaAtual();
  const voz = fala.getVoices().find((v) => v.lang?.toLowerCase().startsWith(idiomaAtual().slice(0, 2)));
  if (voz) u.voice = voz;
  u.onend = u.onerror = () => botao.classList.remove("falando");
  botao.classList.add("falando"); fala.speak(u);
}
async function ramifica(uuid) {
  if (!uuid || rodando) return;
  const base = $("titulo").textContent.replace(new RegExp(t("app.sufixoRamo").replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"), "");
  const r = await vivo.ramificar(sessaoAtual, uuid, `${base}${t("app.sufixoRamo")}`);
  if (!r) { nota(t("app.naoRamificou"), true); return; }
  if (r.cwd && r.cwd !== $("pasta").title) { mostraPasta(r.cwd); todosComandos = buscandoComandos = null; }
  await abreSessao(r.id, r.titulo); carregaSessoes();
  nota(t("app.ramoCriado"));
}
function texto(delta) {
  tiraPensando();
  if (!segmento) { segmento = bloco("msg claude cursor", '<div class="corpo"></div>'); bufferTexto = ""; }
  bufferTexto += delta;
  if (!renderAgendado) {
    renderAgendado = true;
    setTimeout(() => { renderAgendado = false; if (segmento) { segmento.querySelector(".corpo").innerHTML = md(bufferTexto); decora(segmento); } desce(); }, 45);
  }
}

function resumo(nome, e = {}) {
  if (nome === "Bash") return e.command;
  if (["Read", "Write", "Edit", "MultiEdit", "NotebookEdit"].includes(nome)) return e.file_path || e.notebook_path;
  if (nome === "Glob" || nome === "Grep") return e.pattern;
  if (nome === "WebFetch") return e.url;
  if (nome === "WebSearch") return e.query;
  if (nome === "mcp__claudinho__buscar_fundo") return [e.busca, e.categoria].filter(Boolean).join(" · ");
  if (/fundo$/.test(nome)) return PECAS.get(e.peca)?.nome || e.peca;
  if (nome.startsWith("mcp__claudinho__")) return nomeTema(e.tema);
  return Object.values(e).find((x) => typeof x === "string") || "";
}
const ROTULO = { Bash: t("app.rotComando"), Read: t("app.rotLeu"), Write: t("app.rotCriou"), Edit: t("app.rotEditou"), MultiEdit: t("app.rotEditou"), Glob: t("app.rotProcurouArquivos"), Grep: t("app.rotBuscou"), WebFetch: t("app.rotAbriuPagina"), WebSearch: t("app.rotPesquisou"), ToolSearch: t("app.rotBuscouFerramenta"), TodoWrite: t("app.rotListaTarefas"), Task: t("app.rotSubagente"), mcp__claudinho__sugerir_tema: t("app.rotSugeriuTema"), mcp__claudinho__aplicar_tema: t("app.rotAplicouTema"),
  mcp__claudinho__buscar_fundo: t("app.rotBuscouFundos"), mcp__claudinho__sugerir_fundo: t("app.rotSugeriuFundo"), mcp__claudinho__aplicar_fundo: t("app.rotAplicouFundo") };
const rotulo = (n) => ROTULO[n] || n.replace(/^mcp__([^_]+)__/, "$1 · ");
// What a permission card asks for, in the infinitive.
const PEDIDO = { Bash: t("app.pedComando"), Write: t("app.pedCriarArquivo"), Edit: t("app.pedEditarArquivo"), MultiEdit: t("app.pedEditarArquivo"), NotebookEdit: t("app.pedEditarNotebook"), WebFetch: t("app.pedAbrirPagina"), WebSearch: t("app.pedPesquisar"), Task: t("app.pedSubagente") };
const pedido = (n) => PEDIDO[n] || t("app.pedUsar", { nome: rotulo(n) });

function ferramenta(id, nome, e, fim = null) {
  fechaSegmento(); tiraPensando();
  const d = document.createElement("details");
  d.className = "ferr";
  const diff = diffDe(nome, e);
  d.innerHTML = `<summary>${iconeDa(nome)}<b data-nome="${esc(nome)}">${esc(rotulo(nome))}</b><span>${esc(resumo(nome, e) || "")}</span>${diff ? diff.contagem : ""}<i class="estado ${fim ? fim : "rodando"}">${fim === "ok" ? ICONE.ok : ""}</i></summary>${diff ? diff.html : `<pre>${esc(JSON.stringify(e, null, 2))}</pre>`}`;
  d._nome = nome; d._entrada = e; d.dataset.nome = nome;
  tiraBoas(); col.append(d); desce();
  ferramentas.set(id, d);
}
function ferramentaFim(id, erro, saida) {
  const d = ferramentas.get(id); if (!d) return;
  const i = d.querySelector(".estado"); i.className = "estado " + (erro ? "erro" : "ok"); i.innerHTML = erro ? ICONE.erro : ICONE.ok;
  const pre = d.querySelector("pre");
  if (saida && pre) pre.textContent += "\n\n" + t("app.resultado") + "\n" + saida;
}

function permissao(ev) {
  fechaSegmento(); tiraPensando();
  const el = bloco("perm");
  el.dataset.id = ev.id;
  const diff = diffDe(ev.ferramenta, ev.entrada);
  el.innerHTML = `<div class="t">${ICONE.escudo}<span>${t("app.claudeQuer", { pedido: `<b>${esc(pedido(ev.ferramenta))}</b>` })}</span>${diff ? diff.contagem : ""}</div>${ev.motivo ? `<div class="aviso">${esc(ev.motivo)}</div>` : ""}${diff ? `<div class="caminho">${esc(ev.entrada.file_path || "")}</div>` + diff.html : `<pre>${esc(JSON.stringify(ev.entrada, null, 2).slice(0, 3000))}</pre>`}`;
  const linha = document.createElement("div"); linha.className = "b";
  const botao = (rot, dec, cls) => {
    const b = document.createElement("button"); b.textContent = rot; b.className = "btn" + (cls ? " " + cls : "");
    b.onclick = () => { vivo.permissao(ev.id, dec); el.className = "resolvido"; el.innerHTML = `${dec === "negar" ? ICONE.erro : ICONE.ok}<span>${dec === "negar" ? t("app.negado") : t("app.permitido")} · ${esc(rotulo(ev.ferramenta))}</span>`; mostraPensando(); };
    linha.append(b);
  };
  botao(t("app.permitir"), "sim", "forte");
  if (ev.temSempre) botao(t("app.sempreSessao"), "sempre");
  botao(t("app.negar"), "negar");
  el.append(linha); forcaDesce();
}

vivo.aoEvento((ev) => {
  switch (ev.tipo) {
    case "inicio": fechaSegmento(); mostraPensando(); break;
    case "pensando": if (!segmento) mostraPensando(ev.tokens); break;
    case "texto_inicio": fechaSegmento(); break;
    case "texto": texto(ev.delta); break;
    case "ferramenta": ferramenta(ev.id, ev.nome, ev.entrada); if (ev.nome === "TodoWrite") mostraPlano(ev.entrada?.todos); break;
    case "marca": { const el = segmento || [...col.querySelectorAll(".msg.claude:not([data-uuid])")].pop(); if (el) el.dataset.uuid = ev.uuid; break; }
    case "uso": mostraUso(ev); break;
    case "ferramenta_fim": ferramentaFim(ev.id, ev.erro, ev.saida); break;
    case "permissao": permissao(ev); window.somEvento?.("permissao"); avisaSistema(t("app.precisaAprovacao"), t("app.quer", { pedido: pedido(ev.ferramenta) })); break;
    case "permissao_fim": document.querySelector(`.perm[data-id="${ev.id}"], .pergunta[data-id="${ev.id}"]`)?.remove(); break;
    case "apagada": if (sessaoAtual === ev.id) { novaConversa(); nota(t("app.apagadaOutraJanela")); } break;
    case "config": $("modo").value = ev.modo || "default"; $("modelo").value = ev.model || ""; $("esforco").value = ev.esforco || ""; atualizaEscolhas(); break;
    case "visual": if (typeof VIS !== "undefined") { VIS = ev.visual || {}; aplicaVisual(); } break;
    case "cartao_tema": { fechaSegmento(); tiraPensando(); const i = idx(ev.tema); if (i >= 0) cartao(bloco("msg claude"), i); break; }
    case "aplicar_tema": { const i = idx(ev.tema); if (i >= 0) aplica(i); break; }
    case "cartao_arte": fechaSegmento(); tiraPensando(); cartaoArte(bloco("msg claude"), ev.chave); break;
    case "aplicar_arte": aplicaChave(ev.chave); break;
    case "sessao": sessaoAtual = ev.id; marcaSessao(); break;
    case "info": break;
    case "fim": if (!ev.ok && ev.detalhe !== "success") aviso(t("app.parou", { detalhe: ev.detalhe }), true); break;
    case "erro": tiraPensando(); aviso(ev.texto, true); window.somEvento?.("erro"); break;
    case "atualizacao": mostraAtualizacao(ev); break;
    case "parado":
      tiraPensando(); fechaSegmento(); setRodando(false); carregaSessoes();
      if (fila.length) setTimeout(proximaDaFila, 350);
      else { avisaSistema(t("app.terminou"), $("titulo").textContent); window.somEvento?.("terminou"); }
      break;
  }
});

function setRodando(v) {
  rodando = v;
  const b = $("enviar");
  b.classList.toggle("parar", v); b.title = v ? t("app.parar") : t("app.enviarEnter");
  atualizaEnviar();
}
// Pasted text kept as a chip goes out appended to the message.
function juntaColados(t, junto) {
  const colados = junto.filter((a) => a.tipo === "texto");
  return {
    texto: [t, ...colados.map((a) => a.conteudo)].filter(Boolean).join("\n\n"),
    enviados: junto.filter((a) => a.tipo !== "texto").map(({ nome, caminho, dados, mime }) => ({ nome, caminho, dados, mime })),
  };
}
const geral = () => (typeof visualAtual === "function" ? visualAtual().geral || {} : {});
const atualizaEnviar = () => { $("enviar").disabled = !rodando && !entrada.value.trim() && !anexos.length; };

async function envia(textoForcado) {
  let t = (textoForcado ?? entrada.value).trim(), junto = textoForcado == null ? anexos : [];
  if (!t && !junto.length) return;
  const limpa = () => { entrada.value = ""; ajustaAltura(); fechaComandos(); atualizaEnviar(); $("composer").classList.remove("modo-comando"); };
  t = t.replace(/^\/(\S+)/, (m, c) => (Object.hasOwn(ALIAS, c.toLowerCase()) ? "/" + ALIAS[c.toLowerCase()] : m));
  if (t === "/tema") { abrePicker("claudinho"); limpa(); return; }
  if (t.startsWith("/tema ")) {
    const pedido = t.slice(6).trim().toLowerCase(), i = THEMES.findIndex((x) => x.id === pedido || x.name.toLowerCase() === pedido);
    if (["padrao", "padrão", "off", "predeterminado", "default"].includes(pedido)) aplica(-1); else if (i >= 0) aplica(i); else abrePicker("claudinho");
    limpa(); return;
  }
  if (t === "/fundo" || t.startsWith("/fundo ")) { abrePicker("biblioteca", t.slice(6).trim()); limpa(); return; }
  if (t === "/importar") { limpa(); importaMotion(); return; }
  if (t === "/personalizar") { limpa(); abrePersonal(); return; }
  if (t === "/nova") { novaConversa(); limpa(); return; }
  if (rodando) {
    fila.push({ t, junto: [...junto] }); limpa();
    if (junto === anexos) { anexos = []; desenhaAnexos(); }
    desenhaFila(); return;
  }
  limpa(); fechaPicker();
  if (!sessaoAtual) { const titulo = t || junto.map((x) => x.nome).join(", "); $("titulo").textContent = titulo.length > 60 ? titulo.slice(0, 60) + "…" : titulo; }
  const { texto: final, enviados } = juntaColados(t, junto);
  meu(t, junto); window.somEvento?.("enviar");
  const bolha = col.lastElementChild, eram = junto === anexos ? [...anexos] : null;
  if (eram) { anexos = []; desenhaAnexos(); }
  setRodando(true);
  if (!(await vivo.enviar(final, enviados))) {
    setRodando(false); bolha?.remove();
    if (textoForcado == null) { entrada.value = t; ajustaAltura(); if (eram) { anexos = eram; desenhaAnexos(); } }
    atualizaEnviar(); nota(globalThis.t("app.naoEnviou"), true);
  }
}
entrada.addEventListener("keydown", (e) => {
  if (comandosEl.classList.contains("on")) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); cmdSel = (cmdSel + (e.key === "ArrowDown" ? 1 : -1) + cmdVis.length) % cmdVis.length; mostraComandos(); return; }
    if (e.key === "Tab") { e.preventDefault(); escolheComando(cmdVis[cmdSel], false); return; }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); escolheComando(cmdVis[cmdSel], true); return; }
    if (e.key === "Escape") { e.stopPropagation(); fechaComandos(); return; }
  }
  if (e.key === "Enter" && !e.shiftKey && (geral().enviar !== "ctrl" || e.ctrlKey)) { e.preventDefault(); envia(); }
  if (e.key === "Escape") fechaPicker();
});
const ajustaAltura = () => { entrada.style.height = "auto"; entrada.style.height = Math.min(240, entrada.scrollHeight) + "px"; };
entrada.addEventListener("input", () => { ajustaAltura(); atualizaEnviar(); cmdSel = 0; mostraComandos(); });

// ---- slash commands ----------------------------------------------------------
// Typing "/" lists the app's own commands and Claude Code's (skills, custom
// commands, /compact…), filtered as you type; arrows pick, Tab completes,
// Enter runs.
const comandosEl = $("comandos");
const LOCAIS = [
  { nome: t("app.cmdTema"), dica: t("app.dicaNome"), descricao: t("app.cmdTemaDesc") },
  { nome: t("app.cmdFundo"), dica: t("app.dicaBusca"), descricao: t("app.cmdFundoDesc") },
  { nome: t("app.cmdImportar"), descricao: t("app.cmdImportarDesc") },
  { nome: t("app.cmdPersonalizar"), descricao: t("app.cmdPersonalizarDesc") },
  { nome: t("app.cmdNova"), descricao: t("app.cmdNovaDesc") },
].map((c) => ({ ...c, local: true }));
// the commands also answer to their names in the other languages; the original ones always work
const ALIAS = { theme: "tema", fondo: "fundo", background: "fundo", import: "importar", customize: "personalizar", nueva: "nova", new: "nova" };
let todosComandos = null, buscandoComandos = null, cmdVis = [], cmdSel = 0;
function carregaComandos() {
  buscandoComandos ??= vivo.comandos().then((l) => {
    todosComandos = [...LOCAIS, ...(l || []).filter((c) => !c.nome.startsWith("_") && !LOCAIS.some((x) => x.nome === c.nome) && !Object.hasOwn(ALIAS, c.nome))];
    if (comandosEl.classList.contains("on")) mostraComandos();
  }).catch(() => { todosComandos = LOCAIS; });
}
function mostraComandos() {
  const m = /^\/(\S*)$/.exec(entrada.value);
  if (!m) return fechaComandos();
  carregaComandos();
  const f = m[1].toLowerCase(), base = todosComandos || LOCAIS;
  const nota_ = (c) => { const n = c.nome.toLowerCase(); return n === f ? 2 : n.startsWith(f) ? 1 : 0; };
  cmdVis = base.filter((c) => c.nome.toLowerCase().includes(f)).sort((a, b) => nota_(b) - nota_(a)).slice(0, 80);
  if (!cmdVis.length) return fechaComandos();
  cmdSel = Math.min(cmdSel, cmdVis.length - 1);
  comandosEl.innerHTML = cmdVis.map((c, i) => `<div class="cmd${i === cmdSel ? " on" : ""}" data-i="${i}" role="option"><b>/${esc(c.nome)}</b>${c.dica ? `<i>${esc(c.dica)}</i>` : ""}<span>${esc(c.descricao)}</span></div>`).join("")
    + (todosComandos ? "" : `<div class="cmd-espera">${t("app.carregandoComandos")}</div>`);
  comandosEl.classList.add("on"); fechaPicker();
  comandosEl.querySelector(".cmd.on")?.scrollIntoView({ block: "nearest" });
}
function fechaComandos() { comandosEl.classList.remove("on"); cmdVis = []; cmdSel = 0; }
function escolheComando(c, executa) {
  if (!c) return;
  if (executa && (c.local || !c.dica)) { entrada.value = ""; fechaComandos(); envia("/" + c.nome); return; }
  entrada.value = "/" + c.nome + " "; ajustaAltura(); atualizaEnviar(); fechaComandos(); entrada.focus();
}
comandosEl.addEventListener("mousedown", (e) => { const d = e.target.closest(".cmd"); if (d) { e.preventDefault(); escolheComando(cmdVis[+d.dataset.i], true); } });
comandosEl.addEventListener("mousemove", (e) => { const d = e.target.closest(".cmd"); if (d && +d.dataset.i !== cmdSel) { cmdSel = +d.dataset.i; comandosEl.querySelectorAll(".cmd").forEach((x) => x.classList.toggle("on", x === d)); } });

// ---- attachments -------------------------------------------------------------
// Files come from the paperclip, a drop or a paste. Files on disk travel as
// their path (images are also read and shown to Claude); pasted images travel
// as their data.
let anexos = [];
const anexosEl = $("anexos");
const ehImagem = (nome) => /\.(png|jpe?g|gif|webp)$/i.test(nome);
const urlArquivo = (c) => "file:///" + encodeURI(c.replace(/\\/g, "/")).replace(/#/g, "%23").replace(/\?/g, "%3F");
function desenhaAnexos() {
  anexosEl.innerHTML = "";
  anexos.forEach((a, i) => {
    const d = document.createElement("div");
    d.className = "anexo" + (a.url ? " img" : ""); d.title = a.caminho || a.nome;
    if (a.url) { const img = document.createElement("img"); img.src = a.url; img.alt = a.nome; d.append(img); }
    else { d.innerHTML = a.tipo === "texto" ? ICONE.editar : ICONE.arquivo; const n = document.createElement("span"); n.textContent = a.nome; d.append(n); }
    if (a.tipo === "texto") { d.classList.add("colado"); d.title = t("app.cliqueEditar"); d.onclick = (e) => { if (!e.target.closest(".tira")) editaColado(a); }; }
    const x = document.createElement("button"); x.className = "tira"; x.title = t("app.remover"); x.innerHTML = ICONE.erro;
    x.onclick = () => { anexos.splice(i, 1); desenhaAnexos(); };
    d.append(x); anexosEl.append(d);
  });
  anexosEl.classList.toggle("on", anexos.length > 0); atualizaEnviar();
}
function anexaCaminho(caminho) {
  if (!caminho || anexos.some((a) => a.caminho === caminho)) return;
  const nome = caminho.split(/[\\/]/).pop();
  anexos.push({ nome, caminho, url: ehImagem(nome) ? urlArquivo(caminho) : null });
}
async function anexaArquivos(lista) {
  for (const f of lista) {
    const caminho = vivo.caminhoDe ? vivo.caminhoDe(f) : "";
    if (caminho) { anexaCaminho(caminho); continue; }
    if (!/^image\/(png|jpeg|gif|webp)$/.test(f.type)) { nota(t("app.soAnexa", { nome: f.name || t("app.esseArquivo") })); continue; }
    if (f.size > 5 * 1024 * 1024) { nota(t("app.imagemGrande")); continue; }
    const dados = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(f); });
    anexos.push({ nome: f.name || t("app.imagemColada"), dados, mime: f.type, url: URL.createObjectURL(f) });
  }
  desenhaAnexos(); entrada.focus();
}
$("clipe").onclick = async () => { for (const c of await vivo.anexar()) anexaCaminho(c); desenhaAnexos(); entrada.focus(); };
entrada.addEventListener("paste", (e) => { const l = [...(e.clipboardData?.files || [])]; if (l.length) { e.preventDefault(); anexaArquivos(l); } });
// Dropping anywhere on the window attaches; an ASCII Motion file (or a JSON
// dropped on the "Meus" tab) is imported as a background instead.
let arrastos = 0;
const temArquivos = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
const naAbaMeus = () => picker.classList.contains("open") && abaAtual === "meus";
const paraImportar = (f) => /\.asciimtn$/i.test(f.name) || (/\.json$/i.test(f.name) && naAbaMeus());
const paraFundo = (f) => naAbaMeus() && /\.(png|jpe?g|webp|gif|avif|mp4|webm|mov|m4v)$/i.test(f.name);
addEventListener("dragenter", (e) => {
  if (!temArquivos(e)) return;
  e.preventDefault(); arrastos++;
  $("soltar").querySelector("b").textContent = naAbaMeus() ? t("app.solteFundo") : t("app.solteAnexar");
  $("soltar").querySelector("span").textContent = naAbaMeus() ? t("app.solteFundoDica") : t("app.solteAnexarDica");
  document.body.classList.add("arrastando");
});
addEventListener("dragover", (e) => { if (temArquivos(e)) e.preventDefault(); });
addEventListener("dragleave", (e) => { if (temArquivos(e) && --arrastos <= 0) { arrastos = 0; document.body.classList.remove("arrastando"); } });
addEventListener("drop", (e) => {
  if (!temArquivos(e)) return;
  e.preventDefault(); arrastos = 0; document.body.classList.remove("arrastando");
  const lista = [...e.dataTransfer.files], motion = lista.filter(paraImportar), fundos = lista.filter(paraFundo);
  for (const f of motion) importaMotion(vivo.caminhoDe(f));
  if (fundos.length) adicionaFundos(fundos.map((f) => vivo.caminhoDe(f)));
  const resto = lista.filter((f) => !motion.includes(f) && !fundos.includes(f));
  if (resto.length) anexaArquivos(resto);
});
// A short note in the banner at the top.
let timerNota = null;
function nota(texto, erro = false) {
  clearTimeout(timerNota); clearTimeout(timerPrevia);
  banner.textContent = texto; banner.classList.toggle("erro", erro); banner.classList.add("on");
  timerNota = setTimeout(() => banner.classList.remove("on", "erro"), 4200);
}
$("enviar").onclick = () => (rodando ? vivo.parar() : envia());

// ---- updates ----------------------------------------------------------------------------
// A new version downloads by itself; once it is ready a small card waits at the
// foot of the sidebar (and the Clawd mentions it, once). It also goes in by
// itself the next time the app closes.
const cartaoAtualiza = Object.assign(document.createElement("div"), { className: "atualiza", hidden: true });
document.querySelector(".side-base").prepend(cartaoAtualiza);
let atualizaAvisada = "";
function mostraAtualizacao(a) {
  window.estadoAtualizacao = a;
  window.desenhaAtualizacaoPz?.(a);
  cartaoAtualiza.hidden = a.estado !== "pronta";
  if (cartaoAtualiza.hidden) return;
  cartaoAtualiza.innerHTML = `<span class="atualiza-faisca">✻</span><span class="atualiza-txt"><b>${t("app.versaoPronta", { versao: esc(a.nova) })}</b><small>${t("app.entraAoReiniciar")}</small></span><button>${t("app.reiniciar")}</button>`;
  cartaoAtualiza.querySelector("button").onclick = instalaAtualizacao;
  if (atualizaAvisada !== a.nova) { atualizaAvisada = a.nova; dispatchEvent(new CustomEvent("clawd-diz", { detail: { texto: t("app.clawdVersaoNova"), ms: 4500 } })); }
}
window.instalaAtualizacao = function instalaAtualizacao() {
  if (rodando) return nota(t("app.espereReiniciar"));
  vivo.atualizacaoInstalar();
};
vivo.atualizacao().then(mostraAtualizacao);
col.addEventListener("click", (e) => { const a = e.target.closest("a[href]"); if (a) { e.preventDefault(); vivo.link(a.href); } });

// The empty conversation: the mark breathing, a greeting for the time of
// day, and a few ways to start.
// The welcome screen: centred in the conversation area. Clawd, the greeting,
// the project it is about (click to switch), four starting points and the keys.
const SUGESTOES = [
  [t("app.sugProjetoPedido"), t("app.sugProjeto"), t("app.sugProjetoDesc"), '<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M9 12h6M9 15.5h6"/>'],
  [t("app.sugBugsPedido"), t("app.sugBugs"), t("app.sugBugsDesc"), '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>'],
  [t("app.sugTestesPedido"), t("app.sugTestes"), t("app.sugTestesDesc"), '<path d="M9 3.5v6L4.5 18a2 2 0 0 0 1.8 2.8h11.4A2 2 0 0 0 19.5 18L15 9.5v-6M7.5 3.5h9M7 14.5h10"/>'],
  ["/tema", t("app.sugTema"), t("app.sugTemaDesc"), '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'],
];
function telaInicial() {
  const h = new Date().getHours(), oi = h < 5 ? t("app.boaMadrugada") : h < 12 ? t("app.bomDia") : h < 18 ? t("app.boaTarde") : t("app.boaNoite");
  const pasta = esc($("pastaNome").textContent), n = (typeof sessoes !== "undefined" ? sessoes : []).filter((x) => x.cwd === $("pasta").title).length;
  const enviar = geral().enviar === "ctrl" ? "<kbd>Ctrl</kbd> + <kbd>Enter</kbd>" : "<kbd>Enter</kbd>";
  col.innerHTML = `<div class="boas"><div class="boas-cartao">
      <canvas class="clawd-grande" title="${t("app.clawdClique")}"></canvas>
      <div class="grande">${t("app.saudacao", { oi })}</div>
      <p class="boas-sub">${t("app.boasSub")}</p>
      <div class="boas-info"><button class="boas-pasta" title="${t("app.trocarPasta")}">${svg('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>')}<span>${pasta}</span></button><span>${n ? t("app.conversasAqui", { n }) : t("app.primeiraConversa")}</span></div>
    </div>
    <div class="sugestoes grade">${SUGESTOES.map(([p, t, d, ic]) => `<button data-p="${esc(p)}">${svg(ic)}<span><b>${t}</b><small>${d}</small></span></button>`).join("")}</div>
    <p class="boas-dica">${t("app.boasDica", { enviar })}</p>
  </div>`;
  col.querySelectorAll(".sugestoes button").forEach((b) => (b.onclick = () => envia(b.dataset.p)));
  col.querySelector(".boas-pasta").onclick = () => $("pasta").click();
}

// ---- sessions and settings --------------------------------------------------
let sessaoAtual = null, sessoes = [];
const lista = $("lista");
function marcaSessao() { lista.querySelectorAll(".item").forEach((d) => d.classList.toggle("on", d.dataset.id === sessaoAtual)); }
function grupoDe(ms) {
  const d = new Date(ms), h = new Date(); h.setHours(0, 0, 0, 0);
  const dias = (h - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5;
  return dias <= 0 ? t("app.hoje") : dias === 1 ? t("app.ontem") : dias < 7 ? t("app.ultimos7") : dias < 30 ? t("app.ultimos30") : t("app.maisAntigas");
}
// Pinned conversations stay on top; the search looks at titles and, from two
// letters on, inside the messages too (with the matching bit shown).
let fixadas = new Set();
try { fixadas = new Set(JSON.parse(localStorage.getItem("fixadas") || "[]")); } catch {}
const salvaFixadas = () => { try { localStorage.setItem("fixadas", JSON.stringify([...fixadas])); } catch {} };
let achados = new Map(), buscaPendente = null;
// Groups (folders) and colours the person gives conversations, kept in the
// window's storage. Groups come after the pinned ones, each folding open or
// shut; the rest stay grouped by date.
const guarda = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const le = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
let grupos = le("grupos", {}), coresConversa = le("coresConversa", {}), fechados = new Set(le("gruposFechados", []));
const CORES_CONVERSA = ["#e5484d", "#f5a524", "#e7c15a", "#5fb08a", "#3fb6d9", "#a78bfa", "#e58fb8"];
const grupoDaConversa = (id) => Object.keys(grupos).find((g) => grupos[g].includes(id));
function cabecalho(nome, n, dobravel) {
  const h = document.createElement(dobravel ? "button" : "div");
  h.className = "grupo" + (dobravel ? " pasta" + (fechados.has(nome) ? " fechada" : "") : "");
  h.innerHTML = dobravel ? `${svg('<path d="m9 6 6 6-6 6"/>')}<span>${esc(nome)}</span><small>${n}</small>` : esc(nome);
  if (dobravel) h.onclick = () => { fechados.has(nome) ? fechados.delete(nome) : fechados.add(nome); guarda("gruposFechados", [...fechados]); desenhaLista(); };
  lista.append(h);
}
function itemLista(s, filtro) {
  const d = document.createElement("div"), trecho = filtro && !s.titulo.toLowerCase().includes(filtro) ? achados.get(s.id) : null, cor = coresConversa[s.id];
  d.className = "item" + (fixadas.has(s.id) ? " fixa" : "") + (trecho ? " com-trecho" : ""); d.dataset.id = s.id; d.title = new Date(s.quando).toLocaleString(idiomaAtual());
  if (cor) d.style.setProperty("--cor", cor);
  d.innerHTML = `${cor ? '<i class="ponto"></i>' : ""}<span>${esc(s.titulo)}</span>${todasPastas && filtro && s.projeto ? `<em class="proj" title="${esc(s.cwd)}">${esc(s.projeto)}</em>` : ""}${trecho ? `<small>${esc(trecho)}</small>` : ""}<button class="icone mais" title="${t("app.opcoes")}">${ICONE.mais}</button>`;
  d.onclick = (e) => { if (!e.target.closest(".mais")) abreSessao(s.id, s.titulo); };
  d.querySelector(".mais").onclick = (e) => { e.stopPropagation(); menuSessao(e.currentTarget, s); };
  d.draggable = true;
  d.ondragstart = (e) => { e.dataTransfer.setData("text/conversa", s.id); d.classList.add("arrastando"); };
  d.ondragend = () => d.classList.remove("arrastando");
  lista.append(d);
}
function desenhaLista() {
  const filtro = $("busca").value.trim().toLowerCase();
  const vis = sessoes.filter((s) => !filtro || s.titulo.toLowerCase().includes(filtro) || (s.projeto || "").toLowerCase().includes(filtro) || achados.has(s.id));
  lista.innerHTML = "";
  if (!vis.length) { lista.innerHTML = `<div class="vazio-lista">${filtro ? (buscaPendente ? t("app.procurandoConversas") : t("app.nadaEncontrado")) : t("app.nenhumaConversa")}</div>`; return; }
  const usadas = new Set();
  const fix = vis.filter((s) => fixadas.has(s.id));
  if (fix.length) { cabecalho(t("app.fixadas"), fix.length, false); fix.forEach((s) => { usadas.add(s.id); itemLista(s, filtro); }); }
  for (const g of Object.keys(grupos)) {
    const deles = vis.filter((s) => grupos[g].includes(s.id) && !usadas.has(s.id));
    if (!deles.length && filtro) continue;
    cabecalho(g, deles.length, true);
    const corpo = lista.lastElementChild;
    corpo.ondragover = (e) => { if (e.dataTransfer.types.includes("text/conversa")) { e.preventDefault(); corpo.classList.add("alvo"); } };
    corpo.ondragleave = () => corpo.classList.remove("alvo");
    corpo.ondrop = (e) => { e.preventDefault(); corpo.classList.remove("alvo"); moveParaGrupo(e.dataTransfer.getData("text/conversa"), g); };
    deles.forEach((s) => usadas.add(s.id));
    if (!fechados.has(g)) deles.forEach((s) => itemLista(s, filtro));
  }
  // Every project, like the Claude app's sidebar: one section per folder,
  // the most recently active first. A search shows a flat list instead.
  const resto = vis.filter((s) => !usadas.has(s.id));
  if (todasPastas && !filtro) {
    const porProjeto = new Map();
    for (const s of resto) { const p = s.projeto || t("app.semPasta"); (porProjeto.get(p) || porProjeto.set(p, []).get(p)).push(s); }
    for (const [nome, deles] of [...porProjeto].sort((a, b) => b[1][0].quando - a[1][0].quando)) {
      const chave = "p:" + nome;
      const h = document.createElement("button");
      h.className = "grupo pasta projeto" + (fechados.has(chave) ? " fechada" : "");
      h.title = deles[0].cwd || "";
      h.innerHTML = `${svg('<path d="m9 6 6 6-6 6"/>')}<span>${esc(nome)}</span><small>${deles.length}</small>`;
      h.onclick = () => { fechados.has(chave) ? fechados.delete(chave) : fechados.add(chave); guarda("gruposFechados", [...fechados]); desenhaLista(); };
      lista.append(h);
      if (!fechados.has(chave)) deles.forEach((s) => itemLista(s, filtro));
    }
  } else {
    let grupo = null;
    for (const s of resto) {
      const g = grupoDe(s.quando);
      if (g !== grupo) { grupo = g; cabecalho(g, 0, false); }
      itemLista(s, filtro);
    }
  }
  marcaSessao();
}
function moveParaGrupo(id, g) {
  for (const k of Object.keys(grupos)) grupos[k] = grupos[k].filter((x) => x !== id);
  if (g) (grupos[g] ||= []).push(id);
  guarda("grupos", grupos); desenhaLista();
}
// The new group's name is typed right in the list (Electron has no prompt()).
function novoGrupo(id) {
  const inp = document.createElement("input");
  inp.className = "grupo-novo"; inp.placeholder = t("app.nomeGrupo"); inp.maxLength = 40;
  lista.prepend(inp); inp.focus();
  let feito = false;
  const cria = (ok) => {
    if (feito) return; feito = true; inp.onblur = null;
    const nome = inp.value.trim(); inp.remove();
    if (!ok || !nome) return;
    grupos[nome] ||= []; fechados.delete(nome);
    if (id) moveParaGrupo(id, nome); else { guarda("grupos", grupos); desenhaLista(); }
  };
  inp.onkeydown = (e) => { if (e.key === "Enter") cria(true); if (e.key === "Escape") cria(false); };
  inp.onblur = () => cria(true);
}
// The list comes from Claude Code's own session files: this folder only, or
// every project ("Todas"). It refreshes by itself when any of them changes.
let todasPastas = le("todasPastas", true), sincronizando = null;
let pedidoLista = 0;
async function carregaSessoes() {
  const b = $("sincronizar"), n = ++pedidoLista; b?.classList.add("girando");
  sincronizando = vivo.sessoes({ todas: todasPastas });
  const lista = await sincronizando;
  if (n !== pedidoLista) return;
  sessoes = lista; b?.classList.remove("girando");
  if (document.activeElement?.closest?.("#lista input")) return;
  desenhaLista();
  $("contaConversas").textContent = sessoes.length;
}
const sessaoPorId = (id) => sessoes.find((x) => x.id === id);
function mostraEscopo() {
  document.querySelectorAll(".escopo [data-todas]").forEach((b) => b.classList.toggle("on", (b.dataset.todas === "1") === todasPastas));
  document.body.classList.toggle("todas-pastas", todasPastas);
}
document.querySelectorAll(".escopo [data-todas]").forEach((b) => (b.onclick = () => { todasPastas = b.dataset.todas === "1"; guarda("todasPastas", todasPastas); mostraEscopo(); achados = new Map(); carregaSessoes(); }));
$("sincronizar").onclick = () => { carregaSessoes(); nota(t("app.sincronizadas")); };
let timerSync = null;
vivo.aoEvento((ev) => { if (ev.tipo === "sessoes_mudaram") { clearTimeout(timerSync); timerSync = setTimeout(carregaSessoes, 300); } });
addEventListener("focus", () => carregaSessoes());
mostraEscopo();
$("busca").addEventListener("input", () => {
  desenhaLista();
  clearTimeout(buscaPendente);
  const termo = $("busca").value.trim();
  if (termo.length < 2) { achados = new Map(); buscaPendente = null; return; }
  buscaPendente = setTimeout(async () => {
    const r = await vivo.buscar(termo, todasPastas);
    if ($("busca").value.trim() !== termo) return;
    achados = new Map(r.map((x) => [x.id, x.trecho])); buscaPendente = null; desenhaLista();
  }, 280);
});

function menuSessao(ancora, s) {
  const r = ancora.getBoundingClientRect();
  menu.innerHTML = `<button data-a="fixar">${ICONE.pino}${fixadas.has(s.id) ? t("app.desafixar") : t("app.fixarTopo")}</button><button data-a="renomear">${ICONE.lapis}${t("app.renomear")}</button>`
    + `<button data-a="janela">${ICONE.janela}${t("app.abrirJanela")}</button><button data-a="duplicar">${ICONE.duplicar}${t("app.duplicar")}</button><button data-a="exportar">${ICONE.exportar}${t("app.exportar")}</button><button data-a="apagar" class="perigo">${ICONE.lixo}${t("app.apagar")}</button>`;
  const gAtual = grupoDaConversa(s.id);
  menu.insertAdjacentHTML("beforeend", `<div class="menu-sep"></div><div class="menu-cores">${CORES_CONVERSA.map((c) => `<button class="cor${coresConversa[s.id] === c ? " on" : ""}" data-cor="${c}" style="--cor:${c}" title="${t("app.cor")}"></button>`).join("")}<button class="cor sem" data-cor="" title="${t("app.semCor")}"></button></div>`
    + `<div class="menu-sep"></div><div class="menu-rotulo">${t("app.grupo")}</div>${Object.keys(grupos).map((g) => `<button data-grupo="${esc(g)}"${g === gAtual ? ' class="on"' : ""}>${ICONE.pasta}${esc(g)}</button>`).join("")}`
    + `<button data-a="novoGrupo">${ICONE.mais}${t("app.novoGrupo")}</button>${gAtual ? `<button data-a="semGrupo">${ICONE.erro}${t("app.tirarGrupo")}</button>` : ""}`);
  menu.style.left = r.left + "px"; menu.style.top = "0px"; menu.classList.add("on");
  menu.style.top = Math.max(8, Math.min(r.bottom + 4, innerHeight - menu.offsetHeight - 8)) + "px";
  menu.querySelectorAll("[data-cor]").forEach((b) => (b.onclick = () => { if (b.dataset.cor) coresConversa[s.id] = b.dataset.cor; else delete coresConversa[s.id]; guarda("coresConversa", coresConversa); fechaMenu(); desenhaLista(); }));
  menu.querySelectorAll("[data-grupo]").forEach((b) => (b.onclick = () => { fechaMenu(); moveParaGrupo(s.id, b.dataset.grupo); }));
  menu.querySelector('[data-a="novoGrupo"]').onclick = () => { fechaMenu(); novoGrupo(s.id); };
  menu.querySelector('[data-a="semGrupo"]')?.addEventListener("click", () => { fechaMenu(); moveParaGrupo(s.id, null); });
  menu.querySelector('[data-a="fixar"]').onclick = () => { fechaMenu(); fixadas.has(s.id) ? fixadas.delete(s.id) : fixadas.add(s.id); salvaFixadas(); desenhaLista(); };
  menu.querySelector('[data-a="renomear"]').onclick = () => { fechaMenu(); renomeia(s); };
  menu.querySelector('[data-a="janela"]').onclick = () => { fechaMenu(); vivo.janelaNova(s.id); };
  menu.querySelector('[data-a="duplicar"]').onclick = async () => {
    fechaMenu(); if (rodando) return;
    const r2 = await vivo.ramificar(s.id, null, `${s.titulo}${t("app.sufixoCopia")}`, s.cwd);
    if (r2) { if (r2.cwd && r2.cwd !== $("pasta").title) { mostraPasta(r2.cwd); todosComandos = buscandoComandos = null; } await abreSessao(r2.id, r2.titulo); carregaSessoes(); }
  };
  menu.querySelector('[data-a="exportar"]').onclick = async () => { fechaMenu(); const f = await vivo.exportar(s.id, s.titulo, s.cwd); if (f?.erro) nota(t("app.naoExportou", { erro: f.erro }), true); else if (f) nota(t("app.exportada", { arquivo: f })); };
  const apagar = menu.querySelector('[data-a="apagar"]');
  apagar.onclick = async () => {
    if (!apagar.dataset.certeza) { apagar.dataset.certeza = "1"; apagar.innerHTML = `${ICONE.lixo}${t("app.confirmarApagar")}`; return; }
    fechaMenu();
    if (await vivo.apagar(s.id, s.cwd)) { if (sessaoAtual === s.id) novaConversa(); carregaSessoes(); }
  };
}
const fechaMenu = () => menu.classList.remove("on");
addEventListener("pointerdown", (e) => { if (!e.target.closest(".menu, .mais")) fechaMenu(); });
function renomeia(s) {
  const d = lista.querySelector(`.item[data-id="${s.id}"]`); if (!d) return;
  const span = d.querySelector("span"), inp = document.createElement("input");
  inp.value = s.titulo; span.replaceWith(inp); inp.focus(); inp.select();
  let feito = false;
  const salva = async (ok) => {
    if (feito) return; feito = true; inp.onblur = null;
    const novo = inp.value.trim(), el = document.createElement("span");
    el.textContent = ok && novo ? novo : s.titulo; inp.replaceWith(el);
    if (ok && novo && novo !== s.titulo) { await vivo.renomear(s.id, novo, s.cwd); if (s.id === sessaoAtual) $("titulo").textContent = novo; }
    carregaSessoes();
  };
  inp.onkeydown = (e) => { if (e.key === "Enter") salva(true); if (e.key === "Escape") salva(false); };
  inp.onblur = () => salva(true);
  inp.onclick = (e) => e.stopPropagation();
}

async function abreSessao(id, titulo) {
  if (rodando) return;
  const pastaAntes = $("pasta").title, alvo = sessaoPorId(id);
  const hist = await vivo.abrirSessao(id, alvo?.cwd);
  if (!hist) return;
  if (alvo?.cwd && alvo.cwd !== pastaAntes) { mostraPasta(alvo.cwd); todosComandos = buscandoComandos = null; }
  window.transicaoDither?.();
  sessaoAtual = id; $("titulo").textContent = titulo;
  col.innerHTML = ""; ferramentas.clear(); segmento = null; bufferTexto = ""; tiraPensando(); escondePlano(); $("medidor").hidden = true;
  for (const m of hist) {
    if (m.papel === "eu") { meu(m.texto, [], m.imagens || 0, ""); if (m.uuid) [...col.querySelectorAll(".msg.eu")].pop().dataset.uuid = m.uuid; }
    else if (m.papel === "claude") { const el = bloco("msg claude", `<div class="corpo">${md(m.texto)}</div>`); decora(el); if (m.uuid) el.dataset.uuid = m.uuid; acoesResposta(el, m.texto, ""); window.camadas?.(el); }
    else ferramenta(crypto.randomUUID(), m.nome, m.entrada, "ok");
  }
  aviso(t("app.retomada"));
  requestAnimationFrame(() => (scroll.scrollTop = scroll.scrollHeight)); marcaSessao();
}
async function novaConversa() {
  if (rodando || !(await vivo.nova())) return;
  window.transicaoDither?.();
  sessaoAtual = null; $("titulo").textContent = t("app.novaConversa");
  ferramentas.clear(); segmento = null; bufferTexto = ""; tiraPensando(); telaInicial(); marcaSessao(); escondePlano(); $("medidor").hidden = true; entrada.focus();
}
$("nova").onclick = novaConversa;
$("pasta").onclick = async () => { if (rodando) { nota(t("app.espereTrocarPasta")); return; } const p = await vivo.pasta(); if (p) { mostraPasta(p); novaConversa(); carregaSessoes(); todosComandos = buscandoComandos = null; } };
const mostraPasta = (p) => { $("pastaNome").textContent = p.split(/[\\/]/).pop() || p; $("pasta").title = p; const b = col.querySelector(".boas b"); if (b) b.textContent = $("pastaNome").textContent; };
$("modelo").onchange = () => vivo.config({ model: $("modelo").value });
$("modo").onchange = () => vivo.config({ modo: $("modo").value });
$("esforco").onchange = () => vivo.config({ esforco: $("esforco").value });

// ---- composer choices ------------------------------------------------------------
// Permissions and model open a small menu that explains each option; effort is
// a slider from "padrão" to "máximo". The native selects stay (hidden) as the
// source of the values.
const ESCOLHAS = {
  modo: { titulo: t("app.permissoes"), itens: {
    default: t("app.modoDefault"),
    acceptEdits: t("app.modoAcceptEdits"),
    plan: t("app.modoPlan"),
    auto: t("app.modoAuto"),
  } },
  modelo: { titulo: t("app.modelo"), itens: {
    "": t("app.modeloPadrao"),
    "claude-opus-5-5": t("app.modeloOpus"),
    "claude-sonnet-5-5": t("app.modeloSonnet"),
    "claude-haiku-5-5": t("app.modeloHaiku"),
    "claude-fable-5-1": "Fable 5.1.",
  } },
};
const ESFORCO = [
  ["", t("app.padrao"), t("app.esfPadrao")],
  ["low", t("app.esfBaixo"), t("app.esfBaixoDesc")],
  ["medium", t("app.esfMedio"), t("app.esfMedioDesc")],
  ["high", t("app.esfAlto"), t("app.esfAltoDesc")],
  ["xhigh", t("app.esfMuitoAlto"), t("app.esfMuitoAltoDesc")],
  ["max", t("app.esfMaximo"), t("app.esfMaximoDesc")],
];
const caixaSelects = document.createElement("div");
caixaSelects.hidden = true; document.body.append(caixaSelects);
const seta = svg('<path d="m8 10 4 4 4-4"/>');
let popAberto = null;
const fechaEscolhas = () => { popAberto?.classList.remove("on"); popAberto?.previousElementSibling?.setAttribute("aria-expanded", "false"); popAberto = null; };
function abreEscolha(pop) {
  const ja = popAberto === pop; fechaEscolhas(); if (ja) return;
  pop.classList.add("on"); pop.previousElementSibling.setAttribute("aria-expanded", "true"); popAberto = pop;
}
const escolhas = [];
function montaEscolha(id, desenhaPop, rotulo, iconeDe) {
  const sel = $(id), velho = sel.closest(".chip"), icone = velho.querySelector("svg").outerHTML;
  const caixa = document.createElement("div"), btn = document.createElement("button"), pop = document.createElement("div");
  caixa.className = "escolha"; btn.className = "chip"; btn.type = "button"; btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false");
  pop.className = "escolha-pop"; pop.setAttribute("role", "dialog");
  caixa.append(btn, pop); velho.replaceWith(caixa); caixaSelects.append(sel);
  const escolhe = (v) => { sel.value = v; sel.dispatchEvent(new Event("change")); atualiza(); };
  const atualiza = () => { btn.innerHTML = `${iconeDe ? iconeDe(sel) : icone}<span>${esc(rotulo(sel))}</span>${seta}`; btn.title = ESCOLHAS[id]?.titulo || t("app.esforco"); desenhaPop(pop, sel, escolhe); };
  btn.onclick = (e) => { e.stopPropagation(); abreEscolha(pop); };
  pop.onclick = (e) => e.stopPropagation();
  escolhas.push(atualiza); atualiza();
}
// Each permission mode has its own icon, on the chip and in the menu.
const ICONES_MODO = {
  default: svg('<path d="M12 3.5 4.5 7v5c0 4.2 3.2 7.6 7.5 8.5 4.3-.9 7.5-4.3 7.5-8.5V7z"/>'),
  acceptEdits: svg('<path d="M14.5 5.5 18.5 9.5 9 19H5v-4z"/><path d="m13 7 4 4"/>'),
  plan: svg('<rect x="4.5" y="4" width="15" height="16.5" rx="2"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4"/>'),
  auto: svg('<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.6 2.6M15.4 15.4 18 18M6 18l2.6-2.6M15.4 8.6 18 6"/>'),
};
const menuEscolha = (id) => (pop, sel, escolhe) => {
  const info = ESCOLHAS[id], icones = id === "modo" ? ICONES_MODO : null;
  pop.innerHTML = `<div class="pop-titulo">${info.titulo}</div>` + [...sel.options].map((o) => `<button class="opcao${o.value === sel.value ? " on" : ""}${icones ? " com-icone" : ""}" data-v="${esc(o.value)}">${icones ? `<span class="op-icone">${icones[o.value] || ""}</span>` : ""}<b>${esc(o.textContent)}</b><small>${esc(info.itens[o.value] || "")}</small>${ICONE.ok}</button>`).join("");
  pop.querySelectorAll(".opcao").forEach((b) => (b.onclick = () => { escolhe(b.dataset.v); fechaEscolhas(); }));
};
montaEscolha("modo", menuEscolha("modo"), (s) => s.selectedOptions[0]?.textContent || "", (s) => ICONES_MODO[s.value] || ICONES_MODO.default);
montaEscolha("modelo", menuEscolha("modelo"), (s) => s.selectedOptions[0]?.textContent || "");
// Effort: "Auto" or five levels drawn as columns of tiles that grow, each
// with one of Claude's spinner glyphs. Hovering previews a level, clicking
// picks it, arrows move it while open. Clawd reacts to the level: dozing at
// low, steady in the middle, typing flat out with sparks at max. Two small
// tile meters show the trade: speed against depth.
const GLIFO_ESF = ["·", "✢", "✳", "✶", "✻", "✽"];
const TROCA = [[0, 0], [5, 1], [4, 2], [3, 3], [2, 4], [1, 5]];   // [speed, depth] per level
const medidor = (n, total = 5) => Array.from({ length: total }, (_, k) => `<i class="${k < n ? "on" : ""}"></i>`).join("");
let esfVer = null;
montaEscolha("esforco", (pop, sel, escolhe) => {
  const atual = Math.max(0, ESFORCO.findIndex(([v]) => v === sel.value));
  pop.classList.add("esf");
  pop.innerHTML = `<div class="esf-cab"><canvas class="esf-clawd"></canvas><div><small>${t("app.esforco")}</small><b class="esf-nome"></b></div><span class="esf-glifo"></span></div>
    <div class="esf-escala"><button class="esf-auto" data-k="0"><span>Auto</span></button><div class="esf-colunas">${ESFORCO.slice(1).map((_, n) => `<button class="esf-col" data-k="${n + 1}" aria-label="${ESFORCO[n + 1][1]}">${Array.from({ length: n + 1 }, () => "<i></i>").join("")}<em>${GLIFO_ESF[n + 1]}</em></button>`).join("")}</div></div>
    <p class="esf-desc"></p>
    <div class="esf-troca"><span>${t("app.rapidez")}</span><span class="esf-med" data-m="0"></span><span>${t("app.profundidade")}</span><span class="esf-med" data-m="1"></span></div>`;
  const mostra = (k, previa) => {
    pop.querySelector(".esf-nome").textContent = ESFORCO[k][1];
    pop.querySelector(".esf-glifo").textContent = k ? GLIFO_ESF[k] : "";
    pop.querySelector(".esf-desc").textContent = ESFORCO[k][2];
    pop.querySelectorAll(".esf-col").forEach((c) => { const n = +c.dataset.k; c.classList.toggle("acesa", k > 0 && n <= k); c.classList.toggle("sel", n === k); });
    pop.querySelector(".esf-auto").classList.toggle("sel", k === 0);
    pop.querySelectorAll(".esf-med").forEach((m) => (m.innerHTML = k ? medidor(TROCA[k][+m.dataset.m]) : `<em>${t("app.modeloDecide")}</em>`));
    pop.classList.toggle("previa", !!previa);
    pop.dataset.nivel = k;
  };
  mostra(atual);
  pop.querySelectorAll("[data-k]").forEach((b) => {
    b.onmouseenter = () => mostra(+b.dataset.k, +b.dataset.k !== atual);
    b.onclick = () => escolhe(ESFORCO[+b.dataset.k][0]);
  });
  pop.querySelector(".esf-escala").onmouseleave = () => mostra(atual);
  esfVer = { pop, atual, escolhe };
  animaClawdEsf(pop);
}, (s) => {
  const i = Math.max(0, ESFORCO.findIndex(([v]) => v === s.value));
  return i ? ESFORCO[i][1] : "Auto";
}, (s) => {
  const i = Math.max(0, ESFORCO.findIndex(([v]) => v === s.value));
  return `<span class="esf-mini${i ? "" : " auto"}">${Array.from({ length: 5 }, (_, k) => `<i class="${k < i ? "on" : ""}"></i>`).join("")}</span>`;
});
addEventListener("keydown", (e) => {
  if (!esfVer || popAberto !== esfVer.pop || !/^Arrow(Left|Right)$/.test(e.key)) return;
  e.preventDefault();
  const k = Math.max(0, Math.min(ESFORCO.length - 1, esfVer.atual + (e.key === "ArrowRight" ? 1 : -1)));
  esfVer.escolhe(ESFORCO[k][0]); esfVer.pop.classList.add("on"); popAberto = esfVer.pop;
});
// Clawd in the effort card, animated only while the card is open.
function animaClawdEsf(pop) {
  const cv = pop.querySelector(".esf-clawd"), PW = 3, PH = 6, M = 8, W = CLAWD.W * PW + M * 2, H = CLAWD.H * PH + M * 2, dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
  const ctx = cv.getContext("2d");
  const quadro = (ms) => {
    if (!cv.isConnected) return;
    requestAnimationFrame(quadro);
    if (!pop.classList.contains("on")) return;
    const k = +pop.dataset.nivel || 0, t = ms / 1000, cor = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#d77757";
    const ritmo = [1.6, 0.9, 1.6, 3, 5, 8][k];
    let dy = Math.sin(t * ritmo * 2) * (k === 1 ? 0.6 : 1 + k * 0.25), dx = k === 5 ? Math.sin(t * 40) * 0.6 : 0;
    const digita = k >= 4, braco = digita ? [(Math.floor(t * ritmo * 2) % 2) * 0.5, ((Math.floor(t * ritmo * 2) + 1) % 2) * 0.5] : [0, 0];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    desenhaClawd(ctx, { x: M + dx, y: M + dy, pw: PW, ph: PH, cor, fechado: k === 1 && (t % 3) < 2.4, braco, olhar: [k >= 3 ? 1 : 0, 0], pernas: digita ? [0, (Math.floor(t * 8) % 2) * 2, 0, ((Math.floor(t * 8) + 1) % 2) * 2] : [0, 0, 0, 0] });
    if (k === 5) { ctx.fillStyle = cor; ctx.font = "9px sans-serif"; for (let n = 0; n < 3; n++) { const f = (t * 1.6 + n / 3) % 1; ctx.globalAlpha = 1 - f; ctx.fillText("✻", M + 4 + n * 18 + Math.sin(f * 6 + n) * 3, M - 1 - f * 8); } ctx.globalAlpha = 1; }
    if (k === 1) { ctx.fillStyle = cor; ctx.globalAlpha = 0.7; ctx.font = "8px sans-serif"; ctx.fillText("z", W - M + Math.sin(t) * 2, M - 1 - (t % 2) * 3); ctx.globalAlpha = 1; }
  };
  requestAnimationFrame(quadro);
}
const atualizaEscolhas = () => escolhas.forEach((f) => f());
addEventListener("pointerdown", (e) => { if (popAberto && !e.target.closest(".escolha")) fechaEscolhas(); });
$("temasBtn").onclick = () => (picker.classList.contains("open") ? fechaPicker() : abrePicker());
const recolhe = (v) => { document.body.classList.toggle("recolhido", v); try { localStorage.setItem("recolhido", v ? "1" : ""); } catch {} };
$("recolher").onclick = () => recolhe(true);
$("expandir").onclick = () => recolhe(false);
addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "n") { e.preventDefault(); vivo.janelaNova(); return; }
  if (e.ctrlKey && e.key.toLowerCase() === "n") { e.preventDefault(); novaConversa(); }
  if (e.ctrlKey && e.key.toLowerCase() === "b") { e.preventDefault(); recolhe(!document.body.classList.contains("recolhido")); }
  if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); pulaPrompt(e.key === "ArrowUp" ? -1 : 1); }
  if (e.ctrlKey && e.key === "/") { e.preventDefault(); creditos.classList.contains("on") ? fechaCreditos() : abreAtalhos(); }
  if (e.ctrlKey && e.key.toLowerCase() === "k") { e.preventDefault(); recolhe(false); $("busca").focus(); $("busca").select(); }
  if (e.key === "Escape") { fechaPicker(); fechaMenu(); fechaComandos(); fechaEscolhas(); fechaCreditos(); fechaPersonal(); somPop.classList.remove("on"); }
});

// ---- wallpaper and themes ---------------------------------------------------
const OPT_BIG = { cw: 14, ch: 20, ss: 3 };
const big = Renderer($("bg"), OPT_BIG);
const t0 = performance.now(), agora = () => (performance.now() - t0) / 1000;
let atual = -1, aplicado = -1, raw = null, mouse = null, ultimo = performance.now(), ultimaOnda = null, timerPrevia = null;
const fit = () => { OPT_BIG.dpr = Math.min(window.desempenho?.dpr ?? 1.5, devicePixelRatio || 1); big.resize(innerWidth, innerHeight); };
// a new performance profile: engine resolution and the web wallpaper's scale
window.mudouDesempenho = () => {
  fit();
  const f = $("midia").querySelector("iframe.midia-el");
  if (f) { f.style.setProperty("--escala", window.desempenho.web); f.src = f.src; }
};
// nothing to show while the window is hidden: videos pause (rAF already stops)
document.addEventListener("visibilitychange", () => $("midia").querySelectorAll("video").forEach((v) => (document.hidden ? v.pause() : v.play().catch(() => {}))));
addEventListener("resize", fit); fit();
const idx = (id) => THEMES.findIndex((t) => t.id === id);
const nomeTema = (id) => THEMES[idx(id)]?.name || id;

// Every background has a key: "" (none), a built-in theme id, "magia:<slug>"
// for an ASCII Magic piece or "motion:<id>" for an imported animation. The
// built-in themes draw on the engine's canvas; the others on the art canvas.
let exibida = "", aplicada = "", arteAtual = null, nomeExibido = "", somExibido = null;
const arteOk = new Promise((r) => (window.Arte ? r() : addEventListener("arte-pronta", r, { once: true })));

function mostra(i) {
  if (i === atual && !arteAtual) return;
  if (arteAtual) { arteAtual = null; Arte.parar(); tiraMidia(); document.body.classList.remove("arte"); }
  // (a canvas with no size yet — window still opening — has nothing to blend)
  if (atual >= 0 && i >= 0 && big.W > 0 && $("bg").width > 0) { try { big.transicao(mouse ? mouse.x : big.W / 2, mouse ? mouse.y : big.H / 2, agora()); } catch {} }
  atual = i; big.reset();
  const claro = i >= 0 && !!THEMES[i].light;
  exibida = i >= 0 ? THEMES[i].id : ""; nomeExibido = i >= 0 ? THEMES[i].name : ""; somExibido = i >= 0 ? THEMES[i].id : null;
  document.body.classList.toggle("themed", i >= 0);
  document.body.classList.toggle("light", claro); document.body.dataset.claro = claro ? "1" : "";
  vivo.barra(claro); window.forcaModo?.();
  Som.tema(somExibido);
  if (typeof mostraSom === "function") mostraSom();
  marcaExibida();
}

// The ASCII Magic pieces, from the generated index, and what the app adds:
// Portuguese category names, which categories fill the window edge to edge,
// and which built-in ambience plays under each.
const PECAS = new Map((window.MAGIA?.pecas || []).map((p) => [p[0], { slug: p[0], nome: p[1], cat: p[2], nota: p[3], tags: p[4], quadrada: !!p[7] }]));
const CAT_PT = { landscapes: t("app.cat.landscapes"), screens: t("app.cat.screens"), "live-data": t("app.cat.live-data"), explainers: t("app.cat.explainers"), lettering: t("app.cat.lettering"), solids: t("app.cat.solids"), cosmos: t("app.cat.cosmos"),
  "motion-lab": t("app.cat.motion-lab"), weather: t("app.cat.weather"), animals: t("app.cat.animals"), things: t("app.cat.things"), algorithms: t("app.cat.algorithms"), demoscene: t("app.cat.demoscene"), arcade: t("app.cat.arcade"), frames: t("app.cat.frames"),
  occasions: t("app.cat.occasions"), cities: t("app.cat.cities"), mascots: t("app.cat.mascots"), "empty-states": t("app.cat.empty-states"), retro: t("app.cat.retro"), science: t("app.cat.science"), music: t("app.cat.music"), food: t("app.cat.food"), india: t("app.cat.india") };
const COBRE = new Set(["landscapes", "cities", "cosmos", "weather", "demoscene", "algorithms", "motion-lab", "india"]);
const SOM_CAT = { landscapes: "moonlit", cities: "chuva", cosmos: "galaxia", weather: "chuva", animals: "koi", demoscene: "arcade", arcade: "arcade", retro: "arcade", algorithms: "codigo",
  screens: "codigo", "live-data": "codigo", explainers: "clouds", "motion-lab": "aurora", solids: "aurora", music: "sakura", india: "sakura", food: "lareira", occasions: "fireflies", science: "galaxia" };
const motions = new Map();
const claroHex = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return false; const n = parseInt(m[1], 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 > 0.6; };
async function infoArte(chave) {
  const k = chave.indexOf(":"), tipo = chave.slice(0, k), id = chave.slice(k + 1);
  if (tipo === "magia") {
    const p = PECAS.get(id); if (!p) return null;
    return { tipo, slug: id, nome: p.nome, sub: t("app.subBiblioteca", { cat: CAT_PT[p.cat] || p.cat }), cobre: COBRE.has(p.cat) || p.quadrada, som: SOM_CAT[p.cat] || "clouds", claro: false };
  }
  if (tipo === "motion") {
    const anim = motions.get(id) || (await vivo.motionLer(id)); if (!anim) return null;
    motions.set(id, anim);
    return { tipo, anim, nome: anim.nome, sub: t("app.subAnimacao", { n: anim.quadros.length }), som: null, claro: claroHex(anim.fundo) };
  }
  if (tipo === "midia") {
    const m = (await fundosPessoais()).find((x) => x.id === id); if (!m) return null;
    const video = VIDEO.test(m.ext), web = m.ext === "web";
    return { tipo, url: m.url, video, web, nome: m.nome, sub: t("app.subFundo", { tipo: web ? "Wallpaper Engine" : video ? t("app.video") : m.ext === "gif" ? "GIF" : t("app.imagem") }), som: null, claro: false };
  }
  return null;
}
// Images, GIFs and videos the person added, on a layer of their own behind
// the app. Fit, dimming and blur come from the Personalizar panel.
const VIDEO = /^(mp4|webm|mov|m4v)$/;
let cacheFundos = null;
const fundosPessoais = async (novo) => (!cacheFundos || novo ? (cacheFundos = await vivo.pessoalLista("fundos")) : cacheFundos);
function mostraMidia(info) {
  const camada = $("midia"), el = document.createElement(info.web ? "iframe" : info.video ? "video" : "img");
  // a web wallpaper is someone else's page: it runs on its own origin
  // (claudinho-we://<id>), never the app's, so it keeps its own storage but
  // can't reach the app, the other wallpapers or the Claude bridge. A page a
  // little wider than the window would show its own scrollbars: never.
  if (info.web) { el.setAttribute("sandbox", "allow-scripts allow-same-origin"); el.setAttribute("scrolling", "no"); el.tabIndex = -1; el.setAttribute("aria-hidden", "true"); el.style.setProperty("--escala", window.desempenho?.web ?? 0.8); }
  // web wallpapers size their canvas once, as they load: the frame must be
  // laid out at full size before it gets its address
  else el.src = info.url;
  if (info.video) { el.autoplay = true; el.loop = true; el.muted = !visualAtual().fundo?.somVideo; el.playsInline = true; el.play?.().catch(() => {}); }
  else el.alt = "";
  el.className = "midia-el";
  const velhos = [...camada.children];
  camada.append(el);
  if (info.web) { void el.offsetWidth; el.src = info.url; }
  requestAnimationFrame(() => { el.classList.add("on"); setTimeout(() => velhos.forEach((v) => { v.pause?.(); v.remove(); }), 900); });
}
function tiraMidia() {
  document.body.classList.remove("midia");
  const camada = $("midia");
  setTimeout(() => { if (!document.body.classList.contains("midia")) [...camada.children].forEach((v) => { v.pause?.(); v.remove(); }); }, 900);
}
async function mostraArte(chave) {
  if (chave === arteAtual) return true;
  const info = await infoArte(chave);
  if (!info) return false;
  await arteOk;
  if (atual >= 0) mostra(-1);
  arteAtual = chave; exibida = chave; nomeExibido = info.nome; somExibido = info.som;
  if (info.tipo === "midia") { Arte.parar(); mostraMidia(info); document.body.classList.add("midia"); document.body.classList.toggle("midia-movel", !!(info.video || info.web)); }
  else { document.body.classList.remove("midia", "midia-movel"); tiraMidia(); if (info.tipo === "magia") await Arte.magia(info.slug, { cobre: info.cobre }); else Arte.motion(info.anim); }
  document.body.classList.add("themed", "arte"); document.body.classList.toggle("light", info.claro); document.body.dataset.claro = info.claro ? "1" : "";
  vivo.barra(info.claro); window.forcaModo?.(); Som.tema(info.som); mostraSom(); marcaExibida();
  return true;
}
const mostraChave = (chave) => (chave.includes(":") ? mostraArte(chave) : (mostra(idx(chave)), Promise.resolve(true)));

function marcaExibida() {
  document.querySelectorAll(".tc, .bc").forEach((el) => el.classList.toggle("on", el.dataset.chave === exibida));
}
function marcaAplicada() {
  document.querySelectorAll(".card .btn.aplicar").forEach((b) => { const on = b.dataset.chave === aplicada; b.classList.toggle("feito", on); b.classList.toggle("forte", !on); b.textContent = on ? t("app.aplicado") : t("app.aplicar"); });
}
async function aplicaChave(chave) {
  clearTimeout(timerPrevia); banner.classList.remove("on");
  if (!(await mostraChave(chave))) { nota(t("app.fundoSumiu"), true); return; }
  aplicada = chave; aplicado = chave.includes(":") ? -1 : idx(chave);
  $("temaNome").textContent = $("temaNome").title = nomeExibido || t("app.padrao");
  marcaAplicada();
  try { localStorage.setItem("tema", chave); } catch {}
}
const aplica = (i) => aplicaChave(i >= 0 ? THEMES[i].id : "");
async function previaChave(chave) {
  clearTimeout(timerPrevia); clearTimeout(timerNota);
  if (!(await mostraChave(chave))) return;
  let n = 5;
  const tick = () => {
    banner.textContent = t("app.previaBanner", { nome: nomeExibido, n }); banner.classList.add("on");
    if (n-- <= 0) { banner.classList.remove("on"); mostraChave(aplicada); return; }
    timerPrevia = setTimeout(tick, 1000);
  };
  tick();
}
const previa = (i) => previaChave(THEMES[i].id);

const miniaturas = [];
function mini(i, w = 160, h = 100) {
  const cv = document.createElement("canvas"), r = Renderer(cv, { cw: 5, ch: 7, ss: 2, dpr: 2, k: Math.min(w, h) / 380 });
  r.resize(w, h); miniaturas.push({ r, i, cv }); return cv;
}
// A card in the conversation: a live thumbnail, Aplicar and Prévia.
function cartaoBase(el, chave, nome, sub, tela) {
  const c = document.createElement("div");
  c.className = "card"; c.append(tela);
  const info = document.createElement("div");
  info.innerHTML = `<b>${esc(nome)}</b><small>${esc(sub)}</small>`;
  const ap = document.createElement("button"), pv = document.createElement("button");
  ap.className = "btn aplicar"; ap.dataset.chave = chave;
  pv.className = "btn"; pv.textContent = t("app.previa");
  ap.onclick = () => { aplicaChave(chave); Som.clique(somExibido); };
  pv.onclick = () => previaChave(chave);
  info.append(ap, pv); c.append(info); el.append(c); marcaAplicada(); desce();
}
function cartao(el, i) { cartaoBase(el, THEMES[i].id, THEMES[i].name, t("app.temaClaudinho"), mini(i, 216, 136)); }
async function cartaoArte(el, chave) {
  const info = await infoArte(chave);
  if (!info) { el.remove(); return; }
  const cv = document.createElement("canvas");
  cartaoBase(el, chave, info.nome, info.sub, cv);
  await arteOk;
  requestAnimationFrame(() => (info.tipo === "magia" ? Arte.vivaMagia(info.slug, cv, { cobre: info.cobre }) : Arte.miniMotion(info.anim, cv)));
}
{
  const cards = $("cards"), none = document.createElement("div");
  none.className = "tc"; none.dataset.chave = ""; none.innerHTML = `<div class="none">∅</div><p>${t("app.padrao")}</p>`;
  none.onclick = () => { aplica(-1); fechaPicker(); };
  cards.append(none);
  THEMES.forEach((th, i) => {
    const d = document.createElement("div"), p = document.createElement("p");
    d.className = "tc"; d.dataset.chave = th.id; p.textContent = th.name;
    d.append(mini(i), p); d.onclick = () => { aplica(i); Som.clique(th.id); fechaPicker(); };
    cards.append(d);
  });
}

// ---- picker: Temas, Biblioteca, Meus ------------------------------------------
let abaAtual = "claudinho";
function abreAba(aba) {
  abaAtual = aba;
  picker.querySelectorAll(".aba").forEach((b) => b.classList.toggle("on", b.dataset.aba === aba));
  picker.querySelectorAll(".painel").forEach((p) => p.classList.toggle("on", p.dataset.aba === aba));
  if (aba === "biblioteca" && !bibGrade.childElementCount) filtraBib();
  if (aba === "meus") carregaMeus();
}
picker.querySelectorAll(".aba").forEach((b) => (b.onclick = () => abreAba(b.dataset.aba)));
function abrePicker(aba, busca) {
  picker.classList.add("open"); fechaComandos();
  if (busca) { $("bibBusca").value = busca; bibGrade.innerHTML = ""; }
  abreAba(aba || abaAtual);
  if (aba === "biblioteca") setTimeout(() => $("bibBusca").focus(), 50);
}
function fechaPicker() { picker.classList.remove("open"); }

// The library: category chips, a search, and a grid that grows as it scrolls.
// Thumbnails draw when they come into view and play while hovered.
const bibGrade = $("bibGrade");
let catBib = "", resultadosBib = [], mostradosBib = 0;
$("bibN").textContent = PECAS.size;
{
  const conta = {};
  for (const p of PECAS.values()) conta[p.cat] = (conta[p.cat] || 0) + 1;
  const chips = [["", t("app.todas"), PECAS.size], ...(window.MAGIA?.cats || []).map(([id]) => [id, CAT_PT[id] || id, conta[id] || 0])];
  $("bibCats").innerHTML = chips.map(([id, nome, n]) => `<button class="cat${id === "" ? " on" : ""}" data-cat="${id}">${esc(nome)} <small>${n}</small></button>`).join("");
  $("bibCats").onclick = (e) => {
    const b = e.target.closest(".cat"); if (!b) return;
    catBib = b.dataset.cat; $("bibCats").querySelectorAll(".cat").forEach((x) => x.classList.toggle("on", x === b)); filtraBib();
  };
}
let timerBusca = null;
$("bibBusca").addEventListener("input", () => { clearTimeout(timerBusca); timerBusca = setTimeout(filtraBib, 160); });
$("bibBusca").addEventListener("keydown", (e) => { if (e.key === "Escape") fechaPicker(); });
function filtraBib() {
  // Each word matches the start of a word (so "cat" finds cats, not "location").
  const termos = $("bibBusca").value.toLowerCase().split(/\s+/).filter(Boolean).map((t) => new RegExp("(^|[^a-z0-9])" + t.replace(/[^a-z0-9à-ú-]/g, "")));
  resultadosBib = [...PECAS.values()].filter((p) => (!catBib || p.cat === catBib) && termos.every((t) => t.test(`${p.nome} ${p.slug} ${p.tags} ${p.nota} ${CAT_PT[p.cat] || ""}`.toLowerCase())));
  // Pieces whose name or tags carry the words come first.
  const forte = (p) => termos.filter((t) => t.test(`${p.nome} ${p.tags}`.toLowerCase())).length;
  if (termos.length) resultadosBib.sort((a, b) => forte(b) - forte(a));
  bibGrade.innerHTML = resultadosBib.length ? "" : `<div class="vazio-grade">${t("app.bibVazio")}</div>`;
  bibGrade.scrollTop = 0; mostradosBib = 0; maisBib();
}
function maisBib() {
  const fim = Math.min(resultadosBib.length, mostradosBib + 48);
  for (; mostradosBib < fim; mostradosBib++) bibGrade.append(cartaoBib(resultadosBib[mostradosBib]));
}
bibGrade.addEventListener("scroll", () => { if (bibGrade.scrollTop + bibGrade.clientHeight > bibGrade.scrollHeight - 320) maisBib(); });
const aparece = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { aparece.unobserve(e.target); e.target._desenha?.(); }
}, { rootMargin: "120px" });
function cartaoBib(p) {
  const chave = `magia:${p.slug}`, cobre = COBRE.has(p.cat) || p.quadrada;
  const d = document.createElement("div"), cv = document.createElement("canvas"), nome = document.createElement("p");
  d.className = "bc" + (exibida === chave ? " on" : ""); d.dataset.chave = chave; d.title = p.nota;
  nome.textContent = p.nome; d.append(cv, nome);
  cv._desenha = () => arteOk.then(() => Arte.miniMagia(p.slug, cv, { cobre })).catch(() => d.classList.add("falhou"));
  aparece.observe(cv);
  let para = null;
  d.onmouseenter = () => { arteOk.then(() => Arte.vivaMagia(p.slug, cv, { cobre })).then((f) => { if (d.matches(":hover")) para = f; else f(); }); };
  d.onmouseleave = () => { para?.(); para = null; };
  d.onclick = () => { aplicaChave(chave); Som.clique(SOM_CAT[p.cat]); };
  return d;
}

// "Meus": the person's images, GIFs and videos, then animations from ASCII Motion.
async function carregaMeus() {
  const [lista, midias] = await Promise.all([vivo.motionLista(), fundosPessoais(true)]), g = $("meusGrade");
  $("meusN").textContent = lista.length + midias.length;
  g.innerHTML = lista.length || midias.length ? "" : `<div class="vazio-grade">${t("app.meusVazio")}</div>`;
  for (const m of midias) {
    const chave = `midia:${m.id}`, d = document.createElement("div"), video = VIDEO.test(m.ext);
    const prev = document.createElement(video ? "video" : "img"), nome = document.createElement("p"), x = document.createElement("button");
    prev.className = "prev"; prev.src = m.ext === "web" ? m.preview || "" : m.url;
    if (video) { prev.muted = true; prev.loop = true; prev.preload = "metadata"; d.onmouseenter = () => prev.play().catch(() => {}); d.onmouseleave = () => prev.pause(); }
    d.className = "bc" + (exibida === chave ? " on" : ""); d.dataset.chave = chave; d.title = m.nome;
    nome.textContent = m.nome; x.className = "tira"; x.title = t("app.apagar"); x.innerHTML = ICONE.lixo;
    x.onclick = async (e) => {
      e.stopPropagation();
      if (!x.dataset.certeza) { x.dataset.certeza = "1"; x.classList.add("certeza"); x.title = t("app.cliqueApagar"); return; }
      if (aplicada === chave) await aplicaChave("");
      await vivo.pessoalApagar("fundos", m.id); carregaMeus();
    };
    d.append(prev, nome, x); g.append(d);
    d.onclick = () => aplicaChave(chave);
  }
  for (const m of lista) {
    const chave = `motion:${m.id}`, d = document.createElement("div"), cv = document.createElement("canvas"), nome = document.createElement("p"), x = document.createElement("button");
    d.className = "bc" + (exibida === chave ? " on" : ""); d.dataset.chave = chave; d.title = t("app.nomeQuadros", { nome: m.nome, n: m.quadros });
    nome.textContent = m.nome; x.className = "tira"; x.title = t("app.apagar"); x.innerHTML = ICONE.lixo;
    x.onclick = async (e) => {
      e.stopPropagation();
      if (!x.dataset.certeza) { x.dataset.certeza = "1"; x.classList.add("certeza"); x.title = t("app.cliqueApagar"); return; }
      await vivo.motionApagar(m.id); motions.delete(m.id);
      if (aplicada === chave) aplicaChave(""); carregaMeus();
    };
    d.append(cv, nome, x); g.append(d);
    d.onclick = () => aplicaChave(chave);
    cv._desenha = async () => { const a = motions.get(m.id) || (await vivo.motionLer(m.id)); if (a) { motions.set(m.id, a); await arteOk; Arte.miniMotion(a, cv); } };
    aparece.observe(cv);
  }
}
async function importaMotion(caminho) {
  const r = await vivo.motionImportar(caminho || undefined);
  if (!r) return;
  if (r.erro) { nota(r.erro, true); return; }
  nota(t("app.importada", { nome: r.nome, n: r.quadros }));
  abrePicker("meus"); await carregaMeus(); aplicaChave(`motion:${r.id}`);
}
$("importar").onclick = () => importaMotion();
async function adicionaFundos(caminhos) {
  const r = await vivo.pessoalImportar("fundos", caminhos);
  if (r.erro) nota(r.erro, true);
  if (!r.itens?.length) return;
  abrePicker("meus"); await carregaMeus(); aplicaChave(`midia:${r.itens[r.itens.length - 1].id}`);
  nota(r.itens.length > 1 ? t("app.fundosAdicionados", { n: r.itens.length }) : t("app.virouFundo", { nome: r.itens[0].nome }));
}
$("addFundo").onclick = () => adicionaFundos();
picker.addEventListener("click", (e) => { const a = e.target.closest("a[href]"); if (a) { e.preventDefault(); vivo.link(a.href); } });

// ---- sound ------------------------------------------------------------------
// The speaker opens a solid panel: a switch, the volume and what is playing.
const somVol = $("somVol"), somPop = $("somPop");
function mostraSom() {
  document.body.classList.toggle("som-on", Som.ligado);
  $("somChave").setAttribute("aria-checked", Som.ligado ? "true" : "false");
  $("somDesc").textContent = !Som.ligado ? t("app.somDesligado") : !exibida ? t("app.somLigado") : somExibido ? t("app.somTocando", { nome: nomeExibido }) : t("app.somSemSom", { nome: nomeExibido });
  $("somPct").textContent = Math.round(+somVol.value * 100) + "%";
}
$("somBtn").onclick = (e) => { e.stopPropagation(); somPop.classList.toggle("on"); mostraSom(); };
$("somChave").onclick = () => { Som.ligar(!Som.ligado); mostraSom(); try { localStorage.setItem("som", Som.ligado ? "1" : "0"); } catch {} };
somVol.oninput = () => { Som.volume(+somVol.value); mostraSom(); try { localStorage.setItem("somVol", somVol.value); } catch {} };
addEventListener("pointerdown", (e) => { if (!e.target.closest(".som")) somPop.classList.remove("on"); });
try {
  const v = localStorage.getItem("somVol"); if (v) { somVol.value = v; Som.volume(+v); }
  if (localStorage.getItem("som") === "1") {
    const ativa = () => { Som.ligar(true); mostraSom(); removeEventListener("pointerdown", ativa); removeEventListener("keydown", ativa); };
    addEventListener("pointerdown", ativa); addEventListener("keydown", ativa);
  }
} catch {}

// ---- pointer and loop --------------------------------------------------------
addEventListener("mousemove", (e) => { raw = { x: e.clientX, y: e.clientY }; if (atual >= 0) big.mark(e.clientX, e.clientY); });
document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) raw = null; });
addEventListener("mousedown", (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (el && el.closest(".msg, .dock, .top, .side, .card, .ferr, .perm, .aviso, .menu, .pensando, .resolvido")) return;
  const meuSom = window.somEvento?.("clique");
  if (atual < 0) return;
  const th = THEMES[atual];
  if (th.click) th.click(e.clientX, e.clientY, agora(), big);
  if (!meuSom) Som.clique(th.id);
});

let relogioMini = 0;
const loop = (ms) => {
  requestAnimationFrame(loop);
  // frame cap from the performance profile (lower while the window is not focused)
  const d = window.desempenho, fps = d ? (document.hasFocus() ? d.fps : d.fpsFora) : 60;
  if (fps && ms - ultimo < 1000 / fps - 4) return;
  const dt = Math.min(0.05, (ms - ultimo) / 1000); ultimo = ms;
  const t = agora();
  if (raw) {
    if (!mouse) mouse = { x: raw.x, y: raw.y, vx: 0, vy: 0, speed: 0 };
    const nx = mouse.x + (raw.x - mouse.x) * Math.min(1, dt * 14), ny = mouse.y + (raw.y - mouse.y) * Math.min(1, dt * 14);
    const vx = (nx - mouse.x) / (dt || 0.016), vy = (ny - mouse.y) / (dt || 0.016);
    mouse = { x: nx, y: ny, vx, vy, speed: mouse.speed + (Math.hypot(vx, vy) - mouse.speed) * Math.min(1, dt * 8) };
  } else mouse = null;
  if (atual >= 0) {
    const th = THEMES[atual];
    if (mouse && th.wake && mouse.speed > 160 && (!ultimaOnda || Math.hypot(mouse.x - ultimaOnda.x, mouse.y - ultimaOnda.y) > 90)) {
      ultimaOnda = { x: mouse.x, y: mouse.y };
      big.add(ripple(mouse.x, mouse.y, t, { speed: 140, life: 1.1, force: 160, alpha: 0.45 }));
    }
    big.frame(th, t, dt, mouse);
    if (mouse) Som.mexer(th.id, mouse.speed);
    const dentro = new Set();
    if (mouse) for (const h of big.hits) if (Math.hypot(mouse.x - h.x, mouse.y - h.y) < h.r) {
      dentro.add(h.key);
      if (!big.hover.has(h.key)) { big.hover.set(h.key, t); Som.toque(th.id, h.kind); }
    }
    for (const key of [...big.hover.keys()]) if (!dentro.has(key) && t - big.hover.get(key) > 2.5) big.hover.delete(key);
  }
  relogioMini += dt;
  if (relogioMini > 0.08) { relogioMini = 0; for (const m of miniaturas) if (m.cv.isConnected && m.cv.offsetParent) m.r.frame(THEMES[m.i], t, 0.08, null); }
};
requestAnimationFrame(loop);

// ---- credits -----------------------------------------------------------------------
// Who made what: the idea, the built-in themes, every library piece by
// category, the animations the person imported, and the software underneath.
const creditos = $("creditos"), creditosCaixa = $("creditosCaixa");
const link = (url, texto) => `<a href="${esc(url)}">${esc(texto)}</a>`;
async function abreCreditos() {
  const meus = await vivo.motionLista();
  const porCat = {};
  for (const p of PECAS.values()) (porCat[p.cat] ||= []).push(p.nome);
  const categorias = (window.MAGIA?.cats || []).map(([id]) => `<details><summary>${esc(CAT_PT[id] || id)} <small>${(porCat[id] || []).length}</small></summary><p>${(porCat[id] || []).sort().map(esc).join(" · ")}</p></details>`).join("");
  creditosCaixa.innerHTML = `
    <div class="cred-topo"><span class="marca">${$("side").querySelector(".marca-svg").outerHTML}<b>Claudinho</b></span><button class="icone" id="fechaCreditos" title="${t("app.fechar")}">${ICONE.erro}</button></div>
    <p class="cred-autor">${t("app.credFeitoPor", { autor: link("https://luisrobertoportifolio.com", "Luis Roberto") })}</p>
    <section><h3>${t("app.credIdeiaTitulo")}</h3>
      <p>${t("app.credIdeia", { link: link("https://x.com/handsher_NGU/status/2115618341675319417", t("app.credVistoNoX")) })}</p></section>
    <section><h3>${t("app.credTemas")} <small>${THEMES.length}</small></h3>
      <p>${THEMES.map((t) => esc(t.name)).join(" · ")}</p>
      <p class="fraco">${t("app.credTemasTexto")}</p></section>
    <section><h3>${t("app.credBiblioteca")} <small>${PECAS.size}</small></h3>
      <p>${t("app.credMagia", { magia: link("https://www.ascii-magic.com/ascii", "ASCII Magic"), unsplash: link("https://unsplash.com/license", t("app.credLicencaUnsplash")) })}</p>
      ${categorias}</section>
    <section><h3>${t("app.credSuas")} <small>${meus.length}</small></h3>
      <p>${meus.length ? meus.map((m) => esc(m.nome)).join(" · ") + ". " : t("app.credNenhuma")}${t("app.credMotion", { motion: link("https://www.ascii-motion.com", "ASCII Motion") })}</p></section>
    <section><h3>${t("app.credPorBaixo")}</h3>
      <p>${link("https://github.com/anthropics/claude-agent-sdk-typescript", "Claude Agent SDK")} (Anthropic) · ${link("https://www.electronjs.org", "Electron")} (MIT) · ${link("https://marked.js.org", "marked")} (MIT) · ${link("https://zod.dev", "Zod")} (MIT) · ${t("app.credFontes", { inter: link("https://rsms.me/inter/", "Inter"), geist: link("https://vercel.com/font", "Geist Mono") })} (SIL Open Font License).</p></section>`;
  creditosCaixa.querySelector("#fechaCreditos").onclick = fechaCreditos;
  creditos.classList.add("on");
}
function fechaCreditos() { creditos.classList.remove("on"); }
$("creditosBtn").onclick = abreCreditos;
creditos.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]"); if (a) { e.preventDefault(); vivo.link(a.href); return; }
  if (e.target === creditos) fechaCreditos();
});

// ---- queue -------------------------------------------------------------------------
// Messages written while Claude works wait in line above the composer and go
// out one by one when the turn ends; each can be dropped before it leaves.
const fila = [];
function desenhaFila() {
  const el = $("fila");
  el.innerHTML = fila.map((f, i) => `<div class="na-fila"><span class="rot">${t("app.naFila")}</span><span class="txt">${esc(f.t || f.junto.map((x) => x.nome).join(", "))}</span><button class="icone" data-i="${i}" title="${t("app.tirarFila")}">${ICONE.erro}</button></div>`).join("");
  el.querySelectorAll("button").forEach((b) => (b.onclick = () => { fila.splice(+b.dataset.i, 1); desenhaFila(); }));
}
async function proximaDaFila() {
  if (rodando || !fila.length) return;
  const { t, junto } = fila.shift(); desenhaFila();
  if (!sessaoAtual && t) $("titulo").textContent = t.length > 60 ? t.slice(0, 60) + "…" : t;
  const { texto: final, enviados } = juntaColados(t, junto);
  meu(t, junto); window.somEvento?.("enviar");
  const bolha = col.lastElementChild;
  setRodando(true);
  if (!(await vivo.enviar(final, enviados))) { setRodando(false); bolha?.remove(); fila.unshift({ t, junto }); desenhaFila(); }
}

// ---- plan ------------------------------------------------------------------------------
// Claude's task list (TodoWrite) stays pinned above the composer while it works.
function mostraPlano(todos) {
  if (!Array.isArray(todos) || !todos.length) return escondePlano();
  const feitas = todos.filter((t) => t.status === "completed").length, el = $("plano");
  el.innerHTML = `<button class="plano-topo" title="${t("app.mostrarEsconder")}"><b>${t("app.plano")}</b><span class="plano-barra"><i style="width:${(feitas / todos.length) * 100}%"></i></span><small>${feitas}/${todos.length}</small></button>`
    + `<ol>${todos.map((t) => `<li class="${["pending", "in_progress", "completed"].includes(t.status) ? t.status : ""}">${esc(t.status === "in_progress" && t.activeForm ? t.activeForm : t.content)}</li>`).join("")}</ol>`;
  el.querySelector(".plano-topo").onclick = () => el.classList.toggle("fechado");
  el.classList.add("on");
}
function escondePlano() { $("plano").classList.remove("on"); }

// ---- context meter ---------------------------------------------------------------------
// How full the conversation's context is after the last turn, and what it wrote.
const milhar = (n) => (n >= 1000 ? (n / 1000).toLocaleString(idiomaAtual(), { maximumFractionDigits: n >= 10000 ? 0 : 1 }) + t("app.mil") : String(n));
function mostraUso({ contexto, janela, saida }) {
  const el = $("medidor"), p = Math.min(100, Math.round((contexto / janela) * 100));
  el.hidden = false; el.classList.toggle("alto", p >= 80);
  el.querySelector("b").style.width = p + "%";
  el.querySelector("span").textContent = `${p}%`;
  el.title = t("app.medidor", { usado: milhar(contexto), janela: milhar(janela), p, saida: milhar(saida) }) + (p >= 80 ? t("app.medidorCheio") : "");
}

// ---- jump between your messages -----------------------------------------------------
function pulaPrompt(dir) {
  const meus = [...col.querySelectorAll(".msg.eu")]; if (!meus.length) return;
  const topo = scroll.scrollTop + 8;
  const alvo = dir < 0 ? meus.filter((m) => m.offsetTop < topo - 4).pop() || meus[0] : meus.find((m) => m.offsetTop > topo + 4) || meus[meus.length - 1];
  scroll.scrollTo({ top: alvo.offsetTop - 16, behavior: "smooth" });
  alvo.classList.remove("piscando"); void alvo.offsetWidth; alvo.classList.add("piscando");
}
const irFim = $("irFim");
scroll.addEventListener("scroll", () => irFim.classList.toggle("on", !pertoDoFim()));
irFim.onclick = forcaDesce;

// ---- system notifications ----------------------------------------------------------
// When the window is in the background: a notice when Claude finishes or needs
// an answer. Clicking it brings the window back.
function avisaSistema(titulo, corpo) {
  if (document.hasFocus() || typeof Notification === "undefined" || geral().notificacoes === false) return;
  try { const n = new Notification(titulo, { body: corpo || "", silent: false }); n.onclick = () => vivo.focar(); } catch {}
}

// ---- shortcuts ---------------------------------------------------------------------------
function abreAtalhos() {
  const A = [["Enter", t("app.atEnviar")], ["Shift + Enter", t("app.atNovaLinha")], ["/", t("app.atComandos")], ["Ctrl + N", t("app.novaConversa")], ["Ctrl + Shift + N", t("app.atNovaJanela")], ["Ctrl + K", t("app.atBuscar")],
    ["Ctrl + B", t("app.atBarra")], ["Ctrl + J", t("app.atDetalhes")], ["Alt + ↑ / ↓", t("app.atPular")], ["Ctrl + V", t("app.atColar")], ["Esc", t("app.atFechar")], ["Ctrl + /", t("app.atLista")], ["Ctrl + Shift + " + t("app.teclaEspaco"), t("app.atMostrar")]];
  creditosCaixa.innerHTML = `<div class="cred-topo"><span class="marca"><b>${t("app.atalhos")}</b></span><button class="icone" id="fechaCreditos" title="${t("app.fechar")}">${ICONE.erro}</button></div>
    <section class="atalhos">${A.map(([k, d]) => `<div><kbd>${esc(k)}</kbd><span>${esc(d)}</span></div>`).join("")}</section>`;
  creditosCaixa.querySelector("#fechaCreditos").onclick = fechaCreditos;
  creditos.classList.add("on");
}
$("atalhosBtn").onclick = abreAtalhos;

// ---- start ----------------------------------------------------------------------
(async () => {
  try { if (localStorage.getItem("recolhido")) document.body.classList.add("recolhido"); } catch {}
  telaInicial();
  const e = await vivo.estado();
  mostraPasta(e.cwd);
  $("modelo").value = e.model || ""; $("modo").value = e.modo || "default"; $("esforco").value = e.esforco || ""; atualizaEscolhas();
  let salvo = ""; try { salvo = localStorage.getItem("tema") || ""; } catch {}
  if (salvo.includes(":")) aplicaChave(salvo); else if (idx(salvo) >= 0) aplica(idx(salvo));
  vivo.motionLista().then((l) => ($("meusN").textContent = l.length));
  atualizaEnviar();
  // A window opened on a conversation skips the intro and opens it.
  const sessao = new URLSearchParams(location.search).get("sessao");
  if (sessao || e.janelas > 1) {
    $("intro").remove(); document.body.classList.remove("entrando");
    await carregaSessoes();
    if (sessao) await abreSessao(sessao, sessoes.find((x) => x.id === sessao)?.titulo || t("app.conversa"));
    entrada.focus();
  } else {
    carregaSessoes();
    boasVindas(() => { document.body.classList.remove("entrando"); entrada.focus(); });
  }
})();
