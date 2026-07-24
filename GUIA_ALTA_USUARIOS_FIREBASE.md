# Alta de usuarios en Firebase

Usá la planilla `usuarios_vigilia_firebase.csv` como base.

## Opción recomendada: carga automática

Esta opción crea cada usuario en Firebase Authentication y también crea/actualiza su perfil en Firestore, en la colección `usuarios`.

### Paso 1: descargar clave privada de Firebase

1. Entrar a Firebase Console.
2. Ir a Configuración del proyecto.
3. Ir a Cuentas de servicio.
4. Generar nueva clave privada.
5. Guardar el archivo dentro de esta carpeta con el nombre:

```txt
serviceAccountKey.json
```

Importante: no subir `serviceAccountKey.json` a GitHub. Es una llave de administrador.

### Paso 2: instalar la herramienta

Abrir una terminal en la carpeta del proyecto y ejecutar:

```txt
npm install
```

### Paso 3: probar sin modificar Firebase

```txt
npm run usuarios:simular
```

### Paso 4: cargar usuarios reales

```txt
npm run usuarios:cargar
```

El proceso genera un archivo `usuarios_vigilia_resultado.csv` con el UID creado o encontrado para cada usuario.

### Si un usuario ya existe

Por defecto no se cambia su contraseña. Solo se actualiza el perfil, rol, nivel, sector, turno y estado activo.

Si necesitás resetear las contraseñas temporales de usuarios existentes:

```txt
node scripts/alta_usuarios_firebase.js --reset-passwords usuarios_vigilia_firebase.csv serviceAccountKey.json
```

## Opción manual

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
