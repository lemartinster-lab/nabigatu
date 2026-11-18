/**
 * Orto, ocaso y ventana legal de navegación de las motos náuticas.
 *
 * Orto y ocaso: el limbo superior del Sol en el horizonte con refracción normal
 * (centro del Sol a −0° 50′). Se calculan con las efemérides del Sol de la app.
 *
 * Motos náuticas: solo de día, «entre una hora posterior al orto y una hora anterior
 * al ocaso» (Real Decreto 259/2002, art. 10.7).
 */
import { EntradaInvalida } from "../nucleo/angulos";
import type { Posicion } from "../nucleo/coordenadas";
import { datosAstro } from "../cy/efemerides";
import { alturaYAzimut } from "../cy/astronomica";

const MIN = 60_000;
const HORA = 3_600_000;
export const ALTURA_ORTO = -50 / 60; // grados

function alturaSol(ms: number, p: Posicion): number {
  const d = datosAstro("sol", ms);
  const hL = (((d.hG + p.lon) % 360) + 360) % 360;
  return alturaYAzimut(p.lat, hL, d.dec).ae;
}

/** Busca el instante en que la altura cruza el umbral entre a y b (bisección, precisión ~1 s). */
function cruce(a: number, b: number, p: Posicion, umbral: number): number {
  let fa = alturaSol(a, p) - umbral;
  for (let i = 0; i < 40 && b - a > 1000; i++) {
    const m = (a + b) / 2;
    const fm = alturaSol(m, p) - umbral;
    if (Math.sign(fm) === Math.sign(fa)) {
      a = m;
      fa = fm;
    } else b = m;
  }
  return (a + b) / 2;
}

export interface Luz {
  /** Instantes en ms UTC; undefined si ese día no hay orto u ocaso (latitudes polares). */
  orto?: number;
  ocaso?: number;
  /** Ventana legal de las motos náuticas. */
  motoDesde?: number;
  motoHasta?: number;
  horasDeLuz: number;
}

/**
 * Orto y ocaso del día civil local (de 00:00 a 24:00 en hora oficial).
 * @param dia medianoche UTC del día (Date.UTC(año, mes, día))
 * @param adelanto horas que la hora oficial va por delante de UT
 */
export function ortoYOcaso(dia: number, p: Posicion, adelanto: number): Luz {
  if (Math.abs(p.lat) > 89) throw new EntradaInvalida("Demasiado cerca del polo para calcular el orto y el ocaso");
  const inicio = dia - adelanto * HORA;
  const fin = inicio + 24 * HORA;
  const paso = 10 * MIN;
  let orto: number | undefined;
  let ocaso: number | undefined;
  let tPrev = inicio;
  let hPrev = alturaSol(inicio, p) - ALTURA_ORTO;
  let minutosDeLuz = hPrev > 0 ? paso / MIN : 0;
  for (let t = inicio + paso; t <= fin; t += paso) {
    const h = alturaSol(t, p) - ALTURA_ORTO;
    if (h > 0) minutosDeLuz += paso / MIN;
    if (hPrev <= 0 && h > 0 && orto === undefined) orto = cruce(tPrev, t, p, ALTURA_ORTO);
    if (hPrev > 0 && h <= 0 && ocaso === undefined) ocaso = cruce(tPrev, t, p, ALTURA_ORTO);
    tPrev = t;
    hPrev = h;
  }
  const horasDeLuz = orto !== undefined && ocaso !== undefined && ocaso > orto ? (ocaso - orto) / HORA : minutosDeLuz / 60;
  const luz: Luz = { orto, ocaso, horasDeLuz };
  if (orto !== undefined && ocaso !== undefined && ocaso - orto > 2 * HORA) {
    luz.motoDesde = orto + HORA;
    luz.motoHasta = ocaso - HORA;
  }
  return luz;
}
