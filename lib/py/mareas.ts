/**
 * Mareas por el método del coseno (el que reproduce las respuestas del examen).
 *
 * Entre dos extremos consecutivos (pleamar y bajamar) de alturas h1 y h2,
 * separados una duración D, la altura a un tiempo t después del primero es:
 *
 *   h = h1 + (h2 − h1) · (1 − cos(180° · t / D)) / 2
 *
 * Sonda = sonda de la carta + altura de la marea.
 * Las horas del Anuario de Mareas están en UT: hora oficial = UT + adelanto.
 */
import { EntradaInvalida } from "../nucleo/angulos";
import { formatoDuracion, formatoNumero } from "../nucleo/unidades";
import type { Resultado } from "../per/correccion";

export interface Extremo {
  /** Minutos desde la medianoche del día del anuario, en UT. */
  minutos: number;
  altura: number;
}

/** Formatea minutos (pueden pasar de 1440 o ser negativos) como hora del día. */
export function formatoHoraMin(min: number): string {
  const r = Math.round(min);
  const dia = Math.floor(r / 1440);
  const resto = ((r % 1440) + 1440) % 1440;
  const hh = String(Math.floor(resto / 60)).padStart(2, "0");
  const mm = String(resto % 60).padStart(2, "0");
  const sufijo = dia === 0 ? "" : dia === 1 ? " (día siguiente)" : dia === -1 ? " (día anterior)" : ` (${dia > 0 ? "+" : ""}${dia} días)`;
  return `${hh}:${mm}${sufijo}`;
}

/**
 * Ordena la tabla del anuario: si una hora es menor que la anterior,
 * se entiende que es del día siguiente (como la última pleamar pasada la medianoche).
 */
export function prepararTabla(extremos: Extremo[]): Extremo[] {
  if (extremos.length < 2) throw new EntradaInvalida("Introduce al menos dos pleamares o bajamares");
  const out: Extremo[] = [];
  let desfase = 0;
  extremos.forEach((e, i) => {
    if (i > 0 && e.minutos + desfase <= out[i - 1].minutos) desfase += 1440;
    out.push({ minutos: e.minutos + desfase, altura: e.altura });
  });
  for (let i = 1; i < out.length; i++) {
    if (Math.abs(out[i].altura - out[i - 1].altura) < 1e-9) {
      throw new EntradaInvalida("Dos extremos seguidos no pueden tener la misma altura");
    }
    if (out[i].minutos - out[i - 1].minutos > 9 * 60) {
      throw new EntradaInvalida("Entre una pleamar y una bajamar suele haber unas 6 horas. Revisa las horas de la tabla.");
    }
  }
  return out;
}

const tipo = (e: Extremo, otro: Extremo) => (e.altura > otro.altura ? "Pleamar" : "Bajamar");

function describir(e1: Extremo, e2: Extremo, adelanto: number): string {
  return `${tipo(e1, e2)} ${formatoHoraMin(e1.minutos)} UT (${formatoNumero(e1.altura)} m) → ${tipo(e2, e1)} ${formatoHoraMin(e2.minutos)} UT (${formatoNumero(e2.altura)} m)${
    adelanto ? `; en hora oficial ${formatoHoraMin(e1.minutos + adelanto * 60)} → ${formatoHoraMin(e2.minutos + adelanto * 60)}` : ""
  }`;
}

/** Altura de marea y sonda a una hora oficial dada. */
export function sondaAHora(
  extremosEntrada: Extremo[],
  horaOficialMin: number,
  adelantoHoras: number,
  sondaCarta: number,
): Resultado & { altura: number; sonda: number } {
  const tabla = prepararTabla(extremosEntrada);
  const utBase = horaOficialMin - adelantoHoras * 60;

  // La hora puede caer el mismo día o, si la tabla pasa de medianoche, el siguiente.
  for (const ut of [utBase, utBase + 1440]) {
    for (let i = 0; i < tabla.length - 1; i++) {
      const e1 = tabla[i];
      const e2 = tabla[i + 1];
      if (ut < e1.minutos || ut > e2.minutos) continue;

      const D = e2.minutos - e1.minutos;
      const t = ut - e1.minutos;
      const amplitud = e2.altura - e1.altura;
      const factor = (1 - Math.cos((Math.PI * t) / D)) / 2;
      const altura = e1.altura + amplitud * factor;
      const sonda = sondaCarta + altura;

      return {
        altura,
        sonda,
        pasos: [
          `Hora UT = hora oficial − adelanto = ${formatoHoraMin(horaOficialMin)} − ${formatoNumero(adelantoHoras)} h = ${formatoHoraMin(ut)}`,
          `Intervalo: ${describir(e1, e2, adelantoHoras)}`,
          `Duración D = ${formatoDuracion(D / 60)} (${D} min); amplitud = ${formatoNumero(Math.abs(amplitud))} m`,
          `Tiempo desde el primer extremo t = ${formatoDuracion(t / 60)} (${formatoNumero(t, 0)} min)`,
          `Factor = (1 − cos(180° · t / D)) ÷ 2 = (1 − cos ${formatoNumero((180 * t) / D, 2)}°) ÷ 2 = ${formatoNumero(factor, 4)}`,
          `Altura = ${formatoNumero(e1.altura)} ${amplitud >= 0 ? "+" : "−"} ${formatoNumero(Math.abs(amplitud))} · ${formatoNumero(factor, 4)} = ${formatoNumero(altura)} m`,
          `Sonda = sonda de la carta + altura = ${formatoNumero(sondaCarta)} + ${formatoNumero(altura)} = ${formatoNumero(sonda)} m`,
        ],
      };
    }
  }
  throw new EntradaInvalida("Esa hora queda fuera de la tabla de mareas que has introducido");
}

