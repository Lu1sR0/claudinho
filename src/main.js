// Main process: the window, and the bridge to Claude Code through the Agent
// SDK. Every turn is a query() that resumes the conversation's session; its
// messages are forwarded to the window as small events, and tool permission
// requests wait for the person's answer in the window.

import { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut, nativeImage, protocol, net, safeStorage } from "electron";
import { query as querySdk, listSessions, getSessionMessages, renameSession, deleteSession, forkSession, createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import atualizador from "electron-updater";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
// the window's dictionaries and t(), shared with this process (globalThis)
import "./renderer/i18n/pt-BR.js";
import "./renderer/i18n/en.js";
import "./renderer/i18n/es.js";
import "./renderer/i18n/i18n.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// ---- which Claude Code runs, and how it signs in --------------------------------------
// The installer does not carry Claude Code: the app uses the one the person
// installed (where claude, the native installer's folder, or npm's). In
// development the SDK's own copy is the fallback. Sign-in is Claude Code's own
// login, or an Anthropic API key the person saves here (encrypted by the OS).
let claudeExe;
function acharClaude() {
  if (claudeExe !== undefined) return claudeExe;
  const home = os.homedir(), appdata = process.env.APPDATA || "";
  const candidatos = [process.env.CLAUDE_CODE_PATH, path.join(home, ".local", "bin", "claude.exe"), path.join(home, ".local", "bin", "claude")];
  try { candidatos.push(...execFileSync(process.platform === "win32" ? "where" : "which", ["claude"], { encoding: "utf8", windowsHide: true }).split(/\r?\n/).map((x) => x.trim()).filter(Boolean)); } catch {}
  candidatos.push(path.join(appdata, "npm", "node_modules", "@anthropic-ai", "claude-code", "cli.js"));
  // an npm .cmd shim points at the package's cli.js, which the SDK runs with node
  const real = (c) => (/\.cmd$/i.test(c) ? path.join(path.dirname(c), "node_modules", "@anthropic-ai", "claude-code", "cli.js") : c);
  claudeExe = candidatos.filter(Boolean).map(real).find((c) => { try { return fs.statSync(c).isFile(); } catch { return false; } }) || null;
  return claudeExe;
}
const temClaudeEmbutido = () => { try { return fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.resolve("@anthropic-ai/claude-agent-sdk"))), "..", "claude-agent-sdk-" + process.platform + "-" + process.arch)); } catch { return false; } };
function chaveApi() {
  if (!config.chaveApi) return "";
  try { return safeStorage.decryptString(Buffer.from(config.chaveApi, "base64")); } catch { return ""; }
}
// every query goes through here: the person's Claude Code and the chosen sign-in
function query(args) {
  const exe = acharClaude();
  if (!exe && !temClaudeEmbutido()) throw new Error(t("main.semClaude"));
  const extra = {};
  if (exe) extra.pathToClaudeCodeExecutable = exe;
  const chave = config.entrar === "chave" ? chaveApi() : "";
  if (chave) extra.env = { ...process.env, ANTHROPIC_API_KEY: chave };
  return querySdk({ ...args, options: { ...extra, ...args.options } });
}
const configPath = () => path.join(app.getPath("userData"), "config.json");

const TEMAS = {
  claude: "Claude Code", clouds: "Cloud Drift", lagoon: "Honu Lagoon", koi: "Koi Pond", jelly: "Jellyfish",
  boats: "Paper Boats", fireflies: "Fireflies", moonlit: "Moonlit", lareira: "Lareira", chuva: "Chuva Lo-fi",
  galaxia: "Galáxia Distante", sakura: "Jardim Sakura", aurora: "Aurora", codigo: "Chuva de Código", arcade: "Arcade",
};

// The ASCII Magic pieces (ascii-magic-art, MIT), from the index that
// tools/indice-magia.mjs writes for the window.
const MAGIA = (() => {
  try {
    const s = fs.readFileSync(path.join(here, "renderer", "wallpapers", "magia-indice.js"), "utf8");
    const { cats, pecas } = JSON.parse(s.slice(s.indexOf("=") + 1).trim().replace(/;$/, ""));
    return { cats: Object.fromEntries(cats), pecas: new Map(pecas.map(([slug, nome, cat, nota, tags]) => [slug, { slug, nome, cat, nota, tags }])) };
  } catch { return { cats: {}, pecas: new Map() }; }
})();
function buscaMagia(busca = "", categoria = "") {
  const termos = busca.toLowerCase().split(/\s+/).filter(Boolean);
  const pontos = (p) => {
    if (categoria && p.cat !== categoria) return -1;
    if (!termos.length) return 1;
    const nome = p.nome.toLowerCase(), resto = `${p.slug} ${p.tags} ${p.nota} ${p.cat}`.toLowerCase();
    let n = 0;
    for (const t of termos) { const r = new RegExp("(^|[^a-z0-9])" + t.replace(/[^a-z0-9-]/g, "")); n += r.test(nome) ? 3 : r.test(resto) ? 1 : 0; }
    return n;
  };
  return [...MAGIA.pecas.values()].map((p) => [pontos(p), p]).filter(([n]) => n > 0).sort((a, b) => b[0] - a[0]).map(([, p]) => p);
}

let config = { cwd: path.join(app.getPath("home"), "projetos"), model: "", modo: "default", esforco: "" };
// Each window holds its own conversation: the session it shows and the turn
// running in it ({ q, ac }). The settings and the project folder are shared.
const janelas = new Map();   // webContents id -> { win, sessionId, atual, cwd }
let principal = null;        // the first window: global shortcut and test hooks
const J = (e) => janelas.get(e.sender.id);
const pendentes = new Map(); // permission request id -> { resolve, suggestions, input }

function lerConfig() {
  // Settings saved under the app's earlier names are carried over.
  const antigos = ["Tessela", "claude-vivo"].map((n) => path.join(app.getPath("appData"), n, "config.json"));
  for (const p of [configPath(), ...antigos]) { try { config = { ...config, ...JSON.parse(fs.readFileSync(p, "utf8")) }; break; } catch {} }
  if (!fs.existsSync(config.cwd)) config.cwd = app.getPath("home");
  usaIdioma(idiomaEscolhido());
}
// The language chosen in Personalizar → Geral or, until there is one, the system's.
const idiomaEscolhido = () => config.visual?.geral?.idioma || app.getLocale();
function salvarConfig() {
  try { fs.mkdirSync(path.dirname(configPath()), { recursive: true }); fs.writeFileSync(configPath(), JSON.stringify(config, null, 2)); } catch {}
}
const enviarEvento = (j, ev) => {
  if (process.env.VIVO_LOG) console.log("[evento]", ev.tipo, ev.tema || ev.nome || ev.ferramenta || ev.modelo || ev.detalhe || ev.texto || "");
  if (j?.win && !j.win.isDestroyed()) j.win.webContents.send("evento", ev);
};

