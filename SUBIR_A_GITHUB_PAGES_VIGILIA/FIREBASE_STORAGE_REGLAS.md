# Reglas para Firebase Storage

Para que los archivos subidos desde Recursos se puedan abrir desde la web, entrá en Firebase Console:

1. Storage.
2. Reglas.
3. Pegá y publicá estas reglas:

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /recursos/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Con estas reglas, cualquier usuario logueado puede abrir recursos guardados y cada usuario solo puede subir en su propia carpeta.

Si un recurso anterior aparece como `Solo referencia`, volvé a subirlo después de publicar las reglas. Ese recurso viejo quedó guardado sin URL real para abrir.
