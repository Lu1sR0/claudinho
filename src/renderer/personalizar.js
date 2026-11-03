// Personalizar: everything about the look and sound of the app can be the
// person's own: backgrounds (images, GIFs, videos), colours, fonts, a sound
// for each event, background music, the app's icon and name. Settings live in
// the main process (config.visual); files are copied into the app's folder.

let VIS = {};
const visualAtual = () => VIS;
const PADRAO = {
  cores: { acento: "#d97757", texto: "", vidro: "#110f0e", opacidade: 0.52, desfoque: 10, modo: "auto" },
  fundo: { ajuste: "cover", escurecer: 0.15, desfoque: 0, somVideo: false },
  fontes: { ui: "Inter", mono: "Geist Mono", tamanho: 14, largura: 740 },
  sons: {}, volumeSons: 0.7,
  musica: { ligada: false, substitui: true, aleatoria: false, volume: 0.5 },
  geral: { enviar: "enter", raciocinio: true, titulo: true, reage: true, notificacoes: true, clawd: true, clawdFala: true, novidades: true, cursor: true, desempenho: "auto" },
};
const pega = (k) => k.split(".").reduce((o, p) => (o == null ? undefined : o[p]), VIS) ?? k.split(".").reduce((o, p) => (o == null ? undefined : o[p]), PADRAO);
const poe = (k, v) => { const ps = k.split("."), ult = ps.pop(); let o = VIS; for (const p of ps) o = o[p] ??= {}; o[ult] = v; };
let timerSalva = null;
const salva = () => { clearTimeout(timerSalva); timerSalva = setTimeout(() => vivo.visualSalvar(VIS), 250); };

// ---- applying -------------------------------------------------------------------------
// [name in the menu, CSS font-family]; names are quoted, since one with a
// digit ("Press Start 2P") is invalid bare and drops the whole declaration.
const q = (n) => `"${n}"`;
const FONTES_UI = [["Inter", q("Inter")], ["Sistema", '"Segoe UI", system-ui'], ...["Poppins", "Nunito", "Space Grotesk", "DM Sans", "Lora", "Playfair Display", "Comic Neue", "VT323", "Press Start 2P", "Silkscreen", "Pixelify Sans", "Tiny5", "Jersey 10"].map((n) => [n, q(n)])];
const FONTES_MONO = ["Geist Mono", "JetBrains Mono", "Fira Code", "IBM Plex Mono", "Space Mono", "Consolas"].map((n) => [n, q(n)]);
const GOOGLE = new Set(["Silkscreen", "Pixelify Sans", "Tiny5", "Jersey 10", "Poppins", "Nunito", "Space Grotesk", "DM Sans", "Lora", "Playfair Display", "Comic Neue", "VT323", "Press Start 2P", "JetBrains Mono", "Fira Code", "IBM Plex Mono", "Space Mono"]);
const carregadas = new Set();
function carregaGoogle(nome) {
  if (!GOOGLE.has(nome) || carregadas.has(nome)) return;
  carregadas.add(nome);
  const pesos = /VT323|Press Start/.test(nome) ? "" : ":wght@400;500;600;700";
  const l = document.createElement("link"); l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nome).replace(/%20/g, "+")}${pesos}&display=swap`;
  document.head.append(l);
}
const fontesArquivo = new Map();
async function carregaArquivo(item) {
  if (fontesArquivo.has(item.id)) return fontesArquivo.get(item.id);
  const familia = "Pessoal " + item.id.replace(/\W/g, "");
  try { const f = new FontFace(familia, `url("${item.url}")`); await f.load(); document.fonts.add(f); } catch { return null; }
  fontesArquivo.set(item.id, familia); return familia;
}
const rgba = (hex, a) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return null; const n = parseInt(m[1], 16); return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a)).toFixed(2)})`; };
const raiz = document.documentElement.style, corpo = document.body.style;

// ---- cursor ---------------------------------------------------------------------------
// The app's own pointer: a pixel arrow in the accent colour (O outline, H light
// edge, F fill), and over anything clickable the same arrow with the Claude
// spark. Drawn as SVG and handed to the stylesheet as --cur-seta / --cur-mao.
const SETA = [
  "O", "OO", "OHO", "OHFO", "OHFFO", "OHFFFO", "OHFFFFO", "OHFFFFFO", "OHFFFFFFO", "OHFFFFFFFO",
  "OHFFFFOOOOO", "OHFOFFO", "OFO.OFFO", "OO..OFFO", "O....OFFO", ".....OOO",
];
const FAISCA = ["S.S.S", ".SSS.", "SSSSS", ".SSS.", "S.S.S"];
const MAO = SETA.map((l, y) => {
  const f = FAISCA[y - 10]; if (!f) return l;
  const linha = [...l.padEnd(16, ".")];
  [...f].forEach((c, x) => { if (c === "S") linha[11 + x] = "S"; });
  return linha.join("");
});
const pixelSvg = (linhas, cores) => {
  const w = Math.max(...linhas.map((l) => l.length)), h = linhas.length;
  let px = "";
  linhas.forEach((l, y) => [...l].forEach((c, x) => { if (cores[c]) px += `<rect x="${x}" y="${y}" width="1" height="1" fill="${cores[c]}"/>`; }));
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${px}</svg>`)}")`;
};
// any CSS colour to #rrggbb (the canvas normalises it), and a lighter mix of it
const hexDe = (cor) => { const c = document.createElement("canvas").getContext("2d"); c.fillStyle = "#d97757"; c.fillStyle = cor; return /^#[0-9a-f]{6}$/i.test(c.fillStyle) ? c.fillStyle : "#d97757"; };
const clareia = (hex, k) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k) + 255 * k).toString(16).padStart(2, "0")).join("");
let cursorFeito = "";
function aplicaCursor(acento) {
  if (!acento) { cursorFeito = ""; raiz.removeProperty("--cur-seta"); raiz.removeProperty("--cur-mao"); return; }
  const f = hexDe(acento);
  if (f === cursorFeito) return;
  cursorFeito = f;
  const cores = { O: "#1a1311", F: f, H: clareia(f, 0.45), S: clareia(f, 0.15) };
  raiz.setProperty("--cur-seta", `${pixelSvg(SETA, cores)} 1 1, default`);
  raiz.setProperty("--cur-mao", `${pixelSvg(MAO, cores)} 1 1, pointer`);
}

