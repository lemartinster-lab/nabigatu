/**
 * Posiciones geográficas: latitud (N +, S −) y longitud (E +, W −) en grados decimales.
 */
import { EntradaInvalida, leerAngulo, normalizar180 } from "./angulos";

export interface Posicion {
  lat: number;
  lon: number;
}

export function validarLatitud(lat: number): number {
  if (Math.abs(lat) > 90) throw new EntradaInvalida("La latitud no puede pasar de 90°");
  return lat;
}

export function validarLongitud(lon: number): number {
  if (Math.abs(lon) > 180) throw new EntradaInvalida("La longitud no puede pasar de 180°");
  return lon;
}

export type TipoCoordenada = "lat" | "lon";

const LETRAS: Record<TipoCoordenada, Record<string, 1 | -1>> = {
  lat: { N: 1, S: -1 },
  // O de «Oeste», además de la W internacional
  lon: { E: 1, W: -1, O: -1 },
};

/**
 * Separa la letra del hemisferio escrita delante o detrás del número:
 * «36°06,6' N», «N 36°06,6'», «5º 20.6' W», «5°20,6'O».
 * Devuelve el texto sin la letra y el signo que indica (o undefined si no hay letra).
 */
export function separarHemisferio(texto: string, tipo: TipoCoordenada): { numero: string; signo?: 1 | -1 } {
  const t = texto.trim();
  const m = t.match(/^([A-Za-z])\s*(.*)$/) ?? t.match(/^(.*?)\s*([A-Za-z])$/);
  if (!m) return { numero: t };
  const [letra, numero] = /^[A-Za-z]$/.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]];
  const signo = LETRAS[tipo][letra.toUpperCase()];
  if (signo === undefined) {
    throw new EntradaInvalida(tipo === "lat" ? "En la latitud usa N o S" : "En la longitud usa E o W (u O de Oeste)");
  }
  return { numero: numero.trim(), signo };
}

/**
 * Lee una latitud. El hemisferio puede ir en el texto (N/S) o aparte (+1 N, −1 S);
 * si va en el texto, manda la letra.
 */
export function leerLatitud(texto: string, hemisferio: 1 | -1): number {
  const { numero, signo } = separarHemisferio(texto, "lat");
  return validarLatitud((signo ?? hemisferio) * Math.abs(leerAngulo(numero)));
}

/**
 * Lee una longitud. El sentido puede ir en el texto (E/W/O) o aparte (+1 E, −1 W);
 * si va en el texto, manda la letra.
 */
export function leerLongitud(texto: string, sentido: 1 | -1): number {
  const { numero, signo } = separarHemisferio(texto, "lon");
  return validarLongitud((signo ?? sentido) * Math.abs(leerAngulo(numero)));
}

/** Lleva una longitud a (−180, 180]. 181° E → 179° W. */
export function normalizarLongitud(lon: number): number {
  return normalizar180(lon);
}

/**
 * Diferencia de longitud de A a B por el camino más corto (−180, 180].
 * Positiva hacia el Este. Resuelve el cruce del meridiano de 180°.
 */
export function diferenciaLongitud(lonA: number, lonB: number): number {
  return normalizar180(lonB - lonA);
}

/**
 * Proyección local plana en millas alrededor de una posición de referencia.
 * Suficiente para los problemas de carta (distancias de pocas decenas de millas).
 */
export function aPlano(p: Posicion, ref: Posicion): { x: number; y: number } {
  const cosLat = Math.cos((ref.lat * Math.PI) / 180);
  return {
    x: diferenciaLongitud(ref.lon, p.lon) * 60 * cosLat,
    y: (p.lat - ref.lat) * 60,
  };
}

export function desdePlano(v: { x: number; y: number }, ref: Posicion): Posicion {
  const cosLat = Math.cos((ref.lat * Math.PI) / 180);
  return {
    lat: validarLatitud(ref.lat + v.y / 60),
    lon: normalizarLongitud(ref.lon + v.x / 60 / cosLat),
  };
}
