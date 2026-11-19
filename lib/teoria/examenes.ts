/**
 * Estructura oficial de los exámenes teóricos: Real Decreto 875/2014, anexo II
 * (texto consolidado del BOE, actualización del 30/12/2025).
 */
import type { Nivel } from "../modulos";
import type { Tema } from "./tipos";

export interface UnidadOficial {
  ut: number;
  nombre: string;
  preguntas: number;
  /** Errores máximos en la unidad; undefined si no tiene límite propio. */
  maxErrores?: number;
  /** Temas del banco con los que se practica; vacío si Nabigatu aún no tiene preguntas. */
  temas: Tema[];
  /** Dónde se practica en Nabigatu si no es con preguntas tipo test. */
  practicaEn?: string;
}

export interface DefinicionExamen {
  nivel: Exclude<Nivel, "LN">;
  nombre: string;
  totalPreguntas: number;
  maxErrores: number;
  duracion: string;
  unidades: UnidadOficial[];
  nota?: string;
}

const COMUNES: UnidadOficial[] = [
  { ut: 1, nombre: "Nomenclatura náutica", preguntas: 4, temas: ["nomenclatura"] },
  { ut: 2, nombre: "Amarre y fondeo", preguntas: 2, temas: ["amarre"] },
  { ut: 3, nombre: "Seguridad", preguntas: 4, temas: ["seguridad"] },
  { ut: 4, nombre: "Legislación", preguntas: 2, temas: ["legislacion"] },
  { ut: 5, nombre: "Balizamiento", preguntas: 5, maxErrores: 2, temas: ["balizamiento"] },
  { ut: 6, nombre: "Reglamento (RIPA)", preguntas: 10, maxErrores: 5, temas: ["reglamento"] },
];

export const EXAMENES: Record<"PNB" | "PER" | "PY", DefinicionExamen> = {
  PNB: {
    nivel: "PNB",
    nombre: "Patrón para Navegación Básica",
    totalPreguntas: 27,
    maxErrores: 10,
    duracion: "45 minutos",
    unidades: COMUNES,
  },
  PER: {
    nivel: "PER",
    nombre: "Patrón de Embarcaciones de Recreo",
    totalPreguntas: 45,
    maxErrores: 13,
    duracion: "1 h 30 min",
    unidades: [
      ...COMUNES,
      { ut: 7, nombre: "Maniobra", preguntas: 2, temas: [] },
      { ut: 8, nombre: "Emergencias en la mar", preguntas: 3, temas: [] },
      { ut: 9, nombre: "Meteorología", preguntas: 4, temas: ["meteo-basica"] },
      { ut: 10, nombre: "Teoría de navegación", preguntas: 5, temas: ["navegacion-basica"] },
      { ut: 11, nombre: "Carta de navegación", preguntas: 4, maxErrores: 2, temas: [], practicaEn: "Modo examen y las calculadoras del PER" },
    ],
  },
  PY: {
    nivel: "PY",
    nombre: "Patrón de Yate",
    totalPreguntas: 40,
    maxErrores: 12,
    duracion: "2 horas",
    unidades: [
      { ut: 1, nombre: "Seguridad en la mar", preguntas: 10, maxErrores: 5, temas: ["seguridad", "seguridad-py"] },
      { ut: 2, nombre: "Meteorología", preguntas: 10, maxErrores: 5, temas: ["meteo-basica", "meteo-py"] },
      { ut: 3, nombre: "Teoría de navegación", preguntas: 10, maxErrores: 5, temas: ["navegacion-basica", "navegacion-py"] },
      { ut: 4, nombre: "Navegación (carta)", preguntas: 10, maxErrores: 3, temas: [], practicaEn: "Modo examen y las calculadoras del Patrón de Yate" },
    ],
    nota: "Los límites de 5 errores en seguridad y en meteorología solo se aplican si el examen se corrige por módulos.",
  },
};
