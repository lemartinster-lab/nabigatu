/**
 * Tipos comunes de los bancos de preguntas de teoría.
 *
 * Las preguntas están redactadas para Nabigatu sobre el temario del anexo II del
 * RD 875/2014: no son preguntas oficiales ni de academias.
 */

/** Tema de un banco de preguntas. Una unidad del examen puede tirar de varios temas. */
export type Tema =
  | "nomenclatura"
  | "amarre"
  | "seguridad"
  | "legislacion"
  | "balizamiento"
  | "reglamento"
  | "meteo-basica"
  | "meteo-py"
  | "seguridad-py"
  | "navegacion-basica"
  | "navegacion-py";

export interface Pregunta {
  id: string;
  tema: Tema;
  enunciado: string;
  /** Cuatro respuestas; la primera es la correcta. El test las baraja antes de mostrarlas. */
  opciones: [string, string, string, string];
  explicacion: string;
}

export const p = (
  id: string,
  tema: Tema,
  enunciado: string,
  opciones: [string, string, string, string],
  explicacion: string,
): Pregunta => ({ id, tema, enunciado, opciones, explicacion });