async function aplicaVisual() {
  // colours
  const c = { ...PADRAO.cores, ...VIS.cores };
  corpo.setProperty("--accent", c.acento); corpo.setProperty("--accent-2", `color-mix(in srgb, ${c.acento} 78%, white)`);
  if (c.texto) { corpo.setProperty("--ui", c.texto); corpo.setProperty("--ui-2", `color-mix(in srgb, ${c.texto} 78%, transparent)`); corpo.setProperty("--ui-dim", `color-mix(in srgb, ${c.texto} 56%, transparent)`); }
  else ["--ui", "--ui-2", "--ui-dim"].forEach((v) => corpo.removeProperty(v));
  aplicaCursor(pega("geral.cursor") && c.acento);
  const mexeuVidro = VIS.cores && ("vidro" in VIS.cores || "opacidade" in VIS.cores);
  if (mexeuVidro) {
    corpo.setProperty("--vidro", rgba(c.vidro, c.opacidade)); corpo.setProperty("--panel", rgba(c.vidro, c.opacidade + 0.03));
    corpo.setProperty("--card", rgba(c.vidro, c.opacidade + 0.06)); corpo.setProperty("--composer", rgba(c.vidro, c.opacidade + 0.1));
  } else ["--vidro", "--panel", "--card", "--composer"].forEach((v) => corpo.removeProperty(v));
  if (VIS.cores && "desfoque" in VIS.cores) corpo.setProperty("--blur", c.desfoque + "px"); else corpo.removeProperty("--blur");
  forcaModo();
  aplicaDesempenho(pega("geral.desempenho"));
  // background layer
  const f = { ...PADRAO.fundo, ...VIS.fundo }, camada = $("midia").style;
  camada.setProperty("--ajuste", f.ajuste); camada.setProperty("--esc", f.escurecer); camada.setProperty("--desf", f.desfoque + "px");
  $("midia").classList.toggle("desfoca", f.desfoque > 0);
  $("midia").querySelectorAll("video").forEach((v) => (v.muted = !f.somVideo));
  // fonts
  const fo = { ...PADRAO.fontes, ...VIS.fontes };
  let ui = FONTES_UI.find(([n]) => n === fo.ui)?.[1], mono = FONTES_MONO.find(([n]) => n === fo.mono)?.[1];
  if (fo.ui?.startsWith("arquivo:") || fo.mono?.startsWith("arquivo:")) {
    const lista = await vivo.pessoalLista("fontes");
    for (const lado of ["ui", "mono"]) if (fo[lado]?.startsWith("arquivo:")) {
      const item = lista.find((x) => x.id === fo[lado].slice(8));
      const fam = item && (await carregaArquivo(item));
      if (lado === "ui") ui = fam ? `"${fam}"` : null; else mono = fam ? `"${fam}"` : null;
    }
  }
  carregaGoogle(fo.ui); carregaGoogle(fo.mono);
  raiz.setProperty("--fonte", `${ui || q("Inter")}, Inter, system-ui, sans-serif`);
  raiz.setProperty("--mono", `${mono || '"Geist Mono"'}, "Geist Mono", Consolas, monospace`);
  raiz.setProperty("--tam", fo.tamanho + "px"); raiz.setProperty("--largura", fo.largura + "px");
  // name and icon in the sidebar
  const nome = (VIS.nome || "").trim() || "Claudinho";
  document.title = nome; document.querySelector(".side-topo .marca > span").textContent = nome;
  const marca = document.querySelector(".side-topo .marca");
  marca.querySelector("img.marca-img")?.remove(); marca.querySelector(".marca-svg").style.display = "";
  if (VIS.icone && VIS.iconeNaBarra) {
    const item = (await vivo.pessoalLista("icone")).find((x) => x.id === VIS.icone);
    if (item) { const img = document.createElement("img"); img.className = "marca-img"; img.src = item.url; img.alt = ""; marca.prepend(img); marca.querySelector(".marca-svg").style.display = "none"; }
  }
  // music
  musica.atualiza();
}
// Performance profiles. Automatic keeps the look and saves where nobody sees
// (30 fps when the window is not focused, lighter glass over video or web
// wallpapers, the web wallpaper drawn at 80%); Light trades looks for speed.
const PERFIS = {
  maximo: { fps: 0, fpsFora: 0, dpr: 2, web: 1 },
  auto: { fps: 60, fpsFora: 30, dpr: 1.5, web: 0.8 },
  leve: { fps: 30, fpsFora: 15, dpr: 1, web: 0.6 },
};
function aplicaDesempenho(modo) {
  const p = PERFIS[modo] || PERFIS.auto, antes = window.desempenho;
  window.desempenho = { modo, ...p };
  document.body.classList.toggle("leve", modo === "leve"); document.body.classList.toggle("maximo", modo === "maximo");
  if (!antes || antes.modo !== modo) window.mudouDesempenho?.(antes);
}
// Light or dark glass: automatic follows the background; the person can fix it.
function forcaModo() {
  const modo = VIS.cores?.modo || "auto";
  const claro = modo === "auto" ? document.body.dataset.claro === "1" : modo === "claro";
  document.body.classList.toggle("light", claro && document.body.classList.contains("themed"));
  vivo.barra(claro);
}

