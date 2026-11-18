/**
 * Efemérides calculadas: Sol, punto Aries y estrellas (sustituto aproximado del Almanaque Náutico).
 *
 * - Sol: teoría planetaria VSOP87 recortada (195 términos), con FK5, nutación y aberración.
 * - Punto Aries: tiempo sidéreo aparente de Greenwich (IAU 1982 + ecuación de los equinoccios).
 * - Estrellas: posición J2000 de Hipparcos + movimiento propio, precesión, nutación y aberración.
 *
 * Contrastado con astropy y PyEphem (error inferior a 0,1′ en 2019-2032) y con ocho ejercicios
 * de estrellas de exámenes oficiales de Capitán de Yate, cuyas soluciones reproduce.
 * Aun así, en el examen hay que usar el Almanaque Náutico.
 */
import { EntradaInvalida, normalizar360 } from "../nucleo/angulos";
import { ESTRELLAS, type Estrella } from "./catalogo-estrellas";

const RAD = Math.PI / 180;
const sin = (g: number) => Math.sin(g * RAD);
const cos = (g: number) => Math.cos(g * RAD);

/** Día juliano (UT) a partir de milisegundos UTC. */
export function diaJuliano(ms: number): number {
  return ms / 86_400_000 + 2440587.5;
}

/** ΔT = TT − UT en segundos (aproximación válida para 2015-2035). */
function deltaT(jd: number): number {
  const anio = 2000 + (jd - 2451545.0) / 365.25;
  return 69.2 + 0.3 * (anio - 2020);
}

function nutacion(T: number) {
  const om = 125.04452 - 1934.136261 * T;
  const L = 280.4665 + 36000.7698 * T;
  const Lp = 218.3165 + 481267.8813 * T;
  const dpsi = (-17.2 * sin(om) - 1.32 * sin(2 * L) - 0.23 * sin(2 * Lp) + 0.21 * sin(2 * om)) / 3600;
  const deps = (9.2 * cos(om) + 0.57 * cos(2 * L) + 0.1 * cos(2 * Lp) - 0.09 * cos(2 * om)) / 3600;
  const eps0 = 23 + 26 / 60 + 21.448 / 3600 - (46.815 * T + 0.00059 * T * T - 0.001813 * T ** 3) / 3600;
  return { dpsi, deps, eps: eps0 + deps };
}

/** Horario en Greenwich del punto Aries (tiempo sidéreo aparente), en grados. */
export function horarioAries(jd: number): number {
  const d = jd - 2451545.0;
  const T = d / 36525;
  const medio = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - T ** 3 / 38710000;
  const { dpsi, eps } = nutacion(T);
  return normalizar360(medio + dpsi * cos(eps));
}

