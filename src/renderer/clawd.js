// Clawd, Claude Code's pixel mascot, standing next to the message box. He
// follows what Claude is doing: bobs while thinking, types while writing or
// using tools, waves with a "!" when Claude needs the person, jumps when a
// turn ends, shakes on errors, blinks and looks at the pointer when idle.
// Drawn from the same quadrant glyphs Claude Code uses at start-up, so each
// pixel is twice as tall as it is wide, like a terminal cell.

// What he says when touched, grabbed or dropped. Plenty, so it rarely repeats.
const FALAS_TOQUE = t("clawd.toque");
const FALAS_PEGO = t("clawd.pego");
const FALAS_CAI = t("clawd.cai");
function falasDaHora() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return t("clawd.horaManha");
  if (h >= 12 && h < 14) return t("clawd.horaAlmoco");
  if (h >= 18 && h < 24) return t("clawd.horaNoite");
  if (h < 5) return t("clawd.horaMadrugada");
  return t("clawd.horaTarde");
}

const Clawd = (() => {
  const LINHAS = [" ▐▛███▜▌", "▝▜█████▛▘", "  ▘▘ ▝▝"];
  const Q = { " ": [0, 0, 0, 0], "█": [1, 1, 1, 1], "▐": [0, 1, 0, 1], "▌": [1, 0, 1, 0], "▛": [1, 1, 1, 0], "▜": [1, 1, 0, 1], "▝": [0, 1, 0, 0], "▘": [1, 0, 0, 0] };
  const corpo = [];
  LINHAS.forEach((l, j) => [...l].forEach((c, i) => Q[c].forEach((v, k) => v && corpo.push([i * 2 + (k & 1), j * 2 + (k >> 1)]))));
  const x0 = Math.min(...corpo.map((p) => p[0])), y0 = Math.min(...corpo.map((p) => p[1]));
  const PIX = corpo.map(([x, y]) => [x - x0, y - y0]);            // 16 × 5
  const OLHOS = [[4, 1], [11, 1]];
  const BRACOS = PIX.filter(([x, y]) => y === 2 && (x < 2 || x > 13));
  const PERNAS = PIX.filter(([, y]) => y === 4);
  const RESTO = PIX.filter((p) => !BRACOS.includes(p) && !PERNAS.includes(p));

  const PW = 4, PH = 8, W = 16 * PW, H = 5 * PH, MARGEM = 18;   // drawing area around him
  const cv = document.createElement("canvas"), balao = document.createElement("div"), caixa = document.createElement("div");
  caixa.className = "clawd"; balao.className = "clawd-balao"; caixa.append(balao, cv);
  caixa.title = t("clawd.titulo");
  const dpr = Math.min(2, devicePixelRatio || 1), CW = W + MARGEM * 2, CH = H + MARGEM * 2;
  cv.width = CW * dpr; cv.height = CH * dpr; cv.style.width = CW + "px"; cv.style.height = CH + "px";
  const ctx = cv.getContext("2d");
  document.querySelector("main").append(caixa);

  let estado = "parado", desde = performance.now(), pulo = 0, tremor = 0, piscaAte = 0, proxPisca = performance.now() + 2500, olhar = 0, mouseX = null, ligado = true;
  const FALAS = { pensando: [t("clawd.pensando")], escrevendo: [t("clawd.escrevendo")], esperando: [t("clawd.esperando")], erro: [t("clawd.erro")], pronto: [t("clawd.pronto")] };
  const VERBO = { Read: t("clawd.lendo"), Glob: t("clawd.procurando"), Grep: t("clawd.buscando"), Edit: t("clawd.editando"), MultiEdit: t("clawd.editando"), Write: t("clawd.escrevendoArquivo"), Bash: t("clawd.rodandoComando"), PowerShell: t("clawd.rodandoComando"), WebFetch: t("clawd.lendoWeb"), WebSearch: t("clawd.pesquisando"), Task: t("clawd.chamandoAjuda"), Agent: t("clawd.chamandoAjuda"), TodoWrite: t("clawd.planejando") };
  let timerBalao = null;
  function fala(texto, ms = 0) {
    clearTimeout(timerBalao);
    if (!texto) { balao.classList.remove("on"); return; }
    balao.textContent = texto; balao.classList.add("on");
    balao.classList.toggle("longo", texto.length > 22); fala.ultima = performance.now();
    if (ms) timerBalao = setTimeout(() => balao.classList.remove("on"), ms);
  }
  const sorteia = (l) => l[Math.floor(Math.random() * l.length)];
  // other parts of the app can hand him a line (a new version, say)
  addEventListener("clawd-diz", ({ detail }) => { if (ligado) fala(detail.texto, detail.ms || 3500); });

  addEventListener("estado-claude", ({ detail }) => {
    const e = detail.estado; desde = performance.now();
    if (e === "parado") { estado = "parado"; if (detail.terminou) { pulo = performance.now(); fala(sorteia(FALAS.pronto), 2200); } else fala(""); return; }
    estado = e;
    if (e === "erro") { tremor = performance.now(); fala(FALAS.erro[0], 1800); }
    else if (e === "ferramenta") fala(VERBO[detail.nome] || (detail.nome?.startsWith("mcp__claudinho__") ? t("clawd.mexendoVisual") : t("clawd.trabalhando")));
    else fala(sorteia(FALAS[e] || ["…"]));
  });
  addEventListener("mousemove", (e) => (mouseX = e.clientX));

  // ---- free: grab him, swing him, drop him; he walks back to his spot -----------
  // modo: casa (beside the box) · arrastado · cai · tonto · volta
  let modo = "casa", x = 0, y = 0, vx = 0, vy = 0, ang = 0, angV = 0, pvx = 0, pvxAnt = 0, jogado = false, tontoAte = 0, dir = -1, passo = 0;
  let casa = { x: 0, y: 0 }, mainR = { left: 0, top: 0, width: 0 }, segura = null, cliques = [];
  const G = 2600;
  cv.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    try { cv.setPointerCapture(e.pointerId); } catch { /* already released */ }
    if (modo === "casa") { x = casa.x; y = casa.y; }
    segura = { dx: e.clientX - mainR.left - x, dy: e.clientY - mainR.top - y, x0: e.clientX, y0: e.clientY, moveu: false, am: [] };
    pvx = pvxAnt = 0;
  });
  cv.addEventListener("pointermove", (e) => {
    if (!segura) return;
    if (!segura.moveu && Math.hypot(e.clientX - segura.x0, e.clientY - segura.y0) > 5) {
      segura.moveu = true; modo = "arrastado"; ang = angV = 0; caixa.classList.add("livre");
      caixa.style.transformOrigin = `${segura.dx}px ${segura.dy}px`;
      fala(sorteia(FALAS_PEGO), 1600);
    }
    if (modo !== "arrastado") return;
    x = e.clientX - mainR.left - segura.dx; y = e.clientY - mainR.top - segura.dy;
    const am = segura.am; am.push([e.clientX, e.clientY, performance.now()]); if (am.length > 5) am.shift();
    if (am.length > 1) { const a = am[am.length - 2], b = am[am.length - 1]; pvx = pvx * 0.5 + ((b[0] - a[0]) / Math.max(0.008, (b[2] - a[2]) / 1000)) * 0.5; }
  });
  const solta = () => {
    if (!segura) return;
    const s = segura; segura = null;
    if (!s.moveu) { toque(); return; }
    const a = s.am, p = a[0], u = a[a.length - 1], dt = Math.max(0.016, ((u?.[2] ?? 0) - (p?.[2] ?? 0)) / 1000);
    vx = p ? Math.max(-1400, Math.min(1400, (u[0] - p[0]) / dt)) : 0; vy = p ? Math.max(-1600, Math.min(1600, (u[1] - p[1]) / dt)) : 0;
    modo = "cai"; jogado = true;
  };
  cv.addEventListener("pointerup", solta); cv.addEventListener("pointercancel", solta);

  // a touch: a jump and a line; quick touches in a row get their own answers
  function toque() {
    pulo = performance.now(); window.somEvento?.("clique");
    const agora = performance.now();
    cliques = cliques.filter((t) => agora - t < 1300); cliques.push(agora);
    const n = cliques.length;
    if (n === 4) return fala(t("clawd.calma"), 1600);
    if (n === 7) return fala(t("clawd.vouContar"), 1800);
    if (n >= 10) { cliques = []; giro = agora; return fala(t("clawd.voceVenceu"), 2200); }
    if (n > 1) return;
    if (Math.random() < 0.25 && window.clawdConversa?.(true)) return;
    fala(sorteia([...FALAS_TOQUE, ...falasDaHora()]), 2600);
  }
  let giro = -9;

  function posiciona() {
    const comp = document.getElementById("composer").getBoundingClientRect(), main = document.querySelector("main").getBoundingClientRect();
    mainR = { left: main.left, top: main.top, width: main.width };
    casa = { x: comp.left - main.left - CW + 6, y: comp.bottom - main.top - CH + MARGEM - 4 };
    if (modo === "casa") {
      caixa.style.transform = `translate(${casa.x}px, ${casa.y}px)`;
      caixa.classList.toggle("sem-espaco", casa.x <= 4);
    }
    // what he says stays in the margin left of the message box, never over the chat
    const margem = comp.left - main.left;
    caixa.style.setProperty("--margem", margem + "px"); Clawd.margem = margem;
  }
  // free movement, one step per frame
  function anda(dt, ms) {
    if (modo === "arrastado") {
      const acc = (pvx - pvxAnt) / Math.max(dt, 0.008); pvxAnt = pvx; pvx *= Math.exp(-6 * dt);
      angV += (-17 * Math.sin(ang) + acc * 0.0018 + pvx * 0.0016) * dt;
      angV *= Math.exp(-0.6 * dt); ang = Math.max(-1.3, Math.min(1.3, ang + angV * dt));
    } else if (modo === "cai") {
      vy += G * dt; x += vx * dt; y += vy * dt; vx *= 0.995; ang *= Math.exp(-5 * dt);
      const max = mainR.width - CW;
      if (x < -MARGEM || x > max) { x = Math.max(-MARGEM, Math.min(max, x)); vx = -vx * 0.5; }
      if (y >= casa.y) {
        y = casa.y; ang = 0; caixa.style.transformOrigin = "";
        if (vy > 700) { vy = -vy * 0.32; vx *= 0.6; }
        else if (jogado && vy > 380) { modo = "tonto"; tontoAte = ms + 1300; fala(sorteia(FALAS_CAI), 1500); }
        else { modo = "volta"; fala(sorteia(FALAS_CAI), 1400); }
      }
    } else if (modo === "tonto") {
      if (ms > tontoAte) modo = "volta";
    } else if (modo === "volta") {
      y = casa.y; dir = Math.sign(casa.x - x) || dir; x += dir * 110 * dt; passo += dt * 9;
      if ((dir > 0 && x >= casa.x) || (dir < 0 && x <= casa.x)) { modo = "casa"; caixa.classList.remove("livre"); posiciona(); return; }
    }
    if (modo !== "casa") caixa.style.transform = `translate(${x}px, ${y}px) rotate(${ang}rad)`;
  }

  // layout and colour are read a few times a second, not every frame (each
  // read forces the browser to recompute layout or styles)
  let cor = "#d77757", centro = 0, ultimoQ = 0;
  const mede = () => {
    if (!ligado) return;
    posiciona();
    cor = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#d77757";
    centro = caixa.getBoundingClientRect().left + CW / 2;
  };
  setInterval(mede, 400); addEventListener("resize", mede);
  new ResizeObserver(mede).observe(document.getElementById("composer"));
  window.capFps = (ms, ultimo) => { const d = window.desempenho, fps = d ? (document.hasFocus() ? d.fps : d.fpsFora) : 60; return !!fps && ms - ultimo < 1000 / fps - 4; };

  function desenha(ms) {
    requestAnimationFrame(desenha);
    ligado = !(typeof visualAtual === "function" && visualAtual().geral?.clawd === false);
    caixa.classList.toggle("off", !ligado);
    if (!ligado || document.hidden || (modo === "casa" && window.capFps(ms, ultimoQ))) return;
    const dtq = Math.min(0.05, (ms - (ultimoQ || ms)) / 1000);
    ultimoQ = ms;
    anda(dtq, ms);
    const t = ms / 1000, dt = (ms - desde) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, CW, CH);
    // whole-body motion
    let dy = 0, dx = 0;
    const cans = window.cansacoClawd ?? 0, dormindo = modo === "casa" && estado === "parado" && cans >= 1;
    if (modo === "casa") {
      if (estado === "parado") dy = dormindo ? 2 + Math.sin(t * 0.9) * 1 : Math.sin(t * (cans >= 0.8 ? 0.9 : 1.6)) * 1.2;
      if (estado === "pensando") dy = Math.sin(t * 4) * 2.2;
      if (estado === "escrevendo" || estado === "ferramenta") dy = Math.abs(Math.sin(t * 9)) * -1.6;
      if (estado === "esperando") dy = Math.sin(t * 6) * 1.5;
    }
    if (modo === "volta") dy = Math.floor(passo) % 2 ? -1 : 0;
    const p = (ms - pulo) / 600; if (p >= 0 && p < 1) dy -= Math.sin(p * Math.PI) * 14;
    const q = (ms - tremor) / 500; if (q >= 0 && q < 1) dx = Math.sin(q * 40) * 3 * (1 - q);
    const ox = MARGEM + dx, oy = MARGEM + dy;
    const px = (x, y, c = cor) => { ctx.fillStyle = c; ctx.fillRect(Math.round(ox + x * PW), Math.round(oy + y * PH), PW, PH); };
    // the 10-click spin
    const gp = (ms - giro) / 700;
    if (gp >= 0 && gp < 1) { ctx.translate(CW / 2, CH / 2); ctx.rotate(gp * Math.PI * 2); ctx.translate(-CW / 2, -CH / 2); }
    // body without eyes, arms and legs
    for (const [x, y] of RESTO) px(x, y);
    // eyes: holes that look toward the pointer, closed when blinking
    if (ms > proxPisca) { piscaAte = ms + 130; proxPisca = ms + 2500 + Math.random() * 3500; }
    const alvo = modo === "volta" ? dir : modo === "arrastado" ? (ang > 0.2 ? -1 : ang < -0.2 ? 1 : 0)
      : estado === "parado" && mouseX != null ? Math.max(-1, Math.min(1, Math.round((mouseX - centro) / 160))) : estado === "escrevendo" || estado === "ferramenta" ? 1 : 0;
    olhar += (alvo - olhar) * 0.15;
    const o = Math.round(olhar), tonto = modo === "tonto";
    const sonolento = dormindo || tonto && Math.floor(t * 6) % 2 === 0 || (modo === "casa" && estado === "parado" && cans >= 0.8 && Math.floor(t / 3) % 2 === 0);
    for (const [ex, ey] of OLHOS) { px(ex, ey); if (ms > piscaAte && !sonolento) { ctx.clearRect(Math.round(ox + (ex + o) * PW), Math.round(oy + (ey + (modo === "arrastado" ? 0.25 : 0)) * PH), PW, PH); } }
    // arms: typing goes up and down in turn, waving raises one high, held up when carried
    for (const [x, y] of BRACOS) {
      const esquerdo = x < 8;
      let ay = 0;
      if (modo === "arrastado" || (modo === "cai" && vy < 0)) ay = -1.5;
      else if (modo === "volta") ay = (Math.floor(passo) + (esquerdo ? 0 : 1)) % 2 ? -0.5 : 0;
      else if (modo === "casa") {
        if (estado === "escrevendo" || estado === "ferramenta") ay = (Math.floor(t * 8) + (esquerdo ? 0 : 1)) % 2 ? -0.5 : 0.5;
        if (estado === "esperando" && !esquerdo) ay = -1 - (Math.floor(t * 4) % 2);
        if (estado === "pensando" && esquerdo) ay = -0.5;
      }
      ctx.fillStyle = cor; ctx.fillRect(Math.round(ox + x * PW), Math.round(oy + (y + ay) * PH), PW, PH);
    }
    // legs: a shuffle while working, steps on the way home, dangling when carried
    PERNAS.forEach(([x, y], i) => {
      let lev = 0;
      if (modo === "arrastado") lev = (i % 2 === (angV > 0 ? 0 : 1)) ? 3 : 1;
      else if (modo === "volta") lev = (Math.floor(passo) + i) % 2 ? -3 : 0;
      else if (modo === "casa" && (estado === "ferramenta" || estado === "escrevendo") && (Math.floor(t * 6) + i) % 2) lev = -2;
      ctx.fillStyle = cor; ctx.fillRect(Math.round(ox + x * PW), Math.round(oy + y * PH + lev), PW, PH);
    });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // dizzy: three little stars around the head
    if (tonto) { ctx.fillStyle = "#f5c66b"; for (let k = 0; k < 3; k++) { const a = t * 6 + (k * Math.PI * 2) / 3; ctx.fillRect(Math.round(ox + W / 2 + Math.cos(a) * 22 - 2), Math.round(oy - 6 + Math.sin(a) * 5), 4, 4); } }
    // asleep at the plan limit: drifting z's
    if (dormindo) { ctx.fillStyle = cor; ctx.font = "600 10px sans-serif"; for (let k = 0; k < 2; k++) { const f = (t * 0.5 + k / 2) % 1; ctx.globalAlpha = Math.sin(f * Math.PI); ctx.fillText("z", ox + W + 2 + f * 8, oy - 2 - f * 16); } ctx.globalAlpha = 1; }
    // thinking: three dots rising over the head
    if (modo === "casa" && estado === "pensando") for (let k = 0; k < 3; k++) {
      const f = (t * 1.4 + k / 3) % 1;
      ctx.globalAlpha = Math.sin(f * Math.PI); ctx.fillStyle = cor;
      ctx.fillRect(Math.round(ox + 9 * PW + k * 6), Math.round(oy - 4 - f * 12), 3, 3);
      ctx.globalAlpha = 1;
    }
    // waiting: a blinking "!"
    if (modo === "casa" && estado === "esperando" && Math.floor(t * 3) % 2) { ctx.fillStyle = cor; ctx.fillRect(ox + W + 4, oy - 6, 3, 9); ctx.fillRect(ox + W + 4, oy + 5, 3, 3); }
  }
  requestAnimationFrame(desenha);
  return { fala, get estado() { return estado; }, margem: 0 };
})();

