/** Todas las preguntas de teoría de Nabigatu, de todos los bancos. */
import { PREGUNTAS_PNB } from "../pnb/preguntas";
import { PREGUNTAS_METEO } from "./meteorologia";
import { PREGUNTAS_SEGURIDAD_PY } from "./seguridad-py";
import type { Pregunta, Tema } from "./tipos";

export const BANCO: Pregunta[] = [...PREGUNTAS_PNB, ...PREGUNTAS_METEO, ...PREGUNTAS_SEGURIDAD_PY];

export function preguntasDeTemas(temas: readonly Tema[]): Pregunta[] {
  return BANCO.filter((p) => temas.includes(p.tema));
}
