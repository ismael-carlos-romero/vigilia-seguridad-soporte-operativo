const data = window.VIGILIA_DATA;
const state = {
  selected: null,
  results: [],
  selectedSafe: null,
  safeResults: [],
  selectedProcedure: null,
  selectedLearningId: null,
  procedureResults: [],
  procedureSuggestIndex: 0,
  intakeSuggestIndex: 0,
  intakeRouteTimer: null,
  lastIntakeRouteKey: '',
  firebase: {
    enabled: false,
    loaded: false,
    db: null,
    auth: null,
    currentUser: null,
    userProfile: null,
    learning: [],
    kanban: [],
    unsubscribeLearning: null,
    unsubscribeKanban: null,
    migratedLocal: false,
    lastCloudSave: null,
    status: 'Base central no conectada'
  }
};
const STORAGE_KEY = 'vigiliaCasesV2';
const DIRECTIVES_KEY = 'vigiliaDirectivesV1';
const LEARNING_KEY = 'vigiliaLearningV1';
const KANBAN_KEY = 'vigiliaKanbanV1';
const SESSION_KEY = 'vigiliaSessionV1';
const MEDIA_KEY = 'vigiliaMediaV1';
const RESOURCES_KEY = 'vigiliaResourcesV1';
const kanbanColumns = [
  { id: 'por-hacer', label: 'Por hacer', hint: 'Tareas o eventos recién cargados' },
  { id: 'en-espera', label: 'En espera', hint: 'Falta dato, llamado, respuesta o validación' },
  { id: 'supervision', label: 'Supervisión', hint: 'Requiere criterio o aprobación' },
  { id: 'resuelto', label: 'Resuelto', hint: 'Caso cerrado o cedulado' },
  { id: 'procedimiento', label: 'Procedimiento', hint: 'Convertido en regla reutilizable' }
];
const quickTerms = ['teclado hace ruido', 'falla bateria', 'falla 220', 'perdida de hora', 'cambiar usuario', 'borrar clave', 'zona abierta', 'DMSS no conecta'];
const intakeQuickTerms = ['teclado hace ruido', 'no llegó factura', 'quiero dar la baja', 'camión no reporta', 'no puedo ver cámaras', 'alarma se disparó', 'cambiar clave'];
const intakeStopWords = new Set(['que','con','para','por','una','uno','unos','unas','del','los','las','eso','esta','este','esto','tengo','tiene','hace','cada','me','mi','el','la','de','se','en','y','o','no']);
const intakeRules = [
  { id:'manual-tecnico', title:'Falla técnica de alarma', sector:'Monitoreo 911 / Soporte operativo', priority:'Media', keywords:['teclado','ruido','bateria','falla','220','zona','clave','activar','desactivar','sensor','sirena','panel','paradox','dsc','garnet','alonso'], questions:['¿Qué marca o modelo tiene la alarma, o qué panel figura en Bykom?', '¿Qué tecla de falla tiene: FALLO, TBL, casita, BYP/EXC o pantalla?', '¿Qué número, LED o mensaje aparece al consultar la falla?'], action:'Usar Manual para identificar modelo, leer número de falla y aplicar procedimiento. Si no está cargado, registrar aprendizaje pendiente.', route:'Resolver desde estación si está documentado; derivar a Técnico si requiere visita.' },
  { id:'evento-911', title:'Evento operativo de alarma', sector:'Monitoreo 911', priority:'Alta', keywords:['robo','disparo','panico','asalto','fuego','incendio','emergencia','tamper','acuda','intrusion'], questions:['¿Qué evento ingresó en Bykom?', '¿Hay desactivación posterior o nota especial?', '¿Corresponde contención, video verificación, acuda o emergencia?'], action:'Ir a Procedimientos y aplicar el árbol del evento. Registrar nota operativa.', route:'Monitoreo gestiona; escalar según criticidad.' },
  { id:'administracion', title:'Consulta administrativa o cobranza', sector:'Administración / Cobranzas', priority:'Baja', keywords:['factura','pago','cobranza','deuda','recibo','transferencia','cuota','abono','administracion','administración'], questions:['¿El cliente consulta factura, pago, deuda o comprobante?', '¿Es horario administrativo?', '¿Se puede crear tarea o dejar derivado al sector?'], action:'No ocupar tiempo técnico del operador salvo urgencia. Validar cuenta y derivar a Administración/Cobranzas con nota breve.', route:'Derivar a Administración / Cobranzas.' },
  { id:'baja-reclamo', title:'Reclamo fuerte o riesgo de baja', sector:'Supervisión / Atención al cliente', priority:'Alta', keywords:['baja','dar de baja','reclamo','molesto','enojo','queja','no solucionaron','nunca vino','demora','tecnico no fue','técnico no fue'], questions:['¿Cuál es el motivo de baja o reclamo?', '¿Hay service pendiente, falla repetida o demora?', '¿Quién debe tomar seguimiento?'], action:'Registrar como riesgo de baja, contener al cliente y derivar a supervisor o atención responsable.', route:'Derivar a Supervisión / Atención al cliente.' },
  { id:'safe', title:'SAFE / seguimiento vehicular', sector:'SAFE / Monitoreo vehicular', priority:'Media', keywords:['camion','camión','vehiculo','vehículo','gps','no reporta','satelital','ruta','desvio','desvío','parada','movil','móvil'], questions:['¿Es unidad vehicular o alarma domiciliaria?', '¿Qué evento figura: sin reporte, desvío, pánico, parada?', '¿Qué protocolo tiene el cliente?'], action:'Derivar o aplicar procedimiento SAFE según evento y horario.', route:'Derivar a SAFE / seguimiento vehicular.' },
  { id:'camaras-app', title:'App, cámaras o acceso remoto', sector:'Soporte técnico / Cámaras', priority:'Media', keywords:['camara','cámara','camaras','cámaras','dmss','hik-connect','app','telefono','celular','no veo','no conecta','usuario app'], questions:['¿Qué app usa: DMSS, Hik-Connect u otra?', '¿Falla en un celular o en todos?', '¿Tiene internet en el lugar?'], action:'Buscar en Manual por app/cámara. Si no se resuelve, derivar a soporte técnico.', route:'Resolver con guía si existe; si no, derivar a Técnica / Cámaras.' },
  { id:'ventas', title:'Consulta comercial', sector:'Ventas', priority:'Baja', keywords:['presupuesto','instalar','instalacion','instalación','cotizacion','cotización','comprar','servicio nuevo','alta servicio'], questions:['¿Quiere contratar, ampliar o pedir presupuesto?', '¿De qué servicio se trata?', '¿Dejar contacto y horario?'], action:'Tomar datos mínimos y derivar a Ventas.', route:'Derivar a Ventas.' }
];
const procedureQuickTerms = ['disparo de alarma', 'corte 220', 'falla comunicacion', 'panico', 'video verificacion', 'fallo cierre'];
const safeQuickTerms = ['camión no reporta', 'pánico vehicular', 'desvío de ruta', 'parada no autorizada', 'GPS sin señal'];
const safeData = [
  { id:'safe-no-reporta', category:'Comunicación', event:'Unidad o camión no reporta', priority:'Media', trigger:'El móvil dejó de enviar posición o la plataforma muestra último reporte vencido.', questions:['¿Desde cuándo no reporta?', '¿Es unidad en viaje, detenida o fuera de servicio?', '¿Hay protocolo del cliente sobre llamados o espera?'], action:'Verificar último reporte, revisar si hay más unidades afectadas y contactar según protocolo. Si persiste, dejar seguimiento y derivar a soporte técnico/GPS.', note:'Unidad sin reporte. Se verifica última posición, horario y protocolo. Se informa/deriva según corresponda.' },
  { id:'safe-panico', category:'Emergencia', event:'Pánico vehicular', priority:'Alta', trigger:'Ingresa alerta de pánico desde móvil, botón o plataforma satelital.', questions:['¿La unidad está en movimiento o detenida?', '¿Hay contacto con chofer/responsable?', '¿El cliente tiene protocolo de emergencia específico?'], action:'Priorizar contacto y protocolo de emergencia. Registrar hora, ubicación, respuesta y escalamiento.', note:'Pánico vehicular recibido. Se aplica protocolo, se registra ubicación, contacto y escalamiento.' },
  { id:'safe-desvio', category:'Ruta', event:'Desvío de ruta', priority:'Media', trigger:'La unidad sale de recorrido autorizado o zona esperada.', questions:['¿El desvío está autorizado por cliente/base?', '¿La unidad mantiene reporte normal?', '¿Corresponde avisar a responsable o sólo registrar?'], action:'Validar si el desvío está permitido. Si no hay autorización, avisar según protocolo y dejar registro.', note:'Desvío detectado. Se valida autorización/protocolo y se registra novedad.' },
  { id:'safe-parada', category:'Ruta', event:'Parada no autorizada', priority:'Media', trigger:'La unidad queda detenida fuera de tiempo o zona prevista.', questions:['¿Cuánto tiempo lleva detenida?', '¿Es parada habitual o fuera de zona?', '¿Hay contacto con chofer o referente?'], action:'Revisar tiempo de detención, lugar y protocolo. Contactar o derivar según criticidad.', note:'Parada no autorizada o fuera de tolerancia. Se revisa ubicación, tiempo y contacto.' },
  { id:'safe-gps', category:'Soporte', event:'GPS sin señal o equipo con falla', priority:'Media', trigger:'La plataforma muestra falla técnica del equipo, señal débil o datos inconsistentes.', questions:['¿La falla afecta a una sola unidad o varias?', '¿Hubo corte de alimentación, zona sin cobertura o equipo manipulado?', '¿Hay visita técnica pendiente?'], action:'Comparar historial y cobertura. Si no restaura, generar revisión técnica o seguimiento.', note:'Falla GPS/equipo. Se revisa historial, cobertura y necesidad de soporte técnico.' }
];
const failureGuideData = {
  'A2k4-A2k8 / Alonso': {
    command: 'Pedir [*][2]. En KPD-800 puede mostrar LED/número; en KPD-860 usar menú/casita si corresponde. Salir o silenciar con [#].',
    codes: {
      '1': 'LED Z1: baja batería del panel o fuente auxiliar.',
      '2': 'LED Z2: falla de alimentación / red 220V / bus o fuente auxiliar.',
      '3': 'LED Z3: falla de reloj o fecha.',
      '4': 'LED Z4: falla de módulos. Si el cliente dice "4" por ruido de teclado, confirmar si realmente es Z4 o si falta leer el LED Z5 de comunicación.',
      '5': 'LED Z5: fallas de comunicación: Tel1, Tel2, ESC1, GPRS, SMS o IP. Si el cliente confirma internet/línea funcionando, pedir emergencia médica de prueba para verificar si restablece comunicación. Esperar unos minutos: si llega la señal, avisar que se regularizó; si no llega, generar servicio técnico.',
      '6': 'LED Z6: falla de supervisión de teclados.',
      '8': 'LED Z8: tamper de teclados.'
    }
  },
  Garnet: {
    command: 'Pedir [*][2] y leer LED/número encendido. Salir o silenciar con [#].',
    codes: {
      '1': 'LED Z1: baja batería del panel o fuente auxiliar.',
      '2': 'LED Z2: falla de alimentación.',
      '3': 'LED Z3: reloj o calendario desactualizado.',
      '4': 'LED Z4: falla de módulos.',
      '5': 'LED Z5: falla de comunicación: línea, datos móviles, SMS o IP. Si el cliente confirma internet/línea funcionando, pedir emergencia médica de prueba para verificar si restablece comunicación. Esperar unos minutos: si llega la señal, avisar que se regularizó; si no llega, generar servicio técnico.',
      '6': 'LED Z6: supervisión de teclados.',
      '8': 'LED Z8: tamper de teclados.'
    }
  },
  DSC: {
    command: 'Pedir [*][2] o tecla FALLO/TROUBLE según teclado. Leer número encendido.',
    codes: {
      '1': 'Servicio requerido / falla interna. Pedir detalle si el teclado lo permite y derivar si persiste.',
      '2': 'Pérdida de alimentación AC / corte 220V.',
      '3': 'Falla de línea telefónica.',
      '4': 'Falla de comunicación con central.',
      '5': 'Falla de zona.',
      '6': 'Tamper de zona.',
      '7': 'Batería baja de dispositivo inalámbrico.',
      '8': 'Pérdida de reloj / fecha.'
    }
  },
  Paradox: {
    command: 'Pedir tecla TBL/FALLO y leer número. En algunos teclados se navega con teclas de flecha o se confirma con ENTER.',
    codes: {
      '1': 'Batería baja o falla de batería.',
      '2': 'Falla de alimentación AC / corte 220V.',
      '3': 'Falla de sirena o salida auxiliar. Validar con técnico.',
      '4': 'Falla de comunicación.',
      '5': 'Falla o tamper de zona. Validar detalle.',
      '6': 'Tamper o falla de módulo. Validar detalle.',
      '7': 'Falla de circuito de fuego. Priorizar validación.',
      '8': 'Pérdida de hora / reloj.'
    }
  },
  NetworX: {
    command: 'Pedir [*][2] o tecla de servicio/fallo según teclado. Leer número encendido y validar con manual.',
    codes: {
      '1': 'Falla del sistema. Requiere detalle/validación.',
      '2': 'Tamper o problema de zona. Requiere detalle.',
      '3': 'Batería baja de zona o sensor.',
      '4': 'Pérdida de supervisión de sensor inalámbrico.',
      '5': 'Falla de zona o problema de sensor. Validar detalle.',
      '6': 'Falla de comunicación o línea según programación. Validar con Bykom/manual.',
      '7': 'Falla de alimentación o batería según programación. Validar.',
      '8': 'Pérdida de reloj / fecha.'
    }
  }
};
const procedureData = [
  { id:'contencion', category:'Alarmas 911', event:'Procedimiento de contención', code:'MON-01 5.1', priority:'Alta', trigger:'Se recibe una señal correspondiente a un evento de seguridad.', checks:['Realizar ronda inicial a teléfonos principales del abonado.', 'Presentarse como Vigilia Seguridad / La Central de Alarmas.', 'Validar palabra clave cuando atiende un referente.', 'Consultar la situación en el objetivo y si requiere servicio público de seguridad.', 'Si no se clarifica la situación o puede haber personas afectadas, informar para envío de fuerza pública y emergencias.'], action:'Verificar, contener y escalar según resultado. Si no hay contacto, dejar en espera y realizar nuevos intentos.', note:'Aplicado procedimiento de contención. Se verificaron teléfonos principales, palabra clave/situación y necesidad de servicio público según corresponda.', automation:'Convertir el evento en árbol guiado: contacto logrado, palabra clave, situación clara, requiere móvil, no contacta.' },
  { id:'panico', category:'Alarmas 911', event:'Señal de pánico / asalto', code:'MON-01 5.2', priority:'Crítica', trigger:'Ingresa señal de pánico o asalto.', checks:['Verificar historial para confirmar que no esté en falla.', 'Revisar si existe nota de pruebas cargada por operador o cliente.', 'Si no hay nota de prueba, verificar llamando al lugar mediante procedimiento de contención.', 'Informar a E-911 o servicio público con datos completos.', 'Luego de unos minutos, verificar novedades e ingresar nota en sistema.'], action:'Tratar como evento crítico. Informar a emergencia si corresponde y registrar novedades posteriores.', note:'Señal de pánico/asalto gestionada. Se verificó historial/notas, se aplicó contención y se informó a emergencia si correspondía.', automation:'Formulario de emergencia con campos obligatorios: dirección, referente, palabra clave, datos adicionales y hora de seguimiento.' },
  { id:'fuego', category:'Alarmas 911', event:'Señal de fuego', code:'MON-01 5.4', priority:'Crítica', trigger:'Ingresa señal de fuego.', checks:['Verificar historial y notas de prueba.', 'Llamar al lugar mediante procedimiento de contención.', 'Informar a emergencias policiales E-911 con datos completos e información adicional.', 'Verificar nuevamente luego de unos minutos.', 'Si está en falla, generar o reiterar orden de mantenimiento informando primero al cliente.'], action:'Gestionar como emergencia. Confirmar, escalar y documentar novedades.', note:'Señal de fuego gestionada. Se verificó historial/notas, se aplicó contención y se informó a emergencia si correspondía.', automation:'Checklist de datos para emergencia: ubicación, tipo de lugar, referente, cámaras, zonas afectadas.' },
  { id:'intrusion', category:'Alarmas 911', event:'Disparo de alarma / intrusión', code:'MON-01 5.6', priority:'Alta', trigger:'Ingresa señal de intrusión.', checks:['Verificar historial para confirmar que no esté en falla o con nota de prueba.', 'Si el sistema no fue desactivado, iniciar contención o verificación.', 'Si desactivan con código autorizado, grabar señal con nota Cancelado con Código Autorizado.', 'Si no fue desactivado, dar aviso a servicio público y emergencia con datos completos.', 'Si cuenta con acuda, avisar al servicio de respuesta.', 'Si hubo rotura del sistema, generar caso para visita técnica.'], action:'Diferenciar cancelado, evento real, acuda y rotura. Escalar solo cuando corresponde y dejar registro claro.', note:'Disparo de alarma gestionado. Se verificó historial/notas, desactivación, necesidad de contención, acuda y/o mantenimiento.', automation:'Árbol de decisión para evitar llamadas o escaladas innecesarias cuando hay cancelación válida.' },
  { id:'falsa-alarma', category:'Alarmas 911', event:'Falsa alarma para seguimiento', code:'MON-01 5.9', priority:'Media', trigger:'Se determina que el disparo entra en categoría de falsa alarma.', checks:['Realizar el procedimiento habitual.', 'Generar orden de mantenimiento si corresponde.', 'Registrar en gestión operativa la condición particular.', 'Clasificar como cancelada, climática, error de usuario o falla de sistema.'], action:'Cerrar con categoría correcta para medir causas repetidas y generar mantenimiento cuando haga falta.', note:'Evento clasificado como falsa alarma para seguimiento. Categoría: cancelada / climática / error de usuario / falla de sistema.', automation:'Dashboard Pareto de falsas alarmas por causa para detectar el 20% que genera más trabajo.' },
  { id:'corte-220', category:'Técnica / Energía', event:'Corte de luz / falta 220V', code:'MON-01 5.10', priority:'Media', trigger:'El evento se presenta como FALTA DE 220 VOLTS / CORTE DE LUZ.', checks:['Dar aviso inmediato por canales telefónicos, SMS o WhatsApp según corresponda.', 'Si la cuenta tiene aviso por SMS, verificar en MSG del historial si el aviso fue enviado.', 'Si el SMS fue enviado correctamente, no es necesario llamar al cliente.', 'Cedular el evento con la descripción Se verificó envío de SMS.'], action:'Primero verificar si el aviso automático ya salió. Evitar llamada innecesaria cuando el SMS fue enviado correctamente.', note:'Corte 220 gestionado. Se verificó MSG/historial y envío de SMS. Si correspondía, no se realizó llamada telefónica.', automation:'Automatizar verificación de aviso enviado y registrar cierre sugerido sin llamada manual.' },
  { id:'bateria-panel', category:'Técnica / Energía', event:'Batería baja de panel', code:'MON-01 5.11', priority:'Media', trigger:'Ingresa señal de batería baja del panel.', checks:['Verificar historial para ver si hubo corte de luz previo.', 'Si hubo corte, contactar al titular para confirmar razón e informar uso de batería auxiliar.', 'Si no hubo corte previo, dejar en espera un tiempo razonable para ver si restaura.', 'Si no restaura, generar orden de mantenimiento para revisar batería.'], action:'Relacionar batería baja con corte de luz antes de generar mantenimiento.', note:'Batería baja panel gestionada. Se verificó historial de corte 220 y se definió espera/contacto/mantenimiento según evolución.', automation:'Regla automática: si batería baja aparece luego de corte 220, sugerir espera y mensaje informativo.' },
  { id:'bateria-sensor', category:'Técnica / Energía', event:'Batería baja de zona o sensor', code:'MON-01 5.12', priority:'Media', trigger:'Ingresa señal de batería baja de zona o sensor.', checks:['Enviar aviso indicando que debe cambiar la batería del sensor.', 'Indicar que luego debe comunicarse con central para poner la cuenta en prueba.', 'Luego procesar la señal.', 'Si ingresa durante turno noche, de 22 a 7, dejar en espera para que abra pantalla a partir de las 07:00.'], action:'No interrumpir de madrugada salvo necesidad crítica. Dejar en espera nocturna y abrir seguimiento a las 07:00.', note:'Batería baja de sensor gestionada. Se informó cambio de batería y prueba posterior, o se dejó en espera hasta 07:00 si ingresó en turno noche.', automation:'Aviso programado por horario y recordatorio automático a las 07:00.' },
  { id:'linea-telefonica', category:'Comunicación', event:'Falla de comunicación por línea telefónica', code:'MON-01 5.13', priority:'Media', trigger:'Se presenta falla de comunicación de línea telefónica.', checks:['Analizar historial de la cuenta y notas anteriores sobre problemas de línea.', 'Informar al titular que verifique su línea.', 'Si no presenta falla, solicitar señal desde teclado para verificar recepción y restaurar vínculo.', 'Si la señal no llega y el cliente no tiene problema de línea, generar mantenimiento.', 'Informar que momentáneamente estará sin monitoreo hasta solucionar el problema.'], action:'Distinguir problema externo de línea, prueba recibida y necesidad real de mantenimiento.', note:'Falla de comunicación línea gestionada. Se revisó historial/notas, se solicitó prueba y se informó estado de monitoreo/mantenimiento.', automation:'Plantilla de contacto y cierre con opción Re-Activar cuando el cliente confirma problema de línea.' },
  { id:'gprs', category:'Comunicación', event:'Falla de comunicación GPRS', code:'MON-01 5.14', priority:'Media', trigger:'Se recibe falla de comunicación GPRS.', checks:['Analizar historial de la cuenta.', 'Transcurrida 1 hora desde la última señal de test, verificar si el equipo continúa en falla.', 'Si no restaura, informar telefónicamente al cliente y solicitar pruebas.', 'Si las pruebas llegan por GPRS, cedular como falla de comunicación.', 'Si no llegan, informar que estará sin monitoreo y analizar posible caída del prestador o mantenimiento.', 'Verificar si cuenta con vínculo alternativo e informar estado.'], action:'Esperar el plazo indicado, comprobar restauración y recién después contactar o derivar.', note:'Falla GPRS gestionada. Se verificó historial, espera de 1 hora, pruebas, vínculo alternativo y necesidad de mantenimiento.', automation:'Temporizador automático de 1 hora y agrupación de fallas por prestador Claro/Movistar.' },
  { id:'ip', category:'Comunicación', event:'Falla de comunicación IP', code:'MON-01 5.15', priority:'Media', trigger:'Se recibe falla de comunicación IP.', checks:['Contactar inmediatamente al cliente para verificar funcionamiento de internet.', 'Si internet no funciona, indicar reinicio de router.', 'Si no restaura o el cliente está sin servicio, informar que estará sin monitoreo hasta solucionar internet.', 'Si internet funciona y aun así no se reciben señales, generar mantenimiento.', 'Si no se contacta a referente, dejar en espera 1 hora y luego hacer nueva ronda.'], action:'Separar falla del servicio de internet de falla propia del sistema.', note:'Falla IP gestionada. Se verificó internet/router, estado de monitoreo y necesidad de mantenimiento.', automation:'Guía de preguntas para detectar proveedor caído vs falla de comunicador.' },
  { id:'agenda-comunicacion', category:'Comunicación', event:'Agenda para seguimiento de fallas de comunicación', code:'MON-01 5.16', priority:'Media', trigger:'Cliente queda sin monitoreo por tema propio o el caso se deriva a otra área.', checks:['Generar agenda en sistema de monitoreo para seguimiento.', 'Realizar seguimiento mensual hasta el tercer mes.', 'Luego del tercer mes, realizar control trimestral.', 'Contactar al cliente desde el recordatorio para verificar persistencia.', 'Si no se contacta, hacer nuevos intentos y enviar mail.', 'Consultar estado de gestiones derivadas a otras áreas mediante caso administrativo.'], action:'Transformar fallas persistentes en seguimiento programado, no en memoria del operador.', note:'Agenda de falla de comunicación generada o revisada. Se registró seguimiento mensual/trimestral y estado de gestiones derivadas.', automation:'Kanban o agenda automática con vencimientos por cuenta y área responsable.' },
  { id:'fuera-horario', category:'Control horario', event:'Desactivación fuera de horario o usuario no autorizado', code:'MON-01 5.17', priority:'Alta', trigger:'Alarma reporta desactivación fuera del día/horario de control horario o por usuario no autorizado.', checks:['Comunicar con titular de la cuenta a teléfonos alternativos.', 'Informar lo sucedido.', 'Si el cliente lo considera necesario, enviar móvil policial al lugar.'], action:'Avisar al titular y dejar que confirme si requiere móvil.', note:'Desactivación fuera de horario/usuario no autorizado informada al titular. Se consultó necesidad de móvil.', automation:'Alerta por horario con contacto sugerido y registro de decisión del titular.' },
  { id:'apertura', category:'Control horario', event:'Fallo de apertura', code:'MON-01 5.18', priority:'Media', trigger:'Cliente con control horario no desactiva en horario acordado más tolerancia.', checks:['Confirmar que el cliente cuenta con control horario.', 'Verificar horario acordado y tolerancia.', 'Dar aviso al titular o encargado a teléfonos alternativos registrados.'], action:'Notificar falta de apertura según control horario.', note:'Fallo de apertura gestionado. Se verificó control horario/tolerancia y se avisó a titular o encargado.', automation:'Aviso automático tras tolerancia configurable por cuenta.' },
  { id:'cierre', category:'Control horario', event:'Fallo de cierre', code:'MON-01 5.19', priority:'Media', trigger:'Cliente con control horario no activa en horario acordado.', checks:['Confirmar que el cliente cuenta con control horario.', 'Verificar horario previamente acordado.', 'Dar aviso al titular o encargado a teléfonos alternativos registrados.'], action:'Notificar falta de cierre para evitar objetivo sin alarma activada.', note:'Fallo de cierre gestionado. Se verificó control horario y se avisó a titular o encargado.', automation:'Mensaje automático a encargado cuando vence horario de cierre.' },
  { id:'enlace', category:'Técnica / Sistema', event:'Falla de enlace', code:'MON-01 5.20', priority:'Media', trigger:'Se recibe señal de falla de enlace.', checks:['Revisar historial para ver si ocurrió antes.', 'Si no ocurrió, contactar al cliente e indicar pasos para reiniciar el sistema de alarma.', 'Si está asociada a batería baja de sensor, recomendar cambio de batería.', 'Si requiere asistencia, gestionar mantenimiento técnico.', 'Si persiste luego de reiniciar y no está asociada a batería baja, gestionar mantenimiento.', 'Si no se logra comunicación, cedular como falsa alarma - falla de sistema generando pedido técnico.'], action:'Resolver por reinicio o batería cuando sea posible; derivar a técnico si persiste.', note:'Falla de enlace gestionada. Se revisó historial, batería de sensor, reinicio y necesidad de mantenimiento.', automation:'Asistente que cruza falla de enlace con batería baja previa.' },
  { id:'llamadas', category:'Atención', event:'Atención de llamadas entrantes', code:'MON-01 5.21', priority:'Media', trigger:'Ingresa una llamada entrante a central.', checks:['Presentarse mencionando sector o empresa.', 'Saludar según horario.', 'Identificarse con nombre.', 'Solicitar nombre del interlocutor.', 'Validar cliente con doble factor: palabra clave más dato adicional.', 'Usar DNI, teléfonos alternativos, contactos o relación con titular como dato adicional.'], action:'Estandarizar atención y validación antes de brindar información o ejecutar cambios.', note:'Llamada entrante atendida con presentación, identificación y doble factor de autenticación.', automation:'Guion corto de llamada y validación obligatoria antes de cambios sensibles.' },
  { id:'mantenimiento', category:'Técnica / Sistema', event:'Orden de mantenimiento', code:'MON-01 5.23', priority:'Media', trigger:'Se necesita generar caso para visita técnica.', checks:['Crear señal manual en sistema de monitoreo.', 'Registrar motivo del mantenimiento.', 'Generar evento con nombre MANTENIMIENTO GENERADO en Bykom.', 'Dejarlo disponible para recepción por Servicio Técnico.'], action:'Estandarizar la carga para que técnica reciba el caso con motivo claro.', note:'Mantenimiento generado en Bykom con motivo registrado para recepción por Servicio Técnico.', automation:'Formulario único de pedido técnico con motivo, origen del evento y prioridad.' },
  { id:'panel-prueba', category:'Técnica / Sistema', event:'Panel en prueba', code:'MON-01 5.24', priority:'Media', trigger:'Técnico o cliente solicita poner panel en prueba.', checks:['Si lo pide un técnico, verificar cuenta y dirección.', 'Agregar nombre y apellido del técnico.', 'Si lo pide el cliente, chequear como pedido técnico y sumar palabra clave u otro dato referente a la cuenta.'], action:'Validar identidad antes de poner panel en prueba.', note:'Panel en prueba gestionado. Se verificó cuenta, dirección e identidad del técnico/cliente.', automation:'Pantalla de validación para evitar pruebas mal cargadas.' },
  { id:'video', category:'Video', event:'Video verificación', code:'MON-01 5.25', priority:'Alta', trigger:'Evento de seguridad en cuenta con servicio de video verificación contratado.', checks:['Antes de iniciar contención, verificar si la cuenta tiene video verificación.', 'Acceder por SMART PSS al sistema de cámaras del objetivo.', 'Visualizar cámaras para confirmar visualmente el evento.', 'Si confirma visualmente, iniciar solicitud de servicio público o E-911 con datos completos.', 'Si no confirma visualmente, iniciar procedimiento inicial de contención.'], action:'Usar cámaras como filtro antes de escalar o como respaldo para emergencia.', note:'Video verificación aplicada. Se revisaron cámaras y se confirmó/no confirmó visualmente el evento antes de definir acción.', automation:'Botón de checklist visual: confirma, no confirma, cámara inaccesible, escalar, contención.' },
  { id:'directivas', category:'Directivas', event:'Procedimientos particulares / notas temporales', code:'MON-01 5.26', priority:'Media', trigger:'Cliente solicita requerimiento particular o temporal.', checks:['Registrar NOTA TEMPORAL con el requerimiento.', 'Definir días determinados de vigencia.', 'Informar al cliente que el pedido se mantendrá por esa cantidad de días.', 'Indicar que debe comunicarse nuevamente antes del vencimiento si quiere continuar.', 'Si hay problema de zona, generar mantenimiento y ofrecer instrucción para anular zona manualmente hasta el service.'], action:'Evitar instrucciones indefinidas o perdidas. Toda excepción debe tener vigencia y responsable.', note:'Procedimiento particular registrado con nota temporal, vigencia y comunicación al cliente.', automation:'Directivas con fecha de vencimiento, alerta de renovación y búsqueda por cliente/palabra clave.' }
];
const els = {};