type T = [number, number, number][];
const L0: T = [[175347046, 0, 0], [3341656, 4.6692568, 6283.07585], [34894, 4.6261, 12566.1517], [3497, 2.7441, 5753.3849], [3418, 2.8289, 3.5231], [3136, 3.6277, 77713.7715], [2676, 4.4181, 7860.4194], [2343, 6.1352, 3930.2097], [1324, 0.7425, 11506.7698], [1273, 2.0371, 529.691], [1199, 1.1096, 1577.3435], [990, 5.233, 5884.927], [902, 2.045, 26.298], [857, 3.508, 398.149], [780, 1.179, 5223.694], [753, 2.533, 5507.553], [505, 4.583, 18849.228], [492, 4.205, 775.523], [357, 2.92, 0.067], [317, 5.849, 11790.629], [284, 1.899, 796.298], [271, 0.315, 10977.079], [243, 0.345, 5486.778], [206, 4.806, 2544.314], [205, 1.869, 5573.143], [202, 2.458, 6069.777], [156, 0.833, 213.299], [132, 3.411, 2942.463], [126, 1.083, 20.775], [115, 0.645, 0.98], [103, 0.636, 4694.003], [102, 0.976, 15720.839], [102, 4.267, 7.114], [99, 6.21, 2146.17], [98, 0.68, 155.42], [86, 5.98, 161000.69], [85, 1.3, 6275.96], [85, 3.67, 71430.7], [80, 1.81, 17260.15], [79, 3.04, 12036.46], [75, 1.76, 5088.63], [74, 3.5, 3154.69], [74, 4.68, 801.82], [70, 0.83, 9437.76], [62, 3.98, 8827.39], [61, 1.82, 7084.9], [57, 2.78, 6286.6], [56, 4.39, 14143.5], [56, 3.47, 6279.55], [52, 0.19, 12139.55], [52, 1.33, 1748.02], [51, 0.28, 5856.48], [49, 0.49, 1194.45], [41, 5.37, 8429.24], [41, 2.4, 19651.05], [39, 6.17, 10447.39], [37, 6.04, 10213.29], [37, 2.57, 1059.38], [36, 1.71, 2352.87], [36, 1.78, 6812.77], [33, 0.59, 17789.85], [30, 0.44, 83996.85], [30, 2.74, 1349.87], [25, 3.16, 4690.48]];
const L1: T = [[628331966747, 0, 0], [206059, 2.678235, 6283.07585], [4303, 2.6351, 12566.1517], [425, 1.59, 3.523], [119, 5.796, 26.298], [109, 2.966, 1577.344], [93, 2.59, 18849.23], [72, 1.14, 529.69], [68, 1.87, 398.15], [67, 4.41, 5507.55], [59, 2.89, 5223.69], [56, 2.17, 155.42], [45, 0.4, 796.3], [36, 0.47, 775.52], [29, 2.65, 7.11], [21, 5.34, 0.98], [19, 1.85, 5486.78], [19, 4.97, 213.3], [17, 2.99, 6275.96], [16, 0.03, 2544.31], [16, 1.43, 2146.17], [15, 1.21, 10977.08], [12, 2.83, 1748.02], [12, 3.26, 5088.63], [12, 5.27, 1194.45], [12, 2.08, 4694.0], [11, 0.77, 553.57], [10, 1.3, 6286.6], [10, 4.24, 1349.87], [9, 2.7, 242.73], [9, 5.64, 951.72], [8, 5.3, 2352.87], [6, 2.65, 9437.76], [6, 4.67, 4690.48]];
const L2: T = [[52919, 0, 0], [8720, 1.0721, 6283.0758], [309, 0.867, 12566.152], [27, 0.05, 3.52], [16, 5.19, 26.3], [16, 3.68, 155.42], [10, 0.76, 18849.23], [9, 2.06, 77713.77], [7, 0.83, 775.52], [5, 4.66, 1577.34], [4, 1.03, 7.11], [4, 3.44, 5573.14], [3, 5.14, 796.3], [3, 6.05, 5507.55], [3, 1.19, 242.73], [3, 6.12, 529.69], [3, 0.31, 398.15], [3, 2.28, 553.57], [2, 4.38, 5223.69], [2, 3.75, 0.98]];
const L3: T = [[289, 5.844, 6283.076], [35, 0, 0], [17, 5.49, 12566.15], [3, 5.2, 155.42], [1, 4.72, 3.52], [1, 5.3, 18849.23], [1, 5.97, 242.73]];
const L4: T = [[114, 3.142, 0], [8, 4.13, 6283.08], [1, 3.84, 12566.15]];
const L5: T = [[1, 3.14, 0]];
const B0: T = [[280, 3.199, 84334.662], [102, 5.422, 5507.553], [80, 3.88, 5223.69], [44, 3.7, 2352.87], [32, 4.0, 1577.34]];
const B1: T = [[9, 3.9, 5507.55], [6, 1.73, 5223.69]];
const R0: T = [[100013989, 0, 0], [1670700, 3.0984635, 6283.07585], [13956, 3.05525, 12566.1517], [3084, 5.1985, 77713.7715], [1628, 1.1739, 5753.3849], [1576, 2.8469, 7860.4194], [925, 5.453, 11506.77], [542, 4.564, 3930.21], [472, 3.661, 5884.927], [346, 0.964, 5507.553], [329, 5.9, 5223.694], [307, 0.299, 5573.143], [243, 4.273, 11790.629], [212, 5.847, 1577.344], [186, 5.022, 10977.079], [175, 3.012, 18849.228], [110, 5.055, 5486.778], [98, 0.89, 6069.78], [86, 5.69, 15720.84], [86, 1.27, 161000.69], [65, 0.27, 17260.15], [63, 0.92, 529.69], [57, 2.01, 83996.85], [56, 5.24, 71430.7], [49, 3.25, 2544.31], [47, 2.58, 775.52], [45, 5.54, 9437.76], [43, 6.01, 6275.96], [39, 5.36, 4694.0], [38, 2.39, 8827.39], [37, 0.83, 19651.05], [37, 4.9, 12139.55], [36, 1.67, 12036.46], [35, 1.84, 2942.46], [33, 0.24, 7084.9], [32, 0.18, 5088.63], [32, 1.78, 398.15], [28, 1.21, 6286.6], [28, 1.9, 6279.55], [26, 4.59, 10447.39]];
const R1: T = [[103019, 1.10749, 6283.07585], [1721, 1.0644, 12566.1517], [702, 3.142, 0], [32, 1.02, 18849.23], [31, 2.84, 5507.55], [25, 1.32, 5223.69], [18, 1.42, 1577.34], [10, 5.91, 10977.08], [9, 1.42, 6275.96], [9, 0.27, 5486.78]];
const R2: T = [[4359, 5.7846, 6283.0758], [124, 5.579, 12566.152], [12, 3.14, 0], [9, 3.63, 77713.77], [6, 1.87, 5573.14], [3, 5.47, 18849.23]];
const R3: T = [[145, 4.273, 6283.076], [7, 3.92, 12566.15]];
const R4: T = [[4, 2.56, 6283.08]];

