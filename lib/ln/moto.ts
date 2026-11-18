/**
 * Herramientas para la licencia de navegación («titulín») y las motos náuticas.
 *
 * Fuentes (BOE, textos consolidados, última actualización publicada el 30/12/2025):
 *  - Real Decreto 875/2014, art. 11.1: licencia de navegación, navegaciones diurnas
 *    sin alejarse más de 2 millas náuticas de un puerto, marina o lugar de abrigo.
 *  - Real Decreto 259/2002 (motos náuticas), arts. 4, 5, 10 y 11.
 */
import { EntradaInvalida } from "../nucleo/angulos";
import type { Posicion } from "../nucleo/coordenadas";
import { formatoDuracion, formatoNumero } from "../nucleo/unidades";
import type { Resultado } from "../per/correccion";
import { rumboYDistancia } from "../py/estima";
import { formatoRumbo } from "../nucleo/angulos";

/** Límite de alejamiento de la licencia de navegación, en millas (RD 875/2014, art. 11.1). */
export const LIMITE_LICENCIA_MILLAS = 2;
export const METROS_POR_MILLA = 1852;

export function comprobarAlcance(
  abrigo: Posicion,
  destino: Posicion,
  velocidad?: number,
): Resultado & { distancia: number; rumbo: number; dentro: boolean; margen: number } {
  const r = rumboYDistancia(abrigo, destino);
  const distancia = r.distancia;
  const dentro = distancia <= LIMITE_LICENCIA_MILLAS + 1e-9;
  const margen = LIMITE_LICENCIA_MILLAS - distancia;
  const pasos = [
    `Distancia desde el puerto, marina o abrigo hasta el punto: ${formatoNumero(distancia, 2)} millas (${formatoNumero(distancia * METROS_POR_MILLA, 0)} m), al ${formatoRumbo(r.rumbo)}`,
    `Límite de la licencia de navegación: ${LIMITE_LICENCIA_MILLAS} millas en cualquier dirección (RD 875/2014, art. 11.1)`,
    dentro
      ? `Dentro del límite: quedan ${formatoNumero(margen, 2)} millas de margen`
      : `FUERA del límite: te pasas en ${formatoNumero(-margen, 2)} millas`,
  ];
  if (velocidad !== undefined) {
    if (velocidad <= 0) throw new EntradaInvalida("La velocidad debe ser mayor que cero");
    pasos.push(`Ida y vuelta a ${formatoNumero(velocidad)} nudos: ${formatoDuracion((2 * distancia) / velocidad)}`);
  }
  pasos.push("La distancia es en línea recta: mide también que el camino no cruce la franja de 200 m de la costa ni zonas de baño.");
  return { distancia, rumbo: r.rumbo, dentro, margen, pasos };
}

export interface DatosAutonomia {
  deposito: number; // litros
  consumo: number; // litros por hora a la velocidad de crucero
  velocidad: number; // nudos
  /** Parte del depósito que se guarda de reserva (por defecto un tercio: regla del tercio). */
  reserva?: number;
}

/**
 * Autonomía con la regla del tercio: un tercio para ir, un tercio para volver y un tercio de reserva.
 */
export function autonomia(d: DatosAutonomia): Resultado & {
  horasTotales: number;
  radio: number;
  horasIda: number;
  litrosReserva: number;
} {
  if (d.deposito <= 0 || d.consumo <= 0 || d.velocidad <= 0) {
    throw new EntradaInvalida("El depósito, el consumo y la velocidad deben ser mayores que cero");
  }
  const reserva = d.reserva ?? 1 / 3;
  if (reserva < 0 || reserva >= 1) throw new EntradaInvalida("La reserva debe estar entre 0 % y 99 %");
  const horasTotales = d.deposito / d.consumo;
  const litrosReserva = d.deposito * reserva;
  const horasIda = (d.deposito - litrosReserva) / 2 / d.consumo;
  const radio = horasIda * d.velocidad;
  return {
    horasTotales,
    radio,
    horasIda,
    litrosReserva,
    pasos: [
      `Autonomía con el depósito lleno: ${formatoNumero(d.deposito, 1)} L ÷ ${formatoNumero(d.consumo, 1)} L/h = ${formatoDuracion(horasTotales)}`,
      `Reserva: ${formatoNumero(reserva * 100, 0)} % = ${formatoNumero(litrosReserva, 1)} L`,
      `Para ir: la mitad de lo que queda = ${formatoNumero((d.deposito - litrosReserva) / 2, 1)} L → ${formatoDuracion(horasIda)}`,
      `Máximo alejamiento por combustible: ${formatoDuracion(horasIda)} × ${formatoNumero(d.velocidad)} nudos = ${formatoNumero(radio, 1)} millas`,
      radio > LIMITE_LICENCIA_MILLAS
        ? `Con la licencia de navegación, el límite que manda es el de ${LIMITE_LICENCIA_MILLAS} millas, no el combustible.`
        : `Ojo: el combustible te limita a menos de las ${LIMITE_LICENCIA_MILLAS} millas de la licencia.`,
      "El consumo real sube con mar, viento, pasajeros y aceleraciones: tómalo como orientativo.",
    ],
  };
}

