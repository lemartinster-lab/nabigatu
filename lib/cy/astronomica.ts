/**
 * Latitud por meridiana, latitud por la Polar, recta de altura y corte de dos rectas.
 */
import { EntradaInvalida, formatoLatitud, formatoLongitud, formatoRumbo, normalizar360 } from "../nucleo/angulos";
import { desdePlano, type Posicion } from "../nucleo/coordenadas";
import { formatoNumero } from "../nucleo/unidades";
import type { Resultado } from "../per/correccion";
import { formatoAltura } from "./alturas";
import { formatoDeclinacion, formatoHorario } from "./astros";
import { arcoATiempo, formatoInstante } from "./tiempo";

const RAD = Math.PI / 180;
const sin = (g: number) => Math.sin(g * RAD);
const cos = (g: number) => Math.cos(g * RAD);

// ---------- Meridiana ----------

/**
 * Latitud por la altura meridiana de un astro.
 *   z = 90° − av
 *   Astro al S del observador: l = dec + z      Astro al N: l = dec − z
 * El lado se deduce de la latitud de estima (o se indica).
 */
export function latitudMeridiana(
  av: number,
  dec: number,
  latEstima: number,
): Resultado & { lat: number; z: number; astroAl: "N" | "S" } {
  if (av <= 0 || av > 90) throw new EntradaInvalida("La altura verdadera debe estar entre 0° y 90°");
  const z = 90 - av;
  const astroAl: "N" | "S" = latEstima > dec ? "S" : "N";
  const lat = astroAl === "S" ? dec + z : dec - z;
  if (Math.abs(lat) > 90) throw new EntradaInvalida("Resultado imposible: revisa la altura y la declinación");
  return {
    lat,
    z,
    astroAl,
    pasos: [
      `Distancia cenital z = 90° − av = 90° − ${formatoAltura(av)} = ${formatoAltura(z)}`,
      `Con la latitud de estima ${formatoLatitud(latEstima)} el astro pasa por el meridiano al ${astroAl === "S" ? "Sur" : "Norte"} del observador`,
      `l = dec ${astroAl === "S" ? "+" : "−"} z  (N positivo, S negativo)`,
      `l = (${dec < 0 ? "−" : "+"}${formatoAltura(Math.abs(dec))}) ${astroAl === "S" ? "+" : "−"} ${formatoAltura(z)} = ${lat < 0 ? "−" : "+"}${formatoAltura(Math.abs(lat))}`,
      `Latitud = ${formatoLatitud(lat)}`,
    ],
  };
}

/**
 * Hora del paso del Sol por el meridiano del lugar a partir del paso por Greenwich (Pmg)
 * del Almanaque:  HcG paso = Pmg − λ (en tiempo, λ al E positiva).
 */
export function pasoPorMeridiano(
  pmgInstante: number,
  lon: number,
  adelanto: number,
): Resultado & { hcg: number; ho: number } {
  const hcg = pmgInstante - (lon / 15) * 3_600_000;
  const ho = hcg + adelanto * 3_600_000;
  return {
    hcg,
    ho,
    pasos: [
      `HcL del paso ≈ Pmg = ${formatoInstante(pmgInstante).slice(11)}`,
      `λ en tiempo = ${arcoATiempo(lon)} ${lon >= 0 ? "E" : "W"}`,
      `HcG del paso = Pmg − λ = ${formatoInstante(hcg)}`,
      `Hora oficial = HcG + adelanto = ${formatoInstante(ho)}`,
    ],
  };
}

// ---------- Polar ----------

/**
 * Latitud por la altura de la Polar, resolviendo el triángulo de posición:
 *   sen av = sen l · sen d + cos l · cos d · cos hL
 */
export function latitudPolar(av: number, hL: number, dec: number): Resultado & { lat: number; azimut: number } {
  const A = sin(dec);
  const B = cos(dec) * cos(hL);
  const R = Math.hypot(A, B);
  const s = sin(av) / R;
  if (Math.abs(s) > 1) throw new EntradaInvalida("Datos incompatibles: revisa la altura y el horario de la Polar");
  const phi = Math.atan2(B, A) / RAD;
  // sen av = A · sen l + B · cos l = R · sen(l + φ), φ = atan2(B, A). Se elige la solución cercana a la altura (l ≈ av).
  const base = Math.asin(s) / RAD;
  const candidatas = [base - phi, 180 - base - phi].map((x) => ((x + 540) % 360) - 180).filter((x) => Math.abs(x) <= 90);
  if (candidatas.length === 0) throw new EntradaInvalida("No hay solución con esos datos");
  const lat = candidatas.reduce((a, b) => (Math.abs(a - av) < Math.abs(b - av) ? a : b));
  const azimut = azimutDe(lat, hL, dec);
  return {
    lat,
    azimut,
    pasos: [
      "sen av = sen l · sen d + cos l · cos d · cos hL",
      `av = ${formatoAltura(av)}, d = ${formatoDeclinacion(dec)}, hL = ${formatoHorario(hL)}`,
      `Corrección (l − av) = ${formatoNumero((lat - av) * 60, 1)}′`,
      `Latitud = ${formatoLatitud(lat)}`,
      `Azimut de la Polar = ${formatoRumbo(azimut)} (sirve para comprobar la aguja)`,
    ],
  };
}