// ---- sounds for events ------------------------------------------------------------------
const EVENTOS = [["enviar", "Enviar mensagem"], ["terminou", "O Claude terminou"], ["permissao", "Pedido de aprovação"], ["erro", "Erro"], ["clique", "Clique no papel de parede"], ["abrir", "Abrir o app"]];
let sonsCache = [];
const urlSom = (id) => sonsCache.find((x) => x.id === id)?.url;
function tocaArquivo(url, vol) { if (!url) return false; const a = new Audio(url); a.volume = Math.max(0, Math.min(1, vol)); a.play().catch(() => {}); return true; }
// Plays the person's sound for an event; true when there was one.
function somEvento(nome) { return tocaArquivo(urlSom(VIS.sons?.[nome]), pega("volumeSons")); }
window.somEvento = somEvento;

// ---- background music -----------------------------------------------------------------
// The person's tracks, one after another (or shuffled), on top of or instead
// of the themes' own music.
const musica = (() => {
  const audio = new Audio(); let faixas = [], i = 0;
  audio.addEventListener("ended", () => proxima());
  const original = Som.tema.bind(Som); let temaPedido = null;
  Som.tema = (id, forcar) => { if (!forcar) temaPedido = id; original(substitui() ? null : forcar ? id : temaPedido, forcar); };
  const substitui = () => !!(VIS.musica?.ligada && VIS.musica?.substitui && faixas.length);
  async function carrega() { faixas = await vivo.pessoalLista("musica"); if (i >= faixas.length) i = 0; }
  function toca() {
    if (!faixas.length) return;
    const f = faixas[i]; if (audio.dataset.id !== f.id) { audio.src = f.url; audio.dataset.id = f.id; }
    audio.volume = pega("musica.volume"); audio.play().catch(() => {}); mostraFaixa();
  }
  function proxima() { if (!faixas.length) return; i = VIS.musica?.aleatoria && faixas.length > 1 ? (i + 1 + Math.floor(Math.random() * (faixas.length - 1))) % faixas.length : (i + 1) % faixas.length; toca(); }
  function mostraFaixa() {
    const el = $("somMusica"); if (!el) return;
    el.hidden = !faixas.length;
    el.querySelector("b").textContent = faixas.length ? (VIS.musica?.ligada && !audio.paused ? faixas[i].nome : "Minha música") : "";
    el.querySelector("small").textContent = !faixas.length ? "" : VIS.musica?.ligada ? (audio.paused ? "Pausada" : `${i + 1} de ${faixas.length}`) : `${faixas.length} faixa${faixas.length > 1 ? "s" : ""} · desligada`;
    el.querySelector(".mus-tocar").innerHTML = VIS.musica?.ligada && !audio.paused ? svg('<path d="M9 6v12M15 6v12"/>') : svg('<path d="M8 5.5v13l10-6.5z"/>');
  }
  async function atualiza() {
    await carrega();
    audio.volume = pega("musica.volume");
    if (VIS.musica?.ligada && faixas.length) { if (audio.paused) toca(); } else audio.pause();
    original(substitui() ? null : temaPedido, true);
    mostraFaixa();
  }
  const tocaFaixa = (k) => { i = Math.max(0, Math.min(faixas.length - 1, k)); audio.dataset.id = ""; toca(); };
  const anterior = () => { if (faixas.length) tocaFaixa((i - 1 + faixas.length) % faixas.length); };
  audio.addEventListener("play", () => dispatchEvent(new Event("musica"))); audio.addEventListener("pause", () => dispatchEvent(new Event("musica")));
  return { atualiza, proxima, anterior, tocaFaixa, mostraFaixa, audio, get faixas() { return faixas; }, get indice() { return i; }, liga(v) { poe("musica.ligada", v); salva(); atualiza(); } };
})();
$("somMusica").querySelector(".mus-tocar").onclick = () => musica.liga(!(VIS.musica?.ligada && !musica.audio.paused));
$("somMusica").querySelector(".mus-prox").onclick = () => { if (!VIS.musica?.ligada) musica.liga(true); else musica.proxima(); };