export interface Norma {
  titulo: string;
  texto: string;
  fuente: string;
  /** Enlace al texto oficial; vacío si la norma no está en un texto concreto. */
  url: string;
}

const RD259 = "https://www.boe.es/eli/es/rd/2002/03/08/259/con";
const RD875 = "https://www.boe.es/eli/es/rd/2014/10/10/875/con";

/** Fecha en que se revisaron las normas contra el BOE (texto consolidado actualizado el 30/12/2025). */
export const NORMAS_REVISADAS = "18/11/2026";

export const NORMAS_MOTO: Norma[] = [
  {
    titulo: "Hasta 2 millas y solo de día",
    texto: "La licencia de navegación permite navegaciones diurnas sin alejarse más de 2 millas náuticas en cualquier dirección de un puerto, marina o lugar de abrigo.",
    fuente: "Real Decreto 875/2014, art. 11.1",
    url: RD875,
  },
  {
    titulo: "Motos náuticas sin límite de potencia",
    texto: "Con la licencia de navegación se pueden gobernar motos náuticas sin limitación de potencia.",
    fuente: "Real Decreto 259/2002, art. 5.2",
    url: RD259,
  },
  {
    titulo: "Horario",
    texto: "Las motos náuticas solo pueden navegar de día, entre una hora después del orto y una hora antes del ocaso. Calcúlalo en «Horas de luz».",
    fuente: "Real Decreto 259/2002, art. 10.7",
    url: RD259,
  },
  {
    titulo: "Franja de 200 metros",
    texto: "Donde no hay zona de baño balizada, está prohibido navegar en la franja de 200 metros junto a la costa, salvo para varar en la playa o salir de ella.",
    fuente: "Real Decreto 259/2002, art. 10.6",
    url: RD259,
  },
  {
    titulo: "Entrar y salir de la playa",
    texto: "Por los canales balizados de lanzamiento y varada; si no los hay, en trayectoria perpendicular a la costa y a no más de 3 nudos.",
    fuente: "Real Decreto 259/2002, arts. 10.5 y 10.6",
    url: RD259,
  },
  {
    titulo: "Zonas de baño balizadas",
    texto: "Está prohibido navegar dentro de las zonas de baño balizadas.",
    fuente: "Real Decreto 259/2002, art. 10.5",
    url: RD259,
  },
  {
    titulo: "Distancia a otros",
    texto: "Mantén al menos 50 metros con otras motos, artefactos, buques y embarcaciones.",
    fuente: "Real Decreto 259/2002, art. 11 (placa de normas)",
    url: RD259,
  },
  {
    titulo: "Circuitos de alquiler",
    texto: "No navegues cerca de los circuitos de las empresas de alquiler ni de sus excursiones.",
    fuente: "Real Decreto 259/2002, art. 10.1",
    url: RD259,
  },
  {
    titulo: "Edad",
    texto: "18 años. Desde los 16, con el consentimiento por escrito de padres o tutores y una copia de su DNI o pasaporte, que hay que poder mostrar.",
    fuente: "Real Decreto 259/2002, art. 4",
    url: RD259,
  },
  {
    titulo: "Normas locales",
    texto: "Cada Capitanía Marítima puede añadir normas propias (zonas prohibidas, canales, velocidades). Consulta las de la zona antes de salir.",
    fuente: "Capitanía Marítima de la zona",
    url: "",
  },
];
