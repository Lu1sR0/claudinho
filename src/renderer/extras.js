// Second wave of what people ask Claude apps for: Claude's reasoning shown as
// it thinks, edits shown as diffs, undoing file changes from a message on,
// Claude's questions as a form, the plan's usage limits, automatic titles,
// long pasted text kept as an editable chip, and the wallpaper reacting to
// what Claude is doing.

// ---- diffs -----------------------------------------------------------------------------
// Edits, multi-edits and new files as lines taken out and put in, with a few
// lines of context; the summary gets a +/− count.
function linhasDiff(antes, depois) {
  const a = String(antes ?? "").split("\n"), b = String(depois ?? "").split("\n");
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  let j = 0; while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  const ctx = 2, out = [];
  for (let k = Math.max(0, i - ctx); k < i; k++) out.push([" ", a[k]]);
  for (let k = i; k < a.length - j; k++) out.push(["-", a[k]]);
  for (let k = i; k < b.length - j; k++) out.push(["+", b[k]]);
  for (let k = a.length - j; k < Math.min(a.length, a.length - j + ctx); k++) out.push([" ", a[k]]);
  return out;
}
function diffDe(nome, e) {
  if (!e) return null;
  let grupos;
  if (nome === "Edit" && "old_string" in e) grupos = [linhasDiff(e.old_string, e.new_string)];
  else if (nome === "MultiEdit" && Array.isArray(e.edits)) grupos = e.edits.map((x) => linhasDiff(x.old_string, x.new_string));
  else if (nome === "Write" && typeof e.content === "string") grupos = [e.content.split("\n").map((l) => ["+", l])];
  else return null;
  let mais = 0, menos = 0, n = 0;
  const html = grupos.map((g) => g.map(([s, l]) => {
    if (s === "+") mais++; if (s === "-") menos++;
    if (++n > 400) return "";
    return `<div class="l ${s === "+" ? "mais" : s === "-" ? "menos" : ""}"><i>${s === " " ? "" : s === "-" ? "−" : "+"}</i><code>${esc(l) || " "}</code></div>`;
  }).join("")).join('<div class="l corte"><i>⋯</i></div>');
  return { html: `<div class="diff">${html}${n > 400 ? `<div class="l corte"><i>⋯</i><code>${t("extras.diffLongo")}</code></div>` : ""}</div>`, contagem: `<em class="contagem"><b>+${mais}</b><s>−${menos}</s></em>` };
}

// ---- Claude's reasoning --------------------------------------------------------------
// Streams into a quiet block while Claude thinks, then folds into one line.
let racEl = null, racTexto = "", racT0 = 0, racAgendado = false;
function abreRaciocinio() {
  fechaRaciocinio(); fechaSegmento(); tiraPensando();
  racEl = bloco("raciocinio"); racTexto = ""; racT0 = performance.now();
  racEl.innerHTML = `<button class="rac-topo">${mosaicoMini()}<b>${t("extras.raciocinando")}</b></button><div class="rac-texto"></div>`;
  racEl.classList.add("aberto", "vivo");
  racEl.querySelector(".rac-topo").onclick = (e) => e.currentTarget.parentElement.classList.toggle("aberto");
}
function maisRaciocinio(delta) {
  if (!racEl) abreRaciocinio();
  racTexto += delta;
  if (racAgendado) return;
  racAgendado = true;
  setTimeout(() => { racAgendado = false; if (!racEl) return; const t = racEl.querySelector(".rac-texto"); t.textContent = racTexto; t.scrollTop = t.scrollHeight; desce(); }, 60);
}
function fechaRaciocinio() {
  if (!racEl) return;
  const s = Math.max(1, Math.round((performance.now() - racT0) / 1000));
  racEl.querySelector(".rac-texto").textContent = racTexto;
  racEl.querySelector(".rac-topo").innerHTML = `${svg('<path d="m9 6 6 6-6 6"/>')}<b>${t("extras.raciocinio")}</b><small>${s}s</small>`;
  racEl.classList.remove("aberto", "vivo"); racEl = null;
}
// The 3×3 mark as a tiny live indicator.
// (Once the 3×3 mark; now a tiny Clawd.)
const mosaicoMini = () => `<span class="mosaico-mini">${clawdSvg()}</span>`;