document.addEventListener('DOMContentLoaded', () => {
  ['loginOverlay','loginForm','loginEmail','loginPassword','loginOperator','loginShift','loginSector','loginStation','loginStatus','sessionBadge','searchInput','systemFilter','results','resultCount','detailPanel','quickSearches','bycomChecked','panelStatus','keyboardModel','alarmPanel','failureCode','failureGuideResult','useFailureGuide','intakeOperator','intakeCaller','intakeAccount','intakeValidated','intakeQuery','intakeAutocomplete','intakeQuick','intakeResult','scriptOperatorName','safeSearch','safeCategory','safeQuick','safeList','safeDetail','safeCount','resourceType','resourceSector','resourceTitle','resourceSystem','resourceUser','resourceSecret','resourceLink','resourceNotes','saveResource','resourceFilter','resourceCount','resourceList','directiveTitle','directiveSource','directiveSector','directiveText','saveDirective','directiveCount','directiveList','learningType','learningOperator','learningSubscriber','learningFailure','learningQuestion','learningContext','learningStatus','learningSuggestion','saveLearning','exportLearning','importLearning','learningSavedState','learningCount','learningList','learningDialog','learningResolveForm','learningDialogTitle','learningDialogContext','resolutionStatus','resolutionCategory','resolutionCause','resolutionProcedure','resolutionBykom','resolutionRoute','resolutionKeywords','saveLearningResolution','copyLearningResolution','closeLearningDialog','learningResolveState','kanbanTitle','kanbanSubscriber','kanbanCategory','kanbanPriority','kanbanDescription','saveKanbanTask','kanbanSavedState','kanbanCount','kanbanStats','kanbanBoard','mTotal','mRemote','mRisk','mAvoided','mPending','paretoMode','paretoChart','metricInsights','operatorChart','shiftChart','learningChart','operatorSummary','satisfactionChart','caseRows','exportCsv','clearCases','savedDialog','closeDialog','pendingButton','procedureSearch','procedureCategory','procedureQuick','procedureList','procedureDetail','procedureCount','procedureAutocomplete'].forEach(id => els[id] = document.getElementById(id));
  setupFirebase();
  setupSession();
  setupTabs();
  setupFilters();
  renderQuickTerms();
  setupIntake();
  setupSafe();
  setupProcedures();
  bindEvents();
  search();
  searchSafe();
  searchProcedures();
  renderDirectives();
  renderResources();
  renderLearning();
  renderKanban();
  renderMetrics();
});