// ---- the panel ------------------------------------------------------------------------------
const personal = $("personal"), caixaP = $("personalCaixa");
const ABAS = [["geral", "Geral"], ["fundo", "Fundo"], ["cores", "Cores"], ["fontes", "Fontes"], ["sons", "Sons"], ["musica", "Música"], ["app", "Ícone e nome"]];
let abaP = "geral";
const PALETAS = [
  ["Claude", { acento: "#d97757", vidro: "#110f0e" }], ["Oceano", { acento: "#3fb6d9", vidro: "#071a24" }], ["Neon", { acento: "#ff3ea5", vidro: "#0d0618" }],
  ["Floresta", { acento: "#5fb08a", vidro: "#0b1a12" }], ["Ouro", { acento: "#e7b549", vidro: "#17120a" }], ["Lavanda", { acento: "#a78bfa", vidro: "#130f1f" }],
  ["Sangue", { acento: "#e5484d", vidro: "#1a0a0b" }], ["Mono", { acento: "#e9e6df", vidro: "#101010" }],
];
const pct = (v) => Math.round(v * 100) + "%";
const deslizante = (k, rot, min, max, passo, fmt) => `<label class="pz-linha"><span>${rot}</span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${passo}" /><output data-fmt="${fmt}"></output></label>`;
const segmentos = (k, rot, ops) => `<div class="pz-linha"><span>${rot}</span><div class="pz-seg" data-k="${k}">${ops.map(([v, n]) => `<button data-v="${v}">${n}</button>`).join("")}</div></div>`;
const chaveT = (k, rot, desc = "") => `<div class="pz-linha"><span>${rot}${desc ? `<small>${desc}</small>` : ""}</span><button class="chave" role="switch" data-k="${k}"><i></i></button></div>`;
const cor = (k, rot) => `<label class="pz-linha"><span>${rot}</span><input type="color" data-k="${k}" /></label>`;
const FMT = { pct, px: (v) => v + "px", n: (v) => v };