// ---- Claude's questions ----------------------------------------------------------------
function pergunta(ev) {
  fechaRaciocinio(); fechaSegmento(); tiraPensando();
  const el = bloco("pergunta"), escolhas = ev.perguntas.map(() => new Set());
  el.dataset.id = ev.id;
  el.innerHTML = `<div class="t">${svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.5a2.3 2.3 0 1 1 3.2 2.1c-.7.3-1 .8-1 1.5v.4M12 16.5h.01"/>')}<span>${t("extras.claudeQuerSaber")}</span></div>` +
    ev.perguntas.map((q, k) => `<div class="q" data-k="${k}">${q.header ? `<span class="rotulo">${esc(q.header)}</span>` : ""}<p>${esc(q.question)}</p>
      <div class="ops">${(q.options || []).map((o, n) => `<button class="op" data-n="${n}"><b>${esc(o.label)}</b>${o.description ? `<small>${esc(o.description)}</small>` : ""}</button>`).join("")}</div>
      <input class="outra" placeholder="${t("extras.outraResposta")}" /></div>`).join("") +
    `<div class="b"><button class="btn forte" data-a="ok">${t("extras.responder")}</button><button class="btn" data-a="pular">${t("extras.pular")}</button></div>`;
  el.querySelectorAll(".q").forEach((qEl) => {
    const k = +qEl.dataset.k, multi = !!ev.perguntas[k].multiSelect;
    qEl.querySelectorAll(".op").forEach((b) => (b.onclick = () => {
      const n = +b.dataset.n;
      if (multi) escolhas[k].has(n) ? escolhas[k].delete(n) : escolhas[k].add(n);
      else { escolhas[k].clear(); escolhas[k].add(n); }
      qEl.querySelectorAll(".op").forEach((x) => x.classList.toggle("on", escolhas[k].has(+x.dataset.n)));
    }));
  });
  const fecha = (texto) => { el.className = "resolvido"; el.innerHTML = `${ICONE.ok}<span>${esc(texto)}</span>`; mostraPensando(); };
  el.querySelector('[data-a="ok"]').onclick = () => {
    const respostas = {};
    ev.perguntas.forEach((q, k) => {
      const outra = el.querySelector(`.q[data-k="${k}"] .outra`).value.trim();
      const marcadas = [...escolhas[k]].map((n) => q.options[n].label);
      respostas[q.question] = outra || marcadas.join(", ");
    });
    if (Object.values(respostas).some((v) => !v)) { nota(t("extras.respondaTodas")); return; }
    vivo.responder(ev.id, respostas); fecha(Object.values(respostas).join(" · "));
  };
  el.querySelector('[data-a="pular"]').onclick = () => { vivo.responder(ev.id, null); fecha(t("extras.pulouPergunta")); };
  forcaDesce();
}

