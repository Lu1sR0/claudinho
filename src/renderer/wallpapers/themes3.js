// ---------------------------------------------------------------------------
// More themes: a sakura garden, an aurora over a snowy cabin, falling code and
// a retro arcade. The arcade's aliens are original sprites, not taken from any
// game.

// A pixel sprite: each "X" is one block of size `p`; colours by letter.
function bitmap(g, linhas, p, cores) {
  const w = linhas[0].length, h = linhas.length;
  linhas.forEach((l, y) => { for (let x = 0; x < w; x++) { const c = cores[l[x]]; if (c) { g.fillStyle = c; g.fillRect((x - w / 2) * p, (y - h / 2) * p, p * 0.92, p * 0.92); } } });
}

// A fox sitting, seen from the side, tail curled at its feet.
function raposa(g, t, h) {
  const cauda = h >= 0 ? Math.sin(h * 9) * 0.35 * Math.exp(-h * 0.8) : Math.sin(t * 0.8) * 0.06;
  g.save(); g.translate(-46, 30); g.rotate(-0.4 + cauda);
  ell(g, -40, 0, 60, 24, -0.2, "#e2702a"); ell(g, -86, -8, 18, 14, -0.2, "#fbf3ea"); g.restore();
  ell(g, 0, 10, 46, 50, 0, "#e9782f");
  ell(g, 10, 26, 22, 30, 0, "#fbf3ea");
  ell(g, 22, -52, 30, 26, 0, "#ee8236");
  poly(g, [[46, -50], [76, -44], [46, -38]], "#ee8236"); circ(g, 76, -44, 5, "#2a1a10");
  ell(g, 34, -40, 18, 10, 0.2, "#fbf3ea");
  for (const dx of [-2, 22]) { poly(g, [[dx - 10, -72], [dx, -100], [dx + 10, -72]], "#d9632a"); poly(g, [[dx - 5, -74], [dx, -90], [dx + 5, -74]], "#2a1a10"); }
  circ(g, 34, -58, 4, "#2a1a10");
  for (const dx of [-10, 18]) rr(g, dx - 6, 52, 12, 18, 4, "#3a2416");
}

const ALIENS = [
  ["...XX...", "..XXXX..", ".XXXXXX.", "XX.XX.XX", "XXXXXXXX", "..X..X..", ".X.XX.X.", "X.X..X.X"],
  ["..X.....X..", "...X...X...", "..XXXXXXX..", ".XX.XXX.XX.", "XXXXXXXXXXX", "X.XXXXXXX.X", "X.X.....X.X", "...XX.XX..."],
  [".XXXXXXX.", "XXXXXXXXX", "XX.XXX.XX", "XXXXXXXXX", ".XX...XX.", "XX.X.X.XX", "X.......X"],
];

