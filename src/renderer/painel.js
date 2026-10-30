// The details panel on the right, like the Claude app's: where Claude is
// working, how the context is filling up (by category, with a compact
// button), which connectors are up, and the files this conversation changed.
// It refreshes when opened and after each turn.

const info = document.createElement("aside");
info.className = "info"; info.id = "info"; info.setAttribute("aria-label", t("painel.detalhesDaConversa"));
document.getElementById("app").append(info);
const botaoInfo = document.createElement("button");
botaoInfo.className = "icone"; botaoInfo.id = "infoBtn"; botaoInfo.title = t("painel.detalhesAtalho");
botaoInfo.innerHTML = svg('<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M15 4.5v15"/>');
$("som").before(botaoInfo);

const abertas = new Set(le("infoAbertas", ["ambiente", "contexto", "conectores", "saidas"]));
const k = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(".0", "") + "M" : n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(n));
// Category colours: messages blue, built-in tools orange, connector tools
// teal, the rest grey (free space darker).
const corCategoria = (nome, tipo) => /mensag|messages/i.test(nome) ? "#4a8fe0" : /mcp tool/i.test(nome) && tipo !== "deferred" ? "#2bb39a" : /system tools/i.test(nome) && tipo !== "deferred" ? "#e8803a"
  : tipo === "free" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.32)";