// ---- plan limits ----------------------------------------------------------------------------
// The subscription's usage windows: shown with the context meter, a warning
// near the end, and when the limit is hit, an offer to carry on by itself.
const JANELA = { five_hour: t("extras.janela5h"), seven_day: t("extras.semana"), seven_day_opus: t("extras.semanaOpus"), seven_day_sonnet: t("extras.semanaSonnet") };
let limite = null, timerContinua = null;
const quando = (s) => { const d = new Date(s < 1e12 ? s * 1000 : s); return d.toLocaleString(idiomaAtual(), { weekday: d.toDateString() === new Date().toDateString() ? undefined : "short", hour: "2-digit", minute: "2-digit" }); };
function mostraLimite(info) {
  limite = info;
  const uso = info.utilization == null ? null : Math.round(info.utilization > 1 ? info.utilization : info.utilization * 100);
  const m = $("medidor");
  m.dataset.plano = uso == null ? "" : `\n${t("extras.plano")}: ${t("extras.planoUso", { uso, janela: JANELA[info.rateLimitType] || t("extras.janelaAtual"), renova: info.resetsAt ? t("extras.renova", { quando: quando(info.resetsAt) }) : "" })}`;
  m.title = (m.title || "").split(`\n${t("extras.plano")}:`)[0] + m.dataset.plano;
  if (info.status === "allowed_warning") nota(t("extras.usou", { uso: uso ?? t("extras.boaParte"), janela: JANELA[info.rateLimitType] || t("extras.janela") }));
  if (info.status === "rejected") {
    const el = bloco("limite");
    el.innerHTML = `<b>${t("extras.chegouLimite")}</b><span>${info.resetsAt ? t("extras.libera", { quando: quando(info.resetsAt) }) : t("extras.liberaEmBreve")}</span>${info.resetsAt ? `<button class="btn forte">${t("extras.continuarSozinho")}</button>` : ""}`;
    el.querySelector("button")?.addEventListener("click", (e) => {
      const ms = (info.resetsAt < 1e12 ? info.resetsAt * 1000 : info.resetsAt) - Date.now() + 60000;
      const conversa = sessaoAtual, titulo = $("titulo").textContent;
      clearTimeout(timerContinua);
      timerContinua = setTimeout(async () => {
        if (!conversa) return;
        if (sessaoAtual !== conversa) { if (rodando) return; await abreSessao(conversa, titulo); }
        envia(t("extras.podeContinuar"));
      }, Math.max(5000, ms));
      e.currentTarget.textContent = t("extras.combinado", { quando: quando(info.resetsAt) }); e.currentTarget.disabled = true;
    });
    forcaDesce();
  }
}

// ---- undo file changes from a message on --------------------------------------------
async function desfazDaqui(el) {
  if (rodando) { nota(t("extras.espereClaude")); return; }
  const uuid = el.dataset.uuid;
  if (!uuid) { nota(t("extras.semPonto")); return; }
  el.nextElementSibling?.classList.contains("desfaz-card") && el.nextElementSibling.remove();
  const previa = await vivo.desfazer(uuid, true);
  const n = previa?.filesChanged?.length || 0;
  if (!previa?.canRewind || !n) { nota(previa?.error ? t("extras.naoDeu", { erro: previa.error }) : t("extras.nenhumArquivo")); return; }
  const card = document.createElement("div");
  card.className = "desfaz-card";
  card.innerHTML = `<span>${t("extras.voltarArquivos", { n, contagem: `<em class="contagem"><b>+${previa.insertions || 0}</b><s>−${previa.deletions || 0}</s></em>` })}</span><small>${previa.filesChanged.map((f) => esc(f.split(/[\\/]/).pop())).join(", ")}</small><div class="b"><button class="btn forte">${t("extras.desfazer")}</button><button class="btn">${t("extras.cancelar")}</button></div>`;
  el.after(card);
  const [sim, nao] = card.querySelectorAll("button");
  nao.onclick = () => card.remove();
  sim.onclick = async () => {
    const r = await vivo.desfazer(uuid, false);
    card.remove();
    if (!r?.canRewind) { nota(t("extras.naoDeu", { erro: r?.error || t("extras.erroDesconhecido") }), true); return; }
    aviso(t("extras.restaurados", { arquivos: (r.filesChanged || previa.filesChanged).map((f) => f.split(/[\\/]/).pop()).join(", ") }));
  };
}

// ---- long pasted text -------------------------------------------------------------------
// Big pastes become a chip (seen and edited on click) instead of flooding the box.
entrada.addEventListener("paste", (e) => {
  if (e.clipboardData?.files?.length) return;
  const t = e.clipboardData?.getData("text") || "", linhas = t.split("\n").length;
  if (t.length < 1500 && linhas < 25) return;
  e.preventDefault();
  anexos.push({ tipo: "texto", nome: globalThis.t("extras.textoColado", { n: linhas }), conteudo: t });
  desenhaAnexos();
});
function editaColado(a) {
  creditosCaixa.innerHTML = `<div class="cred-topo"><span class="marca"><b>${esc(a.nome)}</b></span><button class="icone" id="fechaCreditos" title="${t("extras.fechar")}">${ICONE.erro}</button></div>
    <textarea class="colado-texto" spellcheck="false"></textarea><div class="b colado-b"><button class="btn forte" data-a="salva">${t("extras.salvar")}</button><button class="btn" data-a="tira">${t("extras.remover")}</button></div>`;
  const ta = creditosCaixa.querySelector("textarea"); ta.value = a.conteudo;
  creditosCaixa.querySelector("#fechaCreditos").onclick = fechaCreditos;
  creditosCaixa.querySelector('[data-a="salva"]').onclick = () => { a.conteudo = ta.value; const n = ta.value.split("\n").length; a.nome = t("extras.textoColado", { n }); fechaCreditos(); desenhaAnexos(); };
  creditosCaixa.querySelector('[data-a="tira"]').onclick = () => { anexos.splice(anexos.indexOf(a), 1); fechaCreditos(); desenhaAnexos(); };
  creditos.classList.add("on"); ta.focus();
}

