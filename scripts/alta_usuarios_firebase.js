#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const resetPasswords = args.includes('--reset-passwords');
const positional = args.filter(arg => !arg.startsWith('--'));
const csvPath = positional[0] || 'usuarios_vigilia_firebase.csv';
const serviceAccountPath = positional[1] || 'serviceAccountKey.json';
let admin;

function usage() {
  console.log(`
Uso:
  node scripts/alta_usuarios_firebase.js [--dry-run] [--reset-passwords] usuarios_vigilia_firebase.csv serviceAccountKey.json

Opciones:
  --dry-run           Simula la carga sin crear ni modificar usuarios.
  --reset-passwords   Si el usuario ya existe, actualiza la contraseña temporal.

Columnas esperadas:
  nombre,email,password_temporal,role,level,sector,shift,active,notas
`);
}

if (args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

function readFileRequired(filePath, label) {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) {
    console.error(`No encontré ${label}: ${absolute}`);
    process.exit(1);
  }
  return { absolute, content: fs.readFileSync(absolute, 'utf8') };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      row.push(value);
      value = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some(cell => cell.trim() !== '')) rows.push(row);
      row = [];
      value = '';
      continue;
    }
    value += char;
  }

  row.push(value);
  if (row.some(cell => cell.trim() !== '')) rows.push(row);
  if (!rows.length) return [];

  const headers = rows.shift().map(header => header.trim());
  return rows.map(cells => Object.fromEntries(headers.map((header, index) => [header, (cells[index] || '').trim()])));
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toBool(value) {
  return ['true', 'verdadero', 'si', 'sí', '1', 'activo', 'activa'].includes(String(value).trim().toLowerCase());
}

function normalizeRole(role) {
  return String(role || 'operador').trim().toLowerCase();
}

function normalizeRow(row, index) {
  const email = String(row.email || '').trim().toLowerCase();
  const name = String(row.nombre || row.name || '').trim();
  const password = String(row.password_temporal || row.password || '').trim();
  if (!email) throw new Error(`Fila ${index + 2}: falta email.`);
  if (!name) throw new Error(`Fila ${index + 2}: falta nombre.`);
  if (!password || password.length < 6) throw new Error(`Fila ${index + 2}: falta password_temporal o tiene menos de 6 caracteres.`);

  return {
    name,
    email,
    password,
    role: normalizeRole(row.role),
    level: Number(row.level || 3),
    sector: String(row.sector || 'Monitoreo 911').trim(),
    shift: String(row.shift || 'Sin asignar').trim(),
    active: toBool(row.active),
    notas: String(row.notas || '').trim()
  };
}

async function findOrCreateUser(user) {
  if (dryRun) return { uid: `dry_${user.email.replace(/[^a-z0-9]/gi, '_')}`, authStatus: 'simulado_crear_o_actualizar' };
  try {
    const existing = await admin.auth().getUserByEmail(user.email);
    if (!dryRun && resetPasswords) {
      await admin.auth().updateUser(existing.uid, {
        displayName: user.name,
        password: user.password,
        disabled: !user.active
      });
    } else if (!dryRun) {
      await admin.auth().updateUser(existing.uid, {
        displayName: user.name,
        disabled: !user.active
      });
    }
    return { uid: existing.uid, authStatus: resetPasswords ? 'actualizado_con_password' : 'existente' };
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    if (dryRun) return { uid: `dry_${user.email.replace(/[^a-z0-9]/gi, '_')}`, authStatus: 'simulado_crear' };
    const created = await admin.auth().createUser({
      email: user.email,
      password: user.password,
      displayName: user.name,
      disabled: !user.active
    });
    return { uid: created.uid, authStatus: 'creado' };
  }
}

async function upsertProfile(uid, user) {
  const profile = {
    name: user.name,
    email: user.email,
    role: user.role,
    level: user.level,
    sector: user.sector,
    shift: user.shift,
    active: user.active,
    notas: user.notas,
    updatedAt: new Date().toISOString(),
    source: 'alta_usuarios_firebase'
  };

  if (!dryRun) {
    await admin.firestore().collection('usuarios').doc(uid).set(profile, { merge: true });
    await admin.auth().setCustomUserClaims(uid, {
      role: user.role,
      level: user.level,
      active: user.active
    });
  }
}

async function main() {
  const csv = readFileRequired(csvPath, 'la planilla CSV');
  const parsed = parseCsv(csv.content).map(normalizeRow);

  if (!parsed.length) {
    console.error('La planilla no tiene usuarios para cargar.');
    process.exit(1);
  }

  if (!dryRun) {
    try {
      admin = require('firebase-admin');
    } catch (error) {
      console.error('Falta instalar firebase-admin. Ejecutá primero: npm install');
      process.exit(1);
    }
    const serviceAccount = JSON.parse(readFileRequired(serviceAccountPath, 'la clave privada de Firebase').content);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.log('Modo simulacion: no se va a crear ni modificar nada en Firebase.');
  }

  const results = [];
  for (const user of parsed) {
    try {
      const { uid, authStatus } = await findOrCreateUser(user);
      await upsertProfile(uid, user);
      results.push({ uid, email: user.email, nombre: user.name, role: user.role, level: user.level, status: authStatus, password_temporal: user.password });
      console.log(`${authStatus}: ${user.email} -> ${uid}`);
    } catch (error) {
      results.push({ uid: '', email: user.email, nombre: user.name, role: user.role, level: user.level, status: `error: ${error.message}`, password_temporal: user.password });
      console.error(`ERROR ${user.email}: ${error.message}`);
    }
  }

  const outputPath = path.resolve('usuarios_vigilia_resultado.csv');
  const headers = ['nombre', 'email', 'password_temporal', 'role', 'level', 'uid', 'status'];
  const output = [
    headers.join(','),
    ...results.map(row => headers.map(header => csvEscape(row[header])).join(','))
  ].join('\n');
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`\nResultado guardado en: ${outputPath}`);
  if (dryRun) console.log('Cuando esté todo bien, ejecutá: npm run usuarios:cargar');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
