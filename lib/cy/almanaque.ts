/**
 * Página del Almanaque Náutico calculada: lo que trae cada día el Almanaque impreso,
 * obtenido con las efemérides de `efemerides.ts`.
 *
 * - Tabla horaria del Sol (hG y declinación) y del punto Aries (hG), de 0 h a 24 h UT.
 * - Paso del Sol por el meridiano de Greenwich (PMG) o por el de cualquier longitud.
 * - Salida, puesta y crepúsculos civil y náutico para una latitud (y longitud).
 * - Tabla de incrementos (minutos y segundos → arco) para interpolar como en el examen.
 *
 * Contrastado con el Almanaque Náutico 2026 y la hoja de cálculo 2027 de nauticalalmanac.it
 * (ver almanaque.test.ts). No sustituye al Almanaque oficial en el examen.
 */
import { EntradaInvalida, normalizar180, normalizar360 } from "../nucleo/angulos";
import { datosAstro, ESTRELLAS } from "./efemerides";
import type { Estrella } from "./catalogo-estrellas";

const HORA = 3_600_000;
const DIA = 24 * HORA;
const RAD = Math.PI / 180;

/** Velocidad del horario: el Sol medio recorre 15°/h y el punto Aries 15° 02,46′/h. */
export const VELOCIDAD_HORARIO = { sol: 15, aries: 360.98564736629 / 24 } as const;

/** Alturas del centro del Sol que definen cada fenómeno (grados). */
export const ALTURA_FENOMENO = {
  /** Limbo superior en el horizonte: refracción 34′ + semidiámetro 16′. */
  salidaPuesta: -50 / 60,
  crepusculoCivil: -6,
  crepusculoNautico: -12,
} as const;

/** Medianoche UT del día que contiene el instante. */
export function inicioDia(ms: number): number {
  return Math.floor(ms / DIA) * DIA;
}

/**
 * Instante (ms UT) del paso del Sol por el meridiano de longitud `lon` (E positiva)
 * en el día que empieza en `dia0`. Con lon = 0 es el PMG del Almanaque.
 */
export function pasoMeridiano(dia0: number, lon = 0): number {
  let t = dia0 + 12 * HORA - (lon / 15) * HORA;
  for (let i = 0; i < 5; i++) {
    const hL = normalizar180(datosAstro("sol", t).hG + lon);
    t -= (hL / 15) * HORA;
  }
  return t;
}

/** Resultado de un fenómeno: el instante, o por qué no ocurre ese día. */
export type Fenomeno = { ms: number } | { no: "siempre-encima" | "siempre-debajo" };

/**
 * Instante en que el centro del Sol pasa por la altura `h0`, por la mañana (antes del
 * paso por el meridiano) o por la tarde. Se itera con la declinación de ese instante.
 */
