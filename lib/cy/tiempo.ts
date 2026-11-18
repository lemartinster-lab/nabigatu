/**
 * Horas y fechas para navegación astronómica.
 *
 *   HcL = HcG + λ (en tiempo; λ al E positiva)       15° = 1 h · 1° = 4 min · 1′ = 4 s
 *   HZ  = HcG + Z,   Z = huso horario = λ ÷ 15 redondeado
 *   Hora oficial = HcG (UT) + adelanto
 *
 * Los instantes se manejan como milisegundos UTC para que los cambios de fecha sean exactos.
 */
import { EntradaInvalida, formatoLongitud } from "../nucleo/angulos";
import type { Resultado } from "../per/correccion";

export type TipoHora = "HcG" | "HcL" | "HZ" | "HO";

export const NOMBRE_HORA: Record<TipoHora, string> = {
  HcG: "Hora civil de Greenwich (HcG = UT)",
  HcL: "Hora civil del lugar (HcL)",
  HZ: "Hora de zona (HZ)",
  HO: "Hora oficial (HO)",
};

const HORA = 3_600_000;

/** Lee fecha «2026-11-18» o «18/11/2026» y hora «14:30» o «14:30:15». Devuelve ms (como si fuera UTC). */
export function leerInstante(fecha: string, hora: string): number {
  let y: number, mo: number, d: number;
  let m = fecha.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
  else {
    m = fecha.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (!m) throw new EntradaInvalida("Fecha: usa el formato 18/11/2026");
    [d, mo, y] = [+m[1], +m[2], +m[3]];
  }
  const h = hora.trim().match(/^(\d{1,2})[:h ](\d{1,2})(?:[:m ](\d{1,2}(?:[.,]\d+)?))?s?$/);
  if (!h) throw new EntradaInvalida("Hora: usa el formato 14:30 o 14:30:15");
  const [hh, mm, ss] = [+h[1], +h[2], h[3] ? parseFloat(h[3].replace(",", ".")) : 0];
  if (hh > 23 || mm > 59 || ss >= 60) throw new EntradaInvalida("Hora fuera de rango");
  const ms = Date.UTC(y, mo - 1, d, hh, mm, 0) + ss * 1000;
  const comprobar = new Date(ms);
  if (comprobar.getUTCDate() !== d || comprobar.getUTCMonth() !== mo - 1) throw new EntradaInvalida("Esa fecha no existe");
  return ms;
}

export function formatoInstante(ms: number): string {
  const t = new Date(Math.round(ms / 1000) * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(t.getUTCDate())}/${p(t.getUTCMonth() + 1)}/${t.getUTCFullYear()} ${p(t.getUTCHours())}h ${p(t.getUTCMinutes())}m ${p(t.getUTCSeconds())}s`;
}

/** Arco a tiempo: 15° = 1 h. Devuelve «1h 05m 36s». */
export function arcoATiempo(grados: number): string {
  const totalS = Math.round((Math.abs(grados) / 15) * 3600);
  const h = Math.floor(totalS / 3600);
  const mi = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  return `${grados < 0 ? "−" : ""}${h}h ${String(mi).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function husoHorario(lon: number): number {
  const z = Math.round(lon / 15);
  return z === -12 && lon > 0 ? 12 : z; // ±180° pertenece al huso 12
}

export function convertirHora(
  instante: number,
  desde: TipoHora,
  lon: number,
  adelanto: number,
): Resultado & Record<TipoHora, number> & { huso: number } {
  const huso = husoHorario(lon);
  const offset: Record<TipoHora, number> = { HcG: 0, HcL: (lon / 15) * HORA, HZ: huso * HORA, HO: adelanto * HORA };
  const hcg = instante - offset[desde];
  const r = { HcG: hcg, HcL: hcg + offset.HcL, HZ: hcg + offset.HZ, HO: hcg + offset.HO };
  const lonTxt = formatoLongitud(lon);
  const pasos = [
    `Longitud ${lonTxt} en tiempo: ${arcoATiempo(lon)} (${lon >= 0 ? "al E se suma" : "al W se resta"} a la HcG)`,
    `Huso horario Z = λ ÷ 15 redondeado = ${huso >= 0 ? "+" : ""}${huso}`,
  ];
  if (desde !== "HcG") pasos.push(`HcG = ${desde} ${offset[desde] >= 0 ? "−" : "+"} ${arcoATiempo((Math.abs(offset[desde]) / HORA) * 15)} = ${formatoInstante(hcg)}`);
  pasos.push(
    `HcL = HcG + λ = ${formatoInstante(r.HcL)}`,
    `HZ = HcG + Z = ${formatoInstante(r.HZ)}`,
    `HO = HcG + adelanto (${adelanto >= 0 ? "+" : ""}${adelanto} h) = ${formatoInstante(r.HO)}`,
  );
  return { ...r, huso, pasos };
}
