/**
 * Datos de las chuletas visuales: marcas del sistema de balizamiento IALA (región A, la de
 * España) y luces y marcas de día del RIPA. Los dibujos están en components/teoria/Chuletas.tsx.
 */

export type ColorBaliza = "rojo" | "verde" | "negro" | "amarillo" | "blanco" | "azul";

export type MarcaTope =
  | "cilindro-rojo"
  | "cono-verde"
  | "conos-arriba"
  | "conos-abajo"
  | "conos-base"
  | "conos-vertice"
  | "dos-esferas"
  | "esfera-roja"
  | "aspa"
  | "cruz-amarilla"
  | "ninguna";

export interface Marca {
  id: string;
  grupo: "lateral" | "cardinal" | "otras";
  nombre: string;
  /** Franjas de arriba abajo (horizontales) o de izquierda a derecha si `vertical`. */
  franjas: ColorBaliza[];
  vertical?: boolean;
  tope: MarcaTope;
  luz: string;
  /** Qué indica o por dónde se pasa. */
  significado: string;
}

export const MARCAS: Marca[] = [
  { id: "babor", grupo: "lateral", nombre: "Lateral de babor", franjas: ["rojo"], tope: "cilindro-rojo", luz: "Roja, cualquier ritmo", significado: "Entrando en puerto, se deja por babor." },
  { id: "estribor", grupo: "lateral", nombre: "Lateral de estribor", franjas: ["verde"], tope: "cono-verde", luz: "Verde, cualquier ritmo", significado: "Entrando en puerto, se deja por estribor." },
  { id: "canal-estribor", grupo: "lateral", nombre: "Canal principal a estribor", franjas: ["rojo", "verde", "rojo"], tope: "cilindro-rojo", luz: "Roja, grupo de destellos (2+1)", significado: "Bifurcación: el canal principal sigue por estribor; se deja por babor, como una roja." },
  { id: "canal-babor", grupo: "lateral", nombre: "Canal principal a babor", franjas: ["verde", "rojo", "verde"], tope: "cono-verde", luz: "Verde, grupo de destellos (2+1)", significado: "Bifurcación: el canal principal sigue por babor; se deja por estribor, como una verde." },
  { id: "norte", grupo: "cardinal", nombre: "Cardinal norte", franjas: ["negro", "amarillo"], tope: "conos-arriba", luz: "Blanca, centelleo continuo", significado: "Aguas navegables al norte: se pasa por el norte." },
  { id: "este", grupo: "cardinal", nombre: "Cardinal este", franjas: ["negro", "amarillo", "negro"], tope: "conos-base", luz: "Blanca, 3 centelleos", significado: "Aguas navegables al este: se pasa por el este." },
  { id: "sur", grupo: "cardinal", nombre: "Cardinal sur", franjas: ["amarillo", "negro"], tope: "conos-abajo", luz: "Blanca, 6 centelleos y un destello largo", significado: "Aguas navegables al sur: se pasa por el sur." },
  { id: "oeste", grupo: "cardinal", nombre: "Cardinal oeste", franjas: ["amarillo", "negro", "amarillo"], tope: "conos-vertice", luz: "Blanca, 9 centelleos", significado: "Aguas navegables al oeste: se pasa por el oeste." },
  { id: "peligro-aislado", grupo: "otras", nombre: "Peligro aislado", franjas: ["negro", "rojo", "negro"], tope: "dos-esferas", luz: "Blanca, grupo de 2 destellos", significado: "Peligro pequeño con aguas navegables alrededor." },
  { id: "aguas-seguras", grupo: "otras", nombre: "Aguas navegables", franjas: ["rojo", "blanco", "rojo", "blanco"], vertical: true, tope: "esfera-roja", luz: "Blanca: isofase, ocultaciones, destello largo o Morse «A»", significado: "Agua navegable alrededor: centro de canal o recalada." },
  { id: "especial", grupo: "otras", nombre: "Marca especial", franjas: ["amarillo"], tope: "aspa", luz: "Amarilla", significado: "Zonas especiales: fondeaderos, tuberías, zonas de recreo o militares." },
  { id: "nuevo-peligro", grupo: "otras", nombre: "Nuevo peligro", franjas: ["azul", "amarillo", "azul", "amarillo"], vertical: true, tope: "cruz-amarilla", luz: "Alternativa azul y amarilla", significado: "Peligro reciente aún sin cartografiar (por ejemplo, un naufragio)." },
];

