/**
 * Estima y loxodrómica por el método de la latitud media (Patrón de Yate).
 *
 *   Δl = D · cos R          (diferencia de latitud, en minutos = millas)
 *   A  = D · sen R          (apartamiento, en millas)
 *   lm = (l1 + l2) / 2      (latitud media)
 *   Δλ = A / cos lm         (diferencia de longitud, en minutos)
 *
 * Inverso (rumbo directo entre dos posiciones):
 *   A = Δλ · cos lm,   tg R = A / Δl,   D = √(Δl² + A²)
 */
import {
  EntradaInvalida,
  aCuadrantal,
  formatoCuadrantal,
  formatoRumbo,
  normalizar360,
} from "../nucleo/angulos";
import { formatoLatitud, formatoLongitud } from "../nucleo/angulos";
import { diferenciaLongitud, normalizarLongitud, validarLatitud, type Posicion } from "../nucleo/coordenadas";
import { formatoNumero } from "../nucleo/unidades";
import type { Resultado } from "../per/correccion";

const RAD = Math.PI / 180;

const minutos = (x: number, d = 1) => `${formatoNumero(Math.abs(x), d)}′`;
const nS = (x: number) => (x >= 0 ? "N" : "S");
const eW = (x: number) => (x >= 0 ? "E" : "W");

export function formatoPosicion(p: Posicion): string {
  return `${formatoLatitud(p.lat)}  ${formatoLongitud(p.lon)}`;
}

/** Rumbo y distancia loxodrómicos entre dos posiciones. */
export function rumboYDistancia(
  salida: Posicion,
  llegada: Posicion,
): Resultado & { rumbo: number; distancia: number; dLat: number; dLon: number; apartamiento: number } {
  const dLat = (llegada.lat - salida.lat) * 60; // minutos
  const dLonGrados = diferenciaLongitud(salida.lon, llegada.lon);
  const dLon = dLonGrados * 60;
  const lm = (salida.lat + llegada.lat) / 2;
  const apartamiento = dLon * Math.cos(lm * RAD);
  const distancia = Math.hypot(dLat, apartamiento);
  if (distancia < 1e-9) throw new EntradaInvalida("La salida y la llegada son la misma posición");
  const rumbo = normalizar360(Math.atan2(apartamiento, dLat) / RAD);

  const cruza180 = Math.abs(llegada.lon - salida.lon) > 180;
  const pasos = [
    `Δl = l llegada − l salida = ${minutos(dLat)} ${nS(dLat)}`,
    `Δλ = ${minutos(dLon)} ${eW(dLon)}${cruza180 ? " (cruzando el meridiano de 180°)" : ""}`,
    `lm = (l salida + l llegada) ÷ 2 = ${formatoLatitud(lm)}`,
    `A = Δλ · cos lm = ${formatoNumero(Math.abs(dLon), 1)} · cos ${formatoNumero(Math.abs(lm), 3)}° = ${formatoNumero(Math.abs(apartamiento), 1)} millas ${eW(apartamiento)}`,
    `tg R = A ÷ Δl = ${formatoNumero(Math.abs(apartamiento), 1)} ÷ ${formatoNumero(Math.abs(dLat), 1)} → R = ${formatoCuadrantal(aCuadrantal(rumbo))}`,
    `Rumbo directo = ${formatoRumbo(rumbo)}`,
    `D = √(Δl² + A²) = ${formatoNumero(distancia, 1)} millas`,
  ];
  return { rumbo, distancia, dLat, dLon, apartamiento, pasos };
}

export interface Tramo {
  rumbo: number;
  distancia: number;
  /** Texto opcional para el desarrollo («Corriente», «Rumbo 1»…). */
  nombre?: string;
}

/**
 * Estima (simple o compuesta): se suman las Δl y los apartamientos de todos los tramos
 * y se convierte el apartamiento total con la latitud media entre salida y llegada.
 */
export function estima(
  salida: Posicion,
  tramos: Tramo[],
): Resultado & { llegada: Posicion; rumboDirecto: number; distanciaDirecta: number } {
  if (tramos.length === 0) throw new EntradaInvalida("Añade al menos un tramo");
  const pasos: string[] = [];
  let sumaDLat = 0;
  let sumaA = 0;

  tramos.forEach((t, i) => {
    if (t.distancia < 0) throw new EntradaInvalida("Las distancias no pueden ser negativas");
    const dl = t.distancia * Math.cos(t.rumbo * RAD);
    const a = t.distancia * Math.sin(t.rumbo * RAD);
    sumaDLat += dl;
    sumaA += a;
    pasos.push(
      `${t.nombre ?? `Tramo ${i + 1}`}: R ${formatoRumbo(t.rumbo)}, D ${formatoNumero(t.distancia, 2)} → Δl ${minutos(dl)} ${nS(dl)}, A ${formatoNumero(Math.abs(a), 1)} ${eW(a)}`,
    );
  });

  const latLlegada = validarLatitud(salida.lat + sumaDLat / 60);
  const lm = (salida.lat + latLlegada) / 2;
  const cosLm = Math.cos(lm * RAD);
  if (cosLm < 1e-6) throw new EntradaInvalida("No se puede navegar por estima sobre el polo");
  const dLon = sumaA / cosLm;
  const lonLlegada = normalizarLongitud(salida.lon + dLon / 60);
  const rumboDirecto = normalizar360(Math.atan2(sumaA, sumaDLat) / RAD);
  const distanciaDirecta = Math.hypot(sumaDLat, sumaA);

  if (tramos.length > 1) {
    pasos.push(
      `Total: Δl ${minutos(sumaDLat)} ${nS(sumaDLat)}, A ${formatoNumero(Math.abs(sumaA), 1)} ${eW(sumaA)}`,
      `Rumbo directo ${formatoRumbo(rumboDirecto)}, distancia directa ${formatoNumero(distanciaDirecta, 1)} millas`,
    );
  }
  pasos.push(
    `l llegada = l salida + Δl = ${formatoLatitud(latLlegada)}`,
    `lm = ${formatoLatitud(lm)}`,
    `Δλ = A ÷ cos lm = ${formatoNumero(Math.abs(sumaA), 1)} ÷ cos ${formatoNumero(Math.abs(lm), 3)}° = ${minutos(dLon)} ${eW(dLon)}`,
    `L llegada = L salida + Δλ = ${formatoLongitud(lonLlegada)}${Math.abs(salida.lon + dLon / 60) > 180 ? " (cruzando el meridiano de 180°)" : ""}`,
  );

  return { llegada: { lat: latLlegada, lon: lonLlegada }, rumboDirecto, distanciaDirecta, pasos };
}
