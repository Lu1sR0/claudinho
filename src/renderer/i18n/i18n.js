// Languages: each dictionary (pt-BR.js, en.js, es.js) registers itself in
// globalThis.I18N, and t("chave", { n, nome }) looks a text up in the active
// language, then in pt-BR (the original), then gives the key back. The same
// file serves the window (a classic script) and main.js (an import).
(() => {
  const I18N = (globalThis.I18N ??= {});
  const IDIOMAS = { "pt-BR": "Português", en: "English", es: "Español" };
  // anything that isn't Spanish or English stays in the original Portuguese
  const idiomaDe = (codigo) => { const c = String(codigo || "").toLowerCase(); return c.startsWith("es") ? "es" : c.startsWith("en") ? "en" : "pt-BR"; };
  let atual = "pt-BR";
  // a value is a text, a list (Clawd's lines) or a plural { um, outros } chosen by n
  function t(chave, vars = {}) {
    let v = I18N[atual]?.[chave] ?? I18N["pt-BR"]?.[chave] ?? chave;
    if (v && typeof v === "object" && !Array.isArray(v)) v = vars.n === 1 ? v.um : v.outros;
    return typeof v === "string" ? v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : v;
  }
  const usaIdioma = (codigo) => (atual = idiomaDe(codigo));
  Object.assign(globalThis, { t, usaIdioma, idiomaDe, IDIOMAS, idiomaAtual: () => atual });

  // The window: the language comes from main.js (vivo.idioma, saved in
  // Personalizar → Geral); in the simulator, from the browser. Static texts in
  // index.html carry data-i18n (text) or data-i18n-<attribute>, and the few
  // texts drawn by app.css come in as --i18n-<name> from the "css.*" keys.
  if (!globalThis.document) return;
  usaIdioma(globalThis.vivo?.idioma || navigator.language);
  document.documentElement.lang = atual;
  for (const el of document.querySelectorAll("*")) {
    for (const a of el.getAttributeNames()) {
      if (a === "data-i18n") el.textContent = t(el.getAttribute(a));
      else if (a.startsWith("data-i18n-")) el.setAttribute(a.slice(10), t(el.getAttribute(a)));
    }
  }
  for (const k of Object.keys(I18N["pt-BR"] || {})) if (k.startsWith("css.")) document.documentElement.style.setProperty("--i18n-" + k.slice(4), JSON.stringify(t(k)));
})();