const serie = (t: T, tau: number) => t.reduce((s, [a, b, c]) => s + a * Math.cos(b + c * tau), 0);

export interface PosicionAparente {
  ra: number; // grados
  dec: number; // grados
}

/** Posición aparente del Sol y su semidiámetro (minutos). */
export function sol(jd: number): PosicionAparente & { sd: number } {
  const jde = jd + deltaT(jd) / 86400;
  const T = (jde - 2451545.0) / 36525;
  const tau = T / 10;
  const L =
    (serie(L0, tau) + serie(L1, tau) * tau + serie(L2, tau) * tau ** 2 + serie(L3, tau) * tau ** 3 + serie(L4, tau) * tau ** 4 + serie(L5, tau) * tau ** 5) / 1e8;
  const B = (serie(B0, tau) + serie(B1, tau) * tau) / 1e8;
  const R = (serie(R0, tau) + serie(R1, tau) * tau + serie(R2, tau) * tau ** 2 + serie(R3, tau) * tau ** 3 + serie(R4, tau) * tau ** 4) / 1e8;

  let lon = normalizar360(L / RAD + 180);
  let lat = -B / RAD;
  const lp = lon - 1.397 * T - 0.00031 * T * T; // corrección al sistema FK5
  lon += -0.09033 / 3600;
  lat += (0.03916 / 3600) * (cos(lp) - sin(lp));
  const { dpsi, eps } = nutacion(T);
  const lam = lon + dpsi - 20.4898 / 3600 / R; // nutación y aberración

  const ra = normalizar360(Math.atan2(sin(lam) * cos(eps) - Math.tan(lat * RAD) * sin(eps), cos(lam)) / RAD);
  const dec = Math.asin(sin(lat) * cos(eps) + cos(lat) * sin(eps) * sin(lam)) / RAD;
  return { ra, dec, sd: 15.99 / R };
}

function longitudSolarAproximada(T: number): number {
  const L0 = 280.46646 + 36000.76983 * T;
  const M = 357.52911 + 35999.05029 * T;
  const C = (1.914602 - 0.004817 * T) * sin(M) + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
  return normalizar360(L0 + C);
}