// The themes, as tools Claude can call: suggest one (a card with Aplicar and
// Prévia in the chat) or apply one right away. The same for the pieces of the
// ASCII Magic library, which Claude searches first.
const texto = (t) => ({ content: [{ type: "text", text: t }] });
const peca = (slug) => MAGIA.pecas.get(String(slug).trim().toLowerCase());
const semPeca = (slug) => ({ ...texto(`Não existe a peça "${slug}". Use buscar_fundo para achar o nome certo.`), isError: true });
const servidorTemasPara = (j) => createSdkMcpServer({
  name: "claudinho",
  version: "0.2.0",
  instructions: "Este app mostra papéis de parede ASCII animados atrás da conversa. Há dois tipos: os 16 temas do Claudinho (interativos, com música) e a biblioteca ASCII Magic, com " +
    `${MAGIA.pecas.size} animações. Quando a pessoa pedir um tema ou um visual, prefira um tema do Claudinho se algum combinar; senão use buscar_fundo (em inglês: os nomes e tags da biblioteca são em inglês) e depois sugerir_fundo ou aplicar_fundo. ` +
    "Use as ferramentas de sugerir para mostrar um cartão (a pessoa decide aplicar), e as de aplicar só se ela pedir para aplicar direto. Temas da Claudinho: " +
    Object.entries(TEMAS).map(([id, nome]) => `${id} (${nome})`).join(", ") + ". Categorias da biblioteca: " + Object.entries(MAGIA.cats).map(([id, nome]) => `${id} (${nome})`).join(", ") + ".",
  tools: [
    tool("sugerir_tema", "Mostra na conversa um cartão do tema, com prévia animada e os botões Aplicar e Prévia.", { tema: z.enum(Object.keys(TEMAS)) },
      async ({ tema }) => { enviarEvento(j, { tipo: "cartao_tema", tema }); return texto(`Cartão do tema ${TEMAS[tema]} mostrado. A pessoa decide se aplica.`); }, { alwaysLoad: true }),
    tool("aplicar_tema", "Aplica o tema no fundo do app agora.", { tema: z.enum(Object.keys(TEMAS)) },
      async ({ tema }) => { enviarEvento(j, { tipo: "aplicar_tema", tema }); return texto(`Tema ${TEMAS[tema]} aplicado.`); }, { alwaysLoad: true }),
    tool("buscar_fundo", "Busca animações na biblioteca ASCII Magic por palavras em inglês (ex.: ocean night, cat, rain, galaxy) e/ou categoria. Devolve até 15 peças: id, nome, categoria e descrição.",
      { busca: z.string().describe("Palavras em inglês; vazio para listar a categoria"), categoria: z.string().optional().describe("Id da categoria, opcional") },
      async ({ busca, categoria }) => {
        const r = buscaMagia(busca, categoria || "").slice(0, 15);
        return texto(r.length ? r.map((p) => `${p.slug} — ${p.nome} (${p.cat}): ${p.nota}`).join("\n") : "Nada encontrado. Tente outras palavras em inglês ou outra categoria.");
      }, { alwaysLoad: true }),
    tool("sugerir_fundo", "Mostra na conversa um cartão de uma animação da biblioteca, com Aplicar e Prévia.", { peca: z.string().describe("Id da peça, de buscar_fundo") },
      async ({ peca: id }) => { const p = peca(id); if (!p) return semPeca(id); enviarEvento(j, { tipo: "cartao_arte", chave: `magia:${p.slug}` }); return texto(`Cartão de ${p.nome} mostrado. A pessoa decide se aplica.`); }, { alwaysLoad: true }),
    tool("aplicar_fundo", "Aplica uma animação da biblioteca no fundo do app agora.", { peca: z.string().describe("Id da peça, de buscar_fundo") },
      async ({ peca: id }) => { const p = peca(id); if (!p) return semPeca(id); enviarEvento(j, { tipo: "aplicar_arte", chave: `magia:${p.slug}` }); return texto(`${p.nome} aplicada no fundo.`); }, { alwaysLoad: true }),
  ],
});
const FERRAMENTAS_TEMA = ["sugerir_tema", "aplicar_tema", "buscar_fundo", "sugerir_fundo", "aplicar_fundo"].map((n) => `mcp__claudinho__${n}`);

// Attachments: images go to Claude as image blocks (read here when they come
// as a path), every file with a path is also listed so Claude can open it.
const IMAGEM = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };
// Each message goes with an id of ours, so the window can later undo the file
// changes made after it (file checkpoints are kept per user message). Slash
// commands go as plain text, which is how Claude Code runs them.
function montaPrompt(texto, anexos = [], uuid) {
  if (!anexos.length && texto.startsWith("/")) return texto;
  const imagens = [], caminhos = [];
  for (const a of anexos) {
    let { dados, mime } = a;
    if (a.caminho) {
      caminhos.push(a.caminho);
      const tipo = IMAGEM[path.extname(a.caminho).toLowerCase()];
      try { if (tipo && fs.statSync(a.caminho).size <= 5 * 1024 * 1024) { dados = fs.readFileSync(a.caminho).toString("base64"); mime = tipo; } } catch {}
    }
    if (dados && Object.values(IMAGEM).includes(mime)) imagens.push({ type: "image", source: { type: "base64", media_type: mime, data: dados } });
  }
  let t = texto;
  if (caminhos.length) t += `${t ? "\n\n" : ""}${globalThis.t("main.anexados")}\n${caminhos.map((c) => `- ${c}`).join("\n")}`;
  const conteudo = imagens.length ? [...imagens, { type: "text", text: t || globalThis.t("main.vejaImagem") }] : t;
  const mensagem = { type: "user", uuid, message: { role: "user", content: conteudo }, parent_tool_use_id: null };
  return (async function* () { yield mensagem; })();
}

