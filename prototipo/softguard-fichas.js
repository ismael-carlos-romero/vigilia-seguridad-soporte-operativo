/* Manual Inteligente SoftGuard: fichas operativas.
   Cada paso lleva [texto, página del PDF, cita textual del manual]. softguard.test.cjs verifica que la cita
   exista en esa página y que los nombres de botones entre «» aparezcan en ella: nada se inventa.
   nivel: mínimo de rol para ver los pasos (op / sup / adm). advertencia: texto de seguridad (criterio del sistema, no del manual).
   interno: ids de procedimientos MON-01 (window.VIGILIA_MODULOS.procs), solo lectura.
   parcial: el manual cubre solo una parte. faltan: lo que el manual no documenta. */
(function(){
const M="tec167-rd181220";
const F=(id,cat,titulo,claves,o,pasos)=>Object.assign({id,cat,titulo,claves,manual:M,nivel:"op",interno:[],pasos:pasos.map(([t,p,q])=>({t,p,q}))},o);

window.SG_CATEGORIAS=[
 ["eventos","Monitoreo de eventos"],
 ["alarmas","Gestión y procesamiento de alarmas"],
 ["prueba","Poner cuentas o zonas en prueba"],
 ["falsos","Falsos disparos"],
 ["aperturas","Aperturas y cierres"],
 ["comunicacion","Fallas de comunicación"],
 ["codigos","Códigos de evento (TAM, BUR, ALR, NSR y otros)"],
 ["tecnico","Servicio técnico"],
 ["cuentas","Administración de cuentas"],
 ["reportes","Reportes e informes"]
];

window.SG_FICHAS=[
/* ---------- Monitoreo de eventos ---------- */
F("abrir-evento","eventos","Abrir un evento para atenderlo (atención manual)","abrir tomar atender evento pendiente doble clic señal alarma ingreso",{},[
 ["Entrá a la pestaña «Pendientes»: ahí están los eventos que esperan atención, ordenados por prioridad y hora de ingreso.",34,"listado ordenado por prioridad del evento y hora de ingreso"],
 ["Hacé doble clic sobre el evento, o presioná el icono «Abrir evento».",40,"haciendo doble clic sobre cualquier evento"],
 ["Se abre la ventana de atención del evento, desde donde se procesa.",40,"desde donde podrá procesar el evento de alarma"],
 ["Si otro operador o terminal ya lo tiene abierto, el sistema avisa que no se puede abrir.",34,"no es posible abrir el evento seleccionado"]]),
F("atencion-automatica","eventos","Atención automática: el sistema abre los eventos solo","automatica automático abre solo siguiente evento cola prioridad",{},[
 ["Con atención automática, el sistema abre de inmediato el primer evento disponible.",41,"se abrirá de forma inmediata, el primer evento que se encuentre disponible"],
 ["No elegís cuál atender: se ordenan por prioridad y/o fecha de ingreso.",41,"el operador no tiene opción de elegir cual será el evento que atenderá"],
 ["Al procesar el evento actual, se abre el siguiente, de a uno por vez.",41,"se abrirán de a uno por vez"]]),
F("filtrar-eventos","eventos","Filtrar y buscar eventos en las listas","filtrar filtro buscar eventos lista origen tipo grupo prioridad dealer cuenta fecha ver todos excluir",{},[
 ["Presioná «Filtrar» y elegí las condiciones: origen, tipo, grupo, prioridad, evento, dealer, cuenta, código de alarma o fechas.",35,"El botón FILTRAR permite aplicar distintos tipos de configuraciones"],
 ["Presioná «Buscar» para ver los resultados. Podés combinar varios filtros.",36,"los filtros son de selección múltiple y también puede combinar diferentes filtros"],
 ["«Ver Todos» quita todos los filtros aplicados.",36,"Anula la aplicación de cualquier filtro que se hubiera seleccionado"]]),
F("pestanas","eventos","Qué muestra cada pestaña (Pendientes, Mis eventos, En espera, Tiempo real)","pestañas solapas pendientes mis eventos en espera tiempo real otros operadores supervisión dónde está el evento",{},[
 ["«Pendientes»: eventos nuevos o pendientes de atención.",29,"Visualiza eventos nuevos o Pendientes de atención"],
 ["«Mis Eventos»: los eventos que abriste vos y todavía no terminaste.",29,"Visualiza eventos pendientes de proceso que hayan sido abiertos por un mismo operador"],
 ["«En Espera»: los eventos pasados a espera desde cualquier terminal.",29,"Visualiza aquellos eventos que han sido pasados a Espera de atención desde cualquier terminal"],
 ["«En espera propios»: solo los que pasaste a espera desde la terminal donde estás trabajando.",30,"desde la Terminal donde se encuentre trabajando"],
 ["«Tiempo real»: muestra el ingreso de eventos a medida que llegan.",31,"Visualiza el ingreso de eventos en tiempo real"]]),
F("cambio-operador","eventos","Cambio de operador (relevo de turno)","cambio operador relevo turno salir entrar credenciales dss",{},[
 ["Presioná «Cambio de operador» en la barra de funciones.",25,"presione el botón Cambio de operador"],
 ["El operador que entra ingresa sus credenciales de la plataforma DSS.",25,"ingrese las credenciales que utiliza para ingresar a la plataforma DSS"],
 ["Los eventos que tenía abiertos el operador que sale pasan automáticamente al que entra.",25,"heredará de forma automática, todos los eventos asignados al operador que sale"]]),
F("salir-sin-evento","eventos","Cerrar el módulo sin dejar eventos abiertos","salir cerrar módulo sin tomar evento fin turno cerrar sesión",{},[
 ["Presioná «Salir sin tomar evento» y terminá de atender el último evento que tengas abierto.",26,"presione el botón Salir sin tomar evento y luego, proceda a la atención del evento que tenga abierto"],
 ["Recién entonces se cierra el módulo y no queda ningún evento asociado a tu usuario.",26,"sin que queden eventos asociados al operador"]]),

/* ---------- Gestión y procesamiento de alarmas ---------- */
F("procesar-evento","alarmas","Terminar (procesar) un evento","procesar terminar cerrar finalizar evento categorizacion resolucion observacion procesa botón",{},[
 ["Anotá lo ocurrido en el campo de observación y presioná «Guardar».",48,"debe hacer Clic en el botón de GUARDAR"],
 ["Elegí la categorización en el menú desplegable (sirve para indicar si la alarma es real o no).",49,"Se utiliza regularmente para identificar si la alarma es real o no lo es"],
 ["Elegí la resolución: una breve descripción del resultado de la verificación.",50,"una breve descripción sobre cuál fue el resultado de la verificación del evento"],
 ["Según cómo esté configurada la central, la categorización puede venir autocompletada, ser opcional u obligatoria.",49,"Campo vacío y categorización obligatoria"],
 ["Presioná «Procesa» para concluir la atención del evento.",57,"Este botón permite concluir el proceso de atención de un evento"],
 ["«Procesa» solo se habilita si el evento tiene categorización y resolución.",57,"es necesario que el evento cuente con una categorización y resolución"]]),
F("pasar-a-espera","alarmas","Pasar un evento a espera y retomarlo","espera posponer dejar en espera retomar volver más tarde minutos",{},[
 ["Presioná «Espera» para posponer la atención del evento.",55,"Permite posponer la atención de un evento enviándolo a la ventana de Eventos en Espera"],
 ["Con los botones de avance elegí por cuánto tiempo: se ajusta de a 5 minutos.",55,"rangos de 5 minutos"],
 ["Para retomarlo, abrilo desde «En Espera» (todos) o «En espera propios» (solo los tuyos).",55,"levantándolo desde la Pestaña En Espera Propios"],
 ["Al terminar el tiempo de espera, el evento vuelve a «Pendientes».",55,"el evento regresará a la pestaña Pendientes"],
 ["La central puede limitar cuántos eventos se pueden dejar en espera y por cuánto tiempo.",56,"Establece un límite al máximo de señales que pueden ser pasadas a Espera"]]),
F("devolver-pendiente","alarmas","Devolver un evento a pendientes","devolver pendiente liberar soltar otro operador",{},[
 ["Presioná «Pendiente» para devolver el evento a la lista de pendientes.",57,"Este botón permite regresar un evento a la ventana de eventos"],
 ["Queda disponible para que lo atienda otro operador.",57,"para que pueda ser atendido por un operador diferente"],
 ["Si no hay otros operadores conectados, vuelve a vos.",57,"Si no hay otros operadores conectados, el evento regresará al mismo operador"]]),
F("derivar-supervision","alarmas","Derivar un evento al supervisor","derivar supervisor supervisión escalar pasar a supervisor",{},[
 ["Con el evento abierto, presioná el botón «Supervisión».",98,"inicie la atención de cualquier evento y luego presione el botón Supervisión"],
 ["El evento pasa al supervisor, que continúa con la gestión.",98,"el evento será derivado al supervisor para que este, continúe con la gestión"],
 ["Solo funciona si tu usuario tiene permiso para enviar a supervisión.",98,"Permiso para enviar a supervisión"]]),
F("procesar-varios","alarmas","Procesar varios eventos a la vez (Procesar todos / Proceso masivo)","procesar todos proceso masivo varios eventos juntos masivo lote",{
 nivel:"sup",advertencia:"Aplica la misma categorización y resolución a todos los eventos seleccionados. Usalo solo con autorización de supervisión y revisando que ninguno requiera atención individual."},[
 ["Presioná «Procesar todos» o «Proceso masivo» (si tu usuario lo tiene habilitado).",37,"Esta función permite el procesamiento múltiple de eventos que se encuentren pendientes de atención"],
 ["«Procesar todos» permite hasta 50 eventos seleccionables.",12,"hasta 50 eventos seleccionables"],
 ["Con «Procesar todos» los eventos quedan reservados para vos: nadie más puede tomarlos hasta que termines.",58,"ningún operador podrá ver o tomar los eventos reservados"],
 ["Con «Proceso masivo» no se reservan: otro operador puede tomar un evento de la lista antes de que termines.",91,"cualquier operador podrá ver o tomar cualquier evento que todavía no haya sido procesado"],
 ["Marcá los eventos, elegí categorización y resolución (podés sumar una observación) y presioná «Procesar», o pasalos a «Espera».",59,"Seleccione los eventos que desee procesar y elija la categorización y resolución que correspondan"]]),
F("colaborar","alarmas","Ayudar en un evento de otro operador (colaboración)","colaborar colaboración ayudar otro operador compartir evento",{},[
 ["Abrí la pestaña «Otros operadores» y hacé doble clic sobre el evento en el que querés colaborar.",96,"Abra la pestaña llamada Otros operadores y luego haga doble clic sobre cualquier evento"],
 ["Podés registrar novedades de llamadas, comentarios y envío de móviles, pero el cierre lo hace el operador principal.",96,"el cierre del evento estará a cargo del operador principal"],
 ["Cuando termines, presioná «Cerrar»: no procesa el evento.",97,"Esta acción NO finaliza (procesa) el evento"],
 ["Requiere que tu usuario tenga habilitada la «Colaboración de eventos».",96,"marque la casilla Colaboración de eventos"]]),
F("llamar","alarmas","Llamar a un contacto desde el evento","llamar llamada teléfono contacto titular marcar clave permiso colgar registro llamada",{},[
 ["Presioná «Llamar» y elegí el vínculo de comunicación (Dialer, Skype, Zoiper, Logger, etc.).",60,"seleccionar el vínculo de comunicación"],
 ["Elegí el contacto en las listas de contactos.",61,"Permite visualizar las diferentes listas de contactos"],
 ["Usá la clave y el permiso que se muestran para validar la identidad del contacto.",60,"los datos necesarios para validar la identidad de los contactos"],
 ["Cada contacto llamado queda marcado en verde.",61,"el contacto seleccionado será marcado en color verde"],
 ["Antes de cortar tenés que elegir la resolución de la llamada.",62,"es obligatorio ingresar una resolución de llamada antes de poder finalizar la misma"],
 ["Presioná «Colgar» y, para salir de la ventana, «Cerrar».",63,"presione el botón cerrar para salir de la ventana de llamadas"]]),
F("notificar","alarmas","Enviar una notificación (SMS, email o push)","notificar notificación sms mensaje email correo push aviso enviar",{},[
 ["Presioná «Notificaciones» y elegí el tipo: Enviar push, Enviar SMS o Enviar Email.",64,"seleccionar el tipo de notificación que utilizará"],
 ["SMS: completá «Para» y «Modem SMS», escribí el mensaje y presioná «Enviar».",66,"Modem SMS: define el modem que se utilizará para el envío"],
 ["El SMS requiere un módem capaz de enviar comandos AT.",64,"Requiere de un MODEM capaz de enviar comandos AT"],
 ["Email: elegí el correo de la cuenta con «Agregar email» o escribí el destinatario en «Para»; completá «Asunto» y el mensaje.",66,"Podrá seleccionar el correo electrónico registrado en la cuenta"],
 ["Push: solo la reciben los teléfonos con SmartPanics.",64,"estas solo pueden ser recibidas en teléfonos con SmartPanics"]]),
F("asignar-movil","alarmas","Asignar un móvil o guardia a un evento","asignar móvil guardia patrulla despachar mapa ruta liberar vigilador",{},[
 ["Presioná «Móvil»: la cuenta en alarma aparece en el centro del mapa.",75,"aparecerá la cuenta en alarma, en el centro de la ventana"],
 ["Hacé clic sobre el móvil o guardia que querés asignar.",75,"Ahora haga clic sobre el móvil de patrulla o guardia de seguridad que desee asignar"],
 ["El mapa muestra la ruta sugerida y el panel derecho, el tiempo estimado.",76,"el sistema mostrará en el mapa la ruta sugerida para arribar al objetivo"],
 ["Presioná «Asignar»: queda seleccionado y no recibe nuevas asignaciones hasta que se lo libere.",76,"no podrá recibir nuevas asignaciones hasta que no se dé por liberado"],
 ["Con «Liberar» vuelve a quedar disponible. Al procesar el evento se libera solo.",81,"quedará liberado en forma automática"]]),

/* ---------- Poner cuentas o zonas en prueba ---------- */
F("poner-en-prueba","prueba","Poner una cuenta o zonas en prueba","prueba poner en prueba cuenta zonas técnico instalando service tiempo de prueba habilitar",{
 nivel:"sup",interno:["panel-prueba"],
 advertencia:"Una cuenta en prueba puede dejar de atender señales reales durante ese lapso. Hacelo solo con autorización de supervisión y validando la identidad de quien lo pide (técnico o cliente), como indica el procedimiento MON-01 5.24."},[
 ["Con el evento abierto, presioná «Poner en prueba».",85,"Mediante este botón será posible cambiar el estado de una cuenta"],
 ["Elegí el estado: «En Prueba» (toda la cuenta), «En Prueba por zonas» (solo las zonas elegidas) o «Habilitada».",85,"pudiendo elegir dejarla en estado de Prueba, en Prueba por Zonas o Habilitada"],
 ["Definí por cuánto tiempo queda en prueba. Pasado ese tiempo la cuenta vuelve a estar Habilitada.",85,"la cuenta pasara a estar Habilitada para recibir eventos en forma normal"],
 ["Podés agregar una observación al cambio de estado.",85,"También se podrá asociar una observación o nota al cambio de estado"],
 ["Presioná «Guardar» para aplicar el cambio.",85,"será necesario presionar el botón guardar para aplicar el cambio de estado"]]),

/* ---------- Falsos disparos ---------- */
F("falsa-alarma","falsos","Falsa alarma: cómo registrarla","falsa alarma falso disparo no real error de usuario cancelada falsas alarmas límite",{
 parcial:true,interno:["falsa-alarma","intrusion"],
 nota:"El manual TEC 167 no describe un procedimiento de falsa alarma: solo la categorización y el indicador de límite. Los criterios de cierre (cancelada, climática, error de usuario, falla de sistema) son del procedimiento interno MON-01 5.9."},[
 ["Para dejar asentado que la alarma no fue real, elegí la categorización que corresponda al procesar.",49,"identificar si la alarma es real o no lo es"],
 ["Si la cuenta superó el límite de falsas alarmas permitidas, un ícono de la barra de información lo indica.",45,"Informa si la cuenta ha superado el límite de falsas alarmas permitidas"]]),

/* ---------- Aperturas y cierres ---------- */
F("evento-manual","aperturas","Generar un evento manual (por ejemplo apertura o cierre)","evento manual generar crear apertura cierre opn clo robo bur pánico pan simulado capacitación",{
 nivel:"sup",interno:["apertura","cierre"],
 advertencia:"Crea un evento en una cuenta real y entra a la lista de pendientes. Usalo solo con autorización de supervisión (por ejemplo, para capacitación o por indicación expresa)."},[
 ["Presioná «Generar evento manual» en la barra de funciones.",26,"haga clic en el botón Generar evento manual"],
 ["Elegí la cuenta con «Seleccione una Cuenta» y el evento con «Seleccione un evento».",27,"Presione el botón Seleccione una Cuenta para elegir la cuenta donde será creado el evento"],
 ["El evento solo aparece en la lista si su código de alarma tiene «Manual» en SI.",27,"tenga seleccionada la opción SI en la casilla Manual"],
 ["Para aperturas y cierres (OPN / CLO) se elige el «Usuario».",27,"Usualmente se utiliza esta configuración para generar eventos de OPN / CLO"],
 ["Para robo o pánico (BUR / PAN) se elige la «Zona».",27,"Usualmente se utiliza esta configuración para generar eventos de BUR / PAN"],
 ["Sin cambiar la fecha y hora, el evento se genera de inmediato; también se puede programar a futuro.",27,"el evento se generará inmediatamente"],
 ["Presioná «Generar»: el evento se suma a la lista de pendientes.",28,"el evento será sumado a la lista de pendientes"]]),
F("horario-alternativo","aperturas","Cambiar el horario de cierre solo por hoy (horario alternativo)","horario alternativo cierre control horario minutos nueva acción apertura tolerancia",{
 nivel:"sup",interno:["apertura","cierre"],
 advertencia:"Modifica el control de horarios de la cuenta para el día en curso y puede evitar un aviso de cierre o apertura. Hacelo solo con autorización de supervisión y dejalo asentado."},[
 ["Con el evento abierto, presioná «Horario alternativo».",86,"Permite especificar un nuevo horario de cierre para un objetivo"],
 ["Escribí el nuevo valor en «Minutos para nueva acción» y presioná «Aceptar».",86,"ingrese un nuevo valor en el campo Minutos para nueva acción"],
 ["Vale una sola vez, para el día en curso; después la cuenta sigue con su control de horarios.",86,"la modificación solo es válida una única vez para el día en curso"],
 ["Para un cambio definitivo hay que ir al control de horarios de la cuenta, en el Administrador de Cuentas.",86,"deberá acceder al control de horarios de la cuenta desde al Administrador de Cuentas"]]),
F("fallo-apertura-cierre","aperturas","Fallo de apertura o de cierre (qué hacer)","fallo de apertura fallo de cierre no abrió no cerró no desactivó no activó fuera de horario control horario tolerancia",{
 insuficiente:true,interno:["apertura","cierre","fuera-horario"],
 nota:"El manual TEC 167 no explica cómo gestionar un fallo de apertura o de cierre. Solo está documentado cambiar el horario de cierre del día (ficha «horario alternativo»). Seguí el procedimiento interno MON-01."},[]),

/* ---------- Fallas de comunicación ---------- */
F("falla-comunicacion","comunicacion","Falla de comunicación (línea, GPRS, IP)","falla de comunicación línea telefónica gprs ip internet router sin monitoreo comunicador no comunica test",{
 insuficiente:true,interno:["linea-telefonica","gprs","ip","agenda-comunicacion"],rel:["llamar","pedir-servicio-tecnico"],
 nota:"El manual TEC 167 no documenta cómo resolver fallas de comunicación. Está documentado cómo llamar al titular («Llamar») y cómo pedir un servicio técnico (ver fichas relacionadas). Los pasos de la falla son del procedimiento interno MON-01."},[]),

/* ---------- Códigos de evento ---------- */
F("codigos-evento","codigos","Códigos de evento: TAM, BUR, ALR, NSR, OPN, CLO, PAN","tam bur alr nsr opn clo pan códigos de alarma código significado tamper sabotaje robo pánico",{
 parcial:true,faltan:["TAM","ALR","NSR"],
 nota:"En este manual solo figuran BUR / PAN (robo / pánico) y OPN / CLO (apertura / cierre). TAM, ALR y NSR no están documentados en el manual TEC 167: cargá el manual correspondiente o un procedimiento interno para cubrirlos."},[
 ["OPN / CLO corresponden a apertura y cierre.",27,"OPN / CLO (Apertura o Cierre)"],
 ["BUR / PAN corresponden a robo y pánico.",27,"BUR / PAN (Robo o Pánico)"],
 ["Para ver qué hacer con un código, abrí el evento y tocá el icono de instrucciones del código de alarma, si tiene cargadas.",45,"Muestra las instrucciones incorporadas al Código de Alarma"],
 ["Cada código puede tener su propio color, sonido y condición de alarma.",43,"se podrá modificar el color que representa el evento, el sonido que debe reproducirse y su condición de alarma"]]),

/* ---------- Servicio técnico ---------- */
F("pedir-servicio-tecnico","tecnico","Pedir un servicio técnico desde un evento","servicio técnico pedir solicitar visita técnico mantenimiento orden de trabajo service",{
 interno:["mantenimiento"]},[
 ["Con el evento abierto, presioná «Nuevo servicio técnico».",84,"deberá presionar el botón Nuevo servicio técnico"],
 ["Completá «Tipo de servicio», «Tarea / Servicio» y «Observaciones».",84,"Tipo de servicio: Permite establecer la condición del servicio técnico"],
 ["Indicá la causa y una fecha tentativa de visita.",84,"indicando la causa y una fecha tentativa de visita"],
 ["Presioná «Guardar»: la orden queda en el módulo de Servicio Técnico, donde se define el técnico y el transporte.",84,"la orden de trabajo aparecerá disponible en el módulo de servicio técnico"],
 ["Requiere el módulo de Servicio Técnico habilitado en la licencia.",84,"Esta función requiere tener habilitado el módulo de Servicio Técnico"]]),
F("ver-servicios-tecnicos","tecnico","Ver los servicios técnicos de una cuenta, reclamos e impresión","servicio técnico ver historial órdenes reclamo desconformidad imprimir orden de trabajo",{},[
 ["Presioná «Servicio técnico»: se abre la lista de servicios técnicos vinculados a la cuenta.",83,"se visualizarán todos los registros de servicios técnicos vinculados a la cuenta"],
 ["Usá los filtros para ver los servicios según su estado.",83,"diferentes filtros para la visualización de servicios técnicos"],
 ["«Reclamos» permite ingresar una novedad por desconformidad o incumplimiento.",83,"permite ingresar una novedad por desconformidad o incumplimiento"],
 ["«Impresión» imprime la orden de trabajo para entregarla al técnico.",83,"permite efectuar la impresión de la orden de trabajo"]]),

/* ---------- Administración de cuentas ---------- */
F("buscar-cuenta","cuentas","Buscar una cuenta mientras atendés un evento","buscar cuenta abonado consultar otra cuenta datos filtros",{},[
 ["Presioná «Buscar cuenta» en la barra de funciones.",21,"presione el botón Buscar cuenta para abrir la ventana de búsqueda"],
 ["Elegí la cuenta o usá los filtros para encontrarla más rápido.",21,"utilice los filtros para localizar la información de forma más rápida"],
 ["Se muestran solo los datos que tu usuario puede ver: algunas cuentas pueden no mostrarse o verse parciales.",21,"Los datos se visualizarán en función de los permisos del usuario"]]),
F("datos-cuenta","cuentas","Ver los datos de la cuenta (y qué no se puede cambiar desde acá)","datos de la cuenta ver modificar cambiar editar solo lectura teléfonos titular dirección",{
 parcial:true,
 nota:"Desde Monitoreo Web los datos de la cuenta son de solo lectura. Para modificarlos se usa el Administrador de Cuentas, cuyo manual no está cargado todavía."},[
 ["Con el evento abierto, presioná «Datos» (margen izquierdo).",54,"presione sobre el botón de Datos, ubicado en el margen izquierdo"],
 ["Los datos se ven en solo lectura: desde Monitoreo Web no se pueden modificar.",54,"estará disponible en modo de solo lectura"],
 ["También se ven referencias de servicio técnico, facturación e imágenes cargadas en la cuenta.",54,"información de referencia asociada a módulos complementarios"]]),
F("notas-bitacora","cuentas","Dejar una novedad en la cuenta: bitácora y notas","nota bitácora novedad dejar nota temporal principal registrar cuenta vigencia",{
 interno:["directivas"],
 advertencia:"Las notas se muestran a todos los operadores cada vez que se abre un evento de la cuenta. Escribilas solo con respaldo de una directiva o procedimiento (las notas temporales llevan vigencia, MON-01 5.26)."},[
 ["En «Bitácora» presioná «Agregar» y después «Guardar».",52,"Para agregar un nuevo registro a la bitácora, presione sobre el botón Agregar"],
 ["Lo que se guarda en la bitácora no se puede editar ni eliminar; queda con fecha, hora y tu nombre.",52,"la información registrada en la bitácora no puede editarse ni eliminarse"],
 ["En «Notas» podés crear una nota principal (permanente) o una temporal (con fechas de vigencia).",53,"Desde la ventana de Notas podrá crear notas principales o temporales"],
 ["La nota se muestra cada vez que se abre un evento de esa cuenta; la temporal, hasta que vence.",53,"se visualizará cada vez que se abra un evento para su procesamiento"],
 ["Las notas las puede editar o eliminar cualquier operador con acceso a la modificación de cuentas.",53,"puede ser editada o eliminada por cualquier operador que tenga acceso a la modificación de Cuentas"]]),
F("auto-monitoreo","cuentas","Auto monitoreo: que la cuenta se procese sola","auto monitoreo automonitoreo autoprocesar procesar solo sin operador sms correo prioridad",{
 nivel:"adm",
 advertencia:"Con Auto monitoreo los eventos de la cuenta se procesan solos y el operador queda fuera: pueden quedar señales sin atención humana. Solo administración."},[
 ["Se configura en Administrador de cuentas / Web Dealer, no en Monitoreo Web: Cuenta del cliente, pestaña «Auto Monitoreo».",87,"Cuenta del cliente >> Pestaña Auto Monitoreo"],
 ["«Auto-procesamiento de eventos»: SI o NO. Por defecto está en NO.",88,"Esta opción por defecto está en NO"],
 ["«Prioridad de eventos a auto-procesar»: define desde qué nivel de prioridad se procesan solos.",88,"los eventos que ingresen serán Auto procesados por el sistema"],
 ["Para que se avise al usuario, antes hay que tener configurado el medio de notificación (SMS, correo u otro).",88,"se deben haber elegido y configurado previamente, los medios"]]),

/* ---------- Reportes e informes ---------- */
F("eventos-cuenta","reportes","Ver eventos anteriores y posteriores de la cuenta","historial eventos de la cuenta anteriores posteriores ver memoria registro detalle evento",{},[
 ["Con el evento abierto, mirá la solapa «Eventos de la Cuenta»: muestra los eventos históricos.",46,"Permite acceder de forma rápida a los eventos históricos de la cuenta"],
 ["Aplicá filtros para elegir qué eventos ver.",46,"Podrá aplicar diferentes filtros para seleccionar los eventos que desee visualizar"],
 ["Doble clic en un evento para ver su detalle (procesamiento, timeline, posición).",46,"se abrirá una ventana emergente mostrando el detalle de dicho evento"],
 ["«Eventos Posteriores» muestra en tiempo real lo que ingresa a la cuenta después del evento abierto.",47,"Provee información en tiempo real sobre cualquier evento que ingrese a la cuenta"]]),
F("timeline","reportes","Ver el timeline (línea de tiempo) de un evento","timeline línea de tiempo proceso del evento quién lo atendió operador tiempo",{},[
 ["El «Timeline» muestra el estado actual del evento y todos los procesos por los que pasó.",51,"que muestra el estado actual del evento y todos los procesos por los que ha pasado"],
 ["Cada registro indica tiempo, comentario, fecha, operador y origen.",51,"Operador: Operador asociado el proceso"],
 ["Doble clic sobre un registro para ver el detalle ampliado.",51,"Presionando 2 veces sobre cualquier registro, este se abrirá, mostrando un detalle ampliado"]]),
F("historial-movil","reportes","Reporte de recorrido de un móvil o guardia","historial recorrido posiciones móvil guardia reporte exportar mapa patrulla",{},[
 ["En «Móvil», abrí «Historial» con el móvil o guardia seleccionado.",79,"Permite generar un reporte histórico de posiciones del móvil o guardia seleccionado"],
 ["Elegí el período con los filtros desde-hasta y presioná «Buscar».",79,"Seleccione el periodo del cual desee obtener información utilizando los filtros desde-hasta"],
 ["Podés recrear el recorrido en el mapa.",79,"Permite generar la recreación del recorrido en el mapa"],
 ["Podés exportar la información obtenida.",79,"Permite exportar la información obtenida"]]),
F("reporte-autoridad","reportes","Reporte a la autoridad","reporte autoridad policía derivar notificar autoridad designada",{
 parcial:true,interno:["panico","fuego","intrusion"],
 advertencia:"Notifica a una autoridad por un evento real. Confirmá primero con el procedimiento MON-01 que corresponde al tipo de evento.",
 nota:"El manual explica los requisitos y los modos de reporte, pero no detalla los botones para enviar un reporte manual."},[
 ["La función notifica a las autoridades designadas sobre un evento pendiente de proceso.",82,"se puede notificar a las autoridades designadas sobre un evento pendiente de proceso"],
 ["Requiere el módulo «Reporte Autoridad» en la licencia y una autoridad configurada en el sistema.",82,"Debe disponer del módulo Reporte Autoridad en su licencia"],
 ["Con «Reporte Manual», el operador decide si el evento debe ser reportado, y igual lo procesa.",82,"El evento ingresa y el operador deberá determinar si debe ser reportado"],
 ["Con «Reporte Automático», el evento se envía solo a la autoridad, y el operador igual lo procesa.",82,"El evento que ingresa se envía en forma automática a la autoridad designada"]]),
F("llamadas-grabadas","reportes","Grabar una llamada entrante y escucharla después","grabar llamada entrante grabación logger escuchar audio informe llamadas",{},[
 ["Presioná «Grabar llamada entrante» en la barra de funciones.",20,"Para iniciar la grabación de una llamada presione el botón Grabar llamada entrante"],
 ["Elegí la cuenta de monitoreo del cliente que llama, porque el sistema no la identifica solo.",20,"deberá seleccionar una cuenta de monitoreo"],
 ["Presioná «Comenzar a grabar».",20,"presione el botón Comenzar a grabar para iniciar la grabación"],
 ["Para escucharla después: solapa Informe, Llamadas, de la cuenta elegida.",20,"Informe -> Llamadas, de la cuenta elegida"],
 ["Requiere el módulo LOGGER en la licencia.",20,"debe contar con el modulo LOGGER dentro de su licencia"]])
];
})();