export interface SolucionHora {
  /** Índice del intervalo en la tabla (0 = entre el 1.º y el 2.º extremo). */
  intervalo: number;
  descripcion: string;
  sube: boolean;
  horaUT: number;
  horaOficial: number;
}

/**
 * Hora (o horas) en que la sonda alcanza un valor. Se devuelven todas las soluciones
 * de la tabla; el enunciado del examen indica en qué intervalo hay que buscarla.
 */
export function horaParaSonda(
  extremosEntrada: Extremo[],
  sondaBuscada: number,
  adelantoHoras: number,
  sondaCarta: number,
): Resultado & { soluciones: SolucionHora[] } {
  const tabla = prepararTabla(extremosEntrada);
  const alturaBuscada = sondaBuscada - sondaCarta;
  const pasos = [
    `Altura de marea necesaria = sonda buscada − sonda de la carta = ${formatoNumero(sondaBuscada)} − ${formatoNumero(sondaCarta)} = ${formatoNumero(alturaBuscada)} m`,
  ];
  const soluciones: SolucionHora[] = [];

  for (let i = 0; i < tabla.length - 1; i++) {
    const e1 = tabla[i];
    const e2 = tabla[i + 1];
    const amplitud = e2.altura - e1.altura;
    const f = (alturaBuscada - e1.altura) / amplitud;
    if (f < 0 || f > 1) continue;

    const D = e2.minutos - e1.minutos;
    const angulo = Math.acos(1 - 2 * f); // radianes
    const t = (angulo / Math.PI) * D;
    const horaUT = e1.minutos + t;
    const horaOficial = horaUT + adelantoHoras * 60;
    const sube = amplitud > 0;
    const descripcion = `${tipo(e1, e2)} ${formatoHoraMin(e1.minutos)} UT → ${tipo(e2, e1)} ${formatoHoraMin(e2.minutos)} UT (marea ${sube ? "subiendo" : "bajando"})`;

    soluciones.push({ intervalo: i, descripcion, sube, horaUT, horaOficial });
    pasos.push(
      "",
      `${soluciones.length}) ${descripcion}`,
      `Factor = (altura − h1) ÷ (h2 − h1) = (${formatoNumero(alturaBuscada)} − ${formatoNumero(e1.altura)}) ÷ (${formatoNumero(e2.altura)} − ${formatoNumero(e1.altura)}) = ${formatoNumero(f, 4)}`,
      `cos(180° · t / D) = 1 − 2 · factor = ${formatoNumero(1 - 2 * f, 4)} → 180° · t / D = ${formatoNumero(angulo / (Math.PI / 180), 2)}°`,
      `t = ${formatoNumero(angulo / Math.PI, 4)} · ${D} min = ${formatoNumero(t, 1)} min = ${formatoDuracion(t / 60)}`,
      `Hora UT = ${formatoHoraMin(e1.minutos)} + ${formatoDuracion(t / 60)} = ${formatoHoraMin(horaUT)}`,
      `Hora oficial = UT + ${formatoNumero(adelantoHoras)} h = ${formatoHoraMin(horaOficial)}`,
    );
  }

  if (soluciones.length === 0) {
    throw new EntradaInvalida(
      "Con esa tabla la marea nunca alcanza esa altura: la sonda buscada queda por encima de la pleamar o por debajo de la bajamar",
    );
  }
  return { soluciones, pasos };
}
