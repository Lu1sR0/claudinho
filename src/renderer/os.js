// "Claudinho OS": small glass windows that float over the wallpaper (the
// review of every change in the conversation, the plan, the music player),
// a radial menu on right-click, a terminal mode in the composer, and undo
// reachable from the activity rail.

// ---- floating windows -------------------------------------------------------------------
// Dragged by the title bar, closed with ×; where each one was left is kept.
const janelinhas = new Map();
// Pinned windows stay where they were left, can't be dragged or closed by
// accident and open again by themselves the next time the app starts.
const ABRE_JANELINHA = {};
const lerJ = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
const fixasJ = new Set(lerJ("jl:fixas", []));
const guardaFixas = () => { try { localStorage.setItem("jl:fixas", JSON.stringify([...fixasJ])); } catch {} };
const ALFINETE = '<svg viewBox="0 0 24 24"><path d="M9 4h6l-1 5 3 3v2H7v-2l3-3zM12 14v6"/></svg>';
function janelinha(id, titulo, { largura = 420, altura = null, aoFechar } = {}) {
  if (janelinhas.has(id)) { const j = janelinhas.get(id); j.el.classList.add("on"); traz(j.el); return j; }
  const el = document.createElement("section"), main = document.querySelector("main");
  const tam = lerJ("jl:tam:" + id, null);
  el.className = "janelinha on"; el.dataset.id = id;
  el.style.width = (tam?.w ?? largura) + "px"; if (tam?.h || altura) el.style.height = (tam?.h ?? altura) + "px";
  el.innerHTML = `<header><b>${esc(titulo)}</b><button class="icone fixar" title="${t("os.fixarAqui")}">${ALFINETE}</button><button class="icone fechar" title="${t("os.fechar")}">${ICONE.erro}</button></header><div class="jl-corpo"></div>`;
  main.append(el);
  const pos = lerJ("jl:" + id, null), r = main.getBoundingClientRect();
  const x = pos?.x ?? Math.max(20, r.width - largura - 28 - janelinhas.size * 48), y = pos?.y ?? 64 + janelinhas.size * 40;
  el.style.left = x + "px"; el.style.top = y + "px"; cabeNaTela(el);
  const j = { el, corpo: el.querySelector(".jl-corpo") };
  janelinhas.set(id, j);
  const guardaPos = () => { try { localStorage.setItem("jl:" + id, JSON.stringify({ x: el.offsetLeft, y: el.offsetTop })); } catch {} };
  const fixa = (sim) => {
    el.classList.toggle("fixa", sim); sim ? fixasJ.add(id) : fixasJ.delete(id); guardaFixas();
    const b = el.querySelector(".fixar"); b.title = sim ? t("os.soltar") : t("os.fixarAqui"); b.setAttribute("aria-pressed", sim);
    if (sim) guardaPos();
  };
  fixa(fixasJ.has(id));
  el.querySelector(".fixar").onclick = () => fixa(!el.classList.contains("fixa"));
  const fecha = () => { fixa(false); el.classList.remove("on"); aoFechar?.(); setTimeout(() => { if (!el.classList.contains("on")) { el.remove(); janelinhas.delete(id); } }, 220); };
  el.querySelector("header .fechar").onclick = fecha;
  j.fecha = fecha;
  el.addEventListener("pointerdown", () => traz(el));
  const cab = el.querySelector("header");
  cab.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button") || el.classList.contains("fixa")) return;
    const x0 = e.clientX - el.offsetLeft, y0 = e.clientY - el.offsetTop, rr = main.getBoundingClientRect();
    cab.setPointerCapture(e.pointerId); el.classList.add("movendo");
    const move = (m) => { el.style.left = Math.max(-el.offsetWidth + 80, Math.min(rr.width - 60, m.clientX - x0)) + "px"; el.style.top = Math.max(0, Math.min(rr.height - 40, m.clientY - y0)) + "px"; };
    const solta = () => { cab.removeEventListener("pointermove", move); el.classList.remove("movendo"); guardaPos(); };
    cab.addEventListener("pointermove", move); cab.addEventListener("pointerup", solta, { once: true });
  });
  // the size it was left at (the corner handle is CSS resize)
  let timerTam = 0;
  new ResizeObserver(() => { clearTimeout(timerTam); timerTam = setTimeout(() => { if (el.isConnected && el.classList.contains("on")) try { localStorage.setItem("jl:tam:" + id, JSON.stringify({ w: el.offsetWidth, h: el.style.height ? el.offsetHeight : null })); } catch {} }, 300); }).observe(el);
  traz(el);
  return j;
}
// a window saved in a bigger window (or a monitor that is gone) comes back into view
function cabeNaTela(el) {
  const r = document.querySelector("main").getBoundingClientRect();
  el.style.left = Math.max(8, Math.min(el.offsetLeft, r.width - el.offsetWidth - 8)) + "px";
  el.style.top = Math.max(8, Math.min(el.offsetTop, r.height - Math.min(el.offsetHeight, r.height - 16) - 8)) + "px";
}
addEventListener("resize", () => janelinhas.forEach((j) => cabeNaTela(j.el)));
// after every window type has registered how to open itself, the pinned ones come back
setTimeout(() => fixasJ.forEach((id) => ABRE_JANELINHA[id]?.()), 1500);
let zTopo = 20;
const traz = (el) => (el.style.zIndex = ++zTopo);

