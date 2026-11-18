/**
 * Situación por demoras y otros problemas de carta, resueltos numéricamente
 * a partir de las coordenadas de los faros leídas en la carta.
 *
 * Se trabaja en un plano local en millas (válido para distancias de carta costera).
 * Una demora Dv a un faro F desde la posición P significa: F = P + d · u(Dv),
 * donde u(Dv) es el vector unitario hacia Dv y d la distancia al faro.
 */
import { EntradaInvalida, formatoRumbo, normalizar360, normalizar180, redondearGrados } from "../nucleo/angulos";
import { aPlano, desdePlano, type Posicion } from "../nucleo/coordenadas";
import { aPolar, desdePolar } from "../nucleo/vectores";
import { formatoNumero } from "../nucleo/unidades";
import type { Resultado } from "../per/correccion";
import { formatoPosicion } from "./estima";

const RAD = Math.PI / 180;
const u = (rumbo: number) => ({ x: Math.sin(rumbo * RAD), y: Math.cos(rumbo * RAD) });

/** Resuelve d1·u1 − d2·u2 = b. Devuelve d1 y d2. */
function cortar(u1: { x: number; y: number }, u2: { x: number; y: number }, b: { x: number; y: number }) {
  const det = -u1.x * u2.y + u2.x * u1.y;
  if (Math.abs(det) < 1e-6) {
    throw new EntradaInvalida("Las dos demoras son paralelas: no se cortan. Elige faros con más diferencia de demora.");
  }
  const d1 = (-b.x * u2.y + u2.x * b.y) / det;
  const d2 = (u1.x * b.y - u1.y * b.x) / det;
  return { d1, d2 };
}

function avisoAngulo(dv1: number, dv2: number): string[] {
  const ang = Math.abs(normalizar180(dv1 - dv2));
  const corte = ang > 90 ? 180 - ang : ang;
  return corte < 30
    ? [`Atención: las demoras se cortan con un ángulo de solo ${formatoNumero(corte, 0)}°; la situación es poco precisa.`]
    : [];
}

/** Situación por dos demoras simultáneas a dos faros. */
export function dosDemoras(f1: Posicion, dv1: number, f2: Posicion, dv2: number): Resultado & { posicion: Posicion; d1: number; d2: number } {
  const ref = f1;
  const p1 = aPlano(f1, ref);
  const p2 = aPlano(f2, ref);
  const { d1, d2 } = cortar(u(dv1), u(dv2), { x: p1.x - p2.x, y: p1.y - p2.y });
  if (d1 <= 0 || d2 <= 0) {
    throw new EntradaInvalida("Las demoras no se cortan delante de los faros. Revisa si has puesto la demora o su opuesta.");
  }
  const pos = { x: p1.x - d1 * u(dv1).x, y: p1.y - d1 * u(dv1).y };
  const posicion = desdePlano(pos, ref);
  return {
    posicion,
    d1,
    d2,
    pasos: [
      "Desde cada faro se traza la línea opuesta a su demora; la situación está en el corte.",
      `Faro 1: Dv ${formatoRumbo(dv1)} → estamos en su opuesta, ${formatoRumbo(dv1 + 180)}`,
      `Faro 2: Dv ${formatoRumbo(dv2)} → estamos en su opuesta, ${formatoRumbo(dv2 + 180)}`,
      `Distancia al faro 1 = ${formatoNumero(d1, 2)} millas; al faro 2 = ${formatoNumero(d2, 2)} millas`,
      ...avisoAngulo(dv1, dv2),
      `Situación: ${formatoPosicion(posicion)}`,
    ],
  };
}

/** Situación por demora y distancia a un faro. */
export function demoraYDistancia(f: Posicion, dv: number, distancia: number): Resultado & { posicion: Posicion } {
  if (distancia <= 0) throw new EntradaInvalida("La distancia debe ser mayor que cero");
  const posicion = desdePlano({ x: -distancia * u(dv).x, y: -distancia * u(dv).y }, f);
  return {
    posicion,
    pasos: [
      `Estamos en la opuesta de la demora: ${formatoRumbo(dv + 180)} desde el faro`,
      `A ${formatoNumero(distancia, 2)} millas del faro`,
      `Situación: ${formatoPosicion(posicion)}`,
    ],
  };
}

/**
 * Situación por dos demoras no simultáneas (traslado de la primera demora).
 * Entre la primera y la segunda observación el barco avanza según el rumbo
 * y la velocidad efectivos durante el intervalo.
 */
