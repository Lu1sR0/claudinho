// Opening: a faint field of glyphs lights up, Clawd's pixels drop in as
// tiles and lock into place (then he blinks), the name assembles from small tiles under a
// sweep of light, the tagline types itself, then a circle opens from the
// centre and reveals the app underneath. A click or a key skips to the
// reveal; after the first launch the whole thing is shorter.

function boasVindas(aoAbrir) {
  const cv = document.getElementById("intro"), ctx = cv.getContext("2d");
  const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  let primeira = true;
  try { primeira = !localStorage.getItem("jaAbriu"); localStorage.setItem("jaAbriu", "1"); } catch {}
  const r = primeira ? 1 : 0.62;                      // time scale
  const T = { campo: 0.5 * r, marca: 0.35 * r, nome: 0.8 * r, frase: 1.55 * r, revela: (primeira ? 2.75 : 1.7), fim: (primeira ? 3.55 : 2.4) };
  const FRASE = t("intro.frase");
  const FUNDO = "#171615", ACENTO = "#d97757";
  const RAMP = "8%XSSt%t;:";
  const fora = (t) => 1 - Math.pow(1 - t, 3);
  const mola = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const cl = (v) => Math.max(0, Math.min(1, v));

  // Layout: Clawd above, the name below him. Each of his pixels is a tile,
  // twice as tall as wide like a terminal cell.
  const unidade = Math.max(34, Math.min(W, H) * 0.075), gap = unidade * 0.22;
  const cx = W / 2, cyMarca = H * 0.34;
  const tw = Math.max(9, Math.min(W * 0.022, unidade * 0.34)), th = tw * 2;
  const ladrilhos = CLAWD.PIX.map(([i, j]) => ({
    x: cx + (i - CLAWD.W / 2 + 0.5) * tw, y: cyMarca + (j - CLAWD.H / 2 + 0.5) * th,
    atraso: (i * 0.022 + j * 0.06) * r, giro: (Math.random() - 0.5) * 2.4, alto: H * (0.35 + Math.random() * 0.3),
  }));

  // The name, sampled into small tiles.
  // The name in a 5×7 pixel font of its own, one tile per pixel, so every
  // letter stays sharp at any size.
  const FONTE = {
    T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
    L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
    U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
    H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  };
  const NOME = "CLAUDINHO", passo = Math.max(9, Math.min(W / (NOME.length * 6 + 2), unidade * 0.3));
  const cw = passo, ch = passo, corpo = passo * 7;
  const cyNome = cyMarca + th * 2.5 + gap + passo * 3.5 + unidade * 0.6;
  const x0 = cx - ((NOME.length * 6 - 1) * passo) / 2, y0 = cyNome - 3.5 * passo, letras = [];
  [...NOME].forEach((c, li) => FONTE[c].forEach((linha, j) => [...linha].forEach((v, i) => {
    if (v !== "#") return;
    const x = x0 + (li * 6 + i) * passo + passo / 2, y = y0 + j * passo + passo / 2;
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 260;
    letras.push({ x, y, sx: x + Math.cos(a) * d, sy: y + Math.sin(a) * d, atraso: (li / NOME.length) * 0.4 * r + Math.random() * 0.08, fuga: a });
  })));

  let inicio = null, liberou = false, acabou = false, pulou = false;
  const libera = () => { if (!liberou) { liberou = true; aoAbrir(); } };
  const pula = () => { if (!pulou && inicio !== null) { pulou = true; const agora = performance.now() / 1000; inicio = Math.min(inicio, agora - T.revela); } };
  addEventListener("pointerdown", pula); addEventListener("keydown", pula);

  function quadro(ms) {
    if (acabou) return;
    const agora = ms / 1000;
    if (inicio === null) inicio = agora;
    const t = agora - inicio;
    ctx.clearRect(0, 0, W, H);

    // Background with the reveal: a soft-edged hole that grows from the centre.
    const rev = cl((t - T.revela) / (T.fim - T.revela)), raio = fora(rev) * Math.hypot(W, H) * 0.62;
    ctx.fillStyle = FUNDO; ctx.fillRect(0, 0, W, H);
    if (rev > 0) {
      ctx.save(); ctx.globalCompositeOperation = "destination-out";
      const g = ctx.createRadialGradient(cx, H * 0.48, Math.max(0, raio - 120), cx, H * 0.48, raio);
      g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      if (rev > 0.05) libera();
    }
    const some = 1 - cl(rev * 1.6);

    // Glyph field: faint, brighter in a ring that follows the reveal.
    ctx.font = `500 11px "Geist Mono", monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const acende = cl(t / T.campo);
    for (let y = 9; y < H; y += 18) for (let x = 7; x < W; x += 14) {
      const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1, d = Math.hypot(x - cx, y - H * 0.48);
      let a = 0.05 * acende * (0.5 + Math.abs(n));
      if (rev > 0) a += Math.max(0, 1 - Math.abs(d - raio) / 70) * 0.5;
      if (d < raio - 100) continue;
      if (a < 0.02) continue;
      ctx.fillStyle = `rgba(236,235,231,${a})`;
      ctx.fillText(RAMP[(Math.abs((n * 100) | 0) + Math.floor(t * 6)) % RAMP.length], x, y);
    }

    // Clawd's tiles, falling into place; once he is whole he blinks.
    ctx.font = `600 ${Math.round(tw * 0.9)}px "Geist Mono", monospace`;
    const montado = t - T.marca - 0.9 * r, pisca = montado > 0.15 && montado < 0.3;
    for (const l of ladrilhos) {
      const u = cl((t - T.marca - l.atraso) / (0.55 * r));
      if (u <= 0) continue;
      const e = mola(u), y = l.y - (1 - e) * l.alto, ang = (1 - e) * l.giro;
      const sai = rev > 0 ? fora(cl(rev * 1.4)) : 0;
      ctx.save(); ctx.translate(l.x + (l.x - cx) * sai * 2.2, y + (l.y - cyMarca) * sai * 2.2); ctx.rotate(ang + sai * l.giro); ctx.globalAlpha = cl(u * 3) * some;
      ctx.fillStyle = ACENTO;
      ctx.beginPath(); ctx.roundRect(-tw / 2 + 0.5, -th / 2 + 0.5, tw - 1, th - 1, Math.min(3, tw * 0.2)); ctx.fill();
      if (u < 1) { ctx.fillStyle = "rgba(60,20,8,0.45)"; ctx.fillText(RAMP[(Math.floor(t * 8) + ((l.x + l.y) | 0)) % RAMP.length], 0, 1); }
      ctx.restore();
    }
    if (pisca) { ctx.fillStyle = ACENTO; for (const [i, j] of CLAWD.OLHOS) ctx.fillRect(cx + (i - CLAWD.W / 2) * tw, cyMarca + (j - CLAWD.H / 2) * th, tw, th); }

    // The name, with a sweep of light once it has landed.
    ctx.font = `600 ${Math.round(ch * 0.62)}px "Geist Mono", monospace`;
    const varre = cl((t - T.nome - 0.55 * r) / (0.7 * r)) * (W * 0.9) + W * 0.05;
    for (const p of letras) {
      const u = cl((t - T.nome - p.atraso) / (0.5 * r));
      if (u <= 0) continue;
      const e = fora(u), sai = rev > 0 ? fora(cl(rev * 1.3)) : 0;
      const x = p.sx + (p.x - p.sx) * e + Math.cos(p.fuga) * sai * 160, y = p.sy + (p.y - p.sy) * e + Math.sin(p.fuga) * sai * 160;
      const luz = Math.max(0, 1 - Math.abs(p.x - varre) / 60);
      ctx.globalAlpha = cl(u * 2) * some;
      ctx.fillStyle = luz > 0.3 ? `rgb(255,${200 + luz * 40 | 0},${170 + luz * 60 | 0})` : "#e9e6df";
      ctx.beginPath(); ctx.roundRect(x - (cw - 2) / 2, y - (ch - 2) / 2, cw - 2, ch - 2, 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Tagline typing itself.
    const n = Math.floor(cl((t - T.frase) / (0.85 * r)) * FRASE.length);
    if (n > 0) {
      ctx.globalAlpha = some;
      ctx.font = `450 ${Math.round(Math.max(13, unidade * 0.36))}px Inter, system-ui, sans-serif`; ctx.fillStyle = "rgba(236,235,231,0.6)";
      const txt = FRASE.slice(0, n) + (n < FRASE.length && Math.floor(t * 3) % 2 ? "▍" : "");
      ctx.fillText(txt, cx, cyNome + corpo * 0.95);
      ctx.globalAlpha = 1;
    }

    if (t >= T.fim) { acabou = true; cv.remove(); libera(); removeEventListener("pointerdown", pula); removeEventListener("keydown", pula); return; }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
}
