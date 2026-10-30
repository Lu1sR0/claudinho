// Plan usage, with Clawd in the gym. The 5-hour window is his stamina: fresh,
// he pumps a barbell fast; past half he slows and sweats; near the end he
// can barely lift it and shakes; at the limit he drops it and falls asleep
// until the window renews. Below, each window as a tile meter with when it
// renews. The top-bar button shows the same stamina in four tiles, and the
// Clawd beside the composer gets tired too.

const NOMES_JANELA = { five_hour: t("uso.sessao5h"), seven_day: t("uso.semana"), seven_day_opus: t("uso.semanaOpus"), seven_day_sonnet: t("uso.semanaSonnet"), seven_day_oauth_apps: t("uso.semanaApps") };
let usoDados = null, usoPedido = null;
const quandoRenova = (iso) => {
  if (!iso) return "";
  const d = new Date(iso), hoje = new Date(), amanha = new Date(Date.now() + 864e5);
  const hora = d.toLocaleTimeString(idiomaAtual(), { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === hoje.toDateString()) return t("uso.as", { hora });
  if (d.toDateString() === amanha.toDateString()) return t("uso.amanhaAs", { hora });
  return t("uso.diaAs", { dia: d.toLocaleDateString(idiomaAtual(), { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", ""), hora });
};
const cincoHoras = () => usoDados?.janelas?.find((j) => j.id === "five_hour");
// 0 fresh … 1 spent; at or over 100 he sleeps
function cansaco() {
  const j = cincoHoras(); if (!j || j.uso == null) return null;
  return Math.max(0, Math.min(1, j.uso / 100));
}

async function atualizaUso() {
  usoPedido ??= vivo.uso().then((d) => { usoDados = d?.erro ? usoDados : d; usoPedido = null; mostraUso_(); return d; }).catch(() => (usoPedido = null));
  return usoPedido;
}
function mostraUso_() {
  const c = cansaco();
  document.body.dataset.cansaco = c == null ? "" : c >= 1 ? "limite" : c >= 0.8 ? "muito" : c >= 0.5 ? "medio" : "pouco";
  window.cansacoClawd = c;
  // top-bar: four stamina tiles (how much is left)
  const resta = c == null ? 4 : Math.ceil((1 - c) * 4);
  botaoUso.querySelector(".folego").innerHTML = Array.from({ length: 4 }, (_, k) => `<i class="${k < resta ? "on" : ""}"></i>`).join("");
  botaoUso.title = c == null ? t("uso.usoDoPlano") : t("uso.usoDoPlanoPct", { pct: Math.round(c * 100) });
  if (janelinhas.has("uso")) desenhaJanelaUso();
}

const botaoUso = document.createElement("button");
botaoUso.className = "icone uso-btn"; botaoUso.innerHTML = '<span class="folego"></span>';
$("infoBtn").before(botaoUso);
botaoUso.onclick = abreUso;

ABRE_JANELINHA.uso = () => abreUso();
function abreUso() {
  const j = janelinha("uso", t("uso.usoDoPlano"), { largura: 440 });
  if (!j.corpo.querySelector(".academia")) {
    j.corpo.innerHTML = `<canvas class="academia"></canvas><div class="uso-info"></div>`;
    animaAcademia(j.corpo.querySelector(".academia"));
  }
  desenhaJanelaUso();
  atualizaUso();
}
// "1h 32min" until an ISO time
function tempoAte(iso) {
  const min = Math.max(0, Math.round((new Date(iso) - Date.now()) / 60000));
  if (min < 60) return t("uso.min", { min });
  const h = Math.floor(min / 60), m = min % 60;
  return h < 24 ? (m ? t("uso.horasMin", { h, m: String(m).padStart(2, "0") }) : t("uso.horas", { h })) : t("uso.dias", { n: Math.round(h / 24) });
}
// The session in large type with a live countdown, then the other windows as
// compact rows. Redrawn every 30s while open, so the countdown keeps going.
function desenhaJanelaUso() {
  const j = janelinhas.get("uso"); if (!j) return;
  const caixa = j.corpo.querySelector(".uso-info"), d = usoDados;
  if (!d) { caixa.innerHTML = `<p class="jl-vazio">${t("uso.lendo")}</p>`; return; }
  if (!d.disponivel) { caixa.innerHTML = `<p class="jl-vazio">${t("uso.indisponivel")}</p>`; return; }
  const c = cansaco(), cinco = cincoHoras();
  const estado = c == null ? "" : c >= 1 ? t("uso.dormindo") : c >= 0.95 ? t("uso.noLimite") : c >= 0.8 ? t("uso.cansado") : c >= 0.5 ? t("uso.suando") : t("uso.emForma");
  const tiles = (p) => Array.from({ length: 20 }, (_, k) => `<i class="${k < Math.round(p / 5) ? "on" : ""}" style="--k:${k}"></i>`).join("");
  const pc = cinco?.uso != null ? Math.max(0, Math.min(100, cinco.uso)) : null;
  const topo = pc == null ? "" : `<div class="uso-destaque${pc >= 80 ? " alto" : ""}">
      <div class="uso-num">${Math.round(pc)}<small>%</small></div>
      <div class="uso-sessao"><b>${t("uso.sessao5h")}</b><span>${cinco.renova ? t("uso.renovaEm", { tempo: tempoAte(cinco.renova), quando: quandoRenova(cinco.renova) }) : ""}</span><p>${estado}</p></div>
      ${d.plano ? `<span class="uso-plano">${esc(d.plano[0].toUpperCase() + d.plano.slice(1))}</span>` : ""}
    </div><div class="uso-tiles grande${pc >= 80 ? " alto" : ""}">${tiles(pc)}</div>`;
  const linhas = d.janelas.filter((x) => x.id !== "five_hour" && NOMES_JANELA[x.id] && x.uso != null).map((x) => {
    const p = Math.max(0, Math.min(100, x.uso));
    return `<div class="uso-linha${p >= 80 ? " alto" : ""}"><div class="uso-topo"><b>${NOMES_JANELA[x.id]}</b><span>${Math.round(p)}%</span></div>
      <div class="uso-tiles">${tiles(p)}</div><small>${x.renova ? t("uso.renovaEm", { tempo: tempoAte(x.renova), quando: quandoRenova(x.renova) }) : ""}</small></div>`;
  }).join("");
  caixa.innerHTML = `${topo}${linhas ? `<div class="uso-outras">${linhas}</div>` : ""}
    <div class="uso-rodape"><span>${t("uso.rodape")}</span><button class="btn" data-a="atualiza">${t("uso.atualizar")}</button></div>`;
  caixa.querySelector('[data-a="atualiza"]').onclick = atualizaUso;
}
setInterval(() => { const j = janelinhas.get("uso"); if (j?.el.classList.contains("on")) { j.corpo.querySelector(".uso-info")?.classList.add("quieto"); desenhaJanelaUso(); } }, 30000);

// ---- the gym ---------------------------------------------------------------------------
function animaAcademia(cv) {
  const W = 412, H = 176, dpr = Math.min(2, devicePixelRatio || 1), PW = 6, PH = 12;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
  const ctx = cv.getContext("2d"), gotas = [], zs = [];
  let fase = 0, ultimo = performance.now(), proxGota = 0;
  const quadro = (ms) => {
    if (!cv.isConnected) return;
    requestAnimationFrame(quadro);
    if (!janelinhas.get("uso")?.el.classList.contains("on")) return;
    const dt = Math.min(0.05, (ms - ultimo) / 1000); ultimo = ms;
    const c = cansaco() ?? 0, dorme = c >= 1, t = ms / 1000;
    const cor = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#d77757";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    // floor: a strip of mat tiles
    const chao = H - 22;
    for (let x = 6; x < W - 6; x += 14) { ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(x, chao + 4, 12, 6); }
    // stamina tiles, top left
    ctx.font = "500 11px Inter, sans-serif"; ctx.fillStyle = "rgba(236,235,231,0.55)"; ctx.fillText(globalThis.t("uso.folego"), 12, 18);
    for (let k = 0; k < 10; k++) { ctx.fillStyle = k < Math.round((1 - c) * 10) ? (c >= 0.8 ? "#e2735f" : cor) : "rgba(255,255,255,0.1)"; ctx.fillRect(58 + k * 11, 10, 9, 9); }
    const cw = CLAWD.W * PW, cx = W / 2 - cw / 2;
    if (dorme) {
      // the barbell dropped on the floor, Clawd slumped against it, asleep
      desenhaBarraPixel(ctx, W / 2, chao - 4 * PW + 2, PW);
      desenhaClawd(ctx, { x: cx, y: chao - CLAWD.H * PH + 8 + Math.round(Math.sin(t * 1.3)) * 2, pw: PW, ph: PH, cor, fechado: true, pernas: [6, 6, 6, 6] });
      if (Math.random() < dt * 1.2) zs.push({ x: cx + cw - 6, y: chao - CLAWD.H * PH, t: ms, s: 10 + Math.random() * 6 });
    } else {
      // reps: full and quick when fresh; tired, the bar goes half way; at the
      // end it barely leaves his head and he shakes
      const ritmo = 2.4 - c * 1.8;
      fase += dt * ritmo;
      const onda = (1 - Math.cos(fase * Math.PI * 2)) / 2;
      const sobe = c >= 0.95 ? (onda > 0.6 ? 0.25 : 0) : onda * (c >= 0.8 ? 0.5 : c >= 0.5 ? 0.75 : 1);
      const treme = c >= 0.95 ? (Math.floor(t * 18) % 2 ? 1 : -1) : c >= 0.8 ? (Math.floor(t * 10) % 2 ? 1 : 0) : 0;
      const cy = chao - CLAWD.H * PH + 2, barraY = cy - (1 + Math.round(sobe * 4)) * PW;
      const esforco = c >= 0.8 ? sobe > 0.1 : c >= 0.5 && sobe > 0.6;
      desenhaSupino(ctx, { x: cx, y: cy, pw: PW, ph: PH, cor, sobe, treme, fechado: esforco || t % 3.7 < 0.12 });
      // sweat
      if (c >= 0.5 && ms > proxGota) { proxGota = ms + (c >= 0.8 ? 220 : 650); gotas.push({ x: cx + (Math.random() < 0.5 ? 2 : cw - 4), y: cy + 4, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, t: ms }); }
      if (c < 0.5 && Math.floor(fase) !== Math.floor(fase - dt * ritmo) && Math.random() < 0.6) zs.push({ x: W / 2 + (Math.random() - 0.5) * 120, y: barraY - 6, t: ms, s: 11, brilho: true });
    }
    for (let k = gotas.length - 1; k >= 0; k--) {
      const g = gotas[k], s = (ms - g.t) / 1000; if (s > 0.9) { gotas.splice(k, 1); continue; }
      ctx.globalAlpha = 1 - s / 0.9; ctx.fillStyle = "#8fc9e8"; ctx.fillRect(g.x + g.vx * s, g.y + g.vy * s + 160 * s * s, 3, 5);
    }
    for (let k = zs.length - 1; k >= 0; k--) {
      const z = zs[k], s = (ms - z.t) / 1000; if (s > 2) { zs.splice(k, 1); continue; }
      ctx.globalAlpha = Math.sin((s / 2) * Math.PI); ctx.fillStyle = z.brilho ? cor : "#ecebe7"; ctx.font = `600 ${z.s}px ${getComputedStyle(document.body).getPropertyValue("--mono")}`;
      ctx.fillText(z.brilho ? "✻" : "z", z.x + Math.sin(s * 3) * 6, z.y - s * 26);
    }
    ctx.globalAlpha = 1;
  };
  requestAnimationFrame(quadro);
}

setInterval(() => { if (janelinhas.has("uso") && janelinhas.get("uso").el.classList.contains("on")) atualizaUso(); }, 60000);
setInterval(atualizaUso, 5 * 60000);
vivo.aoEvento((ev) => { if (ev.tipo === "parado") setTimeout(atualizaUso, 1500); if (ev.tipo === "limite" && ev.info?.status === "rejected") { usoDados ??= { disponivel: true, janelas: [] }; atualizaUso(); } });
setTimeout(atualizaUso, 2500);
ACOES_RADIAL.splice(5, 0, [t("uso.uso"), svg('<rect x="3" y="7" width="4" height="10" rx="1"/><rect x="10" y="7" width="4" height="10" rx="1"/><rect x="17" y="7" width="4" height="10" rx="1"/>'), () => abreUso()]);