async function desenhaAba() {
  const corpoP = caixaP.querySelector(".pz-corpo");
  caixaP.querySelectorAll(".pz-nav button").forEach((b) => b.classList.toggle("on", b.dataset.aba === (abaP === "we" ? "fundo" : abaP)));
  let h = "";
  if (abaP === "geral") {
    h = `<h3>Geral</h3><p class="pz-desc">Como o Claudinho se comporta.</p>
      ${segmentos("geral.enviar", "Enviar mensagem com", [["enter", "Enter"], ["ctrl", "Ctrl + Enter"]])}
      ${segmentos("geral.desempenho", "Desempenho", [["auto", "Automático"], ["maximo", "Máximo"], ["leve", "Leve"]])}
      ${chaveT("geral.raciocinio", "Mostrar o raciocínio do Claude", "O que ele pensa antes de responder, num bloco recolhível")}
      ${chaveT("geral.titulo", "Título automático", "Um título curto para cada conversa nova (gasta bem pouco do seu plano)")}
      ${chaveT("geral.clawd", "Clawd no app", "O mascote acompanha o que o Claude está fazendo")}
      ${chaveT("geral.cursor", "Cursor do Claudinho", "Uma setinha em pixel na cor de destaque, com a faísca do Claude sobre o que dá pra clicar")}
      ${chaveT("geral.clawdFala", "Clawd puxa conversa", "Comentários sobre o projeto, curiosidades e dicas, de tempos em tempos")}
      ${chaveT("geral.novidades", "Novidades do Claude e da Anthropic", "Uma busca rápida na web por dia (gasta bem pouco do plano)")}
      ${chaveT("geral.reage", "Papel de parede reage ao Claude", "Ondas e ritmo mudam enquanto ele pensa, trabalha ou espera você")}
      ${chaveT("geral.notificacoes", "Notificações do sistema", "Quando ele termina ou precisa de você com a janela em segundo plano")}
      <h3 class="pz-sub">Atualizações</h3>
      <div class="pz-linha"><span>Claudinho <b class="pz-versao"></b><small class="pz-atualiza-txt"></small></span><button class="btn" data-atualiza hidden></button></div>
      <h3 class="pz-sub">Conta</h3>
      <div class="pz-linha"><span>Entrar com<small>O login do Claude Code usa o seu plano do Claude. A chave de API cobra por uso na sua conta da Anthropic.</small></span>
        <div class="pz-seg" data-conta><button data-v="login">Login do Claude Code</button><button data-v="chave">Chave de API</button></div></div>
      <div class="pz-chave" hidden><input type="password" placeholder="Cole a chave da API (sk-ant-…)" autocomplete="off" spellcheck="false" /><button class="btn forte" data-acao="salvaChave">Salvar</button><button class="btn" data-acao="apagaChave">Apagar</button></div>
      <p class="pz-desc fraco pz-conta-info"></p>`;
  } else if (abaP === "fundo") {
    const fundos = await vivo.pessoalLista("fundos");
    h = `<h3>Fundo</h3><p class="pz-desc">Use uma imagem, um GIF, um vídeo ou um papel de parede do Wallpaper Engine. Os temas animados e a biblioteca continuam no seletor de temas.</p>
      <div class="pz-acoes"><button class="btn forte" data-acao="addFundo">Adicionar imagem, GIF ou vídeo</button><button class="btn" data-acao="wallpaperEngine">Do Wallpaper Engine</button><button class="btn" data-acao="temas">Abrir os temas</button></div>
      <div class="pz-grade">${fundos.map((m) => `<button class="pz-mini${exibida === "midia:" + m.id ? " on" : ""}" data-fundo="${esc(m.id)}" title="${esc(m.nome)}">${m.ext === "web" ? `${m.preview ? `<img src="${esc(m.preview)}" alt="" />` : ""}<i>${esc(m.nome)}</i>` : VIDEO.test(m.ext) ? `<video src="${esc(m.url)}" muted preload="metadata"></video><i>▶</i>` : `<img src="${esc(m.url)}" alt="" />`}</button>`).join("") || '<p class="pz-vazio">Nenhum fundo seu ainda.</p>'}</div>
      ${segmentos("fundo.ajuste", "Ajuste", [["cover", "Preencher"], ["contain", "Encaixar"]])}
      ${deslizante("fundo.escurecer", "Escurecer", 0, 0.8, 0.05, "pct")}
      ${deslizante("fundo.desfoque", "Desfocar", 0, 24, 1, "px")}
      ${chaveT("fundo.somVideo", "Som do vídeo", "Toca o áudio quando o fundo é um vídeo")}`;
  } else if (abaP === "we") {
    // Wallpaper Engine: video and web wallpapers come in; scenes only run inside it
    corpoP.innerHTML = '<p class="pz-vazio">Procurando na sua biblioteca do Steam…</p>';
    const [we, meus] = await Promise.all([vivo.weLista(), vivo.pessoalLista("fundos")]), ja = new Set(meus.map((m) => m.nome));
    if (abaP !== "we") return;
    const cenas = we.cenas ? `<p class="pz-desc fraco">${we.cenas} papéis de parede de cena ficaram de fora: eles são desenhados pelo motor do próprio Wallpaper Engine e só rodam dentro dele.</p>` : "";
    h = `<div class="pz-volta"><button class="btn" data-acao="voltaFundo">${svg('<path d="M14.7 6.3 9 12l5.7 5.7 1.4-1.4-4.3-4.3 4.3-4.3z"/>')} Fundo</button></div>
      <h3>Do Wallpaper Engine</h3><p class="pz-desc">Os papéis de parede de vídeo e de página da sua biblioteca. Ao escolher, ele é copiado para o Claudinho e continua funcionando mesmo se você cancelar a inscrição.</p>
      ${!we.achou ? '<p class="pz-vazio">Não achei o Wallpaper Engine neste computador. Ele precisa estar instalado pelo Steam.</p>'
        : `<input class="pz-busca" type="search" placeholder="Buscar entre ${we.itens.length}" />
      <div class="pz-grade we-grade">${we.itens.map((i) => `<button class="pz-mini we" data-we="${esc(i.pasta)}" data-nome="${esc(i.nome.toLowerCase())}" title="${esc(i.nome)}">${i.preview ? `<img src="${esc(i.preview)}" alt="" loading="lazy" decoding="async" />` : ""}<span>${esc(i.nome)}</span><em>${i.tipo === "web" ? "Página" : "Vídeo"}${ja.has(i.nome.slice(0, 60)) ? " · já adicionado" : ""}</em></button>`).join("") || '<p class="pz-vazio">Nenhum papel de parede de vídeo ou de página na biblioteca.</p>'}</div>${cenas}`}`;
  } else if (abaP === "cores") {
    h = `<h3>Cores</h3><p class="pz-desc">Destaque, texto e o vidro dos painéis. As mudanças aparecem na hora.</p>
      <div class="pz-paletas">${PALETAS.map(([n, p]) => `<button data-paleta="${n}" title="${n}"><i style="background:${p.vidro}"><b style="background:${p.acento}"></b></i><span>${n}</span></button>`).join("")}</div>
      ${cor("cores.acento", "Destaque")}${cor("cores.texto", "Texto")}${cor("cores.vidro", "Vidro")}
      ${deslizante("cores.opacidade", "Opacidade do vidro", 0.1, 0.95, 0.01, "pct")}
      ${deslizante("cores.desfoque", "Desfoque do vidro", 0, 30, 1, "px")}
      ${segmentos("cores.modo", "Vidro claro ou escuro", [["auto", "Automático"], ["escuro", "Escuro"], ["claro", "Claro"]])}
      <div class="pz-acoes"><button class="btn" data-acao="resetCores">Restaurar cores</button></div>`;
  } else if (abaP === "fontes") {
    const arquivos = await vivo.pessoalLista("fontes");
    const opcoes = (lista, atual) => lista.map(([n, css]) => `<option value="${esc(n)}" style='font-family: ${css}'${n === atual ? " selected" : ""}>${esc(n)}</option>`).join("") + arquivos.map((a) => `<option value="arquivo:${esc(a.id)}"${"arquivo:" + a.id === atual ? " selected" : ""}>${esc(a.nome)} (sua)</option>`).join("");
    h = `<h3>Fontes</h3><p class="pz-desc">A fonte da interface, a dos códigos, o tamanho do texto e a largura da conversa. Fontes da internet carregam na hora; as suas (.ttf, .otf, .woff) ficam guardadas no app.</p>
      <label class="pz-linha"><span>Interface</span><select data-k="fontes.ui">${opcoes(FONTES_UI, pega("fontes.ui"))}</select></label>
      <label class="pz-linha"><span>Código</span><select data-k="fontes.mono">${opcoes(FONTES_MONO, pega("fontes.mono"))}</select></label>
      ${deslizante("fontes.tamanho", "Tamanho do texto", 12, 19, 0.5, "px")}
      ${deslizante("fontes.largura", "Largura da conversa", 560, 1100, 20, "px")}
      <div class="pz-amostra"><b>O Claude Code trabalha em projetos.</b> <code>const tema = "seu";</code></div>
      <div class="pz-acoes"><button class="btn" data-acao="addFonte">Adicionar fonte…</button></div>`;
  } else if (abaP === "sons") {
    sonsCache = await vivo.pessoalLista("sons");
    h = `<h3>Sons</h3><p class="pz-desc">Um som seu para cada coisa que acontece. Adicione arquivos (mp3, wav, ogg) e escolha onde tocam.</p>
      <div class="pz-acoes"><button class="btn forte" data-acao="addSom">Adicionar sons…</button></div>
      ${EVENTOS.map(([k, n]) => `<div class="pz-linha"><span>${n}</span><div class="pz-som"><select data-som="${k}"><option value="">Nenhum</option>${sonsCache.map((s) => `<option value="${esc(s.id)}"${VIS.sons?.[k] === s.id ? " selected" : ""}>${esc(s.nome)}</option>`).join("")}</select><button class="icone" data-testa="${k}" title="Ouvir">${svg('<path d="M8 5.5v13l10-6.5z"/>')}</button></div></div>`).join("")}
      ${deslizante("volumeSons", "Volume dos sons", 0, 1, 0.05, "pct")}
      ${sonsCache.length ? `<details class="pz-lista"><summary>Seus sons (${sonsCache.length})</summary>${sonsCache.map((s) => `<div><span>${esc(s.nome)}</span><button class="icone" data-apaga-som="${esc(s.id)}" title="Apagar">${ICONE.lixo}</button></div>`).join("")}</details>` : ""}`;
  } else if (abaP === "musica") {
    const faixas = await vivo.pessoalLista("musica");
    h = `<h3>Música de fundo</h3><p class="pz-desc">Suas músicas tocando enquanto você trabalha, no lugar da música dos temas ou junto com ela.</p>
      <div class="pz-acoes"><button class="btn forte" data-acao="addMusica">Adicionar músicas…</button></div>
      ${chaveT("musica.ligada", "Tocar minha música")}
      ${chaveT("musica.substitui", "Substituir a música dos temas", "Desligado, as duas tocam juntas")}
      ${chaveT("musica.aleatoria", "Ordem aleatória")}
      ${deslizante("musica.volume", "Volume", 0, 1, 0.05, "pct")}
      <div class="pz-faixas">${faixas.map((f, k) => `<div class="${musica.audio.dataset.id === f.id ? "on" : ""}"><button class="icone" data-faixa="${k}" title="Tocar">${svg('<path d="M8 5.5v13l10-6.5z"/>')}</button><span>${esc(f.nome)}</span><button class="icone" data-apaga-musica="${esc(f.id)}" title="Apagar">${ICONE.lixo}</button></div>`).join("") || '<p class="pz-vazio">Nenhuma música ainda.</p>'}</div>`;
  } else if (abaP === "app") {
    const icones = await vivo.pessoalLista("icone"), atualIcone = icones.find((x) => x.id === VIS.icone);
    h = `<h3>Ícone e nome</h3><p class="pz-desc">O ícone aparece na barra de tarefas e, se quiser, na barra lateral. O nome vai no topo da barra lateral e no título da janela.</p>
      <div class="pz-icone"><div class="pz-icone-prev"><img src="${atualIcone ? esc(atualIcone.url) : "../icone.png"}" alt="" /></div>
        <div class="pz-acoes"><button class="btn forte" data-acao="addIcone">Escolher ícone…</button>${VIS.icone ? '<button class="btn" data-acao="iconePadrao">Usar o padrão</button>' : ""}</div></div>
      ${chaveT("iconeNaBarra", "Mostrar o ícone na barra lateral")}
      <label class="pz-linha"><span>Nome do app</span><input type="text" data-k="nome" maxlength="28" placeholder="Claudinho" /></label>
      <p class="pz-desc fraco">O atalho do sistema mantém o ícone original; o ícone novo aparece na barra de tarefas com o app aberto.</p>`;
  }
  corpoP.innerHTML = h;
  ligaControles(corpoP);
  if (abaP === "geral") { ligaConta(corpoP); ligaAtualizacao(corpoP); }
}
// Updates: where it stands, and a button to look now or restart into the new one.
const TXT_ATUALIZA = {
  desligada: "Rodando pelo código: as atualizações automáticas ficam com o app instalado",
  parado: "Procura sozinho ao abrir e a cada 6 horas",
  procurando: "Procurando versão nova…",
  em_dia: "Você está na versão mais nova",
  erro: "Não deu pra procurar agora. Sem internet?",
};
window.desenhaAtualizacaoPz = (a) => {
  const r = document.querySelector(".pz-corpo [data-atualiza]"); if (!r || !a) return;
  const linha = r.closest(".pz-linha");
  linha.querySelector(".pz-versao").textContent = a.versao || "";
  linha.querySelector(".pz-atualiza-txt").textContent = a.estado === "baixando" ? `Baixando a ${a.nova}… ${a.progresso || 0}%` : a.estado === "pronta" ? `A ${a.nova} está pronta e entra quando o app reiniciar` : TXT_ATUALIZA[a.estado] || "";
  r.hidden = a.estado === "desligada";
  r.disabled = a.estado === "procurando" || a.estado === "baixando";
  r.classList.toggle("forte", a.estado === "pronta");
  r.textContent = a.estado === "pronta" ? "Reiniciar e atualizar" : "Procurar agora";
};
async function ligaAtualizacao(r) {
  const b = r.querySelector("[data-atualiza]");
  b.onclick = async () => (window.estadoAtualizacao?.estado === "pronta" ? window.instalaAtualizacao() : window.desenhaAtualizacaoPz((window.estadoAtualizacao = await vivo.atualizacaoProcurar())));
  window.desenhaAtualizacaoPz(window.estadoAtualizacao || (await vivo.atualizacao()));
}
// Sign-in: Claude Code's own login, or an API key kept encrypted by the OS
// (it never comes back to the window, only whether there is one).
async function ligaConta(r) {
  const seg = r.querySelector("[data-conta]"), caixa = r.querySelector(".pz-chave"), info = r.querySelector(".pz-conta-info"), campo = caixa.querySelector("input");
  let c = await vivo.conta();
  const mostra = () => {
    seg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.v === c.entrar));
    caixa.hidden = c.entrar !== "chave";
    campo.placeholder = c.temChave ? "Chave salva. Cole outra para trocar" : "Cole a chave da API (sk-ant-…)";
    info.innerHTML = (c.claude ? `Claude Code encontrado em <code>${esc(c.claude)}</code>.` : "Claude Code não encontrado. Instale em code.claude.com e abra o Claudinho de novo.")
      + (c.entrar === "chave" && !c.temChave ? " Falta salvar uma chave." : "");
  };
  seg.querySelectorAll("button").forEach((b) => (b.onclick = async () => { c = { ...c, ...(await vivo.contaSalvar({ entrar: b.dataset.v })) }; mostra(); }));
  ACOES.salvaChave = async () => { const v = campo.value.trim(); if (!v) return; const res = await vivo.contaSalvar({ chave: v }); campo.value = ""; if (res.erro) nota(res.erro, true); else { c = { ...c, ...res }; nota("Chave salva"); } mostra(); };
  ACOES.apagaChave = async () => { c = { ...c, ...(await vivo.contaSalvar({ chave: "" })) }; campo.value = ""; mostra(); };
  r.querySelectorAll("[data-acao='salvaChave'], [data-acao='apagaChave']").forEach((b) => (b.onclick = () => ACOES[b.dataset.acao]()));
  mostra();
}