// ---- every change in the conversation ---------------------------------------------------
// Files Claude edited or created, with their diffs, grouped by file; each
// change can be undone from the message that started it.
function alteracoes() {
  const porArquivo = new Map();
  for (const c of col.querySelectorAll(".ferr")) {
    if (!/^(Edit|MultiEdit|Write)$/.test(c._nome || "") || c.querySelector(".estado.erro")) continue;
    const f = c._entrada?.file_path || c._entrada?.notebook_path; if (!f) continue;
    let dono = c.previousElementSibling; while (dono && !dono.classList.contains("eu")) dono = dono.previousElementSibling;
    (porArquivo.get(f) || porArquivo.set(f, []).get(f)).push({ card: c, dono });
  }
  return porArquivo;
}
ABRE_JANELINHA.alteracoes = () => abreAlteracoes();
function abreAlteracoes() {
  const j = janelinha("alteracoes", t("os.alteracoesDaConversa"), { largura: 520, altura: 460 });
  const desenha = () => {
    const mapa = alteracoes();
    if (!mapa.size) { j.corpo.innerHTML = `<p class="jl-vazio">${t("os.nenhumArquivoMudado")}</p>`; return; }
    let mais = 0, menos = 0;
    j.corpo.innerHTML = [...mapa].map(([f, lista], k) => {
      const blocos = lista.map(({ card }) => diffDe(card._nome, card._entrada));
      blocos.forEach((b) => { const m = b.contagem.match(/\+(\d+).*?−(\d+)/); if (m) { mais += +m[1]; menos += +m[2]; } });
      return `<details class="arq-alt"${mapa.size < 4 ? " open" : ""}><summary>${ICONE.editar}<b title="${esc(f)}">${esc(f.split(/[\\/]/).pop())}</b><small>${esc(f.split(/[\\/]/).slice(-3, -1).join("/"))}</small><span class="n">${lista.length}×</span></summary>`
        + lista.map(({ dono }, n) => `<div class="mud">${blocos[n].html}<div class="mud-b"><button class="btn" data-ir="${k}:${n}">${t("os.verNaConversa")}</button>${dono?.dataset.uuid ? `<button class="btn" data-desfaz="${k}:${n}">${t("os.desfazerAPartirDaqui")}</button>` : ""}</div></div>`).join("") + "</details>";
    }).join("");
    j.corpo.insertAdjacentHTML("afterbegin", `<div class="jl-resumo"><b>${t("os.arquivos", { n: mapa.size })}</b><em class="contagem"><b>+${mais}</b><s>−${menos}</s></em></div>`);
    const lista = [...mapa.values()];
    j.corpo.querySelectorAll("[data-ir]").forEach((b) => (b.onclick = () => { const [k, n] = b.dataset.ir.split(":").map(Number), c = lista[k][n].card; c.scrollIntoView({ behavior: "smooth", block: "center" }); c.classList.remove("piscando"); void c.offsetWidth; c.classList.add("piscando"); }));
    j.corpo.querySelectorAll("[data-desfaz]").forEach((b) => (b.onclick = () => { const [k, n] = b.dataset.desfaz.split(":").map(Number), d = lista[k][n].dono; d.scrollIntoView({ behavior: "smooth", block: "center" }); desfazDaqui(d); }));
  };
  desenha(); j.redesenha = desenha;
}
const botaoAlt = document.createElement("button");
botaoAlt.className = "icone alt-btn"; botaoAlt.title = t("os.alteracoesDaConversa"); botaoAlt.innerHTML = `${svg('<path d="M8 4v12M4 8h8M14 17h6"/><rect x="3" y="3" width="18" height="18" rx="3"/>')}<i class="badge"></i>`;
$("atalhosBtn").before(botaoAlt);
botaoAlt.onclick = abreAlteracoes;
function contaAlteracoes() {
  const n = alteracoes().size;
  botaoAlt.querySelector(".badge").textContent = n || ""; botaoAlt.classList.toggle("tem", n > 0);
  janelinhas.get("alteracoes")?.redesenha?.();
}
new MutationObserver(() => { clearTimeout(contaAlteracoes.t); contaAlteracoes.t = setTimeout(contaAlteracoes, 200); }).observe(col, { childList: true });