THEMES.push(
  {
    id: "sakura", name: t("tema.sakura"), light: true,
    grid: "rgba(255,255,255,0.1)", accent: hx("#ff8fbf"), shadow: "rgba(150,60,90,0.1)", liftTo: [255, 240, 248],
    bg(ctx, { W, H, t, k }) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, "#ffd3e3"], [0.55, "#ffeaf1"], [1, "#fff6f2"]]); ctx.fillRect(0, 0, W, H);
      glowAt(ctx, W * 0.62, H * 0.24, Math.min(W, H) * 0.4, "rgba(255,250,235,A)", 0.7);
      ctx.fillStyle = lin(ctx, 0, H * 0.78, 0, H, [[0, "#cfe6e9"], [1, "#b3d6dc"]]); ctx.fillRect(0, H * 0.78, W, H * 0.22);
      for (let i = 0; i < 8; i++) { ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(((hash(i, 3) * W + t * 10) % W), H * (0.8 + 0.18 * hash(i, 4)), 40 * k, 2); }
    },
    ambient({ W, H, t, cw, ch }, glyph) {
      for (let i = 0; i < 4; i++) {
        const x = ((hash(i, 9) * W - t * 30) % (W + 100) + W + 100) % (W + 100) - 50, y = H * (0.1 + 0.15 * hash(i, 8)) + Math.sin(t * 3 + i) * 5;
        glyph(Math.floor(x / cw), Math.floor(y / ch), Math.sin(t * 7 + i) > 0 ? "v" : "^", "rgba(120,70,90,0.5)");
      }
    },
    click(x, y, t, R) { R.add({ kind: "rajada", x, y, t, life: 2.4 }); },
    scene(g, env) {
      const { W, H, t, k, mouse } = env, ht = env.hovered("arvore"), treme = ht >= 0 ? Math.sin(ht * 18) * 0.03 * Math.exp(-ht * 1.5) : 0;
      // a low ridge far away, then Fuji: concave slopes, a flat crater, a snow
      // cap with a ragged edge (clipped to the mountain so it follows the slopes)
      const base = H * 0.79;
      g.fillStyle = "#f4dbe8"; g.beginPath(); g.moveTo(0, base);
      for (let x = 0; x <= W; x += W / 24) g.lineTo(x, base - H * (0.04 + 0.025 * Math.sin(x / W * 7 + 1) + 0.015 * Math.sin(x / W * 19)));
      g.lineTo(W, base); g.fill();
      const cx = W * 0.58, topo = H * 0.22, meia = W * 0.4, crat = W * 0.035;
      const fuji = () => { g.beginPath(); g.moveTo(cx - meia, base); g.quadraticCurveTo(cx - meia * 0.2, H * 0.64, cx - crat, topo); g.lineTo(cx - crat * 0.3, topo + H * 0.012); g.lineTo(cx + crat * 0.4, topo - H * 0.004); g.lineTo(cx + crat, topo + H * 0.006); g.quadraticCurveTo(cx + meia * 0.2, H * 0.64, cx + meia, base); g.closePath(); };
      fuji(); g.fillStyle = "#c79ec0"; g.fill();
      g.save(); fuji(); g.clip();
      g.fillStyle = "#b48aae"; g.beginPath(); g.moveTo(cx, topo); g.quadraticCurveTo(cx + meia * 0.25, H * 0.62, cx + meia, base); g.lineTo(cx + meia, topo); g.fill();
      g.fillStyle = "#e9ebf8"; g.beginPath(); g.moveTo(cx - meia, topo - H * 0.05);
      for (let i = 0; i <= 16; i++) { const x = cx - meia * 0.5 + (i / 16) * meia; g.lineTo(x, topo + H * (i % 2 ? 0.17 : 0.11) + H * 0.025 * hash(i, 7)); }
      g.lineTo(cx + meia, topo - H * 0.05); g.fill();
      g.restore();
      // torii gate on the right, a stone lantern by the water
      g.save(); g.translate(W * 0.83, H * 0.8); g.scale(k, k);
      rr(g, -150, -330, 300, 26, 8, "#2a1a1a"); rr(g, -132, -304, 264, 22, 4, "#d23a2e"); rr(g, -112, -250, 224, 18, 3, "#d23a2e");
      rr(g, -104, -300, 26, 300, 4, "#d23a2e"); rr(g, 78, -300, 26, 300, 4, "#d23a2e"); rr(g, -14, -268, 28, 30, 3, "#2a1a1a");
      g.restore();
      env.hit("torii", W * 0.83, H * 0.8 - 160 * k, 140 * k, "torii");
      g.save(); g.translate(W * 0.6, H * 0.82); g.scale(k, k);
      rr(g, -26, -40, 52, 40, 4, "#9a979c"); rr(g, -40, -96, 80, 56, 6, "#b6b2b8"); rr(g, -14, -84, 28, 30, 3, `rgba(255,200,110,${0.8 + 0.2 * Math.sin(t * 5)})`); poly(g, [[-60, -96], [0, -136], [60, -96]], "#8e8a92");
      g.restore();
      // the cherry tree, trunk from the left, a crown of blossom clusters
      g.save(); g.translate(W * 0.2, H * 0.84); g.rotate(treme); g.scale(k, k);
      g.lineCap = "round"; g.strokeStyle = "#5a3a3a";
      const galho = (x0, y0, x1, y1, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 20, (y0 + y1) / 2 - 30, x1, y1); g.stroke(); };
      galho(0, 0, 10, -300, 44); galho(10, -280, -150, -420, 22); galho(10, -280, 190, -440, 24); galho(100, -380, 280, -380, 14); galho(-60, -350, -230, -330, 12); galho(30, -300, 60, -520, 16);
      const flores = [[-170, -440, 90], [-60, -480, 100], [60, -540, 110], [180, -470, 105], [280, -400, 80], [-250, -350, 70], [120, -380, 80], [-20, -380, 70]];
      flores.forEach(([x, y, r], i) => {
        for (let j = 0; j < 9; j++) { const a = hash(i, j) * TAU, d = hash(j, i) * r * 0.75; circ(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, r * (0.32 + 0.18 * hash(i + 3, j)), j % 3 ? "#ffa8c8" : j % 2 ? "#ff86b4" : "#ffd0e2"); }
      });
      g.restore();
      env.hit("arvore", W * 0.2, H * 0.84 - 440 * k, 300 * k, "arvore");
      // petals in the wind; the pointer's speed is a gust, a click a burst
      const vento = mouse ? clamp(mouse.vx / 900, -1.5, 1.5) : 0;
      const rajadas = env.effects.filter((f) => f.kind === "rajada");
      for (let i = 0; i < 70; i++) {
        const sp = 18 + hash(i, 2) * 26, x0 = ((hash(i, 1) * W * 1.3 + t * sp * k) % (W * 1.3)) - W * 0.15, y0 = ((hash(i, 3) * H + t * (20 + hash(i, 4) * 20) * k) % H);
        let x = x0 + Math.sin(t * 1.5 + i) * 18 * k, y = y0;
        if (mouse) { const d = Math.hypot(x - mouse.x, y - mouse.y); if (d < 200) { x += vento * (200 - d) * 0.6; y -= Math.abs(vento) * (200 - d) * 0.15; } }
        for (const r of rajadas) { const age = t - r.t, d = Math.hypot(x - r.x, y - r.y) || 1; if (d < 320) { const f = (1 - d / 320) * 180 * Math.sin(Math.min(1, age / r.life) * Math.PI) * k; x += ((x - r.x) / d) * f; y += ((y - r.y) / d) * f; } }
        if (ht >= 0 && ht < 2 && i < 30) y += ht * 60 * k;
        g.save(); g.translate(x, y); g.rotate(t * (1 + hash(i, 5)) + i); ell(g, 0, 0, 7 * k, 4.5 * k, 0, i % 3 ? "#ff9ec4" : "#ffc4dc"); g.restore();
      }
    },
  },
  {
    id: "aurora", name: "Aurora", light: false,
    grid: "rgba(180,255,220,0.035)", accent: hx("#8affc8"), sprinkle: ["#ffffff", "#c9a8ff"], trailGlyph: "*+·",
    bg(ctx, { W, H }) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, "#030614"], [0.55, "#0b1838"], [1, "#16294a"]]); ctx.fillRect(0, 0, W, H);
    },
    ambient({ W, H, t, cw, ch }, glyph) {
      for (let i = 0; i < 110; i++) {
        const b = (Math.sin(t * (0.6 + hash(i, 3) * 2) + i) + 1) / 2;
        glyph(Math.floor((hash(i, 1) * W) / cw), Math.floor((hash(i, 2) * H * 0.6) / ch), b > 0.85 ? "*" : b > 0.5 ? "+" : "·", `rgba(235,240,255,${0.2 + b * 0.6})`);
      }
    },
    click(x, y, t, R) { R.add({ kind: "surto", x, y, t, life: 3 }); },
    scene(g, env) {
      const { W, H, t, k } = env;
      const surto = env.effects.filter((f) => f.kind === "surto").reduce((m, f) => Math.max(m, Math.sin(clamp((t - f.t) / f.life) * Math.PI)), 0);
      // ribbons of aurora: vertical streaks along a wavy curtain
      for (let r = 0; r < 3; r++) {
        for (let x = -20; x < W + 20; x += 10) {
          const yc = H * (0.16 + r * 0.07) + Math.sin(x * 0.004 + t * 0.25 + r * 2) * H * 0.06 + Math.sin(x * 0.011 - t * 0.4 + r) * H * 0.02;
          const forca = (0.45 + 0.55 * Math.sin(x * 0.006 - t * 0.3 + r * 1.7)) * (0.75 + surto * 0.6);
          if (forca < 0.15) continue;
          const alto = (90 + 70 * Math.sin(x * 0.02 + t + r)) * k * (1 + surto * 0.4);
          const gr = g.createLinearGradient(0, yc - alto, 0, yc + alto * 0.4);
          const topo = r === 1 ? "rgba(190,120,255," : "rgba(80,255,170,", base = r === 2 ? "rgba(255,110,200," : "rgba(60,220,160,";
          gr.addColorStop(0, topo + "0)"); gr.addColorStop(0.5, topo + 0.85 * forca + ")"); gr.addColorStop(1, base + "0)");
          g.fillStyle = gr; g.fillRect(x, yc - alto, 11, alto * 1.4);
        }
      }
      // snowy mountains, pines, the cabin
      const cume = (x0, base, alt, larg, cor, neve) => { poly(g, [[x0 - larg, base], [x0, base - alt], [x0 + larg, base]], cor); poly(g, [[x0 - larg * 0.28, base - alt * 0.72], [x0, base - alt], [x0 + larg * 0.28, base - alt * 0.72], [x0 + larg * 0.1, base - alt * 0.66], [x0 - larg * 0.08, base - alt * 0.7]], neve); };
      cume(W * 0.15, H * 0.82, H * 0.34, W * 0.24, "#2a3a5c", "#e8f0fb"); cume(W * 0.48, H * 0.82, H * 0.42, W * 0.28, "#33456a", "#f2f7ff"); cume(W * 0.82, H * 0.82, H * 0.3, W * 0.25, "#2a3a5c", "#e8f0fb");
      g.fillStyle = "#e9f1fb"; g.fillRect(0, H * 0.8, W, H * 0.2);
      for (let i = 0; i < W / (36 * k); i++) {
        const x = i * 36 * k + hash(i, 5) * 20 * k, h = (60 + hash(i, 6) * 80) * k;
        poly(g, [[x - h * 0.3, H * 0.84], [x, H * 0.84 - h], [x + h * 0.3, H * 0.84]], "#14304a");
        poly(g, [[x - h * 0.12, H * 0.84 - h * 0.6], [x, H * 0.84 - h], [x + h * 0.12, H * 0.84 - h * 0.6]], "#dfe9f6");
      }
      g.save(); g.translate(W * 0.68, H * 0.86); g.scale(k, k);
      rr(g, -90, -90, 180, 90, 4, "#5c3a26"); poly(g, [[-110, -86], [0, -160], [110, -86]], "#e9f1fb"); rr(g, 40, -150, 22, 46, 2, "#4a3020");
      rr(g, -62, -64, 44, 36, 3, `rgba(255,${190 + 20 * Math.sin(t * 3) | 0},110,1)`); rr(g, 20, -70, 34, 70, 3, "#3a2416");
      for (let i = 0; i < 4; i++) { const age = (t * 0.4 + i * 0.25) % 1; circ(g, 52 + Math.sin(age * 6 + i) * 8, -160 - age * 120, (10 + age * 16), `rgba(220,226,240,${0.6 * (1 - age)})`); }
      g.restore();
      env.hit("cabana", W * 0.68, H * 0.86 - 80 * k, 120 * k, "cabana");
      // the fox on a rock in the foreground
      const [fx, fy] = env.body("raposa", W * 0.3, H * 0.9, "flee", 140, 0.2), hf = env.hovered("raposa");
      ell(g, fx, fy + 30 * k, 110 * k, 34 * k, 0, "#8a93a6"); ell(g, fx - 20 * k, fy + 20 * k, 80 * k, 22 * k, 0, "#a3acbe");
      g.save(); g.translate(fx, fy - 40 * k); g.scale(k * 1.1, k * 1.1); raposa(g, t, hf); g.restore();
      env.hit("raposa", fx, fy - 50 * k, 90 * k, "raposa");
    },
  },
  {
    id: "codigo", name: t("tema.codigo"), light: false,
    grid: "rgba(80,255,140,0.035)", accent: hx("#5dff8a"), sprinkle: ["#ffffff"], trailGlyph: "01",
    bg(ctx, { W, H }) { ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, "#000402"], [1, "#001208"]]); ctx.fillRect(0, 0, W, H); },
    ambient(env, glyph, R) {
      const { t, mouse, cw, ch } = env, rows = R.rows, glifos = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789<>{}[]=+*/;:";
      for (let c = 0; c < R.cols; c++) {
        if (hash(c, 9) > 0.62) continue;
        const sp = 6 + hash(c, 1) * 10, len = 6 + Math.floor(hash(c, 2) * 16), per = rows + len + Math.floor(hash(c, 3) * rows), head = Math.floor((t * sp + hash(c, 4) * per) % per);
        const perto = mouse ? clamp(1 - Math.abs(c * cw - mouse.x) / 120) : 0;
        for (let d = 0; d < len; d++) {
          const r = head - d; if (r < 0 || r >= rows) continue;
          if (mouse && Math.hypot(c * cw - mouse.x, r * ch - mouse.y) < 70) continue;
          const ch2 = glifos[Math.floor(hash(c * 7 + r, Math.floor(t * 3) + d) * glifos.length)];
          const a = (1 - d / len), cor = d === 0 ? `rgba(230,255,235,${0.95})` : `rgba(${60 + 120 * perto | 0},${200 + 55 * a | 0},${110 + 80 * perto | 0},${0.15 + 0.7 * a})`;
          glyph(c, r, ch2, cor);
        }
      }
    },
    click(x, y, t, R) { R.add(ripple(x, y, t, { chars: "01", speed: 380, force: 700, alpha: 0.9 })); R.add({ kind: "decod", x, y, t, life: 1.4 }); },
    scene(g, env) {
      const { W, H, t, k } = env, hc = env.hovered("cubo"), giro = t * 0.5 + (hc >= 0 ? (1 - Math.exp(-hc)) * 3 : 0);
      // a wireframe cube turning in the middle of the rain
      const [cx, cy] = env.body("cubo", W * 0.72, H * 0.38, "flee", 260, 0.3), s = 150 * k;
      const v = [];
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
        const x1 = x * Math.cos(giro) - z * Math.sin(giro), z1 = x * Math.sin(giro) + z * Math.cos(giro);
        const y1 = y * Math.cos(giro * 0.6) - z1 * Math.sin(giro * 0.6), z2 = y * Math.sin(giro * 0.6) + z1 * Math.cos(giro * 0.6), p = 3 / (3 + z2);
        v.push([cx + x1 * s * p, cy + y1 * s * p]);
      }
      g.lineCap = "round"; g.lineWidth = 10 * k; g.strokeStyle = hc >= 0 ? "#c8ffd8" : "#3dff7a";
      for (const [a, b] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) { g.beginPath(); g.moveTo(...v[a]); g.lineTo(...v[b]); g.stroke(); }
      env.hit("cubo", cx, cy, s * 1.2, "cubo");
      // a terminal window with a blinking prompt
      g.save(); g.translate(W * 0.2, H * 0.62); g.scale(k, k);
      rr(g, -170, -110, 340, 220, 10, "#04170b"); rr(g, -170, -110, 340, 28, 10, "#0d3a1c");
      for (let i = 0; i < 3; i++) circ(g, -150 + i * 18, -96, 5, ["#ff5f57", "#febc2e", "#28c840"][i]);
      for (let l = 0; l < 5; l++) rr(g, -150, -66 + l * 30, 60 + hash(l, Math.floor(t / 2)) * 200, 12, 3, "#2bd36a");
      if (Math.floor(t * 2) % 2) rr(g, -150 + 70, 84, 14, 18, 2, "#c8ffd8");
      g.restore();
      env.hit("terminal", W * 0.2, H * 0.62, 170 * k, "terminal");
    },
  },
  {
    id: "arcade", name: "Arcade", light: false,
    grid: "rgba(120,140,255,0.04)", accent: hx("#7dff6a"), sprinkle: ["#ffffff"],
    bg(ctx, { W, H, t }) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, "#04020c"], [1, "#0c0620"]]); ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 4) { ctx.fillStyle = "rgba(255,255,255,0.018)"; ctx.fillRect(0, y, W, 1); }
    },
    ambient({ W, H, t, cw, ch }, glyph) {
      for (let i = 0; i < 70; i++) { const y = ((hash(i, 2) * H + t * (20 + hash(i, 3) * 40)) % H); glyph(Math.floor((hash(i, 1) * W) / cw), Math.floor(y / ch), "·", `rgba(200,210,255,${0.2 + 0.4 * hash(i, 4)})`); }
      const pontos = String(1000 + Math.floor(t * 37) * 10).padStart(6, "0");
      [..."SCORE " + pontos].forEach((c, i) => glyph(3 + i, 1, c, "rgba(255,255,255,0.75)"));
      [..."HI 099990"].forEach((c, i) => glyph(Math.floor(W / cw) - 13 + i, 1, c, "rgba(255,255,255,0.75)"));
    },
    click(x, y, t, R) { R.add({ kind: "tiro", x, y, t, life: 0.9 }); },
    scene(g, env) {
      const { W, H, t, k, mouse } = env, p = 9 * k;
      // the fleet marches side to side in steps and slowly descends, looping
      const ciclo = 36, u = (t % ciclo) / ciclo, passo = Math.floor(t * 2), lado = Math.sin(passo * 0.35) * W * 0.12, desce = u * H * 0.18;
      const cores = ["#ff5fd2", "#5ff2ff", "#7dff6a"], anima = passo % 2;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
        const key = "a" + r + "_" + c, x0 = W * 0.5 + (c - 3.5) * 120 * k + lado, y0 = H * 0.16 + r * 95 * k + desce;
        const [x, y] = env.body(key, x0, y0, "flee", 120, 0.6), h = env.hovered(key);
        const morto = hash(r * 8 + c, Math.floor(t / ciclo)) < u * 0.8;
        if (morto) continue;
        let spr = ALIENS[r].map((l) => (anima && h < 0 ? l : l.split("").reverse().join("")));
        g.save(); g.translate(x, y + (h >= 0 ? Math.sin(h * 20) * 6 * k : 0)); bitmap(g, spr, p, { X: cores[r] }); g.restore();
        env.hit(key, x, y, 50 * k, "alien");
      }
      // a saucer crossing the top every so often
      const ufo = (t % 14) / 14;
      if (ufo < 0.5) { g.save(); g.translate(-100 + ufo * 2 * (W + 200), H * 0.08); bitmap(g, ["...XXXX...", ".XXXXXXXX.", "XX.XX.XX.X", "XXXXXXXXXX", "..X....X.."], p, { X: "#ff4d4d" }); g.restore(); env.hit("ufo", -100 + ufo * 2 * (W + 200), H * 0.08, 50 * k, "ufo"); }
      // bunkers
      for (let b = 0; b < 4; b++) { g.save(); g.translate(W * (0.2 + b * 0.2), H * 0.78); bitmap(g, ["..XXXXXX..", ".XXXXXXXX.", "XXXXXXXXXX", "XXXXXXXXXX", "XXX....XXX", "XX......XX"], p, { X: "#3dbb4a" }); g.restore(); }
      // the cannon follows the pointer
      const alvo = mouse ? mouse.x : W * 0.5 + Math.sin(t * 0.7) * W * 0.3;
      const cx = alvo;
      g.save(); g.translate(cx, H * 0.9); bitmap(g, ["....X....", "...XXX...", ".XXXXXXX.", "XXXXXXXXX", "XXXXXXXXX"], p, { X: "#7dff6a" }); g.restore();
      // automatic shots, and the player's click shots with a burst on arrival
      for (let s = 0; s < 3; s++) { const v = ((t + s * 0.4) % 1.2) / 1.2; rr(g, cx - p * 0.4 + (s - 1) * 2, H * 0.9 - 30 * k - v * H * 0.7, p * 0.8, p * 2.2, 2, "#ffffff"); }
      for (const f of env.effects) if (f.kind === "tiro") {
        const v = (t - f.t) / f.life, y = H * 0.9 - (H * 0.9 - f.y) * Math.min(1, v * 1.6);
        if (v < 0.62) rr(g, f.x - p * 0.5, y, p, p * 2.4, 2, "#fcee0a");
        else { const e = (v - 0.62) / 0.38; g.save(); g.translate(f.x, f.y); bitmap(g, ["X..X..X", ".X.X.X.", "..XXX..", "XXX.XXX", "..XXX..", ".X.X.X.", "X..X..X"], p * (1 + e), { X: `rgba(255,${220 - e * 120 | 0},80,${1 - e})` }); g.restore(); }
      }
    },
  },
);
