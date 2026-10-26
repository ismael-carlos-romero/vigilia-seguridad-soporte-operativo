// Novedades share the existing authenticated resource store, isolated by recordKind.
// They are never returned by getResourceRows(), nor used as approved procedures.
const inboxState = { editing: null, saving: false };
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
  inboxEl('inboxRows').innerHTML = rows.length ? rows.map(row => {
    const href = inboxUrl(row.link);
    const date = new Date(row.date);
    return `<tr><td>${Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}<small>${escapeHtml(row.operator || '')}</small></td>
      <td><strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.source || 'Sin fuente indicada')}</small><details><summary>Ver contenido</summary><p class="inbox-original">${escapeHtml(row.notes || 'Material referenciado por enlace.')}</p>${row.reviewNotes ? `<p class="inbox-original"><b>Revisión:</b> ${escapeHtml(row.reviewNotes)}</p>` : ''}${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Abrir material ↗</a>` : ''}</details></td>
      <td>${escapeHtml(row.sector)}</td><td><span class="pill">${escapeHtml(row.status)}</span><small>${escapeHtml(row.destination || 'Por definir')}</small></td>
      <td><button type="button" data-inbox-edit="${escapeHtml(row.id)}">Revisar / editar</button></td></tr>`;
  }).join('') : `<tr><td colspan="5">${all.length ? 'No hay novedades con estos filtros.' : connected ? 'Todavía no hay novedades. Cargá el primer material desde el formulario.' : 'Conectando con la base central…'}</td></tr>`;
  inboxEl('inboxRows').querySelectorAll('[data-inbox-edit]').forEach(button =>
    button.addEventListener('click', () => editInboxRow(button.dataset.inboxEdit)));
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
  inboxEl('inboxTitle').focus();
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
  const panel = document.createElement('section');
  panel.className = 'card';
  panel.innerHTML = '<h3>Importar bitácora clasificada</h3><p>Importá un archivo JSON clasificado. Conserva el texto original, sector, palabras clave y fuente. Se guarda en la base autenticada como material en revisión.</p><label for="inboxImportFile">Archivo clasificado (.json)</label><input id="inboxImportFile" type="file" accept=".json,application/json"><p id="inboxImportPreview" role="status"></p><button id="inboxImportCommit" type="button" disabled>Guardar registros en la base central</button><p id="inboxImportProgress" role="status"></p>';
  form.parentNode.insertBefore(panel, form);
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
