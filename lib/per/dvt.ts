/**
 * Distancia, velocidad y tiempo:  D = V × t
 * Distancia en millas, velocidad en nudos, tiempo en horas.
 */
import { EntradaInvalida } from "../nucleo/angulos";
import { formatoDuracion, formatoNumero, sumarAHora } from "../nucleo/unidades";
import type { Resultado } from "./correccion";

export interface DatosDVT {
  distancia?: number;
  velocidad?: number;
  tiempo?: number; // horas
  /** Hora de salida en minutos desde medianoche (opcional, para la ETA). */
  horaSalida?: number;
}

export interface ResultadoDVT extends Resultado {
  distancia: number;
  velocidad: number;
  tiempo: number;
  llegada?: string;
}

export function resolverDVT(d: DatosDVT): ResultadoDVT {
  const dados = [d.distancia, d.velocidad, d.tiempo].filter((v) => v !== undefined).length;
  if (dados !== 2) throw new EntradaInvalida("Rellena exactamente dos de los tres datos");
  for (const v of [d.distancia, d.velocidad, d.tiempo]) {
    if (v !== undefined && v <= 0) throw new EntradaInvalida("Los datos deben ser mayores que cero");
  }

  let distancia: number, velocidad: number, tiempo: number;
  const pasos: string[] = [];

  if (d.distancia === undefined) {
    velocidad = d.velocidad!;
    tiempo = d.tiempo!;
    distancia = velocidad * tiempo;
    pasos.push(
      "D = V × t",
      `D = ${formatoNumero(velocidad)} nudos × ${formatoNumero(tiempo, 3)} h`,
      `D = ${formatoNumero(distancia)} millas`,
    );
  } else if (d.velocidad === undefined) {
    distancia = d.distancia;
    tiempo = d.tiempo!;
    velocidad = distancia / tiempo;
    pasos.push(
      "V = D ÷ t",
      `V = ${formatoNumero(distancia)} millas ÷ ${formatoNumero(tiempo, 3)} h`,
      `V = ${formatoNumero(velocidad)} nudos`,
    );
  } else {
    distancia = d.distancia;
    velocidad = d.velocidad;
    tiempo = distancia / velocidad;
    pasos.push(
      "t = D ÷ V",
      `t = ${formatoNumero(distancia)} millas ÷ ${formatoNumero(velocidad)} nudos`,
      `t = ${formatoNumero(tiempo, 3)} h = ${formatoDuracion(tiempo)}`,
    );
  }

  let llegada: string | undefined;
  if (d.horaSalida !== undefined) {
    llegada = sumarAHora(d.horaSalida, tiempo);
    pasos.push(`Hora de llegada = hora de salida + ${formatoDuracion(tiempo)} = ${llegada}`);
  }

  return { distancia, velocidad, tiempo, llegada, pasos };
}
