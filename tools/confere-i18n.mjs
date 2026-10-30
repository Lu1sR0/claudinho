// Checks the translations: every key of pt-BR.js (the original) must exist in
// the other dictionaries with the same {placeholders}, and every t("chave") or
// data-i18n="chave" in src/ must exist in pt-BR.js. Run: node tools/confere-i18n.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pasta = path.join(raiz, "src", "renderer", "i18n");
for (const f of fs.readdirSync(pasta)) if (f !== "i18n.js") await import("../src/renderer/i18n/" + f);
const I18N = globalThis.I18N, base = I18N["pt-BR"];
const marcas = (v) => JSON.stringify(v).match(/\{\w+\}/g)?.sort().join() || "";
let erros = 0;
const erro = (m) => { erros++; console.log("  " + m); };

for (const [idioma, d] of Object.entries(I18N)) {
  if (idioma === "pt-BR") continue;
  console.log(`${idioma}: ${Object.keys(d).length} de ${Object.keys(base).length} chaves`);
  for (const k of Object.keys(base)) {
    if (!(k in d)) erro(`falta "${k}"`);
    else if (Array.isArray(base[k]) !== Array.isArray(d[k]) || typeof base[k] !== typeof d[k]) erro(`"${k}" tem outro formato`);
    else if (!Array.isArray(base[k]) && marcas(base[k]) !== marcas(d[k])) erro(`"${k}" tem outras {variáveis}: ${marcas(d[k])} (pt-BR: ${marcas(base[k])})`);
  }
  for (const k of Object.keys(d)) if (!(k in base)) erro(`"${k}" não existe em pt-BR`);
}

// keys used in the code (only literal ones: t(`app.cat.${id}`) can't be checked here)
const arquivos = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === "i18n" ? [] : arquivos(path.join(d, e.name))) : /\.(m?js|cjs|html)$/.test(e.name) ? [path.join(d, e.name)] : []));
const usadas = new Set();
for (const f of arquivos(path.join(raiz, "src"))) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/\bt\(\s*"([\w.-]+)"\s*[,)]|data-i18n(?:-[\w-]+)?="([\w.-]+)"/g)) {
    const k = m[1] || m[2];
    usadas.add(k);
    if (!(k in base)) erro(`${path.relative(raiz, f)}: "${k}" não existe em pt-BR`);
  }
}
console.log(`código: ${usadas.size} chaves usadas`);
console.log(erros ? `${erros} problema(s)` : "tudo certo");
process.exit(erros ? 1 : 0);