// ---- the big Clawd on the welcome screen ------------------------------------------------
// He follows the pointer with his eyes (even up when it is above him), waves
// and says hi when hovered, jumps with a burst of sparks when clicked, hops
// now and then, and falls asleep when the pointer stays still for a while.
function clawdGrande(cv) {
  if (cv._vivo) return; cv._vivo = true;
  const PW = 9, PH = 18, M = 34, W = CLAWD.W * PW + M * 2, H = CLAWD.H * PH + M * 2 + 10, dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
  const ctx = cv.getContext("2d"), balao = document.createElement("div");
  balao.className = "clawd-balao no-cartao"; cv.after(balao);
  let mx = null, my = null, ultimoMov = performance.now(), dentro = false, pulo = -9, proxPisca = 0, piscaAte = 0, proxHop = performance.now() + 6000, timerB = null;
  const faiscas = [];
  const fala = (t, ms = 1800) => { clearTimeout(timerB); balao.textContent = t; balao.classList.add("on"); timerB = setTimeout(() => balao.classList.remove("on"), ms); };
  const FRASES = [...FALAS_TOQUE, ...falasDaHora()];
  const mexe = (e) => { mx = e.clientX; my = e.clientY; ultimoMov = performance.now(); };
  addEventListener("pointermove", mexe);
  cv.addEventListener("pointerenter", () => { dentro = true; fala(t("clawd.oi"), 1200); });
  cv.addEventListener("pointerleave", () => (dentro = false));
  cv.addEventListener("click", () => {
    pulo = performance.now(); fala(FRASES[Math.floor(Math.random() * FRASES.length)], 2400);
    for (let k = 0; k < 16; k++) faiscas.push({ x: W / 2, y: M + PH * 2, vx: (Math.random() - 0.5) * 260, vy: -120 - Math.random() * 220, t: performance.now(), g: "✻·+*"[k % 4] });
    window.somEvento?.("clique");
  });
  let r = cv.getBoundingClientRect(), acento = "#d77757", mono = "monospace", medido = 0, ultimoQ = 0;
  const quadro = (ms) => {
    if (!cv.isConnected) { removeEventListener("pointermove", mexe); return; }
    requestAnimationFrame(quadro);
    if (document.hidden || window.capFps?.(ms, ultimoQ)) return;
    ultimoQ = ms;
    // position and colours a few times a second, not every frame
    if (ms - medido > 350) { medido = ms; r = cv.getBoundingClientRect(); const cs = getComputedStyle(document.body); acento = cs.getPropertyValue("--accent").trim() || "#d77757"; mono = cs.getPropertyValue("--mono"); }
    const t = ms / 1000, cx = r.left + W / 2, cy = r.top + M + PH * 1.5;
    const dormindo = (ms - ultimoMov > 40000 && !dentro) || (window.cansacoClawd ?? 0) >= 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    let dy = Math.sin(t * 1.8) * 1.5;
    if (ms > proxHop && !dormindo) { pulo = ms; proxHop = ms + 7000 + Math.random() * 6000; }
    const p = (ms - pulo) / 650;
    if (p >= 0 && p < 1) dy -= Math.sin(p * Math.PI) * (pulo === proxHop ? 10 : 26);
    if (dentro) dy += Math.abs(Math.sin(t * 7)) * -3;
    if (dormindo) dy = Math.sin(t * 1.2) * 2.5 + 3;
    // eyes toward the pointer
    let olhar = [0, 0];
    if (mx != null && !dormindo) { olhar = [Math.abs(mx - cx) < 40 ? 0 : Math.sign(mx - cx), my < cy - 60 ? -1 : 0]; }
    if (ms > proxPisca) { piscaAte = ms + 140; proxPisca = ms + 2200 + Math.random() * 3800; }
    const aceno = dentro ? (Math.floor(t * 5) % 2 ? 2 : 1) : p >= 0 && p < 1 ? 1 : 0;
    const pernas = p >= 0 && p < 0.9 ? [2, 2, 2, 2] : dentro ? [0, Math.floor(t * 8) % 2 * 3, 0, Math.floor(t * 8 + 1) % 2 * 3] : [0, 0, 0, 0];
    // shadow on the ground
    ctx.fillStyle = "rgba(0,0,0,0.28)"; const sw = CLAWD.W * PW * (1 - Math.max(0, -dy) / 70);
    ctx.beginPath(); ctx.ellipse(W / 2, M + CLAWD.H * PH + 8, sw / 2.4, 4, 0, 0, Math.PI * 2); ctx.fill();
    desenhaClawd(ctx, { x: M, y: M + dy, pw: PW, ph: PH, cor: acento, olhar, fechado: dormindo || ms < piscaAte, braco: [p >= 0 && p < 1 ? 1 : 0, aceno], pernas });
    // sleeping Zs
    if (dormindo) { ctx.fillStyle = acento; ctx.font = `600 14px ${mono}`; for (let k = 0; k < 3; k++) { const f = (t * 0.5 + k / 3) % 1; ctx.globalAlpha = Math.sin(f * Math.PI); ctx.fillText("z", W - M + f * 16, M + 4 - f * 30); } ctx.globalAlpha = 1; }
    // sparks
    ctx.font = `600 13px ${mono}`; ctx.textAlign = "center";
    for (let k = faiscas.length - 1; k >= 0; k--) {
      const f = faiscas[k], s = (ms - f.t) / 1000;
      if (s > 0.9) { faiscas.splice(k, 1); continue; }
      ctx.globalAlpha = 1 - s / 0.9; ctx.fillStyle = k % 3 ? acento : "#f3e8d8";
      ctx.fillText(f.g, f.x + f.vx * s, f.y + f.vy * s + 300 * s * s);
    }
    ctx.globalAlpha = 1; ctx.textAlign = "left";
  };
  requestAnimationFrame(quadro);
}
// The welcome screen is redrawn often (new conversation, folder change): any
// big Clawd canvas that shows up comes alive.
new MutationObserver(() => document.querySelectorAll("canvas.clawd-grande").forEach(clawdGrande)).observe(document.getElementById("col"), { childList: true, subtree: true });
document.querySelectorAll("canvas.clawd-grande").forEach(clawdGrande);