// ---- the plan in a window of its own ----------------------------------------------------
const plano = $("plano"), lugarDoPlano = plano.parentElement, depoisDoPlano = plano.nextElementSibling;
function destacaPlano() {
  const j = janelinha("plano", t("os.planoDoClaude"), { largura: 320, aoFechar: () => { lugarDoPlano.insertBefore(plano, depoisDoPlano); plano.classList.remove("solto"); } });
  plano.classList.add("solto"); j.corpo.append(plano);
}
new MutationObserver(() => {
  const topo = plano.querySelector(".plano-topo");
  if (topo && !topo.querySelector(".solta")) {
    const b = document.createElement("span"); b.className = "solta"; b.title = plano.classList.contains("solto") ? "" : t("os.abrirNumaJanela");
    b.innerHTML = svg('<path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>');
    b.onclick = (e) => { e.stopPropagation(); if (!plano.classList.contains("solto")) destacaPlano(); };
    topo.append(b);
  }
}).observe(plano, { childList: true });

// ---- music player ------------------------------------------------------------------------
ABRE_JANELINHA.player = () => abrePlayer();
function abrePlayer() {
  const j = janelinha("player", t("os.musica"), { largura: 300 });
  const desenha = () => {
    const fx = musica.faixas, tocando = VIS.musica?.ligada && !musica.audio.paused;
    if (!fx.length) { j.corpo.innerHTML = `<p class="jl-vazio">${t("os.nenhumaMusica")}</p><div class="mud-b"><button class="btn forte" data-a="add">${t("os.adicionarMusicas")}</button></div>`; j.corpo.querySelector("[data-a=add]").onclick = () => abrePersonal("musica"); return; }
    const atualF = fx[musica.indice];
    j.corpo.innerHTML = `<div class="player"><div class="disco${tocando ? " gira" : ""}">${mosaicoMini()}</div><div class="faixa"><b>${esc(atualF?.nome || "")}</b><small>${t("os.faixaDe", { atual: musica.indice + 1, total: fx.length })}</small></div></div>
      <div class="controles"><button class="icone" data-a="ant" title="${t("os.anterior")}">${svg('<path d="M18 6v12l-9-6zM6.5 6v12"/>')}</button><button class="icone grande" data-a="toca" title="${t("os.tocarOuPausar")}">${tocando ? svg('<path d="M9 6v12M15 6v12"/>') : svg('<path d="M8 5.5v13l10-6.5z"/>')}</button><button class="icone" data-a="prox" title="${t("os.proxima")}">${svg('<path d="M6 6v12l9-6zM17.5 6v12"/>')}</button></div>
      <input class="vol" type="range" min="0" max="1" step="0.05" value="${pega("musica.volume")}" aria-label="${t("os.volume")}" />
      <ol class="faixas">${fx.map((f, k) => `<li class="${k === musica.indice ? "on" : ""}" data-k="${k}">${esc(f.nome)}</li>`).join("")}</ol>`;
    j.corpo.querySelector('[data-a="ant"]').onclick = () => { if (!VIS.musica?.ligada) musica.liga(true); musica.anterior(); };
    j.corpo.querySelector('[data-a="prox"]').onclick = () => { if (!VIS.musica?.ligada) musica.liga(true); else musica.proxima(); };
    j.corpo.querySelector('[data-a="toca"]').onclick = () => musica.liga(!tocando);
    j.corpo.querySelector(".vol").oninput = (e) => { poe("musica.volume", +e.target.value); musica.audio.volume = +e.target.value; salva(); };
    j.corpo.querySelectorAll(".faixas li").forEach((li) => (li.onclick = () => { poe("musica.ligada", true); salva(); musica.tocaFaixa(+li.dataset.k); }));
  };
  desenha(); desenhaPlayer = desenha;
}
let desenhaPlayer = null;
addEventListener("musica", () => janelinhas.has("player") && desenhaPlayer?.());
{
  const b = document.createElement("button");
  b.className = "som-player"; b.textContent = t("os.abrirOPlayer");
  b.onclick = () => { $("somPop").classList.remove("on"); abrePlayer(); };
  $("somPop").append(b);
}