function setupSession() {
  if (state.firebase.auth) {
    els.loginStatus.textContent = 'Conectando con autenticacion...';
    state.firebase.auth.onAuthStateChanged(async user => {
      state.firebase.currentUser = user || null;
      if (!user) {
        localStorage.removeItem(SESSION_KEY);
        if (state.firebase.unsubscribeLearning) state.firebase.unsubscribeLearning();
        if (state.firebase.unsubscribeKanban) state.firebase.unsubscribeKanban();
        state.firebase.learning = [];
        state.firebase.kanban = [];
        state.firebase.loaded = false;
        document.body.classList.add('auth-gate');
        els.loginOverlay.classList.remove('hidden');
        els.sessionBadge.textContent = 'Sin sesion';
        els.loginStatus.textContent = 'Ingresá con usuario y contraseña.';
        applyPrivilegeVisibility();
        return;
      }
      const profile = await loadUserProfile(user);
      state.firebase.userProfile = profile;
      const session = {
        uid: user.uid,
        email: user.email || '',
        operator: profile.name || user.displayName || user.email || 'Operador',
        shift: profile.shift || els.loginShift.value || 'Sin turno',
        sector: profile.sector || els.loginSector.value || 'Sin sector',
        station: profile.station || els.loginStation?.value || 'Estación sin asignar',
        role: profile.role || 'operador',
        level: Number(profile.level || 1),
        active: profile.active !== false,
        startedAt: new Date().toISOString()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      applySession(session);
      if (session.active === false) return;
      subscribeLearningCloud();
      subscribeKanbanCloud();
      renderMetrics();
    });
  } else {
    const session = getSession();
    if (session.operator) applySession(session);
  }
  els.loginForm.addEventListener('submit', event => {
    event.preventDefault();
    if (state.firebase.auth) {
      signInWithFirebase();
      return;
    }
    const next = {
      operator: els.loginOperator.value.trim(),
      shift: els.loginShift.value,
      sector: els.loginSector.value,
      station: els.loginStation?.value || 'Estación local',
      role: 'operador local',
      level: 1,
      active: true,
      startedAt: new Date().toISOString()
    };
    if (!next.operator) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    applySession(next);
    renderMetrics();
  });
}

async function signInWithFirebase() {
  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;
  if (!email || !password) {
    els.loginStatus.textContent = 'Cargá usuario/email y contraseña.';
    return;
  }
  els.loginStatus.textContent = 'Validando usuario...';
  try {
    await state.firebase.auth.signInWithEmailAndPassword(email, password);
    els.loginPassword.value = '';
  } catch (error) {
    console.error('No se pudo iniciar sesion', error);
    els.loginStatus.textContent = 'No se pudo ingresar. Verificá usuario, contraseña o que el usuario esté habilitado.';
  }
}

async function loadUserProfile(user) {
  const fallback = {
    name: user.displayName || user.email || 'Operador',
    email: user.email || '',
    role: 'sin perfil',
    level: 0,
    sector: els.loginSector?.value || 'Monitoreo 911',
    station: els.loginStation?.value || 'Estación sin asignar',
    active: false,
    missingProfile: true
  };
  if (!state.firebase.db) return fallback;
  try {
    const snap = await state.firebase.db.collection('usuarios').doc(user.uid).get();
    if (!snap.exists) return fallback;
    return normalizeUserProfile({ ...fallback, ...snap.data(), uid: user.uid, missingProfile: false });
  } catch (error) {
    console.error('No se pudo leer perfil de usuario', error);
    return fallback;
  }
}

function normalizeUserProfile(profile) {
  const normalized = { ...profile };
  const pairs = [
    ['Name', 'name'],
    ['Email', 'email'],
    ['Role', 'role'],
    ['Level', 'level'],
    ['Sector', 'sector'],
    ['Shift', 'shift'],
    ['Station', 'station'],
    ['Estacion', 'station'],
    ['Estación', 'station'],
    ['Active', 'active']
  ];
  pairs.forEach(([from, to]) => {
    if (normalized[to] === undefined && normalized[from] !== undefined) {
      normalized[to] = normalized[from];
    }
  });
  return normalized;
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}'); }
  catch { return {}; }
}

function applySession(session) {
  document.body.classList.remove('auth-gate');
  els.loginOverlay.classList.add('hidden');
  els.sessionBadge.innerHTML = `<div class="session-user"><b>${escapeHtml(session.operator)}</b><span>Nivel ${escapeHtml(String(session.level || 1))} · ${escapeHtml(session.role || 'operador')}</span></div><div class="session-chip">Turno: ${escapeHtml(session.shift || 'Sin turno')}</div><div class="session-chip">Sector: ${escapeHtml(session.sector || 'Sin sector')}</div><div class="session-chip">Estación: ${escapeHtml(session.station || 'Sin estación')}</div><button id="logoutSession" type="button">Salir</button>`;
  document.getElementById('logoutSession').addEventListener('click', async () => {
    localStorage.removeItem(SESSION_KEY);
    if (state.firebase.auth) await state.firebase.auth.signOut();
    document.body.classList.add('auth-gate');
    els.loginOverlay.classList.remove('hidden');
  });
  if (els.intakeOperator && !els.intakeOperator.value) els.intakeOperator.value = session.operator;
  if (els.learningOperator && !els.learningOperator.value) els.learningOperator.value = session.operator;
  updateIntakeScript();
  applyPrivilegeVisibility();
  if (session.active === false) {
    document.body.classList.add('auth-gate');
    els.loginOverlay.classList.remove('hidden');
    els.loginStatus.textContent = 'Usuario inactivo. Pedile a un administrador que habilite el perfil.';
  }
}

function currentLevel() {
  return Number(getSession().level || 0);
}

function canAccess(minLevel) {
  return currentLevel() >= minLevel;
}

function applyPrivilegeVisibility() {
  const rules = {
    supervision: 8,
    metrics: 8,
    cases: 8
  };
  document.querySelectorAll('.tab').forEach(tab => {
    const min = rules[tab.dataset.tab] || 1;
    tab.disabled = !canAccess(min);
    tab.title = tab.disabled ? `Requiere nivel ${min} o superior` : '';
  });
  const activeTab = document.querySelector('.tab.active');
  if (activeTab?.disabled) document.querySelector('[data-tab="intake"]').click();
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
    if (btn.disabled) return;
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'kanban') renderKanban();
    if (btn.dataset.tab === 'resources') renderResources();
    renderMetrics();
  }));
}

function setupFilters() {
  const systems = ['Todos los sistemas', ...data.systems.filter(s => s.count > 0).map(s => s.name)];
  els.systemFilter.innerHTML = systems.map(s => `<option>${escapeHtml(s)}</option>`).join('');
}

function renderQuickTerms() {
  els.quickSearches.innerHTML = quickTerms.map(term => `<button type="button" data-term="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join('');
  els.quickSearches.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    els.searchInput.value = btn.dataset.term;
    search();
  }));
}

function setupIntake() {
  if (!els.intakeQuick) return;
  els.intakeQuick.innerHTML = intakeQuickTerms.map(term => `<button type="button" data-term="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join('');
  els.intakeQuick.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    els.intakeQuery.value = btn.dataset.term;
    renderIntakeResult();
    renderIntakeAutocomplete();
  }));
  updateIntakeScript();
  renderIntakeResult();
}

function setupSafe() {
  els.safeQuick.innerHTML = safeQuickTerms.map(term => `<button type="button" data-term="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join('');
  els.safeQuick.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    els.safeSearch.value = btn.dataset.term;
    searchSafe();
  }));
}

function setupProcedures() {
  const categories = ['Todas las categorías', ...new Set(procedureData.map(item => item.category))];
  els.procedureCategory.innerHTML = categories.map(category => `<option>${escapeHtml(category)}</option>`).join('');
  els.procedureQuick.innerHTML = procedureQuickTerms.map(term => `<button type="button" data-term="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join('');
  els.procedureQuick.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    applyProcedureSearch(btn.dataset.term);
  }));
}

function bindEvents() {
  els.searchInput.addEventListener('input', search);
  els.systemFilter.addEventListener('change', search);
  els.alarmPanel.addEventListener('change', renderFailureGuide);
  els.failureCode.addEventListener('input', renderFailureGuide);
  els.useFailureGuide.addEventListener('click', applyFailureGuideSearch);
  els.intakeOperator.addEventListener('input', updateIntakeScript);
  ['intakeCaller','intakeAccount','intakeValidated'].forEach(id => els[id].addEventListener('input', renderIntakeResult));
  els.intakeValidated.addEventListener('change', renderIntakeResult);
  els.intakeQuery.addEventListener('input', () => {
    renderIntakeResult();
    renderIntakeAutocomplete();
  });
  els.intakeQuery.addEventListener('focus', renderIntakeAutocomplete);
  els.intakeQuery.addEventListener('keydown', handleIntakeKeys);
  els.safeSearch.addEventListener('input', searchSafe);
  els.safeCategory.addEventListener('change', searchSafe);
  els.procedureSearch.addEventListener('input', () => {
    searchProcedures();
    renderProcedureAutocomplete();
  });
  els.procedureSearch.addEventListener('focus', renderProcedureAutocomplete);
  els.procedureSearch.addEventListener('keydown', handleProcedureAutocompleteKeys);
  els.procedureCategory.addEventListener('change', () => {
    searchProcedures();
    renderProcedureAutocomplete();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.procedure-search-box')) hideProcedureAutocomplete();
    if (!event.target.closest('.intake-search-wrap')) hideIntakeAutocomplete();
  });
  els.saveDirective.addEventListener('click', saveDirective);
  ['learningSubscriber','learningFailure','learningQuestion','learningContext'].forEach(id => els[id].addEventListener('input', renderLearningSuggestion));
  els.saveLearning.addEventListener('click', saveLearning);
  els.exportLearning.addEventListener('click', exportLearningBackup);
  els.importLearning.addEventListener('change', importLearningBackup);
  els.closeLearningDialog?.addEventListener('click', () => els.learningDialog.close());
  els.saveLearningResolution?.addEventListener('click', saveLearningResolution);
  els.copyLearningResolution?.addEventListener('click', copyLearningResolution);
  els.saveKanbanTask?.addEventListener('click', saveKanbanTask);
  els.paretoMode?.addEventListener('change', renderMetrics);
  document.querySelectorAll('[data-sector-action]').forEach(btn => {
    btn.addEventListener('click', () => handleSectorAction(btn.dataset.sector, btn.dataset.sectorAction));
  });
  els.saveResource?.addEventListener('click', saveResource);
  els.resourceFilter?.addEventListener('change', renderResources);
  els.pendingButton.addEventListener('click', showPendingForm);
  els.exportCsv.addEventListener('click', exportCsv);
  els.clearCases.addEventListener('click', () => {
    if (confirm('¿Limpiar el historial local de casos?')) {
      localStorage.removeItem(STORAGE_KEY);
      renderMetrics();
    }
  });
  els.closeDialog.addEventListener('click', () => els.savedDialog.close());
}

function setupFirebase() {
  const config = window.VIGILIA_FIREBASE_CONFIG;
  if (!config || !window.firebase || !window.firebase.firestore) {
    state.firebase.status = 'Modo local: la base central no esta disponible en este navegador.';
    renderLearningSavedState();
    return;
  }
  try {
    const app = window.firebase.apps?.length ? window.firebase.app() : window.firebase.initializeApp(config);
    state.firebase.db = app.firestore();
    if (window.firebase.auth) state.firebase.auth = app.auth();
    state.firebase.enabled = true;
    state.firebase.status = 'Conectando con base central...';
    if (!state.firebase.auth) {
      subscribeLearningCloud();
      subscribeKanbanCloud();
    }
  } catch (error) {
    console.error('Firebase no pudo iniciar', error);
    state.firebase.status = 'Modo local: no se pudo conectar con Firebase.';
    renderLearningSavedState();
  }
}

function subscribeLearningCloud() {
  if (!state.firebase.db) return;
  if (state.firebase.unsubscribeLearning) state.firebase.unsubscribeLearning();
  const collection = state.firebase.db.collection('eventos_en_espera');
  const query = currentLevel() >= 8 || !state.firebase.currentUser
    ? collection.orderBy('date', 'desc')
    : collection.where('operatorUid', '==', state.firebase.currentUser.uid).orderBy('date', 'desc');
  state.firebase.unsubscribeLearning = query
    .onSnapshot(snapshot => {
      state.firebase.learning = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      state.firebase.loaded = true;
      state.firebase.status = 'Base central conectada';
      migrateLocalLearningToCloud();
      renderLearning();
      renderMetrics();
      renderLearningSavedState();
    }, error => {
      console.error('No se pudieron leer eventos en Firestore', error);
      state.firebase.loaded = false;
      state.firebase.status = 'Modo local: Firestore no permitio leer datos.';
      renderLearning();
      renderMetrics();
      renderLearningSavedState();
    });
}

function learningCollection() {
  return state.firebase.db?.collection('eventos_en_espera');
}

function getLearningRows() {
  return state.firebase.loaded ? state.firebase.learning : getStoredRows(LEARNING_KEY);
}

