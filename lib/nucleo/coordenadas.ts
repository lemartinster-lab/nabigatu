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

/** Lee una latitud escrita sin signo; el hemisferio va aparte (+1 N, −1 S). */
export function leerLatitud(texto: string, hemisferio: 1 | -1): number {
  return validarLatitud(hemisferio * Math.abs(leerAngulo(texto)));
}

/** Lee una longitud escrita sin signo; el sentido va aparte (+1 E, −1 W). */
export function leerLongitud(texto: string, sentido: 1 | -1): number {
  return validarLongitud(sentido * Math.abs(leerAngulo(texto)));
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
