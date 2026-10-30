// Touches that give the app its own feel: an activity rail in the top bar
// (one tile per tool Claude used in this conversation), a dithered mosaic
// wipe when switching conversations, tool titles that decode themselves from
// ASCII glyphs, the composer telling when it holds a command, and the 3×3
// mark breathing while Claude works.

// ---- activity rail ----------------------------------------------------------------------
// Tiles coloured by kind of tool; hover names it, click jumps to its card.
const trilho = document.createElement("div");
trilho.className = "trilho"; trilho.setAttribute("aria-label", t("interface.atividade"));
$("titulo").after(trilho);
const tipoFerr = (nome) => /^(Read|Glob|Grep|NotebookRead|LS)$/.test(nome) ? "ler" : /^(Write|Edit|MultiEdit|NotebookEdit)$/.test(nome) ? "editar" : /^(Bash|PowerShell)$/.test(nome) ? "rodar"
  : /^Web/.test(nome) ? "web" : nome.startsWith("mcp__claudinho__") ? "tema" : /^(Task|Agent)$/.test(nome) ? "agente" : "outro";
let timerTrilho = null;
function desenhaTrilho() {
  const cards = [...col.querySelectorAll(".ferr")].slice(-60);
  trilho.innerHTML = "";
  for (const c of cards) {
    const nome = c.querySelector("summary b")?.dataset.nome || "", t = document.createElement("button");
    t.className = "tile " + tipoFerr(nome) + (c.querySelector(".estado.rodando") ? " vivo" : "") + (c.querySelector(".estado.erro") ? " falhou" : "");
    t.title = `${c.querySelector("summary b")?.textContent || nome} ${c.querySelector("summary span")?.textContent || ""}`.trim();
    t.onclick = () => { c.scrollIntoView({ behavior: "smooth", block: "center" }); c.classList.remove("piscando"); void c.offsetWidth; c.classList.add("piscando"); };
    trilho.append(t);
  }
  trilho.classList.toggle("on", cards.length > 0);
}
new MutationObserver(() => { clearTimeout(timerTrilho); timerTrilho = setTimeout(desenhaTrilho, 80); }).observe(col, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

// ---- decoding tool titles -------------------------------------------------------------------
const GLIFOS = "·✻✽✶✳✢░▒▓#%&*+=";
function decifra(el, ms = 380) {
  const final = el.textContent, t0 = performance.now();
  const passo = () => {
    const p = (performance.now() - t0) / ms;
    if (p >= 1) { el.textContent = final; return; }
    const n = Math.floor(final.length * p);
    el.textContent = final.slice(0, n) + [...final.slice(n)].map((c) => (c === " " ? " " : GLIFOS[Math.floor(Math.random() * GLIFOS.length)])).join("");
    requestAnimationFrame(passo);
  };
  passo();
}
vivo.aoEvento((ev) => {
  if (ev.tipo !== "ferramenta") return;
  const b = [...col.querySelectorAll(".ferr summary b")].pop();
  if (b) b.dataset.nome = ev.nome;
});

// ---- dithered wipe between conversations -------------------------------------------------
// The conversation area dissolves into mosaic tiles in a Bayer order and the
// new one comes through them; the tile glyphs match the wallpapers.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
function transicaoDither() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const main = document.querySelector("main"), r = main.getBoundingClientRect(), cv = document.createElement("canvas"), dpr = Math.min(2, devicePixelRatio || 1);
  cv.className = "dither"; cv.width = r.width * dpr; cv.height = r.height * dpr; main.append(cv);
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const T = 12, cols = Math.ceil(r.width / T), rows = Math.ceil(r.height / T), t0 = performance.now(), dur = 340;
  const cs = getComputedStyle(document.body), fundo = document.body.classList.contains("themed") ? "rgba(14,13,12,0.92)" : cs.getPropertyValue("--bg"), acento = cs.getPropertyValue("--accent").trim();
  const quadro = () => {
    const p = (performance.now() - t0) / dur;
    if (p >= 1) { cv.remove(); return; }
    c.clearRect(0, 0, r.width, r.height);
    // cover then uncover: the threshold sweeps up and back down
    const lim = p < 0.5 ? p * 2 : (1 - p) * 2;
    c.font = `600 ${T * 0.8}px ${cs.getPropertyValue("--mono")}`; c.textAlign = "center"; c.textBaseline = "middle";
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const b = BAYER[(j % 4) * 4 + (i % 4)] * 0.85 + ((i + j) / (cols + rows)) * 0.15;
      if (b > lim) continue;
      c.fillStyle = fundo;
      c.fillRect(i * T, j * T, T, T);
    }
    requestAnimationFrame(quadro);
  };
  quadro();
}
window.transicaoDither = transicaoDither;

// ---- composer modes -----------------------------------------------------------------------------
entrada.addEventListener("input", () => $("composer").classList.toggle("modo-comando", entrada.value.startsWith("/")));

// ---- the conversation never hides under the dock ---------------------------------------
// The plan, the queue and attachments make the dock taller; the scroll area
// keeps its bottom edge just above it.
new ResizeObserver(() => {
  const h = document.querySelector(".dock").getBoundingClientRect().height, noFim = pertoDoFim();
  scroll.style.bottom = Math.round(h + 34) + "px";
  if (noFim) scroll.scrollTop = scroll.scrollHeight;
  $("irFim").style.bottom = Math.round(h + 46) + "px";
}).observe(document.querySelector(".dock"));

// ---- long replies in layers ------------------------------------------------------------
// A long reply opens folded: its headings as a small index on top, the text
// cut with a fade and a button to read it all (with the reading time).
function camadas(el) {
  const corpo = el?.querySelector(".corpo");
  if (!corpo || corpo.scrollHeight < 620) return;
  const palavras = (corpo.textContent.match(/\S+/g) || []).length, min = Math.max(1, Math.round(palavras / 220));
  const titulos = [...corpo.querySelectorAll("h1, h2, h3")];
  el.classList.add("longa", "dobrada");
  if (titulos.length >= 2) {
    const indice = document.createElement("div");
    indice.className = "indice";
    indice.innerHTML = `<span>${t("interface.nestaResposta")}</span>` + titulos.map((h, i) => `<button data-i="${i}">${esc(h.textContent.slice(0, 48))}</button>`).join("");
    indice.querySelectorAll("button").forEach((b) => (b.onclick = () => { el.classList.remove("dobrada"); titulos[+b.dataset.i].scrollIntoView({ behavior: "smooth", block: "start" }); }));
    corpo.before(indice);
  }
  const mais = document.createElement("button");
  mais.className = "ler-tudo";
  const rotulo = () => (mais.innerHTML = el.classList.contains("dobrada") ? `${svg('<path d="m6 9 6 6 6-6"/>')}${t("interface.lerInteira")} <small>${t("interface.minutos", { n: min })}</small>` : `${svg('<path d="m6 15 6-6 6 6"/>')}${t("interface.recolher")}`);
  mais.onclick = () => { el.classList.toggle("dobrada"); rotulo(); if (el.classList.contains("dobrada")) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  rotulo(); corpo.after(mais);
}
window.camadas = camadas;