// ---- what Claude is doing ------------------------------------------------------------------
// One state for the whole window: parado, pensando, escrevendo, ferramenta,
// esperando. The wallpaper answers (ripples on the built-in themes, faster
// library pieces and videos), and so does anything listening for it.
let estadoClaude = "parado", ultimaOndaClaude = 0;
function mudaEstado(e, extra) {
  estadoClaude = e;
  document.body.dataset.claude = e;
  dispatchEvent(new CustomEvent("estado-claude", { detail: { estado: e, ...extra } }));
  const vel = geral().reage === false ? 1 : e === "parado" ? 1 : e === "esperando" ? 0.5 : 1.6;
  window.Arte?.velocidade?.(vel);
  document.querySelectorAll("#midia video").forEach((v) => (v.playbackRate = vel));
}
function ondaClaude(forte) {
  if (geral().reage === false || atual < 0) return;
  const r = document.getElementById("composer").getBoundingClientRect();
  const x = forte ? big.W * (0.2 + Math.random() * 0.6) : r.left + r.width / 2, y = forte ? big.H * (0.25 + Math.random() * 0.5) : r.top;
  big.add(ripple(x, y, agora(), { speed: forte ? 170 : 120, life: forte ? 1.2 : 1.6, force: forte ? 150 : 90, alpha: forte ? 0.45 : 0.3 }));
}
setInterval(() => {
  if (estadoClaude === "parado" || document.hidden) return;
  const agoraMs = performance.now(), passo = estadoClaude === "esperando" ? 1300 : estadoClaude === "pensando" ? 2300 : 3200;
  if (agoraMs - ultimaOndaClaude > passo) { ultimaOndaClaude = agoraMs; ondaClaude(false); }
}, 250);

vivo.aoEvento((ev) => {
  switch (ev.tipo) {
    case "inicio": {
      mudaEstado("pensando");
      if (ev.uuid) { const meus = [...col.querySelectorAll(".msg.eu:not([data-uuid])")]; if (meus.length) meus[meus.length - 1].dataset.uuid = ev.uuid; }
      break;
    }
    case "raciocinio_inicio": abreRaciocinio(); mudaEstado("pensando"); break;
    case "raciocinio": maisRaciocinio(ev.delta); break;
    case "texto_inicio": fechaRaciocinio(); mudaEstado("escrevendo"); break;
    case "ferramenta": fechaRaciocinio(); mudaEstado("ferramenta", { nome: ev.nome }); ondaClaude(true); break;
    case "ferramenta_fim": mudaEstado("pensando"); break;
    case "permissao": fechaRaciocinio(); mudaEstado("esperando"); break;
    case "pergunta": pergunta(ev); mudaEstado("esperando"); window.somEvento?.("permissao"); avisaSistema(t("extras.temPergunta"), ev.perguntas?.[0]?.question || ""); break;
    case "limite": mostraLimite(ev.info); break;
    case "titulo": if (ev.id === sessaoAtual) $("titulo").textContent = ev.titulo; carregaSessoes(); break;
    case "erro": mudaEstado("erro"); setTimeout(() => estadoClaude === "erro" && mudaEstado("parado"), 1600); break;
    case "parado": fechaRaciocinio(); if (estadoClaude !== "erro") mudaEstado("parado", { terminou: true }); break;
  }
});
// A click on Permitir / Negar puts Claude back to work.
col.addEventListener("click", (e) => { if (e.target.closest(".perm .btn, .pergunta .btn")) mudaEstado("pensando"); });
