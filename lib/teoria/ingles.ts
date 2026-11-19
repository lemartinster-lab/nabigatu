/**
 * Banco de preguntas de inglés del Capitán de Yate (UT4): frases normalizadas de la OMI para
 * las comunicaciones marítimas (SMCP) y vocabulario de las publicaciones náuticas.
 */
import { p, type Pregunta } from "./tipos";

export const PREGUNTAS_INGLES: Pregunta[] = [
  // Frases normalizadas (SMCP)
  p("ing-mayday-relay", "ingles", "«MAYDAY RELAY» significa…", ["Retransmisión de un mensaje de socorro de otro barco", "Fin del socorro", "Pido instrucciones médicas", "Repita el mensaje"], "Lo usa quien retransmite un socorro que no es suyo."),
  p("ing-seelonce-mayday", "ingles", "«SEELONCE MAYDAY» quiere decir…", ["Silencio: el canal está ocupado por un tráfico de socorro", "Fin del tráfico de socorro", "Alerta de seguridad", "Pido un remolque"], "Lo emite la estación que dirige el socorro para imponer silencio a los demás."),
  p("ing-seelonce-feenee", "ingles", "«SEELONCE FEENEE» indica…", ["Que el tráfico de socorro ha terminado y se puede reanudar el tráfico normal", "Que empieza un socorro", "Que hay que cambiar de canal", "Que el mensaje se ha perdido"], "Se pronuncia a la francesa: silence fini."),
  p("ing-on-fire", "ingles", "«I am on fire» se traduce por…", ["Tengo un incendio a bordo", "Estoy a la deriva", "Estoy varado", "Tengo una vía de agua"], "Suele seguir dónde está el fuego, por ejemplo «in engine room»."),
  p("ing-flooding", "ingles", "«I am flooding» se traduce por…", ["Tengo una vía de agua / me estoy inundando", "Navego con mal tiempo", "Estoy fondeado", "Tengo un hombre al agua"], "Otras frases de la misma familia: «I am sinking» (me hundo), «I am listing» (estoy escorado)."),
  p("ing-aground", "ingles", "«I am aground» significa…", ["Estoy varado", "Estoy fondeado", "Estoy a la deriva", "Estoy atracado"], "«Aground» es tocar fondo; «at anchor», fondeado."),
  p("ing-adrift", "ingles", "«I am not under command» significa…", ["Estoy sin gobierno", "No tengo patrón a bordo", "No obedezco las órdenes", "Estoy fondeado"], "Corresponde a las dos luces rojas del RIPA."),
  p("ing-mob", "ingles", "«Man overboard» se traduce por…", ["Hombre al agua", "Hombre a bordo", "Abandono del barco", "Tripulación completa"], "Para avisar de que se va a abandonar el barco: «I am abandoning vessel»."),
  p("ing-medical", "ingles", "«I require medical assistance» se traduce por…", ["Necesito asistencia médica", "Tengo un médico a bordo", "Necesito un remolque", "Pido un práctico"], "En las SMCP las peticiones empiezan con «I require…»."),
  p("ing-say-again", "ingles", "En las comunicaciones, «Say again» significa…", ["Repita", "Hable más despacio", "Cambio", "Recibido"], "Para pedir que hablen más despacio: «Speak slower»."),
  p("ing-over", "ingles", "Al final de una transmisión, «Over» significa…", ["Cambio: espero respuesta", "Fin de la comunicación", "Repita", "Silencio"], "«Out» cierra la comunicación y no espera respuesta."),
  p("ing-stand-by", "ingles", "«Stand by on channel 16» significa…", ["Permanezca a la escucha en el canal 16", "Cambie al canal 16 y hable", "Deje libre el canal 16", "Transmita en el canal 16 cada hora"], "«Stand by» es quedarse a la escucha."),
  p("ing-mistake", "ingles", "Si te equivocas al transmitir, las SMCP dicen que hay que decir…", ["«Mistake», y después la palabra correcta", "«Sorry», y repetir todo", "«Cancel», y callarse", "«Over», y empezar de nuevo"], "Por ejemplo: «My position 15 miles, mistake, correction 50 miles»."),
  p("ing-warning", "ingles", "En las SMCP, el marcador «WARNING» precede a…", ["Un aviso de un peligro para la navegación", "Una pregunta", "Una petición", "Una respuesta"], "Los marcadores son QUESTION, ANSWER, REQUEST, INFORMATION, INTENTION, WARNING, ADVICE e INSTRUCTION."),
  p("ing-niner", "ingles", "En las comunicaciones por radio, el número 9 se pronuncia…", ["«Niner»", "«Nine»", "«Nein»", "«Novem»"], "Para no confundirlo con «nein» (no, en alemán). Los números se dicen cifra a cifra: rumbo 090, «zero-niner-zero»."),

  // Vocabulario de las publicaciones náuticas
  p("ing-port-starboard", "ingles", "«Alter course to starboard» significa…", ["Caiga a estribor", "Caiga a babor", "Mantenga el rumbo", "Dé atrás"], "Port es babor; starboard, estribor."),
  p("ing-bearing", "ingles", "En inglés, «bearing» es…", ["Demora", "Rumbo", "Distancia", "Velocidad"], "Rumbo es «course» o «heading»; distancia, «distance» o «range»."),
  p("ing-gale", "ingles", "«Gale warning» se traduce por…", ["Aviso de temporal", "Aviso de niebla", "Aviso de marea", "Aviso de hielo"], "En los partes meteorológicos, «gale» es fuerza 8; «storm», fuerza 10."),
  p("ing-veering", "ingles", "En un parte meteorológico, «veering» indica que el viento…", ["Rola en el sentido de las agujas del reloj (a la derecha)", "Rola en sentido contrario (a la izquierda)", "Arrecia", "Amaina"], "«Backing» es rolar a la izquierda; «increasing», arreciar; «decreasing» o «moderating», amainar."),
  p("ing-swell", "ingles", "En inglés, «swell» es…", ["Mar de fondo", "Mar de viento", "Marea", "Corriente"], "«Sea state» es el estado de la mar, y «rough sea», mar gruesa."),
  p("ing-visibility", "ingles", "«Visibility poor» en un parte significa…", ["Visibilidad mala", "Visibilidad buena", "Niebla densa en tierra", "Lluvia débil"], "La escala habitual: good, moderate, poor, very poor."),
  p("ing-lighthouse", "ingles", "En una carta o en el libro de faros, «Fl(3) W 10s» describe una luz…", ["Blanca de grupo de 3 destellos cada 10 segundos", "Fija blanca de 10 millas de alcance", "Verde de 3 destellos", "De 3 colores que cambia cada 10 segundos"], "Fl es «flashing», destellos; W, blanca; R, roja; G, verde."),
  p("ing-draught", "ingles", "En inglés, «draught» (o «draft») es…", ["Calado", "Manga", "Eslora", "Francobordo"], "Eslora es «length overall» (LOA); manga, «beam» o «breadth»."),
  p("ing-leeward", "ingles", "«Leeward» significa…", ["Sotavento", "Barlovento", "Proa", "Popa"], "Barlovento es «windward»."),
];
