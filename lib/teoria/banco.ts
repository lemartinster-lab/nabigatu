/** Todas las preguntas de teoría de Nabigatu, de todos los bancos. */
import { PREGUNTAS_PNB } from "../pnb/preguntas";
import { PREGUNTAS_METEO } from "./meteorologia";
import { PREGUNTAS_SEGURIDAD_PY } from "./seguridad-py";
import { PREGUNTAS_NAVEGACION } from "./navegacion";
import { PREGUNTAS_MANIOBRA_EMERGENCIAS } from "./maniobra-emergencias";
import { PREGUNTAS_NAVEGACION_CY } from "./navegacion-cy";
import { PREGUNTAS_METEO_CY } from "./meteorologia-cy";
import { PREGUNTAS_INGLES } from "./ingles";
import type { Pregunta, Tema } from "./tipos";

export const BANCO: Pregunta[] = [
  ...PREGUNTAS_PNB,
  ...PREGUNTAS_METEO,
  ...PREGUNTAS_SEGURIDAD_PY,
  ...PREGUNTAS_NAVEGACION,
  ...PREGUNTAS_MANIOBRA_EMERGENCIAS,
  ...PREGUNTAS_NAVEGACION_CY,
  ...PREGUNTAS_METEO_CY,
  ...PREGUNTAS_INGLES,
];

export function preguntasDeTemas(temas: readonly Tema[]): Pregunta[] {
  return BANCO.filter((p) => temas.includes(p.tema));
}
