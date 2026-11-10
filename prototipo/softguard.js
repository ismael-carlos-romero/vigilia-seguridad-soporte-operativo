/* Manual Inteligente SoftGuard.
   Solo consulta: no ejecuta nada en SoftGuard. Cada respuesta sale de softguard-fichas.js (pasos con página y cita)
   y de los manuales indexados en datos/softguard/. Prototipo: lo que carga la administración se guarda en el navegador
   (localStorage), igual que el resto del portal; en producción va a Firestore. */
(function(){
"use strict";
const V=window.VIGILIA_VISTAS; if(!V||!window.SG_FICHAS) return;
const LV={op:1,sup:8,adm:10}, LN={sup:"supervisión",adm:"administración"};
const CAT=Object.fromEntries(window.SG_CATEGORIAS);
const g={q:"",cat:null,id:null,done:new Set(),admin:false,more:false,adm:{ficha:""}};
const pdfOk={};
const base=()=>window.SG_MANUALES||{};
const meta=id=>(window.SG_INDICE||[]).find(m=>m.id===id);
const man=id=>base()[id];

/* ---------- texto ---------- */
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[“”"'«»‹›]/g,"").replace(/\s+/g," ").trim();
const STOP=new Set("el la los las de del al en y a un una unos unas que como para por se me mi su lo le con sin es son esta este quiero necesito puede puedo cliente dice tiene hay no si ya muy mas hago hacer donde cual".split(" "));
const cut=w=>{ w=String(w).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,""); return w.length>4?w.replace(/(es|s)$/,""):w; };
const GM={}; [["procesar","terminar","finalizar","concluir"],["espera","posponer","pausar","postergar"],["pendiente","devolver"],["cuenta","abonado"],["servicio","service"],
 ["falsa","falso"],["movil","patrulla","guardia","vigilador"],["llamar","llamada","telefono","marcar"],["nota","novedad","bitacora"],["prueba","test"]].forEach(gr=>gr.forEach(w=>GM[cut(w)]=cut(gr[0])));
const toks=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").split(/[^a-z0-9]+/).filter(w=>w&&!STOP.has(w)).map(w=>{ w=cut(w); return GM[w]||w; });

/* ---------- datos guardados (administración) ---------- */
const SG=c=>{ const s=c.S(); const o=s.sg||(s.sg={}); ["fb","corr","proc","caso"].forEach(k=>o[k]=o[k]||[]); return o; };
const extraOf=(c,id)=>{ const o=SG(c); return o.proc.filter(x=>x.ficha===id).concat(o.caso.filter(x=>x.ficha===id)); };

/* ---------- fuentes ---------- */
const pageOf=(m,p)=>m&&m.paginas.find(x=>x[0]===p);
const nPage=(m,p)=>{ const x=pageOf(m,p); if(!x) return ""; return x.n||(x.n=norm(x[1])); };
function secLabel(id,p,quote){ /* sección del manual a la que pertenece lo citado */
  const m=man(id); if(!m) return "";
  const txt=nPage(m,p), at=quote?txt.indexOf(norm(quote)):-1; let best=null,bo=-1;
  m.secciones.filter(s=>s[2]===p).forEach(s=>{ const o=txt.indexOf(norm(s[0]+" "+s[1])); if(o>=0&&(at<0||o<=at)&&o>bo){ best=s; bo=o; } });
  if(!best){ const prev=m.secciones.filter(s=>s[2]<p); best=prev[prev.length-1]; }
  return best?best[0]+" "+best[1]:"";
}
const pdfHref=(id,p)=>"manuales/softguard/"+id+".pdf#page="+p;
function probe(){ (window.SG_INDICE||[]).forEach(m=>{ if(m.id in pdfOk) return;
  if(location.protocol==="file:"){ pdfOk[m.id]=true; return; }
  pdfOk[m.id]=false; fetch(pdfHref(m.id,1).split("#")[0],{method:"HEAD"}).then(r=>{ if(r.ok){ pdfOk[m.id]=true; refresh(); } }).catch(()=>{}); }); }
const refresh=()=>{ const v=window.__vg; if(v&&v.st.mode==="sg") v.go("sg"); };

/* ---------- carga de manuales indexados ---------- */
let pending=0;
(window.SG_INDICE||[]).forEach(m=>{ pending++; const s=document.createElement("script"); s.src="datos/softguard/"+m.id+".js";
  s.onload=s.onerror=()=>{ if(!--pending){ probe(); refresh(); } }; document.head.appendChild(s); });

/* ---------- búsqueda ---------- */
const catTxt=f=>CAT[f.cat]||"";
const GEN=new Set(["cambiar","ver","problema","falla","usuario","pedir","poner","generar"].map(cut)); /* palabras que no alcanzan solas */
const wt=t=>GEN.has(t)?.4:1;
function scoreFicha(c,f,qt){
  const T=new Set(toks(f.titulo)), K=new Set(toks(f.claves)), tk=[...T,...K];
  const R=new Set(toks(f.pasos.map(p=>p.t).join(" ")+" "+(f.nota||"")+" "+catTxt(f)+" "+extraOf(c,f.id).map(x=>x.titulo+" "+(x.pasos||x.texto||"")).join(" ")));
  let tot=0,got=0,strong=false;
  qt.forEach(t=>{ let s=0; if(T.has(t)) s=4; else if(K.has(t)) s=3.5; else if(t.length>=5&&tk.some(x=>x.startsWith(t))) s=2.5; else if(R.has(t)) s=1;
    if(s>=2.5&&!GEN.has(t)) strong=true; if(s) got+=wt(t); tot+=wt(t)*s; });
  const w=qt.reduce((a,t)=>a+wt(t),0);
  return strong&&got/w>=.6?tot/w:0; /* debe cubrir la mayor parte de lo que se pidió */
}
function buscarFichas(c,q){
  const qt=[...new Set(toks(q))]; if(!qt.length) return [];
  return window.SG_FICHAS.map(f=>({f,s:scoreFicha(c,f,qt)})).filter(x=>x.s>=1.2).sort((a,b)=>b.s-a.s).map(x=>x.f);
}
function buscarPaginas(q){
  const qt=[...new Set(toks(q))]; if(!qt.length) return [];
  const w=qt.reduce((a,t)=>a+wt(t),0), out=[];
  Object.values(base()).forEach(m=>{
    const sets=m.paginas.map(p=>p.set||(p.set=new Set(toks(p[1])))), N=sets.length;
    const idf=t=>Math.log(1+N/(1+sets.filter(s=>s.has(t)).length));
    m.paginas.forEach((p,i)=>{
      const hit=qt.filter(t=>sets[i].has(t)); if(!hit.some(t=>!GEN.has(t))||hit.reduce((a,t)=>a+wt(t),0)/w<.6) return;
      const raw=p[1], low=raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
      const pos=Math.min(...hit.map(t=>{ const k=low.indexOf(t.slice(0,Math.max(4,t.length-1))); return k<0?1e9:k; }));
      const a=Math.max(0,(pos>1e8?0:pos)-100);
      out.push({id:m.meta.id,p:p[0],s:hit.reduce((x,t)=>x+idf(t)*wt(t),0),snip:raw.slice(a,a+280).replace(/\s+/g," ").trim()});
    });
  });
  return out.sort((a,b)=>b.s-a.s).slice(0,4);
}

/* ---------- piezas de pantalla ---------- */
const bold=(c,t)=>c.esc(t).replace(/«([^»]+)»/g,"<b>«$1»</b>");
const crumbs=(c,last)=>`<div class="crumbs"><button data-act="home">Inicio</button><span>›</span>${last?`<button data-act="sgtop">Manual SoftGuard</button><span>›</span><span class="cur">${c.esc(last)}</span>`:`<span class="cur">Manual SoftGuard</span>`}</div>`;
const tags=(c,f,rol)=>{ const o=[`<span class="tag">${c.esc(catTxt(f))}</span>`];
  if(f.insuficiente) o.push(`<span class="tag bad">Sin cobertura en el manual</span>`); else if(f.parcial) o.push(`<span class="tag warn">Cobertura parcial</span>`);
  if(f.nivel!=="op") o.push(`<span class="tag ${LV[rol]>=LV[f.nivel]?"pri":"bad"}">Requiere ${LN[f.nivel]}</span>`);
  return o.join(" "); };
const fichaItem=(c,f)=>{ const n=[catTxt(f)]; if(f.insuficiente) n.push("sin cobertura en el manual"); else if(f.parcial) n.push("cobertura parcial"); if(f.nivel!=="op") n.push("requiere "+LN[f.nivel]);
  return `<button class="pick" data-act="sgficha" data-id="${f.id}"><b>${c.esc(f.titulo)}</b><span>${c.esc(n.join(" · "))}</span></button>`; };
function renderSug(){ const v=window.__vg; if(!v||v.st.mode!=="sg") return; const q=document.getElementById("q").value.trim(), el=document.getElementById("sug"), c=v.ctx();
  if(q.length<2){ el.innerHTML=""; return; }
  el.innerHTML=buscarFichas(c,q).slice(0,4).map(f=>`<li><button type="button" data-act="sgficha" data-id="${f.id}"><span><b>${c.esc(f.titulo)}</b></span><span class="tag">SoftGuard</span></button></li>`).join(""); }

/* ---------- vista principal ---------- */
V.sg=(v,c)=>{
  const rol=c.st.role, qEl=document.getElementById("q");
  document.querySelectorAll("[data-sector]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.sector==="sg"));
  if(g.q!==qEl.value.trim() && g.q) qEl.value=g.q;
  if(pending){ v.innerHTML=`<div class="step">${crumbs(c)}<div class="empty">Cargando los manuales…</div></div>`; return; }
  if(g.admin&&rol==="adm") return admin(v,c);
  if(g.id){ const f=window.SG_FICHAS.find(x=>x.id===g.id); if(f) return ficha(v,c,f); }
  if(g.q) return resultados(v,c);
  if(g.cat) return categoria(v,c);
  v.innerHTML=`<div class="step">${crumbs(c)}<p class="q">Manual SoftGuard</p>
   <p class="sub">Respuestas paso a paso sacadas de los manuales oficiales. Cada paso indica la página del manual. Escribí arriba lo que necesitás o elegí una categoría.</p>
   <div class="okbar" style="margin:0 0 16px"><b>Solo consulta.</b> Esta pantalla no hace cambios en SoftGuard.</div>
   <div class="grid">${window.SG_CATEGORIAS.map(([id,l])=>`<button class="pick" data-act="sgcat" data-id="${id}"><b>${c.esc(l)}</b><span>${window.SG_FICHAS.filter(f=>f.cat===id).length} guías</span></button>`).join("")}</div>
   <section class="sec"><h2>Cómo leer las respuestas</h2><div class="stack" style="display:grid;gap:8px">
    <p style="margin:0"><span class="tag ok">Manual oficial SoftGuard</span> cómo funciona el programa, según el manual.</p>
    <p style="margin:0"><span class="tag pri">Procedimiento interno Vigilia</span> qué hace la central, según las normas autorizadas.</p>
    <p style="margin:0"><span class="tag warn">Caso práctico</span> experiencia registrada y validada por administración.</p></div></section>
   <section class="sec"><h2>Manuales cargados</h2><div class="stack" style="display:grid;gap:8px">${Object.values(base()).map(m=>m.meta).sort((a,b)=>(b.actual?1:0)-(a.actual?1:0)).map(m=>`<div class="item" style="padding:12px 16px"><b>${c.esc(m.codigo)} · ${c.esc(m.titulo)}</b><div class="meta"><span>${c.esc(m.version)}</span><span>${m.paginas} páginas</span><span class="tag ${m.actual?"ok":""}">${m.actual?"Vigente":"Versión anterior"}</span>${pdfOk[m.id]?`<a href="${pdfHref(m.id,1)}" target="_blank" rel="noopener">Abrir PDF</a>`:`<span class="tag warn">PDF no cargado en el portal</span>`}</div></div>`).join("")||`<div class="empty">Todavía no hay manuales indexados.</div>`}</div></section>
   ${rol==="adm"?`<div class="foot"><button class="btn ghost" data-act="sgadmin">Administración SoftGuard</button></div>`:""}</div>`;
};

function categoria(v,c){
  const rol=c.st.role, l=window.SG_FICHAS.filter(f=>f.cat===g.cat);
  v.innerHTML=`<div class="step">${crumbs(c,CAT[g.cat])}<p class="q">${c.esc(CAT[g.cat])}</p><div class="grid" style="margin-top:14px">${l.map(f=>fichaItem(c,f)).join("")}</div></div>`;
}

function resultados(v,c){
  const rol=c.st.role, fs=buscarFichas(c,g.q), ps=buscarPaginas(g.q);
  v.innerHTML=`<div class="step">${crumbs(c,"“"+g.q+"”")}
   ${fs.length?`<p class="q">Guías para “${c.esc(g.q)}”</p><div class="grid" style="margin-top:14px">${fs.slice(0,6).map(f=>fichaItem(c,f)).join("")}</div>`
   :`<p class="q">No hay una guía preparada para “${c.esc(g.q)}”</p>`}
   ${ps.length?`<section class="sec"><h2>${fs.length?"Otros pasajes del manual que lo mencionan":"Pasajes del manual que lo mencionan"}</h2>
    <p class="hint" style="margin:0 0 10px">Texto literal del manual, sin interpretar. No es un procedimiento: confirmá con la guía o con supervisión.</p>
    <div class="stack" style="display:grid;gap:10px">${ps.map(p=>{ const m=meta(p.id); return `<article class="item"><div class="src"><span class="tag ok">Manual oficial</span><span>${c.esc(m.codigo)} ${c.esc(m.version)} · ${c.esc(secLabel(p.id,p.p))} · p. ${p.p}</span>${pdfOk[p.id]?`<a class="btn ghost sm" style="display:inline-flex;align-items:center;text-decoration:none" href="${pdfHref(p.id,p.p)}" target="_blank" rel="noopener">Abrir PDF en p. ${p.p}</a>`:""}</div><p class="sgq">“${c.esc(p.snip)}…”</p></article>`; }).join("")}</div></section>`:""}
   ${!fs.length&&!ps.length?`<div class="card"><p style="margin:0">La documentación cargada no cubre esta consulta. No se muestra ninguna respuesta para no inventar un procedimiento.</p>
    <div class="foot"><button class="btn" data-act="sgmiss">Avisar a supervisión</button></div></div>`:""}
  </div>`;
}

function ficha(v,c,f){
  const rol=c.st.role, o=SG(c), mt=meta(f.manual), locked=LV[rol]<LV[f.nivel];
  const corr=o.corr.filter(x=>x.ficha===f.id), ext=extraOf(c,f.id);
  const procs=((window.VIGILIA_MODULOS||{}).procs||[]).filter(p=>f.interno.includes(p.id));
  const casos=o.caso.filter(x=>x.ficha===f.id), pAdm=o.proc.filter(x=>x.ficha===f.id);
  const nopdf=mt&&!pdfOk[mt.id];
  const steps=f.pasos.map((s,i)=>{ const lab=secLabel(f.manual,s.p,s.q), dn=g.done.has(i);
    return `<li class="${dn?"done":""}" data-act="sgstep" data-i="${i}" tabindex="0"><span class="n">${i+1}</span><span class="t">${bold(c,s.t)}
     <span class="src" style="display:flex;margin-top:8px;font-size:14px"><span>${c.esc(mt?mt.codigo+" "+mt.version:"")} · ${c.esc(lab)} · p. ${s.p}</span>${nopdf?"":`<a class="btn ghost sm" style="display:inline-flex;align-items:center;text-decoration:none;min-height:30px" href="${pdfHref(f.manual,s.p)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Abrir PDF en p. ${s.p}</a>`}</span>
     <span class="sgq" style="display:block">“${c.esc(s.q)}”</span></span></li>`; }).join("");
  v.innerHTML=`<div class="step">${crumbs(c,f.titulo)}
   <div class="gh"><h2>${c.esc(f.titulo)}</h2></div><div class="src">${tags(c,f,rol)}</div>
   <div class="okbar"><b>Solo consulta.</b> Esto no hace cambios en SoftGuard: los pasos los hacés vos en el programa.</div>
   ${corr.map(x=>`<article class="note" style="margin-top:14px"><h3>Corrección vigente de ${c.esc(x.by)}</h3><p style="white-space:pre-line">${c.esc(x.texto)}</p><div class="meta"><span>${c.fmt(x.at)} · reemplaza lo que diga la guía en este punto</span></div></article>`).join("")}
   ${f.advertencia?`<div class="warnbar"><b>Atención.</b> ${c.esc(f.advertencia)}</div>`:""}
   ${(f.insuficiente||f.parcial)?`<section class="card"><h3>${f.insuficiente?"El manual no cubre esto":"El manual lo cubre solo en parte"}</h3><p style="margin:0">${c.esc(f.nota)}</p>${f.faltan?`<p class="hint">No documentado: ${f.faltan.map(c.esc).join(", ")}.</p>`:""}</section>`:""}
   ${f.pasos.length?(locked?`<section class="card" style="border-color:var(--bad)"><h3>Manual oficial SoftGuard</h3><p style="margin:0;font-size:20px"><b>Requiere autorización de ${LN[f.nivel]}.</b> Consultá con tu supervisor antes de hacerlo: no se muestran los pasos para este nivel de usuario.</p></section>`
   :`<section class="card" style="border-color:var(--ok)"><h3><span class="tag ok">Manual oficial SoftGuard</span> ${c.esc(mt?mt.codigo+" · "+mt.titulo+" · "+mt.version:"")}</h3>
     <ol class="steps">${steps}</ol>
     ${nopdf?`<p class="hint">El PDF todavía no está cargado en el portal; la página indicada es la del manual original.</p>`:""}</section>`):""}
   ${procs.length||pAdm.length?`<section class="card" style="border-color:var(--pri)"><h3><span class="tag pri">Procedimiento interno Vigilia</span></h3>
     ${procs.map(p=>`<div style="margin-bottom:12px"><p style="margin:0"><b>${c.esc(p.event)}</b> <span class="tag">${c.esc(p.code)}</span></p>
       <ol style="margin:6px 0 0;padding-left:24px;display:grid;gap:4px">${p.checks.map(t=>`<li>${c.esc(t)}</li>`).join("")}</ol>
       <p style="margin:6px 0 0;color:var(--mu)">${c.esc(p.action)}</p><button class="btn ghost sm" style="margin-top:6px" data-act="open" data-id="iso-${p.id}">Abrir en Procedimientos</button></div>`).join("")}
     ${pAdm.map(p=>`<div style="margin-bottom:12px"><p style="margin:0"><b>${c.esc(p.titulo)}</b> <span class="tag warn">Cargado por administración</span></p>
       <ol style="margin:6px 0 0;padding-left:24px;display:grid;gap:4px">${p.pasos.split(/\n+/).filter(Boolean).map(t=>`<li>${c.esc(t)}</li>`).join("")}</ol>
       <p style="margin:6px 0 0;color:var(--mu)">Autoriza: ${c.esc(p.fuente)} · ${c.fmt(p.at)}</p></div>`).join("")}</section>`:""}
   ${casos.length?`<section class="card" style="border-color:var(--warn)"><h3><span class="tag warn">Caso práctico</span> experiencia validada</h3>
     ${casos.map(x=>`<div style="margin-bottom:12px"><p style="margin:0"><b>${c.esc(x.titulo)}</b></p><ol style="margin:6px 0 0;padding-left:24px;display:grid;gap:4px">${x.texto.split(/\n+/).filter(Boolean).map(t=>`<li>${c.esc(t)}</li>`).join("")}</ol>
       <p style="margin:6px 0 0;color:var(--mu)">Resolvió: ${c.esc(x.fuente)} · validado por ${c.esc(x.by)} el ${c.fmt(x.at)}</p></div>`).join("")}</section>`:""}
   ${(f.rel||[]).length?`<section class="sec"><h2>Guías relacionadas</h2><div class="chips">${f.rel.map(r=>{ const x=window.SG_FICHAS.find(y=>y.id===r); return x?`<button class="chip" data-act="sgficha" data-id="${x.id}">${c.esc(x.titulo)}</button>`:""; }).join("")}</div></section>`:""}
   <div class="foot"><button class="btn ghost" data-act="sgcopy">Copiar fuente</button><span class="grow"></span><button class="link" data-act="sgfb">Esta guía tiene un error o le falta algo</button></div></div>`;
}

/* ---------- administración (solo administradores) ---------- */
function admin(v,c){
  const o=SG(c), fo=window.SG_FICHAS.map(f=>`<option value="${f.id}"${g.adm.ficha===f.id?" selected":""}>${c.esc(CAT[f.cat])} · ${c.esc(f.titulo)}</option>`).join("");
  const fl=id=>(window.SG_FICHAS.find(f=>f.id===id)||{}).titulo||id;
  const del=(k,id)=>`<button class="link" data-act="sgdel" data-k="${k}" data-id="${id}">Quitar</button>`;
  v.innerHTML=`<div class="step">${crumbs(c,"Administración")}<p class="q">Administración SoftGuard</p>
   <p class="sub">Lo que cargás acá se suma a las guías sin tocar el texto del manual ni los procedimientos MON-01. Queda a la vista con su autor.</p>
   <section class="card"><h3>Manuales cargados y versiones</h3>
    ${(window.SG_INDICE||[]).map(m=>`<p style="margin:0 0 6px"><b>${c.esc(m.codigo)} · ${c.esc(m.titulo)}</b> · ${c.esc(m.version)} · ${m.paginas} páginas <span class="tag ${m.actual?"ok":""}">${m.actual?"Vigente":"Anterior"}</span> ${pdfOk[m.id]?"":`<span class="tag warn">falta el PDF en ${c.esc(m.pdf)}</span>`}</p>`).join("")}
    <p class="hint">Para agregar un manual o una versión nueva (las anteriores se conservan): copiá el PDF a <code>prototipo/manuales/softguard/&lt;id&gt;.pdf</code> y ejecutá
    <code>python3 scripts/indexar_softguard.py MANUAL.pdf --id &lt;id&gt; --codigo "TEC 167" --titulo "Monitoreo Web" --version "RD 181220" --actual</code>. Después se escriben las guías en <code>softguard-fichas.js</code> y se corre <code>node softguard.test.cjs</code>.</p></section>
   <section class="card"><h3>Correcciones pedidas por operadores (${o.fb.filter(x=>!x.ok).length} abiertas)</h3>
    ${o.fb.slice().reverse().map(x=>`<div class="item" style="margin-bottom:8px"><p style="margin:0">${c.esc(x.texto)}</p><div class="meta"><span>${c.esc(fl(x.ficha))}</span><span>${c.fmt(x.at)}</span><span class="tag ${x.ok?"ok":"warn"}">${x.ok?"Resuelta":"Abierta"}</span></div>
     <div class="acts">${x.ok?"":`<button class="btn ghost sm" data-act="sgfbok" data-id="${x.id}">Marcar resuelta</button><button class="btn ghost sm" data-act="sgcorrfor" data-id="${x.ficha}">Corregir esa guía</button>`}</div></div>`).join("")||`<p class="empty" style="margin:0">Nada por ahora.</p>`}</section>
   <form class="card form" data-vform="sgcorr" id="sgcorr"><h3>Corregir una respuesta</h3>
    <label>Guía<select name="ficha" required>${fo}</select></label>
    <label>Corrección (se muestra arriba de la guía; el texto original queda debajo)<textarea name="texto" required maxlength="600"></textarea></label>
    <button class="btn" type="submit">Publicar corrección</button>
    ${o.corr.map(x=>`<p style="margin:0">${c.esc(fl(x.ficha))}: ${c.esc(x.texto.slice(0,90))} ${del("corr",x.id)}</p>`).join("")}</form>
   <form class="card form" data-vform="sgproc"><h3>Incorporar un procedimiento interno</h3>
    <label>Guía a la que pertenece<select name="ficha" required>${fo}</select></label>
    <label>Título<input name="titulo" required maxlength="100"></label>
    <label>Pasos (uno por línea)<textarea name="pasos" required maxlength="1200"></textarea></label>
    <label>Quién lo autoriza (supervisión, gerencia, norma)<input name="fuente" required maxlength="100"></label>
    <button class="btn" type="submit">Guardar</button>
    ${o.proc.map(x=>`<p style="margin:0">${c.esc(fl(x.ficha))}: ${c.esc(x.titulo)} ${del("proc",x.id)}</p>`).join("")}</form>
   <form class="card form" data-vform="sgcaso"><h3>Registrar un caso práctico (nueva solución validada)</h3>
    <label>Guía a la que pertenece<select name="ficha" required>${fo}</select></label>
    <label>Título del caso<input name="titulo" required maxlength="100"></label>
    <label>Qué se hizo y funcionó (un paso por línea)<textarea name="texto" required maxlength="1200"></textarea></label>
    <label>Quién lo resolvió<input name="fuente" required maxlength="100"></label>
    <button class="btn" type="submit">Registrar como validado</button>
    ${o.caso.map(x=>`<p style="margin:0">${c.esc(fl(x.ficha))}: ${c.esc(x.titulo)} ${del("caso",x.id)}</p>`).join("")}</form></div>`;
}

/* ---------- acciones y formularios ---------- */
const abrir=(id)=>{ g.id=id; g.done=new Set(); g.admin=false; };
const prevAct=V.act;
V.act=(a,b,c)=>{
  if(a==="sg"){ g.id=null; g.cat=null; g.admin=false; g.q=document.getElementById("q").value.trim(); c.go("sg"); scrollTo({top:0}); return true; }
  if(!/^sg/.test(a)) return prevAct?prevAct(a,b,c):false;
  const id=b.dataset.id, o=SG(c);
  if(a==="sgtop"){ g.id=null; g.cat=null; g.q=""; g.admin=false; document.getElementById("q").value=""; c.go("sg"); }
  else if(a==="sgcat"){ g.cat=id; g.id=null; g.q=""; c.go("sg"); scrollTo({top:0}); }
  else if(a==="sgficha"){ abrir(id); c.log("guia","[SoftGuard] "+(window.SG_FICHAS.find(f=>f.id===id)||{}).titulo); c.go("sg"); scrollTo({top:0}); }
  else if(a==="sgstep"){ const i=+b.dataset.i; g.done.has(i)?g.done.delete(i):g.done.add(i); c.go("sg"); const li=document.querySelector(`[data-act=sgstep][data-i="${i}"]`); if(li) li.focus({preventScroll:true}); }
  else if(a==="sgadmin"){ g.admin=true; g.id=null; c.go("sg"); scrollTo({top:0}); }
  else if(a==="sgmiss"){ const k="[SoftGuard] "+c.norm(g.q); const m=c.S().miss[k]||(c.S().miss[k]={n:0}); m.n++; m.sent=true; c.save(); c.toast("Supervisor avisado"); }
  else if(a==="sgcopy"){ const f=window.SG_FICHAS.find(x=>x.id===g.id), mt=meta(f.manual); const pgs=[...new Set(f.pasos.map(s=>s.p))].sort((x,y)=>x-y);
    c.copy("SoftGuard · "+f.titulo+(pgs.length?"\nFuente: "+mt.codigo+" "+mt.titulo+" ("+mt.version+"), p. "+pgs.join(", "):"\nSin cobertura en el manual: ver procedimiento interno")).then(()=>c.toast("Fuente copiada")); }
  else if(a==="sgfb"){ const t=prompt("¿Qué está mal o qué falta en esta guía?"); if(t&&t.trim()){ o.fb.push({id:"f"+Date.now(),ficha:g.id,texto:t.trim(),at:Date.now()}); c.save(); c.toast("Gracias. Le llega a administración."); } }
  else if(a==="sgfbok"){ const x=o.fb.find(y=>y.id===id); if(x){ x.ok=true; c.save(); c.go("sg"); } }
  else if(a==="sgcorrfor"){ g.adm.ficha=id; c.go("sg"); const f=document.getElementById("sgcorr"); if(f) f.scrollIntoView({behavior:"smooth",block:"center"}); }
  else if(a==="sgdel"){ const k=b.dataset.k; o[k]=o[k].filter(x=>x.id!==id); c.save(); c.go("sg"); }
  return true;
};
const prevSubmit=V.submit;
V.submit=(f,c,sub)=>{
  const k=f.dataset.vform; if(!/^sg/.test(k)) return prevSubmit?prevSubmit(f,c,sub):false;
  if(c.st.role!=="adm"){ c.toast("Solo administración puede cargar esto"); return true; }
  const d=new FormData(f), t=n=>String(d.get(n)||"").trim(), o=SG(c), by="administración", now=Date.now(), base={id:"x"+now,ficha:t("ficha"),at:now,by};
  if(k==="sgcorr") o.corr.push(Object.assign(base,{texto:t("texto")}));
  else if(k==="sgproc") o.proc.push(Object.assign(base,{titulo:t("titulo"),pasos:t("pasos"),fuente:t("fuente")}));
  else if(k==="sgcaso") o.caso.push(Object.assign(base,{titulo:t("titulo"),texto:t("texto"),fuente:t("fuente")}));
  else return false;
  c.save(); c.toast("Guardado"); c.go("sg"); return true;
};

/* ---------- integración con el buscador y el selector de sector ---------- */
const $=s=>document.querySelector(s);
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("[data-sector]"); if(!b) return;
  const v=window.__vg; if(!v) return;
  if(b.dataset.sector==="sg"){ e.stopPropagation(); e.preventDefault(); g.id=null; g.cat=null; g.admin=false; g.q=$("#q").value.trim(); v.st.mode="sg"; v.go("sg"); }
  else if(v.st.mode==="sg"){ v.st.mode="home"; }
},true);
document.addEventListener("submit",e=>{
  const v=window.__vg; if(!v||e.target.id!=="form"||v.st.mode!=="sg") return;
  e.preventDefault(); e.stopImmediatePropagation();
  g.q=$("#q").value.trim(); g.id=null; g.cat=null; g.admin=false;
  if(g.q) v.ctx().log("buscar","[SoftGuard] "+g.q);
  v.go("sg");
},true);
document.getElementById("q").addEventListener("input",()=>setTimeout(renderSug,0));
document.addEventListener("keydown",e=>{ const li=e.target.closest&&e.target.closest("[data-act=sgstep]"); if(li&&(e.key==="Enter"||e.key===" ")){ e.preventDefault(); li.click(); } });

const style=document.createElement("style");
style.textContent=".sgq{color:var(--mu);font-size:14px;margin:6px 0 0;font-style:italic}.steps .src{font-style:normal}code{font:14px var(--mono);background:var(--bg);padding:1px 6px;border-radius:6px;word-break:break-all}";
document.head.appendChild(style);
})();