function getLearningDocId(row) {
  const base = [row.date, row.subscriber, row.failure, row.context].join('|');
  return `evt_${hashString(base)}`;
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

async function saveLearningToCloud(row) {
  const collection = learningCollection();
  if (!collection) return false;
  const session = getSession();
  const enriched = {
    ...row,
    operatorUid: row.operatorUid || session.uid || state.firebase.currentUser?.uid || '',
    operatorEmail: row.operatorEmail || session.email || state.firebase.currentUser?.email || '',
    role: row.role || session.role || 'operador',
    level: Number(row.level || session.level || 1),
    operator: row.operator || session.operator || 'Sin operador'
  };
  const payload = {
    ...enriched,
    updatedAt: new Date().toISOString()
  };
  if (window.firebase?.firestore?.FieldValue) payload.savedAt = window.firebase.firestore.FieldValue.serverTimestamp();
  await collection.doc(getLearningDocId(enriched)).set(payload, { merge: true });
  state.firebase.lastCloudSave = new Date().toISOString();
  state.firebase.status = 'Base central conectada';
  return true;
}

async function syncLearningRowsToCloud(rows) {
  if (!state.firebase.enabled || !learningCollection()) return;
  await Promise.all(rows.map(row => saveLearningToCloud(row).catch(error => {
    console.error('No se pudo sincronizar evento local', error);
  })));
}

function migrateLocalLearningToCloud() {
  const localRows = getStoredRows(LEARNING_KEY);
  if (!localRows.length || !state.firebase.enabled || state.firebase.migratedLocal) return;
  state.firebase.migratedLocal = true;
  syncLearningRowsToCloud(localRows);
}

function kanbanCollection() {
  return state.firebase.db?.collection('kanban_tareas');
}

function getKanbanRows() {
  const rows = state.firebase.kanban?.length ? state.firebase.kanban : getStoredRows(KANBAN_KEY);
  const session = getSession();
  if (currentLevel() >= 8 || !session.uid) return rows;
  return rows.filter(row => !row.operatorUid || row.operatorUid === session.uid);
}

function getKanbanDocId(row) {
  if (row.id) return row.id;
  const base = [row.createdAt, row.title, row.subscriber, row.operatorUid].join('|');
  return `kb_${hashString(base)}`;
}

function subscribeKanbanCloud() {
  if (!state.firebase.db) return;
  if (state.firebase.unsubscribeKanban) state.firebase.unsubscribeKanban();
  const collection = state.firebase.db.collection('kanban_tareas');
  const query = currentLevel() >= 8 || !state.firebase.currentUser
    ? collection
    : collection.where('operatorUid', '==', state.firebase.currentUser.uid);
  state.firebase.unsubscribeKanban = query
    .onSnapshot(snapshot => {
      state.firebase.kanban = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderKanban();
      renderMetrics();
    }, error => {
      console.error('No se pudo leer Kanban en Firestore', error);
      els.kanbanSavedState.textContent = 'Modo local: no se pudo leer Kanban central.';
      renderKanban();
    });
}

async function saveKanbanTask() {
  const title = els.kanbanTitle.value.trim();
  if (!title) {
    els.kanbanSavedState.textContent = 'Cargá un título para la tarjeta.';
    return;
  }
  const session = getSession();
  const row = {
    title,
    subscriber: els.kanbanSubscriber.value.trim(),
    category: els.kanbanCategory.value,
    priority: els.kanbanPriority.value,
    description: els.kanbanDescription.value.trim(),
    column: 'por-hacer',
    operator: session.operator || 'Sin operador',
    operatorUid: session.uid || '',
    shift: session.shift || 'Sin turno',
    sector: session.sector || 'Sin sector',
    station: session.station || 'Sin estación',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    movements: []
  };
  await upsertKanbanTask(row);
  els.kanbanTitle.value = '';
  els.kanbanSubscriber.value = '';
  els.kanbanDescription.value = '';
  els.kanbanSavedState.textContent = 'Tarjeta agregada al tablero.';
  renderKanban();
  renderMetrics();
}

async function upsertKanbanTask(row) {
  const docId = getKanbanDocId(row);
  const payload = { ...row, id: docId, updatedAt: new Date().toISOString() };
  if (state.firebase.enabled && kanbanCollection()) {
    const cloudPayload = { ...payload };
    delete cloudPayload.id;
    if (window.firebase?.firestore?.FieldValue) cloudPayload.savedAt = window.firebase.firestore.FieldValue.serverTimestamp();
    await kanbanCollection().doc(docId).set(cloudPayload, { merge: true });
    return;
  }
  const rows = getStoredRows(KANBAN_KEY);
  const index = rows.findIndex(item => getKanbanDocId(item) === docId);
  if (index >= 0) rows[index] = payload; else rows.push(payload);
  localStorage.setItem(KANBAN_KEY, JSON.stringify(rows));
}

async function moveKanbanTask(id, direction) {
  const rows = getKanbanRows();
  const row = rows.find(item => getKanbanDocId(item) === id);
  if (!row) return;
  const currentIndex = Math.max(0, kanbanColumns.findIndex(column => column.id === row.column));
  const nextIndex = Math.max(0, Math.min(kanbanColumns.length - 1, currentIndex + direction));
  if (nextIndex === currentIndex) return;
  const session = getSession();
  const next = {
    ...row,
    column: kanbanColumns[nextIndex].id,
    movements: [
      ...(row.movements || []),
      {
        from: kanbanColumns[currentIndex].id,
        to: kanbanColumns[nextIndex].id,
        operator: session.operator || 'Sin operador',
        date: new Date().toISOString()
      }
    ]
  };
  await upsertKanbanTask(next);
  renderKanban();
  renderMetrics();
}

async function addLearningToKanban(id) {
  const row = findLearningRow(id);
  if (!row) return;
  const session = getSession();
  const task = {
    title: row.failure || row.question || 'Evento en espera',
    subscriber: row.subscriber || '',
    category: inferLearningCategory(row),
    priority: normalize(row.status).includes('pendiente') ? 'Alta' : 'Media',
    description: [row.question, row.context, row.suggestion ? `Sugerencia: ${row.suggestion}` : ''].filter(Boolean).join('\n'),
    column: 'en-espera',
    operator: session.operator || row.operator || 'Sin operador',
    operatorUid: session.uid || row.operatorUid || '',
    shift: session.shift || row.shift || 'Sin turno',
    sector: session.sector || row.sector || 'Sin sector',
    station: session.station || 'Sin estación',
    sourceLearningId: id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    movements: []
  };
  await upsertKanbanTask(task);
  els.learningSavedState.textContent = 'Evento enviado al Kanban.';
  renderKanban();
  renderMetrics();
}

function renderKanban() {
  if (!els.kanbanBoard) return;
  const rows = getKanbanRows().slice().sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  els.kanbanCount.textContent = `${rows.length} tarjetas`;
  els.kanbanStats.innerHTML = renderKanbanStats(rows);
  els.kanbanBoard.innerHTML = kanbanColumns.map(column => renderKanbanColumn(column, rows.filter(row => (row.column || 'por-hacer') === column.id))).join('');
  els.kanbanBoard.querySelectorAll('[data-move-kanban]').forEach(btn => {
    btn.addEventListener('click', () => moveKanbanTask(btn.dataset.moveKanban, Number(btn.dataset.direction)));
  });
}

function renderKanbanStats(rows) {
  const resolved = rows.filter(row => ['resuelto', 'procedimiento'].includes(row.column)).length;
  const waiting = rows.filter(row => ['en-espera', 'supervision'].includes(row.column)).length;
  const critical = rows.filter(row => row.priority === 'Crítica' || row.priority === 'Alta').length;
  return `<div><b>${rows.length}</b><span>Total</span></div><div><b>${resolved}</b><span>Resueltas</span></div><div><b>${waiting}</b><span>En espera/supervisión</span></div><div><b>${critical}</b><span>Alta criticidad</span></div>`;
}

function renderKanbanColumn(column, rows) {
  return `<section class="kanban-column">
    <div class="kanban-column-head"><div><h3>${escapeHtml(column.label)}</h3><p>${escapeHtml(column.hint)}</p></div><span>${rows.length}</span></div>
    <div class="kanban-cards">${rows.length ? rows.map(renderKanbanCard).join('') : '<div class="kanban-empty">Sin tarjetas</div>'}</div>
  </section>`;
}

function renderKanbanCard(row) {
  const id = getKanbanDocId(row);
  const currentIndex = Math.max(0, kanbanColumns.findIndex(column => column.id === (row.column || 'por-hacer')));
  return `<article class="kanban-card priority-${normalize(row.priority || 'media')}">
    <p class="eyebrow">${escapeHtml(row.priority || 'Media')} · ${escapeHtml(row.category || 'Sin categoría')}</p>
    <h3>${escapeHtml(row.title || 'Sin título')}</h3>
    <p>${escapeHtml(row.subscriber || 'Sin abonado')}</p>
    <p>${escapeHtml(row.description || '')}</p>
    <div class="kanban-card-meta">${escapeHtml(row.operator || 'Sin operador')} · ${escapeHtml(row.shift || 'Sin turno')}</div>
    <div class="kanban-move">
      <button type="button" data-move-kanban="${escapeHtml(id)}" data-direction="-1" ${currentIndex === 0 ? 'disabled' : ''}>←</button>
      <button type="button" data-move-kanban="${escapeHtml(id)}" data-direction="1" ${currentIndex === kanbanColumns.length - 1 ? 'disabled' : ''}>→</button>
    </div>
  </article>`;
}

function updateIntakeScript() {
  const name = els.intakeOperator.value.trim() || 'operador';
  els.scriptOperatorName.textContent = name;
}

function scoreIntakeRule(rule, terms, fullQuery) {
  if (!terms.length) return 0;
  const haystack = normalize([rule.title, rule.sector, rule.priority, rule.action, rule.route, ...rule.keywords, ...rule.questions].join(' '));
  let score = 0;
  terms.forEach(term => {
    if (haystack.includes(term)) score += 3;
    rule.keywords.forEach(keyword => {
      const cleanKeyword = normalize(keyword);
      if (cleanKeyword === term) score += 7;
      if (cleanKeyword.includes(term) || term.includes(cleanKeyword)) score += 2;
    });
  });
  if (normalize(rule.title).includes(fullQuery)) score += 10;
  if (normalize(rule.route).includes(fullQuery)) score += 4;
  return score;
}

function analyzeIntake() {
  const query = normalize(els.intakeQuery.value).trim();
  const terms = query.split(/\s+/).filter(term => term.length > 2 && !intakeStopWords.has(term));
  if (!terms.length) return [];
  return intakeRules
    .map(rule => ({ rule, score: scoreIntakeRule(rule, terms, query) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.rule);
}

function clearIntakeAutoRoute() {
  if (state.intakeRouteTimer) {
    clearTimeout(state.intakeRouteTimer);
    state.intakeRouteTimer = null;
  }
}

function scheduleIntakeAutoRoute(rule) {
  const query = els.intakeQuery.value.trim();
  const normalizedQuery = normalize(query);
  const routeKey = `${rule.id}|${normalizedQuery}`;
  clearIntakeAutoRoute();
  if (query.length < 6 || state.lastIntakeRouteKey === routeKey) return;
  state.intakeRouteTimer = setTimeout(() => {
    const currentQuery = els.intakeQuery.value.trim();
    const currentRule = analyzeIntake()[0];
    if (!currentRule || currentRule.id !== rule.id || normalize(currentQuery) !== normalizedQuery) return;
    state.lastIntakeRouteKey = routeKey;
    applyIntakePrimary(rule, { automatic: true });
  }, 900);
}

function renderIntakeResult() {
  const matches = analyzeIntake();
  if (!els.intakeQuery.value.trim()) {
    clearIntakeAutoRoute();
    state.lastIntakeRouteKey = '';
    els.intakeResult.innerHTML = '<div class="empty-state"><h2>Ingresá una consulta</h2><p>La recomendación de atención y derivación aparecerá acá.</p></div>';
    return;
  }
  if (!matches.length) {
    clearIntakeAutoRoute();
    els.intakeResult.innerHTML = `<div class="empty-state"><h2>Consulta no clasificada</h2><p>Tomá datos, validá cuenta y registrá la duda para convertirla en procedimiento.</p><button type="button" class="primary" id="intakePending">Registrar como pendiente</button></div>`;
    document.getElementById('intakePending').addEventListener('click', applyIntakeToPending);
    return;
  }
  const primary = matches[0];
  const validated = els.intakeValidated.checked;
  const caller = els.intakeCaller.value.trim() || 'Interlocutor no cargado';
  const account = els.intakeAccount.value.trim() || 'Cuenta/domicilio no cargado';
  els.intakeResult.innerHTML = `<div class="intake-result-head"><div><p class="eyebrow">Recomendación inicial</p><h2>${escapeHtml(primary.title)}</h2><p>${escapeHtml(primary.route)}</p></div><span class="decision ${primary.priority === 'Alta' ? 'warning' : primary.priority === 'Baja' ? '' : ''}">${escapeHtml(primary.priority)}</span></div>
    <div class="routing-grid">
      <div class="route-card"><b>Sector sugerido</b><p>${escapeHtml(primary.sector)}</p></div>
      <div class="route-card"><b>Validación</b><p>${validated ? 'Cuenta validada. Continuar con procedimiento.' : 'Antes de operar, pedir palabra clave o dato adicional.'}</p></div>
      <div class="route-card"><b>Datos tomados</b><p>${escapeHtml(caller)} · ${escapeHtml(account)}</p></div>
    </div>
    <div class="step"><b>Preguntas guía</b><ol class="procedure-checks">${primary.questions.map(question => `<li>${escapeHtml(question)}</li>`).join('')}</ol></div>
    <div class="step"><b>Acción inicial</b><div class="procedure-copy">${escapeHtml(primary.action)}</div></div>
    ${renderIntakeAlternatives(matches.slice(1, 4))}
    <div class="close-box intake-close"><p class="eyebrow">Registro sugerido</p><h2>Resumen para derivar o cargar caso</h2><textarea id="intakeNote">${escapeHtml(makeIntakeNote(primary))}</textarea><div class="actions">${intakeActionButtons(primary)}</div></div>`;
  document.getElementById('intakeOpenSolution').addEventListener('click', () => applyIntakePrimary(primary));
  document.getElementById('copyIntakeNote').addEventListener('click', copyIntakeNote);
  document.getElementById('intakePending').addEventListener('click', applyIntakeToPending);
  const manualBtn = document.getElementById('intakeManual');
  const safeBtn = document.getElementById('intakeSafe');
  const proceduresBtn = document.getElementById('intakeProcedures');
  if (manualBtn) manualBtn.addEventListener('click', () => applyIntakeToManual(primary));
  if (safeBtn) safeBtn.addEventListener('click', () => applyIntakeToSafe(primary));
  if (proceduresBtn) proceduresBtn.addEventListener('click', () => applyIntakeToProcedures(primary));
  document.querySelectorAll('.intake-alt-list button').forEach(btn => btn.addEventListener('click', () => chooseIntakeSuggestion(btn.dataset.id)));
  scheduleIntakeAutoRoute(primary);
}

function renderIntakeAlternatives(alternatives) {
  if (!alternatives.length) return '';
  return `<div class="step"><b>Otras posibilidades</b><div class="intake-alt-list">${alternatives.map(rule => `<button type="button" data-id="${rule.id}"><strong>${escapeHtml(rule.title)}</strong><span>${escapeHtml(rule.sector)}</span></button>`).join('')}</div></div>`;
}

function intakeActionButtons(rule) {
  const buttons = ['<button class="primary" id="intakeOpenSolution" type="button">Abrir solución sugerida</button>', '<button id="copyIntakeNote" type="button">Copiar resumen</button>'];
  if (rule.id === 'manual-tecnico' || rule.id === 'camaras-app') buttons.push('<button id="intakeManual" type="button">Ir a Objetivo Fijo</button>');
  if (rule.id === 'safe') buttons.push('<button id="intakeSafe" type="button">Ir a SAFE</button>');
  if (rule.id === 'evento-911') buttons.push('<button id="intakeProcedures" type="button">Ir a Procedimientos</button>');
  buttons.push('<button id="intakePending" type="button">Registrar duda</button>');
  return buttons.join('');
}

function makeIntakeNote(rule) {
  const caller = els.intakeCaller.value.trim() || 'Sin interlocutor cargado';
  const account = els.intakeAccount.value.trim() || 'Sin abonado/domicilio cargado';
  const query = els.intakeQuery.value.trim() || 'Sin consulta cargada';
  const validation = els.intakeValidated.checked ? 'Cuenta validada.' : 'Cuenta pendiente de validación.';
  return `Ingreso de consulta: ${query}. Cliente/interlocutor: ${caller}. Cuenta/domicilio: ${account}. ${validation} Clasificación sugerida: ${rule.title}. Sector: ${rule.sector}. Prioridad: ${rule.priority}. Acción inicial: ${rule.action} Derivación: ${rule.route}`;
}

function renderIntakeAutocomplete() {
  const matches = analyzeIntake().slice(0, 6);
  if (!els.intakeQuery.value.trim() || !matches.length) return hideIntakeAutocomplete();
  state.intakeSuggestIndex = Math.min(state.intakeSuggestIndex, matches.length - 1);
  els.intakeAutocomplete.innerHTML = matches.map((rule, index) => `<button type="button" role="option" class="${index === state.intakeSuggestIndex ? 'active' : ''}" data-id="${rule.id}"><strong>${escapeHtml(rule.title)}</strong><span>${escapeHtml(rule.sector)} · prioridad ${escapeHtml(rule.priority)}</span></button>`).join('');
  els.intakeAutocomplete.classList.add('active');
  els.intakeAutocomplete.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => chooseIntakeSuggestion(btn.dataset.id)));
}

function hideIntakeAutocomplete() {
  els.intakeAutocomplete.classList.remove('active');
  els.intakeAutocomplete.innerHTML = '';
  state.intakeSuggestIndex = 0;
}

function chooseIntakeSuggestion(id) {
  const rule = intakeRules.find(item => item.id === id);
  if (!rule) return;
  els.intakeQuery.value = rule.title;
  hideIntakeAutocomplete();
  renderIntakeResult();
}

function handleIntakeAutocompleteKeys(event) {
  const options = [...els.intakeAutocomplete.querySelectorAll('button')];
  if (!options.length) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    state.intakeSuggestIndex = (state.intakeSuggestIndex + 1) % options.length;
    renderIntakeAutocomplete();
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    state.intakeSuggestIndex = (state.intakeSuggestIndex - 1 + options.length) % options.length;
    renderIntakeAutocomplete();
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    chooseIntakeSuggestion(options[state.intakeSuggestIndex].dataset.id);
  }
  if (event.key === 'Escape') hideIntakeAutocomplete();
}

function handleIntakeKeys(event) {
  const options = [...els.intakeAutocomplete.querySelectorAll('button')];
  if (options.length) {
    handleIntakeAutocompleteKeys(event);
    return;
  }
  if (event.key === 'Enter') {
    const primary = analyzeIntake()[0];
    if (primary) {
      event.preventDefault();
      clearIntakeAutoRoute();
      applyIntakePrimary(primary);
    }
  }
}

async function copyIntakeNote() {
  const text = document.getElementById('intakeNote').value;
  try { await navigator.clipboard.writeText(text); }
  catch { document.getElementById('intakeNote').select(); document.execCommand('copy'); }
}

function applyIntakeToManual(rule) {
  document.querySelector('[data-tab="call"]').click();
  els.searchInput.value = els.intakeQuery.value || rule.title;
  search();
}

function applyIntakePrimary(rule, options = {}) {
  if (!options.automatic) clearIntakeAutoRoute();
  if (rule.id === 'safe') return applyIntakeToSafe(rule);
  if (rule.id === 'evento-911') return applyIntakeToProcedures(rule);
  if (rule.id === 'manual-tecnico' || rule.id === 'camaras-app') return applyIntakeToManual(rule);
  if (rule.id === 'baja-reclamo') return document.querySelector('[data-tab="supervision"]').click();
  applyIntakeToPending();
}

