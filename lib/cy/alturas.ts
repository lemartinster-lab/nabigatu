/**
 * Corrección de alturas: de la altura instrumental (Ai) a la verdadera (Av).
 *
 *   ao = Ai + ci                 (corrección de índice, con su signo)
 *   aa = ao − depresión          depresión = 1,76′ · √eo (m)
 *   av = aa − refracción + paralaje ± semidiámetro
 *     refracción (Bennett) = cot(aa + 7,31 ÷ (aa + 4,4)) minutos
 *     paralaje del Sol = 0,15′ · cos aa
 *     semidiámetro: + limbo inferior, − limbo superior
 *
 * Comprobado con la meridiana del examen de Capitán de Yate de Euskadi (noviembre de 2024).
 */
import { EntradaInvalida, aGradosMinutos } from "../nucleo/angulos";
import { formatoNumero } from "../nucleo/unidades";
import type { Resultado } from "../per/correccion";

export type Astro = "sol-li" | "sol-ls" | "estrella";

export const NOMBRE_ASTRO: Record<Astro, string> = {
  "sol-li": "Sol, limbo inferior",
  "sol-ls": "Sol, limbo superior",
  estrella: "Estrella",
};

export function formatoAltura(g: number): string {
  const { g: gg, m } = aGradosMinutos(g);
  return `${g < 0 ? "−" : ""}${gg}° ${m.toFixed(1).replace(".", ",")}′`;
}

const min = (x: number) => `${formatoNumero(x, 1)}′`;

export interface DatosAltura {
  ai: number; // grados
  ci: number; // minutos, con signo
  eo: number; // metros
  astro: Astro;
  sd?: number; // semidiámetro del Sol en minutos (Almanaque); por defecto 16,0′
}

export function corregirAltura(d: DatosAltura): Resultado & {
  av: number;
  correccionTotal: number; // minutos, de Ai a Av
  depresion: number;
  refraccion: number;
} {
  if (d.ai <= 0 || d.ai >= 90) throw new EntradaInvalida("La altura instrumental debe estar entre 0° y 90°");
  if (d.eo < 0 || d.eo > 60) throw new EntradaInvalida("La elevación del observador debe estar entre 0 y 60 m");
  const sd = d.sd ?? 16.0;

  const ao = d.ai + d.ci / 60;
  const depresion = 1.76 * Math.sqrt(d.eo);
  const aa = ao - depresion / 60;
  const refraccion = 1 / Math.tan(((aa + 7.31 / (aa + 4.4)) * Math.PI) / 180);
  const esSol = d.astro !== "estrella";
  const paralaje = esSol ? 0.15 * Math.cos((aa * Math.PI) / 180) : 0;
  const semidiametro = d.astro === "sol-li" ? sd : d.astro === "sol-ls" ? -sd : 0;
  const av = aa + (-refraccion + paralaje + semidiametro) / 60;
  const correccionTotal = (av - d.ai) * 60;

  const pasos = [
    `ao = Ai + ci = ${formatoAltura(d.ai)} ${d.ci >= 0 ? "+" : "−"} ${min(Math.abs(d.ci))} = ${formatoAltura(ao)}`,
    `Depresión = 1,76′ · √${formatoNumero(d.eo, 1)} = ${min(depresion)}`,
    `aa = ao − depresión = ${formatoAltura(aa)}`,
    `Refracción = ${min(refraccion)}`,
  ];
  if (esSol) {
    pasos.push(
      `Paralaje = 0,15′ · cos aa = ${min(paralaje)}`,
      `Semidiámetro = ${d.astro === "sol-li" ? "+" : "−"}${min(sd)} (${d.astro === "sol-li" ? "limbo inferior" : "limbo superior"})`,
    );
  }
  pasos.push(
    `av = aa − refracción${esSol ? " + paralaje ± semidiámetro" : ""} = ${formatoAltura(av)}`,
    `Corrección total (de Ai a Av) = ${correccionTotal >= 0 ? "+" : "−"}${min(Math.abs(correccionTotal))}`,
  );
  return { av, correccionTotal, depresion, refraccion, pasos };
}
