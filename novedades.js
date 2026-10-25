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
    (!query || normalize([row.title, row.notes, row.source, row.reviewNotes, row.operator, row.destination].join(' ')).includes(query)));
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