function applyIntakeToSafe(rule) {
  document.querySelector('[data-tab="safe"]').click();
  els.safeSearch.value = els.intakeQuery.value || rule.title;
  searchSafe();
}

function applyIntakeToProcedures(rule) {
  document.querySelector('[data-tab="procedures"]').click();
  els.procedureSearch.value = els.intakeQuery.value || rule.title;
  searchProcedures();
  renderProcedureAutocomplete();
}

function applyIntakeToPending() {
  document.querySelector('[data-tab="call"]').click();
  els.searchInput.value = els.intakeQuery.value;
  showPendingForm();
}

function goToTab(tabId) {
  document.querySelector(`[data-tab="${tabId}"]`)?.click();
}

function getSectorContext(sector) {
  if (sector === 'SAFE') {
    const item = state.selectedSafe || state.safeResults[0];
    return {
      tab: 'safe',
      sectorLabel: 'SAFE / Objetivos Móviles',
      title: item?.event || els.safeSearch.value || 'Consulta SAFE sin clasificar',
      query: els.safeSearch.value || item?.event || '',
      context: item ? `Evento SAFE seleccionado: ${item.event}\nCategoría: ${item.category}\nDisparador: ${item.trigger}\nAcción sugerida: ${item.action}` : 'Consulta SAFE pendiente de clasificar.',
      kanbanCategory: 'SAFE'
    };
  }
  const item = state.selected || state.results[0];
  return {
    tab: 'call',
    sectorLabel: 'Objetivo Fijo 911',
    title: item?.issue || els.searchInput.value || 'Consulta 911 sin clasificar',
    query: els.searchInput.value || item?.issue || '',
    context: item ? `Consulta 911 seleccionada: ${item.issue}\nSistema: ${item.system}\nGuía inicial: ${item.command || item.action || 'Sin guía cargada'}` : 'Consulta 911 pendiente de clasificar.',
    kanbanCategory: 'Evento 911'
  };
}

function handleSectorAction(sector, action) {
  const info = getSectorContext(sector);
  if (action === 'search') {
    goToTab(info.tab);
    const target = sector === 'SAFE' ? els.safeSearch : els.searchInput;
    target?.focus();
    return;
  }
  if (action === 'kanban') {
    prefillKanbanFromSector(info);
    return;
  }
  if (action === 'password' || action === 'material') {
    prefillResourceFromSector(info, action);
    return;
  }
  prefillLearningFromSector(info, action);
}

function prefillLearningFromSector(info, action) {
  const session = getSession();
  goToTab('learning');
  if (els.learningType) els.learningType.value = action === 'suggestion' ? 'Sugerencia de mejora' : 'Duda operativa';
  els.learningOperator.value = session.operator || els.learningOperator.value || '';
  els.learningSubscriber.value = els.learningSubscriber.value || 'Sin abonado cargado';
  els.learningFailure.value = action === 'suggestion'
    ? `Mejora sugerida - ${info.sectorLabel}`
    : info.title;
  els.learningQuestion.value = action === 'suggestion'
    ? 'Qué mejora, procedimiento o dato debería agregarse al sistema'
    : `Qué criterio falta validar sobre ${info.title}`;
  els.learningContext.value = `Sector: ${info.sectorLabel}\nConsulta de base: ${info.query || 'Sin búsqueda cargada'}\n\n${info.context}\n\nDescargo del operador: `;
  els.learningStatus.value = 'Pendiente de validar';
  renderLearningSuggestion();
  els.learningContext.focus();
}

function prefillKanbanFromSector(info) {
  const session = getSession();
  goToTab('kanban');
  els.kanbanTitle.value = info.title;
  els.kanbanSubscriber.value = els.kanbanSubscriber.value || 'Sin abonado cargado';
  els.kanbanCategory.value = info.kanbanCategory;
  els.kanbanPriority.value = info.sectorLabel.includes('SAFE') ? 'Media' : 'Alta';
  els.kanbanDescription.value = `Sector: ${info.sectorLabel}\nOperador: ${session.operator || 'Sin operador'}\nTurno: ${session.shift || 'Sin turno'}\n\n${info.context}\n\nPróximo paso: `;
  els.kanbanDescription.focus();
}

function prefillResourceFromSector(info, action) {
  goToTab('resources');
  els.resourceType.value = action === 'password' ? 'Acceso / password' : 'Manual PDF';
  els.resourceSector.value = info.sectorLabel.includes('SAFE') ? 'SAFE / Objetivos Móviles' : 'Objetivo Fijo 911';
  els.resourceTitle.value = action === 'password'
    ? `Acceso pendiente - ${info.sectorLabel}`
    : `Material de apoyo - ${info.sectorLabel}`;
  els.resourceSystem.value = action === 'password' ? 'App / herramienta a identificar' : 'Manual, PDF, Drive o video';
  els.resourceUser.value = '';
  els.resourceSecret.value = '';
  els.resourceLink.value = '';
  els.resourceNotes.value = `Sector: ${info.sectorLabel}\nConsulta de base: ${info.query || 'Sin búsqueda cargada'}\n\n${info.context}\n\nDetalle a cargar: `;
  els.resourceNotes.focus();
}

function saveResource() {
  const title = els.resourceTitle.value.trim();
  const type = els.resourceType.value;
  const sector = els.resourceSector.value;
  const notes = els.resourceNotes.value.trim();
  if (!title || !notes) {
    alert('Cargá título y notas de uso para guardar el recurso.');
    return;
  }
  const session = getSession();
  const rows = getStoredRows(RESOURCES_KEY);
  rows.push({
    date: new Date().toISOString(),
    type,
    sector,
    title,
    system: els.resourceSystem.value.trim(),
    user: els.resourceUser.value.trim(),
    secret: els.resourceSecret.value,
    link: els.resourceLink.value.trim(),
    notes,
    operator: session.operator || 'Sin operador',
    level: Number(session.level || 1)
  });
  localStorage.setItem(RESOURCES_KEY, JSON.stringify(rows));
  els.resourceTitle.value = '';
  els.resourceSystem.value = '';
  els.resourceUser.value = '';
  els.resourceSecret.value = '';
  els.resourceLink.value = '';
  els.resourceNotes.value = '';
  renderResources();
}

function renderResources() {
  if (!els.resourceList) return;
  const filter = els.resourceFilter?.value || 'Todos los recursos';
  const rows = getStoredRows(RESOURCES_KEY)
    .slice()
    .reverse()
    .filter(row => {
      if (filter === 'Todos los recursos') return true;
      if (filter === 'Material de apoyo') return row.type !== 'Acceso / password';
      return row.sector === filter || row.type === filter;
    });
  els.resourceCount.textContent = `${rows.length}`;
  if (!rows.length) {
    els.resourceList.innerHTML = '<div class="empty-state compact-empty"><h2>Sin recursos guardados</h2><p>Usá Password o Material de apoyo desde 911/SAFE para cargar el primer recurso del sector.</p></div>';
    return;
  }
  els.resourceList.innerHTML = rows.map(renderResourceItem).join('');
  els.resourceList.querySelectorAll('[data-copy-secret]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = rows[Number(btn.dataset.copySecret)];
      if (!row?.secret) return;
      try {
        await navigator.clipboard.writeText(row.secret);
        btn.textContent = 'Copiado';
      } catch {
        alert('No se pudo copiar automáticamente. Revisá permisos del navegador.');
      }
    });
  });
}

function renderResourceItem(row, index) {
  const canSeeSecret = currentLevel() >= 8;
  const secretBlock = row.secret
    ? canSeeSecret
      ? `<div class="resource-secret"><b>Password / dato sensible</b><code>${escapeHtml(row.secret)}</code><button type="button" data-copy-secret="${index}">Copiar</button></div>`
      : '<div class="resource-secret locked"><b>Password / dato sensible</b><span>Oculto. Requiere nivel 8 o superior.</span></div>'
    : '';
  const link = row.link ? `<a class="video-link" href="${escapeHtml(row.link)}" target="_blank" rel="noopener">Abrir recurso</a>` : '';
  return `<article class="knowledge-item resource-item">
    <div>
      <p class="eyebrow">${escapeHtml(row.type)} · ${escapeHtml(row.sector)} · ${new Date(row.date).toLocaleDateString()}</p>
      <h3>${escapeHtml(row.title)}</h3>
      <p><b>Sistema:</b> ${escapeHtml(row.system || 'Sin sistema cargado')}</p>
      <p><b>Usuario / ubicación:</b> ${escapeHtml(row.user || 'Sin referencia cargada')}</p>
      ${secretBlock}
      ${link}
      <p>${escapeHtml(row.notes)}</p>
    </div>
    <span>${escapeHtml(row.operator || 'Sin operador')}</span>
  </article>`;
}

function saveDirective() {
  const title = els.directiveTitle.value.trim();
  const text = els.directiveText.value.trim();
  if (!title || !text) {
    alert('Cargá título e instrucción para guardar la directiva.');
    return;
  }
  const rows = getStoredRows(DIRECTIVES_KEY);
  rows.push({
    date: new Date().toISOString(),
    title,
    source: els.directiveSource.value.trim() || 'Sin responsable cargado',
    sector: els.directiveSector.value,
    text
  });
  localStorage.setItem(DIRECTIVES_KEY, JSON.stringify(rows));
  els.directiveTitle.value = '';
  els.directiveSource.value = '';
  els.directiveText.value = '';
  renderDirectives();
}

function renderDirectives() {
  const rows = getStoredRows(DIRECTIVES_KEY).slice().reverse();
  els.directiveCount.textContent = `${rows.length} reglas`;
  if (!rows.length) {
    els.directiveList.innerHTML = '<div class="empty-state compact-empty"><h2>Sin directivas cargadas</h2><p>Cuando un supervisor indique una regla, registrala acá para que no se pierda en mensajes.</p></div>';
    return;
  }
  els.directiveList.innerHTML = rows.map(row => `<article class="knowledge-item"><div><p class="eyebrow">${escapeHtml(row.sector)} · ${new Date(row.date).toLocaleDateString()}</p><h3>${escapeHtml(row.title)}</h3><p>${escapeHtml(row.text)}</p></div><span>${escapeHtml(row.source)}</span></article>`).join('');
}

async function saveLearning() {
  const question = els.learningQuestion.value.trim();
  const failure = els.learningFailure.value.trim();
  const subscriber = els.learningSubscriber.value.trim();
  const context = els.learningContext.value.trim();
  if (!subscriber || !failure || !context) {
    alert('Cargá abonado/objetivo, falla y contexto para guardar el evento.');
    return;
  }
  const suggestion = getLearningSuggestions()[0];
  const session = getSession();
  const rows = getStoredRows(LEARNING_KEY);
  const record = {
    date: new Date().toISOString(),
    type: els.learningType?.value || 'Evento en espera',
    operator: els.learningOperator.value.trim() || session.operator || 'Sin operador cargado',
    operatorUid: session.uid || state.firebase.currentUser?.uid || '',
    operatorEmail: session.email || state.firebase.currentUser?.email || '',
    role: session.role || 'operador',
    level: Number(session.level || 1),
    shift: session.shift || 'Sin turno',
    sector: session.sector || 'Sin sector',
    subscriber,
    failure,
    question: question || failure,
    context,
    status: els.learningStatus.value,
    suggestion: suggestion ? `${suggestion.source}: ${suggestion.title}` : 'Sin solución cargada',
    supervisorSummary: makeSupervisorSummary()
  };
  rows.push(record);
  localStorage.setItem(LEARNING_KEY, JSON.stringify(rows));
  localStorage.setItem(`${LEARNING_KEY}:lastSave`, new Date().toISOString());
  if (state.firebase.enabled) {
    try {
      await saveLearningToCloud(record);
    } catch (error) {
      console.error('No se pudo guardar en base central', error);
      state.firebase.status = 'Modo local: no se pudo guardar en la base central. Quedo respaldo en este navegador.';
    }
  }
  els.learningSubscriber.value = '';
  els.learningFailure.value = '';
  els.learningQuestion.value = '';
  els.learningContext.value = '';
  renderLearningSuggestion();
  renderLearning();
  renderMetrics();
  renderLearningSavedState();
}

function renderLearning() {
  const rows = getLearningRows().slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  els.learningCount.textContent = `${rows.length} eventos`;
  if (!rows.length) {
    els.learningList.innerHTML = '<div class="empty-state compact-empty"><h2>Sin eventos en espera</h2><p>La próxima consulta sin resolver puede convertirse en una solución permanente para todos.</p></div>';
    renderLearningSavedState();
    return;
  }
  els.learningList.innerHTML = rows.map(row => renderLearningItem(row)).join('');
  els.learningList.querySelectorAll('[data-open-learning]').forEach(btn => {
    btn.addEventListener('click', () => openLearningResolution(btn.dataset.openLearning));
  });
  els.learningList.querySelectorAll('[data-add-kanban]').forEach(btn => {
    btn.addEventListener('click', () => addLearningToKanban(btn.dataset.addKanban));
  });
  els.learningList.querySelectorAll('[data-copy-supervisor]').forEach(btn => {
    btn.addEventListener('click', () => copyLearningSupervisorNote(btn.dataset.copySupervisor, btn));
  });
  renderLearningSavedState();
}

function renderLearningItem(row) {
  const id = row.id || getLearningDocId(row);
  const resolution = row.resolution || {};
  const resolved = ['Validado por supervisor', 'Convertir en procedimiento', 'Resuelto y cargado'].includes(row.status) || Boolean(resolution.procedure);
  return `<article class="knowledge-item learning-item ${resolved ? 'resolved' : ''}">
    <div class="knowledge-main">
      <p class="eyebrow">${escapeHtml(row.type || 'Evento en espera')} · ${escapeHtml(row.status)} · ${escapeHtml(row.subscriber || 'Sin abonado')} · ${safeDate(row.date)}</p>
      <h3>${escapeHtml(row.failure || row.question)}</h3>
      <p>${escapeHtml(row.question)}</p>
      <p>${escapeHtml(row.context)}</p>
      <p><b>Sugerencia:</b> ${escapeHtml(row.suggestion || 'Sin solución cargada')}</p>
      ${resolution.procedure ? `<p><b>Procedimiento validado:</b> ${escapeHtml(resolution.procedure)}</p>` : ''}
      <p><b>Resumen supervisor:</b> ${escapeHtml(row.supervisorSummary || '')}</p>
      <div class="learning-actions">
        <button type="button" class="primary" data-open-learning="${escapeHtml(id)}">${resolved ? 'Ver / ajustar resolución' : 'Resolver evento'}</button>
        <button type="button" data-copy-supervisor="${escapeHtml(id)}">Copiar nota supervisor</button>
        <button type="button" data-add-kanban="${escapeHtml(id)}">Enviar a Kanban</button>
      </div>
    </div>
    <span>${escapeHtml(row.operator || 'Sin operador')} · ${escapeHtml(row.shift || 'Sin turno')}</span>
  </article>`;
}

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString();
}

function safeDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleString();
}

function findLearningRow(id) {
  return getLearningRows().find(row => (row.id || getLearningDocId(row)) === id);
}

function openLearningResolution(id) {
  const row = findLearningRow(id);
  if (!row) return;
  const resolution = row.resolution || {};
  state.selectedLearningId = id;
  els.learningDialogTitle.textContent = row.failure || row.question || 'Evento en espera';
  els.learningDialogContext.innerHTML = `<p><b>Abonado / objetivo:</b> ${escapeHtml(row.subscriber || 'Sin abonado')}</p>
    <p><b>Tipo de carga:</b> ${escapeHtml(row.type || 'Evento en espera')}</p>
    <p><b>Duda:</b> ${escapeHtml(row.question || 'Sin duda cargada')}</p>
    <p><b>Contexto:</b> ${escapeHtml(row.context || 'Sin contexto cargado')}</p>
    <p><b>Sugerencia actual:</b> ${escapeHtml(row.suggestion || 'Sin sugerencia')}</p>
    <p><b>Operador:</b> ${escapeHtml(row.operator || 'Sin operador')} · ${escapeHtml(row.shift || 'Sin turno')}</p>`;
  els.resolutionStatus.value = row.status || 'Validado por supervisor';
  els.resolutionCategory.value = resolution.category || inferLearningCategory(row);
  els.resolutionCause.value = resolution.cause || '';
  els.resolutionProcedure.value = resolution.procedure || '';
  els.resolutionBykom.value = resolution.bykomNote || '';
  els.resolutionRoute.value = resolution.route || '';
  els.resolutionKeywords.value = resolution.keywords || buildLearningKeywords(row);
  els.learningResolveState.textContent = currentLevel() >= 8
    ? 'Resolución lista para supervisión.'
    : 'Podés completar una propuesta; supervisión debe validar el criterio final.';
  els.learningDialog.showModal();
}