// ---- radial menu -----------------------------------------------------------------------------
// Right-click on the wallpaper (not on text or controls) opens a ring of actions.
const radial = document.createElement("div");
radial.className = "radial"; document.body.append(radial);
const ACOES_RADIAL = [
  [t("os.novaConversa"), svg('<path d="M12 5v14M5 12h14"/>'), () => novaConversa()],
  [t("os.temas"), ICONE.tema, () => abrePicker()],
  [t("os.personalizar"), svg('<path d="M4.5 19.5c1.5 0 3.5-.5 4.2-2.2.7-1.7-.2-3.3-1.7-3.3s-2.5 1.6-2.5 3c0 1-.5 2-1 2.5zM9.5 13l9-9.5a1.6 1.6 0 0 1 2.3 2.3L11.5 15"/>'), () => abrePersonal()],
  [t("os.alteracoes"), svg('<path d="M8 4v12M4 8h8M14 17h6"/><rect x="3" y="3" width="18" height="18" rx="3"/>'), () => abreAlteracoes()],
  [t("os.musica"), svg('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'), () => abrePlayer()],
  [t("os.novaJanela"), ICONE.janela, () => vivo.janelaNova()],
  [t("os.atalhos"), svg('<rect x="3" y="6.5" width="18" height="11" rx="2.5"/><path d="M7 10.5h.01M10.5 10.5h.01M14 10.5h.01M17 10.5h.01M8 14h8"/>'), () => abreAtalhos()],
  [t("os.esforco"), svg('<path d="M4.5 16a7.5 7.5 0 1 1 15 0"/><path d="m12 16 3.5-4.5"/>'), () => document.querySelectorAll(".escolha .chip")[2]?.click()],
];
function abreRadial(x, y) {
  const R = 86;
  radial.innerHTML = `<div class="radial-centro">${mosaicoMini()}</div>` + ACOES_RADIAL.map(([n, ic], k) => {
    const a = (k / ACOES_RADIAL.length) * Math.PI * 2 - Math.PI / 2;
    return `<button style="--x:${Math.cos(a) * R}px;--y:${Math.sin(a) * R}px;--d:${k * 18}ms" data-k="${k}" title="${n}">${ic}<span>${n}</span></button>`;
  }).join("");
  radial.style.left = Math.max(110, Math.min(innerWidth - 110, x)) + "px"; radial.style.top = Math.max(110, Math.min(innerHeight - 110, y)) + "px";
  radial.querySelectorAll("button").forEach((b) => (b.onclick = () => { fechaRadial(); ACOES_RADIAL[+b.dataset.k][2](); }));
  radial.classList.add("on");
}
const fechaRadial = () => radial.classList.remove("on");
addEventListener("contextmenu", (e) => {
  if (e.target.closest("input, textarea, a, pre, code, .msg, .ferr, .perm, .pergunta, .menu, .janelinha, .personal, .creditos, .side, .dock, .top")) return;
  e.preventDefault(); abreRadial(e.clientX, e.clientY);
});
addEventListener("pointerdown", (e) => { if (!e.target.closest(".radial")) fechaRadial(); });
addEventListener("keydown", (e) => { if (e.key === "Escape") { fechaRadial(); for (const j of janelinhas.values()) if (j.el.matches(":focus-within")) j.fecha(); } });

// ---- terminal mode ------------------------------------------------------------------------------
// "!comando" asks Claude to run that command and show the output.
entrada.addEventListener("input", () => $("composer").classList.toggle("modo-terminal", entrada.value.startsWith("!")));
entrada.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || e.shiftKey || !entrada.value.startsWith("!") || (geral().enviar === "ctrl" && !e.ctrlKey)) return;
  const cmd = entrada.value.slice(1).trim(); if (!cmd) return;
  e.preventDefault(); e.stopImmediatePropagation();
  entrada.value = ""; ajustaAltura(); atualizaEnviar(); $("composer").classList.remove("modo-terminal");
  envia(t("os.rodeNoTerminal", { cmd }));
}, true);

// ---- rewind from the activity rail -----------------------------------------------------------
// Right-click on a tile: undo the file changes from the message that led to it.
trilho.addEventListener("contextmenu", (e) => {
  const t = e.target.closest(".tile"); if (!t) return;
  e.preventDefault(); e.stopPropagation();
  const cards = [...col.querySelectorAll(".ferr")].slice(-60), c = cards[[...trilho.children].indexOf(t)];
  let dono = c?.previousElementSibling; while (dono && !dono.classList.contains("eu")) dono = dono.previousElementSibling;
  const r = t.getBoundingClientRect();
  menu.innerHTML = `<button data-a="ir">${svg('<path d="M12 5v14m-5-5 5 5 5-5"/>')}${globalThis.t("os.irAteAqui")}</button>${dono?.dataset.uuid ? `<button data-a="volta">${svg('<path d="M9 7.5 4.5 12 9 16.5"/><path d="M5 12h9.5a5 5 0 0 1 0 10H12"/>')}${globalThis.t("os.voltarArquivos")}</button>` : ""}`;
  menu.style.left = Math.min(r.left, innerWidth - 280) + "px"; menu.style.top = r.bottom + 6 + "px"; menu.classList.add("on");
  menu.querySelector('[data-a="ir"]').onclick = () => { fechaMenu(); t.click(); };
  menu.querySelector('[data-a="volta"]')?.addEventListener("click", () => { fechaMenu(); dono.scrollIntoView({ behavior: "smooth", block: "center" }); desfazDaqui(dono); });
});