// A short title for a new conversation, from its first exchange: a small
// model, no tools, no settings, and nothing saved as a session of its own.
async function tituloAutomatico(j, id, pergunta, resposta) {
  let titulo = "";
  const dir = j.cwd;
  try {
    for await (const m of query({
      prompt: t("main.tituloPrompt", { pergunta: pergunta.slice(0, 600), resposta: resposta.slice(0, 600) }),
      options: { cwd: dir, model: "claude-haiku-5-5", tools: [], maxTurns: 1, persistSession: false, settingSources: [], systemPrompt: t("main.tituloSistema") },
    })) if (m.type === "result" && m.subtype === "success") titulo = String(m.result || "").split("\n")[0].replace(/^["'“”*#\s]+|["'“”*.\s]+$/g, "").slice(0, 60);
  } catch {}
  if (!titulo) return;
  try { await renameSession(id, titulo, { dir }); enviarEvento(j, { tipo: "titulo", id, titulo }); } catch {}
}

// Claude Code's own slash commands, with descriptions. They come from a
// running query, so when no turn is running a short idle one is opened just to
// ask (no message is sent, nothing is spent); the list is kept per folder.
const comandosPorPasta = new Map();
async function comandos(j) {
  const cwd = j?.cwd || config.cwd;
  if (comandosPorPasta.has(cwd)) return comandosPorPasta.get(cwd);
  let lista = [];
  if (j?.atual) lista = await j.atual.q.supportedCommands();
  else {
    const ac = new AbortController();
    let solta;
    const espera = new Promise((r) => (solta = r));
    const q = query({ prompt: (async function* () { await espera; })(), options: { cwd, abortController: ac, systemPrompt: { type: "preset", preset: "claude_code" } } });
    try { lista = await q.supportedCommands(); } finally { solta(); ac.abort(); q.return?.().catch(() => {}); }
  }
  const r = lista.map((c) => ({ nome: c.name, descricao: c.description || "", dica: c.argumentHint || "" }));
  comandosPorPasta.set(cwd, r);
  return r;
}

// Animations made in ASCII Motion (ascii-motion.app): its JSON export, a saved
// session (.asciimtn, flat frames) or plain text, reduced to frames of lines
// with their colours and kept in the app's data folder.
const pastaMotion = () => path.join(app.getPath("userData"), "motion");
const cores = (v) => { if (!v) return {}; if (typeof v === "string") { try { return JSON.parse(v); } catch { return {}; } } return v; };
function leMotion(conteudo, nomeArquivo) {
  const nome = path.basename(nomeArquivo).replace(/\.(json|asciimtn|txt)$/i, "");
  let o = null;
  try { o = JSON.parse(conteudo); } catch {}
  let anim;
  if (o && Array.isArray(o.frames) && o.canvas) {
    const fps = o.animation?.frameRate || 12;
    anim = { nome: o.metadata?.title || nome, w: o.canvas.width, h: o.canvas.height, fundo: o.canvas.backgroundColor, quadros: o.frames.map((f) => ({
      linhas: Array.isArray(f.content) ? f.content.map(String) : String(f.contentString ?? f.content ?? "").split("\n"),
      fg: cores(f.colors?.foreground), bg: cores(f.colors?.background), dur: f.duration || 1000 / fps })) };
  } else if (o && Array.isArray(o.animation?.frames) && o.canvas) {
    const w = o.canvas.width, h = o.canvas.height, fps = o.animation.frameRate || 12;
    anim = { nome: o.name || nome, w, h, fundo: o.canvas.canvasBackgroundColor, quadros: o.animation.frames.map((f) => {
      const linhas = Array.from({ length: h }, () => Array(w).fill(" ")), fg = {}, bg = {};
      for (const [k, c] of Object.entries(f.data || {})) {
        const [x, y] = k.split(",").map(Number);
        if (!(x >= 0 && x < w && y >= 0 && y < h) || !c) continue;
        linhas[y][x] = c.char || " ";
        if (c.color) fg[k] = c.color;
        if (c.bgColor && c.bgColor !== "transparent") bg[k] = c.bgColor;
      }
      return { linhas: linhas.map((l) => l.join("").replace(/\s+$/, "")), fg, bg, dur: f.duration || 1000 / fps };
    }) };
  } else if (o) {
    throw new Error(t("main.motionCamadas"));
  } else {
    const quadros = conteudo.replace(/\r/g, "").split(/\n-{3,}\n/).map((q) => ({ linhas: q.split("\n"), fg: {}, bg: {}, dur: 100 }));
    anim = { nome, w: 0, h: 0, quadros };
  }
  anim.quadros = anim.quadros.filter((q) => q.linhas.length).slice(0, 3000);
  if (!anim.quadros.length) throw new Error(t("main.motionVazio"));
  anim.w = Math.min(400, Math.max(anim.w || 0, ...anim.quadros.map((q) => Math.max(0, ...q.linhas.map((l) => [...l].length)))));
  anim.h = Math.min(400, Math.max(anim.h || 0, ...anim.quadros.map((q) => q.linhas.length)));
  if (!anim.fundo || anim.fundo === "transparent") anim.fundo = "#0d0d0f";
  return anim;
}
function importaMotion(arquivo) {
  if (fs.statSync(arquivo).size > 40 * 1024 * 1024) throw new Error(t("main.grandeDemais"));
  const anim = leMotion(fs.readFileSync(arquivo, "utf8"), arquivo);
  const base = anim.nome.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "animacao";
  anim.id = `${base}-${crypto.randomBytes(3).toString("hex")}`;
  fs.mkdirSync(pastaMotion(), { recursive: true });
  fs.writeFileSync(path.join(pastaMotion(), anim.id + ".json"), JSON.stringify(anim));
  return { id: anim.id, nome: anim.nome, quadros: anim.quadros.length };
}
const idMotion = (id) => String(id).replace(/[^a-z0-9-]/g, "");

// Personal files: backgrounds (images, GIFs, videos), sounds, music, fonts and
// the app icon, copied into the app's data folder so they keep working if the
// originals move. The window gets them back as file:// URLs.
const TIPOS = {
  fundos: { get nome() { return t("main.tipoFundos"); }, ext: ["png", "jpg", "jpeg", "webp", "gif", "avif", "mp4", "webm", "mov", "m4v"] },
  sons: { get nome() { return t("main.tipoSons"); }, ext: ["mp3", "wav", "ogg", "m4a", "flac", "aac", "opus"] },
  musica: { get nome() { return t("main.tipoMusica"); }, ext: ["mp3", "wav", "ogg", "m4a", "flac", "aac", "opus"] },
  fontes: { get nome() { return t("main.tipoFontes"); }, ext: ["ttf", "otf", "woff", "woff2"] },
  icone: { get nome() { return t("main.tipoIcone"); }, ext: ["png", "ico", "jpg", "jpeg"] },
};
const pastaPessoal = (tipo) => path.join(app.getPath("userData"), "pessoal", tipo);
const itemPessoal = (tipo, arquivo) => ({ id: arquivo, nome: arquivo.replace(/^[0-9a-f]{6}-/, "").replace(/\.[^.]+$/, ""), url: pathToFileURL(path.join(pastaPessoal(tipo), arquivo)).href, ext: path.extname(arquivo).slice(1).toLowerCase() });
function listaPessoal(tipo) {
  if (!TIPOS[tipo]) return [];
  let itens = [];
  try { itens = fs.readdirSync(pastaPessoal(tipo)).filter((f) => TIPOS[tipo].ext.includes(path.extname(f).slice(1).toLowerCase())).map((f) => itemPessoal(tipo, f)); } catch {}
  return tipo === "fundos" ? [...itens, ...listaWeb()] : itens;
}
function copiaPessoal(tipo, origem, nome) {
  const ext = path.extname(origem).slice(1).toLowerCase();
  if (!TIPOS[tipo]?.ext.includes(ext)) throw new Error(t("main.formatoErrado", { ext, tipo: TIPOS[tipo]?.nome.toLowerCase() || tipo }));
  const base = (nome || path.basename(origem, path.extname(origem))).replace(/[^\p{L}\p{N} _().-]+/gu, "").trim().slice(0, 60) || tipo;
  const arquivo = `${crypto.randomBytes(3).toString("hex")}-${base}.${ext}`;
  fs.mkdirSync(pastaPessoal(tipo), { recursive: true });
  fs.copyFileSync(origem, path.join(pastaPessoal(tipo), arquivo));
  return itemPessoal(tipo, arquivo);
}
const arquivoPessoal = (tipo, id) => path.join(pastaPessoal(tipo), path.basename(String(id)));

// Wallpaper Engine (Steam): the video and web wallpapers the person has. Scenes
// are drawn by Wallpaper Engine's own renderer and only run inside it, so they
// are counted and left out. A web wallpaper is copied whole and runs in a
// sandboxed frame with no access to the app.
function bibliotecasSteam() {
  let raiz = "C:\\Program Files (x86)\\Steam";
  try {
    const r = execFileSync("reg", ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"], { encoding: "utf8", windowsHide: true });
    const m = /SteamPath\s+REG_SZ\s+(.+)/.exec(r); if (m) raiz = m[1].trim();
  } catch {}
  // the registry and libraryfolders.vdf spell the same folder in different case
  const libs = new Map(), poe = (p) => { const n = path.normalize(p); libs.set(n.toLowerCase(), libs.get(n.toLowerCase()) || n); };
  poe(raiz);
  try { for (const m of fs.readFileSync(path.join(raiz, "steamapps", "libraryfolders.vdf"), "utf8").matchAll(/"path"\s+"([^"]+)"/g)) poe(m[1].replace(/\\\\/g, "\\")); } catch {}
  return [...libs.values()];
}
const lerProjeto = (pasta) => { try { return JSON.parse(fs.readFileSync(path.join(pasta, "project.json"), "utf8").replace(/^\uFEFF/, "")); } catch { return null; } };
function listaWallpaperEngine() {
  const itens = [], vistos = new Set();
  let cenas = 0, achou = false;
  for (const lib of bibliotecasSteam()) {
    const we = path.join(lib, "steamapps", "common", "wallpaper_engine", "projects");
    for (const base of [path.join(lib, "steamapps", "workshop", "content", "431960"), path.join(we, "myprojects"), path.join(we, "defaultprojects")]) {
      let pastas; try { pastas = fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { continue; }
      achou = true;
      for (const d of pastas) {
        const pasta = path.join(base, d.name), p = lerProjeto(pasta);
        if (!p || vistos.has(pasta)) continue;
        vistos.add(pasta);
        const tipo = String(p.type || "").toLowerCase();
        if (tipo !== "video" && tipo !== "web") { if (tipo === "scene") cenas++; continue; }
        if (!p.file || !fs.existsSync(path.join(pasta, p.file))) continue;
        const prev = p.preview && path.join(pasta, p.preview);
        itens.push({ pasta, nome: String(p.title || d.name).trim().slice(0, 80), tipo, preview: prev && fs.existsSync(prev) ? pathToFileURL(prev).href : null });
      }
    }
  }
  itens.sort((a, b) => a.nome.localeCompare(b.nome, idiomaAtual()));
  return { achou, itens, cenas };
}
// Shims so a web wallpaper starts the way it does inside Wallpaper Engine: its
// audio and media hooks exist (and stay quiet), and its settings arrive with
// the defaults from project.json once the page has loaded.
const shimWeb = (props) => `// Claudinho: o que o Wallpaper Engine daria a este papel de parede.
(function () {
  var nada = function () {};
  ["wallpaperRegisterAudioListener", "wallpaperRegisterMediaStatusListener", "wallpaperRegisterMediaPropertiesListener", "wallpaperRegisterMediaThumbnailListener", "wallpaperRegisterMediaPlaybackListener", "wallpaperRegisterMediaTimelineListener"].forEach(function (k) { window[k] = nada; });
  window.addEventListener("load", function () {
    var l = window.wallpaperPropertyListener || {};
    try { if (l.applyGeneralProperties) l.applyGeneralProperties({ fps: 60 }); } catch (e) {}
    try { if (l.applyUserProperties) l.applyUserProperties(${JSON.stringify(props || {})}); } catch (e) {}
    try { if (l.setPaused) l.setPaused(false); } catch (e) {}
  });
})();
`;
const pastaWeb = () => path.join(app.getPath("userData"), "pessoal", "web");
function listaWeb() {
  let dirs; try { dirs = fs.readdirSync(pastaWeb(), { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { return []; }
  return dirs.flatMap((d) => {
    try {
      const m = JSON.parse(fs.readFileSync(path.join(pastaWeb(), d.name, "claudinho.json"), "utf8"));
      return [{ id: d.name, nome: m.nome, ext: "web", url: `claudinho-we://${d.name}/${m.file.split(/[\\/]/).map(encodeURIComponent).join("/")}`, preview: m.preview ? pathToFileURL(path.join(pastaWeb(), d.name, m.preview)).href : null }];
    } catch { return []; }
  });
}
function importaWallpaperEngine(pasta) {
  if (!listaWallpaperEngine().itens.some((i) => i.pasta === pasta)) throw new Error(t("main.weSumiu"));
  const p = lerProjeto(pasta), nome = String(p.title || "Wallpaper Engine").trim().slice(0, 60);
  if (String(p.type).toLowerCase() === "video") return copiaPessoal("fundos", path.join(pasta, p.file), nome);
  const id = `${crypto.randomBytes(3).toString("hex")}-${nome.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "web"}`;
  const dest = path.join(pastaWeb(), id);
  fs.cpSync(pasta, dest, { recursive: true });
  fs.writeFileSync(path.join(dest, "claudinho-we.js"), shimWeb(p.general?.properties));
  const html = path.join(dest, p.file), h = fs.readFileSync(html, "utf8"), tag = '<script src="claudinho-we.js"></script>';
  fs.writeFileSync(html, /<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, (m) => m + tag) : tag + h);
  fs.writeFileSync(path.join(dest, "claudinho.json"), JSON.stringify({ nome, file: p.file, preview: p.preview || null }));
  return listaWeb().find((i) => i.id === id);
}
// The window icon: the person's own, or the mosaic mark.
function aplicaIcone() {
  const id = config.visual?.icone;
  let img = id ? nativeImage.createFromPath(arquivoPessoal("icone", id)) : null;
  if (!img || img.isEmpty()) img = nativeImage.createFromPath(path.join(here, "icone.png"));
  for (const j of janelas.values()) try { j.win.setIcon(img); } catch {}
}

async function turno(j, texto, anexos) {
  const ev = (x) => enviarEvento(j, x);
  const ac = new AbortController(), uuid = crypto.randomUUID(), geral = config.visual?.geral || {};
  const novo = !j.sessionId;
  let resposta = "";
  const prompt = montaPrompt(texto, anexos, uuid);
  const q = query({
    prompt,
    options: {
      cwd: j.cwd,
      model: config.model || undefined,
      resume: j.sessionId || undefined,
      permissionMode: config.modo || "default",
      effort: config.esforco || undefined,
      enableFileCheckpointing: true,
      thinking: geral.raciocinio === false ? undefined : { type: "adaptive", display: "summarized" },
      includePartialMessages: true,
      abortController: ac,
      systemPrompt: { type: "preset", preset: "claude_code" },
      mcpServers: { claudinho: servidorTemasPara(j) },
      allowedTools: FERRAMENTAS_TEMA,
      canUseTool: (toolName, input, { signal, suggestions, decisionReason }) => new Promise((resolve) => {
        const id = crypto.randomUUID();
        pendentes.set(id, { resolve, suggestions, input, j, toolName });
        // Claude asking the person something: the choices become a form.
        if (toolName === "AskUserQuestion") ev({ tipo: "pergunta", id, perguntas: input.questions || [] });
        else ev({ tipo: "permissao", id, ferramenta: toolName, entrada: input, motivo: decisionReason ?? null, temSempre: !!suggestions?.length });
        signal.addEventListener("abort", () => {
          if (pendentes.delete(id)) { resolve({ behavior: "deny", message: "Cancelado." }); ev({ tipo: "permissao_fim", id }); }
        });
      }),
    },
  });
  j.atual = { q, ac };
  let contexto = 0;
  ev({ tipo: "inicio", uuid: typeof prompt === "string" ? null : uuid });
  try {
    for await (const msg of q) {
      if (msg.session_id && msg.session_id !== j.sessionId) { j.sessionId = msg.session_id; ev({ tipo: "sessao", id: j.sessionId }); }
      if (msg.type === "system" && msg.subtype === "thinking_tokens") {
        ev({ tipo: "pensando", tokens: msg.estimated_tokens });
      } else if (msg.type === "system" && msg.subtype === "init") {
        ev({ tipo: "info", modelo: msg.model, cwd: msg.cwd, modo: msg.permissionMode });
      } else if (msg.type === "stream_event" && !msg.parent_tool_use_id) {
        const e = msg.event;
        if (e.type === "content_block_start" && e.content_block.type === "text") ev({ tipo: "texto_inicio" });
        if (e.type === "content_block_delta" && e.delta.type === "text_delta") { resposta += e.delta.text; ev({ tipo: "texto", delta: e.delta.text }); }
        if (e.type === "content_block_start" && e.content_block.type === "thinking") ev({ tipo: "raciocinio_inicio" });
        if (e.type === "content_block_delta" && e.delta.type === "thinking_delta") ev({ tipo: "raciocinio", delta: e.delta.thinking });
      } else if (msg.type === "assistant" && !msg.parent_tool_use_id) {
        for (const b of msg.message.content) {
          if (b.type === "tool_use") ev({ tipo: "ferramenta", id: b.id, nome: b.name, entrada: b.input });
        }
        // The id of a reply with text, so the window can branch from it.
        if (msg.message.content.some((b) => b.type === "text" && b.text.trim())) ev({ tipo: "marca", uuid: msg.uuid });
        // What the last request carried is how full the context is.
        const u = msg.message.usage;
        if (u) contexto = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.output_tokens || 0);
        if (msg.error) ev({ tipo: "erro", texto: t("main.erroApi", { erro: msg.error }) });
      } else if (msg.type === "user" && !msg.parent_tool_use_id && Array.isArray(msg.message?.content)) {
        for (const b of msg.message.content) {
          if (b.type === "tool_result") {
            const corpo = typeof b.content === "string" ? b.content : (b.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
            ev({ tipo: "ferramenta_fim", id: b.tool_use_id, erro: !!b.is_error, saida: corpo.slice(0, 4000) });
          }
        }
      } else if (msg.type === "rate_limit_event") {
        ev({ tipo: "limite", info: msg.rate_limit_info });
      } else if (msg.type === "result") {
        ev({ tipo: "fim", ok: msg.subtype === "success" && !msg.is_error, duracao: msg.duration_ms, detalhe: msg.subtype });
        const usos = Object.values(msg.modelUsage || {});
        const janela = Math.max(0, ...usos.map((m) => m.contextWindow || 0));
        const saida = usos.reduce((n, m) => n + (m.outputTokens || 0), 0);
        if (janela && contexto) ev({ tipo: "uso", contexto, janela, saida });
      }
    }
  } catch (err) {
    if (!ac.signal.aborted) ev({ tipo: "erro", texto: String(err?.message || err) });
  } finally {
    j.atual = null;
    ev({ tipo: "parado" });
    if (j.recarregar) recarrega(j);
    if (novo && j.sessionId && geral.titulo !== false && resposta && !texto.startsWith("/")) tituloAutomatico(j, j.sessionId, texto, resposta);
  }
}

// History of a Claude Code session, reduced to what the window draws.
async function historico(id, dir) {
  const msgs = await getSessionMessages(id, dir ? { dir } : undefined);
  const out = [];
  for (const m of msgs) {
    if (m.parent_tool_use_id) continue;
    const c = m.message?.content;
    if (m.isMeta || m.isCompactSummary) continue;
    if (m.type === "user") {
      if (typeof c === "string") { if (!c.trimStart().startsWith("<")) out.push({ papel: "eu", texto: c, uuid: m.uuid }); }
      else if (Array.isArray(c)) {
        const t = c.filter((b) => b.type === "text").map((b) => b.text).join("\n"), imagens = c.filter((b) => b.type === "image").length;
        if ((t && !t.startsWith("<")) || imagens) out.push({ papel: "eu", texto: t, imagens, uuid: m.uuid });
      }
    } else if (m.type === "assistant" && Array.isArray(c)) {
      for (const b of c) {
        if (b.type === "text" && b.text.trim()) out.push({ papel: "claude", texto: b.text, uuid: m.uuid });
        if (b.type === "tool_use") out.push({ papel: "ferramenta", nome: b.name, entrada: b.input });
      }
    }
  }
  return out;
}

// A window; with a session id it opens straight on that conversation.
function criarJanela(sessao) {
  const win = new BrowserWindow({
    width: sessao ? 1180 : 1440, height: sessao ? 820 : 920, minWidth: 940, minHeight: 620,
    backgroundColor: "#262624",
    title: config.visual?.nome || "Claudinho",
    titleBarStyle: "hidden",
    titleBarOverlay: { color: "#00000000", symbolColor: "#e9e6e1", height: 44 },
    webPreferences: { preload: path.join(here, "preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true, offscreen: !!process.env.VIVO_GRAVAR },
  });
  // VIVO_GRAVAR="pasta" (tests and demo videos): the window renders offscreen
  // at 30 fps and, between "@@gravar:on" and "@@gravar:off" logged by the page,
  // each frame is saved as a JPEG with its time, for ffmpeg.
  if (process.env.VIVO_GRAVAR && !principal) {
    const dir = process.env.VIVO_GRAVAR, tempos = [];
    let gravando = false, n = 0, t0 = 0;
    fs.mkdirSync(dir, { recursive: true });
    win.webContents.setFrameRate(30);
    win.webContents.on("console-message", (e) => {
      if (e.message === "@@gravar:on") { gravando = true; t0 = performance.now(); }
      if (e.message === "@@gravar:off") { gravando = false; fs.writeFileSync(path.join(dir, "tempos.json"), JSON.stringify(tempos)); }
    });
    win.webContents.on("paint", (_e, _r, img) => {
      if (!gravando) return;
      const nome = String(n++).padStart(5, "0") + ".jpg";
      tempos.push([nome, Math.round(performance.now() - t0)]);
      fs.writeFile(path.join(dir, nome), img.toJPEG(90), () => {});
    });
  }
  // (VIVO_PASTA: a folder for test runs, never saved)
  const j = { win, sessionId: null, atual: null, cwd: (!principal && process.env.VIVO_PASTA) || config.cwd }, id = win.webContents.id;
  janelas.set(id, j);
  if (!principal) principal = j;
  win.on("closed", () => {
    if (j.atual) j.atual.ac.abort();
    janelas.delete(id);
    if (principal === j) principal = janelas.values().next().value || null;
  });
  win.loadFile(path.join(here, "renderer", "index.html"), sessao ? { query: { sessao } } : undefined);
  aplicaIcone();
  win.on("page-title-updated", (e) => { if (config.visual?.nome) { e.preventDefault(); win.setTitle(config.visual.nome); } });
  // Window warnings and errors reach the terminal, where `npm start` shows them.
  win.webContents.on("console-message", (e) => { if (e.level === "warning" || e.level === "error") console.log(`[janela ${e.level}] ${e.message} (${e.sourceId}:${e.lineNumber})`); });
  win.webContents.on("render-process-gone", (_e, d) => console.log(`[janela] caiu: ${d.reason} (${d.exitCode})`));
  win.webContents.on("unresponsive", () => console.log("[janela] travou"));
  win.webContents.on("did-finish-load", () => {
    console.log("[janela] carregada");
    if (j !== principal || sessao) return;
    // VIVO_TESTE="..." sends that message on start: an end-to-end check.
    // VIVO_MOTION="arquivo" imports an ASCII Motion file on start.
    if (process.env.VIVO_MOTION) { try { console.log("[motion]", importaMotion(process.env.VIVO_MOTION)); } catch (e) { console.log("[motion] erro:", e.message); } }
    // VIVO_JS="expressão" runs in the window after load and prints the result;
    // VIVO_FOTO="arquivo.png" saves a picture of the window right after.
    // VIVO_TAMANHO="1024x700" sets the window size for the test.
    if (process.env.VIVO_TAMANHO) { const [w, h] = process.env.VIVO_TAMANHO.split("x").map(Number); win.setSize(w, h); }
    // VIVO_METRICAS=1 prints the CPU each process used while the expression ran.
    if (process.env.VIVO_JS) win.webContents.setBackgroundThrottling(false), win.moveTop(), setTimeout(async () => {
      if (process.env.VIVO_METRICAS) app.getAppMetrics();
      try { console.log("[js]", JSON.stringify(await win.webContents.executeJavaScript(process.env.VIVO_JS, true))); } catch (e) { console.log("[js] erro:", e.message); }
      if (process.env.VIVO_METRICAS) {
        const m = app.getAppMetrics(), por = {};
        for (const p of m) por[p.type] = (por[p.type] || 0) + p.cpu.percentCPUUsage;
        console.log("[metricas]", JSON.stringify(Object.fromEntries(Object.entries(por).map(([k, v]) => [k, +v.toFixed(1)]))), "total", m.reduce((a, p) => a + p.cpu.percentCPUUsage, 0).toFixed(1));
      }
      // VIVO_QUADRO="expressão" runs in every frame inside the window (web wallpapers)
      if (process.env.VIVO_QUADRO) for (const f of win.webContents.mainFrame.frames) try { console.log("[quadro]", f.url, JSON.stringify(await f.executeJavaScript(process.env.VIVO_QUADRO, true))); } catch (e) { console.log("[quadro] erro:", e.message); }
      if (process.env.VIVO_FOTO) fs.writeFileSync(process.env.VIVO_FOTO, (await win.webContents.capturePage()).toPNG());
    }, 4500);
    if (process.env.VIVO_TESTE) turno(j, process.env.VIVO_TESTE, process.env.VIVO_ANEXO ? [{ caminho: process.env.VIVO_ANEXO }] : []);
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  return j;
}
// A conversation running in another window can't be opened to send here too.
const emOutra = (j, id) => [...janelas.values()].some((o) => o !== j && o.sessionId === id && o.atual);

ipcMain.handle("estado", (e) => ({ ...config, cwd: J(e).cwd, sessionId: J(e).sessionId, rodando: !!J(e).atual, temas: TEMAS, janelas: janelas.size }));
ipcMain.handle("enviar", (e, texto, anexos) => {
  const j = J(e);
  if (j.atual) return false;
  if (j.sessionId && emOutra(j, j.sessionId)) { enviarEvento(j, { tipo: "erro", texto: t("main.emOutraJanela") }); return false; }
  turno(j, String(texto), Array.isArray(anexos) ? anexos : []); return true;
});
ipcMain.handle("janela_nova", (_e, sessao) => { criarJanela(sessao || undefined); });
ipcMain.handle("comandos", async (e) => { try { return await comandos(J(e)); } catch (e) { console.log("[comandos]", e?.message || e); return []; } });
ipcMain.handle("anexar", async (e) => {
  const r = await dialog.showOpenDialog(J(e).win, { title: t("main.anexar"), defaultPath: J(e).cwd, properties: ["openFile", "multiSelections"] });
  return r.canceled ? [] : r.filePaths;
});
ipcMain.handle("motion_importar", async (e, caminho) => {
  let arquivo = caminho;
  if (!arquivo) {
    const r = await dialog.showOpenDialog(J(e).win, { title: t("main.importarMotion"), filters: [{ name: "ASCII Motion", extensions: ["json", "asciimtn", "txt"] }], properties: ["openFile"] });
    if (r.canceled || !r.filePaths[0]) return null;
    arquivo = r.filePaths[0];
  }
  try { return importaMotion(arquivo); } catch (e) { return { erro: String(e?.message || e) }; }
});
ipcMain.handle("motion_lista", () => {
  try { return fs.readdirSync(pastaMotion()).filter((f) => f.endsWith(".json")).map((f) => { const a = JSON.parse(fs.readFileSync(path.join(pastaMotion(), f), "utf8")); return { id: a.id, nome: a.nome, quadros: a.quadros.length, quando: fs.statSync(path.join(pastaMotion(), f)).mtimeMs }; }).sort((a, b) => b.quando - a.quando); } catch { return []; }
});
ipcMain.handle("motion_ler", (_e, id) => { try { return JSON.parse(fs.readFileSync(path.join(pastaMotion(), idMotion(id) + ".json"), "utf8")); } catch { return null; } });
ipcMain.handle("motion_apagar", (_e, id) => { try { fs.unlinkSync(path.join(pastaMotion(), idMotion(id) + ".json")); return true; } catch { return false; } });
ipcMain.handle("parar", async (e) => { const a = J(e).atual; if (a) { try { await a.q.interrupt(); } catch { a.ac.abort(); } } });
ipcMain.handle("permissao", (_e, { id, decisao }) => {
  const p = pendentes.get(id); if (!p) return;
  pendentes.delete(id);
  if (decisao === "negar") p.resolve({ behavior: "deny", message: "A pessoa negou." });
  else {
    p.resolve({ behavior: "allow", updatedPermissions: decisao === "sempre" ? p.suggestions : undefined });
    // Approving a plan leaves plan mode: the next turns may edit (asking first).
    if (p.toolName === "ExitPlanMode" && config.modo === "plan") {
      config.modo = "default"; salvarConfig(); avisaConfig();
      p.j?.atual?.q.setPermissionMode?.("default").catch?.(() => {});
    }
  }
});
// The side panel: where Claude works (computer, folder, git branch, model),
// how full the context is by category, and the state of each connector (MCP
// server). Context and connectors come from Claude Code itself: the running
// turn when there is one, otherwise a short idle query on the conversation.
function ramoGit(dir) {
  for (let d = dir, i = 0; d && i < 30; d = path.dirname(d), i++) {
    try { const h = fs.readFileSync(path.join(d, ".git", "HEAD"), "utf8").trim(); return h.startsWith("ref:") ? h.split("/").slice(2).join("/") : h.slice(0, 8); } catch {}
    if (path.dirname(d) === d) break;
  }
  return "";
}
async function comConsulta(j, fn) {
  if (j.atual) return fn(j.atual.q);
  const ac = new AbortController();
  let solta;
  const espera = new Promise((r) => (solta = r));
  const q = query({ prompt: (async function* () { await espera; })(), options: { cwd: j.cwd, resume: j.sessionId || undefined, model: config.model || undefined, abortController: ac, systemPrompt: { type: "preset", preset: "claude_code" }, mcpServers: { claudinho: servidorTemasPara(j) } } });
  try { return await fn(q); } finally { solta(); ac.abort(); q.return?.().catch(() => {}); }
}
ipcMain.handle("painel", async (e) => {
  const j = J(e);
  const ambiente = { computador: os.hostname(), pasta: j.cwd, ramo: ramoGit(j.cwd), modelo: config.model || "" };
  try {
    // connectors are still connecting right after start: give them a few seconds
    const [contexto, conectores] = await comConsulta(j, async (q) => {
      const ctx = await q.getContextUsage({ detail: "summary" });
      let st = await q.mcpServerStatus();
      for (let i = 0; i < 12 && st.some((c) => c.status === "pending"); i++) { await new Promise((r) => setTimeout(r, 500)); st = await q.mcpServerStatus(); }
      return [ctx, st];
    });
    return {
      ambiente: { ...ambiente, modelo: contexto?.model || ambiente.modelo },
      contexto: contexto && { total: contexto.totalTokens, max: contexto.maxTokens, pct: contexto.percentage, categorias: (contexto.categories || []).map((c) => ({ nome: c.name, tokens: c.tokens, cor: c.color, tipo: c.kind || (c.isDeferred ? "deferred" : "used") })), memoria: (contexto.memoryFiles || []).map((m) => ({ caminho: m.path, tokens: m.tokens })) },
      conectores: (conectores || []).map((c) => ({ nome: c.name, estado: c.status, erro: c.error || "" })),
    };
  } catch (err) { return { ambiente, erro: String(err?.message || err) }; }
});
// Plan usage: the subscription's windows (5 hours, week, per model) and this
// session's totals, as Claude Code's /usage reads them. The SDK marks this
// call experimental, so any failure just means "no data".
ipcMain.handle("uso", async (e) => {
  try {
    const u = await comConsulta(J(e), (q) => q.usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET({ skipBehaviors: true }));
    const janelas = Object.entries(u?.rate_limits || {}).filter(([, v]) => v && typeof v === "object" && "utilization" in v)
      .map(([id, v]) => ({ id, uso: v.utilization, renova: v.resets_at }));
    return { plano: u?.subscription_type || null, disponivel: !!u?.rate_limits_available, janelas, sessao: u?.session ? { custo: u.session.total_cost_usd, linhas: [u.session.total_lines_added, u.session.total_lines_removed], ms: u.session.total_api_duration_ms } : null };
  } catch (err) { return { erro: String(err?.message || err) }; }
});
// News for Clawd to tell: once a day a small model does a quick web search
// for what is new with Claude, Claude Code and Anthropic; the answer is kept
// on disk and reused until the next day.
ipcMain.handle("novidades", async () => {
  const arq = path.join(app.getPath("userData"), "novidades.json");
  try { const c = JSON.parse(fs.readFileSync(arq, "utf8")); if (Date.now() - c.quando < 20 * 3600e3 && c.itens?.length && (c.idioma || "pt-BR") === idiomaAtual()) return c.itens; } catch {}
  let texto = "";
  try {
    for await (const m of query({
      prompt: t("main.novidadesPrompt"),
      options: { cwd: app.getPath("home"), model: "claude-haiku-5-5", tools: ["WebSearch"], allowedTools: ["WebSearch"], maxTurns: 4, persistSession: false, settingSources: [], systemPrompt: t("main.novidadesSistema") },
    })) if (m.type === "result" && m.subtype === "success") texto = String(m.result || "");
  } catch {}
  const itens = texto.split(/\r?\n/).map((l) => l.replace(/^[-*•\d.\s]+/, "").trim()).filter((l) => l.length > 15 && l.length < 200).slice(0, 5);
  if (itens.length) try { fs.writeFileSync(arq, JSON.stringify({ quando: Date.now(), idioma: idiomaAtual(), itens })); } catch {}
  return itens;
});
// Files Claude changed open in their own app, or show in their folder.
ipcMain.handle("abrir_arquivo", (_e, caminho, naPasta) => { if (!caminho || !fs.existsSync(caminho)) return false; if (naPasta) shell.showItemInFolder(caminho); else shell.openPath(caminho); return true; });

// Answers to Claude's questions go back as the tool's input with the answers.
ipcMain.handle("responder", (_e, { id, respostas }) => {
  const p = pendentes.get(id); if (!p) return;
  pendentes.delete(id);
  if (!respostas) p.resolve({ behavior: "deny", message: "A pessoa preferiu não responder." });
  else p.resolve({ behavior: "allow", updatedInput: { ...p.input, answers: respostas } });
});
// Undo: put the files back as they were when a message was sent. A short
// query on the conversation does it when no turn is running.
ipcMain.handle("desfazer", async (e, { uuid, simular }) => {
  const { sessionId, atual, cwd } = J(e);
  if (!sessionId || !uuid) return { canRewind: false, error: t("main.semConversa") };
  if (atual) return await atual.q.rewindFiles(uuid, { dryRun: !!simular }).catch((e) => ({ canRewind: false, error: String(e.message || e) }));
  const ac = new AbortController();
  let solta;
  const espera = new Promise((r) => (solta = r));
  const q = query({ prompt: (async function* () { await espera; })(), options: { cwd, resume: sessionId, enableFileCheckpointing: true, abortController: ac } });
  try { return await q.rewindFiles(uuid, { dryRun: !!simular }); }
  catch (e) { return { canRewind: false, error: String(e.message || e) }; }
  finally { solta(); ac.abort(); q.return?.().catch(() => {}); }
});
ipcMain.handle("nova", (e) => { const j = J(e); if (!j.atual) j.sessionId = null; return !j.atual; });
// The Claude app (Code tab) keeps its own record of each conversation — the
// title it shows, whether it is archived — next to the transcript Claude Code
// writes. Reading those records lets the list use the same names the person
// sees there. Read-only; files are re-read only when they change.
const pastasDoApp = () => {
  const bases = [path.join(process.env.LOCALAPPDATA || "", "Claude-Data"), path.join(app.getPath("appData"), "Claude")];
  const out = [];
  for (const b of bases) {
    try {
      if (fs.existsSync(path.join(b, "claude-code-sessions"))) out.push(path.join(b, "claude-code-sessions"));
      for (const d of fs.readdirSync(b)) if (fs.existsSync(path.join(b, d, "claude-code-sessions"))) out.push(path.join(b, d, "claude-code-sessions"));
    } catch {}
  }
  return out;
};
const registrosDoApp = new Map(); // file -> { mtime, info }
function titulosDoApp() {
  const porSessao = new Map(), vistos = new Set();
  const anda = (d) => { let itens = []; try { itens = fs.readdirSync(d, { withFileTypes: true }); } catch {} for (const it of itens) { const p = path.join(d, it.name); if (it.isDirectory()) anda(p); else if (/^local_.*\.json$/.test(it.name)) le(p); } };
  const le = (p) => {
    vistos.add(p);
    try {
      const mtime = fs.statSync(p).mtimeMs, c = registrosDoApp.get(p);
      let info = c?.mtime === mtime ? c.info : null;
      if (!info) {
        const j = JSON.parse(fs.readFileSync(p, "utf8"));
        info = { cli: j.cliSessionId, titulo: j.title || "", doUsuario: j.titleSource === "user", arquivada: !!j.isArchived, quando: j.lastActivityAt || 0 };
        registrosDoApp.set(p, { mtime, info });
      }
      if (info.cli) porSessao.set(info.cli, info);
    } catch {}
  };
  for (const d of pastasDoApp()) anda(d);
  for (const p of registrosDoApp.keys()) if (!vistos.has(p)) registrosDoApp.delete(p);
  return porSessao;
}

// Conversations: this window's folder, or every project Claude Code has
// worked in (the terminal, the Claude app, other windows: all the same files).
// Scratch folders the Claude app makes for loose chats count as one project.
const projeto = (cwd) => {
  if (!cwd) return t("main.semPasta");
  if (/[\\/]scratch-workspaces[\\/]|[\\/]scratch-\d{4}-\d\d-\d\d-[0-9a-f]+$/i.test(cwd)) return t("main.rascunhos");
  return cwd.split(/[\\/]/).filter(Boolean).pop();
};
ipcMain.handle("sessoes", async (e, { todas } = {}) => {
  try {
    const lista = await listSessions(todas ? { limit: 600 } : { dir: J(e).cwd, limit: 300 }), doApp = titulosDoApp();
    return lista.map((s) => {
      const a = doApp.get(s.sessionId);
      // a name the person gave wins (in the app or here); then the app's own title
      const titulo = (a?.doUsuario && a.titulo) || s.customTitle || a?.titulo || s.summary || s.firstPrompt || t("main.semTitulo");
      return { id: s.sessionId, titulo, quando: Math.max(s.lastModified || 0, a?.quando || 0), cwd: s.cwd || "", projeto: projeto(s.cwd), doApp: !!a, arquivada: !!a?.arquivada };
    }).filter((s) => !s.arquivada);
  } catch { return []; }
});
// Opening a conversation from another project moves this window there, so
// Claude keeps working in the right folder.
ipcMain.handle("abrir_sessao", async (e, id, cwd) => {
  const j = J(e); if (j.atual) return null;
  if (cwd && cwd !== j.cwd && fs.existsSync(cwd)) j.cwd = cwd;
  j.sessionId = id;
  try { return await historico(id, cwd || j.cwd); } catch { return []; }
});
// Branch: a new conversation with this one up to a reply (or all of it).
ipcMain.handle("ramificar", async (e, { id, uuid, titulo, cwd }) => {
  const j = J(e), origem = id || j.sessionId;
  if (!origem || (j.atual && origem === j.sessionId)) return null;
  try {
    const dir = cwd && fs.existsSync(cwd) ? cwd : j.cwd;
    const r = await forkSession(origem, { dir, upToMessageId: uuid || undefined, title: titulo || undefined });
    j.cwd = dir; j.sessionId = r.sessionId;
    return { id: r.sessionId, titulo: titulo || t("main.ramo"), cwd: dir };
  } catch (e) { console.log("[ramificar]", e?.message || e); return null; }
});
// Export a conversation as Markdown, where the person chooses.
ipcMain.handle("exportar", async (e, { id, titulo, cwd }) => {
  const nome = (titulo || t("main.conversaArquivo")).replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 80) || t("main.conversaArquivo");
  const r = await dialog.showSaveDialog(J(e).win, { title: t("main.exportar"), defaultPath: path.join(app.getPath("documents"), nome + ".md"), filters: [{ name: "Markdown", extensions: ["md"] }] });
  if (r.canceled || !r.filePath) return null;
  try {
  const partes = [`# ${titulo || t("main.conversa")}`, ""];
  for (const m of await historico(id, cwd || J(e).cwd)) {
    if (m.papel === "eu") partes.push(`**${t("main.voce")}:**${m.imagens ? ` _(${t("main.imagens", { n: m.imagens })})_` : ""}`, "", m.texto || "", "");
    else if (m.papel === "claude") partes.push("**Claude:**", "", m.texto, "");
    else partes.push(`> ${t("main.ferramenta")}: ${m.nome}`, "");
  }
  fs.writeFileSync(r.filePath, partes.join("\n"));
  return r.filePath;
  } catch (err) { return { erro: String(err?.message || err) }; }
});
// Search inside the conversations of this folder, not only their titles.
// The text of each one is kept until it changes.
const textoDasSessoes = new Map();
ipcMain.handle("buscar", async (e, termo, todas) => {
  const t = String(termo || "").toLowerCase().trim();
  if (t.length < 2) return [];
  const achados = [];
  for (const s of await listSessions(todas ? { limit: 200 } : { dir: J(e).cwd, limit: 120 }).catch(() => [])) {
    let c = textoDasSessoes.get(s.sessionId);
    if (!c || c.quando !== s.lastModified) {
      const h = await historico(s.sessionId, s.cwd).catch(() => []);
      c = { quando: s.lastModified, texto: h.filter((m) => m.texto).map((m) => m.texto).join("\n") };
      textoDasSessoes.set(s.sessionId, c);
    }
    const i = c.texto.toLowerCase().indexOf(t);
    if (i >= 0) achados.push({ id: s.sessionId, trecho: (i > 40 ? "…" : "") + c.texto.slice(Math.max(0, i - 40), i + t.length + 70).replace(/\s+/g, " ") });
  }
  return achados;
});
ipcMain.handle("focar", (e) => { const w = J(e).win; if (w.isMinimized()) w.restore(); w.show(); w.focus(); });
ipcMain.handle("renomear", async (e, { id, titulo, cwd }) => { try { await renameSession(id, titulo, { dir: cwd || J(e).cwd }); return true; } catch { return false; } });
ipcMain.handle("apagar", async (e, id, cwd) => {
  if ([...janelas.values()].some((o) => o.atual && o.sessionId === id)) return false;
  try {
    await deleteSession(id, { dir: cwd || J(e).cwd });
    for (const o of janelas.values()) if (o.sessionId === id) { o.sessionId = null; if (o !== J(e)) enviarEvento(o, { tipo: "apagada", id }); }
    return true;
  } catch { return false; }
});
ipcMain.handle("pasta", async (e) => {
  const j = J(e);
  if (j.atual) return null;
  const r = await dialog.showOpenDialog(j.win, { title: t("main.pastaProjeto"), defaultPath: j.cwd, properties: ["openDirectory"] });
  if (r.canceled || !r.filePaths[0]) return null;
  config.cwd = j.cwd = r.filePaths[0]; j.sessionId = null; salvarConfig(); return j.cwd;
});
ipcMain.handle("config", (_e, mudanca) => { config = { ...config, ...mudanca }; salvarConfig(); avisaConfig(); return config; });
function avisaConfig() { for (const o of janelas.values()) enviarEvento(o, { tipo: "config", modo: config.modo, model: config.model, esforco: config.esforco }); }
// Everything the person customised (colours, fonts, sounds, music, icon, name).
ipcMain.handle("visual", () => config.visual || {});
ipcMain.handle("visual_salvar", (_e, visual) => {
  const antes = config.visual || {};
  config.visual = visual && typeof visual === "object" ? visual : {}; salvarConfig();
  if (antes.icone !== config.visual.icone) aplicaIcone();
  if (config.visual.nome) for (const o of janelas.values()) o.win.setTitle(config.visual.nome);
  for (const o of janelas.values()) if (o !== J(_e)) enviarEvento(o, { tipo: "visual", visual: config.visual });
  if (idiomaDe(idiomaEscolhido()) !== idiomaAtual()) { usaIdioma(idiomaEscolhido()); for (const o of janelas.values()) recarrega(o); }
  return config.visual;
});
// A new language: each window loads again on the conversation it shows; one
// where Claude is working waits for the turn to end.
function recarrega(j) {
  if (j.atual) { j.recarregar = true; return; }
  j.recarregar = false;
  j.win.loadFile(path.join(here, "renderer", "index.html"), j.sessionId ? { query: { sessao: j.sessionId } } : undefined);
}
ipcMain.on("idioma", (e) => { e.returnValue = idiomaAtual(); });
ipcMain.handle("pessoal_lista", (_e, tipo) => listaPessoal(tipo));
ipcMain.handle("pessoal_importar", async (e, tipo, caminhos) => {
  if (!TIPOS[tipo]) return { erro: t("main.tipoDesconhecido") };
  let lista = Array.isArray(caminhos) ? caminhos.filter(Boolean) : [];
  if (!lista.length) {
    const r = await dialog.showOpenDialog(J(e).win, { title: t("main.escolher", { tipo: TIPOS[tipo].nome.toLowerCase() }), filters: [{ name: TIPOS[tipo].nome, extensions: TIPOS[tipo].ext }], properties: ["openFile", ...(tipo === "icone" ? [] : ["multiSelections"])] });
    if (r.canceled) return { itens: [] };
    lista = r.filePaths;
  }
  const itens = [], erros = [];
  for (const c of lista) { try { itens.push(copiaPessoal(tipo, c)); } catch (e) { erros.push(String(e.message || e)); } }
  return { itens, erro: erros[0] };
});
ipcMain.handle("pessoal_apagar", (_e, tipo, id) => {
  try {
    const web = path.join(pastaWeb(), path.basename(String(id)));
    if (tipo === "fundos" && fs.existsSync(path.join(web, "claudinho.json"))) fs.rmSync(web, { recursive: true, force: true });
    else if (TIPOS[tipo]) fs.unlinkSync(arquivoPessoal(tipo, id));
    return true;
  } catch { return false; }
});
ipcMain.handle("conta", () => ({ entrar: config.entrar || "login", temChave: !!config.chaveApi, claude: acharClaude(), cifra: safeStorage.isEncryptionAvailable() }));
ipcMain.handle("conta_salvar", (_e, { entrar, chave }) => {
  if (entrar === "login" || entrar === "chave") config.entrar = entrar;
  if (typeof chave === "string") {
    const c = chave.trim();
    if (!c) delete config.chaveApi;
    else if (!safeStorage.isEncryptionAvailable()) return { erro: t("main.semCifra") };
    else config.chaveApi = safeStorage.encryptString(c).toString("base64");
  }
  salvarConfig();
  return { entrar: config.entrar || "login", temChave: !!config.chaveApi };
});
ipcMain.handle("we_lista", () => listaWallpaperEngine());
ipcMain.handle("we_importar", async (_e, pasta) => { try { return { item: importaWallpaperEngine(String(pasta)) }; } catch (e) { return { erro: String(e.message || e) }; } });
ipcMain.handle("barra", (e, claro) => { try { J(e).win.setTitleBarOverlay({ color: "#00000000", symbolColor: claro ? "#10323c" : "#e9e6e1" }); } catch {} });
ipcMain.handle("link", (_e, url) => { if (/^https?:/.test(url)) shell.openExternal(url); });

// The app was called Tessela before: its window storage (theme, sound, the
// intro already seen) and imported animations come along on the first start.
function trazDoNomeAntigo() {
  const antes = path.join(app.getPath("appData"), "Tessela"), agora = app.getPath("userData");
  for (const item of ["Local Storage", "motion"]) {
    const de = path.join(antes, item), para = path.join(agora, item);
    try { if (fs.existsSync(de) && !fs.existsSync(para)) fs.cpSync(de, para, { recursive: true }); } catch {}
  }
}

// Sync: any conversation written anywhere (the terminal, the Claude app,
// another window) updates every window's list a moment later.
function vigiaSessoes() {
  const pasta = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(app.getPath("home"), ".claude"), "projects");
  let timer = null;
  const avisa = () => { clearTimeout(timer); timer = setTimeout(() => { for (const j of janelas.values()) enviarEvento(j, { tipo: "sessoes_mudaram" }); }, 900); };
  try { fs.watch(pasta, { recursive: true }, (_t, nome) => { if (!nome || /\.jsonl$/i.test(nome)) avisa(); }); } catch (e) { console.log("[sync] sem vigia:", e.message); }
  // the Claude app's records too: a title changed there shows up here
  for (const d of pastasDoApp()) try { fs.watch(d, { recursive: true }, avisa); } catch {}
}

// Ctrl+Shift+Space brings the window up from anywhere (and hides it again).
function atalhoGlobal() {
  globalShortcut.register("Control+Shift+Space", () => {
    const win = (BrowserWindow.getFocusedWindow() && janelas.get(BrowserWindow.getFocusedWindow().webContents.id)?.win) || principal?.win;
    if (!win) return;
    if (win.isFocused()) win.minimize();
    else { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
  });
}

// One identity for the window and its shortcuts, so a pinned shortcut and the
// open window share one taskbar button and one icon.
const APP_ID = "com.claudinho.app";
app.setAppUserModelId(APP_ID);
// the canvases, videos and web wallpapers go straight to the GPU
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
// Test runs (VIVO_PASTA / VIVO_JS) use a profile of their own, so they never
// touch the person's settings and can run with the app open.
if (process.env.VIVO_PASTA || process.env.VIVO_JS) app.setPath("userData", path.join(app.getPath("appData"), process.env.VIVO_PERFIL || "Claudinho-teste"));
if (!process.env.VIVO_ATALHOS && !app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => {
  const w = principal?.win; if (!w) return;
  if (w.isMinimized()) w.restore(); w.show(); w.focus();
});
// Shortcuts that open the app with its icon: the Start Menu (where Windows
// lets you pin it to the taskbar) and the project folder.
// Run once with VIVO_ATALHOS=1.
function criaAtalhos() {
  const alvo = { target: process.execPath, args: `"${app.getAppPath()}"`, cwd: app.getAppPath(), icon: path.join(here, "icone.ico"), iconIndex: 0, appUserModelId: APP_ID, description: "Claudinho: o Claude Code com papéis de parede vivos" };
  const lugares = [path.join(app.getPath("appData"), "Microsoft", "Windows", "Start Menu", "Programs", "Claudinho.lnk"), path.join(app.getAppPath(), "Claudinho.lnk")];
  for (const l of lugares) console.log("[atalho]", shell.writeShortcutLink(l, fs.existsSync(l) ? "replace" : "create", alvo) ? "ok" : "falhou", l);
}

// Web wallpapers are served from claudinho-we://<id>/…: in a sandboxed frame a
// file:// page can't load its own scripts and images, a page on its own scheme
// can, and still can't reach anything outside its folder.
protocol.registerSchemesAsPrivileged([{ scheme: "claudinho-we", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
function servePapelWeb() {
  protocol.handle("claudinho-we", async (req) => {
    const u = new URL(req.url), raiz = path.join(pastaWeb(), path.basename(u.hostname));
    const arquivo = path.normalize(path.join(raiz, decodeURIComponent(u.pathname)));
    if (!arquivo.startsWith(raiz + path.sep)) return new Response("", { status: 403 });
    try {
      const r = await net.fetch(pathToFileURL(arquivo).href);
      return new Response(r.body, { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/octet-stream", "access-control-allow-origin": "*" } });
    } catch { return new Response("", { status: 404 }); }
  });
}

// ---- updates ---------------------------------------------------------------------------
// The installed app looks for a new release on GitHub (latest.yml next to the
// installer) a little after it opens and every six hours, downloads it in the
// background and tells the windows. It installs on "Reiniciar agora" or by
// itself the next time the app closes. Running from the code (npm start) it
// stays quiet. VIVO_FEED="http://..." points it at a test server instead.
let atualizacao = { estado: "parado", versao: app.getVersion() };
const avisaAtualizacao = (mudanca) => {
  atualizacao = { ...atualizacao, ...mudanca };
  if (process.env.VIVO_LOG || process.env.VIVO_FEED) console.log("[atualizacao]", JSON.stringify(atualizacao));
  for (const j of janelas.values()) enviarEvento(j, { tipo: "atualizacao", ...atualizacao });
};
let procuraAtualizacao = async () => avisaAtualizacao({ estado: "desligada" });
function iniciaAtualizacoes() {
  if (!(app.isPackaged || process.env.VIVO_FEED) || (process.env.VIVO_JS && !process.env.VIVO_FEED)) { atualizacao.estado = "desligada"; return; }
  const { autoUpdater } = atualizador;
  autoUpdater.autoDownload = true; autoUpdater.autoInstallOnAppQuit = !process.env.VIVO_FEED; autoUpdater.logger = null;
  if (process.env.VIVO_FEED) { autoUpdater.forceDevUpdateConfig = true; autoUpdater.setFeedURL({ provider: "generic", url: process.env.VIVO_FEED }); }
  autoUpdater.on("checking-for-update", () => avisaAtualizacao({ estado: "procurando" }));
  autoUpdater.on("update-not-available", () => avisaAtualizacao({ estado: "em_dia", nova: null }));
  autoUpdater.on("update-available", (i) => avisaAtualizacao({ estado: "baixando", nova: i.version, notas: i.releaseNotes || "", progresso: 0 }));
  autoUpdater.on("download-progress", (p) => avisaAtualizacao({ estado: "baixando", progresso: Math.round(p.percent) }));
  autoUpdater.on("update-downloaded", (i) => avisaAtualizacao({ estado: "pronta", nova: i.version, progresso: 100 }));
  autoUpdater.on("error", (e) => avisaAtualizacao({ estado: "erro", detalhe: String(e?.message || e).split(/\r?\n/)[0].slice(0, 160) }));
  procuraAtualizacao = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(procuraAtualizacao, process.env.VIVO_FEED ? 1500 : 10000);
  setInterval(procuraAtualizacao, 6 * 3600e3);
  ipcMain.handle("atualizacao_instalar", () => { if (atualizacao.estado === "pronta") setImmediate(() => autoUpdater.quitAndInstall(false, true)); });
}
ipcMain.handle("atualizacao", () => atualizacao);
ipcMain.handle("atualizacao_procurar", () => { if (!["procurando", "baixando", "pronta"].includes(atualizacao.estado)) procuraAtualizacao(); return atualizacao; });

app.whenReady().then(() => {
  if (process.env.VIVO_ATALHOS) { criaAtalhos(); app.quit(); return; }
  servePapelWeb(); trazDoNomeAntigo(); lerConfig(); criarJanela(); atalhoGlobal(); vigiaSessoes(); iniciaAtualizacoes();
});
app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => app.quit());