function inferLearningCategory(row) {
  const text = normalize([row.subscriber, row.failure, row.question, row.context, row.suggestion].join(' '));
  if (text.includes('comunic')) return 'Falla de comunicación';
  if (text.includes('tamper')) return 'Tamper / sabotaje';
  if (text.includes('zona')) return 'Evento de zona / intrusión';
  if (text.includes('servic') || text.includes('tecnic')) return 'Servicio técnico';
  if (text.includes('whatsapp') || text.includes('llamad')) return 'Contacto con cliente';
  return 'Caso particular a validar';
}

function buildLearningKeywords(row) {
  return [row.subscriber, row.failure, row.question]
    .filter(Boolean)
    .join(', ')
    .slice(0, 180);
}

function makeLearningResolutionPayload(row) {
  const session = getSession();
  const procedure = els.resolutionProcedure.value.trim();
  const bykomNote = els.resolutionBykom.value.trim();
  const category = els.resolutionCategory.value.trim();
  const cause = els.resolutionCause.value.trim();
  const route = els.resolutionRoute.value.trim();
  const keywords = els.resolutionKeywords.value.trim();
  const status = els.resolutionStatus.value;
  const resolutionSummary = `Categoría: ${category || 'Sin categoría'}. Criterio: ${cause || 'Sin criterio cargado'}. Procedimiento: ${procedure || 'Sin procedimiento cargado'}. Nota Bykom: ${bykomNote || 'Sin nota estándar'}. Derivación: ${route || 'Sin derivación'}.`;
  return {
    ...row,
    status,
    suggestion: procedure || row.suggestion || '',
    supervisorSummary: resolutionSummary,
    resolution: {
      category,
      cause,
      procedure,
      bykomNote,
      route,
      keywords,
      supervisorName: session.operator || 'Sin supervisor',
      supervisorUid: session.uid || '',
      supervisorLevel: Number(session.level || 0),
      resolvedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };
}

async function saveLearningResolution() {
  const row = findLearningRow(state.selectedLearningId);
  if (!row) return;
  const payload = makeLearningResolutionPayload(row);
  try {
    await updateLearningRow(payload);
    els.learningResolveState.textContent = 'Resolución guardada. Este caso ya queda como referencia para futuras búsquedas.';
    renderLearning();
    renderMetrics();
  } catch (error) {
    console.error('No se pudo guardar resolución', error);
    els.learningResolveState.textContent = 'No se pudo guardar la resolución. Revisá permisos o conexión.';
  }
}

async function updateLearningRow(row) {
  const docId = row.id || getLearningDocId(row);
  if (state.firebase.enabled && learningCollection()) {
    const payload = { ...row };
    delete payload.id;
    if (window.firebase?.firestore?.FieldValue) payload.resolvedSavedAt = window.firebase.firestore.FieldValue.serverTimestamp();
    await learningCollection().doc(docId).set(payload, { merge: true });
    state.firebase.lastCloudSave = new Date().toISOString();
    return;
  }
  const rows = getStoredRows(LEARNING_KEY);
  const nextRows = rows.map(item => (item.id || getLearningDocId(item)) === docId ? row : item);
  localStorage.setItem(LEARNING_KEY, JSON.stringify(nextRows));
}

async function copyLearningResolution() {
  const row = findLearningRow(state.selectedLearningId);
  if (!row) return;
  const payload = makeLearningResolutionPayload(row);
  const text = `Abonado: ${payload.subscriber || 'Sin abonado'}\nEvento: ${payload.failure || payload.question || 'Sin evento'}\nEstado: ${payload.status}\n${payload.supervisorSummary}`;
  await copyPlainText(text);
  els.learningResolveState.textContent = 'Resumen copiado.';
}

async function copyLearningSupervisorNote(id, button) {
  const row = findLearningRow(id);
  if (!row) return;
  await copyPlainText(makeSupervisorEmailNote(row));
  if (!button) return;
  const previous = button.textContent;
  button.textContent = 'Nota copiada';
  button.disabled = true;
  setTimeout(() => {
    button.textContent = previous;
    button.disabled = false;
  }, 1600);
}

async function copyPlainText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
}

function makeSupervisorEmailNote(row) {
  const resolution = row.resolution || {};
  const subscriber = row.subscriber || 'Sin abonado/objetivo cargado';
  const type = row.type || 'Evento en espera';
  const failure = row.failure || row.question || 'Evento sin titulo';
  const question = row.question || 'Sin duda concreta cargada';
  const context = row.context || 'Sin contexto cargado';
  const suggestion = row.suggestion || 'Sin sugerencia automatica disponible';
  const operator = row.operator || state.currentUser?.name || 'Sin operador';
  const shift = row.shift || state.currentUser?.shift || 'Sin turno';
  const sector = row.sector || state.currentUser?.sector || 'Sin sector';
  const station = row.station || state.currentUser?.station || 'Sin estacion';
  const status = row.status || 'Pendiente de validar';
  const summary = row.supervisorSummary || buildSupervisorSummaryFromRow(row);
  const resolutionBlock = resolution.procedure
    ? `\nResolucion ya cargada:\n${resolution.procedure}\n\nNota Bykom sugerida:\n${resolution.bykomNote || 'Sin nota Bykom cargada'}\n`
    : '';

  return [
    `Asunto sugerido: Validacion de evento en espera - ${subscriber} - ${failure}`,
    '',
    'Hola, envio este evento para validar el procedimiento correcto.',
    '',
    'Solicito confirmacion para poder cedularlo correctamente en Bykom y, si corresponde, dejar el criterio como procedimiento reutilizable para los operadores.',
    '',
    `Abonado / objetivo: ${subscriber}`,
    `Tipo de carga: ${type}`,
    `Falla / evento: ${failure}`,
    `Estado actual: ${status}`,
    `Operador: ${operator}`,
    `Turno: ${shift}`,
    `Sector: ${sector}`,
    `Estacion: ${station}`,
    `Fecha de carga: ${safeDateTime(row.date)}`,
    '',
    `Duda concreta:\n${question}`,
    '',
    `Contexto / acciones realizadas:\n${context}`,
    '',
    `Sugerencia del sistema:\n${suggestion}`,
    resolutionBlock,
    `Resumen para supervision:\n${summary}`,
    '',
    'Pedido concreto:',
    'Confirmar cual es el procedimiento correcto, como debe cedularse en Bykom y si corresponde generar mantenimiento, dejar en espera, informar al cliente, derivar a otro sector o convertirlo en una directiva/procedimiento.',
  ].filter(Boolean).join('\n');
}

function buildSupervisorSummaryFromRow(row) {
  const parts = [
    `Tipo de carga: ${row.type || 'Evento en espera'}.`,
    `Abonado ${row.subscriber || 'sin abonado'}.`,
    `Falla/evento: ${row.failure || 'sin falla cargada'}.`,
    `Duda: ${row.question || 'sin duda concreta'}.`,
    `Contexto: ${row.context || 'sin contexto'}.`,
  ];
  return `${parts.join(' ')} Se solicita validar el procedimiento correcto para cargarlo como solucion reutilizable.`;
}

function renderLearningSavedState() {
  if (!els.learningSavedState) return;
  const rows = getLearningRows();
  const localRows = getStoredRows(LEARNING_KEY);
  const last = state.firebase.lastCloudSave || localStorage.getItem(`${LEARNING_KEY}:lastSave`);
  const suffix = last ? ` Ultimo guardado: ${new Date(last).toLocaleString()}.` : '';
  const scope = state.firebase.loaded
    ? `${rows.length} eventos en base central y ${localRows.length} respaldos locales.`
    : `${rows.length} eventos guardados en este navegador.`;
  els.learningSavedState.textContent = `${state.firebase.status}. ${scope}${suffix} Exporta respaldo al finalizar el turno.`;
}

