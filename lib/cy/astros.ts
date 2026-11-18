/**
 * Horario y declinación de un astro a partir de los datos del Almanaque Náutico.
 *
 * El usuario copia del Almanaque el valor tabulado antes y después del instante
 * (cada hora o cada día) y la app interpola. Para las estrellas:
 *   hG★ = hG♈ (punto Aries) + AS (ángulo sidéreo)
 *   hL  = hG + λ  (λ al E positiva)
 */
import { EntradaInvalida, normalizar360 } from "../nucleo/angulos";
import { formatoLongitud } from "../nucleo/angulos";
import { formatoNumero } from "../nucleo/unidades";
import type { Resultado } from "../per/correccion";

/** Formato de horario: 117° 33,0′ */
export function formatoHorario(g: number): string {
  const r = normalizar360(g);
  let gg = Math.floor(r);
  let m = Math.round((r - gg) * 600) / 10;
  if (m >= 60) {
    gg = (gg + 1) % 360;
    m = 0;
  }
  return `${String(gg).padStart(3, "0")}° ${m.toFixed(1).replace(".", ",").padStart(4, "0")}′`;
}

/** Formato de declinación: 6° 59,7′ S */
export function formatoDeclinacion(d: number): string {
  const a = Math.abs(d);
  let g = Math.floor(a);
  let m = Math.round((a - g) * 600) / 10;
  if (m >= 60) {
    g += 1;
    m = 0;
  }
  return `${g}° ${m.toFixed(1).replace(".", ",")}′ ${d >= 0 ? "N" : "S"}`;
}

export interface DatosHorario {
  /** hG tabulado al inicio del intervalo. */
  hG0: number;
  /** hG tabulado al final del intervalo (omitir si hG0 ya es el valor exacto). */
  hG1?: number;
  dec0: number;
  dec1?: number;
  /** Duración del intervalo tabulado, en horas (1 en tablas horarias, 24 en diarias). */
  intervaloHoras: number;
  /** Tiempo transcurrido desde el valor tabulado, en horas (p. ej. 22m 22s = 0,3728). */
  transcurrido: number;
  /** Ángulo sidéreo de la estrella (si los hG son del punto Aries). */
  anguloSidereo?: number;
  /** Declinación de la estrella (la del Almanaque, constante en el día). */
  decEstrella?: number;
  lon: number;
}

/** Incremento de horario entre dos valores tabulados, eligiendo las vueltas completas correctas (~15°/h). */
function incrementoHorario(h0: number, h1: number, horas: number): number {
  const esperado = 15.0 * horas;
  let d = h1 - h0;
  d += 360 * Math.round((esperado - d) / 360);
  return d;
}

export function horarioDelAstro(d: DatosHorario): Resultado & { hG: number; dec: number; hL: number; horarioAstronomico: string } {
  if (d.transcurrido < 0 || d.transcurrido > d.intervaloHoras + 1e-9) {
    throw new EntradaInvalida("El tiempo transcurrido debe estar dentro del intervalo tabulado");
  }
  const pasos: string[] = [];
  const f = d.transcurrido / d.intervaloHoras;
  let hG = d.hG0;

  if (d.hG1 !== undefined) {
    const inc = incrementoHorario(d.hG0, d.hG1, d.intervaloHoras);
    hG = d.hG0 + inc * f;
    pasos.push(
      `Incremento tabulado del horario = ${formatoNumero(inc, 4)}° en ${formatoNumero(d.intervaloHoras, 0)} h`,
      `hG = ${formatoHorario(d.hG0)} + ${formatoNumero(inc, 4)}° × ${formatoNumero(f, 5)} = ${formatoHorario(hG)}`,
    );
  } else {
    pasos.push(`hG = ${formatoHorario(hG)}`);
  }

  let dec = d.dec0;
  if (d.dec1 !== undefined) {
    dec = d.dec0 + (d.dec1 - d.dec0) * f;
    pasos.push(`Dec = ${formatoDeclinacion(d.dec0)} + (${formatoNumero((d.dec1 - d.dec0) * 60, 2)}′) × ${formatoNumero(f, 5)} = ${formatoDeclinacion(dec)}`);
  }

  if (d.anguloSidereo !== undefined) {
    const hAries = hG;
    hG = hAries + d.anguloSidereo;
    pasos.push(`hG★ = hG♈ + AS = ${formatoHorario(hAries)} + ${formatoHorario(d.anguloSidereo)} = ${formatoHorario(hG)}`);
    if (d.decEstrella !== undefined) {
      dec = d.decEstrella;
      pasos.push(`Dec★ = ${formatoDeclinacion(dec)}`);
    }
  }

  hG = normalizar360(hG);
  const hL = normalizar360(hG + d.lon);
  const horarioAstronomico = hL <= 180 ? `${formatoHorario(hL)} W` : `${formatoHorario(360 - hL)} E`;
  pasos.push(
    `hL = hG + λ = ${formatoHorario(hG)} ${d.lon >= 0 ? "+" : "−"} ${formatoLongitud(d.lon).replace(/ [EW]$/, "")} = ${formatoHorario(hL)}`,
    `Horario astronómico P = ${horarioAstronomico}`,
  );
  return { hG, dec, hL, horarioAstronomico, pasos };
}

