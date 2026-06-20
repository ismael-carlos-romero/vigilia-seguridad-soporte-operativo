# Seguridad y niveles de usuario

## 1. Activar login por email

En Firebase Console:

1. Ir a Authentication.
2. Entrar en Sign-in method.
3. Habilitar Email/Password.
4. Crear usuarios desde la pestaña Users.

## 2. Crear perfil de permisos

Cada usuario de Authentication tiene un UID. En Firestore crear la coleccion:

`usuarios`

Crear un documento por usuario usando como ID el UID de Authentication.

Ejemplo para administrador:

```json
{
  "name": "Ismael Romero",
  "email": "tu-email@ejemplo.com",
  "role": "administrador",
  "level": 10,
  "sector": "Monitoreo 911",
  "shift": "Noche",
  "station": "Estacion 1",
  "active": true
}
```

Niveles sugeridos:

- `10` Administrador: puede ver y administrar todo.
- `8` Supervisor: puede ver supervision, metricas, casos y eventos de todos.
- `5` Operador avanzado / encargado: puede operar y cargar eventos de su sector.
- `1` Operador: puede usar ingreso, manuales y cargar sus eventos.
- `0` Inactivo: no deberia operar.

## 3. Reglas de Firestore recomendadas

Pegar en Firestore > Reglas cuando ya esten creados tus usuarios.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function myProfile() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid));
    }

    function activeUser() {
      return signedIn()
        && myProfile().data.active == true
        && myProfile().data.level >= 1;
    }

    function supervisor() {
      return activeUser() && myProfile().data.level >= 8;
    }

    function admin() {
      return activeUser() && myProfile().data.level >= 10;
    }

    match /usuarios/{userId} {
      allow read: if signedIn() && (request.auth.uid == userId || supervisor());
      allow create, update, delete: if admin();
    }

    match /eventos_en_espera/{eventId} {
      allow create: if activeUser()
        && request.resource.data.operatorUid == request.auth.uid;

      allow read: if activeUser()
        && (resource.data.operatorUid == request.auth.uid || supervisor());

      allow update: if activeUser()
        && (
          resource.data.operatorUid == request.auth.uid
          || supervisor()
        );

      allow delete: if supervisor();
    }

    match /kanban_tareas/{taskId} {
      allow create: if activeUser()
        && request.resource.data.operatorUid == request.auth.uid;

      allow read: if activeUser()
        && (resource.data.operatorUid == request.auth.uid || supervisor());

      allow update: if activeUser()
        && (
          resource.data.operatorUid == request.auth.uid
          || supervisor()
        );

      allow delete: if supervisor();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 4. Orden recomendado

1. Crear el usuario administrador en Authentication.
2. Copiar su UID.
3. Crear `usuarios/{UID}` con `level: 10`.
4. Subir la web nueva a GitHub Pages.
5. Probar ingreso.
6. Recién ahi pegar reglas estrictas.

Si se pegan reglas estrictas antes de crear el perfil admin, nadie va a poder administrar usuarios desde la app.