function secao(id, titulo, extra, corpo) {
  const aberta = abertas.has(id);
  return `<section class="info-sec${aberta ? " aberta" : ""}" data-sec="${id}"><button class="info-cab">${esc(titulo)}${svg('<path d="m8 10 4 4 4-4"/>')}<span class="info-extra">${extra || ""}</span></button><div class="info-corpo">${corpo}</div></section>`;
}
let dados = null, carregando = false, deNovo = false;
async function atualizaInfo() {
  if (!document.body.classList.contains("info-aberta")) return;
  if (carregando) { deNovo = true; return; }
  carregando = true; info.classList.add("carregando");
  try { dados = await vivo.painel(); } catch { dados = null; }
  carregando = false; info.classList.remove("carregando");
  desenhaInfo();
  if (deNovo) { deNovo = false; atualizaInfo(); }
}
function desenhaInfo() {
  const a = dados?.ambiente || {}, c = dados?.contexto, con = dados?.conectores || [];
  const nomePasta = (a.pasta || "").split(/[\\/]/).filter(Boolean).pop() || "";
  let h = `<div class="info-topo"><b>${t("painel.detalhes")}</b><button class="icone" data-a="atualiza" title="${t("painel.atualizar")}">${svg('<path d="M19.5 12a7.5 7.5 0 0 1-13.1 5"/><path d="M4.5 12a7.5 7.5 0 0 1 13.1-5"/><path d="M17.6 3.5v3.6H14M6.4 20.5v-3.6H10"/>')}</button><button class="icone" data-a="fecha" title="${t("painel.fechar")}">${ICONE.erro}</button></div>`;
  h += secao("ambiente", t("painel.ambiente"), "", `
    <div class="info-linha">${svg('<rect x="3.5" y="5" width="17" height="11" rx="1.5"/><path d="M2.5 19h19"/>')}<span>${t("painel.esteComputador")}</span><em>${esc(a.computador || "")}</em></div>
    <button class="info-linha clicavel" data-a="pasta" title="${esc(a.pasta || "")}">${ICONE.pasta}<span>${esc(nomePasta)}</span><em>${esc(a.pasta || "")}</em></button>
    ${a.ramo ? `<div class="info-linha">${ICONE.ramo}<span>${esc(a.ramo)}</span><em>${t("painel.branch")}</em></div>` : ""}
    ${a.modelo ? `<div class="info-linha">${svg('<path d="M12 3.5v3m0 11v3m8.5-8.5h-3m-11 0h-3m14-6-2.1 2.1M8.6 15.4l-2.1 2.1m0-11 2.1 2.1m6.8 6.8 2.1 2.1"/>')}<span>${esc(a.modelo)}</span></div>` : ""}`);
  if (c) {
    const usadas = c.categorias.filter((x) => x.tipo !== "deferred");
    const barra = usadas.map((x) => `<i style="width:${(x.tokens / c.max) * 100}%;background:${corCategoria(x.nome, x.tipo)}"></i>`).join("");
    const linhas = c.categorias.map((x) => `<div class="ctx-cat${x.tipo === "deferred" ? " adiada" : ""}"><i style="background:${corCategoria(x.nome, x.tipo)}"></i><span>${esc(x.nome)}</span><em>${k(x.tokens)}</em><b>${x.tipo === "deferred" ? "—" : ((x.tokens / c.max) * 100).toLocaleString(idiomaAtual(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%"}</b></div>`).join("");
    h += secao("contexto", t("painel.contexto"), `${Math.round(c.pct)}%`, `
      <div class="ctx-topo"><b>${t("painel.usado", { pct: Math.round(c.pct) })}</b><span>${k(c.total)} / ${k(c.max)}</span></div>
      <div class="ctx-barra">${barra}</div><div class="ctx-cats">${linhas}</div>
      <div class="ctx-base"><span>${t("painel.compactaSozinho")}</span><button class="btn" data-a="compacta"${rodando || !sessaoAtual ? " disabled" : ""}>${t("painel.compactarSessao")}</button></div>`);
  } else h += secao("contexto", t("painel.contexto"), "", `<p class="info-vazio">${dados?.erro ? t("painel.erroContexto") : carregando ? t("painel.lendo") : t("painel.abraUmaConversa")}</p>`);
  const ok = con.filter((x) => x.estado === "connected").length;
  h += secao("conectores", t("painel.conectores"), con.length ? t("painel.deTotal", { n: ok, total: con.length }) : "", con.length
    ? con.map((x) => `<div class="con" title="${esc(x.erro)}"><i class="${x.estado}"></i><span>${esc(x.nome)}</span><em>${{ connected: t("painel.conectado"), failed: t("painel.falhou"), "needs-auth": t("painel.precisaDeLogin"), pending: t("painel.conectando"), disabled: t("painel.desligado") }[x.estado] || x.estado}</em></div>`).join("")
    : `<p class="info-vazio">${t("painel.nenhumConector")}</p>`);
  const arquivos = typeof alteracoes === "function" ? [...alteracoes().keys()] : [];
  h += secao("saidas", t("painel.saidas"), arquivos.length ? String(arquivos.length) : "", arquivos.length
    ? arquivos.map((f) => `<div class="saida"><button class="clicavel" data-abre="${esc(f)}" title="${esc(f)}">${svg('<path d="m9 8-4 4 4 4M15 8l4 4-4 4"/>')}<span>${esc(f.split(/[\\/]/).pop())}</span></button><button class="icone" data-mostra="${esc(f)}" title="${t("painel.mostrarNaPasta")}">${ICONE.pasta}</button></div>`).join("")
    : `<p class="info-vazio">${t("painel.nenhumArquivo")}</p>`);
  info.innerHTML = h;
  info.querySelectorAll(".info-cab").forEach((b) => (b.onclick = () => { const s = b.parentElement, id = s.dataset.sec; s.classList.toggle("aberta"); s.classList.contains("aberta") ? abertas.add(id) : abertas.delete(id); guarda("infoAbertas", [...abertas]); }));
  info.querySelector('[data-a="atualiza"]').onclick = atualizaInfo;
  info.querySelector('[data-a="fecha"]').onclick = () => alternaInfo(false);
  info.querySelector('[data-a="pasta"]')?.addEventListener("click", () => vivo.abrirArquivo(a.pasta));
  info.querySelector('[data-a="compacta"]')?.addEventListener("click", () => envia("/compact"));
  info.querySelectorAll("[data-abre]").forEach((b) => (b.onclick = () => vivo.abrirArquivo(b.dataset.abre)));
  info.querySelectorAll("[data-mostra]").forEach((b) => (b.onclick = () => vivo.abrirArquivo(b.dataset.mostra, true)));
}
function alternaInfo(v = !document.body.classList.contains("info-aberta")) {
  document.body.classList.toggle("info-aberta", v); guarda("infoAberta", v);
  botaoInfo.classList.toggle("on", v);
  if (v) { desenhaInfo(); atualizaInfo(); }
}
botaoInfo.onclick = () => alternaInfo();
addEventListener("keydown", (e) => { if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "j") { e.preventDefault(); alternaInfo(); } });
vivo.aoEvento((ev) => { if (ev.tipo === "parado" || ev.tipo === "sessao") setTimeout(atualizaInfo, 400); });
// opening another conversation or folder refreshes it too
for (const id of ["nova", "pasta"]) $(id).addEventListener("click", () => setTimeout(atualizaInfo, 600));
lista.addEventListener("click", () => setTimeout(atualizaInfo, 800));
if (le("infoAberta", false)) alternaInfo(true);
