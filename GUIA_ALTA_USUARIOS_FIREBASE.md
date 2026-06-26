# Alta de usuarios en Firebase

Usá la planilla `usuarios_vigilia_firebase.csv` como base.

## Paso 1: crear usuario en Authentication

En Firebase Console:

1. Authentication.
2. Usuarios.
3. Agregar usuario.
4. Copiar `email`.
5. Copiar `password_temporal`.
6. Guardar.
7. Copiar el `UID` que genera Firebase.

## Paso 2: crear perfil en Firestore

En Firestore:

1. Colección: `usuarios`.
2. Documento: usar el `UID` del usuario creado en Authentication.
3. Agregar estos campos:

```txt
name: string
email: string
role: string
level: int64
sector: string
shift: string
active: boolean
```

Ejemplo:

```txt
name = Ismael Romero
email = ismael@vigilia.com
role = administrador
level = 10
sector = Monitoreo 911
shift = Noche
active = true
```

## Niveles sugeridos

- Nivel 3: operador.
- Nivel 6: técnica.
- Nivel 8: supervisor.
- Nivel 9: gerente.
- Nivel 10: administrador / dueño / CEO.

## Nota importante

Las contraseñas de la planilla son temporales. Si usás emails reales, después podés hacer recuperación de contraseña desde Firebase. Si usás emails internos tipo `@vigilia-operativo.local`, sirven para entrar, pero no para recuperar contraseña por correo.
