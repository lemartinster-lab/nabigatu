/**
 * Unidades náuticas y conversiones de tiempo.
 */
import { EntradaInvalida } from "./angulos";

export const METROS_POR_MILLA = 1852;
export const METROS_POR_CABLE = 185.2; // 1 cable = 0,1 millas
export const METROS_POR_PIE = 0.3048;
export const METROS_POR_BRAZA = 1.8288; // braza inglesa (6 pies)

export type UnidadDistancia = "mn" | "km" | "m" | "cable";
export type UnidadVelocidad = "nudos" | "kmh" | "ms";

const A_METROS: Record<UnidadDistancia, number> = {
  mn: METROS_POR_MILLA,
  km: 1000,
  m: 1,
  cable: METROS_POR_CABLE,
};

const A_MS: Record<UnidadVelocidad, number> = {
  nudos: METROS_POR_MILLA / 3600,
  kmh: 1000 / 3600,
  ms: 1,
};

export function convertirDistancia(valor: number, de: UnidadDistancia, a: UnidadDistancia): number {
  return (valor * A_METROS[de]) / A_METROS[a];
}

export function convertirVelocidad(valor: number, de: UnidadVelocidad, a: UnidadVelocidad): number {
  return (valor * A_MS[de]) / A_MS[a];
}

/** Lee un número con coma o punto decimal. */
export function leerNumero(texto: string, nombre = "El valor"): number {
  const t = texto.trim().replace(",", ".");
  if (t === "") throw new EntradaInvalida(`${nombre}: falta el valor`);
  if (!/^[+-]?\d+(\.\d+)?$/.test(t) && !/^[+-]?\.\d+$/.test(t)) {
    throw new EntradaInvalida(`${nombre}: «${texto}» no es un número`);
  }
  return parseFloat(t);
}

export function leerPositivo(texto: string, nombre: string): number {
  const v = leerNumero(texto, nombre);
  if (v <= 0) throw new EntradaInvalida(`${nombre} debe ser mayor que cero`);
  return v;
}

/** Formatea un número con coma decimal: 6.3246 → «6,32». */
export function formatoNumero(valor: number, decimales = 2): string {
  const r = Number(valor.toFixed(decimales));
  return (Object.is(r, -0) ? 0 : r).toString().replace(".", ",");
}

// ---------- Tiempo ----------

/**
 * Lee una duración: «2,5» (horas), «2:30», «2h 30m», «2h», «45m», «1:05:30».
 * Devuelve horas decimales.
 */
export function leerDuracion(texto: string): number {
  const t = texto.trim().toLowerCase().replace(",", ".");
  if (t === "") throw new EntradaInvalida("Tiempo: falta el valor");

  let m = t.match(/^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/);
  if (m) return +m[1] + +m[2] / 60 + (m[3] ? +m[3] / 3600 : 0);

  m = t.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in)?)?$/);
  if (m && (m[1] || m[2])) return (m[1] ? +m[1] : 0) + (m[2] ? +m[2] / 60 : 0);

  if (/^\d+(\.\d+)?$/.test(t)) return parseFloat(t);

  throw new EntradaInvalida(`Tiempo: no entiendo «${texto}». Usa 2:30, 2h 30m o 2,5`);
}

/** 2.5 → «2 h 30 min» · 0.75 → «45 min» */
export function formatoDuracion(horas: number): string {
  const totalMin = Math.round(horas * 60);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h === 0) return `${min} min`;
  if (min === 0) return `${h} h`;
  return `${h} h ${min} min`;
}

/** Lee una hora del día «14:30» → minutos desde medianoche. */
export function leerHora(texto: string): number {
  const m = texto.trim().match(/^([01]?\d|2[0-3])[:.h]([0-5]\d)$/);
  if (!m) throw new EntradaInvalida("Hora: usa el formato 14:30");
  return +m[1] * 60 + +m[2];
}

/** Suma horas a una hora del día y la formatea, indicando si pasa al día siguiente. */
export function sumarAHora(minutosDia: number, horas: number): string {
  const total = minutosDia + Math.round(horas * 60);
  const dias = Math.floor(total / 1440);
  const resto = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(resto / 60)).padStart(2, "0");
  const mm = String(resto % 60).padStart(2, "0");
  const sufijo = dias === 0 ? "" : dias === 1 ? " (día siguiente)" : ` (+${dias} días)`;
  return `${hh}:${mm}${sufijo}`;
}