// The companion greets the pointer too (not while he is talking).
document.querySelector(".clawd")?.addEventListener("pointerenter", () => { if (!document.querySelector(".clawd-balao.on")) Clawd.fala(t("clawd.oi"), 1000); });

// ---- Clawd talks ------------------------------------------------------------------------
// While Claude is idle he chimes in every couple of minutes: something about
// the project in front of him, a curiosity about Claude and Anthropic, a tip
// about the app, or recent news (one quick web search a day, cached). A click
// on him brings the next one at once. Never while the person is typing.
const CURIOSIDADES = t("clawd.curiosidades");
const DICAS = t("clawd.dicas");
let novidades = [], buscouNovidades = false;
const hora = () => new Date().getHours();
// Lines about what is on screen right now.
function sobreOProjeto() {
  const l = [], pasta = ($("pasta").title || "").split(/[\/]/).filter(Boolean).pop();
  const doProjeto = (typeof sessoes !== "undefined" ? sessoes : []).filter((s) => s.cwd === $("pasta").title);
  if (pasta) l.push(doProjeto.length > 1 ? t("clawd.jaTivemos", { n: doProjeto.length, pasta }) : t("clawd.primeiraVez", { pasta }));
  const arquivos = typeof alteracoes === "function" ? alteracoes().size : 0;
  if (arquivos) l.push(t("clawd.mexemosArquivos", { n: arquivos }));
  const ctx = parseInt($("medidor")?.textContent || "0", 10);
  if (ctx >= 70) l.push(t("clawd.contextoEm", { ctx }));
  const c = window.cansacoClawd;
  if (c != null && c >= 0.8 && c < 1) l.push(t("clawd.sessaoUsada", { p: Math.round(c * 100) }));
  if (hora() >= 0 && hora() < 5) l.push(t("clawd.jaMadrugada"));
  if (hora() >= 12 && hora() < 14) l.push(t("clawd.horaDoAlmoco"));
  return l;
}
let vez = 0, proxima = performance.now() + 75000;
function clawdConversa(agora) {
  const g = typeof visualAtual === "function" ? visualAtual().geral || {} : {};
  if (g.clawd === false || g.clawdFala === false) return false;
  if (Clawd.estado !== "parado" || (!agora && (entrada.value.trim() || document.hidden))) return false;
  if (Clawd.margem < 170) return false;   // no room beside the box: he keeps quiet
  if (!agora && performance.now() < proxima) return false;
  if (g.novidades !== false && !buscouNovidades) { buscouNovidades = true; vivo.novidades?.().then((n) => (novidades = Array.isArray(n) ? n : [])).catch(() => {}); }
  const fontes = [sobreOProjeto(), CURIOSIDADES, DICAS, novidades.map((n) => t("clawd.novidade", { texto: n }))];
  let linha = "";
  for (let k = 0; k < 4 && !linha; k++) { const f = fontes[(vez + k) % 4]; if (f.length) linha = f[Math.floor(Math.random() * f.length)]; }
  vez++;
  proxima = performance.now() + 110000 + Math.random() * 70000;
  if (!linha) return false;
  Clawd.fala(linha, Math.min(14000, 4000 + linha.length * 70));
  return true;
}
window.clawdConversa = clawdConversa;
setInterval(() => clawdConversa(false), 15000);

