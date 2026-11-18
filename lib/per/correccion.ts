/**
 * Corrección total, rumbos y demoras (PER).
 *
 *   Ct = dm + Δ
 *   Rv = Ra + Ct        Ra = Rv − Ct
 *   Dv = Da + Ct        Da = Dv − Ct
 *   Ct = Dv − Da        (Ct a partir de una demora conocida, p. ej. una enfilación)
 *   Δ  = Ct − dm
 *
 * Signos: E = +, W = −.
 */
import { formatoEW, formatoRumbo, formatoSigno, normalizar180, normalizar360, redondearGrados } from "../nucleo/angulos";

export interface Resultado {
  pasos: string[];
}

export function correccionTotal(dm: number, desvio: number): Resultado & { ct: number } {
  const ct = redondearGrados(dm + desvio);
  return {
    ct,
    pasos: [
      "Ct = dm + Δ",
      `Ct = (${formatoSigno(dm)}) + (${formatoSigno(desvio)})`,
      `Ct = ${formatoSigno(ct)} → ${formatoEW(ct)}`,
    ],
  };
}

export type Tipo = "rumbo" | "demora";

const nombres = (tipo: Tipo) =>
  tipo === "rumbo" ? { v: "Rv", a: "Ra", nombre: "rumbo" } : { v: "Dv", a: "Da", nombre: "demora" };

/** De aguja a verdadero: Rv = Ra + Ct */
export function deAgujaAVerdadero(aguja: number, ct: number, tipo: Tipo = "rumbo"): Resultado & { verdadero: number } {
  const n = nombres(tipo);
  const bruto = aguja + ct;
  const verdadero = normalizar360(redondearGrados(bruto));
  const pasos = [
    `${n.v} = ${n.a} + Ct`,
    `${n.v} = ${formatoRumbo(aguja)} + (${formatoSigno(ct)})`,
  ];
  if (bruto < 0 || bruto >= 360) pasos.push(`Se suma o resta 360° para quedar entre 000° y 360°`);
  pasos.push(`${n.v} = ${formatoRumbo(verdadero)}`);
  return { verdadero, pasos };
}

/** De verdadero a aguja: Ra = Rv − Ct */
export function deVerdaderoAAguja(verdadero: number, ct: number, tipo: Tipo = "rumbo"): Resultado & { aguja: number } {
  const n = nombres(tipo);
  const bruto = verdadero - ct;
  const aguja = normalizar360(redondearGrados(bruto));
  const pasos = [
    `${n.a} = ${n.v} − Ct`,
    `${n.a} = ${formatoRumbo(verdadero)} − (${formatoSigno(ct)})`,
  ];
  if (bruto < 0 || bruto >= 360) pasos.push(`Se suma o resta 360° para quedar entre 000° y 360°`);
  pasos.push(`${n.a} = ${formatoRumbo(aguja)}`);
  return { aguja, pasos };
}

/**
 * Ct a partir de una demora verdadera conocida (de la carta, p. ej. una enfilación)
 * y la demora de aguja observada. Si se da la dm, calcula también el desvío.
 */
export function ctDesdeDemora(
  dv: number,
  da: number,
  dm?: number,
): Resultado & { ct: number; desvio?: number } {
  const ct = redondearGrados(normalizar180(dv - da));
  const pasos = [
    "Ct = Dv − Da",
    `Ct = ${formatoRumbo(dv)} − ${formatoRumbo(da)}`,
    `Ct = ${formatoSigno(ct)} → ${formatoEW(ct)}`,
  ];
  if (Math.abs(ct) > 30) {
    pasos.push("Atención: una Ct de más de 30° es muy poco habitual. Revisa los datos.");
  }
  if (dm === undefined) return { ct, pasos };

  const desvio = redondearGrados(ct - dm);
  pasos.push(
    "Δ = Ct − dm",
    `Δ = (${formatoSigno(ct)}) − (${formatoSigno(dm)})`,
    `Δ = ${formatoSigno(desvio)} → ${formatoEW(desvio)}`,
  );
  return { ct, desvio, pasos };
}
