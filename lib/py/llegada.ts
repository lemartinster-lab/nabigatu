/**
 * Llegar a un punto a una hora fijada, con corriente, viento y aguja.
 *
 *   Vef necesaria = D ÷ t
 *   Vector superficie = vector efectivo − vector corriente  →  Rs, Vb
 *   Rv = Rs − Ab
 *   Ra = Rv − Ct
 */
import { EntradaInvalida, formatoAbatimiento, formatoRumbo, normalizar360, redondearGrados } from "../nucleo/angulos";
import { aPolar, desdePolar, restar } from "../nucleo/vectores";
import { formatoDuracion, formatoNumero } from "../nucleo/unidades";
import { deVerdaderoAAguja, type Resultado } from "../per/correccion";

export interface DatosLlegada {
  ref: number; // rumbo efectivo al destino (de la carta)
  distancia: number; // millas
  horas: number; // tiempo disponible
  rc?: number;
  ic?: number;
  ab?: number;
  ct?: number;
}

export function llegarAHora(d: DatosLlegada): Resultado & {
  vef: number;
  rs: number;
  vb: number;
  rv: number;
  ra?: number;
} {
  if (d.distancia <= 0 || d.horas <= 0) throw new EntradaInvalida("La distancia y el tiempo deben ser mayores que cero");
  const vef = d.distancia / d.horas;
  const pasos = [
    `Velocidad efectiva necesaria = D ÷ t = ${formatoNumero(d.distancia, 2)} ÷ ${formatoNumero(d.horas, 3)} h (${formatoDuracion(d.horas)}) = ${formatoNumero(vef)} nudos`,
  ];

  let rs = d.ref;
  let vb = vef;
  if (d.rc !== undefined && d.ic !== undefined && d.ic > 0) {
    const s = aPolar(restar(desdePolar({ rumbo: d.ref, modulo: vef }), desdePolar({ rumbo: d.rc, modulo: d.ic })));
    rs = normalizar360(redondearGrados(s.rumbo));
    vb = s.modulo;
    pasos.push(
      "",
      "1) Corriente: superficie = efectivo − corriente",
      `Efectivo: ${formatoRumbo(d.ref)} a ${formatoNumero(vef)} nudos`,
      `Corriente: ${formatoRumbo(d.rc)} a ${formatoNumero(d.ic)} nudos`,
      `Rs = ${formatoRumbo(rs)}, Vb = ${formatoNumero(vb)} nudos`,
    );
  } else {
    pasos.push("", "1) Sin corriente: Rs = Ref y Vb = Vef", `Rs = ${formatoRumbo(rs)}, Vb = ${formatoNumero(vb)} nudos`);
  }

  let rv = rs;
  if (d.ab) {
    rv = normalizar360(redondearGrados(rs - d.ab));
    pasos.push("", "2) Viento", `Rv = Rs − Ab = ${formatoRumbo(rs)} − (${formatoAbatimiento(d.ab)}) = ${formatoRumbo(rv)}`);
  }

  let ra: number | undefined;
  if (d.ct !== undefined) {
    const a = deVerdaderoAAguja(rv, d.ct);
    ra = a.aguja;
    pasos.push("", "3) Corrección total", ...a.pasos);
  }

  return { vef, rs, vb, rv, ra, pasos };
}
