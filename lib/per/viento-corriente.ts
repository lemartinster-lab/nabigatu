/**
 * Viento (abatimiento) y corriente (PER).
 *
 *   Rs = Rv + Ab           (Ab > 0 con viento por babor, < 0 por estribor)
 *   Efectivo = vector superficie (Rs, Vb) + vector corriente (Rc, Ic)
 *
 * Rc es el rumbo HACIA el que va la corriente; Ic, su intensidad en nudos.
 */
import {
  EntradaInvalida,
  formatoAbatimiento,
  formatoRumbo,
  formatoSigno,
  normalizar180,
  normalizar360,
  redondearGrados,
} from "../nucleo/angulos";
import { aPolar, desdePolar, restar, sumar } from "../nucleo/vectores";
import { formatoNumero } from "../nucleo/unidades";
import { deVerdaderoAAguja, type Resultado } from "./correccion";

const RAD = Math.PI / 180;

/** Del rumbo verdadero al rumbo de superficie por efecto del viento. */
export function rumboSuperficie(rv: number, ab: number): Resultado & { rs: number } {
  const rs = normalizar360(redondearGrados(rv + ab));
  return {
    rs,
    pasos: ["Rs = Rv + Ab", `Rs = ${formatoRumbo(rv)} + (${formatoAbatimiento(ab)})`, `Rs = ${formatoRumbo(rs)}`],
  };
}

/** El barco navega a Rs y Vb; ¿por dónde y a qué velocidad avanza realmente con la corriente? */
export function efectoCorriente(
  rs: number,
  vb: number,
  rc: number,
  ic: number,
): Resultado & { ref: number; vef: number } {
  if (vb <= 0) throw new EntradaInvalida("La velocidad del barco debe ser mayor que cero");
  if (ic < 0) throw new EntradaInvalida("La intensidad de la corriente no puede ser negativa");

  const e = aPolar(sumar(desdePolar({ rumbo: rs, modulo: vb }), desdePolar({ rumbo: rc, modulo: ic })));
  const ref = normalizar360(redondearGrados(e.rumbo));
  return {
    ref,
    vef: e.modulo,
    pasos: [
      "Se suman los vectores del barco y de la corriente (triángulo de velocidades)",
      `Barco: Rs ${formatoRumbo(rs)} a ${formatoNumero(vb)} nudos`,
      `Corriente: Rc ${formatoRumbo(rc)} a ${formatoNumero(ic)} nudos`,
      `Rumbo efectivo Ref = ${formatoRumbo(ref)}`,
      `Velocidad efectiva Vef = ${formatoNumero(e.modulo)} nudos`,
    ],
  };
}

/**
 * Quiero avanzar por un rumbo efectivo Ref con corriente conocida:
 * ¿qué rumbo de superficie Rs debo hacer y a qué velocidad efectiva avanzaré?
 *
 *   Vb · sen(Rs − Ref) = −Ic · sen(Rc − Ref)
 */
export function rumboContraCorriente(
  ref: number,
  vb: number,
  rc: number,
  ic: number,
): Resultado & { rs: number; vef: number; correccion: number } {
  if (vb <= 0) throw new EntradaInvalida("La velocidad del barco debe ser mayor que cero");
  if (ic < 0) throw new EntradaInvalida("La intensidad de la corriente no puede ser negativa");

  const angCorriente = (rc - ref) * RAD;
  const seno = (-ic * Math.sin(angCorriente)) / vb;
  if (Math.abs(seno) > 1) {
    throw new EntradaInvalida("La corriente es demasiado fuerte para mantener ese rumbo con esa velocidad");
  }
  const correccion = Math.asin(seno) / RAD;
  const rs = normalizar360(redondearGrados(ref + correccion));
  const vef = vb * Math.cos(correccion * RAD) + ic * Math.cos(angCorriente);
  if (vef <= 0.01) {
    throw new EntradaInvalida("Con esa corriente el barco no avanza por el rumbo deseado");
  }

  return {
    rs,
    vef,
    correccion,
    pasos: [
      "Hay que compensar la componente de la corriente perpendicular al rumbo deseado",
      "sen(Rs − Ref) = −Ic · sen(Rc − Ref) ÷ Vb",
      `sen(Rs − Ref) = −${formatoNumero(ic)} · sen(${formatoSigno(normalizar180(rc - ref))}) ÷ ${formatoNumero(vb)} = ${formatoNumero(seno, 4)}`,
      `Corrección por corriente = ${formatoSigno(correccion)}`,
      `Rs = ${formatoRumbo(ref)} + (${formatoSigno(correccion)}) = ${formatoRumbo(rs)}`,
      `Velocidad efectiva Vef = ${formatoNumero(vef)} nudos`,
    ],
  };
}

