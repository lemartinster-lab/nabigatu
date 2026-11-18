/**
 * Test del PNB: examen de prueba con la estructura oficial y corrección con sus reglas.
 *
 * Estructura y criterios: Real Decreto 875/2014, anexo II, 2.B — 27 preguntas tipo test,
 * 45 minutos, aprobado con 17 aciertos (10 errores como máximo), con un máximo de 2 errores
 * en Balizamiento y 5 en Reglamento.
 */
import { PREGUNTAS_PNB, type PreguntaPnb, type UnidadPnb } from "./preguntas";

export interface UnidadExamen {
  id: UnidadPnb;
  nombre: string;
  preguntas: number;
  /** Errores máximos en esta unidad; undefined si no tiene límite propio. */
  maxErrores?: number;
}

export const UNIDADES_PNB: UnidadExamen[] = [
  { id: "nomenclatura", nombre: "Nomenclatura náutica", preguntas: 4 },
  { id: "amarre", nombre: "Amarre y fondeo", preguntas: 2 },
  { id: "seguridad", nombre: "Seguridad", preguntas: 4 },
  { id: "legislacion", nombre: "Legislación", preguntas: 2 },
  { id: "balizamiento", nombre: "Balizamiento", preguntas: 5, maxErrores: 2 },
  { id: "reglamento", nombre: "Reglamento (RIPA)", preguntas: 10, maxErrores: 5 },
];

export const TOTAL_PREGUNTAS = 27;
export const MAX_ERRORES = 10;
export const DURACION_MINUTOS = 45;

/** Pregunta lista para mostrar: opciones barajadas y la posición de la correcta. */
export interface PreguntaMostrada {
  id: string;
  unidad: UnidadPnb;
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

/** Generador pseudoaleatorio con semilla (mulberry32), para poder repetir un examen en los tests. */
function aleatorio(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajar<T>(lista: T[], rnd: () => number): T[] {
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function mostrar(p: PreguntaPnb, rnd: () => number): PreguntaMostrada {
  const orden = barajar([0, 1, 2, 3], rnd);
  return {
    id: p.id,
    unidad: p.unidad,
    enunciado: p.enunciado,
    opciones: orden.map((i) => p.opciones[i]),
    correcta: orden.indexOf(0),
    explicacion: p.explicacion,
  };
}

export function preguntasDeUnidad(unidad: UnidadPnb): PreguntaPnb[] {
  return PREGUNTAS_PNB.filter((p) => p.unidad === unidad);
}

/** Examen de prueba: en cada unidad, tantas preguntas como el oficial, sin repetir y en el orden del temario. */
export function generarExamenPnb(semilla: number): PreguntaMostrada[] {
  const rnd = aleatorio(semilla);
  return UNIDADES_PNB.flatMap((u) => barajar(preguntasDeUnidad(u.id), rnd).slice(0, u.preguntas).map((p) => mostrar(p, rnd)));
}

/** Práctica de una unidad: todas sus preguntas en orden aleatorio. */
export function generarPracticaPnb(unidad: UnidadPnb, semilla: number): PreguntaMostrada[] {
  const rnd = aleatorio(semilla);
  return barajar(preguntasDeUnidad(unidad), rnd).map((p) => mostrar(p, rnd));
}

export interface CorreccionPnb {
  aciertos: number;
  errores: number;
  aprobado: boolean;
  porUnidad: { id: UnidadPnb; nombre: string; preguntas: number; errores: number; maxErrores?: number; superada: boolean }[];
  /** Motivos del suspenso, en frases para el alumno. */
  motivos: string[];
}

/**
 * Corrige con los criterios oficiales. Una pregunta sin contestar cuenta como error.
 * `respuestas[i]` es el índice elegido en la pregunta i, o null.
 */
export function corregirExamenPnb(preguntas: PreguntaMostrada[], respuestas: (number | null)[]): CorreccionPnb {
  const fallo = (i: number) => respuestas[i] !== preguntas[i].correcta;
  const errores = preguntas.filter((_, i) => fallo(i)).length;
  const porUnidad = UNIDADES_PNB.map((u) => {
    const idx = preguntas.map((p, i) => (p.unidad === u.id ? i : -1)).filter((i) => i >= 0);
    const e = idx.filter(fallo).length;
    return { id: u.id, nombre: u.nombre, preguntas: idx.length, errores: e, maxErrores: u.maxErrores, superada: u.maxErrores === undefined || e <= u.maxErrores };
  });
  const motivos: string[] = [];
  if (errores > MAX_ERRORES) motivos.push(`Tienes ${errores} errores y el máximo son ${MAX_ERRORES}.`);
  for (const u of porUnidad) {
    if (!u.superada) motivos.push(`${u.nombre}: ${u.errores} errores y el máximo son ${u.maxErrores}.`);
  }
  return { aciertos: preguntas.length - errores, errores, aprobado: motivos.length === 0, porUnidad, motivos };
}
