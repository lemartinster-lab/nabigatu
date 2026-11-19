/**
 * «Mis fallos» de los tests de teoría (todas las titulaciones): las preguntas falladas se guardan en el navegador y salen
 * de la lista cuando se aciertan ACIERTOS_PARA_QUITAR veces seguidas.
 */
import { BANCO } from "./banco";

/** Id de pregunta → aciertos seguidos desde el último fallo. */
export type Fallos = Record<string, number>;

export const ACIERTOS_PARA_QUITAR = 2;

/** Se mantiene el nombre de la primera versión (solo PNB) para no perder las listas ya guardadas. */
const CLAVE = "nabigatu:pnb-fallos:v1";
const EVENTO = "nabigatu-pnb-fallos";

/**
 * Anota una respuesta. Un fallo mete la pregunta en la lista (o la devuelve a cero).
 * Un acierto solo cuenta si la pregunta ya estaba en la lista.
 */
export function anotarRespuesta(fallos: Fallos, id: string, acierto: boolean): Fallos {
  const r = { ...fallos };
  if (!acierto) {
    r[id] = 0;
  } else if (id in r) {
    const racha = r[id] + 1;
    if (racha >= ACIERTOS_PARA_QUITAR) delete r[id];
    else r[id] = racha;
  }
  return r;
}

/** Limpia lo leído del navegador: solo ids que existen en el banco y rachas válidas. */
export function filtrarFallos(datos: unknown): Fallos {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return {};
  const ids = new Set(BANCO.map((p) => p.id));
  const r: Fallos = {};
  for (const [id, n] of Object.entries(datos as Record<string, unknown>)) {
    if (ids.has(id) && typeof n === "number" && n >= 0 && n < ACIERTOS_PARA_QUITAR) r[id] = Math.floor(n);
  }
  return r;
}

export function leerFallos(): Fallos {
  try {
    return filtrarFallos(JSON.parse(localStorage.getItem(CLAVE) ?? "{}"));
  } catch {
    return {};
  }
}

export function guardarFallos(fallos: Fallos): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(fallos));
    window.dispatchEvent(new Event(EVENTO));
    return true;
  } catch {
    return false;
  }
}

/** Anota varias respuestas de una vez (por ejemplo, al corregir un examen). */
export function registrarRespuestas(respuestas: { id: string; acierto: boolean }[]): void {
  let f = leerFallos();
  for (const r of respuestas) f = anotarRespuesta(f, r.id, r.acierto);
  guardarFallos(f);
}

export function suscribirFallos(cb: () => void): () => void {
  const h = () => cb();
  window.addEventListener(EVENTO, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVENTO, h);
    window.removeEventListener("storage", h);
  };
}
