// Verifica que cada respuesta del Manual Inteligente SoftGuard se pueda rastrear a su fuente.
// Uso: node softguard.test.cjs
const fs = require("fs"), path = require("path"), vm = require("vm");
const base = path.join(__dirname, "prototipo");
const win = {}; const ctx = vm.createContext({ window: win });
const run = f => vm.runInContext(fs.readFileSync(path.join(base, f), "utf8"), ctx, { filename: f });

run("datos/softguard/indice.js");
win.SG_INDICE.forEach(m => run(`datos/softguard/${m.id}.js`));
run("softguard-fichas.js");

const norm = t => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[“”"'«»‹›]/g, "").replace(/\s+/g, " ").trim();
const procIds = new Set([...fs.readFileSync(path.join(base, "modulos.js"), "utf8").matchAll(/"id":"([a-z0-9-]+)","category"/g)].map(m => m[1]));

const errs = []; const err = (id, msg) => errs.push(`${id}: ${msg}`);
let pasos = 0;
const cats = new Set(win.SG_CATEGORIAS.map(c => c[0])), ids = new Set(), usadas = new Set();

for (const m of win.SG_INDICE) if (!win.SG_MANUALES[m.id]) err(m.id, "figura en el índice pero no tiene datos");

for (const f of win.SG_FICHAS) {
  if (ids.has(f.id)) err(f.id, "id repetido"); ids.add(f.id);
  if (!cats.has(f.cat)) err(f.id, `categoría desconocida ${f.cat}`); usadas.add(f.cat);
  if (!["op", "sup", "adm"].includes(f.nivel)) err(f.id, "nivel inválido");
  if (f.nivel !== "op" && !f.advertencia) err(f.id, "función restringida sin advertencia");
  if ((f.parcial || f.insuficiente) && !f.nota) err(f.id, "ficha parcial/insuficiente sin nota que lo explique");
  if (!f.pasos.length && !(f.insuficiente && f.interno.length)) err(f.id, "sin pasos: debe ser insuficiente y apuntar a un procedimiento interno");
  f.interno.forEach(i => procIds.has(i) || err(f.id, `procedimiento interno inexistente: ${i}`));
  (f.rel || []).forEach(r => win.SG_FICHAS.some(x => x.id === r) || err(f.id, `ficha relacionada inexistente: ${r}`));
  const man = win.SG_MANUALES[f.manual];
  if (!man) { err(f.id, `manual inexistente ${f.manual}`); continue; }
  for (const [i, s] of f.pasos.entries()) {
    pasos++;
    const pg = man.paginas.find(p => p[0] === s.p);
    if (!pg) { err(f.id, `paso ${i + 1}: la página ${s.p} no existe`); continue; }
    const txt = norm(pg[1]);
    if (!s.q || !txt.includes(norm(s.q))) err(f.id, `paso ${i + 1}: la cita no está en la p. ${s.p}: “${s.q}”`);
    for (const t of s.t.matchAll(/«([^»]+)»/g))
      if (!txt.includes(norm(t[1]))) err(f.id, `paso ${i + 1}: el nombre «${t[1]}» no aparece en la p. ${s.p}`);
  }
}
cats.forEach(c => usadas.has(c) || errs.push(`categoría sin fichas: ${c}`));

if (errs.length) { console.error(errs.join("\n")); console.error(`\n${errs.length} problema(s)`); process.exit(1); }
console.log(`OK: ${win.SG_FICHAS.length} fichas, ${pasos} pasos, todos rastreables a su página (${win.SG_INDICE.map(m => m.id).join(", ")}).`);