function ligaControles(r) {
  r.querySelectorAll("input[type=range][data-k]").forEach((el) => {
    const out = el.parentElement.querySelector("output"), mostra = () => (out.textContent = FMT[out.dataset.fmt](+el.value));
    el.value = pega(el.dataset.k); mostra();
    el.oninput = () => { poe(el.dataset.k, +el.value); mostra(); aplicaVisual(); salva(); };
  });
  r.querySelectorAll("input[type=color][data-k]").forEach((el) => {
    el.value = pega(el.dataset.k) || (el.dataset.k === "cores.texto" ? "#ecebe7" : "#000000");
    el.oninput = () => { poe(el.dataset.k, el.value); aplicaVisual(); salva(); };
  });
  r.querySelectorAll("input[type=text][data-k]").forEach((el) => { el.value = pega(el.dataset.k) || ""; el.oninput = () => { poe(el.dataset.k, el.value); aplicaVisual(); salva(); }; });
  r.querySelectorAll("select[data-k]").forEach((el) => {
    el.value = pega(el.dataset.k); el.onchange = () => { poe(el.dataset.k, el.value); aplicaVisual(); salva(); };
    // the font menus show each option in its own face: fetch them the first time the menu opens
    if (el.dataset.k.startsWith("fontes.")) el.addEventListener("pointerdown", () => [...FONTES_UI, ...FONTES_MONO].forEach(([n]) => carregaGoogle(n)), { once: true });
  });
  r.querySelectorAll(".pz-seg[data-k]").forEach((el) => {
    const marca = () => el.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.v === String(pega(el.dataset.k))));
    marca(); el.querySelectorAll("button").forEach((b) => (b.onclick = () => { poe(el.dataset.k, b.dataset.v); marca(); aplicaVisual(); salva(); }));
  });
  r.querySelectorAll(".chave[data-k]").forEach((el) => {
    const marca = () => el.setAttribute("aria-checked", pega(el.dataset.k) ? "true" : "false");
    marca(); el.onclick = () => { poe(el.dataset.k, !pega(el.dataset.k)); marca(); aplicaVisual(); salva(); };
  });
  r.querySelectorAll("[data-paleta]").forEach((b) => (b.onclick = () => { const p = PALETAS.find(([n]) => n === b.dataset.paleta)[1]; VIS.cores = { ...VIS.cores, ...p }; aplicaVisual(); salva(); desenhaAba(); }));
  r.querySelectorAll("[data-fundo]").forEach((b) => (b.onclick = async () => { await aplicaChave("midia:" + b.dataset.fundo); desenhaAba(); }));
  r.querySelectorAll("[data-som]").forEach((s) => (s.onchange = () => { VIS.sons = { ...VIS.sons, [s.dataset.som]: s.value || undefined }; salva(); somEvento(s.dataset.som); }));
  r.querySelectorAll("[data-testa]").forEach((b) => (b.onclick = () => { if (!somEvento(b.dataset.testa)) nota("Escolha um som para esse evento primeiro."); }));
  r.querySelectorAll("[data-apaga-som]").forEach((b) => (b.onclick = async () => { await vivo.pessoalApagar("sons", b.dataset.apagaSom); for (const k in VIS.sons) if (VIS.sons[k] === b.dataset.apagaSom) delete VIS.sons[k]; salva(); desenhaAba(); }));
  r.querySelectorAll("[data-faixa]").forEach((b) => (b.onclick = async () => { poe("musica.ligada", true); salva(); await musica.atualiza(); musica.tocaFaixa(+b.dataset.faixa); desenhaAba(); }));
  r.querySelectorAll("[data-apaga-musica]").forEach((b) => (b.onclick = async () => { if (musica.audio.dataset.id === b.dataset.apagaMusica) { musica.audio.pause(); musica.audio.removeAttribute("src"); musica.audio.dataset.id = ""; } await vivo.pessoalApagar("musica", b.dataset.apagaMusica); await musica.atualiza(); desenhaAba(); }));
  r.querySelectorAll("[data-acao]").forEach((b) => (b.onclick = () => ACOES[b.dataset.acao]()));
  const busca = r.querySelector(".pz-busca");
  if (busca) busca.oninput = () => { const q = busca.value.trim().toLowerCase(); r.querySelectorAll("[data-we]").forEach((b) => (b.hidden = !!q && !b.dataset.nome.includes(q))); };
  r.querySelectorAll("[data-we]").forEach((b) => (b.onclick = async () => {
    if (r.querySelector(".we.copiando")) return;
    b.classList.add("copiando"); b.querySelector("em").textContent = "Copiando…";
    const res = await vivo.weImportar(b.dataset.we);
    b.classList.remove("copiando");
    if (res.erro) { nota(res.erro, true); b.querySelector("em").textContent = "Não deu"; return; }
    await fundosPessoais(true); await aplicaChave("midia:" + res.item.id);
    nota(`“${res.item.nome}” virou o fundo`);
    abaP = "fundo"; desenhaAba();
  }));
}
const importa = async (tipo) => { const r = await vivo.pessoalImportar(tipo); if (r.erro) nota(r.erro, true); return r.itens || []; };
const ACOES = {
  addFundo: async () => { await adicionaFundos(); desenhaAba(); },
  temas: () => { fechaPersonal(); abrePicker(); },
  wallpaperEngine: () => { abaP = "we"; desenhaAba(); },
  voltaFundo: () => { abaP = "fundo"; desenhaAba(); },
  resetCores: () => { delete VIS.cores; aplicaVisual(); salva(); desenhaAba(); },
  addFonte: async () => { const it = await importa("fontes"); if (it.length) { poe("fontes.ui", "arquivo:" + it[0].id); aplicaVisual(); salva(); } desenhaAba(); },
  addSom: async () => { await importa("sons"); desenhaAba(); },
  addMusica: async () => { const it = await importa("musica"); if (it.length && !VIS.musica?.ligada) poe("musica.ligada", true); salva(); await musica.atualiza(); desenhaAba(); },
  addIcone: async () => { const it = await importa("icone"); if (it.length) { VIS.icone = it[0].id; aplicaVisual(); salva(); } desenhaAba(); },
  iconePadrao: () => { delete VIS.icone; aplicaVisual(); salva(); desenhaAba(); },
};

