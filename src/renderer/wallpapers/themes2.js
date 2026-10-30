// ---------------------------------------------------------------------------
// Cozy and geek themes: a fireplace, a lo-fi rainy window and a space opera.
// The geek one is original art in the spirit of that world, with no logos,
// names or official designs.

const rr = (g, x, y, w, h, r, fill) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill(); };
const poly = (g, pts, fill) => { g.beginPath(); pts.forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fillStyle = fill; g.fill(); };

// Flames: a noise field shaped like a tongue of fire, base at y = 0.
function chamas(g, t, largura, altura, seed = 7) {
  const nucleo = g.createRadialGradient(0, -altura * 0.25, 4, 0, -altura * 0.3, altura * 0.62);
  nucleo.addColorStop(0, "rgba(255,236,150,1)"); nucleo.addColorStop(0.35, "rgba(255,150,40,0.95)"); nucleo.addColorStop(1, "rgba(255,80,10,0)");
  ell(g, 0, -altura * 0.3, largura * 0.42, altura * 0.62, 0, nucleo);
  for (let y = -altura; y <= 0; y += 4) {
    const rel = -y / altura, meia = (1 - rel) * largura * 0.5 + 4;
    for (let x = -meia - 6; x <= meia + 6; x += 4) {
      const n = ruido((x * 0.04), (y * 0.035) + t * 1.6, seed);
      const v = n * (1.2 - rel) * 1.5 - (Math.abs(x) / (meia + 6)) * 0.7;
      if (v > 0.12) { g.fillStyle = "#" + degrade(["#b52200", "#ff5a00", "#ffb21a", "#fff6c0"], (v - 0.08) * 1.25).toString(16).padStart(6, "0"); g.fillRect(x - 2.5, y - 2.5, 5, 5); }
    }
  }
}
const degrade = (stops, t) => { const s = clamp(t) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(s)); const c = mix(hx(stops[i]), hx(stops[i + 1]), s - i); return ((c[0] | 0) << 16) | ((c[1] | 0) << 8) | (c[2] | 0); };
const ruido = (x, y, s = 0) => {
  const xi = Math.floor(x), yi = Math.floor(y), u = (x - xi) ** 2 * (3 - 2 * (x - xi)), v = (y - yi) ** 2 * (3 - 2 * (y - yi));
  const a = hash(xi + s * 13, yi), b = hash(xi + 1 + s * 13, yi), c = hash(xi + s * 13, yi + 1), d = hash(xi + 1 + s * 13, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

// A ginger cat curled up asleep, seen from above-front.
function gato(g, t, h) {
  const resp = 1 + 0.035 * Math.sin(t * 1.6), orelha = h >= 0 ? Math.sin(h * 14) * 0.25 * Math.exp(-h * 2) : 0;
  g.save(); g.scale(1, resp);
  const rabo = h >= 0 ? Math.sin(h * 6) * 0.18 * Math.exp(-h * 0.6) : Math.sin(t * 0.7) * 0.03;
  g.lineCap = "round"; g.lineWidth = 22; g.strokeStyle = "#d98a42";
  g.beginPath(); g.arc(0, 4, 78, (0.2 + rabo) * Math.PI, (0.95 + rabo * 0.4) * Math.PI); g.stroke();
  ell(g, 0, 0, 92, 56, 0, "#e9a058");
  for (let i = -2; i <= 2; i++) ell(g, i * 26, -18, 7, 26, 0.15 * i, "#c9772f");
  ell(g, 0, 18, 60, 22, 0, "#f6d2a2");
  g.restore();
  g.save(); g.translate(58, -16);
  for (const m of [-1, 1]) { g.save(); g.translate(m * 20, -24); g.rotate(m * (0.25 + orelha)); poly(g, [[-16, 8], [0, -32], [16, 8]], "#d98a42"); poly(g, [[-8, 5], [0, -18], [8, 5]], "#f5b8a8"); g.restore(); }
  circ(g, 0, 0, 36, "#eda75e");
  ell(g, 0, 14, 20, 12, 0, "#f8dcb2");
  for (const m of [-1, 1]) { g.lineWidth = 3.5; g.strokeStyle = "#5b3216"; g.beginPath(); g.arc(m * 13, -2, 7, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
  circ(g, 0, 8, 4, "#d06a62");
  g.restore();
}

THEMES.push(
  {
    id: "lareira", name: t("tema.lareira"), light: false,
    grid: "rgba(255,220,180,0.03)", accent: hx("#ffb066"), shadow: "rgba(0,0,0,0.3)", sprinkle: ["#ffe2a8"],
    fogo(env) { const { W, H, k } = env; return [W * 0.7, H * 0.84, k]; },
    bg(ctx, env) {
      const { W, H, t } = env, [fx, fy, k] = this.fogo(env), chao = H * 0.84;
      ctx.fillStyle = lin(ctx, 0, 0, 0, chao, [[0, "#1d120c"], [1, "#2a180e"]]); ctx.fillRect(0, 0, W, chao);
      for (let x = 0; x < W; x += 46) { ctx.fillStyle = "rgba(255,200,150,0.018)"; ctx.fillRect(x, 0, 18, chao); }
      ctx.fillStyle = lin(ctx, 0, chao, 0, H, [[0, "#3a2414"], [1, "#24160c"]]); ctx.fillRect(0, chao, W, H - chao);
      for (let y = chao + 14; y < H; y += 18) { ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(0, y, W, 2); }
      const pulso = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 2.3) + (env.effects.some((f) => f.kind === "atica") ? 0.25 : 0);
      glowAt(ctx, fx, fy - 120 * k, Math.max(W, H) * 0.55, "rgba(255,130,50,A)", 0.22 * pulso);
      glowAt(ctx, W * 0.52, chao - 330 * k, 260 * k, "rgba(255,200,120,A)", 0.22);
      // brick surround, painted smooth so the fire stands out
      ctx.save(); ctx.translate(fx, fy); ctx.scale(k, k);
      const fw = 470, fh = 420;
      ctx.fillStyle = "#4e2a1f"; ctx.fillRect(-fw / 2, -fh, fw, fh);
      for (let row = 0, y = -fh; y < 0; y += 36, row++) for (let x = -fw / 2 - (row % 2) * 40; x < fw / 2; x += 80) {
        const x0 = Math.max(-fw / 2, x), x1 = Math.min(fw / 2, x + 76);
        ctx.fillStyle = (row + Math.floor(x / 80)) % 3 ? "#6e3a2a" : "#633325"; ctx.fillRect(x0, y + 2, x1 - x0, 32);
      }
      ctx.fillStyle = `rgba(255,140,60,${0.12 * pulso})`; ctx.fillRect(-fw / 2, -fh, fw, fh);
      ctx.restore();
    },
    click(x, y, t, R) { R.add({ kind: "atica", x, y, t, life: 1.8 }); },
    scene(g, env) {
      const { W, H, t, k } = env, [fx, fy] = this.fogo(env);
      const atica = env.effects.filter((f) => f.kind === "atica").reduce((m, f) => Math.max(m, 1 - (t - f.t) / f.life), 0);
      // window with snow, on the left wall
      const wx = W * 0.1, wy = H * 0.12, ww = 250 * k, wh = 300 * k;
      rr(g, wx - 14 * k, wy - 14 * k, ww + 28 * k, wh + 28 * k, 6, "#4a2e1c");
      rr(g, wx, wy, ww, wh, 2, "#1d2f52");
      for (let i = 0; i < 22; i++) {
        const x = wx + hash(i, 1) * ww + Math.sin(t * 0.8 + i) * 6 * k, y = wy + ((hash(i, 2) * wh + t * (14 + hash(i, 3) * 16) * k) % wh);
        circ(g, x, y, (4 + hash(i, 4) * 3) * k, "#eef3ff");
      }
      g.fillStyle = "#4a2e1c"; g.fillRect(wx + ww / 2 - 6 * k, wy, 12 * k, wh); g.fillRect(wx, wy + wh / 2 - 6 * k, ww, 12 * k);
      rr(g, wx - 24 * k, wy + wh + 10 * k, ww + 48 * k, 16 * k, 4, "#5c3a24");
      // fireplace
      g.save(); g.translate(fx, fy); g.scale(k, k);
      const fw = 470, fh = 420;
      rr(g, -fw / 2 - 36, -fh - 30, fw + 72, 30, 4, "#4a2c1c"); rr(g, -fw / 2 - 36, -fh - 30, fw + 72, 8, 4, "#62402a");
      g.beginPath(); g.moveTo(-150, 0); g.lineTo(-150, -210); g.arc(0, -210, 150, Math.PI, 0); g.lineTo(150, 0); g.closePath(); g.fillStyle = "#170905"; g.fill();
      g.save(); g.clip();
      const brilho = g.createRadialGradient(0, -40, 10, 0, -40, 230); brilho.addColorStop(0, `rgba(255,120,30,${0.55 + atica * 0.3})`); brilho.addColorStop(1, "rgba(255,90,20,0)");
      g.fillStyle = brilho; g.fillRect(-160, -380, 320, 380);
      const hf = env.hovered("fogo"), alto = 1 + atica * 0.5 + (hf >= 0 ? 0.35 * Math.exp(-hf * 0.8) : 0);
      chamas(g, t, 210, 210 * alto, 7);
      g.restore();
      g.save(); g.translate(0, -26); g.rotate(-0.12); rr(g, -120, -16, 240, 32, 14, "#4a2a14"); g.restore();
      g.save(); g.translate(0, -26); g.rotate(0.12); rr(g, -115, -14, 230, 28, 13, "#5c3418"); g.restore();
      g.fillStyle = "#1d1612"; for (let x = -130; x <= 130; x += 26) g.fillRect(x - 3, -60, 6, 60);
      rr(g, -fw / 2 - 50, 0, fw + 100, 24, 3, "#3d2b22");
      // candles on the mantel
      for (const [x, h, i] of [[-170, 46, 0], [-128, 64, 1], [160, 38, 2]]) {
        rr(g, x - 9, -fh - 30 - h, 18, h, 3, "#efe4cc");
        const fl = Math.sin(t * 9 + i * 2) * 2;
        ell(g, x + fl * 0.3, -fh - 30 - h - 13, 6, 12 + fl, 0, "#ffce5a"); ell(g, x, -fh - 30 - h - 9, 3, 6, 0, "#fff6d0");
      }
      g.restore();
      env.hit("fogo", fx, fy - 140 * k, 170 * k, "fogo");
      // sparks
      for (let i = 0; i < 16; i++) {
        const vida = 2.4, age = (t * (0.5 + hash(i, 2) * 0.5) + hash(i, 3) * vida) % vida;
        circ(g, fx + (hash(i, 1) - 0.5) * 160 * k + Math.sin(t * 2 + i) * 12 * k, fy - 150 * k - age * 110 * k, 3.5 * k, `rgba(255,${150 + 80 * hash(i, 4) | 0},60,${clamp(1 - age / vida)})`);
      }
      for (const f of env.effects) if (f.kind === "atica") {
        const age = (t - f.t) / f.life;
        for (let i = 0; i < 22; i++) { const a = -Math.PI / 2 + (hash(i, f.t) - 0.5) * 1.6, d = age * 260 * k * (0.5 + hash(i, 2)); circ(g, fx + Math.cos(a) * d, fy - 160 * k + Math.sin(a) * d + age * age * 80 * k, 4 * k, `rgba(255,190,80,${1 - age})`); }
      }
      // floor lamp
      g.save(); g.translate(W * 0.52, H * 0.84); g.scale(k, k);
      rr(g, -40, -8, 80, 10, 4, "#2a1c14"); g.fillStyle = "#3a2a1e"; g.fillRect(-4, -300, 8, 294);
      poly(g, [[-62, -300], [62, -300], [42, -380], [-42, -380]], "#e8c98a"); poly(g, [[-62, -300], [62, -300], [56, -312], [-56, -312]], "#f6dfa6");
      g.restore();
      env.hit("abajur", W * 0.52, H * 0.84 - 340 * k, 70 * k, "abajur");
      // rug and the cat asleep on it
      const [cx, cy] = env.body("gato", W * 0.34, H * 0.88, "flee", 120, 0.15), hg = env.hovered("gato");
      ell(g, cx, cy + 10 * k, 260 * k, 56 * k, 0, "#7d2a36"); ell(g, cx, cy + 10 * k, 205 * k, 40 * k, 0, "#9c3a46");
      g.save(); g.translate(cx, cy - 40 * k); g.scale(k * 1.3, k * 1.3); gato(g, t, hg); g.restore();
      env.hit("gato", cx, cy - 40 * k, 130 * k, "gato");
      if (hg >= 0 && hg < 3) for (let i = 0; i < 3; i++) { const age = hg - i * 0.5; if (age > 0) { g.save(); g.globalAlpha = clamp(1 - age / 2.2); g.font = `700 ${(22 + i * 6) * k}px Manrope`; g.fillStyle = "#ffffff"; g.fillText("z", cx + (60 + age * 30) * k, cy - (90 + age * 50 + i * 10) * k); g.restore(); } }
    },
  },
  {
    id: "chuva", name: t("tema.chuva"), light: false,
    grid: "rgba(200,210,255,0.035)", accent: hx("#cfd8ff"), shadow: "rgba(0,0,0,0.25)",
    bg(ctx, env) {
      const { W, H, t } = env, raio = env.effects.find((f) => f.kind === "raio"), flash = raio ? Math.max(0, 1 - (t - raio.t) / 0.35) * (Math.sin((t - raio.t) * 60) > 0 ? 1 : 0.4) : 0;
      ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, "#141a33"], [0.6, "#2a2346"], [1, "#3a2a44"]]); ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 22; i++) {
        const x = ((hash(i, 1) * W * 1.2 + t * (4 + hash(i, 5) * 6)) % (W * 1.2)) - W * 0.1, y = H * (0.35 + 0.45 * hash(i, 2)), r = (30 + 70 * hash(i, 3));
        const c = ["rgba(255,190,110,A)", "rgba(255,120,150,A)", "rgba(120,190,255,A)", "rgba(255,230,160,A)"][i % 4];
        glowAt(ctx, x, y, r, c, 0.16 + 0.1 * Math.sin(t * 0.7 + i));
      }
      if (flash) { ctx.fillStyle = `rgba(220,230,255,${0.45 * flash})`; ctx.fillRect(0, 0, W, H); }
      const k = env.k, peitoril = H * 0.8;
      ctx.fillStyle = "#231b2a";
      ctx.fillRect(0, 0, W, 16 * k); ctx.fillRect(0, 0, 16 * k, peitoril); ctx.fillRect(W - 16 * k, 0, 16 * k, peitoril);
      ctx.fillRect(W * 0.5 - 8 * k, 0, 16 * k, peitoril); ctx.fillRect(0, H * 0.42 - 8 * k, W, 16 * k);
      ctx.fillStyle = lin(ctx, 0, peitoril, 0, H, [[0, "#3e3140"], [0.12, "#2e2432"], [1, "#1c1620"]]); ctx.fillRect(0, peitoril, W, H - peitoril);
      ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(0, peitoril, W, 3);
      glowAt(ctx, W * 0.42, peitoril - 140 * k, 180 * k, "rgba(255,190,100,A)", 0.25 + 0.05 * Math.sin(t * 8));
    },
    ambient({ W, H, t, cw, ch }, glyph, R) {
      // Condensation on the glass: the pointer's trail wipes it clear and it
      // fogs back over as the trail fades.
      for (let j = 0; j < Math.floor((H * 0.8) / ch); j++) for (let i = 0; i < R.cols; i++) {
        const k = j * R.cols + i, limpo = R.trail[k];
        if (limpo > 0.25 || hash(i, j, 4) > 0.42) continue;
        glyph(i, j, hash(i, j, 5) < 0.5 ? "·" : ".", `rgba(220,226,255,${0.16 * (1 - limpo)})`);
      }
    },
    click(x, y, t, R) { R.add({ kind: "raio", x, y, t, life: 1.2 }); },
    scene(g, env) {
      const { W, H, t, k } = env, peitoril = H * 0.8;
      // fairy lights along the top
      for (let i = 0; i < W / (46 * k); i++) {
        const x = i * 46 * k + 20 * k, y = 34 * k + Math.sin(i * 0.9) * 10 * k, b = 0.6 + 0.4 * Math.sin(t * 2 + i * 1.7);
        circ(g, x, y, 7 * k, `rgba(${["255,200,120", "255,150,170", "180,220,255", "255,235,150"][i % 4]},${b})`);
      }
      // drops sliding down the glass
      for (let i = 0; i < 30; i++) {
        const lento = 0.4 + hash(i, 2) * 0.6, ciclo = 9 + hash(i, 3) * 8, fase = ((t * lento + hash(i, 4) * ciclo) % ciclo) / ciclo;
        const desce = fase < 0.5 ? fase * 0.15 : 0.075 + (fase - 0.5) * 2 * 0.95;
        const x = hash(i, 1) * W, y = desce * peitoril;
        if (y > peitoril - 10) continue;
        for (let s = 1; s < 5; s++) circ(g, x + Math.sin(s + i) * 1.5, y - s * 12 * k, (2.5 - s * 0.4) * k, "rgba(200,215,255,0.55)");
        circ(g, x, y, 5.5 * k, "rgba(225,235,255,0.95)");
      }
      // plant
      const [px, py] = env.body("planta", W * 0.16, peitoril, "flee", 160, 0.2), hp = env.hovered("planta"), sway = hp >= 0 ? Math.sin(hp * 8) * 0.18 * Math.exp(-hp) : 0;
      g.save(); g.translate(px, py); g.scale(k, k);
      for (let i = 0; i < 7; i++) { g.save(); g.translate(0, -70); g.rotate(-1.3 + i * 0.43 + Math.sin(t * 0.6 + i) * 0.04 + sway); ell(g, 0, -62, 26, 58, 0, i % 2 ? "#3f8a4e" : "#4fa35c"); g.restore(); }
      poly(g, [[-46, -76], [46, -76], [34, 0], [-34, 0]], "#b5583b"); rr(g, -52, -86, 104, 14, 4, "#c96a4a");
      g.restore();
      env.hit("planta", px, py - 90 * k, 90 * k, "planta");
      // books and a candle on the sill
      g.save(); g.translate(W * 0.42, peitoril); g.scale(k, k);
      rr(g, -70, -28, 140, 28, 3, "#3f6a8a"); rr(g, -60, -52, 124, 24, 3, "#a8574a"); rr(g, -66, -72, 130, 20, 3, "#d9b56a");
      rr(g, -16, -128, 32, 56, 4, "#efe6d6");
      const fl = Math.sin(t * 8) * 2;
      ell(g, fl * 0.3, -142, 7, 14 + fl, 0, "#ffc95a"); ell(g, 0, -138, 3, 7, 0, "#fff3cc");
      g.restore();
      // mug with steam
      const [mx, my] = env.body("caneca", W * 0.8, peitoril, "flee", 140, 0.15), hm = env.hovered("caneca");
      g.save(); g.translate(mx, my); g.scale(k, k);
      g.lineWidth = 12; g.strokeStyle = "#e9e2d6"; g.beginPath(); g.arc(46, -44, 20, -Math.PI / 2, Math.PI / 2); g.stroke();
      rr(g, -44, -96, 88, 96, 12, "#e9e2d6"); rr(g, -44, -60, 88, 18, 0, "#c8553d");
      g.lineCap = "round";
      for (let s = 0; s < 3; s++) {
        g.beginPath(); for (let y = 0; y < 90; y += 6) g.lineTo(-16 + s * 16 + Math.sin(y * 0.08 - t * 2 + s) * 9, -106 - y);
        g.lineWidth = 7; g.strokeStyle = `rgba(240,240,255,${0.35 + (hm >= 0 ? 0.3 * Math.exp(-hm * 0.6) : 0)})`; g.stroke();
      }
      g.restore();
      env.hit("caneca", mx, my - 60 * k, 70 * k, "caneca");
      const raio = env.effects.find((f) => f.kind === "raio");
      if (raio && t - raio.t < 0.3) { g.lineWidth = 5; g.strokeStyle = "#f2f4ff"; g.beginPath(); let x = raio.x, y = 0; g.moveTo(x, y); while (y < H * 0.4) { x += (hash(y, raio.t) - 0.5) * 60; y += 30; g.lineTo(x, y); } g.stroke(); }
    },
  },
  {
    id: "galaxia", name: t("tema.galaxia"), light: false,
    grid: "rgba(160,190,255,0.035)", accent: hx("#9fd4ff"), sprinkle: ["#ffffff", "#ff5a5a"], trailGlyph: "·*",
    salto(env) { const f = env.effects.find((e) => e.kind === "salto"); return f ? clamp((env.t - f.t) / f.life) : -1; },
    bg(ctx, env) {
      const { W, H, t } = env;
      ctx.fillStyle = lin(ctx, 0, 0, W, H, [[0, "#02030a"], [0.6, "#060a1c"], [1, "#0d0a24"]]); ctx.fillRect(0, 0, W, H);
      glowAt(ctx, W * 0.75 + Math.sin(t * 0.03) * 40, H * 0.3, Math.min(W, H) * 0.6, "rgba(120,60,200,A)", 0.16);
      glowAt(ctx, W * 0.2, H * 0.75, Math.min(W, H) * 0.5, "rgba(40,110,220,A)", 0.12);
      const s = this.salto(env);
      if (s >= 0) {
        const cx = W / 2, cy = H / 2, forca = Math.sin(s * Math.PI);
        ctx.lineCap = "round";
        for (let i = 0; i < 260; i++) {
          const a = hash(i, 1) * TAU, d0 = 40 + hash(i, 2) * Math.max(W, H) * 0.6, len = forca * (120 + hash(i, 3) * 380);
          ctx.strokeStyle = `rgba(${hash(i, 4) < 0.3 ? "160,200,255" : "235,240,255"},${0.25 + 0.6 * forca})`; ctx.lineWidth = 1 + hash(i, 5) * 2;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0); ctx.lineTo(cx + Math.cos(a) * (d0 + len), cy + Math.sin(a) * (d0 + len)); ctx.stroke();
        }
        if (s > 0.45 && s < 0.6) { ctx.fillStyle = `rgba(220,235,255,${(1 - Math.abs(s - 0.52) / 0.08) * 0.7})`; ctx.fillRect(0, 0, W, H); }
      }
    },
    ambient({ W, H, t, cw, ch }, glyph) {
      for (let i = 0; i < 160; i++) {
        const prof = 0.2 + hash(i, 3) * 0.8, x = ((hash(i, 1) * W - t * 8 * prof) % W + W) % W, y = hash(i, 2) * H;
        const b = 0.3 + 0.7 * prof * (0.7 + 0.3 * Math.sin(t * 2 + i));
        glyph(Math.floor(x / cw), Math.floor(y / ch), prof > 0.85 ? "*" : prof > 0.5 ? "+" : "·", `rgba(230,236,255,${b * 0.8})`);
      }
    },
    click(x, y, t, R) { R.add({ kind: "salto", x, y, t, life: 1.6 }); },
    scene(g, env) {
      const { W, H, t, k } = env, s = this.salto(env), fuga = s >= 0 ? Math.sin(s * Math.PI) : 0;
      // desert planet rising from the bottom left
      const pr = Math.min(W, H) * 0.45;
      g.save(); g.beginPath(); g.arc(W * 0.12, H + pr * 0.45, pr, 0, TAU); g.clip();
      g.fillStyle = "#c98a4c"; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? "#b4743c" : "#dca066"; g.fillRect(0, H + pr * 0.45 - pr + i * pr * 0.11 + Math.sin(i * 3) * 6, W, pr * 0.05); }
      g.restore();
      // asteroids tumbling slowly
      for (let i = 0; i < 5; i++) {
        const x = ((hash(i, 21) * W * 1.3 - t * (6 + hash(i, 22) * 10) * k) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15, y = H * (0.15 + 0.7 * hash(i, 23)), r = (26 + hash(i, 24) * 40) * k;
        const [ax, ay] = env.body("a" + i, x, y, "flee", 200, 0.6);
        g.save(); g.translate(ax, ay); g.rotate(t * (0.1 + hash(i, 25) * 0.3));
        poly(g, Array.from({ length: 8 }, (_, j) => { const a = (j / 8) * TAU, rj = r * (0.75 + hash(i, j + 30) * 0.35); return [Math.cos(a) * rj, Math.sin(a) * rj]; }), "#6b6f78");
        circ(g, -r * 0.25, -r * 0.2, r * 0.22, "#575b63"); circ(g, r * 0.3, r * 0.25, r * 0.15, "#7c808a");
        g.restore();
      }
      // capital ship drifting across the top
      const ciclo = 70, u = (t % ciclo) / ciclo, [sx, sy] = env.body("nave", W * 1.3 - u * W * 1.8, H * 0.2, "flee", 260, 0.1), hn = env.hovered("nave");
      g.save(); g.translate(sx - fuga * W * 0.6, sy); g.scale(k * 1.7, k * 1.7);
      poly(g, [[-260, 0], [240, -64], [250, 64]], "#a3abb6");
      poly(g, [[-260, 0], [240, -64], [240, -18], [-120, 0]], "#c0c7d0");
      rr(g, 60, -40, 120, 26, 4, "#7d858f"); rr(g, 120, -64, 60, 30, 4, "#8f98a3");
      for (let i = 0; i < 3; i++) circ(g, 252, -36 + i * 36, 14, hn >= 0 ? "#d6f2ff" : "#8fd6ff");
      for (let i = 0; i < 9; i++) if (Math.sin(t * 2 + i * 1.3) > -0.3) circ(g, -120 + i * 38, -10 + (i % 3) * 8, 3.5, i % 4 ? "#fff3c4" : "#ff6a5a");
      g.restore();
      env.hit("nave", sx, sy, 280 * k, "nave");
      // small explosions now and then
      const ce = Math.floor(t / 4.5), ue = (t % 4.5) / 0.9;
      if (ue < 1) { const ex = W * (0.25 + 0.5 * hash(ce, 41)), ey = H * (0.25 + 0.45 * hash(ce, 42)); circ(g, ex, ey, (20 + ue * 50) * k, `rgba(255,${180 - ue * 80 | 0},60,${1 - ue})`); circ(g, ex, ey, (10 + ue * 26) * k, `rgba(255,245,200,${1 - ue})`); }
      // starfighters in a dogfight
      const cacas = [[0.0, 1, "#d9dde2", "#c8423b"], [1.7, -1, "#d9dde2", "#3b7bc8"], [3.3, 1, "#b8bec6", "#e0a030"]];
      cacas.forEach(([ph, dir, corpo, faixa], i) => {
        const at = (tt) => [W * 0.5 + W * 0.36 * Math.sin(dir * tt * 0.23 + ph), H * 0.5 + H * 0.26 * Math.sin(tt * 0.37 + ph * 1.7)];
        const [x0, y0] = at(t), [x1, y1] = at(t + 0.05), [x, y] = env.body("c" + i, x0, y0, "flee", 240, 1.2), a = Math.atan2(y1 - y0, x1 - x0), hc = env.hovered("c" + i);
        g.save(); g.translate(x + fuga * Math.cos(a) * W, y + fuga * Math.sin(a) * W); g.rotate(a); g.scale(k * 1.45, k * 1.45);
        poly(g, [[-30, -48], [10, -10], [10, 10], [-30, 48], [-18, 10], [-18, -10]], corpo);
        poly(g, [[-26, -40], [-6, -16], [-14, -16]], faixa); poly(g, [[-26, 40], [-6, 16], [-14, 16]], faixa);
        rr(g, -40, -9, 90, 18, 8, corpo); ell(g, 22, 0, 12, 7, 0, "#2b3a52"); circ(g, -44, 0, 8, "#ffb35a");
        const rajada = (t + i * 0.9) % 2.6 < 0.45 ? (t + i * 0.9) % 2.6 : -1;
        if (rajada >= 0) for (let b = 0; b < 2; b++) { const d = (rajada * 1100 + b * 160) % 600; rr(g, 60 + d, -3, 46, 6, 3, faixa === "#3b7bc8" ? "#7dff8a" : "#ff4d4d"); }
        if (hc >= 0 && hc < 1.2) for (let b = 0; b < 3; b++) { const d = (hc * 900 + b * 140) % 700; rr(g, 60 + d, -3, 46, 6, 3, faixa === "#3b7bc8" ? "#7dff8a" : "#ff4d4d"); }
        g.restore();
        env.hit("c" + i, x, y, 90 * k, "caca");
      });
    },
  },
);