function instanteAltura(dia0: number, lat: number, lon: number, h0: number, manana: boolean): Fenomeno {
  let t = pasoMeridiano(dia0, lon);
  for (let i = 0; i < 8; i++) {
    const d = datosAstro("sol", t);
    const c = (Math.sin(h0 * RAD) - Math.sin(lat * RAD) * Math.sin(d.dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(d.dec * RAD));
    if (c > 1) return { no: "siempre-debajo" };
    if (c < -1) return { no: "siempre-encima" };
    const H = Math.acos(c) / RAD;
    const objetivo = manana ? -H : H;
    const hL = normalizar180(d.hG + lon);
    const paso = normalizar180(objetivo - hL) / 15;
    t += paso * HORA;
    if (Math.abs(paso) < 1 / 36000) break; // 0,1 s
  }
  return { ms: t };
}

export interface FenomenosSol {
  /** Paso por el meridiano del lugar (con lon = 0, el PMG). */
  paso: number;
  inicioCrepusculoNautico: Fenomeno;
  inicioCrepusculoCivil: Fenomeno;
  salida: Fenomeno;
  puesta: Fenomeno;
  finCrepusculoCivil: Fenomeno;
  finCrepusculoNautico: Fenomeno;
}

/**
 * Salida, puesta, crepúsculos y paso por el meridiano del Sol, en UT.
 * Con lon = 0 (como el Almanaque) las horas son también horas civiles del lugar.
 */
export function fenomenosSol(dia0: number, lat: number, lon = 0): FenomenosSol {
  if (Math.abs(lat) > 90) throw new EntradaInvalida("La latitud no puede pasar de 90°");
  const a = ALTURA_FENOMENO;
  return {
    paso: pasoMeridiano(dia0, lon),
    inicioCrepusculoNautico: instanteAltura(dia0, lat, lon, a.crepusculoNautico, true),
    inicioCrepusculoCivil: instanteAltura(dia0, lat, lon, a.crepusculoCivil, true),
    salida: instanteAltura(dia0, lat, lon, a.salidaPuesta, true),
    puesta: instanteAltura(dia0, lat, lon, a.salidaPuesta, false),
    finCrepusculoCivil: instanteAltura(dia0, lat, lon, a.crepusculoCivil, false),
    finCrepusculoNautico: instanteAltura(dia0, lat, lon, a.crepusculoNautico, false),
  };
}

export interface FilaHoraria {
  /** Hora UT (0 a 24). */
  h: number;
  hGSol: number;
  decSol: number;
  hGAries: number;
}

export interface EstrellaDelDia {
  estrella: Estrella;
  /** Ángulo sidéreo (360° − AR), en grados. */
  as: number;
  dec: number;
}

export interface PaginaAlmanaque {
  dia0: number;
  filas: FilaHoraria[];
  /** PMG en ms UT. */
  pmg: number;
  /** Semidiámetro del Sol a las 12 h, en minutos. */
  sd: number;
  /** Diferencia media del hG del Sol respecto a 15°/h, en minutos por hora. */
  v: number;
  /** Variación media de la declinación del Sol, en minutos por hora (+ hacia el N). */
  d: number;
  estrellas: EstrellaDelDia[];
}

/** Página del día: tabla horaria de 0 h a 24 h, PMG, semidiámetro, v, d y estrellas (a 0 h). */
export function paginaAlmanaque(dia0: number): PaginaAlmanaque {
  const filas: FilaHoraria[] = [];
  for (let h = 0; h <= 24; h++) {
    const t = dia0 + h * HORA;
    const s = datosAstro("sol", t);
    filas.push({ h, hGSol: s.hG, decSol: s.dec, hGAries: s.hGAries });
  }
  const primera = filas[0];
  const ultima = filas[24];
  const v = (normalizar180(ultima.hGSol - primera.hGSol) * 60) / 24;
  const d = ((ultima.decSol - primera.decSol) * 60) / 24;
  const estrellas = ESTRELLAS.map((e) => {
    const x = datosAstro(e, dia0);
    return { estrella: e, as: x.as!, dec: x.dec };
  });
  return { dia0, filas, pmg: pasoMeridiano(dia0), sd: datosAstro("sol", dia0 + 12 * HORA).sd!, v, d, estrellas };
}

/** Incremento de horario (grados) para un intervalo de minutos y segundos, como la tabla de incrementos. */
export function incremento(astro: "sol" | "aries", minutos: number, segundos = 0): number {
  if (minutos < 0 || minutos >= 60 || segundos < 0 || segundos >= 60) {
    throw new EntradaInvalida("Los minutos y segundos deben estar entre 0 y 59");
  }
  return (VELOCIDAD_HORARIO[astro] * (minutos * 60 + segundos)) / 3600;
}

export interface FilaIncremento {
  s: number;
  sol: number;
  aries: number;
}

/** Tabla de incrementos de un minuto: una fila por segundo (0 a 59). */
export function tablaIncrementos(minutos: number): FilaIncremento[] {
  return Array.from({ length: 60 }, (_, s) => ({ s, sol: incremento("sol", minutos, s), aries: incremento("aries", minutos, s) }));
}

/** Hora UT en formato «12 h 03 m 26 s». */
export function formatoHoraUT(ms: number): string {
  const s = Math.round((ms - inicioDia(ms)) / 1000) % 86400;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600) % 24)} h ${p(Math.floor((s % 3600) / 60))} m ${p(s % 60)} s`;
}

/** Hora UT con minutos redondeados, «07:02», como en la tabla de fenómenos del Almanaque. */
export function formatoHoraMinuto(f: Fenomeno, dia0: number): string {
  if ("no" in f) return f.no === "siempre-encima" ? "Sol siempre por encima" : "No ocurre";
  const min = Math.round((f.ms - dia0) / 60_000);
  const signo = min < 0 ? "día anterior " : min >= 1440 ? "día siguiente " : "";
  const m = ((min % 1440) + 1440) % 1440;
  return `${signo}${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
