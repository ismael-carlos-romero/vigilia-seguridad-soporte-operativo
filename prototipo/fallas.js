/* Tablas de fallas de los teclados, tomadas de los manuales oficiales.
   Cada entrada cita manual y página. Los significados son literales del manual.
   "proc" apunta a PROCS: procedimientos de la central en BORRADOR (a validar por supervisión). */
(function(){
const o=(k,label,extra)=>Object.assign({k,label},extra||{});
const tec=(pref)=>[1,2,3,4,5,6,7,8].map(n=>o("Z"+n,pref+" tec N° "+n,pref==="Tamper"?{proc:"PROT-09"}:{}));

/* Alonso A2k4/A2k8 y Garnet comparten la tabla del teclado KPD-800 (LEDs de zona) */
function ledTable(v){
  const L=(k,label,press,sub,extra)=>o(k,label,Object.assign({press,sub},extra||{}));
  const S=(items)=>({prompt:"¿Qué LED de zona se enciende ahora?",options:items});
  return {
    prompt:"¿Qué LED de zona está encendido?",
    options:[
      L("Z1","Baja batería","1",S([o("Z1","Baja batería del panel",{proc:"PROT-11"}),o("Z2","Baja batería de la fuente auxiliar")])),
      L("Z2","Fallas de alimentación","2",S([o("Z1","Falla de red del panel",{proc:"PROT-10"}),o("Z2","Falla auxiliar"),o("Z3","Falla auxiliar bus de datos"),o("Z4","Falla de red de la fuente auxiliar")])),
      o("Z3","Falla de reloj",{note:"No tiene detalle. El panel perdió la hora: hay que reprogramar calendario y reloj."}),
      L("Z4","Fallas de módulos","4",S([o("Z1","Falla módulo expansor N° 1"),o("Z2","Falla módulo expansor N° 2"),o("Z3","Falla módulo expansor N° 3"),o("Z4","Falla módulo "+v.mob,{proc:"PROT-14"}),o("Z5","Falla módulo "+v.ip,{proc:"PROT-15"}),o("Z6","Falla fuente auxiliar"),o("Z7","Falla de línea telefónica",{proc:"PROT-13"}),o("Z8","Falla de sirena")])),
      L("Z5","Fallas de comunicación","5",S([o("Z1","Falla comunicación Tel1",{proc:"PROT-13"}),o("Z2","Falla comunicación Tel2",{proc:"PROT-13"}),o("Z3","Falla comunicación (esc1)"),o("Z4","Falla comunicación "+v.mob,{proc:"PROT-14"}),o("Z5","Falla comunicación SMS-Residencial"),o("Z6","Falla comunicación "+v.ip,{proc:"PROT-15"}),o("Z7","Falla comunicación IP-Residencial",{proc:"PROT-15"})])),
      L("Z6","Fallas de supervisión de teclados","6",S(tec("Falla de supervisión"))),
      L("Z7","Fallas de link","7",S([o("Z1","Falla link "+v.link1),o("Z2","Falla link "+v.link2)])),
      L("Z8","Tamper de teclados","8",S(tec("Tamper")))
    ]
  };
}

window.VIGILIA_FALLAS=[
 {id:"alonso-kpd800",system:"A2k4-A2k8",keypad:"teclado KPD-800 con LEDs",
  manual:{file:"alonso-a2k4-a2k8.pdf",name:"Manual Alonso A2k4/A2k8",page:20,label:"p. 20-21"},
  how:"Presionar [*] [2]. El teclado entra en la pantalla de fallas y cada falla general queda asociada a un LED de zona.",
  ask:"Pedile al cliente que presione [*] [2] y te diga qué LED de zona (Z1 a Z8) está encendido. Después que presione el número de ese LED.",
  lcd:"Si el teclado es LCD (KPD-860), informa la falla con un texto en el display (manual p. 7).",
  tree:ledTable({mob:"GPRS",ip:"IP-400",link1:"G2K8",link2:"IP-400"})},
 {id:"garnet-pc732",system:"Garnet",keypad:"teclado G-LED732 / KPD-800 con LEDs",
  manual:{file:"garnet-pc732.pdf",name:"Manual Garnet PC-732",page:18,label:"p. 18-19"},
  how:"Presionar [*] [2]. El teclado entra en la pantalla de fallas y cada falla general queda asociada a un LED de zona.",
  ask:"Pedile al cliente que presione [*] [2] y te diga qué LED de zona (Z1 a Z8) está encendido. Después que presione el número de ese LED.",
  lcd:"Si el teclado es LCD, informa la falla con un texto en el display (manual p. 7).",
  tree:ledTable({mob:"Datos Móviles",ip:"WiFi",link1:"Datos Móviles",link2:"WiFi"})},
 {id:"dsc-585",system:"DSC",keypad:"teclado DSC",
  manual:{file:"dsc-585.pdf",name:"Manual DSC PC585",page:17,label:"p. 13 (PDF 17)",extra:{file:"dsc-manual-usuario.pdf",name:"Manual de usuario DSC",page:5,label:"p. 5"}},
  how:"Presionar [*] [2]. Con teclado LCD, recorrer las fallas con [<] [>] y salir con [#].",
  ask:"Pedile al cliente que presione [*] [2] y te diga qué número de falla se enciende (1 a 8).",
  tree:{prompt:"¿Qué número de falla muestra el teclado?",options:[
   o("1","Necesidad de mantenimiento",{press:"1",action:"Llamar a mantenimiento.",sub:{prompt:"¿Qué número se enciende ahora?",options:[
     o("1","Batería con poca carga",{proc:"PROT-11"}),o("2","Circuito de la campanilla (sirena)"),o("3","Problema del sistema"),o("4","Violación del sistema"),o("5","Supervisión del módulo"),o("6","Obstrucción por RF"),o("7","Batería con poca carga en PC5204"),o("8","Falla de CA en PC5204")]}}),
   o("2","Pérdida de alimentación de CA (220 V)",{meaning:"Si el edificio o los alrededores quedaron sin energía eléctrica, el sistema sigue operando con la batería por varias horas.",action:"Llamar a mantenimiento.",proc:"PROT-10"}),
   o("3","Falla en la línea telefónica",{meaning:"El sistema detectó que la línea telefónica fue descolgada.",action:"Llamar a mantenimiento.",proc:"PROT-13"}),
   o("4","Falla en la comunicación",{meaning:"El sistema intentó comunicarse con la estación de monitoreo, pero falló. Puede deberse a la falla 3.",action:"Llamar a mantenimiento."}),
   o("5","Falla en el sensor (o zona)",{meaning:"El sistema tiene dificultades con uno o más sensores. Pulsar [5] para ver las zonas: los LEDs de zona que se encienden son los sensores con falla.",action:"Llamar a mantenimiento."}),
   o("6","Antiviolación (sabotaje) en el sensor o zona",{meaning:"El sistema detectó antiviolación en uno o más sensores. Pulsar [6] para ver las zonas.",action:"Llamar a mantenimiento.",proc:"PROT-09"}),
   o("7","Batería baja en el sensor (o zona)",{meaning:"Uno o más módulos o sensores tienen la batería con poca carga. Pulsar [7] para ver las zonas.",action:"Llamar a mantenimiento.",proc:"PROT-12"}),
   o("8","Pérdida de hora y fecha",{meaning:"Se perdió la alimentación por completo (CA y batería): la hora y fecha hay que reprogramarlas.",action:"Reprogramar hora y fecha."})]}},
 {id:"paradox-sp4000",system:"Paradox",keypad:"teclado Paradox SP / Spectra",
  manual:{file:"paradox-sp4000.pdf",name:"Manual Paradox SP4000",page:8,label:"p. 6 (PDF 8)"},
  how:"Cuando hay una falla se ilumina la tecla [FALLO]. Pulsar [FALLO] y el teclado ilumina el número de la falla.",
  ask:"Pedile al cliente que pulse [FALLO] y te diga qué número se ilumina.",
  tree:{prompt:"¿Qué número se ilumina?",options:[
   o("1","Batería baja en zona inalámbrica",{meaning:"Las baterías de uno o más dispositivos inalámbricos necesitan ser reemplazadas.",proc:"PROT-12"}),
   o("2","Fallo de alimentación",{meaning:"La central experimenta un fallo de alimentación.",proc:"PROT-10"}),
   o("3","Fallo de sirena",{meaning:"Sirena desconectada o sobrecargada en la central."}),
   o("4","Fallo de comunicación",{meaning:"El sistema está supervisado pero no puede comunicarse con la central receptora."}),
   o("5","Fallo de cableado / sabotaje de zona",{meaning:"Hay un problema de cableado en uno o más dispositivos."}),
   o("6","Fallo de sabotaje de módulo",{meaning:"Se activó el interruptor antisabotaje de un dispositivo.",proc:"PROT-09"}),
   o("7","Fallo en circuito de fuego",{meaning:"Una de las zonas tiene un fallo en el circuito de fuego."}),
   o("8","Pérdida de hora",{meaning:"Hay que reprogramar el reloj del sistema (ver configuración de fecha y hora, p. 5 del manual)."}),
   o("9","Pérdida de supervisión de zona inalámbrica",{meaning:"Una o más zonas inalámbricas dejaron de comunicarse con el sistema."}),
   o("0","Pérdida de supervisión de módulo",{meaning:"Uno o más módulos dejaron de comunicarse con el sistema."}),
   o("16","Fallo en teclado (tecla [NOCHE])",{meaning:"Un teclado del sistema experimenta un fallo."})]}},
 {id:"networx-nx4",system:"NetworX",keypad:"teclado de LEDs NetworX",
  manual:{file:"networx-nx4.pdf",name:"Manual NetworX NX-4",page:20,label:"p. 20-21"},
  how:"Con la luz Servicio encendida, pulsar [◆] y después [2]. Se ilumina la luz de una o más zonas. Para salir, pulsar [#].",
  ask:"Pedile al cliente que pulse [◆] [2] y te diga qué luz de zona se enciende.",
  tree:{prompt:"¿Qué luz de zona se enciende?",options:[
   o("1","Fallo del sistema",{press:"1",sub:{prompt:"¿Qué luz de zona se enciende ahora?",options:[
     o("1","Exceso de consumo",{meaning:"Exceso de consumo o cortocircuito en la fuente de alimentación de la central."}),
     o("2","Avería de sirena",{meaning:"Se cortó el cable que va a la sirena, por avería o sabotaje."}),
     o("3","Sabotaje de caja",{meaning:"Se activó el interruptor antisabotaje de la caja de la central.",proc:"PROT-09"}),
     o("4","Alimentación de expansor",{meaning:"A un elemento expansor no le llega bien su alimentación."}),
     o("5","Batería baja en expansor",{meaning:"La batería de reserva de un elemento expansor tiene la tensión baja."}),
     o("6","Sabotaje de caja de expansor",{meaning:"Se activó el interruptor antisabotaje de la caja de un expansor.",proc:"PROT-09"}),
     o("7","Avería de expansor",{meaning:"Un elemento expansor tiene alguna avería."}),
     o("8","Fallo de tierra",{meaning:"Se detectó un cortocircuito en la toma de tierra."})]}}),
   o("2","Sabotaje de zona",{meaning:"Pulsar [2]: se ilumina la luz de las zonas con sabotaje. Pulsar [#] para volver al primer nivel.",proc:"PROT-09"}),
   o("3","Batería baja de zona",{meaning:"Pulsar [3]: se ilumina la luz de las zonas con batería baja (solo zonas vía radio). Pulsar [#] para volver.",proc:"PROT-12"}),
   o("4","Pérdida de supervisión de zona",{meaning:"Pulsar [4]: se ilumina la zona que perdió la supervisión (solo zonas vía radio). Pulsar [#] para volver."}),
   o("5","Avería de zona",{meaning:"Pulsar [5]: se ilumina la luz de las zonas con alguna avería. Pulsar [#] para volver."}),
   o("6","Avería o corte de línea telefónica",{meaning:"La línea telefónica de la central no funciona bien, por avería o por sabotaje. Es una indicación global.",proc:"PROT-13"}),
   o("7","Fallo de comunicación",{meaning:"La central intentó enviar un mensaje a la central receptora y no pudo por un problema de comunicación. Es una indicación global."}),
   o("8","Pérdida del reloj del sistema",{meaning:"La central perdió toda su alimentación y el reloj se desprogramó: hay que volver a programarlo. Es una indicación global."})]}},
 {id:"matrix-6",system:"Matrix 6",keypad:"teclado Matrix 6/816",
  manual:{file:"matrix-6.pdf",name:"Manual Matrix 6/816",page:6,label:"p. 4 (PDF 6)"},
  how:"Si ocurre una falla, el teclado emite un sonido de dos tonos descendentes, enciende el ícono de falla y muestra el número de falla en el display. Las advertencias se muestran solo con el sistema desarmado y el mensaje se borra solo cuando la falla se restablece.",
  ask:"Pedile al cliente que lea el número que muestra el display (02 a 09).",
  tree:{prompt:"¿Qué número de falla muestra el display?",options:[
   o("02","Falla de fusible auxiliar",{meaning:"Falla del Sistema 2."}),
   o("03","Batería ausente",{meaning:"Falla del Sistema 3."}),
   o("04","Batería baja",{meaning:"Falla del Sistema 4.",proc:"PROT-11"}),
   o("05","Falla de energía alterna",{meaning:"Falla del Sistema 5.",proc:"PROT-10"}),
   o("06","Falla de línea telefónica",{meaning:"Falla del Sistema 6.",proc:"PROT-13"}),
   o("08","Falla de comunicación",{meaning:"Falla del Sistema 8."}),
   o("09","Batería cortada",{meaning:"Falla del Sistema 9. Solo en Matrix 816."})]}},
 {id:"visonic-powermax",system:"Visonic PowerMaxExpress",keypad:"panel Visonic PowerMaxExpress",
  manual:{file:"visonic-powermaxexpress.pdf",name:"Manual Visonic PowerMaxExpress",page:14,label:"p. 14 (PDF)"},
  how:"Cuando hay un problema el display alterna con el mensaje PROBL. Pulsar repetidamente el botón I OK: primero muestra la memoria, luego zonas abiertas y por último las causas de problema.",
  ask:"Pedile al cliente que lea qué dice el display cuando pulsa I OK.",
  tree:{prompt:"¿Qué problema indica el display?",options:[
   o("","Fallo de suministro AC",{meaning:"No hay energía y el sistema trabaja con la batería de respaldo.",proc:"PROT-10"}),
   o("","Interferencias de sistema",{meaning:"Una señal de radiofrecuencia bloquea el canal entre los sensores y el panel."}),
   o("","Fallo de comunicaciones",{meaning:"No se pudo enviar un mensaje a la estación de monitoreo o a un teléfono privado (o se envió y no fue reconocido)."}),
   o("","Batería baja CPU",{meaning:"La batería de respaldo del panel está débil y debe reemplazarse.",proc:"PROT-11"}),
   o("","Sabotaje CPU",{meaning:"Se está manipulando el panel de control.",proc:"PROT-09"}),
   o("","Problema de fusible",{meaning:"El fusible de sirena está quemado."}),
   o("","Fallo de línea",{meaning:"Hay un problema con la línea telefónica.",proc:"PROT-13"})]}}
];

/* Procedimientos de la central, tomados de la hoja "Manual_Operativo" (PROT-xx). BORRADOR: falta validación de supervisión. */
window.VIGILIA_PROCS={
 "PROT-09":{t:"Tamper (sabotaje / toqueteo)",s:"Verificar si el usuario cambia baterías. Contención telefónica; si no justifica la manipulación, tratar como evento de intrusión. Si el sensor tiene rotura física, generar orden de servicio técnico."},
 "PROT-10":{t:"Corte de energía (falta 220 V)",s:"Informar de inmediato al abonado titular. Verificar en Historial/MSG si se envió el SMS automático; si no, llamar o WhatsApp. Aclarar que el panel funciona con batería auxiliar hasta que vuelva el 220 V."},
 "PROT-11":{t:"Batería baja del panel central",s:"Verificar si hubo corte de luz en la zona del cliente. Si hay luz, poner en espera a que se restaure; si no se restaura, generar orden técnica. Indicar que el equipo requiere service si no recupera carga al volver la energía."},
 "PROT-12":{t:"Batería baja de sensor o zona",s:"Notificar al cliente con la plantilla de batería. Pedirle aviso para poner el panel en prueba al momento del cambio. Si la señal llega de 22:00 a 07:00, dejar en espera en el sistema hasta las 07:00."},
 "PROT-13":{t:"Falta de testeo telefónico / línea",s:"Verificar historial y solicitar prueba. Si falla la línea, indicar que no tiene monitoreo activo hasta su reparación física. Cedular tildando “Reactivar en sistema” y generar orden de mantenimiento."},
 "PROT-14":{t:"Falta de comunicación GPRS",s:"Con 1 hora sin test: verificar y pedir pruebas. Si llegan, asentar “Falla comunicación”. Si no, pausar el servicio y generar orden de service."},
 "PROT-15":{t:"Falla de comunicación IP (red)",s:"Contactar y pedir reinicio del router. Si no restaura, servicio pausado por internet; si hay red y no reporta, orden de service."}
};
})();
