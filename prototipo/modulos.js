/* Menú "Más": procedimientos ISO MON-01, respuestas, aprendizajes, sugerencias, tablero, ATCL, recursos, métricas, novedades.
   Prototipo: guarda en el navegador (localStorage). En producción va a Firestore con las mismas reglas del portal. */
(function(){
const PROCS=[{"id":"contencion","category":"Alarmas 911","event":"Procedimiento de contención","code":"MON-01 5.1","priority":"Alta","trigger":"Se recibe una señal correspondiente a un evento de seguridad.","checks":["Realizar ronda inicial a teléfonos principales del abonado.","Presentarse como Vigilia Seguridad / La Central de Alarmas.","Validar palabra clave cuando atiende un referente.","Consultar la situación en el objetivo y si requiere servicio público de seguridad.","Si no se clarifica la situación o puede haber personas afectadas, informar para envío de fuerza pública y emergencias."],"action":"Verificar, contener y escalar según resultado. Si no hay contacto, dejar en espera y realizar nuevos intentos.","note":"Aplicado procedimiento de contención. Se verificaron teléfonos principales, palabra clave/situación y necesidad de servicio público según corresponda.","automation":"Convertir el evento en árbol guiado: contacto logrado, palabra clave, situación clara, requiere móvil, no contacta."},{"id":"panico","category":"Alarmas 911","event":"Señal de pánico / asalto","code":"MON-01 5.2","priority":"Crítica","trigger":"Ingresa señal de pánico o asalto.","checks":["Verificar historial para confirmar que no esté en falla.","Revisar si existe nota de pruebas cargada por operador o cliente.","Si no hay nota de prueba, verificar llamando al lugar mediante procedimiento de contención.","Informar a E-911 o servicio público con datos completos.","Luego de unos minutos, verificar novedades e ingresar nota en sistema."],"action":"Tratar como evento crítico. Informar a emergencia si corresponde y registrar novedades posteriores.","note":"Señal de pánico/asalto gestionada. Se verificó historial/notas, se aplicó contención y se informó a emergencia si correspondía.","automation":"Formulario de emergencia con campos obligatorios: dirección, referente, palabra clave, datos adicionales y hora de seguimiento."},{"id":"fuego","category":"Alarmas 911","event":"Señal de fuego","code":"MON-01 5.4","priority":"Crítica","trigger":"Ingresa señal de fuego.","checks":["Verificar historial y notas de prueba.","Llamar al lugar mediante procedimiento de contención.","Informar a emergencias policiales E-911 con datos completos e información adicional.","Verificar nuevamente luego de unos minutos.","Si está en falla, generar o reiterar orden de mantenimiento informando primero al cliente."],"action":"Gestionar como emergencia. Confirmar, escalar y documentar novedades.","note":"Señal de fuego gestionada. Se verificó historial/notas, se aplicó contención y se informó a emergencia si correspondía.","automation":"Checklist de datos para emergencia: ubicación, tipo de lugar, referente, cámaras, zonas afectadas."},{"id":"intrusion","category":"Alarmas 911","event":"Disparo de alarma / intrusión","code":"MON-01 5.6","priority":"Alta","trigger":"Ingresa señal de intrusión.","checks":["Verificar historial para confirmar que no esté en falla o con nota de prueba.","Si el sistema no fue desactivado, iniciar contención o verificación.","Si desactivan con código autorizado, grabar señal con nota Cancelado con Código Autorizado.","Si no fue desactivado, dar aviso a servicio público y emergencia con datos completos.","Si cuenta con acuda, avisar al servicio de respuesta.","Si hubo rotura del sistema, generar caso para visita técnica."],"action":"Diferenciar cancelado, evento real, acuda y rotura. Escalar solo cuando corresponde y dejar registro claro.","note":"Disparo de alarma gestionado. Se verificó historial/notas, desactivación, necesidad de contención, acuda y/o mantenimiento.","automation":"Árbol de decisión para evitar llamadas o escaladas innecesarias cuando hay cancelación válida."},{"id":"falsa-alarma","category":"Alarmas 911","event":"Falsa alarma para seguimiento","code":"MON-01 5.9","priority":"Media","trigger":"Se determina que el disparo entra en categoría de falsa alarma.","checks":["Realizar el procedimiento habitual.","Generar orden de mantenimiento si corresponde.","Registrar en gestión operativa la condición particular.","Clasificar como cancelada, climática, error de usuario o falla de sistema."],"action":"Cerrar con categoría correcta para medir causas repetidas y generar mantenimiento cuando haga falta.","note":"Evento clasificado como falsa alarma para seguimiento. Categoría: cancelada / climática / error de usuario / falla de sistema.","automation":"Dashboard Pareto de falsas alarmas por causa para detectar el 20% que genera más trabajo."},{"id":"corte-220","category":"Técnica / Energía","event":"Corte de luz / falta 220V","code":"MON-01 5.10","priority":"Media","trigger":"El evento se presenta como FALTA DE 220 VOLTS / CORTE DE LUZ.","checks":["Dar aviso inmediato por canales telefónicos, SMS o WhatsApp según corresponda.","Si la cuenta tiene aviso por SMS, verificar en MSG del historial si el aviso fue enviado.","Si el SMS fue enviado correctamente, no es necesario llamar al cliente.","Cedular el evento con la descripción Se verificó envío de SMS."],"action":"Primero verificar si el aviso automático ya salió. Evitar llamada innecesaria cuando el SMS fue enviado correctamente.","note":"Corte 220 gestionado. Se verificó MSG/historial y envío de SMS. Si correspondía, no se realizó llamada telefónica.","automation":"Automatizar verificación de aviso enviado y registrar cierre sugerido sin llamada manual."},{"id":"bateria-panel","category":"Técnica / Energía","event":"Batería baja de panel","code":"MON-01 5.11","priority":"Media","trigger":"Ingresa señal de batería baja del panel.","checks":["Verificar historial para ver si hubo corte de luz previo.","Si hubo corte, contactar al titular para confirmar razón e informar uso de batería auxiliar.","Si no hubo corte previo, dejar en espera un tiempo razonable para ver si restaura.","Si no restaura, generar orden de mantenimiento para revisar batería."],"action":"Relacionar batería baja con corte de luz antes de generar mantenimiento.","note":"Batería baja panel gestionada. Se verificó historial de corte 220 y se definió espera/contacto/mantenimiento según evolución.","automation":"Regla automática: si batería baja aparece luego de corte 220, sugerir espera y mensaje informativo."},{"id":"bateria-sensor","category":"Técnica / Energía","event":"Batería baja de zona o sensor","code":"MON-01 5.12","priority":"Media","trigger":"Ingresa señal de batería baja de zona o sensor.","checks":["Enviar aviso indicando que debe cambiar la batería del sensor.","Indicar que luego debe comunicarse con central para poner la cuenta en prueba.","Luego procesar la señal.","Si ingresa durante turno noche, de 22 a 7, dejar en espera para que abra pantalla a partir de las 07:00."],"action":"No interrumpir de madrugada salvo necesidad crítica. Dejar en espera nocturna y abrir seguimiento a las 07:00.","note":"Batería baja de sensor gestionada. Se informó cambio de batería y prueba posterior, o se dejó en espera hasta 07:00 si ingresó en turno noche.","automation":"Aviso programado por horario y recordatorio automático a las 07:00."},{"id":"linea-telefonica","category":"Comunicación","event":"Falla de comunicación por línea telefónica","code":"MON-01 5.13","priority":"Media","trigger":"Se presenta falla de comunicación de línea telefónica.","checks":["Analizar historial de la cuenta y notas anteriores sobre problemas de línea.","Informar al titular que verifique su línea.","Si no presenta falla, solicitar señal desde teclado para verificar recepción y restaurar vínculo.","Si la señal no llega y el cliente no tiene problema de línea, generar mantenimiento.","Informar que momentáneamente estará sin monitoreo hasta solucionar el problema."],"action":"Distinguir problema externo de línea, prueba recibida y necesidad real de mantenimiento.","note":"Falla de comunicación línea gestionada. Se revisó historial/notas, se solicitó prueba y se informó estado de monitoreo/mantenimiento.","automation":"Plantilla de contacto y cierre con opción Re-Activar cuando el cliente confirma problema de línea."},{"id":"gprs","category":"Comunicación","event":"Falla de comunicación GPRS","code":"MON-01 5.14","priority":"Media","trigger":"Se recibe falla de comunicación GPRS.","checks":["Analizar historial de la cuenta.","Transcurrida 1 hora desde la última señal de test, verificar si el equipo continúa en falla.","Si no restaura, informar telefónicamente al cliente y solicitar pruebas.","Si las pruebas llegan por GPRS, cedular como falla de comunicación.","Si no llegan, informar que estará sin monitoreo y analizar posible caída del prestador o mantenimiento.","Verificar si cuenta con vínculo alternativo e informar estado."],"action":"Esperar el plazo indicado, comprobar restauración y recién después contactar o derivar.","note":"Falla GPRS gestionada. Se verificó historial, espera de 1 hora, pruebas, vínculo alternativo y necesidad de mantenimiento.","automation":"Temporizador automático de 1 hora y agrupación de fallas por prestador Claro/Movistar."},{"id":"ip","category":"Comunicación","event":"Falla de comunicación IP","code":"MON-01 5.15","priority":"Media","trigger":"Se recibe falla de comunicación IP.","checks":["Contactar inmediatamente al cliente para verificar funcionamiento de internet.","Si internet no funciona, indicar reinicio de router.","Si no restaura o el cliente está sin servicio, informar que estará sin monitoreo hasta solucionar internet.","Si internet funciona y aun así no se reciben señales, generar mantenimiento.","Si no se contacta a referente, dejar en espera 1 hora y luego hacer nueva ronda."],"action":"Separar falla del servicio de internet de falla propia del sistema.","note":"Falla IP gestionada. Se verificó internet/router, estado de monitoreo y necesidad de mantenimiento.","automation":"Guía de preguntas para detectar proveedor caído vs falla de comunicador."},{"id":"agenda-comunicacion","category":"Comunicación","event":"Agenda para seguimiento de fallas de comunicación","code":"MON-01 5.16","priority":"Media","trigger":"Cliente queda sin monitoreo por tema propio o el caso se deriva a otra área.","checks":["Generar agenda en sistema de monitoreo para seguimiento.","Realizar seguimiento mensual hasta el tercer mes.","Luego del tercer mes, realizar control trimestral.","Contactar al cliente desde el recordatorio para verificar persistencia.","Si no se contacta, hacer nuevos intentos y enviar mail.","Consultar estado de gestiones derivadas a otras áreas mediante caso administrativo."],"action":"Transformar fallas persistentes en seguimiento programado, no en memoria del operador.","note":"Agenda de falla de comunicación generada o revisada. Se registró seguimiento mensual/trimestral y estado de gestiones derivadas.","automation":"Kanban o agenda automática con vencimientos por cuenta y área responsable."},{"id":"fuera-horario","category":"Control horario","event":"Desactivación fuera de horario o usuario no autorizado","code":"MON-01 5.17","priority":"Alta","trigger":"Alarma reporta desactivación fuera del día/horario de control horario o por usuario no autorizado.","checks":["Comunicar con titular de la cuenta a teléfonos alternativos.","Informar lo sucedido.","Si el cliente lo considera necesario, enviar móvil policial al lugar."],"action":"Avisar al titular y dejar que confirme si requiere móvil.","note":"Desactivación fuera de horario/usuario no autorizado informada al titular. Se consultó necesidad de móvil.","automation":"Alerta por horario con contacto sugerido y registro de decisión del titular."},{"id":"apertura","category":"Control horario","event":"Fallo de apertura","code":"MON-01 5.18","priority":"Media","trigger":"Cliente con control horario no desactiva en horario acordado más tolerancia.","checks":["Confirmar que el cliente cuenta con control horario.","Verificar horario acordado y tolerancia.","Dar aviso al titular o encargado a teléfonos alternativos registrados."],"action":"Notificar falta de apertura según control horario.","note":"Fallo de apertura gestionado. Se verificó control horario/tolerancia y se avisó a titular o encargado.","automation":"Aviso automático tras tolerancia configurable por cuenta."},{"id":"cierre","category":"Control horario","event":"Fallo de cierre","code":"MON-01 5.19","priority":"Media","trigger":"Cliente con control horario no activa en horario acordado.","checks":["Confirmar que el cliente cuenta con control horario.","Verificar horario previamente acordado.","Dar aviso al titular o encargado a teléfonos alternativos registrados."],"action":"Notificar falta de cierre para evitar objetivo sin alarma activada.","note":"Fallo de cierre gestionado. Se verificó control horario y se avisó a titular o encargado.","automation":"Mensaje automático a encargado cuando vence horario de cierre."},{"id":"enlace","category":"Técnica / Sistema","event":"Falla de enlace","code":"MON-01 5.20","priority":"Media","trigger":"Se recibe señal de falla de enlace.","checks":["Revisar historial para ver si ocurrió antes.","Si no ocurrió, contactar al cliente e indicar pasos para reiniciar el sistema de alarma.","Si está asociada a batería baja de sensor, recomendar cambio de batería.","Si requiere asistencia, gestionar mantenimiento técnico.","Si persiste luego de reiniciar y no está asociada a batería baja, gestionar mantenimiento.","Si no se logra comunicación, cedular como falsa alarma - falla de sistema generando pedido técnico."],"action":"Resolver por reinicio o batería cuando sea posible; derivar a técnico si persiste.","note":"Falla de enlace gestionada. Se revisó historial, batería de sensor, reinicio y necesidad de mantenimiento.","automation":"Asistente que cruza falla de enlace con batería baja previa."},{"id":"llamadas","category":"Atención","event":"Atención de llamadas entrantes","code":"MON-01 5.21","priority":"Media","trigger":"Ingresa una llamada entrante a central.","checks":["Presentarse mencionando sector o empresa.","Saludar según horario.","Identificarse con nombre.","Solicitar nombre del interlocutor.","Validar cliente con doble factor: palabra clave más dato adicional.","Usar DNI, teléfonos alternativos, contactos o relación con titular como dato adicional."],"action":"Estandarizar atención y validación antes de brindar información o ejecutar cambios.","note":"Llamada entrante atendida con presentación, identificación y doble factor de autenticación.","automation":"Guion corto de llamada y validación obligatoria antes de cambios sensibles."},{"id":"mantenimiento","category":"Técnica / Sistema","event":"Orden de mantenimiento","code":"MON-01 5.23","priority":"Media","trigger":"Se necesita generar caso para visita técnica.","checks":["Crear señal manual en sistema de monitoreo.","Registrar motivo del mantenimiento.","Generar evento con nombre MANTENIMIENTO GENERADO en Bykom.","Dejarlo disponible para recepción por Servicio Técnico."],"action":"Estandarizar la carga para que técnica reciba el caso con motivo claro.","note":"Mantenimiento generado en Bykom con motivo registrado para recepción por Servicio Técnico.","automation":"Formulario único de pedido técnico con motivo, origen del evento y prioridad."},{"id":"panel-prueba","category":"Técnica / Sistema","event":"Panel en prueba","code":"MON-01 5.24","priority":"Media","trigger":"Técnico o cliente solicita poner panel en prueba.","checks":["Si lo pide un técnico, verificar cuenta y dirección.","Agregar nombre y apellido del técnico.","Si lo pide el cliente, chequear como pedido técnico y sumar palabra clave u otro dato referente a la cuenta."],"action":"Validar identidad antes de poner panel en prueba.","note":"Panel en prueba gestionado. Se verificó cuenta, dirección e identidad del técnico/cliente.","automation":"Pantalla de validación para evitar pruebas mal cargadas."},{"id":"video","category":"Video","event":"Video verificación","code":"MON-01 5.25","priority":"Alta","trigger":"Evento de seguridad en cuenta con servicio de video verificación contratado.","checks":["Antes de iniciar contención, verificar si la cuenta tiene video verificación.","Acceder por SMART PSS al sistema de cámaras del objetivo.","Visualizar cámaras para confirmar visualmente el evento.","Si confirma visualmente, iniciar solicitud de servicio público o E-911 con datos completos.","Si no confirma visualmente, iniciar procedimiento inicial de contención."],"action":"Usar cámaras como filtro antes de escalar o como respaldo para emergencia.","note":"Video verificación aplicada. Se revisaron cámaras y se confirmó/no confirmó visualmente el evento antes de definir acción.","automation":"Botón de checklist visual: confirma, no confirma, cámara inaccesible, escalar, contención."},{"id":"directivas","category":"Directivas","event":"Procedimientos particulares / notas temporales","code":"MON-01 5.26","priority":"Media","trigger":"Cliente solicita requerimiento particular o temporal.","checks":["Registrar NOTA TEMPORAL con el requerimiento.","Definir días determinados de vigencia.","Informar al cliente que el pedido se mantendrá por esa cantidad de días.","Indicar que debe comunicarse nuevamente antes del vencimiento si quiere continuar.","Si hay problema de zona, generar mantenimiento y ofrecer instrucción para anular zona manualmente hasta el service."],"action":"Evitar instrucciones indefinidas o perdidas. Toda excepción debe tener vigencia y responsable.","note":"Procedimiento particular registrado con nota temporal, vigencia y comunicación al cliente.","automation":"Directivas con fecha de vencimiento, alerta de renovación y búsqueda por cliente/palabra clave."}];
const DIRS=[{"id":"kike-atcl-2026-07-16","date":"2026-07-16T15:34:00-03:00","title":"Pedidos de clientes por ATCL y registro escrito","source":"Kike / Reunión jueves 16-07-2026","sector":"Todos los sectores","text":"Todo pedido de cliente debe quedar cargado mediante ATCL. Si se requiere hablar con Técnica, hacerlo por WhatsApp y dejar registro. No realizar pedidos verbales o presenciales a Cristian, porque después no queda trazabilidad y puede no ejecutarse lo solicitado por el cliente."},{"id":"kike-choferes-2026-07-16","date":"2026-07-16T15:39:00-03:00","title":"Base de choferes y transportistas por hojas de ruta","source":"Kike / Reunión jueves 16-07-2026","sector":"SAFE / Objetivos Móviles","text":"Armar una base de datos de los choferes y transportistas que llegan por mail con hojas de ruta, para poder buscarlos por empresa, chofer, teléfono, dominio, unidad o recorrido."}];
const RESP=[
 ["Confirmación de recepción y monitoreo","SAFE / Objetivos Móviles","WhatsApp","recepción, monitoreo","Buenas tardes.\nSe confirma recepción y monitoreo.\nAtte."],
 ["Confirmación de asignación con certificado","SAFE / Objetivos Móviles","WhatsApp","asignación, certificado","Buen día.\nSe confirma asignación de la unidad solicitada y se adjunta el certificado correspondiente.\nAtte."],
 ["Resultados de auditoría","SAFE / Objetivos Móviles","WhatsApp","auditoría","Buen día.\nSe adjuntan resultados de auditoría.\nAtte."],
 ["Alta temperatura","SAFE / Objetivos Móviles","WhatsApp","temperatura","Se informa que registramos alta temperatura.\nAtte."],
 ["Baja temperatura","SAFE / Objetivos Móviles","WhatsApp","temperatura","Se informa que registramos baja temperatura.\nAtte."],
 ["Temperatura sin contacto con el chofer","SAFE / Objetivos Móviles","WhatsApp","temperatura, chofer","Se informa que registramos alta temperatura, no hemos logrado contactar con el chofer por lo tanto hemos dejado mensajes de voz.\nAtte."],
 ["Unidad sin servicios de la estación (autogestión)","SAFE / Objetivos Móviles","WhatsApp","autogestión","Estimados,\nLa unidad no cuenta con los servicios de la estación de monitoreo. Tiene los servicios de autogestión, así que el cliente deberá proveerse de la información que necesite.\nAtte."],
 ["Unidad no está en la base de datos","SAFE / Objetivos Móviles","WhatsApp","base de datos","Buenas noches.\nLa unidad solicitada no se encuentra en nuestra base de datos.\nAtte."],
 ["Sin reporte del dominio (aviso informativo)","SAFE / Objetivos Móviles","WhatsApp","sin reporte, dominio","Estimado Cliente, lo contactamos de VIGILIA SEGURIDAD para informarle que, debido a que no logramos comunicación telefónica, le comunicamos por este medio que no estamos recibiendo reporte del dominio [patente]. Por favor confirmar si está trabajando o guardado. Para más información comuníquese telefónicamente al [teléfono de la central]. Muchas gracias. Mensaje a modo informativo."],
 ["Desconexión de batería de la unidad","SAFE / Objetivos Móviles","WhatsApp","batería, desconexión","Estimado Cliente, lo contactamos del Satelital VIGILIA para informar por este medio una DESCONEXIÓN DE BATERÍA de la unidad [patente]. Mensaje a modo informativo."],
 ["Cliente no responde: dejé aviso por todos los medios","SAFE / Objetivos Móviles","Bykom / nota","no responde","No responde, dejé mensaje de voz, envié mail y consulté por WhatsApp."],
 ["Service generado","SAFE / Objetivos Móviles","WhatsApp","service","Buen día, se generó service a [patente] [cliente]."],
 ["Nota agregada a la unidad","SAFE / Objetivos Móviles","WhatsApp","nota","Buen día, se agregó nota a [patente] [cliente]."],
 ["Confirmación de señales de pánico, apertura y desenganche","SAFE / Objetivos Móviles","WhatsApp","pánico, apertura, desenganche","Te confirmo señales de pánico, apertura y desenganche de la unidad [patente]."],
 ["Envío de comandos para restablecer la señal","SAFE / Objetivos Móviles","WhatsApp","comandos, señal","Buenas noches.\nSe envían los comandos para restablecer la señal de la unidad solicitada."],
 ["Reclamo por mail de suspensión sin deuda (ATCL)","Supervisión","Interno","ATCL, administración","Se generó ATCL a [cliente] [patente] porque recibió un mail informando la suspensión del servicio por falta de pago a pesar de no tener deuda."],
 ["Vías de reclamo para visualizar la unidad","SAFE / Objetivos Móviles","WhatsApp","reclamo, visualización","Estimados,\nInformamos que las vías de comunicación para efectuar el reclamo por la visualización de la unidad son telefónicas, al [teléfono de la central], opción Atención al Cliente o Soporte Técnico. Nuestro horario comercial es de lunes a viernes de 08 a 17 horas."]
].map((r,i)=>({id:"r"+i,title:r[0],sector:r[1],channel:r[2],tags:r[3],text:r[4],base:true}));

/* los procedimientos ISO entran al buscador principal; reemplazan a los borradores equivalentes */
const DUP=new Set(["prot-01","prot-04","prot-05","prot-07","prot-08","prot-10","prot-11","prot-12","prot-13","prot-14","prot-15","prot-16"]);
const X=window.VIGILIA_EXTRA=window.VIGILIA_EXTRA||{cases:[]};
X.cases=X.cases.filter(c=>!DUP.has(c.id)).concat(PROCS.map(p=>({
  id:"iso-"+p.id,sector:"fijo",system:"Procedimientos MON-01",issue:p.event,code:"",causes:"",question:"",
  action:p.checks.map((c,i)=>(i+1)+") "+c).join(" "),video:"",manualPage:p.code,
  backup:"Cuándo aplica: "+p.trigger+" "+p.action+(p.note?" Nota modelo para el sistema: "+p.note:""),
  confidence:"ALTA",decision:p.priority==="Crítica"?"Técnico prioritario":"Resolver desde estación",
  commandHint:(p.category+" "+p.event).toLowerCase()+" procedimiento norma iso"})));
window.VIGILIA_NONPANEL=(window.VIGILIA_NONPANEL||[]).concat(["Procedimientos MON-01"]);
window.VIGILIA_MODULOS={procs:PROCS,respuestas:RESP,directivas:DIRS};

/* ---------- vistas ---------- */
const V=window.VIGILIA_VISTAS={};
const st2={rs:"Todos",rq:""};
const style=document.createElement("style");
style.textContent=`
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;align-items:start}
.col{background:var(--bg2);border:1px solid var(--line);border-radius:14px;padding:12px;display:grid;gap:10px}
.col h3{margin:0;font-size:16px;color:var(--mu)}
.kc{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;display:grid;gap:6px}
.kc p{margin:0;color:var(--mu);font-size:15px}
.kc .acts,.item .acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.item{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;display:grid;gap:8px}
.item h3{margin:0;font-size:19px}.item p{margin:0}
.item .meta{color:var(--mu);font-size:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.item textarea{width:100%;min-height:96px;background:var(--bg);color:var(--tx);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit}
.stack{display:grid;gap:12px}
.bar{height:10px;border-radius:5px;background:var(--pri);min-width:4px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}.kpi b{display:block;font-size:30px}.kpi span{color:var(--mu);font-size:14px}
.brow{display:grid;grid-template-columns:minmax(120px,1fr) 2fr 40px;gap:10px;align-items:center;font-size:15px}
`;
document.head.appendChild(style);

const TILES=[
 ["procs","Procedimientos","Normas MON-01 documentadas por supervisión"],
 ["resp","Respuestas","Mensajes listos para copiar y pegar en WhatsApp"],
 ["learn","Aprendizajes","Lo que no pudiste resolver, para que supervisión lo valide"],
 ["sugg","Sugerencias","Ideas para mejorar el sistema"],
 ["kanban","Tablero","Tareas por hacer, en espera, supervisión y resueltas"],
 ["atcl","Pedidos ATCL","Seguimiento de pedidos de clientes"],
 ["recu","Recursos","Manuales, videos y links de apoyo"],
 ["metr","Métricas","Consultas, resueltas y pendientes"],
 ["inbox","Novedades y material pendiente","Pegá lo que manda supervisión por WhatsApp y cargalo como proceso nuevo"],
 ["nov","Avisos y directivas","Historial de avisos y directivas"],
 ["acc","Accesos","Usuarios y claves de las plataformas (solo empleados)"]];
const TITLE=Object.fromEntries(TILES.map(t=>[t[0],t[1]]));
const crumb=(m)=>`<div class="crumbs"><button data-act="home">Inicio</button><span>›</span><button data-act="mas">Más</button><span>›</span><span class="cur">${TITLE[m]}</span></div>`;
const arr=(s,k)=>s[k]||(s[k]=[]);
const when=t=>new Date(t).toLocaleString("es-AR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const field=(l,h)=>`<label>${l}${h}</label>`;
const KCOLS=[["por","Por hacer"],["espera","En espera"],["sup","Supervisión"],["ok","Resuelto"]];

V.mas=(v,c)=>{ v.innerHTML=`<div class="step"><div class="crumbs"><button data-act="home">Inicio</button><span>›</span><span class="cur">Más</span></div>
 <p class="q">Más herramientas</p><p class="sub">Lo que no hace falta en el momento de atender una consulta.</p>
 <div class="tiles">${TILES.map(t=>`<button class="pick" data-act="${t[0]}"><b>${t[1]}</b><span>${t[2]}</span></button>`).join("")}</div></div>`; };

V.procs=(v,c)=>{
 const g={}; PROCS.forEach(p=>(g[p.category]=g[p.category]||[]).push(p));
 v.innerHTML=`<div class="step">${crumb("procs")}<p class="q">Procedimientos</p>
 <p class="sub">Norma MON-01, documentada por supervisión. Tocá uno para ver el paso a paso. También aparecen en el buscador.</p>
 ${Object.entries(g).map(([k,l])=>`<section class="sec"><h2>${c.esc(k)}</h2><div class="grid">${l.map(p=>`<button class="pick" data-act="open" data-id="iso-${p.id}"><b>${c.esc(p.event)}</b><span>${c.esc(p.code)} · prioridad ${c.esc(p.priority.toLowerCase())}</span></button>`).join("")}</div></section>`).join("")}</div>`; };

V.resp=(v,c)=>{
 const s=c.S(), mine=arr(s,"resp"), all=RESP.concat(mine);
 const secs=["Todos","Monitoreo 911","SAFE / Objetivos Móviles","Supervisión"];
 const q=c.norm(st2.rq);
 const list=all.filter(r=>(st2.rs==="Todos"||r.sector===st2.rs||r.sector==="Todos los sectores")&&(!q||c.norm(r.title+" "+r.tags+" "+r.text).includes(q)));
 v.innerHTML=`<div class="step">${crumb("resp")}<p class="q">Respuestas</p>
 <p class="sub">Elegí el mensaje, completá lo que está entre [corchetes], copiá y pegalo en WhatsApp Web.</p>
 <div class="row" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><div class="chips">${secs.map(x=>`<button class="chip" data-act="rsec" data-v="${c.esc(x)}" aria-pressed="${st2.rs===x}" style="${st2.rs===x?"border-color:var(--pri)":""}">${x}</button>`).join("")}</div>
  <input id="rq" placeholder="Buscar mensaje" value="${c.esc(st2.rq)}" style="flex:1;min-width:180px;height:44px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--tx);padding:0 12px"></div>
 <div class="stack" style="margin-top:14px">${list.map(r=>`<article class="item"><h3>${c.esc(r.title)}</h3><div class="meta"><span class="tag">${c.esc(r.channel)}</span><span>${c.esc(r.sector)}</span>${r.base?"":`<span class="tag warn">Propuesta${r.by?" de "+c.esc(r.by):""}</span>`}</div>
   <textarea id="t-${r.id}" aria-label="Texto de ${c.esc(r.title)}">${c.esc(r.text)}</textarea>
   <div class="acts"><button class="btn sm" data-act="rcopy" data-id="${r.id}">Copiar mensaje</button></div></article>`).join("")||`<div class="empty">No hay mensajes con ese filtro.</div>`}</div>
 <form class="card form" data-vform="resp" style="margin-top:18px"><h3>Proponer un mensaje nuevo</h3>
  ${field("Título",`<input name="title" required maxlength="80">`)}
  ${field("Sector",`<select name="sector"><option>Monitoreo 911</option><option>SAFE / Objetivos Móviles</option><option>Supervisión</option></select>`)}
  ${field("Canal",`<select name="channel"><option>WhatsApp</option><option>Email</option><option>Bykom / nota</option><option>Interno</option></select>`)}
  ${field("Mensaje",`<textarea name="text" required maxlength="800" placeholder="Usá [patente], [cliente] o [hora] donde cambia el dato"></textarea>`)}
  <button class="btn" type="submit">Guardar</button></form></div>`;
 const i=v.querySelector("#rq"); i.addEventListener("input",()=>{ st2.rq=i.value; const p=i.selectionStart; V.resp(v,c); const n=v.querySelector("#rq"); n.focus(); n.setSelectionRange(p,p); }); };

V.learn=(v,c)=>{
 const s=c.S(), L=arr(s,"learn").slice().reverse(), sup=c.st.role!=="op";
 v.innerHTML=`<div class="step">${crumb("learn")}<p class="q">Aprendizajes</p>
 <p class="sub">Casos que no pudiste resolver. Supervisión responde y, si sirve para todos, lo convierte en procedimiento. Lo que escalás desde una guía aparece acá solo.</p>
 <form class="card form" data-vform="learn"><h3>Registrar un caso sin resolver</h3>
  ${field("Consulta del cliente",`<input name="q" required maxlength="120" placeholder="Ej.: cambiar zona en un panel nuevo">`)}
  ${field("Qué pasó o qué no pude resolver",`<textarea name="text" required maxlength="500"></textarea>`)}
  ${field("Sector",`<select name="sector"><option>Objetivo Fijo 911</option><option>Objetivos Móviles SAFE</option></select>`)}
  <button class="btn" type="submit">Enviar a supervisión</button></form>
 <div class="stack" style="margin-top:16px">${L.map(x=>`<article class="item"><h3>${c.esc(x.q)}</h3>
  <div class="meta"><span class="tag ${x.st==="Pendiente"?"warn":"ok"}">${c.esc(x.st)}</span><span>${c.esc(x.sector||"")}</span><span>${when(x.at)}</span></div>
  <p style="white-space:pre-line">${c.esc(x.text)}</p>
  ${x.ans?`<div class="note"><h3>Respuesta de supervisión</h3><p style="white-space:pre-line">${c.esc(x.ans)}</p></div>`:""}
  ${sup&&x.st!=="Procedimiento"?`<form data-vform="lans" data-id="${x.id}" class="acts" style="align-items:stretch"><textarea name="ans" required placeholder="Respuesta o criterio" style="flex:1;min-width:220px;min-height:64px">${c.esc(x.ans||"")}</textarea>
   <button class="btn sm" type="submit" name="to" value="Respondido">Responder</button><button class="btn sm ok" type="submit" name="to" value="Procedimiento">Validar como procedimiento</button></form>`:""}
  </article>`).join("")||`<div class="empty">Todavía no hay casos cargados.</div>`}</div></div>`; };

V.sugg=(v,c)=>{
 const s=c.S(), L=arr(s,"sugg").slice().sort((a,b)=>b.v-a.v||b.at-a.at), sup=c.st.role!=="op";
 v.innerHTML=`<div class="step">${crumb("sugg")}<p class="q">Sugerencias</p><p class="sub">Contá qué mejorarías del sistema o de cómo trabajamos. Los demás pueden sumar su apoyo.</p>
 <form class="card form" data-vform="sugg"><h3>Nueva sugerencia</h3>${field("Qué proponés",`<textarea name="text" required maxlength="400"></textarea>`)}<button class="btn" type="submit">Enviar</button></form>
 <div class="stack" style="margin-top:16px">${L.map(x=>`<article class="item"><p style="white-space:pre-line">${c.esc(x.text)}</p><div class="meta"><span>${when(x.at)}</span>${x.ok?`<span class="tag ok">Aceptada</span>`:""}</div>
  <div class="acts"><button class="btn ghost sm" data-act="svote" data-id="${x.id}">Apoyo (${x.v})</button>${sup&&!x.ok?`<button class="btn sm" data-act="sok" data-id="${x.id}">Marcar como aceptada</button>`:""}</div></article>`).join("")||`<div class="empty">Todavía no hay sugerencias.</div>`}</div></div>`; };

V.kanban=(v,c)=>{
 const K=arr(c.S(),"kanban");
 v.innerHTML=`<div class="step">${crumb("kanban")}<p class="q">Tablero</p><p class="sub">Tareas y eventos pendientes del turno. Movelos con las flechas.</p>
 <form class="card form" data-vform="kanban"><h3>Nueva tarea</h3>${field("Título",`<input name="title" required maxlength="80">`)}${field("Detalle",`<textarea name="text" maxlength="300"></textarea>`)}<button class="btn" type="submit">Agregar</button></form>
 <div class="cols" style="margin-top:16px">${KCOLS.map(([k,l],ci)=>`<section class="col"><h3>${l} (${K.filter(x=>x.c===k).length})</h3>${K.filter(x=>x.c===k).map(x=>`<article class="kc"><b>${c.esc(x.title)}</b>${x.text?`<p>${c.esc(x.text)}</p>`:""}<div class="acts">
   ${ci>0?`<button class="btn ghost sm" data-act="kmove" data-id="${x.id}" data-d="-1" aria-label="Mover a ${KCOLS[ci-1][1]}">←</button>`:""}${ci<3?`<button class="btn ghost sm" data-act="kmove" data-id="${x.id}" data-d="1" aria-label="Mover a ${KCOLS[ci+1][1]}">→</button>`:""}
   <button class="link" data-act="kdel" data-id="${x.id}">Quitar</button></div></article>`).join("")}</section>`).join("")}</div></div>`; };

V.atcl=(v,c)=>{
 const A=arr(c.S(),"atcl").slice().reverse(), ST=["Pendiente","En proceso","Resuelto","No realizado"];
 v.innerHTML=`<div class="step">${crumb("atcl")}<p class="q">Pedidos ATCL</p><p class="sub">Todo pedido de un cliente queda cargado en ATCL, sin pedidos verbales, para que haya registro. Acá se sigue en qué quedó.</p>
 <form class="card form" data-vform="atcl"><h3>Registrar pedido</h3>
  ${field("Número de ATCL",`<input name="n" required maxlength="30" placeholder="ATCL-15423">`)}${field("Cliente / abonado",`<input name="cli" required maxlength="80">`)}
  ${field("Motivo",`<select name="mot"><option>Service técnico</option><option>Reclamo técnico</option><option>Consulta administrativa</option><option>Pedido operativo</option><option>Instalación / ampliación</option></select>`)}
  ${field("Área responsable",`<select name="area"><option>Técnica</option><option>Operativa</option><option>Administrativa</option><option>Supervisión</option><option>SAFE</option></select>`)}
  ${field("Detalle",`<textarea name="text" maxlength="400"></textarea>`)}<button class="btn" type="submit">Guardar</button></form>
 <div class="stack" style="margin-top:16px">${A.map(x=>{ const old=x.st==="Pendiente"&&Date.now()-x.at>864e5; return `<article class="item"><h3>${c.esc(x.n)} · ${c.esc(x.cli)}</h3>
  <div class="meta"><span class="tag ${x.st==="Resuelto"?"ok":old?"bad":"warn"}">${x.st}${old?" +24 h":""}</span><span>${c.esc(x.mot)}</span><span>${c.esc(x.area)}</span><span>${when(x.at)}</span></div>
  ${x.text?`<p style="white-space:pre-line">${c.esc(x.text)}</p>`:""}
  <div class="acts">${ST.filter(t=>t!==x.st).map(t=>`<button class="btn ghost sm" data-act="atst" data-id="${x.id}" data-v="${t}">${t}</button>`).join("")}</div></article>`; }).join("")||`<div class="empty">No hay pedidos cargados.</div>`}</div></div>`; };

const MAN=[["Alonso A2K4 / A2K8","alonso-a2k4-a2k8.pdf"],["Garnet PC-732","garnet-pc732.pdf"],["DSC PC-585","dsc-585.pdf"],["DSC: manual de usuario","dsc-manual-usuario.pdf"],["Paradox SP-4000","paradox-sp4000.pdf"],["NetworX NX-4","networx-nx4.pdf"],["Visonic PowerMax Express","visonic-powermaxexpress.pdf"],["Matrix 6","matrix-6.pdf"]];
V.recu=(v,c)=>{
 const R=arr(c.S(),"recu");
 v.innerHTML=`<div class="step">${crumb("recu")}<p class="q">Recursos</p><p class="sub">Manuales y material de apoyo. Las claves de plataformas no van acá: van en una pantalla aparte, solo con sesión iniciada.</p>
 <section class="sec"><h2>Manuales oficiales</h2><div class="grid">${MAN.map(m=>`<a class="pick" href="manuales/${m[1]}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><b>${m[0]}</b><span>Abrir PDF</span></a>`).join("")}</div></section>
 <section class="sec" style="margin-top:20px"><h2>Links y videos cargados</h2><div class="stack">${R.map(x=>`<article class="item"><h3><a href="${c.esc(x.url)}" target="_blank" rel="noopener">${c.esc(x.title)}</a></h3><div class="meta"><span class="tag">${c.esc(x.tipo)}</span><span>${when(x.at)}</span></div></article>`).join("")||`<div class="empty">Todavía no hay links cargados.</div>`}</div></section>
 <form class="card form" data-vform="recu" style="margin-top:18px"><h3>Agregar un link o video</h3>${field("Título",`<input name="title" required maxlength="80">`)}
  ${field("Tipo",`<select name="tipo"><option>Video explicativo</option><option>Link de apoyo</option><option>App / herramienta</option><option>Procedimiento adjunto</option></select>`)}
  ${field("Link (https://…)",`<input name="url" type="url" required placeholder="https://">`)}<button class="btn" type="submit">Guardar</button></form></div>`; };

V.metr=(v,c)=>{
 const s=c.S(), lg=s.log, n=t=>lg.filter(x=>x.t===t).length;
 const res=n("resuelto"), esc2=n("escalado"), miss=Object.values(s.miss).reduce((a,m)=>a+m.n,0), pend=arr(s,"learn").filter(x=>x.st==="Pendiente").length;
 const top=(t)=>{ const m={}; lg.filter(x=>x.t===t).forEach(x=>m[x.x]=(m[x.x]||0)+1); return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,6); };
 const bars=(l)=>{ const mx=l[0]?l[0][1]:1; return l.length?l.map(([k,x])=>`<div class="brow"><span>${c.esc(k)}</span><div><div class="bar" style="width:${Math.round(x/mx*100)}%"></div></div><b>${x}</b></div>`).join(""):`<div class="empty">Sin datos todavía.</div>`; };
 const tasa=res+esc2?Math.round(res/(res+esc2)*100)+"%":"–";
 v.innerHTML=`<div class="step">${crumb("metr")}<p class="q">Métricas</p><p class="sub">Todo lo que se consulta queda registrado. En este prototipo cuenta solo lo hecho desde este navegador; en producción se junta el de toda la central.</p>
 <div class="kpis"><div class="kpi"><b>${n("buscar")}</b><span>consultas</span></div><div class="kpi"><b>${res}</b><span>resueltas</span></div><div class="kpi"><b>${esc2}</b><span>escaladas a supervisión</span></div><div class="kpi"><b>${tasa}</b><span>resueltas sin escalar</span></div><div class="kpi"><b>${miss}</b><span>sin guía cargada</span></div><div class="kpi"><b>${pend}</b><span>aprendizajes pendientes</span></div></div>
 <div class="two" style="margin-top:18px"><section class="card" style="margin:0"><h3>Lo más consultado</h3>${bars(top("buscar"))}</section><section class="card" style="margin:0"><h3>Guías más resueltas</h3>${bars(top("resuelto"))}</section></div>
 <section class="card"><h3>Últimas consultas</h3>${lg.filter(x=>x.t==="buscar").slice(-10).reverse().map(x=>`<div class="brow" style="grid-template-columns:110px 1fr"><span>${when(x.at)}</span><span>${c.esc(x.x)}</span></div>`).join("")||`<div class="empty">Sin consultas todavía.</div>`}</section></div>`; };

V.nov=(v,c)=>{
 const s=c.S(), now=Date.now();
 v.innerHTML=`<div class="step">${crumb("nov")}<p class="q">Avisos y directivas</p><p class="sub">Historial de lo que indicó supervisión.</p>
 <section class="sec"><h2>Directivas</h2><div class="notes">${DIRS.map(d=>`<article class="note"><h3>${c.esc(d.title)}</h3><p>${c.esc(d.text)}</p><div class="meta"><span>${c.esc(d.source)} · ${c.esc(d.sector)}</span></div></article>`).join("")}</div></section>
 <section class="sec" style="margin-top:20px"><h2>Avisos</h2><div class="notes">${s.avisos.slice().reverse().map(a=>`<article class="note"><h3>${c.esc(a.title)} ${a.demo?'<span class="demo">Ejemplo</span>':""}</h3><p>${c.esc(a.body)}</p><div class="meta"><span>${c.esc(a.source)} · ${c.fmt(a.date)}</span><span class="tag">${a.archived?"Archivado":a.exp&&a.exp<now?"Vencido":"Vigente"}</span></div></article>`).join("")}</div></section></div>`; };

V.acc=(v,c)=>{
 const s=c.S(), A=arr(s,"acc"), adm=c.st.role==="adm", sup=c.st.role!=="op";
 if(!s.accSeed){ s.accSeed=1; A.push({id:"demo",demo:1,plat:"Plataforma de ejemplo",user:"operador.demo",pass:"clave-de-ejemplo",note:"Dato de muestra. Las claves reales se cargan con sesión iniciada."}); c.save(); }
 v.innerHTML=`<div class="step">${crumb("acc")}<p class="q">Accesos</p>
 <p class="sub">Copiá el usuario o la clave y pegalos en la plataforma. La clave no se muestra en pantalla.</p>
 <div class="warnbar"><b>Solo empleados.</b> En producción esta pantalla pide sesión y cada copia queda registrada. Acá es una muestra: no cargues claves reales todavía.</div>
 <div class="stack" style="margin-top:14px">${A.map(x=>`<article class="item"><h3>${c.esc(x.plat)} ${x.demo?'<span class="demo">Ejemplo</span>':""}</h3><div class="meta"><span>Usuario: <b>${c.esc(x.user)}</b></span></div>${x.note?`<p>${c.esc(x.note)}</p>`:""}
  <div class="acts"><button class="btn sm" data-act="acopy" data-id="${x.id}" data-w="user">Copiar usuario</button><button class="btn sm" data-act="acopy" data-id="${x.id}" data-w="pass">Copiar clave</button>${adm?`<button class="link" data-act="adel" data-id="${x.id}">Quitar</button>`:""}</div></article>`).join("")}</div>
 ${sup?`<form class="card form" data-vform="acc" style="margin-top:18px"><h3>Agregar acceso</h3>${field("Plataforma",`<input name="plat" required maxlength="60">`)}${field("Usuario",`<input name="user" required maxlength="60" autocomplete="off">`)}${field("Clave",`<input name="pass" type="password" required maxlength="80" autocomplete="new-password">`)}${field("Nota",`<input name="note" maxlength="120" placeholder="Para qué se usa">`)}<button class="btn" type="submit">Guardar</button></form>`:""}
 ${adm?`<section class="card"><h3>Registro de copias</h3>${arr(s,"accLog").slice(-10).reverse().map(l=>`<div class="brow" style="grid-template-columns:110px 1fr"><span>${when(l.at)}</span><span>${c.esc(l.who)} copió ${l.w==="pass"?"la clave":"el usuario"} de ${c.esc(l.plat)}</span></div>`).join("")||`<div class="empty">Sin copias todavía.</div>`}</section>`:""}</div>`; };

/* ---------- validación de procedimientos ---------- */
const obj=(s,k)=>s[k]||(s[k]={});
const base=c=>(c.kind==="diag"||c.confidence==="ALTA"||c.confidence==="OPERATIVO")?"validado":"borrador";
const vstate=(c,s)=>((s.val||{})[c.id]||{}).st||base(c);
const who=r=>r==="adm"?"Administración":"Supervisión";
function applyEdit(c,e){ c.question=e.question; c.action=e.steps.map((t,i)=>(i+1)+") "+t).join(" "); c.backup=e.backup; }
V.init=(c)=>{ const E=c.S().edits||{}; Object.keys(E).forEach(id=>{ const x=c.byId(id); if(x) applyEdit(x,E[id]); }); };
V.guideBlock=(x,c)=>{
 const s=c.S(), st=vstate(x,s), rec=(s.val||{})[x.id]||{}, sup=c.st.role!=="op", ed=c.st.editing===x.id;
 const stepsOf=t=>String(t||"").split(/\s*(?=\b\d{1,2}\)\s)/).map(y=>y.replace(/^\d{1,2}\)\s*/,"").trim()).filter(Boolean);
 const btn=(a,l,cls)=>`<button class="btn sm ${cls||"ghost"}" data-act="${a}" data-id="${x.id}">${l}</button>`;
 let bar,acts="";
 if(st==="validado"){
  bar=`<div class="okbar"><b>Validado.</b> ${rec.at?`Lo validó ${who(rec.by)} el ${c.fmt(rec.at)}. `:"Viene de una fuente oficial (manual o norma). "}Es el procedimiento para todos los operadores.</div>`;
  if(sup) acts=btn("vedit","Corregir")+btn("vback","Volver a revisión");
 }else if(st==="enviado"){
  bar=`<div class="warnbar"><b>Enviado a validar.</b> ${rec.at?`Lo envió ${rec.by==="op"?"un operador":who(rec.by)} el ${c.fmt(rec.at)}. `:""}Mientras tanto se puede usar, pero falta que supervisión lo confirme.</div>`;
  if(sup) acts=btn("vok","Validar","ok")+btn("vedit","Corregir y validar");
 }else{
  bar=`<div class="warnbar"><b>Sin validar.</b> Se puede usar como procedimiento, pero falta que supervisión lo valide.</div>`;
  acts=sup?btn("vok","Validar","ok")+btn("vedit","Corregir y validar"):btn("vsend","Enviar al supervisor para validar","ok");
 }
 const form=ed?`<form class="card form" data-vform="valedit" data-id="${x.id}" style="margin-top:12px"><h3>Corregir y validar</h3>
  ${field("Pregunta al cliente (opcional)",`<input name="question" maxlength="200" value="${c.esc(x.question||"")}">`)}
  ${field("Pasos (uno por línea)",`<textarea name="steps" required rows="8" style="min-height:160px">${c.esc(stepsOf(x.action).join("\n"))}</textarea>`)}
  ${field("Respaldo y contexto",`<textarea name="backup" rows="3">${c.esc(x.backup||"")}</textarea>`)}
  <div class="acts"><button class="btn ok" type="submit">Guardar y validar</button><button class="btn ghost" type="button" data-act="vcancel">Cancelar</button></div></form>`:"";
 return `<div style="margin-top:14px">${bar}${acts&&!ed?`<div class="acts" style="margin-top:10px">${acts}</div>`:""}${form}</div>`;
};
const SL=[["borrador","Sin validar","warn"],["enviado","Enviados por operadores","pri"],["validado","Validados","ok"]];
V.valid=(v,c)=>{
 const s=c.S();
 if(c.st.role==="op"){ v.innerHTML=`<div class="step"><div class="empty">Esta pantalla es de supervisión.</div></div>`; return; }
 const f=st2.vsec||"Todos", list=c.CASES.filter(x=>f==="Todos"||(f==="SAFE"?x.sector==="safe":x.sector!=="safe"));
 const by={borrador:[],enviado:[],validado:[]}; list.forEach(x=>by[vstate(x,s)].push(x));
 Object.values(by).forEach(a=>a.sort((p,q)=>(p.sector==="safe"?0:1)-(q.sector==="safe"?0:1)||p.system.localeCompare(q.system)||p.issue.localeCompare(q.issue)));
 const secs=["Todos","SAFE","Objetivo Fijo 911"];
 v.innerHTML=`<div class="step"><div class="crumbs"><button data-act="home">Inicio</button><span>›</span><span class="cur">Validación de procedimientos</span></div>
 <p class="q">Validación de procedimientos</p><p class="sub">Un procedimiento validado es el oficial para todos. Abrilo, leelo, corregilo si hace falta y validalo. Si un operador lo envía, aparece en la columna del medio.</p>
 <div class="chips" style="margin-bottom:14px">${secs.map(x=>`<button class="chip" data-act="vsec" data-v="${x}" style="${f===x?"border-color:var(--pri)":""}">${x}</button>`).join("")}</div>
 <div class="cols">${SL.map(([k,l,t])=>`<section class="col"><h3>${l} (${by[k].length})</h3><div style="display:grid;gap:8px;max-height:70vh;overflow:auto">${by[k].map(x=>`<article class="kc"><b>${c.esc(x.issue)}</b><p>${c.esc(x.system)} · ${x.sector==="safe"?"SAFE":"911"}</p><div class="acts"><button class="btn ghost sm" data-act="open" data-id="${x.id}">Abrir</button>${k!=="validado"?`<button class="btn ok sm" data-act="vok" data-id="${x.id}">Validar</button>`:`<button class="link" data-act="vback" data-id="${x.id}">Volver a revisión</button>`}</div></article>`).join("")||`<div class="empty">Nada por acá.</div>`}</div></section>`).join("")}</div></div>`; };


/* ---------- novedades y material pendiente (bandeja de entrada) ---------- */
const IST=["Pendiente de clasificar","En revisión","Listo para integrar","Integrado","Archivado"];
const ISEC=["SAFE / Objetivos Móviles","Monitoreo 911","Todos los sectores","Sin clasificar"];
const nz=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function inbClassify(raw,srcIn){
 let text=String(raw||"").replace(/\r/g,"").trim(), author="", date="";
 const m=text.match(/^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2})(?::\d{2})?\]?\s*(?:-\s*)?([^:\n]{1,40}):\s*([\s\S]*)$/);
 if(m){ date=m[1]+" "+m[2]; author=m[3].trim(); text=m[4].trim(); }
 const notes=[];
 const cred=/((?:contrase[ñn]a|clave|password|pass|pwd|usuario|user)\s*[:=]\s*)(\S+)/gi;
 if(cred.test(text)){ text=text.replace(cred,"$1[oculto]"); notes.push("Se ocultaron usuario/clave que venían en el mensaje. Las claves no se guardan acá."); }
 const n=nz(text);
 const safe=/\b(safe|c0a|c0c|apv|acv|aps|acs|opd|opc|cabina|chofer|patente|desenganche|vehiculo|camion|gps|avl|temperatur|geocerca|remolque|combustible|unidad(es)?)\b/.test(n);
 const fijo=/\b(911|e-?911|domicilio|tamper|panel|alarmas? fijas?|hogar|comercio|sensor|teclado|zona)\b/.test(n);
 const sector=safe&&fijo?"Todos los sectores":safe?"SAFE / Objetivos Móviles":fijo?"Monitoreo 911":"Sin clasificar";
 const TAGS=[["Temperatura",/temperatur|frio|camara frigor/],["Puertas y códigos",/puerta|codigo|c0a|c0c|apv|acv|aps|acs/],["Pánico y asalto",/panico|asalto|robo|coaccion/],["Comunicación y reportes",/report|mensaje|whatsapp|llamar|comunica|mail|correo/],["Capacitación",/capacita|curso|video|tutorial|manual/],["Servicio técnico",/service|tecnico|instalad|reparaci/],["Accesos",/acceso|usuario|login|plataforma|ingres/],["ATCL",/atcl/],["Certificados y asignación",/certificad|asignaci/],["Energía y batería",/bateria|energia|corte de luz|fuente/],["Seguimiento",/seguimiento|monitore|rastreo|recorrido/],["Horarios",/horari|turno|guardia|feriado/]];
 const tags=TAGS.filter(t=>t[1].test(n)).map(t=>t[0]);
 const plat=/softguard/.test(n)?"SoftGuard":/bykom/.test(n)?"Bykom":"";
 const links=(text.match(/https?:\/\/[^\s)]+/g)||[]);
 const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const first=lines.find(l=>!/^(hola|buen[oa]s?|que tal|saludos|estimados?)[\s,.!]*(dias?|tardes?|noches?|a todos|todos|equipo|chicos)?[\s,.!]*$/i.test(l))||lines[0]||"Novedad sin título";
 let title=[plat,tags[0],first].filter(Boolean).join(" — "); if(title.length>180) title=title.slice(0,177)+"…";
 let dest=(tags.length&&tags.every(t=>t==="Accesos"||t==="Capacitación"))||(links.length&&text.replace(/https?:\/\/\S+/g,"").trim().length<60)?"Recursos":tags.includes("ATCL")?"Otro":(tags.length||sector!=="Sin clasificar")?"Procedimientos":"Por definir";
 let t2=text;
 const tel=/(?<!\d)(?:\+?54\s?)?(?:9\s?)?(?:11|[2-3]\d{2,3})[\s-]?\d{3,4}[\s-]?\d{4}(?!\d)/;
 if(tel.test(t2)) notes.push("Tiene un número de teléfono: revisalo antes de integrarlo como procedimiento.");
 if(sector==="Sin clasificar") notes.push("No se pudo detectar el sector: elegilo al revisar.");
 if(!tags.length) notes.push("Sin tema claro: definí a dónde va.");
 return {title,text:t2,source:(srcIn||"").trim()||("WhatsApp"+(author?" · "+author:"")+(date?" · "+date:"")),sector,tags,platform:plat,links,dest,status:"En revisión",notes};
}
const stepsFrom=t=>{
 let L=String(t).split(/\n+/).map(x=>x.replace(/^\s*(?:[-*•]|\d{1,2}[.)])\s*/,"").trim()).filter(Boolean);
 if(L.length<2){ L=String(t).split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean); }
 return L.slice(0,15);
};
function inbToCase(x){
 const safe=x.sector==="SAFE / Objetivos Móviles"; const st=stepsFrom(x.text);
 return {id:"inb-"+x.id,sector:safe?"safe":"fijo",system:safe?"Plataforma SAFE":"Monitoreo 911",code:"",issue:x.title.replace(/^.*? — /,"").slice(0,120)||x.title,causes:"",question:"",action:st.map((t,i)=>(i+1)+") "+t).join(" "),video:"",manualPage:"",backup:"Novedad cargada desde la bandeja ("+x.source+"). Falta validación de supervisión.",confidence:"BORRADOR",commandHint:"",decision:""};
}
/* los procesos ya convertidos vuelven a existir al abrir la página */
try{ const sv=JSON.parse(localStorage.getItem("vg_proto_v1")||"{}"); (sv.inbox||[]).forEach(x=>{ if(x.proc) X.cases.push(x.proc); }); }catch(e){}
const IOPT=(a,sel)=>a.map(o=>`<option${o===sel?" selected":""}>${o}</option>`).join("");
const DESTS=["Procedimientos","Respuestas","Recursos","Otro","Por definir"];
st2.iq="";st2.ie="Todos";st2.is="Todos";st2.iv="planilla";st2.ide=null;st2.ied=null;
const stClass=s=>({"Pendiente de clasificar":"warn","En revisión":"pri","Listo para integrar":"ok","Integrado":"ok","Archivado":""}[s]||"");
V.inbox=(v,c)=>{
 const s=c.S(), sup=c.st.role!=="op";
 v.innerHTML=`<div class="step">${crumb("inbox")}<p class="q">Novedades y material pendiente</p>
 <p class="sub">Pegá lo que manda Kike por WhatsApp. El sistema lo clasifica y lo deja en revisión; supervisión lo convierte en procedimiento.</p>
 <form class="card form" data-vform="inbox"><h3>Pegar desde WhatsApp</h3>
  ${field("Mensaje original",`<textarea id="inT" name="text" required rows="6" style="min-height:140px" placeholder="Pegá acá el mensaje completo"></textarea>`)}
  ${field("Fuente / autor (opcional)",`<input id="inS" name="source" maxlength="120" placeholder="Si lo dejás vacío, se toma del mensaje">`)}
  <p class="sub" id="inP" style="margin:0">Pegá un mensaje para ver cómo se va a clasificar.</p>
  <div class="acts"><button class="btn ok" type="submit">Cargar automáticamente</button><button class="btn ghost" type="button" data-act="inclr">Limpiar</button></div></form>
 <details class="card" style="margin-top:12px"><summary><b>Carga manual</b></summary><form class="form" data-vform="inman" style="margin-top:10px">
  ${field("Título",`<input name="title" required maxlength="180">`)}${field("Contenido original",`<textarea name="text" required rows="5"></textarea>`)}
  ${field("Enlace (opcional)",`<input name="url" type="url" maxlength="300">`)}${field("Fuente",`<input name="source" maxlength="120" placeholder="WhatsApp · Kike">`)}
  ${field("Sector",`<select name="sector">${IOPT(ISEC)}</select>`)}${field("Destino",`<select name="dest">${IOPT(DESTS,"Por definir")}</select>`)}${field("Notas",`<textarea name="notes" rows="2"></textarea>`)}
  <div class="acts"><button class="btn" type="submit">Guardar en revisión</button></div></form></details>
 <section class="card" style="margin-top:14px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h3 style="margin:0">Registro de novedades <span class="tag" id="inN"></span></h3>
  <div class="acts" style="margin:0"><button class="btn sm ghost" data-act="inview" data-v="planilla">Vista planilla</button><button class="btn sm ghost" data-act="inview" data-v="resumen">Vista resumida</button><button class="btn sm ghost" data-act="inexp">Exportar CSV</button></div></div>
  <div class="kpis" id="inK" style="margin:12px 0"></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap"><input id="inQ" placeholder="Buscar en título, texto, fuente y notas" value="${c.esc(st2.iq)}" style="flex:1;min-width:200px;height:44px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--tx);padding:0 12px">
   <select id="inE" aria-label="Filtrar por estado" style="height:44px"><option>Todos</option>${IOPT(IST,st2.ie)}</select>
   <select id="inC" aria-label="Filtrar por sector" style="height:44px"><option>Todos</option>${IOPT(ISEC,st2.is)}</select></div>
  <div id="inD"></div><div id="inL" style="margin-top:12px"></div></section></div>`;
 const paint=()=>{
  const A=arr(s,"inbox"), q=nz(st2.iq).split(/\s+/).filter(Boolean);
  const L=A.filter(x=>(st2.ie==="Todos"||x.status===st2.ie)&&(st2.is==="Todos"||x.sector===st2.is)&&q.every(w=>nz([x.title,x.text,x.source,(x.notes||[]).join(" "),x.dest,(x.tags||[]).join(" ")].join(" ")).includes(w))).sort((a,b)=>b.at-a.at);
  v.querySelector("#inN").textContent=L.length+" de "+A.length+" registros";
  v.querySelector("#inK").innerHTML=IST.map(k=>`<button class="kpi" data-act="inflt" data-v="${k}" style="text-align:left;cursor:pointer;${st2.ie===k?"border-color:var(--pri)":""}"><b>${A.filter(x=>x.status===k).length}</b><span>${k}</span></button>`).join("");
  const sel=A.find(x=>x.id===st2.ide), ed=A.find(x=>x.id===st2.ied);
  let D="";
  if(ed) D=`<form class="card form" data-vform="inedit" data-id="${ed.id}" style="margin-top:12px"><h3>Editar novedad</h3>${field("Título",`<input name="title" required maxlength="180" value="${c.esc(ed.title)}">`)}${field("Contenido",`<textarea name="text" required rows="6">${c.esc(ed.text)}</textarea>`)}
   ${field("Fuente",`<input name="source" value="${c.esc(ed.source)}">`)}${field("Sector",`<select name="sector">${IOPT(ISEC,ed.sector)}</select>`)}${field("Destino",`<select name="dest">${IOPT(DESTS,ed.dest)}</select>`)}${field("Estado",`<select name="status">${IOPT(IST,ed.status)}</select>`)}${field("Notas de revisión (una por línea)",`<textarea name="notes" rows="3">${c.esc((ed.notes||[]).join("\n"))}</textarea>`)}
   <div class="acts"><button class="btn ok" type="submit">Guardar</button><button class="btn ghost" type="button" data-act="inx">Cancelar</button></div></form>`;
  else if(sel) D=`<article class="card" style="margin-top:12px"><h3>${c.esc(sel.title)}</h3><div class="meta"><span class="tag ${stClass(sel.status)}">${sel.status}</span><span>${c.esc(sel.sector)}</span><span>Destino: ${c.esc(sel.dest)}</span><span>${c.esc(sel.source)}</span><span>${when(sel.at)}</span></div>
   <h4>Contenido original</h4><p style="white-space:pre-wrap">${c.esc(sel.text)}</p>
   ${(sel.tags||[]).length?`<p><b>Temas:</b> ${sel.tags.map(t=>`<span class="tag">${c.esc(t)}</span>`).join(" ")}</p>`:""}
   ${(sel.links||[]).length?`<p>${sel.links.map(u=>/^https?:/.test(u)?`<a href="${c.esc(u)}" target="_blank" rel="noopener">${c.esc(u)}</a>`:"").join("<br>")}</p>`:""}
   ${(sel.notes||[]).length?`<h4>Notas de revisión</h4><ul>${sel.notes.map(n2=>`<li>${c.esc(n2)}</li>`).join("")}</ul>`:""}
   <div class="acts">${sel.proc?`<button class="btn sm ok" data-act="open" data-id="${sel.proc.id}">Ver el procedimiento</button>`:sup?`<button class="btn sm ok" data-act="inproc" data-id="${sel.id}">Convertir en procedimiento</button>`:`<span class="sub">Supervisión la convierte en procedimiento.</span>`}
    ${sup?`<button class="btn sm ghost" data-act="inedit" data-id="${sel.id}">Editar</button>`:""}${sup&&sel.status!=="Archivado"?`<button class="btn sm ghost" data-act="inarch" data-id="${sel.id}">Archivar</button>`:""}${sup?`<button class="link" data-act="indel" data-id="${sel.id}">Eliminar</button>`:""}<button class="btn sm ghost" data-act="inx">Cerrar</button></div></article>`;
  v.querySelector("#inD").innerHTML=D;
  v.querySelector("#inL").innerHTML=!L.length?`<div class="empty">${A.length?"Ningún registro coincide con el filtro.":"Todavía no hay novedades. Pegá el primer mensaje arriba."}</div>`
   :st2.iv==="resumen"?`<div class="stack">${L.map(x=>`<article class="item"><h3>${c.esc(x.title)}</h3><div class="meta"><span class="tag ${stClass(x.status)}">${x.status}</span><span>${c.esc(x.sector)}</span><span>${c.esc(x.dest)}</span><span>${when(x.at)}</span></div><div class="acts"><button class="btn sm" data-act="inver" data-id="${x.id}">Ver ficha</button>${sup?`<button class="btn sm ghost" data-act="inedit" data-id="${x.id}">Editar</button>`:""}</div></article>`).join("")}</div>`
   :`<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:15px"><thead><tr style="text-align:left">${["Título","Contenido","Sector","Estado / destino","Fuente","Notas","Fecha","Acción"].map(h=>`<th style="padding:8px;border-bottom:2px solid var(--line)">${h}</th>`).join("")}</tr></thead><tbody>${L.map(x=>`<tr style="vertical-align:top;border-bottom:1px solid var(--line)"><td style="padding:8px;min-width:200px"><b>${c.esc(x.title)}</b></td><td style="padding:8px;min-width:220px">${c.esc(x.text.slice(0,140))}${x.text.length>140?"…":""}</td><td style="padding:8px">${c.esc(x.sector)}</td><td style="padding:8px"><span class="tag ${stClass(x.status)}">${x.status}</span><br>${c.esc(x.dest)}</td><td style="padding:8px">${c.esc(x.source)}</td><td style="padding:8px">${(x.notes||[]).length}</td><td style="padding:8px;white-space:nowrap">${when(x.at)}</td><td style="padding:8px;white-space:nowrap"><button class="btn sm" data-act="inver" data-id="${x.id}">Ver ficha</button>${sup?` <button class="btn sm ghost" data-act="inedit" data-id="${x.id}">Editar</button>`:""}</td></tr>`).join("")}</tbody></table></div>`;
 };
 V._inpaint=paint; paint();
 const T=v.querySelector("#inT"), S2=v.querySelector("#inS"), P=v.querySelector("#inP");
 const prev=()=>{ if(!T.value.trim()){ P.textContent="Pegá un mensaje para ver cómo se va a clasificar."; return; } const r=inbClassify(T.value,S2.value); P.innerHTML=`<b>Se va a cargar como:</b> ${c.esc(r.title)}<br>Sector: ${c.esc(r.sector)} · Destino: ${c.esc(r.dest)} · Estado: En revisión${r.notes.length?"<br>⚠ "+r.notes.map(c.esc).join(" · "):""}`; };
 T.addEventListener("input",prev); S2.addEventListener("input",prev);
 v.querySelector("#inQ").addEventListener("input",e=>{ st2.iq=e.target.value; paint(); });
 v.querySelector("#inE").addEventListener("change",e=>{ st2.ie=e.target.value; paint(); });
 v.querySelector("#inC").addEventListener("change",e=>{ st2.is=e.target.value; paint(); });
};

/* ---------- acciones ---------- */
V.act=(a,b,c)=>{
 const s=c.S(), id=b.dataset.id, find=k=>arr(s,k).find(x=>x.id===id);
 if(a!=="act"&&typeof V[a]==="function"&&a!=="submit"){ c.go(a); scrollTo({top:0}); return true; }
 if(a==="inclr"){ c.go("inbox"); return true; }
 if(a==="inview"){ st2.iv=b.dataset.v; V._inpaint(); return true; }
 if(a==="inflt"){ st2.ie=st2.ie===b.dataset.v?"Todos":b.dataset.v; c.go("inbox"); return true; }
 if(a==="inver"){ st2.ide=id; st2.ied=null; V._inpaint(); c.view.querySelector("#inD").scrollIntoView({behavior:"smooth",block:"center"}); return true; }
 if(a==="inedit"){ st2.ied=id; st2.ide=null; V._inpaint(); c.view.querySelector("#inD").scrollIntoView({behavior:"smooth",block:"center"}); return true; }
 if(a==="inx"){ st2.ide=st2.ied=null; V._inpaint(); return true; }
 if(a==="inarch"){ const x=find("inbox"); if(x){ x.status="Archivado"; c.save(); V._inpaint(); } return true; }
 if(a==="indel"){ const x=find("inbox"); if(x&&!x.proc&&confirm("¿Eliminar esta novedad?")){ s.inbox=arr(s,"inbox").filter(y=>y.id!==id); st2.ide=null; c.save(); V._inpaint(); } return true; }
 if(a==="inproc"){ const x=find("inbox"); if(x&&!x.proc){ const k=inbToCase(x); x.proc=k; x.status="Integrado"; x.dest="Procedimientos"; obj(s,"val")[k.id]={st:"borrador",by:c.st.role,at:Date.now()}; c.save(); if(window.VIGILIA_ADDCASE) window.VIGILIA_ADDCASE(k); c.toast("Cargado como procedimiento nuevo, sin validar"); V._inpaint(); } return true; }
 if(a==="inexp"){ const q=v2=>'"'+String(v2==null?"":v2).replace(/"/g,'""')+'"'; const rows=[["Título","Contenido","Sector","Estado","Destino","Fuente","Notas","Fecha"]].concat(arr(s,"inbox").map(x=>[x.title,x.text,x.sector,x.status,x.dest,x.source,(x.notes||[]).join(" | "),new Date(x.at).toISOString()])); const bl=new Blob(["\ufeff"+rows.map(r=>r.map(q).join(",")).join("\n")],{type:"text/csv"}); const u=URL.createObjectURL(bl), l=document.createElement("a"); l.href=u; l.download="novedades.csv"; l.click(); setTimeout(()=>URL.revokeObjectURL(u),2000); return true; }
 if(a==="vsend"){ obj(s,"val")[id]={st:"enviado",by:"op",at:Date.now()}; c.save(); c.toast("Enviado al supervisor para validar"); c.go(c.st.mode); return true; }
 if(a==="vok"){ obj(s,"val")[id]={st:"validado",by:c.st.role,at:Date.now()}; c.save(); c.toast("Validado"); c.go(c.st.mode); return true; }
 if(a==="vback"){ obj(s,"val")[id]={st:"borrador",by:c.st.role,at:Date.now()}; c.save(); c.go(c.st.mode); return true; }
 if(a==="vedit"){ c.st.editing=id; c.go("guide"); return true; }
 if(a==="vcancel"){ c.st.editing=null; c.go("guide"); return true; }
 if(a==="vsec"){ st2.vsec=b.dataset.v; V.valid(c.view,c); return true; }
 if(a==="acopy"){ const x=find("acc"); if(x){ c.copy(x[b.dataset.w]).then(()=>{ arr(s,"accLog").push({who:c.st.role==="adm"?"Administrador":c.st.role==="sup"?"Supervisor":"Operador",plat:x.plat,w:b.dataset.w,at:Date.now()}); c.save(); c.toast(b.dataset.w==="pass"?"Clave copiada":"Usuario copiado"); }); } return true; }
 if(a==="adel"){ s.acc=arr(s,"acc").filter(x=>x.id!==id); c.save(); V.acc(c.view,c); return true; }
 if(a==="rsec"){ st2.rs=b.dataset.v; V.resp(c.view,c); return true; }
 if(a==="rcopy"){ const t=document.getElementById("t-"+id); c.copy(t.value).then(()=>{ c.log("mensaje",(RESP.concat(arr(s,"resp")).find(r=>r.id===id)||{}).title); c.toast("Mensaje copiado. Pegalo en WhatsApp."); }); return true; }
 if(a==="svote"){ const x=find("sugg"); if(x){ x.v++; c.save(); V.sugg(c.view,c); } return true; }
 if(a==="sok"){ const x=find("sugg"); if(x){ x.ok=true; c.save(); V.sugg(c.view,c); } return true; }
 if(a==="kmove"){ const x=find("kanban"); if(x){ const i=KCOLS.findIndex(k=>k[0]===x.c)+ +b.dataset.d; x.c=KCOLS[Math.max(0,Math.min(3,i))][0]; c.save(); V.kanban(c.view,c); } return true; }
 if(a==="kdel"){ s.kanban=arr(s,"kanban").filter(x=>x.id!==id); c.save(); V.kanban(c.view,c); return true; }
 if(a==="atst"){ const x=find("atcl"); if(x){ x.st=b.dataset.v; c.save(); V.atcl(c.view,c); } return true; }
 return false;
};
V.submit=(f,c,sub)=>{
 const d=new FormData(f,sub||undefined), s=c.S(), now=Date.now(), id="x"+now, k=f.dataset.vform, g=n=>String(d.get(n)||"").trim();
 if(k==="inbox"){ const r=inbClassify(g("text"),g("source")); arr(s,"inbox").push(Object.assign({id:"n"+now},r,{at:now})); st2.ie="Todos";st2.is="Todos";st2.iq=""; st2.ide="n"+now; c.save(); c.toast("Cargado en revisión: "+r.sector); c.go("inbox"); return true; }
 if(k==="inman"){ const r=inbClassify(g("text"),g("source")); const it=Object.assign({id:"n"+now},r,{title:g("title"),sector:g("sector"),dest:g("dest"),at:now}); const u=g("url"); if(u&&/^https?:\/\//.test(u)) it.links=[u]; const nt=g("notes"); if(nt) it.notes=nt.split(/\n+/).concat(it.notes); arr(s,"inbox").push(it); st2.ide="n"+now; c.save(); c.toast("Guardado en revisión"); c.go("inbox"); return true; }
 if(k==="inedit"){ const x=arr(s,"inbox").find(y=>y.id===f.dataset.id); if(x){ x.title=g("title"); x.text=g("text"); x.source=g("source"); x.sector=g("sector"); x.dest=g("dest"); x.status=g("status"); x.notes=g("notes").split(/\n+/).map(t=>t.trim()).filter(Boolean); } st2.ied=null; st2.ide=f.dataset.id; c.save(); c.toast("Guardado"); c.go("inbox"); return true; }
 if(k==="valedit"){ const x=c.byId(f.dataset.id); if(!x) return false; const e={question:g("question"),steps:g("steps").split(/\n+/).map(t=>t.trim()).filter(Boolean),backup:g("backup")}; obj(s,"edits")[x.id]=e; applyEdit(x,e); obj(s,"val")[x.id]={st:"validado",by:c.st.role,at:now}; c.st.editing=null; c.save(); c.toast("Corregido y validado"); c.go("guide"); return true; }
 if(k==="resp") arr(s,"resp").push({id:"u"+now,title:g("title"),sector:g("sector"),channel:g("channel"),tags:"",text:g("text"),by:c.st.role==="op"?"operador":"supervisión"});
 else if(k==="learn") arr(s,"learn").push({id,q:g("q"),text:g("text"),sector:g("sector"),st:"Pendiente",at:now});
 else if(k==="lans"){ const x=arr(s,"learn").find(y=>y.id===f.dataset.id); if(x){ x.ans=g("ans"); x.st=d.get("to")||"Respondido"; } }
 else if(k==="sugg") arr(s,"sugg").push({id,text:g("text"),v:0,at:now});
 else if(k==="kanban") arr(s,"kanban").push({id,title:g("title"),text:g("text"),c:"por"});
 else if(k==="atcl") arr(s,"atcl").push({id,n:g("n"),cli:g("cli"),mot:g("mot"),area:g("area"),text:g("text"),st:"Pendiente",at:now});
 else if(k==="acc") arr(s,"acc").push({id,plat:g("plat"),user:g("user"),pass:g("pass"),note:g("note")});
 else if(k==="recu") arr(s,"recu").push({id,title:g("title"),tipo:g("tipo"),url:g("url"),at:now});
 else return false;
 c.save(); c.toast("Guardado"); c.go(c.st.mode); return true;
};
})();
