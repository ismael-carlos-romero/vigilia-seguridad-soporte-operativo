# Manual Inteligente SoftGuard — plan técnico

## Arquitectura (reutiliza el portal)
- Vista `V.sg` registrada en `window.VIGILIA_VISTAS`; botón de sector «Manual SoftGuard» en `index.html`. No se tocan las vistas ni procedimientos existentes (`V.act`/`V.submit` se envuelven y delegan).
- Estado en `s.sg` (localStorage vía `S()/save()`), igual que el resto del prototipo. Producción: Firestore.
- Roles del portal: `op` (nivel 1), `sup` (8), `adm` (10).

## Datos
| Pieza | Archivo | Contenido |
|---|---|---|
| Manuales | `datos/softguard/<id>.js` | secciones `[num,título,pág]` + texto por página |
| Índice | `datos/softguard/indice.js` | manuales y versiones (nunca se borran) |
| Guías | `softguard-fichas.js` | 10 categorías y fichas; cada paso `{t,p,q}` = texto, página, cita literal |
| Casos / correcciones / procedimientos internos | `s.sg` | solo administración |

## Trazabilidad
`node softguard.test.cjs` verifica que cada cita exista en la página indicada, que cada «Botón» nombrado aparezca en esa página, que las fichas sin pasos sean `insuficiente` y apunten a un procedimiento MON-01 existente, y que las funciones restringidas tengan advertencia.

## Prioridad de fuentes (rotuladas en pantalla)
1. Manual oficial SoftGuard · 2. Procedimiento interno Vigilia · 3. Caso práctico validado. Sin cobertura: se informa y se puede avisar a supervisión; no se inventa.

## Seguridad
Solo consulta; no ejecuta nada en SoftGuard. Fichas de suspender/modificar (`procesar-varios`, `poner-en-prueba`, `evento-manual`, `horario-alternativo` → sup; `auto-monitoreo` → adm) muestran advertencia y bloquean los pasos al nivel inferior. En producción el control real va en reglas Firestore (el selector de rol es demo).

## Agregar un manual o versión
```
python3 scripts/indexar_softguard.py ARCHIVO.pdf --id <codigo-version> --codigo "TEC 167" --titulo "..." --version "..." [--actual]
```
Copiar el PDF a `prototipo/manuales/softguard/<id>.pdf` (habilita «Abrir PDF en p. N»), crear/ajustar fichas y correr el test. Se hace por script + commit (sitio estático).

## Firestore propuesto (producción)
`sgManuales` (lectura nivel ≥1, escritura 10), `sgPaginas` (ídem), `sgFichas` (ídem), `sgInternos`/`sgCasos` (escritura 10), `sgFeedback` (crear nivel ≥1, leer 8+). Alinear con `FIRESTORE_ACCESOS.md`.

## Límites
- Solo TEC 167 indexado; PDF no incluido en el repo.
- No documentados en TEC 167: TAM/ALR/NSR, falsas alarmas, fallas de comunicación, fallo de apertura/cierre (se muestra MON-01).
- Niveles por función: propuesta a confirmar.