export function demorasNoSimultaneas(
  f1: Posicion,
  dv1: number,
  f2: Posicion,
  dv2: number,
  rumboEfectivo: number,
  velocidadEfectiva: number,
  horas: number,
): Resultado & { posicion: Posicion; posicionPrimera: Posicion; recorrido: number } {
  if (velocidadEfectiva <= 0 || horas <= 0) throw new EntradaInvalida("La velocidad y el intervalo deben ser mayores que cero");
  const recorrido = velocidadEfectiva * horas;
  const run = desdePolar({ rumbo: rumboEfectivo, modulo: recorrido });
  const ref = f1;
  const p1 = aPlano(f1, ref);
  const p2 = aPlano(f2, ref);
  // P2 = F1 + run − d1·u1  y  P2 = F2 − d2·u2  →  d1·u1 − d2·u2 = F1 + run − F2
  const { d1, d2 } = cortar(u(dv1), u(dv2), { x: p1.x + run.x - p2.x, y: p1.y + run.y - p2.y });
  if (d1 <= 0 || d2 <= 0) {
    throw new EntradaInvalida("Las demoras no se cortan delante de los faros. Revisa los datos.");
  }
  const pos2 = { x: p2.x - d2 * u(dv2).x, y: p2.y - d2 * u(dv2).y };
  const posicion = desdePlano(pos2, ref);
  const posicionPrimera = desdePlano({ x: pos2.x - run.x, y: pos2.y - run.y }, ref);

  return {
    posicion,
    posicionPrimera,
    recorrido,
    pasos: [
      `Recorrido entre observaciones = ${formatoNumero(velocidadEfectiva)} nudos × ${formatoNumero(horas, 3)} h = ${formatoNumero(recorrido, 2)} millas al ${formatoRumbo(rumboEfectivo)}`,
      `Se traslada la primera demora (${formatoRumbo(dv1)}) ${formatoNumero(recorrido, 2)} millas al ${formatoRumbo(rumboEfectivo)}`,
      `Se corta con la segunda demora (${formatoRumbo(dv2)})`,
      `Distancia al faro de la 2.ª demora = ${formatoNumero(d2, 2)} millas`,
      ...avisoAngulo(dv1, dv2),
      `Situación en la 1.ª observación: ${formatoPosicion(posicionPrimera)}`,
      `Situación en la 2.ª observación: ${formatoPosicion(posicion)}`,
    ],
  };
}

/**
 * Rumbo verdadero para pasar a una distancia dada de un punto (faro, cabo…),
 * dejándolo por babor o por estribor.
 */
export function pasarADistancia(
  desde: Posicion,
  punto: Posicion,
  distanciaPaso: number,
  dejarPor: "babor" | "estribor",
): Resultado & { rumbo: number; demora: number; distanciaActual: number; angulo: number } {
  const v = aPlano(punto, desde);
  const { rumbo: demora, modulo: distanciaActual } = aPolar(v);
  if (distanciaPaso <= 0) throw new EntradaInvalida("La distancia de paso debe ser mayor que cero");
  if (distanciaPaso >= distanciaActual) {
    throw new EntradaInvalida(`Ya estás a ${formatoNumero(distanciaActual, 2)} millas del punto: no se puede pasar a ${formatoNumero(distanciaPaso, 2)}`);
  }
  const angulo = Math.asin(distanciaPaso / distanciaActual) / RAD;
  // Dejarlo por estribor: el punto queda a la derecha → el rumbo va a la izquierda de la demora.
  const rumbo = normalizar360(redondearGrados(dejarPor === "estribor" ? demora - angulo : demora + angulo));
  return {
    rumbo,
    demora,
    distanciaActual,
    angulo,
    pasos: [
      `Demora verdadera al punto = ${formatoRumbo(demora)}, distancia = ${formatoNumero(distanciaActual, 2)} millas`,
      `Ángulo de separación: sen α = ${formatoNumero(distanciaPaso, 2)} ÷ ${formatoNumero(distanciaActual, 2)} → α = ${formatoNumero(angulo, 2)}°`,
      `Dejándolo por ${dejarPor}: Rumbo = ${formatoRumbo(demora)} ${dejarPor === "estribor" ? "−" : "+"} ${formatoNumero(angulo, 2)}° = ${formatoRumbo(rumbo)}`,
      "Este es el rumbo efectivo (sobre el fondo). Si hay corriente o viento, pásalo por «Rumbo a dar al timonel».",
    ],
  };
}