function exportLearningBackup() {
  const rows = getLearningRows();
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'Vigilia Seguridad Soporte Operativo',
    type: 'eventos-en-espera',
    count: rows.length,
    rows
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
  a.href = url;
  a.download = `vigilia-eventos-en-espera-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importLearningBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      const incoming = Array.isArray(payload) ? payload : payload.rows;
      if (!Array.isArray(incoming)) throw new Error('Formato invalido');
      const current = getStoredRows(LEARNING_KEY);
      const merged = [...current, ...incoming].filter((row, index, all) => {
        const key = `${row.date}|${row.subscriber}|${row.failure}|${row.context}`;
        return all.findIndex(other => `${other.date}|${other.subscriber}|${other.failure}|${other.context}` === key) === index;
      });
      localStorage.setItem(LEARNING_KEY, JSON.stringify(merged));
      localStorage.setItem(`${LEARNING_KEY}:lastSave`, new Date().toISOString());
      syncLearningRowsToCloud(incoming);
      renderLearning();
      renderMetrics();
      renderLearningSavedState();
    } catch {
      alert('No pude importar ese respaldo. Verifica que sea un JSON exportado desde este sistema.');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function renderLearningSuggestion() {
  const suggestions = getLearningSuggestions();
  if (!els.learningSuggestion) return;
  if (!els.learningFailure.value.trim() && !els.learningQuestion.value.trim() && !els.learningContext.value.trim()) {
    els.learningSuggestion.innerHTML = 'Ingresá abonado, falla y contexto para recibir sugerencias.';
    return;
  }
  if (!suggestions.length) {
    els.learningSuggestion.innerHTML = `<b>Sin solución cargada.</b><p>${escapeHtml(makeSupervisorSummary())}</p>`;
    return;
  }
  els.learningSuggestion.innerHTML = `<b>Sugerencias del sistema</b>${suggestions.slice(0, 4).map(item => `<button type="button" data-source="${item.source}" data-id="${item.id}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.source)} · ${escapeHtml(item.action)}</span></button>`).join('')}`;
  els.learningSuggestion.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => applyLearningSuggestion(btn.dataset.source, btn.dataset.id)));
}

function getLearningSuggestions() {
  const query = normalize([els.learningSubscriber?.value, els.learningFailure?.value, els.learningQuestion?.value, els.learningContext?.value].join(' ')).trim();
  const terms = query.split(/\s+/).filter(term => term.length > 2 && !intakeStopWords.has(term));
  if (!terms.length) return [];
  const pools = [
    ...data.cases.map(item => ({ id:item.id, source:'Objetivo Fijo 911', title:item.issue, action:item.action, text:[item.system,item.issue,item.code,item.question,item.causes,item.action,item.searchText].join(' ') })),
    ...procedureData.map(item => ({ id:item.id, source:'Procedimientos 911', title:item.event, action:item.action, text:[item.category,item.event,item.trigger,item.action,item.note,item.automation,...item.checks].join(' ') })),
    ...safeData.map(item => ({ id:item.id, source:'SAFE', title:item.event, action:item.action, text:[item.category,item.event,item.trigger,item.action,item.note,...item.questions].join(' ') }))
  ];
  return pools.map(item => {
    const haystack = normalize(item.text);
    let score = 0;
    terms.forEach(term => { if (haystack.includes(term)) score += 3; });
    if (normalize(item.title).includes(query)) score += 8;
    return { ...item, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
}

function applyLearningSuggestion(source, id) {
  if (source === 'SAFE') {
    document.querySelector('[data-tab="safe"]').click();
    els.safeSearch.value = safeData.find(item => item.id === id)?.event || els.learningFailure.value;
    searchSafe();
    return;
  }
  if (source === 'Procedimientos 911') {
    document.querySelector('[data-tab="procedures"]').click();
    els.procedureSearch.value = procedureData.find(item => item.id === id)?.event || els.learningFailure.value;
    searchProcedures();
    return;
  }
  document.querySelector('[data-tab="call"]').click();
  const item = data.cases.find(record => record.id === id);
  els.searchInput.value = item?.issue || els.learningFailure.value;
  search();
}

function makeSupervisorSummary() {
  const subscriber = els.learningSubscriber?.value.trim() || 'sin abonado';
  const type = els.learningType?.value || 'Evento en espera';
  const failure = els.learningFailure?.value.trim() || 'sin falla especificada';
  const question = els.learningQuestion?.value.trim() || failure;
  const context = els.learningContext?.value.trim() || 'sin contexto adicional';
  return `Tipo de carga: ${type}. Abonado ${subscriber}. Falla/evento: ${failure}. Duda: ${question}. Contexto: ${context}. Se solicita validar procedimiento correcto para cargarlo como solución reutilizable.`;
}

function getStoredRows(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function normalize(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function cleanFailureCode(value) {
  return normalize(value).replace(/led|zona|z|trouble|fallo|falla|nro|num|numero|#/g, '').replace(/[^\d]/g, '').trim();
}

function getFailureGuide() {
  const panel = els.alarmPanel.value;
  const rawCode = els.failureCode.value.trim();
  const code = cleanFailureCode(rawCode);
  const guide = failureGuideData[panel];
  if (!guide) {
    return { panel, rawCode, code, command: 'Confirmar panel en Bykom o pedir foto/modelo del teclado antes de operar.', meaning: 'Modelo no identificado. No interpretar el número sin confirmar sistema.', search: rawCode || panel };
  }
  const meaning = guide.codes[code] || 'Número/LED no cargado para este modelo. Registrar como duda pendiente y validar con manual o supervisor.';
  const followUp = code === '5' && (panel.includes('Alonso') || panel === 'Garnet')
    ? 'Flujo sugerido: confirmar internet/línea, pedir emergencia médica de prueba, esperar unos minutos. Si la señal llega, informar restablecimiento; si no llega, generar servicio técnico.'
    : '';
  return { panel, rawCode, code, command: guide.command, meaning, followUp, search: `${panel} falla ${code || rawCode} ${meaning} ${followUp}` };
}

function scoreSafe(item, terms, fullQuery) {
  const haystack = normalize([item.category, item.event, item.priority, item.trigger, item.action, item.note, ...item.questions].join(' '));
  let score = 0;
  terms.forEach(term => {
    if (haystack.includes(term)) score += 4;
  });
  if (normalize(item.event).includes(fullQuery)) score += 10;
  if (normalize(item.category).includes(fullQuery)) score += 3;
  return score;
}

function searchSafe() {
  const q = normalize(els.safeSearch.value).trim();
  const terms = q.split(/\s+/).filter(Boolean);
  const category = els.safeCategory.value;
  let results = safeData.filter(item => category === 'Todos los eventos SAFE' || item.category === category);
  if (terms.length) {
    results = results.map(item => ({ item, score: scoreSafe(item, terms, q) }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);
  }
  state.safeResults = results;
  renderSafeList();
}

function renderSafeList() {
  els.safeCount.textContent = `${state.safeResults.length} eventos`;
  if (!state.safeResults.length) {
    els.safeList.innerHTML = '<div class="empty-state compact-empty"><h2>Sin eventos SAFE</h2><p>Registrá la novedad como aprendizaje para convertirla en procedimiento.</p></div>';
    return;
  }
  els.safeList.innerHTML = state.safeResults.map(item => `<button class="procedure-item ${state.selectedSafe && state.selectedSafe.id === item.id ? 'active' : ''}" data-id="${item.id}"><strong>${escapeHtml(item.event)}</strong><span>${escapeHtml(item.category)} · ${escapeHtml(item.trigger)}</span><em>${escapeHtml(item.priority)}</em></button>`).join('');
  els.safeList.querySelectorAll('.procedure-item').forEach(btn => btn.addEventListener('click', () => selectSafe(btn.dataset.id)));
  if (!state.selectedSafe || !state.safeResults.some(item => item.id === state.selectedSafe.id)) {
    selectSafe(state.safeResults[0].id);
  }
}

function selectSafe(id) {
  state.selectedSafe = safeData.find(item => item.id === id);
  renderSafeDetail();
  els.safeList.querySelectorAll('.procedure-item').forEach(btn => btn.classList.toggle('active', btn.dataset.id === id));
}

function renderSafeDetail() {
  const item = state.selectedSafe;
  if (!item) return;
  const priorityClass = item.priority === 'Alta' ? 'warning' : '';
  els.safeDetail.innerHTML = `<div class="detail-title"><div><p class="eyebrow">SAFE · ${escapeHtml(item.category)}</p><h2>${escapeHtml(item.event)}</h2><p>${escapeHtml(item.trigger)}</p></div><span class="decision ${priorityClass}">${escapeHtml(item.priority)}</span></div>${procedureBlock('Preguntas guía', procedureChecks(item.questions))}${procedureBlock('Acción inicial', escapeHtml(item.action))}${mediaPanel('safe', item.id)}<div class="close-box"><p class="eyebrow">Registro</p><h2>Nota SAFE sugerida</h2><textarea id="safeNote">${escapeHtml(item.note)}</textarea><div class="actions"><button class="primary" id="copySafeNote" type="button">Copiar nota</button><button id="safeLearning" type="button">Registrar duda SAFE</button></div></div>`;
  wireMediaPanel('safe', item.id);
  document.getElementById('copySafeNote').addEventListener('click', copySafeNote);
  document.getElementById('safeLearning').addEventListener('click', () => {
    document.querySelector('[data-tab="learning"]').click();
    if (els.learningType) els.learningType.value = 'Duda operativa';
    els.learningFailure.value = item.event;
    els.learningQuestion.value = item.event;
    els.learningContext.value = `Duda o mejora sobre SAFE: ${item.trigger}`;
    els.learningStatus.value = 'Pendiente de validar';
    renderLearningSuggestion();
  });
}

async function copySafeNote() {
  const text = document.getElementById('safeNote').value;
  try { await navigator.clipboard.writeText(text); }
  catch { document.getElementById('safeNote').select(); document.execCommand('copy'); }
}

function mediaPanel(scope, id) {
  const key = `${scope}:${id}`;
  const media = getMedia()[key] || {};
  const image = media.image || '';
  const video = media.video || '';
  return `<div class="media-panel step"><b>Imagen y video de respaldo</b><div class="media-grid"><div>${image ? `<img class="media-preview" src="${escapeHtml(image)}" alt="Imagen de respaldo">` : '<div class="media-placeholder">Sin imagen cargada</div>'}</div><div class="media-fields"><label class="field-label">URL de imagen<input id="mediaImage" value="${escapeHtml(image)}" placeholder="Pegar link de imagen o ruta pública"></label><label class="field-label">Link de video explicativo<input id="mediaVideo" value="${escapeHtml(video)}" placeholder="Pegar link de YouTube, Drive, etc."></label>${video ? `<a class="video-link" href="${escapeHtml(video)}" target="_blank" rel="noopener">Abrir video explicativo</a>` : ''}<button id="saveMedia" type="button">Guardar respaldo</button></div></div></div>`;
}

function wireMediaPanel(scope, id) {
  const button = document.getElementById('saveMedia');
  if (!button) return;
  button.addEventListener('click', () => {
    const rows = getMedia();
    rows[`${scope}:${id}`] = {
      image: document.getElementById('mediaImage').value.trim(),
      video: document.getElementById('mediaVideo').value.trim()
    };
    localStorage.setItem(MEDIA_KEY, JSON.stringify(rows));
    if (scope === 'safe') renderSafeDetail(); else renderDetail();
  });
}

function getMedia() {
  try { return JSON.parse(localStorage.getItem(MEDIA_KEY) || '{}'); }
  catch { return {}; }
}

function renderFailureGuide() {
  const guide = getFailureGuide();
  els.failureGuideResult.innerHTML = `<b>${escapeHtml(guide.panel)}</b><p>${escapeHtml(guide.command)}</p><p>${escapeHtml(guide.meaning)}</p>${guide.followUp ? `<p>${escapeHtml(guide.followUp)}</p>` : ''}`;
}

function applyFailureGuideSearch() {
  const guide = getFailureGuide();
  els.searchInput.value = guide.search;
  const targetSystem = guide.panel.includes('Alonso') ? 'A2k4-A2k8' : guide.panel;
  els.systemFilter.value = [...els.systemFilter.options].some(option => option.value === targetSystem) ? targetSystem : 'Todos los sistemas';
  search();
}

function procedureAliases(item) {
  const aliases = {
    contencion: 'verificacion contencion llamar referente palabra clave emergencia no contacta',
    panico: 'asalto emergencia boton panico robo atraco e911',
    fuego: 'incendio humo temperatura bomberos emergencia',
    intrusion: 'robo disparo alarma intruso zona abierta activacion desactivacion acuda',
    'falsa-alarma': 'falso disparo cancelada clima error usuario falla sistema',
    'corte-220': 'corte luz falta 220 sin luz energia 220 volts sms msg',
    'bateria-panel': 'bateria baja panel bateria auxiliar corte luz',
    'bateria-sensor': 'bateria sensor zona pila bateria baja zona noche 07',
    'linea-telefonica': 'linea telefono comunicacion sin linea vinculo reactivar',
    gprs: 'comunicacion celular claro movistar test vinculo alternativo',
    ip: 'internet router comunicador ip red sin servicio modem',
    'agenda-comunicacion': 'agenda seguimiento falla comunicacion mensual trimestral',
    'fuera-horario': 'desactivacion fuera horario usuario no autorizado control horario',
    apertura: 'fallo apertura no abre desactiva horario tolerancia',
    cierre: 'fallo cierre no cierra no activa horario comercio',
    enlace: 'falla enlace reiniciar sistema bateria sensor pedido tecnico',
    llamadas: 'llamada entrante atencion palabra clave dni doble factor',
    mantenimiento: 'orden mantenimiento service tecnico bykom pedido tecnico visita',
    'panel-prueba': 'panel prueba tecnico cliente palabra clave test',
    video: 'video verificacion camaras smart pss visual confirmar evento',
    directivas: 'nota temporal procedimiento particular viaje vacaciones directiva anular zona'
  };
  return aliases[item.id] || '';
}

function procedureSearchText(item) {
  return normalize([item.event, item.category, item.code, item.trigger, item.action, item.note, item.automation, procedureAliases(item), item.checks.join(' ')].join(' '));
}

function scoreProcedure(item, terms, fullQuery) {
  const haystack = procedureSearchText(item);
  let score = 0;
  terms.forEach(term => { if (haystack.includes(term)) score += 3; });
  const intentBoosts = [
    { id: 'intrusion', terms: ['robo', 'intrusion', 'intruso', 'disparo'] },
    { id: 'panico', terms: ['panico', 'asalto'] },
    { id: 'corte-220', terms: ['luz', '220', 'energia'] },
    { id: 'gprs', terms: ['gprs'] },
    { id: 'ip', terms: ['ip', 'internet', 'router'] },
    { id: 'cierre', terms: ['cierre', 'cerrar'] },
    { id: 'apertura', terms: ['apertura', 'abrir'] },
    { id: 'video', terms: ['video', 'camara', 'camaras'] }
  ];
  intentBoosts.forEach(intent => {
    if (item.id === intent.id && intent.terms.some(term => terms.includes(term) || fullQuery.includes(term))) score += 12;
  });
  if (normalize(item.event).includes(fullQuery)) score += 8;
  if (normalize(item.event).startsWith(fullQuery)) score += 5;
  if (normalize(procedureAliases(item)).includes(fullQuery)) score += 4;
  return score;
}

function searchProcedures() {
  const q = normalize(els.procedureSearch.value).trim();
  const category = els.procedureCategory.value;
  const terms = q.split(/\s+/).filter(Boolean);
  let results = procedureData.filter(item => category === 'Todas las categorías' || item.category === category);
  if (terms.length) {
    results = results.map(item => {
      return { item, score: scoreProcedure(item, terms, q) };
    }).filter(result => result.score > 0).sort((a, b) => b.score - a.score).map(result => result.item);
  }
  state.procedureResults = results;
  renderProcedures();
}

function renderProcedureAutocomplete() {
  const q = normalize(els.procedureSearch.value).trim();
  if (!q) return hideProcedureAutocomplete();
  const category = els.procedureCategory.value;
  const terms = q.split(/\s+/).filter(Boolean);
  const suggestions = procedureData
    .filter(item => category === 'Todas las categorías' || item.category === category)
    .map(item => ({ item, score: scoreProcedure(item, terms, q) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map(result => result.item);
  if (!suggestions.length) return hideProcedureAutocomplete();
  state.procedureSuggestIndex = Math.min(state.procedureSuggestIndex, suggestions.length - 1);
  els.procedureAutocomplete.innerHTML = suggestions.map((item, index) => `<button type="button" role="option" class="${index === state.procedureSuggestIndex ? 'active' : ''}" data-id="${item.id}"><strong>${escapeHtml(item.event)}</strong><span>${escapeHtml(item.category)} · ${escapeHtml(item.code)}</span></button>`).join('');
  els.procedureAutocomplete.classList.add('active');
  els.procedureAutocomplete.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => chooseProcedureSuggestion(btn.dataset.id)));
}

function hideProcedureAutocomplete() {
  els.procedureAutocomplete.classList.remove('active');
  els.procedureAutocomplete.innerHTML = '';
  state.procedureSuggestIndex = 0;
}

function chooseProcedureSuggestion(id) {
  const item = procedureData.find(procedure => procedure.id === id);
  if (!item) return;
  els.procedureSearch.value = item.event;
  state.procedureResults = [item];
  renderProcedures();
  selectProcedure(item.id);
  hideProcedureAutocomplete();
}

function applyProcedureSearch(term) {
  els.procedureSearch.value = term;
  searchProcedures();
  renderProcedureAutocomplete();
}

function handleProcedureAutocompleteKeys(event) {
  const options = [...els.procedureAutocomplete.querySelectorAll('button')];
  if (!options.length) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    state.procedureSuggestIndex = (state.procedureSuggestIndex + 1) % options.length;
    renderProcedureAutocomplete();
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    state.procedureSuggestIndex = (state.procedureSuggestIndex - 1 + options.length) % options.length;
    renderProcedureAutocomplete();
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    chooseProcedureSuggestion(options[state.procedureSuggestIndex].dataset.id);
  }
  if (event.key === 'Escape') hideProcedureAutocomplete();
}

function renderProcedures() {
  els.procedureCount.textContent = `${state.procedureResults.length} eventos`;
  if (!state.procedureResults.length) {
    els.procedureList.innerHTML = '<div class="empty-state compact-empty"><h2>Sin procedimientos</h2><p>Registrá la duda para convertirla en directiva operativa.</p></div>';
    return;
  }
  els.procedureList.innerHTML = state.procedureResults.map(item => `<button class="procedure-item ${state.selectedProcedure && state.selectedProcedure.id === item.id ? 'active' : ''}" data-id="${item.id}"><strong>${escapeHtml(item.event)}</strong><span>${escapeHtml(item.category)} · ${escapeHtml(item.code)}</span><em>${escapeHtml(item.priority)}</em></button>`).join('');
  els.procedureList.querySelectorAll('.procedure-item').forEach(btn => btn.addEventListener('click', () => selectProcedure(btn.dataset.id)));
  if (!state.selectedProcedure || !state.procedureResults.some(item => item.id === state.selectedProcedure.id)) {
    selectProcedure(state.procedureResults[0].id);
  }
}

function selectProcedure(id) {
  state.selectedProcedure = procedureData.find(item => item.id === id);
  renderProcedureDetail();
  els.procedureList.querySelectorAll('.procedure-item').forEach(btn => btn.classList.toggle('active', btn.dataset.id === id));
}

function renderProcedureDetail() {
  const item = state.selectedProcedure;
  if (!item) return;
  const priorityClass = item.priority === 'Crítica' ? 'danger' : item.priority === 'Alta' ? 'warning' : '';
  els.procedureDetail.innerHTML = `<div class="detail-title"><div><p class="eyebrow">${escapeHtml(item.category)} · ${escapeHtml(item.code)}</p><h2>${escapeHtml(item.event)}</h2><p>${escapeHtml(item.trigger)}</p></div><span class="decision ${priorityClass}">${escapeHtml(item.priority)}</span></div>${procedureBlock('Chequeos del operador', procedureChecks(item.checks))}${procedureBlock('Acción recomendada', escapeHtml(item.action))}${procedureBlock('Oportunidad de automatización', escapeHtml(item.automation))}<div class="close-box"><p class="eyebrow">Registro</p><h2>Nota operativa sugerida</h2><textarea id="procedureNote">${escapeHtml(makeProcedureNote(item))}</textarea><div class="actions"><button class="primary" id="copyProcedureNote">Copiar nota</button><button id="procedurePending">Registrar duda operativa</button></div></div>`;
  document.getElementById('copyProcedureNote').addEventListener('click', copyProcedureNote);
  document.getElementById('procedurePending').addEventListener('click', () => {
    goToTab('learning');
    if (els.learningType) els.learningType.value = 'Duda operativa';
    els.learningFailure.value = item.event;
    els.learningQuestion.value = `Qué criterio falta validar sobre ${item.event}`;
    els.learningContext.value = `Procedimiento operativo: ${item.event}\nCódigo: ${item.code}\nDisparador: ${item.trigger}\nAcción cargada: ${item.action}\n\nDuda del operador: `;
    els.learningStatus.value = 'Pendiente de validar';
    renderLearningSuggestion();
    els.learningContext.focus();
  });
}

function procedureBlock(title, body) {
  return `<div class="step"><b>${escapeHtml(title)}</b><div class="procedure-copy">${body}</div></div>`;
}

function procedureChecks(checks) {
  return `<ol class="procedure-checks">${checks.map(check => `<li>${escapeHtml(check)}</li>`).join('')}</ol>`;
}

function makeProcedureNote(item) {
  return `Procedimiento operativo aplicado: ${item.event} (${item.code}). Categoría: ${item.category}. Prioridad: ${item.priority}. Disparador: ${item.trigger}. Acción: ${item.action}. Registro sugerido: ${item.note}`;
}

async function copyProcedureNote() {
  const text = document.getElementById('procedureNote').value;
  try { await navigator.clipboard.writeText(text); }
  catch { document.getElementById('procedureNote').select(); document.execCommand('copy'); }
}

function search() {
  const q = normalize(els.searchInput.value).trim();
  const system = els.systemFilter.value;
  const terms = q.split(/\s+/).filter(Boolean);
  let results = data.cases.filter(item => system === 'Todos los sistemas' || item.system === system);
  if (terms.length) {
    results = results.map(item => {
      let score = 0;
      terms.forEach(t => { if (item.searchText.includes(t)) score += 3; });
      if (normalize(item.issue).includes(q)) score += 8;
      if (normalize(item.system).includes(q)) score += 4;
      if (normalize(item.code).includes(q)) score += 5;
      return { item, score };
    }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).map(x => x.item);
  }
  state.results = results.slice(0, 40);
  renderResults();
}

function renderResults() {
  els.resultCount.textContent = `${state.results.length} casos`;
  if (!state.results.length) {
    els.results.innerHTML = '<div class="empty-state"><h2>Sin resultados</h2><p>Registrá la consulta como pendiente para completarla con manual oficial.</p><button type="button" id="emptyPending" class="primary">Registrar pendiente</button></div>';
    document.getElementById('emptyPending').addEventListener('click', showPendingForm);
    return;
  }
  els.results.innerHTML = state.results.map(item => `<button class="result-item ${state.selected && state.selected.id === item.id ? 'active' : ''}" data-id="${item.id}"><strong>${escapeHtml(item.issue)}</strong><span>${escapeHtml(item.system)} · ${escapeHtml(item.code || item.commandHint)}</span></button>`).join('');
  els.results.querySelectorAll('.result-item').forEach(btn => btn.addEventListener('click', () => selectCase(btn.dataset.id)));
}

function selectCase(id) {
  state.selected = data.cases.find(item => item.id === id);
  renderResults();
  renderDetail();
}

function renderDetail() {
  const item = state.selected;
  if (!item) return;
  const decisionClass = item.decision.includes('prioritario') || item.decision.includes('Validar') ? 'danger' : item.decision.includes('Técnico') || item.decision.includes('Esperar') ? 'warning' : '';
  els.detailPanel.innerHTML = `<div class="detail-title"><div><p class="eyebrow">Paso 3</p><h2>${escapeHtml(item.system)}</h2><p>${escapeHtml(item.issue)}</p></div><span class="decision ${decisionClass}">${escapeHtml(item.decision)}</span></div>${step('Comando o guía inicial', item.commandHint)}${step('Indicador / código', item.code || 'Sin código cargado')}${step('Pregunta filtro para el cliente', item.question)}${step('Causa probable', item.causes || 'Sin causa cargada')}${step('Acción remota sugerida', item.action)}${step('Video / WhatsApp', item.video || 'Pendiente de cargar link o guion de video corto.')}${step('Respaldo', [item.manualPage && `Manual: ${item.manualPage}`, item.confidence && `Confianza: ${item.confidence}`, item.backup].filter(Boolean).join('\n'))}${mediaPanel('fixed', item.id)}${closeBoxHtml(makeNote(item), false)}`;
  wireMediaPanel('fixed', item.id);
  wireCloseBox(() => saveCurrentCase(item));
}

function closeBoxHtml(note, pending) {
  return `<div class="close-box"><p class="eyebrow">Paso 4</p><h2>${pending ? 'Registrar pendiente' : 'Cierre del caso'}</h2><div class="close-grid"><label class="field-label">Abonado o referencia<input id="caseSubscriber" placeholder="Ej: Cliente, cuenta o domicilio"></label><label class="field-label">Operador<input id="caseOperator" placeholder="Tu nombre"></label><label class="field-label">Resultado<select id="caseOutcome"><option>${pending ? 'Consulta pendiente de cargar' : 'Resuelto desde estación'}</option><option>Pendiente de verificar</option><option>Derivado a técnico</option><option>Consulta a supervisor</option><option>Servicio técnico evitado</option><option>Consulta pendiente de cargar</option></select></label><label class="field-label">Satisfacción<select id="caseMood"><option>Cliente conforme</option><option>Cliente neutro</option><option>Cliente molesto</option><option>Riesgo de baja</option><option>Felicitación</option></select></label></div><textarea id="caseExtra" placeholder="Detalle adicional para el registro, si hace falta"></textarea><textarea id="bycomNote" readonly>${escapeHtml(note)}</textarea><div class="actions"><button class="primary" id="saveCase">Guardar caso</button><button id="copyNote">Copiar nota Bykom</button></div></div>`;
}

function step(title, body) {
  const maybeUrl = String(body || '').match(/https?:\/\/\S+/);
  const link = maybeUrl ? `<p><a href="${escapeHtml(maybeUrl[0])}" target="_blank" rel="noreferrer">Abrir video o recurso</a></p>` : '';
  return `<div class="step"><b>${escapeHtml(title)}</b><p>${escapeHtml(body || 'Pendiente de completar.')}</p>${link}</div>`;
}

function showPendingForm() {
  const currentSearch = els.searchInput.value.trim();
  els.detailPanel.innerHTML = `<div class="detail-title"><div><p class="eyebrow">Mejora continua</p><h2>Consulta pendiente</h2><p>Usá esto cuando el operador recibe una consulta que no está cargada o necesita corrección.</p></div><span class="decision warning">Pendiente de validar</span></div><div class="pending-form"><label class="field-label">Sistema o modelo<select id="pendingSystem">${data.systems.map(s => `<option>${escapeHtml(s.name)}</option>`).join('')}<option>No identificado</option></select></label><label class="field-label">Consulta recibida<input id="pendingQuery" value="${escapeHtml(currentSearch)}" placeholder="Ej: borrar usuario 06 y crear usuario nuevo"></label><label class="field-label">Qué preguntó o dijo el cliente<textarea id="pendingSymptom" placeholder="Texto simple de la llamada"></textarea></label><label class="field-label">Link de video sugerido<textarea id="pendingVideo" placeholder="Cuando exista, pegar link de video de 10 a 15 segundos"></textarea></label></div>${closeBoxHtml(makePendingNote(), true)}`;
  ['pendingSystem','pendingQuery','pendingSymptom','pendingVideo'].forEach(id => document.getElementById(id).addEventListener('input', updatePendingNote));
  wireCloseBox(savePendingCase);
  updatePendingNote();
}

function makeNote(item) {
  const panelStatus = els.panelStatus.value;
  const keyboardModel = els.keyboardModel?.value || 'No identificado';
  const failureGuide = getFailureGuide();
  const bycom = els.bycomChecked.checked ? 'Bykom consultado' : 'Bykom pendiente de confirmar';
  return `${bycom}. Estado panel: ${panelStatus}. Panel/Marca: ${failureGuide.panel}. Teclado: ${keyboardModel}. Falla informada por cliente: ${failureGuide.rawCode || 'sin número/LED informado'} (${failureGuide.meaning}). Consulta: ${item.issue}. Sistema: ${item.system}. Guía inicial: ${item.commandHint}. Indicador: ${item.code || 'sin código'}. Pregunta filtro: ${item.question}. Acción indicada: ${item.action}. Video: ${item.video || 'pendiente'}. Decisión: ${item.decision}.`;
}

function makePendingNote() {
  const bycom = els.bycomChecked.checked ? 'Bykom consultado' : 'Bykom pendiente de confirmar';
  const keyboardModel = els.keyboardModel?.value || 'No identificado';
  const failureGuide = getFailureGuide();
  return `${bycom}. Panel/Marca: ${failureGuide.panel}. Teclado: ${keyboardModel}. Falla informada: ${failureGuide.rawCode || 'sin número/LED informado'} (${failureGuide.meaning}). Consulta no encontrada o mejora sugerida. Registrar para validación con manual oficial antes de cargar al sistema.`;
}

function updateNote(item) {
  const outcome = document.getElementById('caseOutcome').value;
  const mood = document.getElementById('caseMood').value;
  const extra = document.getElementById('caseExtra').value.trim();
  const sub = document.getElementById('caseSubscriber').value.trim();
  let note = makeNote(item) + ` Resultado: ${outcome}. Satisfacción: ${mood}.`;
  if (sub) note = `Abonado/ref: ${sub}. ` + note;
  if (extra) note += ` Observación: ${extra}.`;
  document.getElementById('bycomNote').value = note;
}

function updatePendingNote() {
  const system = document.getElementById('pendingSystem')?.value || 'No identificado';
  const query = document.getElementById('pendingQuery')?.value.trim() || 'Consulta sin título';
  const symptom = document.getElementById('pendingSymptom')?.value.trim();
  const video = document.getElementById('pendingVideo')?.value.trim();
  const outcome = document.getElementById('caseOutcome')?.value || 'Consulta pendiente de cargar';
  const mood = document.getElementById('caseMood')?.value || 'Cliente neutro';
  const extra = document.getElementById('caseExtra')?.value.trim();
  const sub = document.getElementById('caseSubscriber')?.value.trim();
  let note = `${makePendingNote()} Sistema/modelo: ${system}. Consulta: ${query}.`;
  if (symptom) note += ` Relato cliente: ${symptom}.`;
  if (video) note += ` Link video sugerido: ${video}.`;
  if (sub) note = `Abonado/ref: ${sub}. ` + note;
  if (extra) note += ` Observación operador: ${extra}.`;
  note += ` Resultado: ${outcome}. Satisfacción: ${mood}.`;
  document.getElementById('bycomNote').value = note;
}

function wireCloseBox(saveHandler) {
  const session = getSession();
  if (session.operator && !document.getElementById('caseOperator').value) document.getElementById('caseOperator').value = session.operator;
  document.getElementById('saveCase').addEventListener('click', saveHandler);
  document.getElementById('copyNote').addEventListener('click', copyNote);
  ['caseSubscriber','caseOperator','caseOutcome','caseMood','caseExtra'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    if (document.getElementById('pendingQuery')) updatePendingNote(); else updateNote(state.selected);
  }));
}

function saveCurrentCase(item) {
  updateNote(item);
  const record = baseRecord(item.system, item.issue, item.decision, false);
  record.videoLink = item.video || '';
  saveRecord(record);
}

function savePendingCase() {
  updatePendingNote();
  const system = document.getElementById('pendingSystem').value;
  const query = document.getElementById('pendingQuery').value.trim() || 'Consulta pendiente sin título';
  const record = baseRecord(system, query, 'Pendiente de validar', true);
  record.pendingDetail = document.getElementById('pendingSymptom').value.trim();
  record.videoLink = document.getElementById('pendingVideo').value.trim();
  saveRecord(record);
}

function baseRecord(system, issue, decision, pending) {
  const failureGuide = getFailureGuide();
  const session = getSession();
  return { date: new Date().toISOString(), subscriber: document.getElementById('caseSubscriber').value.trim(), operator: document.getElementById('caseOperator').value.trim() || session.operator || 'Sin operador', shift: session.shift || 'Sin turno', sector: session.sector || 'Sin sector', system, issue, decision, outcome: document.getElementById('caseOutcome').value, mood: document.getElementById('caseMood').value, note: document.getElementById('bycomNote').value, bycomChecked: els.bycomChecked.checked, panelStatus: els.panelStatus.value, keyboardModel: els.keyboardModel?.value || 'No identificado', alarmPanel: failureGuide.panel, failureCode: failureGuide.rawCode, failureMeaning: failureGuide.meaning, pending };
}

function saveRecord(record) {
  const rows = getCases();
  rows.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  renderMetrics();
  els.savedDialog.showModal();
}

async function copyNote() {
  if (document.getElementById('pendingQuery')) updatePendingNote(); else updateNote(state.selected);
  const text = document.getElementById('bycomNote').value;
  try { await navigator.clipboard.writeText(text); }
  catch { document.getElementById('bycomNote').select(); document.execCommand('copy'); }
}

function getCases() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function renderMetrics() {
  const rows = getCases();
  const learning = getLearningRows();
  const kanban = getKanbanRows();
  const session = getSession();
  const total = rows.length;
  const remote = rows.filter(r => r.outcome === 'Resuelto desde estación' || r.outcome === 'Servicio técnico evitado').length;
  const risk = rows.filter(r => r.mood === 'Riesgo de baja').length;
  const avoided = rows.filter(r => r.outcome === 'Servicio técnico evitado').length;
  const pending = rows.filter(r => r.pending || r.outcome === 'Consulta pendiente de cargar').length + learning.filter(r => r.status !== 'Resuelto y cargado').length;
  els.mTotal.textContent = total;
  els.mRemote.textContent = total ? `${Math.round(remote * 100 / total)}%` : '0%';
  els.mRisk.textContent = risk;
  els.mAvoided.textContent = avoided;
  els.mPending.textContent = pending;
  const paretoEntries = getParetoEntries(rows, learning, kanban);
  renderBars(els.paretoChart, paretoEntries, true);
  renderMetricInsights(paretoEntries, rows, learning, kanban);
  renderBars(els.operatorChart, countEntries([...rows.map(r => r.operator), ...learning.map(r => r.operator), ...kanban.map(r => r.operator)]), false);
  renderBars(els.shiftChart, countEntries([...rows.map(r => r.shift), ...learning.map(r => r.shift), ...kanban.map(r => r.shift)]), false);
  renderBars(els.learningChart, countEntries(learning.map(r => r.type || r.failure || r.question)), true);
  renderBars(els.satisfactionChart, countBy(rows, 'mood'), false);
  renderOperatorSummary(rows, learning, kanban, session);
  renderCaseRows(rows);
}

function getParetoEntries(rows, learning, kanban) {
  const mode = els.paretoMode?.value || 'cause';
  if (mode === 'learningType') return countEntries(learning.map(r => r.type || 'Evento en espera'));
  if (mode === 'status') return countEntries([...learning.map(r => r.status), ...kanban.map(r => kanbanColumns.find(c => c.id === r.column)?.label || r.column)]);
  if (mode === 'operator') return countEntries([...rows.map(r => r.operator), ...learning.map(r => r.operator), ...kanban.map(r => r.operator)]);
  if (mode === 'priority') return countEntries([...kanban.map(r => r.priority), ...rows.map(r => r.mood === 'Riesgo de baja' ? 'Crítica: riesgo de baja' : r.priority)]);
  if (mode === 'kanban') return countEntries(kanban.map(r => kanbanColumns.find(c => c.id === r.column)?.label || r.column));
  return countEntries([...rows.map(r => r.issue), ...learning.map(r => r.resolution?.category || r.failure || r.question), ...kanban.map(r => r.category)]);
}

function renderMetricInsights(entries, rows, learning, kanban) {
  if (!els.metricInsights) return;
  if (!entries.length) {
    els.metricInsights.innerHTML = '<p>Todavía no hay datos suficientes para sugerencias.</p>';
    return;
  }
  const [topLabel, topValue] = entries[0];
  const total = entries.reduce((sum, item) => sum + item[1], 0);
  const topPercent = Math.round(topValue * 100 / total);
  const openLearning = learning.filter(row => !['Resuelto y cargado', 'Convertir en procedimiento'].includes(row.status)).length;
  const stuck = kanban.filter(row => ['en-espera', 'supervision'].includes(row.column)).length;
  const risk = rows.filter(row => row.mood === 'Riesgo de baja').length;
  const ideas = [
    `El foco principal es "${topLabel}", con ${topPercent}% del total visible. Si se estandariza ese grupo, baja el mayor cuello de botella.`,
    openLearning ? `Hay ${openLearning} eventos en espera: conviene resolverlos por lote y convertir los repetidos en procedimiento.` : 'No hay dudas abiertas relevantes: buen momento para revisar calidad de procedimientos.',
    stuck ? `El Kanban tiene ${stuck} tarjetas en espera/supervisión. Revisá si dependen de la misma persona o sector.` : 'El Kanban no muestra acumulación en espera.',
    risk ? `Hay ${risk} casos con riesgo de baja. Esa métrica pesa más que la cantidad bruta de eventos levantados.` : 'No aparecen riesgos de baja cargados en el historial actual.'
  ];
  els.metricInsights.innerHTML = `<h3>Lectura inteligente</h3><ul>${ideas.map(idea => `<li>${escapeHtml(idea)}</li>`).join('')}</ul>`;
}

function countEntries(values) {
  const map = new Map();
  values.filter(Boolean).forEach(value => map.set(value || 'Sin dato', (map.get(value || 'Sin dato') || 0) + 1));
  return [...map.entries()].sort((a,b) => b[1] - a[1]).slice(0, 10);
}

function countBy(rows, key) {
  const map = new Map();
  rows.forEach(r => map.set(r[key] || 'Sin dato', (map.get(r[key] || 'Sin dato') || 0) + 1));
  return [...map.entries()].sort((a,b) => b[1] - a[1]).slice(0, 10);
}

function renderOperatorSummary(rows, learning, kanban, session) {
  if (!els.operatorSummary) return;
  if (!session.operator) {
    els.operatorSummary.innerHTML = '<p class="empty-state compact-empty">Iniciá sesión para ver tus métricas.</p>';
    return;
  }
  const mine = rows.filter(r => r.operator === session.operator);
  const myLearning = learning.filter(r => r.operator === session.operator);
  const myKanban = kanban.filter(r => r.operator === session.operator);
  const resolved = mine.filter(r => r.outcome === 'Resuelto desde estación' || r.outcome === 'Servicio técnico evitado').length;
  const myResolvedTasks = myKanban.filter(r => ['resuelto', 'procedimiento'].includes(r.column)).length;
  els.operatorSummary.innerHTML = `<div class="summary-grid"><div><b>${mine.length}</b><span>casos cargados</span></div><div><b>${resolved}</b><span>resueltos</span></div><div><b>${myLearning.length}</b><span>dudas/eventos en espera</span></div><div><b>${myResolvedTasks}/${myKanban.length}</b><span>tarjetas Kanban resueltas</span></div></div>`;
}

function renderBars(el, entries, pareto) {
  if (!entries.length) { el.innerHTML = '<p class="empty-state">Todavía no hay casos registrados.</p>'; return; }
  const max = Math.max(...entries.map(e => e[1]));
  let accum = 0;
  const total = entries.reduce((s,e) => s + e[1], 0);
  el.innerHTML = entries.map(([label, value]) => { accum += value; const suffix = pareto ? ` · ${Math.round(accum * 100 / total)}% acum.` : ''; return `<div class="bar-row"><div class="bar-label">${escapeHtml(label)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(6, value * 100 / max)}%"></div></div><div>${value}${suffix}</div></div>`; }).join('');
}