// ---------- Recta de altura ----------

function azimutDe(lat: number, hL: number, dec: number): number {
  // Azimut náutico (0–360 desde el N, horario)
  const y = -cos(dec) * sin(hL);
  const x = sin(dec) * cos(lat) - cos(dec) * sin(lat) * cos(hL);
  return normalizar360(Math.atan2(y, x) / RAD);
}

export function alturaYAzimut(lat: number, hL: number, dec: number): { ae: number; z: number } {
  const sinAe = sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(hL);
  return { ae: Math.asin(Math.max(-1, Math.min(1, sinAe))) / RAD, z: azimutDe(lat, hL, dec) };
}

export function rectaDeAltura(
  estima: Posicion,
  hG: number,
  dec: number,
  av?: number,
): Resultado & { hL: number; ae: number; z: number; da?: number; determinante?: Posicion } {
  const hL = normalizar360(hG + estima.lon);
  const { ae, z } = alturaYAzimut(estima.lat, hL, dec);
  const pasos = [
    `hL = hG + λe = ${formatoHorario(hG)} ${estima.lon >= 0 ? "+" : "−"} ${formatoLongitud(estima.lon).replace(/ [EW]$/, "")} = ${formatoHorario(hL)}`,
    "sen ae = sen le · sen d + cos le · cos d · cos hL",
    `ae = ${formatoAltura(ae)}`,
    "Z: tg Z = −cos d · sen hL ÷ (sen d · cos le − cos d · sen le · cos hL)",
    `Azimut Z = ${formatoRumbo(z)}`,
  ];
  if (ae < 0) pasos.push("Atención: con esa situación el astro está bajo el horizonte.");
  if (av === undefined) return { hL, ae, z, pasos };

  const da = (av - ae) * 60;
  const determinante = desdePlano({ x: da * sin(z), y: da * cos(z) }, estima);
  pasos.push(
    `Δa = av − ae = ${formatoAltura(av)} − ${formatoAltura(ae)} = ${da >= 0 ? "+" : "−"}${formatoNumero(Math.abs(da), 1)}′`,
    `Determinante: ${formatoNumero(Math.abs(da), 1)} millas ${da >= 0 ? "hacia el astro" : "en sentido contrario al astro"} (${formatoRumbo(da >= 0 ? z : z + 180)}) desde la estima`,
    `Punto determinante: ${formatoLatitud(determinante.lat)} ${formatoLongitud(determinante.lon)}`,
    "La recta de altura pasa por ese punto, perpendicular al azimut.",
  );
  return { hL, ae, z, da, determinante, pasos };
}

/**
 * Situación por el corte de dos rectas de altura, ambas referidas a la misma
 * situación de estima (la de la segunda observación; si no son simultáneas,
 * calcula la primera recta con la estima trasladada a la hora de la segunda).
 *   Cada recta: (x · sen Z + y · cos Z) = Δa
 */
export function corteDeRectas(
  estima: Posicion,
  z1: number,
  da1: number,
  z2: number,
  da2: number,
): Resultado & { posicion: Posicion; angulo: number } {
  const det = sin(z1) * cos(z2) - cos(z1) * sin(z2);
  if (Math.abs(det) < 0.05) throw new EntradaInvalida("Los azimutes son casi iguales u opuestos: las rectas no se cortan bien");
  const x = (da1 * cos(z2) - da2 * cos(z1)) / det;
  const y = (sin(z1) * da2 - sin(z2) * da1) / det;
  const posicion = desdePlano({ x, y }, estima);
  const angulo = Math.abs(((z1 - z2 + 540) % 360) - 180);
  const corte = angulo > 90 ? 180 - angulo : angulo;
  return {
    posicion,
    angulo: corte,
    pasos: [
      `Recta 1: Z ${formatoRumbo(z1)}, Δa ${da1 >= 0 ? "+" : "−"}${formatoNumero(Math.abs(da1), 1)}′`,
      `Recta 2: Z ${formatoRumbo(z2)}, Δa ${da2 >= 0 ? "+" : "−"}${formatoNumero(Math.abs(da2), 1)}′`,
      `Desde la estima: ${formatoNumero(Math.abs(y), 1)} millas al ${y >= 0 ? "N" : "S"} y ${formatoNumero(Math.abs(x), 1)} millas al ${x >= 0 ? "E" : "W"}`,
      ...(corte < 30 ? [`Atención: las rectas se cortan con un ángulo de solo ${formatoNumero(corte, 0)}°.`] : []),
      `Situación observada: ${formatoLatitud(posicion.lat)} ${formatoLongitud(posicion.lon)}`,
    ],
  };
}