// ---- peeking out of the sidebar ---------------------------------------------------------
// Now and then, hovering a project or a conversation makes a small Clawd peek
// out from behind the sidebar's edge, hold on with one arm, look at it, blink
// and slide back into hiding.
(() => {
  const PW = 3, PH = 6, M = 4, W = CLAWD.W * PW + M * 2, H = CLAWD.H * PH + M * 2, dpr = Math.min(2, devicePixelRatio || 1);
  const caixa = document.createElement("div"), cv = document.createElement("canvas");
  caixa.className = "clawd-espia"; caixa.append(cv); document.body.append(caixa);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
  const ctx = cv.getContext("2d");
  const desenha = (fechado) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    desenhaClawd(ctx, { x: M, y: M, pw: PW, ph: PH, cor: getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#d77757", olhar: [-1, 0], fechado, braco: [1, 0] });
  };
  let ultima = -1e9, ocupado = false;
  document.getElementById("lista").addEventListener("pointerover", (e) => {
    const alvo = e.target.closest(".item, .projeto");
    if (!alvo || ocupado || document.body.classList.contains("recolhido")) return;
    if (typeof visualAtual === "function" && visualAtual().geral?.clawd === false) return;
    const agora = performance.now();
    if (agora - ultima < 20000 || Math.random() > 0.22) return;
    ultima = agora; ocupado = true;
    const side = document.getElementById("side").getBoundingClientRect(), r = alvo.getBoundingClientRect();
    caixa.style.left = side.right - 1 + "px"; caixa.style.top = Math.round(r.top + r.height / 2 - H / 2) + "px";
    desenha(false); caixa.classList.remove("on"); void caixa.offsetWidth; caixa.classList.add("on");
    setTimeout(() => desenha(true), 1150); setTimeout(() => desenha(false), 1300);
    setTimeout(() => { caixa.classList.remove("on"); ocupado = false; }, 2700);
  });
})();