/** Truco de las cardinales: el número de centelleos coincide con la hora del reloj. */
export const CENTELLEOS_CARDINAL: Record<"norte" | "este" | "sur" | "oeste", number | "continuo"> = {
  norte: "continuo",
  este: 3,
  sur: 6,
  oeste: 9,
};

export type ColorLuz = "blanca" | "roja" | "verde" | "amarilla";
export type MarcaDia = "bola" | "cono-abajo" | "conos-vertice" | "bicono" | "cilindro";

export interface LuzRipa {
  id: string;
  buque: string;
  /** Luces todo horizonte en línea vertical, de arriba abajo. */
  todoHorizonte: ColorLuz[];
  /** Otras luces (de tope, costado, alcance) en palabras. */
  ademas?: string;
  /** Marcas de día en vertical, de arriba abajo. */
  dia: MarcaDia[];
  regla: string;
  truco?: string;
}

export const LUCES_RIPA: LuzRipa[] = [
  { id: "motor", buque: "De propulsión mecánica (menos de 50 m), navegando", todoHorizonte: [], ademas: "Luz de tope blanca a proa, costados verde (estribor) y roja (babor) y alcance blanca", dia: [], regla: "Regla 23" },
  { id: "motor-pequeno", buque: "De motor de menos de 7 m y 7 nudos como máximo", todoHorizonte: ["blanca"], ademas: "Si puede, también las de costado", dia: [], regla: "Regla 23.d" },
  { id: "velero", buque: "Velero navegando (sin motor)", todoHorizonte: [], ademas: "Costados y alcance, sin luz de tope. Puede llevar roja sobre verde en el tope del palo", dia: [], regla: "Regla 25" },
  { id: "velero-motor", buque: "Velero navegando también a motor", todoHorizonte: [], ademas: "Luces de buque de motor", dia: ["cono-abajo"], regla: "Regla 25.e" },
  { id: "fondeado", buque: "Fondeado (menos de 50 m)", todoHorizonte: ["blanca"], dia: ["bola"], regla: "Regla 30" },
  { id: "sin-gobierno", buque: "Sin gobierno", todoHorizonte: ["roja", "roja"], ademas: "Con arrancada, además costados y alcance", dia: ["bola", "bola"], regla: "Regla 27.a", truco: "Rojo sobre rojo, sin gobierno estoy yo." },
  { id: "restringido", buque: "Capacidad de maniobra restringida", todoHorizonte: ["roja", "blanca", "roja"], dia: ["bola", "bicono", "bola"], regla: "Regla 27.b" },
  { id: "calado", buque: "Restringido por su calado", todoHorizonte: ["roja", "roja", "roja"], dia: ["cilindro"], regla: "Regla 28" },
  { id: "arrastre", buque: "Pescando al arrastre", todoHorizonte: ["verde", "blanca"], dia: ["conos-vertice"], regla: "Regla 26.b", truco: "Verde sobre blanco, arrastrando." },
  { id: "pesca", buque: "Pescando, pero no al arrastre", todoHorizonte: ["roja", "blanca"], dia: ["conos-vertice"], regla: "Regla 26.c", truco: "Rojo sobre blanco, pescando." },
  { id: "practico", buque: "De práctico en servicio", todoHorizonte: ["blanca", "roja"], dia: [], regla: "Regla 29", truco: "Blanco sobre rojo, práctico a bordo." },
  { id: "varado", buque: "Varado", todoHorizonte: ["roja", "roja"], ademas: "Además, las luces de fondeado", dia: ["bola", "bola", "bola"], regla: "Regla 30.d" },
];