/**
 * Conociendo lo que se navegó (Rs, Vb) y lo que realmente se avanzó (Ref, Vef),
 * se deduce la corriente: corriente = efectivo − superficie.
 */
export function corrienteDesconocida(
  rs: number,
  vb: number,
  ref: number,
  vef: number,
): Resultado & { rc: number; ic: number } {
  const c = aPolar(restar(desdePolar({ rumbo: ref, modulo: vef }), desdePolar({ rumbo: rs, modulo: vb })));
  const rc = normalizar360(redondearGrados(c.rumbo));
  return {
    rc,
    ic: c.modulo,
    pasos: [
      "Corriente = movimiento efectivo − movimiento de superficie",
      `Efectivo: Ref ${formatoRumbo(ref)} a ${formatoNumero(vef)} nudos`,
      `Superficie: Rs ${formatoRumbo(rs)} a ${formatoNumero(vb)} nudos`,
      c.modulo < 0.005
        ? "No hay corriente apreciable"
        : `Corriente: Rc ${formatoRumbo(rc)}, Ic ${formatoNumero(c.modulo)} nudos`,
    ],
  };
}

export interface DatosRumboADar {
  ref: number; // rumbo efectivo deseado (el que se traza en la carta)
  vb: number;
  rc?: number;
  ic?: number;
  ab?: number;
  ct?: number;
}

/**
 * Problema completo típico del PER: quiero llegar a un punto (Ref trazado en la carta).
 * ¿Qué rumbo de aguja doy al timonel?
 *
 *   Ref → (corriente) → Rs → (viento) Rv = Rs − Ab → (aguja) Ra = Rv − Ct
 */
export function rumboADar(d: DatosRumboADar): Resultado & {
  rs: number;
  rv: number;
  ra?: number;
  vef: number;
} {
  const pasos: string[] = [`Rumbo efectivo deseado (trazado en la carta): ${formatoRumbo(d.ref)}`];
  let rs = d.ref;
  let vef = d.vb;

  const hayCorriente = d.rc !== undefined && d.ic !== undefined && d.ic > 0;
  if (hayCorriente) {
    pasos.push("", "1) Corriente");
    const c = rumboContraCorriente(d.ref, d.vb, d.rc!, d.ic!);
    rs = c.rs;
    vef = c.vef;
    pasos.push(...c.pasos);
  } else {
    pasos.push("", "1) Sin corriente: Rs = Ref", `Rs = ${formatoRumbo(rs)}`);
  }

  let rv = rs;
  if (d.ab !== undefined && d.ab !== 0) {
    rv = normalizar360(redondearGrados(rs - d.ab));
    pasos.push(
      "",
      "2) Viento (abatimiento)",
      "Rv = Rs − Ab",
      `Rv = ${formatoRumbo(rs)} − (${formatoAbatimiento(d.ab)})`,
      `Rv = ${formatoRumbo(rv)}`,
    );
  } else {
    pasos.push("", "2) Sin abatimiento: Rv = Rs", `Rv = ${formatoRumbo(rv)}`);
  }

  let ra: number | undefined;
  if (d.ct !== undefined) {
    const a = deVerdaderoAAguja(rv, d.ct);
    ra = a.aguja;
    pasos.push("", "3) Corrección total", ...a.pasos);
  }

  return { rs, rv, ra, vef, pasos };
}