function abrePersonal(aba) {
  if (aba) abaP = aba;
  if (!caixaP.childElementCount) {
    caixaP.innerHTML = `<div class="pz-topo"><b>Personalizar</b><button class="icone" data-fecha title="Fechar (Esc)">${ICONE.erro}</button></div>
      <div class="pz-meio"><nav class="pz-nav">${ABAS.map(([k, n]) => `<button data-aba="${k}">${n}</button>`).join("")}<div class="pz-rodape"><button class="pz-reset">Restaurar tudo</button></div></nav><div class="pz-corpo"></div></div>`;
    caixaP.querySelector("[data-fecha]").onclick = fechaPersonal;
    caixaP.querySelectorAll(".pz-nav [data-aba]").forEach((b) => (b.onclick = () => { abaP = b.dataset.aba; desenhaAba(); }));
    const reset = caixaP.querySelector(".pz-reset");
    reset.onclick = () => {
      if (!reset.dataset.certeza) { reset.dataset.certeza = "1"; reset.textContent = "Confirmar: restaurar tudo"; return; }
      delete reset.dataset.certeza; reset.textContent = "Restaurar tudo";
      VIS = {}; aplicaVisual(); salva(); desenhaAba();
    };
  }
  personal.classList.add("on"); desenhaAba();
}
function fechaPersonal() { personal.classList.remove("on"); }
personal.addEventListener("click", (e) => { if (e.target === personal) fechaPersonal(); });
$("personalBtn").onclick = () => abrePersonal();

// ---- start --------------------------------------------------------------------------------------
(async () => {
  VIS = (await vivo.visual()) || {};
  sonsCache = await vivo.pessoalLista("sons");
  await aplicaVisual();
  setTimeout(() => somEvento("abrir"), 400);
})();
