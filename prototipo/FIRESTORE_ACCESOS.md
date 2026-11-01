# Reglas de Firestore para Accesos (propuesta)

Agregar dentro de `match /databases/{database}/documents` en `firestore.rules`, usando las funciones que ya existen (`activeUser()`, `supervisor()`, `admin()`):

```
match /accesos_plataformas/{id} {
  allow read: if activeUser();
  allow create, update: if supervisor();
  allow delete: if admin();
}
match /accesos_registro/{id} {
  allow create: if activeUser() && request.resource.data.uid == request.auth.uid;
  allow read: if admin();
  allow update, delete: if false;
}
match /usuarios/{uid}/mis_accesos/{id} {
  allow read, write: if request.auth.uid == uid;
}
```

- Las claves nunca van en el repo ni en `data.js`.
- Cada "Copiar clave" escribe un documento en `accesos_registro` (quién, qué plataforma, cuándo).
- El administrador ve todo; supervisión carga y edita; el operador solo copia.
- Antes de usarlo: borrar `CONTRASEÑAS.xlsx` y cambiar las claves que estuvieron expuestas.
