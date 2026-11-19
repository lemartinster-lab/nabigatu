/**
 * Motor de los tests de teoría: examen de prueba con la estructura oficial de cada
 * titulación, práctica por temas y repaso de fallos.
 *
 * Si Nabigatu aún no tiene preguntas de alguna unidad, el examen de prueba se hace con
 * las unidades disponibles y el máximo de errores general se reduce en proporción.
 */
import { BANCO, preguntasDeTemas } from "./banco";
import type { DefinicionExamen, UnidadOficial } from "./examenes";
import type { Pregunta, Tema } from "./tipos";

/** Pregunta lista para mostrar: opciones barajadas y la posición de la correcta. */
export interface PreguntaMostrada {
  id: string;
  tema: Tema;
  /** Unidad del examen (UT) en la que entra; 0 fuera de un examen. */
  ut: number;
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

function barajar<T>(lista: readonly T[], rnd: () => number): T[] {
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function mostrar(p: Pregunta, ut: number, rnd: () => number): PreguntaMostrada {
  const orden = barajar([0, 1, 2, 3], rnd);
  return {
    id: p.id,
    tema: p.tema,
    ut,
    enunciado: p.enunciado,
    opciones: orden.map((i) => p.opciones[i]),
    correcta: orden.indexOf(0),
    explicacion: p.explicacion,
  };
}

/** Unidades con preguntas suficientes en el banco para montar su parte del examen. */
export function unidadesDisponibles(def: DefinicionExamen): UnidadOficial[] {
  return def.unidades.filter((u) => u.temas.length > 0 && preguntasDeTemas(u.temas).length >= u.preguntas);
}

export function unidadesPendientes(def: DefinicionExamen): UnidadOficial[] {
  const disp = new Set(unidadesDisponibles(def).map((u) => u.ut));
  return def.unidades.filter((u) => !disp.has(u.ut));
}

export interface PlanExamen {
  preguntas: number;
  maxErrores: number;
  completo: boolean;
}

/** Número de preguntas y máximo de errores del examen de prueba con las unidades disponibles. */
export function planExamen(def: DefinicionExamen): PlanExamen {
  const n = unidadesDisponibles(def).reduce((s, u) => s + u.preguntas, 0);
  const completo = n === def.totalPreguntas;
  return { preguntas: n, maxErrores: completo ? def.maxErrores : Math.floor((def.maxErrores * n) / def.totalPreguntas), completo };
}

/** Examen de prueba: en cada unidad disponible, tantas preguntas como el oficial, sin repetir. */
export function generarExamen(def: DefinicionExamen, semilla: number): PreguntaMostrada[] {
  const rnd = aleatorio(semilla);
  return unidadesDisponibles(def).flatMap((u) =>
    barajar(preguntasDeTemas(u.temas), rnd)
      .slice(0, u.preguntas)
      .map((p) => mostrar(p, u.ut, rnd)),
  );
}

/** Práctica: todas las preguntas de los temas indicados, en orden aleatorio. */
export function generarPractica(temas: readonly Tema[], semilla: number): PreguntaMostrada[] {
  const rnd = aleatorio(semilla);
  return barajar(preguntasDeTemas(temas), rnd).map((p) => mostrar(p, 0, rnd));
}

/** Repaso: las preguntas indicadas, en orden aleatorio (los ids que no existan se ignoran). */
export function generarRepaso(ids: readonly string[], semilla: number): PreguntaMostrada[] {
  const rnd = aleatorio(semilla);
  const quiero = new Set(ids);
  return barajar(
    BANCO.filter((p) => quiero.has(p.id)),
    rnd,
  ).map((p) => mostrar(p, 0, rnd));
}

export interface Correccion {
  aciertos: number;
  errores: number;
  maxErrores: number;
  aprobado: boolean;
  porUnidad: { ut: number; nombre: string; preguntas: number; errores: number; maxErrores?: number; superada: boolean }[];
  /** Motivos del suspenso, en frases para el alumno. */
  motivos: string[];
}

/**
 * Corrige con los criterios oficiales. Una pregunta sin contestar cuenta como error.
 * `respuestas[i]` es el índice elegido en la pregunta i, o null.
 */
export function corregirExamen(def: DefinicionExamen, preguntas: PreguntaMostrada[], respuestas: (number | null)[]): Correccion {
  const fallo = (i: number) => respuestas[i] !== preguntas[i].correcta;
  const errores = preguntas.filter((_, i) => fallo(i)).length;
  const { maxErrores } = planExamen(def);
  const porUnidad = unidadesDisponibles(def).map((u) => {
    const idx = preguntas.map((p, i) => (p.ut === u.ut ? i : -1)).filter((i) => i >= 0);
    const e = idx.filter(fallo).length;
    return { ut: u.ut, nombre: u.nombre, preguntas: idx.length, errores: e, maxErrores: u.maxErrores, superada: u.maxErrores === undefined || e <= u.maxErrores };
  });
  const motivos: string[] = [];
  if (errores > maxErrores) motivos.push(`Tienes ${errores} errores y el máximo son ${maxErrores}.`);
  for (const u of porUnidad) {
    if (!u.superada) motivos.push(`${u.nombre}: ${u.errores} errores y el máximo son ${u.maxErrores}.`);
  }
  return { aciertos: preguntas.length - errores, errores, maxErrores, aprobado: motivos.length === 0, porUnidad, motivos };
}
