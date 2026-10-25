# Novedades — 25-10-26 0.1

La pestaña Novedades es la bandeja temporal de material recibido. Permite registrar texto original o un enlace, fuente, sector sugerido, estado, destino y notas de revisión. Incluye búsqueda, filtros y exportación CSV de la vista.

1. Cargar título y texto o enlace; dejar Sin clasificar y Pendiente de clasificar si aún no se conoce el destino.
2. Revisar el material conservando su fuente. Los enlaces a documentos o videos no se importan ni se interpretan automáticamente.
3. Clasificar y revisar con el responsable correspondiente.
4. Incorporar el material en la sección definitiva mediante el flujo habitual. Marcar Integrado únicamente indicando destino y referencia en las notas.

## Persistencia y acceso

Usa la colección autenticada existente `recursos_biblioteca`, con discriminador `recordKind: 'novedad'`. Se aprovechan sus reglas actuales sin cambiar permisos. `getResourceRows()` excluye estos registros para evitar presentarlos en la biblioteca o en tarjetas de equipo como material validado. No se publican datos del Sheet en el repositorio.

Los guardados esperan confirmación de Firestore. Si falla la conexión o los permisos, el formulario conserva su contenido y muestra el error; no se afirma que exista un respaldo local. Se mantiene el autor y fecha de carga, así como último editor y fecha. Una transacción rechaza cambios concurrentes para evitar sobrescribir revisiones ajenas. Los usuarios activos tienen el mismo acceso que a recursos; no cargar credenciales ni material que requiera un nivel de acceso diferente.

El botón de planilla de origen referencia la planilla Vigilia Seguridad. No hay sincronización automática con Sheets. El catálogo consultado contenía 9 filas cuyos enlaces eran marcadores `[link removed]`; no se presentan como documentos verificados.

## Validación

`node --check app.js`, `node --check novedades.js` y `node novedades.test.cjs`. El test verifica campos requeridos, protocolos de URL, integración con destino explícito, preservación de autor/fecha, aislamiento de sesión, exclusión de biblioteca y escape de fórmulas CSV.
