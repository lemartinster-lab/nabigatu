/**
 * Vectores náuticos: un rumbo (0° = Norte, sentido horario) y un módulo
 * (velocidad en nudos, distancia en millas…).
 *
 * Internamente: x = componente Este, y = componente Norte.
 */
import { normalizar360 } from "./angulos";

export interface Vector {
  x: number; // hacia el Este
  y: number; // hacia el Norte
}

export interface Polar {
  rumbo: number; // grados, 0–360
  modulo: number;
}

const RAD = Math.PI / 180;

export function desdePolar({ rumbo, modulo }: Polar): Vector {
  return { x: modulo * Math.sin(rumbo * RAD), y: modulo * Math.cos(rumbo * RAD) };
}

export function aPolar({ x, y }: Vector): Polar {
  const modulo = Math.hypot(x, y);
  if (modulo < 1e-12) return { rumbo: 0, modulo: 0 };
  return { rumbo: normalizar360(Math.atan2(x, y) / RAD), modulo };
}

export function sumar(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function restar(a: Vector, b: Vector): Vector {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function sumarPolar(a: Polar, b: Polar): Polar {
  return aPolar(sumar(desdePolar(a), desdePolar(b)));
}