function renderCaseRows(rows) {
  if (!rows.length) { els.caseRows.innerHTML = '<tr><td colspan="6">Todavía no hay casos guardados.</td></tr>'; return; }
  els.caseRows.innerHTML = rows.slice().reverse().map(r => `<tr><td>${new Date(r.date).toLocaleString()}</td><td>${escapeHtml(r.subscriber || 'Sin dato')}</td><td>${escapeHtml(r.system)}</td><td>${escapeHtml(r.pending ? '[Pendiente] ' + r.issue : r.issue)}</td><td>${escapeHtml(r.outcome)}</td><td>${escapeHtml(r.mood)}</td></tr>`).join('');
}

function exportCsv() {
  const rows = getCases();
  const headers = ['fecha','abonado','operador','sistema','consulta','decision','resultado','satisfaccion','pendiente','detalle_pendiente','link_video','nota'];
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => csvCell({fecha:r.date, abonado:r.subscriber, operador:r.operator, sistema:r.system, consulta:r.issue, decision:r.decision, resultado:r.outcome, satisfaccion:r.mood, pendiente:r.pending ? 'SI' : 'NO', detalle_pendiente:r.pendingDetail, link_video:r.videoLink, nota:r.note}[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vigilia-casos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) { return `"${String(value || '').replaceAll('"','""')}"`; }
function escapeHtml(text) { return String(text || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

