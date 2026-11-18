/**
 * Banco de preguntas de práctica para el examen del PNB.
 *
 * Redactadas para Nabigatu sobre el temario del anexo II del RD 875/2014 (no son
 * preguntas oficiales). La primera opción de cada pregunta es la correcta; el test
 * las baraja antes de mostrarlas.
 */

export type UnidadPnb = "nomenclatura" | "amarre" | "seguridad" | "legislacion" | "balizamiento" | "reglamento";

export interface PreguntaPnb {
  id: string;
  unidad: UnidadPnb;
  enunciado: string;
  /** Cuatro respuestas; la primera es la correcta. */
  opciones: [string, string, string, string];
  explicacion: string;
}

const p = (
  id: string,
  unidad: UnidadPnb,
  enunciado: string,
  opciones: [string, string, string, string],
  explicacion: string,
): PreguntaPnb => ({ id, unidad, enunciado, opciones, explicacion });

export const PREGUNTAS_PNB: PreguntaPnb[] = [
  // UT1 · Nomenclatura náutica
  p("nom-babor", "nomenclatura", "Mirando hacia proa, el costado izquierdo del barco se llama…", ["Babor", "Estribor", "Aleta", "Amura"], "Babor es el costado izquierdo mirando a proa; estribor, el derecho."),
  p("nom-eslora", "nomenclatura", "La eslora es…", ["La longitud del barco de proa a popa", "La anchura máxima del barco", "La parte sumergida del casco", "La altura del palo"], "Eslora es la longitud; manga, la anchura; calado, lo que se hunde el casco."),
  p("nom-manga", "nomenclatura", "La manga de una embarcación es…", ["Su anchura máxima", "Su longitud total", "La distancia de la flotación a la cubierta", "La profundidad que alcanza la quilla"], "La manga es la anchura máxima del casco."),
  p("nom-calado", "nomenclatura", "El calado es…", ["La distancia vertical de la flotación a la parte más baja del casco", "La anchura del casco en la flotación", "La altura de la borda sobre el agua", "La longitud de la quilla"], "El calado indica cuánta agua necesitas bajo el barco para no tocar fondo."),
  p("nom-obra-viva", "nomenclatura", "La obra viva es…", ["La parte del casco que va sumergida", "La parte del casco que queda fuera del agua", "La cubierta y la superestructura", "El conjunto de velas y jarcia"], "Obra viva es la parte sumergida; obra muerta, la que queda por encima de la flotación."),
  p("nom-francobordo", "nomenclatura", "El francobordo es…", ["La distancia vertical de la flotación a la cubierta", "La distancia de la quilla a la cubierta", "La anchura de la cubierta", "La parte del casco bajo el agua"], "El francobordo es la altura del costado que queda por encima del agua."),
  p("nom-aleta", "nomenclatura", "La aleta es…", ["La parte del costado próxima a la popa", "La parte del costado próxima a la proa", "El centro del costado", "La pieza que cierra la popa"], "Amura cerca de la proa, través en el centro y aleta cerca de la popa."),
  p("nom-amura", "nomenclatura", "La amura es…", ["La parte del costado próxima a la proa", "La parte del costado próxima a la popa", "La pieza central del fondo", "El borde superior del costado"], "Las amuras son los costados de proa, donde el casco se estrecha."),
  p("nom-traves", "nomenclatura", "Un objeto que está «por el través» se encuentra…", ["Perpendicular a la línea de crujía, a la altura del centro del barco", "Justo delante de la proa", "Justo detrás de la popa", "A 45° de la proa"], "El través es la dirección perpendicular al eje longitudinal del barco."),
  p("nom-escora", "nomenclatura", "La escora es…", ["La inclinación del barco hacia una banda", "La inclinación del barco hacia proa o popa", "El movimiento de avance", "El giro alrededor del eje vertical"], "Escora es la inclinación transversal; la longitudinal es el asiento."),
  p("nom-imbornales", "nomenclatura", "Los imbornales sirven para…", ["Desaguar el agua de la cubierta o la bañera", "Amarrar los cabos al muelle", "Ventilar el compartimento del motor", "Guardar el ancla"], "Son orificios por los que sale al mar el agua que embarca la cubierta."),

  // UT2 · Elementos de amarre y fondeo
  p("am-esprin", "amarre", "Los esprines (springs) sirven sobre todo para…", ["Impedir que el barco avance o retroceda a lo largo del muelle", "Separar el barco del muelle", "Unir el ancla a la cadena", "Proteger el casco de los golpes"], "Los esprines van en diagonal y frenan el movimiento longitudinal."),
  p("am-cadena", "amarre", "Como regla general, ¿cuánta cadena se fondea?", ["Unas 3 veces la profundidad", "La misma longitud que la profundidad", "La mitad de la profundidad", "Siempre 10 metros"], "La regla práctica es 3 veces la sonda con cadena y unas 5 si es cabo; con mal tiempo, más."),
  p("am-garrear", "amarre", "Se dice que el ancla garrea cuando…", ["Se arrastra por el fondo sin agarrar", "Queda enrocada y no se puede levantar", "Está a la pendura, sin tocar el fondo", "Se ha soltado la cadena"], "Si el ancla garrea, el barco deriva aunque esté fondeado."),
  p("am-maniobra", "amarre", "Para fondear, lo correcto es…", ["Aproar al viento o la corriente, parar y largar el ancla mientras se da atrás despacio", "Largar el ancla con el barco avante a toda máquina", "Fondear de costado al viento", "Largar toda la cadena de golpe y después parar"], "Así la cadena se tiende sobre el fondo y el ancla clava bien."),
  p("am-defensas", "amarre", "Las defensas se usan para…", ["Proteger el casco de los golpes contra el muelle u otros barcos", "Marcar la posición del ancla", "Señalar un hombre al agua", "Mantener el barco a flote si hay vía de agua"], "Se cuelgan por el costado a la altura del muelle o del barco vecino."),
  p("am-bichero", "amarre", "El bichero es…", ["Una vara con un gancho para coger cabos o boyas", "Un tipo de nudo para amarrar", "La pieza donde se afirma la cadena", "Una boya de fondeo"], "Facilita coger el cabo de una boya o del muelle sin asomarse por la borda."),
  p("am-as-de-guia", "amarre", "El as de guía es un nudo que…", ["Forma una gaza fija que no se corre", "Sirve para unir dos cabos de distinta mena", "Se usa para acortar un cabo", "Se deshace solo al tirar"], "Es el nudo clásico para hacer una gaza segura, por ejemplo para pasarla por un noray."),

  // UT3 · Seguridad
  p("seg-hombre-agua", "seguridad", "Si cae una persona al agua, lo primero es…", ["Dar la voz de «hombre al agua», lanzarle un aro salvavidas y no perderla de vista", "Saltar al agua a por ella", "Seguir el rumbo y avisar a puerto", "Parar el motor y esperar"], "Avisar, darle flotación y que alguien la señale sin quitarle la vista mientras se maniobra."),
  p("seg-extintor", "seguridad", "Al usar un extintor, el chorro se dirige…", ["A la base de las llamas", "A lo alto de las llamas", "Al humo", "A las paredes cercanas"], "El fuego se apaga atacando el combustible, que está en la base."),
  p("seg-bengala", "seguridad", "Una bengala de mano se enciende…", ["Por la banda de sotavento, con el brazo extendido", "Por la banda de barlovento", "Dentro de la cabina", "Apuntando hacia arriba, sobre la cabeza"], "Por sotavento el viento aleja el humo y las chispas del barco."),
  p("seg-mayday", "seguridad", "La palabra «MAYDAY» por radio indica…", ["Peligro grave e inminente que requiere ayuda inmediata (socorro)", "Un mensaje de urgencia sin peligro inminente", "Un aviso de seguridad a la navegación", "El final de una comunicación"], "MAYDAY es socorro; PAN PAN, urgencia; SECURITÉ, seguridad."),
  p("seg-panpan", "seguridad", "«PAN PAN» se usa para…", ["Un mensaje de urgencia", "Un mensaje de socorro", "Un aviso meteorológico rutinario", "Pedir permiso para entrar a puerto"], "Urgencia: hay un problema serio pero no un peligro grave e inminente."),
  p("seg-canal16", "seguridad", "En VHF, el canal 16 es el de…", ["Socorro, urgencia, seguridad y llamada", "Comunicaciones entre barcos de recreo", "Partes meteorológicos", "Comunicaciones con el puerto deportivo"], "Se escucha permanentemente y se usa para socorro y para establecer contacto."),
  p("seg-hipotermia", "seguridad", "En el agua fría, con chaleco y sin poder subir a bordo, conviene…", ["Encoger el cuerpo y moverse lo mínimo para conservar el calor", "Nadar sin parar para entrar en calor", "Quitarse la ropa para flotar mejor", "Quitarse el chaleco para nadar más rápido"], "Moverse enfría más deprisa: la postura encogida retrasa la hipotermia."),
  p("seg-ventilar", "seguridad", "Antes de arrancar un motor de gasolina intraborda hay que…", ["Ventilar el compartimento del motor", "Llenar el depósito hasta arriba", "Abrir los grifos de fondo de la cocina", "Encender las luces de navegación"], "Los vapores de gasolina se acumulan abajo y pueden explotar al arrancar."),
  p("seg-salvamento", "seguridad", "Para pedir ayuda por teléfono en la mar puedes llamar a…", ["Salvamento Marítimo (900 202 202) o al 112", "Solo a la Capitanía Marítima", "Solo al puerto deportivo", "Al teléfono de la escuela náutica"], "Salvamento Marítimo coordina la búsqueda y el rescate en el mar."),

  // UT4 · Legislación
  p("leg-eslora", "legislacion", "Con el PNB puedes gobernar embarcaciones a motor de hasta…", ["8 metros de eslora", "6 metros de eslora", "12 metros de eslora", "15 metros de eslora"], "RD 875/2014, art. 8.d: hasta 8 metros."),
  p("leg-millas", "legislacion", "Con el PNB no puedes alejarte de un puerto, marina o lugar de abrigo más de…", ["5 millas", "2 millas", "12 millas", "25 millas"], "RD 875/2014, art. 8.d: 5 millas en cualquier dirección."),
  p("leg-edad", "legislacion", "La edad mínima para obtener el PNB es…", ["18 años, o 16 con consentimiento de padres o tutores", "16 años sin más requisitos", "14 años con consentimiento", "21 años"], "RD 875/2014, art. 13."),
  p("leg-licencia", "legislacion", "La licencia de navegación («titulín») permite navegar…", ["De día, sin alejarse más de 2 millas de un puerto o abrigo", "De día y de noche hasta 5 millas", "Sin límite de distancia en embarcaciones de vela", "Hasta 12 millas de la costa"], "RD 875/2014, art. 11.1."),
  p("leg-vela", "legislacion", "Para gobernar con el PNB una embarcación de vela de hasta 8 metros…", ["Hay que hacer además las prácticas de vela", "No hace falta nada más", "Hace falta el PER", "No está permitido con el PNB"], "Son las atribuciones complementarias del art. 9.d del RD 875/2014."),

  // UT5 · Balizamiento (sistema IALA, región A)
  p("bal-babor", "balizamiento", "En la región A, una marca lateral de babor es…", ["Roja, cilíndrica, con luz roja", "Verde, cónica, con luz verde", "Roja, cónica, con luz verde", "Verde, cilíndrica, con luz roja"], "Región A (Europa): rojo a babor y verde a estribor, entrando en puerto."),
  p("bal-estribor", "balizamiento", "En la región A, una marca lateral de estribor es…", ["Verde, cónica, con luz verde", "Roja, cilíndrica, con luz roja", "Amarilla, con un aspa de tope", "Negra y amarilla, con dos conos"], "La de estribor es verde y su marca de tope es un cono con la punta hacia arriba."),
  p("bal-sentido", "balizamiento", "Las marcas laterales se interpretan según el sentido convencional, que es…", ["Viniendo de la mar hacia el puerto", "Saliendo del puerto hacia la mar", "De norte a sur", "Con la marea entrante"], "Entrando a puerto se dejan las rojas por babor y las verdes por estribor."),
  p("bal-norte", "balizamiento", "Una cardinal norte tiene como marca de tope…", ["Dos conos con las puntas hacia arriba", "Dos conos con las puntas hacia abajo", "Dos conos unidos por la base", "Dos conos unidos por el vértice"], "Norte: puntas arriba; sur: puntas abajo; este: unidos por la base; oeste: por el vértice."),
  p("bal-pasar-norte", "balizamiento", "Una cardinal norte indica que las aguas navegables están…", ["Al norte de la marca", "Al sur de la marca", "Al este de la marca", "A cualquier lado"], "Se pasa por el lado que indica su nombre: por el norte de la cardinal norte."),
  p("bal-sur", "balizamiento", "La luz de una cardinal sur es…", ["Blanca, 6 centelleos seguidos de un destello largo", "Blanca, centelleo continuo", "Blanca, 3 centelleos", "Blanca, 9 centelleos"], "Norte: continuo; este: 3; sur: 6 más un destello largo; oeste: 9. Como las horas del reloj."),
  p("bal-oeste", "balizamiento", "Una cardinal oeste es…", ["Amarilla con una franja negra horizontal ancha, conos unidos por el vértice", "Negra con una franja amarilla, conos unidos por la base", "Negra arriba y amarilla abajo, conos con la punta arriba", "Amarilla arriba y negra abajo, conos con la punta abajo"], "Los conos de tope señalan dónde va el negro: en la oeste, el negro queda en el centro."),
  p("bal-peligro", "balizamiento", "Una marca de peligro aislado es…", ["Negra con franjas rojas horizontales y dos esferas negras de tope", "Roja y blanca a franjas verticales con una esfera roja", "Amarilla con un aspa amarilla", "Azul y amarilla a franjas verticales"], "Señala un peligro pequeño con aguas navegables a su alrededor. Su luz es blanca, grupo de 2 destellos."),
  p("bal-aguas-seguras", "balizamiento", "Una marca de aguas navegables (aguas seguras) es…", ["Roja y blanca a franjas verticales, con una esfera roja de tope", "Negra con franjas rojas horizontales", "Verde con una franja roja", "Amarilla, con un aspa de tope"], "Indica que hay agua navegable a su alrededor; suele marcar el centro de un canal o una recalada."),
  p("bal-especial", "balizamiento", "Una marca especial es…", ["Amarilla, con un aspa amarilla de tope y luz amarilla", "Roja, con un cilindro de tope", "Negra y amarilla, con dos conos", "Blanca, con luz blanca fija"], "Señala zonas o elementos especiales: fondeaderos, tuberías, zonas militares o de recreo."),
  p("bal-nuevo-peligro", "balizamiento", "Una boya a franjas verticales azules y amarillas con luz alternativa azul y amarilla señala…", ["Un nuevo peligro aún sin cartografiar, como un naufragio reciente", "Una zona de baño", "Un canal preferido a estribor", "Un fondeadero autorizado"], "Es la marca de emergencia para peligros recientes que todavía no figuran en las cartas."),
  p("bal-bifurcacion", "balizamiento", "En la región A, entrando en puerto, una boya roja con una franja ancha verde indica…", ["Una bifurcación en la que el canal principal sigue por estribor", "Una bifurcación en la que el canal principal sigue por babor", "Un peligro aislado", "El final del canal"], "Es una marca de babor modificada: para seguir el canal principal se deja por babor, como cualquier roja."),

  // UT6 · Reglamento (RIPA)
  p("rip-vuelta-encontrada", "reglamento", "Dos buques de propulsión mecánica navegan de vuelta encontrada, proa con proa. Cada uno debe…", ["Caer a estribor", "Caer a babor", "Mantener rumbo y velocidad", "Parar las máquinas"], "RIPA, regla 14: los dos caen a estribor y se pasan por babor."),
  p("rip-cruce", "reglamento", "En un cruce entre dos buques de motor, se aparta…", ["El que ve al otro por su costado de estribor", "El que ve al otro por su costado de babor", "El más pequeño", "El más rápido"], "RIPA, regla 15: quien tiene al otro por estribor le cede el paso."),
  p("rip-alcance", "reglamento", "En una situación de alcance, ¿quién debe apartarse?", ["El buque que alcanza", "El buque alcanzado", "El de mayor eslora", "El que navega a vela"], "RIPA, regla 13: el que alcanza se mantiene apartado, aunque sea un velero."),
  p("rip-alcance-angulo", "reglamento", "Se considera que un buque alcanza a otro cuando se le aproxima desde una dirección de más de…", ["22,5° a popa del través", "45° a proa del través", "10° a cada lado de la proa", "90° de la proa"], "RIPA, regla 13: desde ahí, de noche, solo vería la luz de alcance del otro."),
  p("rip-vela-motor", "reglamento", "En general, un buque de propulsión mecánica que se cruza con un velero…", ["Debe apartarse del velero", "Tiene preferencia sobre el velero", "Debe mantener rumbo y velocidad", "Debe dar una pitada larga y seguir"], "RIPA, regla 18, salvo que el velero esté alcanzando o en un paso estrecho."),
  p("rip-velas-amuras", "reglamento", "Dos veleros reciben el viento por bandas distintas. Se aparta…", ["El que recibe el viento por babor", "El que recibe el viento por estribor", "El que está a barlovento", "El más pequeño"], "RIPA, regla 12: el de amuras a babor cede el paso al de amuras a estribor."),
  p("rip-velas-misma", "reglamento", "Dos veleros reciben el viento por la misma banda. Se aparta…", ["El que está a barlovento", "El que está a sotavento", "El que va más rápido", "El de mayor eslora"], "RIPA, regla 12: el de barlovento se aparta del de sotavento."),
  p("rip-una-corta", "reglamento", "Una pitada corta significa…", ["«Caigo a estribor»", "«Caigo a babor»", "«Estoy dando atrás»", "«No entiendo sus intenciones»"], "RIPA, regla 34: una corta, estribor; dos cortas, babor; tres cortas, atrás."),
  p("rip-tres-cortas", "reglamento", "Tres pitadas cortas significan…", ["«Estoy dando atrás»", "«Caigo a estribor»", "«Caigo a babor»", "«Peligro»"], "RIPA, regla 34."),
  p("rip-duda", "reglamento", "Cinco o más pitadas cortas y rápidas indican…", ["Duda sobre las intenciones del otro o sobre si maniobra lo suficiente", "Que el buque está fondeado", "Que se va a adelantar por estribor", "Que hay un hombre al agua"], "RIPA, regla 34.d."),
  p("rip-riesgo", "reglamento", "Hay riesgo de abordaje cuando la demora de un buque que se acerca…", ["No varía apreciablemente", "Aumenta rápidamente", "Disminuye rápidamente", "Cambia de babor a estribor"], "RIPA, regla 7: demora constante y distancia que disminuye es riesgo de abordaje."),
  p("rip-luces-motor", "reglamento", "Un buque de propulsión mecánica de menos de 50 m, en navegación, muestra…", ["Luz de tope blanca, luces de costado verde y roja y luz de alcance blanca", "Solo una luz blanca todo horizonte", "Luces de costado y una luz roja todo horizonte", "Dos luces de tope y ninguna de costado"], "RIPA, regla 23.a."),
  p("rip-costado-sector", "reglamento", "Cada luz de costado alumbra un sector de…", ["112,5°", "135°", "225°", "360°"], "RIPA, regla 21: tope 225°, costados 112,5° cada una y alcance 135°."),
  p("rip-pequeno", "reglamento", "Un buque de motor de menos de 7 m cuya velocidad máxima no supera los 7 nudos puede mostrar en lugar de las luces normales…", ["Una luz blanca todo horizonte", "Solo la luz de costado verde", "Una luz roja todo horizonte", "Ninguna luz"], "RIPA, regla 23.d; si puede, debe llevar también las de costado."),
  p("rip-vela-luces", "reglamento", "Un velero en navegación, sin usar el motor, muestra…", ["Luces de costado y luz de alcance, sin luz de tope", "Luz de tope, de costado y de alcance", "Una luz blanca todo horizonte", "Dos luces rojas en vertical"], "RIPA, regla 25. Si navega a motor, se le aplican las luces de buque de motor."),
  p("rip-fondeado", "reglamento", "De día, un buque fondeado muestra…", ["Una bola negra a proa", "Dos bolas negras en vertical", "Un cono con la punta hacia abajo", "Un cilindro negro"], "RIPA, regla 30. De noche, una luz blanca todo horizonte (dos si mide 50 m o más)."),
  p("rip-sin-gobierno", "reglamento", "Dos luces rojas todo horizonte en línea vertical indican un buque…", ["Sin gobierno", "Fondeado", "Pescando al arrastre", "Remolcando"], "RIPA, regla 27.a. De día, dos bolas negras en vertical."),
  p("rip-maniobra-restringida", "reglamento", "Roja, blanca y roja todo horizonte en vertical indican un buque…", ["Con capacidad de maniobra restringida", "Sin gobierno", "Varado", "De práctico"], "RIPA, regla 27.b. De día: bola, bicono y bola."),
  p("rip-arrastre", "reglamento", "Verde sobre blanca todo horizonte, en vertical, es un buque…", ["Pescando al arrastre", "Pescando, pero no al arrastre", "De práctico en servicio", "Varado"], "RIPA, regla 26: verde sobre blanca, arrastre; roja sobre blanca, otras pescas."),
  p("rip-velero-motor", "reglamento", "De día, un velero que navega también con el motor muestra…", ["Un cono con la punta hacia abajo", "Una bola negra", "Un cilindro", "Dos conos unidos por el vértice"], "RIPA, regla 25.e."),
  p("rip-paso-estrecho", "reglamento", "En un paso o canal estrecho, el buque debe navegar…", ["Lo más cerca posible del límite exterior de estribor", "Por el centro del canal", "Lo más cerca posible del límite de babor", "Por donde haya más fondo, sin más"], "RIPA, regla 9. Los de menos de 20 m y los veleros no deben estorbar a quien solo puede navegar dentro del canal."),
  p("rip-niebla", "reglamento", "Con visibilidad reducida, un buque de motor con arrancada emite…", ["Una pitada larga a intervalos de no más de 2 minutos", "Dos pitadas largas cada minuto", "Una pitada corta cada 30 segundos", "Repiques de campana"], "RIPA, regla 35.a. Sin arrancada, dos largas."),
  p("rip-velocidad", "reglamento", "La velocidad de seguridad es la que…", ["Permite maniobrar a tiempo para evitar un abordaje y parar en una distancia adecuada", "Marca el límite del puerto", "Es siempre inferior a 5 nudos", "Da el máximo rendimiento del motor"], "RIPA, regla 6: depende de la visibilidad, el tráfico, la maniobrabilidad, el viento, la mar y la corriente."),
  p("rip-varado", "reglamento", "De día, un buque varado muestra…", ["Tres bolas negras en vertical", "Dos bolas negras en vertical", "Una bola negra", "Un bicono"], "RIPA, regla 30.d. De noche, las luces de fondeo y dos rojas todo horizonte."),
];