/** Posición aparente de una estrella del catálogo. */
export function estrellaAparente(e: Estrella, jd: number): PosicionAparente {
  const jde = jd + deltaT(jd) / 86400;
  const T = (jde - 2451545.0) / 36525;
  const anios = T * 100;

  // Movimiento propio
  let a = e.ra + ((e.pmRa / 3_600_000) * anios) / cos(e.dec);
  let d = e.dec + (e.pmDec / 3_600_000) * anios;

  // Precesión J2000 → fecha
  const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T ** 3) / 3600;
  const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T ** 3) / 3600;
  const th = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T ** 3) / 3600;
  const A = cos(d) * sin(a + zeta);
  const Bp = cos(th) * cos(d) * cos(a + zeta) - sin(th) * sin(d);
  const C = sin(th) * cos(d) * cos(a + zeta) + cos(th) * sin(d);
  a = normalizar360(Math.atan2(A, Bp) / RAD + z);
  d = Math.asin(C) / RAD;

  // Nutación
  const { dpsi, deps, eps } = nutacion(T);
  const tanD = Math.tan(d * RAD);
  const da1 = (cos(eps) + sin(eps) * sin(a) * tanD) * dpsi - cos(a) * tanD * deps;
  const dd1 = sin(eps) * cos(a) * dpsi + sin(a) * deps;

  // Aberración anual
  const k = 20.49552 / 3600;
  const ecc = 0.016708634 - 0.000042037 * T;
  const pi = 102.93735 + 1.71946 * T;
  const so = longitudSolarAproximada(T);
  const da2 =
    (-k * (cos(a) * cos(so) * cos(eps) + sin(a) * sin(so)) + ecc * k * (cos(a) * cos(pi) * cos(eps) + sin(a) * sin(pi))) / cos(d);
  const f = Math.tan(eps * RAD) * cos(d) - sin(a) * sin(d);
  const dd2 = -k * (cos(so) * cos(eps) * f + cos(a) * sin(d) * sin(so)) + ecc * k * (cos(pi) * cos(eps) * f + cos(a) * sin(d) * sin(pi));

  return { ra: normalizar360(a + da1 + da2), dec: d + dd1 + dd2 };
}

/** Nombres en castellano de las estrellas más usadas. */
export const NOMBRE_ES: Record<string, string> = {
  Polaris: "Polar",
  Sirius: "Sirio",
  Arcturus: "Arturo",
  Procyon: "Proción",
  Spica: "Espiga",
  Pollux: "Pólux",
  Regulus: "Régulo",
  Betelgeuse: "Betelgeuse",
  Aldebaran: "Aldebarán",
};

export function nombreEstrella(e: Estrella): string {
  const es = NOMBRE_ES[e.nombre];
  return es && es !== e.nombre ? `${es} (${e.nombre})` : e.nombre;
}

export function buscarEstrella(nombre: string): Estrella {
  const n = nombre.trim().toLowerCase();
  const e = ESTRELLAS.find(
    (s) =>
      s.nombre.toLowerCase() === n ||
      (s.alias ?? []).some((a) => a.toLowerCase() === n) ||
      (NOMBRE_ES[s.nombre] ?? "").toLowerCase() === n,
  );
  if (!e) throw new EntradaInvalida(`No encuentro la estrella «${nombre}» en el catálogo`);
  return e;
}

export interface DatosAstro {
  hG: number;
  dec: number;
  /** Ángulo sidéreo (estrellas). */
  as?: number;
  /** Semidiámetro en minutos (Sol). */
  sd?: number;
  hGAries: number;
}

/** Datos «de Almanaque» de un astro para un instante UT. */
export function datosAstro(astro: "sol" | "aries" | Estrella, ms: number): DatosAstro {
  const jd = diaJuliano(ms);
  const hGAries = horarioAries(jd);
  if (astro === "aries") return { hG: hGAries, dec: 0, hGAries };
  if (astro === "sol") {
    const s = sol(jd);
    return { hG: normalizar360(hGAries - s.ra), dec: s.dec, sd: s.sd, hGAries };
  }
  const p = estrellaAparente(astro, jd);
  const as = normalizar360(360 - p.ra);
  return { hG: normalizar360(hGAries + as), dec: p.dec, as, hGAries };
}

export { ESTRELLAS };
