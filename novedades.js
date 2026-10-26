// Novedades share the existing authenticated resource store, isolated by recordKind.
// They are never returned by getResourceRows(), nor used as approved procedures.
const inboxState = { editing: null, saving: false, view: 'sheet' };
const inboxStatuses = ['Pendiente de clasificar', 'En revisión', 'Listo para integrar', 'Integrado', 'Archivado'];
const inboxEl = id => document.getElementById(id);

function inboxUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function inboxRows() {
  // No cross-user local fallback: shared material comes from the authenticated store.
  if (!state.firebase.currentUser || !getSession().active || !state.firebase.resourcesLoaded) return [];
  return state.firebase.resources.filter(row => row.recordKind === 'novedad')
    .slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function inboxVisibleRows() {
  const query = normalize(inboxEl('inboxSearch').value.trim());
  const status = inboxEl('inboxFilter').value;
  const sector = inboxEl('inboxSectorFilter').value;
  return inboxRows().filter(row =>
    (status === 'Todos los estados' || row.status === status) &&
    (sector === 'Todos los sectores' || row.sector === sector) &&
    (!query || inboxQueryMatches(row, query)));
}

function renderNovedades() {
  if (!inboxEl('inboxRows')) return;
  const all = inboxRows();
  const rows = inboxVisibleRows();
  const connected = Boolean(state.firebase.currentUser && getSession().active && state.firebase.resourcesLoaded);
  inboxEl('inboxConnection').textContent = connected
    ? 'Base central conectada · los cambios quedan disponibles para los usuarios del portal.'
    : 'Esperando conexión y permisos de la base central. No se muestran datos de una sesión anterior.';
  inboxEl('inboxSave').disabled = !connected || inboxState.saving;
  inboxEl('inboxCount').textContent = `${rows.length} de ${all.length} registros`;
  inboxEl('inboxStats').innerHTML = inboxStatuses.slice(0, 4).map(status =>
    `<div><b>${all.filter(row => row.status === status).length}</b><span>${escapeHtml(status)}</span></div>`).join('');
  const sheet = inboxState.view === 'sheet';
  inboxEl('inboxTableHead').innerHTML = '<tr>' + (sheet ? ['Título','Contenido','Sector','Estado / destino','Fuente','Notas','Fecha / carga','Acción'] : ['Fecha / carga','Novedad / fuente','Sector','Estado / destino','Acción']).map(label => '<th scope="col">' + label + '</th>').join('') + '</tr>';
  inboxEl('inboxRows').innerHTML = rows.length ? rows.map(row => {
    const href = inboxUrl(row.link);
    const date = new Date(row.date);
    if (sheet) return inboxSheetRow(row, date);
    return `<tr><td>${Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}<small>${escapeHtml(row.operator || '')}</small></td>
      <td><strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.source || 'Sin fuente indicada')}</small><details><summary>Ver contenido</summary><p class="inbox-original">${escapeHtml(row.notes || 'Material referenciado por enlace.')}</p>${row.reviewNotes ? `<p class="inbox-original"><b>Revisión:</b> ${escapeHtml(row.reviewNotes)}</p>` : ''}${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Abrir material ↗</a>` : ''}</details></td>
      <td>${escapeHtml(row.sector)}</td><td><span class="pill">${escapeHtml(row.status)}</span><small>${escapeHtml(row.destination || 'Por definir')}</small></td>
      <td><button type="button" data-inbox-edit="${escapeHtml(row.id)}">Revisar / editar</button></td></tr>`;
  }).join('') : `<tr><td colspan="${sheet ? 8 : 5}">${all.length ? 'No hay novedades con estos filtros.' : connected ? 'Todavía no hay novedades. Cargá el primer material desde el formulario.' : 'Conectando con la base central…'}</td></tr>`;
  inboxEl('inboxRows').querySelectorAll('[data-inbox-edit]').forEach(button =>
    button.addEventListener('click', () => editInboxRow(button.dataset.inboxEdit)));
  inboxEl('inboxRows').querySelectorAll('[data-inbox-detail]').forEach(button => button.addEventListener('click', () => inboxOpenDetail(button.dataset.inboxDetail)));
}

function resetInboxForm() {
  inboxState.editing = null;
  inboxEl('inboxForm').reset();
  inboxEl('inboxFormHeading').textContent = 'Cargar novedad';
  inboxEl('inboxSave').textContent = 'Guardar novedad';
  inboxEl('inboxCancel').textContent = 'Limpiar formulario';
}

function editInboxRow(id) {
  const row = inboxRows().find(item => item.id === id);
  if (!row) return;
  inboxState.editing = { ...row };
  const fields = { inboxTitle: 'title', inboxText: 'notes', inboxLink: 'link', inboxSource: 'source', inboxSector: 'sector', inboxStatus: 'status', inboxDestination: 'destination', inboxNotes: 'reviewNotes' };
  Object.entries(fields).forEach(([field, key]) => { inboxEl(field).value = row[key] || ''; });
  inboxEl('inboxFormHeading').textContent = 'Revisar novedad';
  inboxEl('inboxSave').textContent = 'Guardar cambios';
  inboxEl('inboxCancel').textContent = 'Cancelar edición';
  inboxEl('inboxSaveState').textContent = 'Editar el estado no publica el contenido en otra sección.';
  inboxEl('novedades').classList.remove('inbox-expanded');
  if (inboxEl('inboxExpand')) { inboxEl('inboxExpand').textContent = 'Ampliar tabla'; inboxEl('inboxExpand').setAttribute('aria-expanded','false'); }
  if (inboxEl('inboxManual')) inboxEl('inboxManual').open = true;
  inboxEl('inboxForm').scrollIntoView({block:'start',behavior:'smooth'});
  inboxEl('inboxTitle').focus({preventScroll:true});
}

function inboxPayload(original, fields, session, now, id) {
  const title = fields.title.trim();
  const notes = fields.notes.trim();
  const link = fields.link.trim();
  if (!title || (!notes && !link)) throw new Error('Completá un título y contenido o enlace.');
  if (link && !inboxUrl(link)) throw new Error('El enlace debe comenzar con https:// o http://.');
  if (!inboxStatuses.includes(fields.status)) throw new Error('Seleccioná un estado válido.');
  if (fields.status === 'Integrado' && (fields.destination === 'Por definir' || !fields.reviewNotes.trim())) {
    throw new Error('Para marcar como integrado, indicá la sección de destino y dónde quedó incorporado.');
  }
  return {
    ...original, id, recordKind: 'novedad', type: 'Material pendiente',
    date: original?.date || now, title, notes, link: link ? inboxUrl(link) : '',
    source: fields.source.trim(), sector: fields.sector, status: fields.status,
    destination: fields.destination, reviewNotes: fields.reviewNotes.trim(),
    operator: original?.operator || session.operator, operatorUid: original?.operatorUid || session.uid,
    updatedAt: now, updatedBy: session.operator, updatedByUid: session.uid
  };
}

async function saveInboxRow(event) {
  event.preventDefault();
  if (inboxState.saving) return;
  const message = inboxEl('inboxSaveState');
  const session = getSession();
  if (!state.firebase.currentUser || !session.active || !state.firebase.resourcesLoaded) {
    message.textContent = 'Esperá la conexión de la base central antes de guardar.';
    return;
  }
  const fields = { title: inboxEl('inboxTitle').value, notes: inboxEl('inboxText').value,
    link: inboxEl('inboxLink').value, source: inboxEl('inboxSource').value,
    sector: inboxEl('inboxSector').value, status: inboxEl('inboxStatus').value,
    destination: inboxEl('inboxDestination').value, reviewNotes: inboxEl('inboxNotes').value };
  try {
    const original = inboxState.editing;
    const ref = original ? resourceCollection().doc(original.id) : resourceCollection().doc();
    const payload = inboxPayload(original, fields, session, new Date().toISOString(), ref.id);
    inboxState.saving = true;
    renderNovedades();
    message.textContent = 'Guardando en la base central…';
    // Transaction prevents silently overwriting another operator's review.
    await state.firebase.db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (original && (!snapshot.exists || snapshot.data().updatedAt !== original.updatedAt)) {
        throw new Error('Otra persona modificó esta novedad. Volvé a abrirla desde la tabla para revisar la última versión.');
      }
      transaction.set(ref, payload);
    });
    resetInboxForm();
    message.textContent = 'Novedad guardada en la base central. Disponible para clasificar después.';
  } catch (error) {
    message.textContent = ['permission-denied', 'unavailable'].includes(error.code)
      ? 'No se pudo guardar en la base central. El formulario conserva el contenido; revisá conexión y permisos antes de reintentar.'
      : error.message || 'No se pudo guardar. El contenido permanece en el formulario.';
  } finally {
    inboxState.saving = false;
    renderNovedades();
  }
}

function inboxCsv(rows) {
  // Neutralize formula injection when CSV is opened in Sheets/Excel.
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const keys = ['date', 'title', 'notes', 'source', 'link', 'sector', 'status', 'destination', 'reviewNotes', 'operator', 'updatedAt', 'updatedBy'];
  const header = ['Fecha', 'Título', 'Contenido original', 'Fuente', 'Enlace', 'Sector', 'Estado', 'Destino', 'Notas de revisión', 'Cargado por', 'Última modificación', 'Modificado por'];
  return '\uFEFF' + [header, ...rows.map(row => keys.map(key => row[key]))].map(row => row.map(cell).join(';')).join('\r\n');
}

document.addEventListener('DOMContentLoaded', () => {
  inboxEl('inboxForm').addEventListener('submit', saveInboxRow);
  inboxEl('inboxCancel').addEventListener('click', resetInboxForm);
  ['inboxSearch', 'inboxFilter', 'inboxSectorFilter'].forEach(id => inboxEl(id).addEventListener('input', renderNovedades));
  inboxEl('inboxExport').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([inboxCsv(inboxVisibleRows())], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Vigilia-Novedades-' + new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) + '.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  state.firebase.auth?.onAuthStateChanged(user => {
    if (!user) resetInboxForm();
    renderNovedades();
  });
  renderNovedades();
});


// Bulk import accepts local classified material; no source documents are bundled in public assets.
function inboxQueryMatches(row, query) {
  const haystack = normalize([row.title, row.notes, row.source, row.reviewNotes, row.operator, row.destination, row.sector].join(' '));
  return normalize(query).split(/[\s,;]+/).filter(Boolean).every(word => haystack.includes(word));
}

document.addEventListener('DOMContentLoaded', () => {
  const form = inboxEl('inboxForm');
  if (!form) return;
  const panel = document.createElement('details');
  panel.className = 'inbox-card inbox-import';
  panel.innerHTML = '<summary>Importar bitácora clasificada</summary><p>Importá un archivo JSON clasificado. Conserva el texto original, sector, palabras clave y fuente. Se guarda en la base autenticada como material en revisión.</p><label for="inboxImportFile">Archivo clasificado (.json)</label><input id="inboxImportFile" type="file" accept=".json,application/json"><p id="inboxImportPreview" role="status"></p><button id="inboxImportCommit" type="button" disabled>Guardar registros en la base central</button><p id="inboxImportProgress" role="status"></p>';
  inboxEl('inboxSidebar').appendChild(panel);
  const fileInput = inboxEl('inboxImportFile'), commit = inboxEl('inboxImportCommit');
  let pending = [];
  let busy = false;
  const sectors = ['Sin clasificar', 'Monitoreo 911', 'SAFE', 'Servicio técnico', 'Supervisión', 'Administración', 'Todos los sectores'];
  const destinations = ['Por definir', 'Procedimientos', 'Supervisión', 'Recursos', 'Objetivo Fijo (911)', 'Objetivos Móviles (SAFE)', 'Respuestas', 'Aprendizajes', 'Otro'];
  fileInput.addEventListener('change', async () => {
    pending = []; commit.disabled = true;
    try {
      const file = fileInput.files[0];
      if (!file) return;
      if (file.size > 10000000) throw new Error('El archivo supera 10 MB.');
      const data = JSON.parse(await file.text());
      if (data.format !== 'vigilia-novedades-v1' || !Array.isArray(data.records) || !data.records.length || data.records.length > 3000) throw new Error('Formato de importación no válido.');
      const ids = new Set();
      pending = data.records.map(row => {
        if (!/^mmm-[a-f0-9]{24}$/.test(row.id) || ids.has(row.id)) throw new Error('Identificadores inválidos o duplicados.');
        ids.add(row.id);
        for (const key of ['title','notes','source','reviewNotes','sector','destination']) {
          if (typeof row[key] !== 'string' || row[key].length > 150000) throw new Error('Campo inválido: ' + key);
        }
        if (!row.title.trim() || !row.notes.trim() || !sectors.includes(row.sector) || !destinations.includes(row.destination)) throw new Error('Registro incompleto o clasificación inválida.');
        return { id:row.id, title:row.title, notes:row.notes, source:row.source, reviewNotes:row.reviewNotes, sector:row.sector, destination:row.destination, status:'En revisión', link:'' };
      });
      const counts = pending.reduce((a,r) => { a[r.sector]=(a[r.sector]||0)+1; return a; }, {});
      inboxEl('inboxImportPreview').textContent = pending.length + ' registros · ' + Object.entries(counts).map(([s,n]) => s + ': ' + n).join(' · ') + '. Los registros existentes se conservan sin sobrescribir.';
      commit.disabled = false;
    } catch(error) {
      pending=[]; inboxEl('inboxImportPreview').textContent=error.message;
    }
  });
  commit.addEventListener('click', async () => {
    if (busy || !pending.length) return;
    const session = getSession();
    const user = state.firebase.currentUser;
    if (!user || !session.active || !state.firebase.resourcesLoaded) {
      inboxEl('inboxImportProgress').textContent='Esperá la conexión de la base central.'; return;
    }
    busy=true; commit.disabled=true; fileInput.disabled=true;
    let saved=0, skipped=0;
    try {
      for (let offset=0; offset<pending.length; offset+=40) {
        if (state.firebase.currentUser?.uid !== user.uid || !getSession().active) throw new Error('La sesión cambió. Volvé a ingresar antes de reintentar.');
        const chunk=pending.slice(offset,offset+40);
        const now=new Date().toISOString();
        const result=await state.firebase.db.runTransaction(async tx => {
          const refs=chunk.map(row => resourceCollection().doc(row.id));
          const snapshots=await Promise.all(refs.map(ref => tx.get(ref)));
          let created=0, existing=0;
          snapshots.forEach((snapshot,i) => {
            if (snapshot.exists) { existing++; return; }
            tx.set(refs[i], inboxPayload(null, chunk[i], session, now, chunk[i].id));
            created++;
          });
          return {created,existing};
        });
        saved+=result.created; skipped+=result.existing;
        inboxEl('inboxImportProgress').textContent='Procesados ' + Math.min(offset+40,pending.length) + ' de ' + pending.length + ' · guardados ' + saved + ' · existentes ' + skipped;
      }
      inboxEl('inboxSearch').value='';
      inboxEl('inboxSectorFilter').value='Todos los sectores';
      inboxEl('inboxFilter').value='Todos los estados';
      renderNovedades();
      inboxEl('inboxImportProgress').textContent='Importación completa: ' + saved + ' guardados y ' + skipped + ' existentes conservados. Total procesado: ' + pending.length + '.';
    } catch(error) {
      inboxEl('inboxImportProgress').textContent='Carga interrumpida: ' + saved + ' guardados; ' + skipped + ' existentes. Podés reintentar el mismo archivo sin duplicar. ' + error.message;
    } finally { busy=false; commit.disabled=false; fileInput.disabled=false; }
  });
  inboxEl('inboxSearch').placeholder='🔎 Ej.: seguimiento, temperatura, patente o plataforma';
  inboxEl('inboxSearch').setAttribute('aria-description','Busca todas las palabras indicadas, separadas por espacios o comas, sin distinguir acentos.');
});


function inboxSheetRow(row, date) {
  const cell = text => '<div class="inbox-cell-preview">' + escapeHtml(text || '—') + '</div>';
  return '<tr><td><strong>' + cell(row.title) + '</strong></td><td>' + cell(row.notes) + '</td><td>' + escapeHtml(row.sector) + '</td><td><span class="pill">' + escapeHtml(row.status) + '</span><small>' + escapeHtml(row.destination || 'Por definir') + '</small></td><td>' + cell(row.source) + '</td><td>' + cell(row.reviewNotes) + '</td><td>' + (Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})) + '<small>' + escapeHtml(row.operator || '') + '</small></td><td><button type="button" data-inbox-detail="' + escapeHtml(row.id) + '">Ver ficha</button><button type="button" data-inbox-edit="' + escapeHtml(row.id) + '">Editar</button></td></tr>';
}
function inboxOpenDetail(id) {
  const row = inboxRows().find(item => item.id === id);
  if (!row) return;
  const href = inboxUrl(row.link);
  inboxEl('inboxDetailBody').innerHTML = '<h2>' + escapeHtml(row.title) + '</h2><p>' + escapeHtml(row.sector) + ' · ' + escapeHtml(row.status) + '</p><h3>Contenido original</h3><p class="inbox-detail-text">' + escapeHtml(row.notes || 'Sin contenido de texto.') + '</p><h3>Fuente</h3><p>' + escapeHtml(row.source || 'Sin fuente indicada') + '</p><h3>Notas de revisión</h3><p class="inbox-detail-text">' + escapeHtml(row.reviewNotes || 'Sin notas') + '</p>' + (href ? '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">Abrir material ↗</a>' : '');
  inboxEl('inboxDetail').showModal();
}
document.addEventListener('DOMContentLoaded', () => {
  const setView = view => {
    inboxState.view = view;
    inboxEl('inboxSheetView').setAttribute('aria-pressed', String(view === 'sheet'));
    inboxEl('inboxSummaryView').setAttribute('aria-pressed', String(view === 'summary'));
    inboxEl('novedades').classList.toggle('inbox-sheet', view === 'sheet');
    renderNovedades();
  };
  inboxEl('inboxSheetView').addEventListener('click', () => setView('sheet'));
  inboxEl('inboxSummaryView').addEventListener('click', () => setView('summary'));
  inboxEl('inboxExpand').addEventListener('click', () => {
    const expanded = inboxEl('novedades').classList.toggle('inbox-expanded');
    inboxEl('inboxExpand').textContent = expanded ? 'Mostrar formulario' : 'Ampliar tabla';
    inboxEl('inboxExpand').setAttribute('aria-expanded', String(expanded));
  });
  setView('sheet');
});

const inboxQuickState = { saving: false };
function inboxClassifyMessage(text, source = '') {
  const original = text.replace(/\r\n?/g, '\n').trim();
  if (!original || !/[\p{L}\p{N}]/u.test(original)) throw new Error('Pegá un mensaje con contenido.');
  if (original.length > 60000) throw new Error('El mensaje supera 60.000 caracteres. Dividilo en novedades más pequeñas.');
  const n = normalize(original);
  const safe = /\bsafe\b|\b(?:c0a|c0c|apv|acv|aps|acs|opd|opc)\b|cabina|carga verificable|\bchofer(?:es)?\b|\bpatente(?:s)?\b|desenganche|\bvehiculo(?:s)?\b|\bcamion(?:es)?\b|\bgps\b|\bavl\b|temperatur|seguimiento vehicular|objetivos? moviles?/.test(n);
  const fixed = /\b(?:e-?911|911)\b|objetivos? fijos?|\bdomicili|\btamper\b|\bpanel\b|bateria.*sensor|\balarmas? fijas?\b|\bsensores? de alarma\b/.test(n);
  // A comparison with fixed-alarm codes does not make a vehicle instruction cross-sector.
  const fixedComparison = /(?:reservad[oa]s?|son|para).*alarmas fijas/.test(n) && /cabina|\bc0a\b|\bc0c\b/.test(n);
  const both = safe && fixed && !fixedComparison;
  let sector = both ? 'Todos los sectores' : safe ? 'SAFE' : fixed ? 'Monitoreo 911' : 'Sin clasificar';
  const tags = [];
  const topics = [
    [/temperatur/, 'Temperatura'],
    [/\b(?:c0a|c0c|apv|acv|aps|acs|opd|opc)\b|puertas|cabina/, 'Puertas y códigos'],
    [/panico|asalto|emboscada/, 'Pánico y asalto'],
    [/sin reporte|no reporta|falta de (?:testeo|comunicacion)|comunicacion|gprs/, 'Comunicación y reportes'],
    [/\bvideo|tutorial|capacitacion/, 'Capacitación'],
    [/\bservice\b|servicio tecnico|mantenimiento|reparacion/, 'Servicio técnico'],
    [/contrase|\blogin\b|credencial|\busuario\b|\bacceso\b/, 'Accesos'],
    [/\batcl\b|factur|cobranza|presupuesto|baja del servicio/, 'ATCL'],
    [/certificad|asignacion/, 'Certificados y asignación'],
    [/bateria|220v|corte de luz/, 'Energía y batería'],
    [/seguimiento/, 'Seguimiento'],
    [/horario|\b\d{1,2}:\d{2}\b|\bcada \d+/, 'Horarios']
  ];
  topics.forEach(([pattern,label]) => { if (pattern.test(n)) tags.push(label); });
  if (sector === 'Sin clasificar' && tags.includes('Servicio técnico')) sector = 'Servicio técnico';
  const platform = /softguard/.test(n) ? 'SoftGuard' : /\bbykom\b/.test(n) ? 'Bykom' : '';
  const lines = original.split('\n').map(line => line.trim()).filter(Boolean);
  const exportedHeader = /^\[?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})(?:,\s*|\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?\]?\s*(?:[-–]\s*)?([^:\n]{1,70}):\s*(.*)$/i;
  let author = '', headerDate = '';
  const cleaned = lines.map(line => {
    const match = line.match(exportedHeader);
    if (match) {
      if (!author) { author = match[2].trim(); headerDate = match[1]; }
      return match[3];
    }
    return line;
  });
  const greeting = /^(?:hola|buen(?:os dias|as tardes|as noches| dia)|estimad[oa]s?|saludos|atte)[\s,.!:]*$/i;
  const mainLine = cleaned.find(line => line && !greeting.test(normalize(line)) && !/^https?:\/\//i.test(line)) || '';
  const excerpt = mainLine.replace(/^[*#_>\-\s]+/, '').replace(/\s+/g,' ').slice(0,110);
  const title = [platform, tags[0], excerpt].filter(Boolean).join(' — ').slice(0,180) || 'Material compartido por WhatsApp';
  const links = (original.match(/https?:\/\/[^\s<>"']+/gi) || []).map(link => inboxUrl(link.replace(/[.,;!?)\]}]+$/g,''))).filter(Boolean);
  let destination = 'Por definir';
  if (tags.includes('Accesos') || tags.includes('Capacitación') || links.length) destination = 'Recursos';
  else if (tags.includes('ATCL')) destination = 'Otro';
  else if (tags.length || sector !== 'Sin clasificar') destination = 'Procedimientos';
  const sourceText = source.trim() || (author ? 'WhatsApp · ' + author + (headerDate ? ' · ' + headerDate : '') : 'WhatsApp · autor y fecha no indicados');
  const review = [
    'Clasificación automática por palabras clave; pendiente de validación.',
    'Palabras clave: ' + ([platform, ...tags].filter(Boolean).join(', ') || 'sin identificar') + '.',
    sector === 'Sin clasificar' ? 'Sector sin determinar: revisar manualmente.' : 'Sector propuesto: ' + sector + '.',
    links.length ? 'Enlaces detectados: ' + links.join(' · ') : '',
    /\bc0a\b|\bc0c\b/.test(n) ? 'Se conservan los códigos C0A / C0C tal como fueron enviados; el carácter central es cero.' : '',
    'Confirmar vigencia antes de integrarlo como procedimiento.'
  ].filter(Boolean).join('\n');
  return {title, notes:original, link:links[0] || '', source:sourceText.slice(0,300), sector, status:'En revisión', destination, reviewNotes:review};
}
function inboxQuickPreview() {
  const preview = inboxEl('inboxQuickPreview');
  try {
    if (!inboxEl('inboxQuickText').value.trim()) { preview.textContent='El título, sector y destino se completan según el texto.'; return; }
    const fields = inboxClassifyMessage(inboxEl('inboxQuickText').value, inboxEl('inboxQuickSource').value);
    preview.textContent = fields.title + '\n' + fields.sector + ' · En revisión · ' + fields.destination;
  } catch(error) { preview.textContent = error.message; }
}
async function saveInboxQuick(event) {
  event.preventDefault();
  if (inboxQuickState.saving) return;
  const message = inboxEl('inboxQuickStatus');
  const session = getSession();
  const user = state.firebase.currentUser;
  if (!user || !session.active || !state.firebase.resourcesLoaded) {
    message.textContent='Esperá la conexión de la base central antes de cargar.'; return;
  }
  let fields;
  try { fields = inboxClassifyMessage(inboxEl('inboxQuickText').value, inboxEl('inboxQuickSource').value); }
  catch(error) { message.textContent=error.message; return; }
  inboxQuickState.saving=true;
  ['inboxQuickSave','inboxQuickText','inboxQuickSource'].forEach(id => inboxEl(id).disabled=true);
  message.textContent='Clasificando y guardando en la base central…';
  try {
    // Deterministic key keeps retries and concurrent submissions idempotent.
    const bytes = new TextEncoder().encode(fields.notes);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const id = 'wa-' + Array.from(new Uint8Array(digest),b => b.toString(16).padStart(2,'0')).join('');
    if (state.firebase.currentUser?.uid !== user.uid || !getSession().active) throw new Error('La sesión cambió. Volvé a ingresar antes de guardar.');
    const existing = inboxRows().find(row => row.notes?.replace(/\r\n?/g,'\n').trim() === fields.notes);
    const ref = resourceCollection().doc(existing?.id || id);
    const payload = inboxPayload(null,fields,session,new Date().toISOString(),ref.id);
    const created = await state.firebase.db.runTransaction(async tx => {
      const snapshot = await tx.get(ref);
      if (snapshot.exists) return false;
      tx.set(ref,payload);
      return true;
    });
    inboxEl('inboxSearch').value='';
    inboxEl('inboxSectorFilter').value='Todos los sectores';
    inboxEl('inboxFilter').value='Todos los estados';
    if (created) {
      inboxEl('inboxQuickText').value='';
      inboxQuickPreview();
      message.textContent='Novedad cargada: ' + fields.title + '. Sector: ' + fields.sector + '. Estado: En revisión. Podés corregirla desde Editar.';
    } else {
      message.textContent='Este mensaje ya está cargado. Se conservó la ficha existente sin duplicarla ni sobrescribirla.';
    }
    renderNovedades();
  } catch(error) {
    message.textContent='No se pudo guardar. El mensaje permanece para reintentar. ' + (error.code === 'permission-denied' ? 'Revisá los permisos de la base central.' : error.message || '');
  } finally {
    inboxQuickState.saving=false;
    ['inboxQuickSave','inboxQuickText','inboxQuickSource'].forEach(id => inboxEl(id).disabled=false);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  inboxEl('inboxQuickForm').addEventListener('submit',saveInboxQuick);
  ['inboxQuickText','inboxQuickSource'].forEach(id => inboxEl(id).addEventListener('input',inboxQuickPreview));
});
