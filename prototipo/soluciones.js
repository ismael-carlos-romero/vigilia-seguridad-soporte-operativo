/* Cómo resolverlo por teléfono, después de identificar la falla.
   Las teclas salen de los manuales (cada paso cita archivo y página del PDF).
   Las reglas de la central (probar la línea con emergencia médica, anular la zona y generar service)
   las indicó el operador; quedan para validar con supervisión. */
(function(){
const M={
 alonso:{file:"alonso-a2k4-a2k8.pdf",name:"Manual Alonso A2k4/A2k8"},
 garnet:{file:"garnet-pc732.pdf",name:"Manual Garnet PC-732"},
 dsc:{file:"dsc-manual-usuario.pdf",name:"Manual de usuario DSC"},
 paradox:{file:"paradox-sp4000.pdf",name:"Manual Paradox SP4000"},
 networx:{file:"networx-nx4.pdf",name:"Manual NetworX NX-4"},
 matrix:{file:"matrix-6.pdf",name:"Manual Matrix 6"}
};
const src=(k,page,label)=>Object.assign({page,label:label||"p. "+page},M[k]);
const SIS={"A2k4-A2k8":"alonso","Garnet":"garnet","DSC":"dsc","Paradox":"paradox","NetworX":"networx","Matrix 6":"matrix"};

const HORA={
 alonso:{steps:["Que presione [*] [8].","Que elija [2] Reloj/Fecha.","Opción [1] Fecha: que digite MM/DD/AA.","Opción [2] Hora: que digite la hora actual en 24 hs.","Que salga con [#]."],src:src("alonso",17)},
 garnet:{steps:["Que presione [*] [8].","Que elija [2] Reloj/Fecha.","Opción [1] Fecha: que digite MM/DD/AA.","Opción [2] Hora: que digite la hora actual en 24 hs.","Que salga con [#]."],src:src("garnet",14)},
 dsc:{steps:["Con el sistema desarmado, que presione [*] [6] y su código maestro.","Que presione [1] (hora y fecha).","Que ingrese la hora en 4 dígitos HHMM (24 hs) y la fecha en 6 dígitos MMDDAA.","Que cierre con [#]."],src:src("dsc",4)},
 paradox:{steps:["Que presione la tecla de programación del teclado (la que muestra el manual) e ingrese el [CÓDIGO MAESTRO].","Que presione [FALLO] y luego [5].","Que ingrese la hora HH:MM en 24 hs (en SP4000 y SP65 se omite el formato de hora).","Que ingrese la fecha AAAA/MM/DD.","Que salga con [BORRAR]."],src:src("paradox",7,"p. 5 (PDF 7)")},
 networx:{steps:["Para la hora: que presione [*] [9] [7] e ingrese una clave maestra.","Que ingrese la hora en 2 cifras (24 hs) y los minutos en 2 cifras.","Para la fecha: que presione [*] [9] [6] e ingrese la clave maestra.","Que ingrese día de la semana (domingo=1), mes (2 cifras), día (2 cifras) y las dos últimas cifras del año."],src:src("networx",19)}
};
const EMERG={
 alonso:{t:"Que mantenga presionadas a la vez las dos teclas de Emergencia médica del teclado KPD-800 por más de 3 segundos (con KPD-860 es una sola tecla).",src:src("alonso",8)},
 garnet:{t:"Que mantenga presionada la tecla de Emergencia médica del teclado (con teclado LED, las dos teclas asociadas a la vez) por más de 3 segundos.",src:src("garnet",8)},
 dsc:{t:"Que mantenga presionada por 2 segundos la tecla de asistencia médica (la cruz o ambulancia, marcada [A] o con el símbolo “!”).",src:src("dsc",4)},
 paradox:{t:"Que mantenga presionadas a la vez [4] y [6] por 3 segundos (pánico tipo 2, médico). Depende de cómo esté programado el panel.",src:src("paradox",19,"p. 17 (PDF 19)")},
 networx:{t:"Que mantenga presionada por 2 segundos la tecla Médico. Puede no estar habilitada si el instalador no la programó.",src:src("networx",14)},
 matrix:{t:"Que presione el botón Médica del teclado.",src:src("matrix",3,"p. 1 (PDF 3)")}
};
const ANULAR={
 alonso:{steps:["Con el sistema desarmado, que presione [*] [1].","Que ingrese su clave de usuario.","Que ingrese el número de la zona en falla; si la zona queda iluminada, está anulada.","Que salga con [#]."],note:"Solo se anulan las zonas con la inhibición habilitada por el instalador. La anulación dura un solo armado.",src:src("alonso",16)},
 garnet:{steps:["Con el sistema desarmado, que presione [*] [1].","Que ingrese su clave de usuario.","Que ingrese el número de la zona en falla.","Que salga con [#]."],note:"Solo se anulan las zonas con la inhibición habilitada por el instalador. La anulación dura un solo armado.",src:src("garnet",13)},
 dsc:{steps:["Con el sistema desarmado y en estado Listo, que presione [*] [1].","Que ingrese el número de la zona en falla con 2 dígitos (por ejemplo 03).","Que cierre con [#].","El indicador de la zona se enciende: quedó excluida."],note:"Las exclusiones se borran al desarmar: hay que repetirlas antes de cada armado.",src:src("dsc",3)},
 paradox:{steps:["Que presione [EXC] e ingrese su [CÓDIGO DE USUARIO].","Que ingrese el número de la zona en falla (parpadea cuando queda anulada).","Que presione [ENTRAR] para guardar y salir."],note:"Al desarmar se borra la anulación.",src:src("paradox",17,"p. 15 (PDF 17)")},
 networx:{steps:["Con el sistema desconectado, que pulse la tecla Anulación (e ingrese su clave si la pide).","Que teclee el número de la zona en falla.","Que pulse Anulación otra vez: la zona queda anulada.","Que salga con Anulación o [#]. La zona anulada se ve con su número encendido fijo."],note:"Al desconectar el sistema se desanulan todas las zonas.",src:src("networx",13)}
};

/* qué tipo de solución corresponde a cada falla (por el texto de la falla) */
function tipo(label){
 const l=label.toLowerCase();
 if(/reloj|hora|fecha/.test(l)) return "hora";
 if(/gprs|ip\b|ip-|wifi|datos m|sms|m[oó]dulo|link|\(esc1\)/.test(l)) return null;
 if(/l[ií]nea telef|comunicaci[oó]n tel|^falla en la comunicaci|fallo de comunicaci|falla de comunicaci|fallo de l[ií]nea/.test(l)) return "linea";
 if(/bater|tamper|sabotaje|antiviol|teclado|expansor|sirena/.test(l)&&!/cableado/.test(l)) return null;
 if(/(falla|fallo|aver[ií]a|supervisi[oó]n).*(sensor|zona)|cableado/.test(l)) return "zona";
 return null;
}

const SERVICE={
 hora:"Si no se pudo cargar la hora o el cliente no tiene el código maestro: generar orden de service.",
 linea:"Si la señal de emergencia médica no ingresa en la central: generar orden de service por falla de línea o comunicación.",
 zona:"Generar orden de service indicando la zona en falla. Avisarle al cliente que esa zona queda sin protección hasta que vaya el técnico."
};

window.VIGILIA_SOL=function(system,label){
 const t=tipo(label), k=SIS[system]; if(!t) return null;
 if(t==="hora"){ const h=HORA[k]; return h&&{tipo:t,title:"Cómo reprogramar la hora y la fecha",steps:h.steps,srcs:[h.src],check:"Que vuelva a presionar [*] [2] y confirme que la falla ya no aparece y el teclado dejó de pitar.",service:SERVICE.hora}; }
 if(t==="linea"){ const e=EMERG[k]; return e&&{tipo:t,title:"Probar la línea con una emergencia médica",steps:["Pedile al cliente que envíe una emergencia médica desde el teclado. "+e.t,"Mirá en el monitor si ingresa la señal de emergencia médica de esa cuenta.","Si ingresa: la comunicación se restableció. Avisale al cliente que quedó funcionando y dejá la novedad asentada.","Si no ingresa: la línea sigue en falla."],srcs:[e.src],note:"La combinación cambia según el modelo. Si el cliente no encuentra la tecla, guialo con el manual.",service:SERVICE.linea,proc:"iso-linea-telefonica"}; }
 const a=ANULAR[k]; return a&&{tipo:t,title:"Anular la zona para que el cliente pueda activar la alarma",steps:["Preguntale al cliente qué zona está en falla (la ve en el teclado, como se indicó arriba)."].concat(a.steps,["Que active la alarma de forma normal y confirme que arma."]),srcs:[a.src],note:a.note,service:SERVICE.zona};
};
})();
