/**
 * Ejercicios de la carta del Estrecho para el modo examen.
 *
 * No se usan coordenadas de serie: los faros son los que el alumno ha medido en su propia
 * carta («Mis faros»). Así la opción correcta coincide con lo que él mide en su papel,
 * aunque su edición de la carta difiera alguna décima de minuto.
 *
 * Para que el barco quede siempre en el agua y vea los faros se usa un contorno de mar
 * muy simplificado del Estrecho, trazado a unas 2 millas de la costa (no procede de la carta).
 */
import { normalizar180, normalizar360 } from "../nucleo/angulos";
import { aPlano, desdePlano, type Posicion } from "../nucleo/coordenadas";
import { aPolar } from "../nucleo/vectores";
import { formatoEW, formatoRumbo } from "../nucleo/angulos";
import { formatoNumero } from "../nucleo/unidades";
import { correccionTotal } from "../per/correccion";
import { formatoPosicion } from "../py/estima";
import { demoraYDistancia, dosDemoras } from "../py/situacion";
import type { crearAzar, Opcion, Pregunta } from "./generador";

type Azar = ReturnType<typeof crearAzar>;

export interface FaroCarta extends Posicion {
  nombre: string;
}

/** Se lanza cuando el alumno no tiene bastantes faros del Estrecho en «Mis faros». */
export class FarosInsuficientes extends Error {
  constructor(public necesarios: number) {
    super(
      `Para este ejercicio necesitas ${necesarios === 1 ? "al menos un faro" : `al menos ${necesarios} faros`} del Estrecho en «Mis faros», medidos en tu carta, y que se vean desde el mar. ` +
        "Añádelos en el módulo «Mis faros».",
    );
  }
}

/** Zona de la carta del Estrecho: los faros fuera de ella no se usan. */
const ZONA = { latMin: 35.6, latMax: 36.45, lonMin: -6.5, lonMax: -5.0 };

/**
 * Contorno de agua «segura» del Estrecho, a unas 2 millas de la costa (lat, lon en grados).
 * Simplificado a propósito: solo sirve para colocar el barco en el mar.
 */
export const MAR_ESTRECHO: Posicion[] = [
  { lat: 36.15, lon: -6.25 },
  { lat: 36.12, lon: -6.08 },
  { lat: 36.12, lon: -5.97 },
  { lat: 36.04, lon: -5.85 },
  { lat: 36.0, lon: -5.7 },
  { lat: 35.97, lon: -5.61 },
  { lat: 36.02, lon: -5.45 },
  { lat: 36.04, lon: -5.38 },
  { lat: 36.06, lon: -5.3 },
  { lat: 35.97, lon: -5.25 },
  { lat: 35.93, lon: -5.33 },
  { lat: 35.95, lon: -5.47 },
  { lat: 35.88, lon: -5.62 },
  { lat: 35.86, lon: -5.74 },
  { lat: 35.84, lon: -5.85 },
  { lat: 35.84, lon: -6.0 },
  { lat: 35.75, lon: -6.1 },
  { lat: 35.75, lon: -6.25 },
];

/** ¿Está el punto dentro del contorno de mar? (algoritmo del rayo). */
export function enElMar(p: Posicion): boolean {
  let dentro = false;
  const pol = MAR_ESTRECHO;
  for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
    const a = pol[i];
    const b = pol[j];
    if (a.lat > p.lat !== b.lat > p.lat && p.lon < ((b.lon - a.lon) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lon) dentro = !dentro;
  }
  return dentro;
}

/** Faros del alumno que están en la zona de la carta del Estrecho. */
export function farosDelEstrecho(faros: readonly FaroCarta[]): FaroCarta[] {
  return faros.filter((f) => f.lat >= ZONA.latMin && f.lat <= ZONA.latMax && f.lon >= ZONA.lonMin && f.lon <= ZONA.lonMax);
}

/** Demora verdadera y distancia (millas) desde el barco al faro. */
function demoraDesde(barco: Posicion, faro: Posicion) {
  const { rumbo, modulo } = aPolar(aPlano(faro, barco));
  return { dv: normalizar360(rumbo), d: modulo };
}

/**
 * Un faro se considera visible si está a 2,5–14 millas y la visual cruza agua
 * (se comprueba el tramo hasta 3 millas antes del faro, que puede estar tierra adentro).
 */
function visible(barco: Posicion, faro: Posicion): { dv: number; d: number } | null {
  const r = demoraDesde(barco, faro);
  if (r.d < 2.5 || r.d > 14) return null;
  const v = aPlano(faro, barco);
  const tramo = Math.max(0, r.d - 3);
  for (let k = 1; k <= 10; k++) {
    const f = (tramo / r.d) * (k / 10);
    if (!enElMar(desdePlano({ x: v.x * f, y: v.y * f }, barco))) return null;
  }
  return r;
}

function barcoAlAzar(az: Azar): Posicion {
  for (let i = 0; i < 500; i++) {
    const p = { lat: az.real(35.75, 36.15), lon: az.real(-6.25, -5.25) };
    if (enElMar(p)) return p;
  }
  return { lat: 35.95, lon: -5.75 };
}

/** dm y desvío del enunciado (Ct de 1° a 10° para que los errores se vean en la carta). */
function datosAguja(az: Azar) {
  for (;;) {
    const dm = -az.elegir([0.5, 1, 1.5, 2, 2.5, 3]);
    const desvio = az.signo() * az.entero(1, 8);
    const ct = dm + desvio;
    if (Math.abs(ct) >= 1.5) return { dm, desvio, ct };
  }
}

/** Distancia en minutos de arco entre dos situaciones (≈ millas). */
function separacion(a: Posicion, b: Posicion): number {
  const { modulo } = aPolar(aPlano(a, b));
  return modulo;
}

/**
 * Cuatro opciones de situación separadas al menos 1 milla entre sí, para que se
 * distingan midiendo en la carta. Primero los errores típicos; si alguno cae demasiado
 * cerca o no tiene solución, se rellena con situaciones próximas que no corresponden a nada.
 */
function opcionesSituacion(az: Azar, correcta: Posicion, errores: { pos: () => Posicion; error: string }[]): Opcion[] {
  const elegidas: { pos: Posicion; opcion: Opcion }[] = [{ pos: correcta, opcion: { texto: formatoPosicion(correcta), correcta: true } }];
  const cabe = (p: Posicion) => elegidas.every((e) => separacion(e.pos, p) >= 1);
  for (const e of errores) {
    if (elegidas.length === 4) break;
    try {
      const p = e.pos();
      if (cabe(p)) elegidas.push({ pos: p, opcion: { texto: formatoPosicion(p), correcta: false, error: e.error } });
    } catch {
      /* ese error no da situación: se descarta */
    }
  }
  for (let i = 0; elegidas.length < 4 && i < 100; i++) {
    const p = { lat: correcta.lat + (az.signo() * az.real(1.2, 3.5)) / 60, lon: correcta.lon + (az.signo() * az.real(1.2, 3.5)) / 60 };
    if (cabe(p)) {
      elegidas.push({ pos: p, opcion: { texto: formatoPosicion(p), correcta: false, error: "Situación que no corresponde a ningún cálculo correcto." } });
    }
  }
  return az.mezclar(elegidas.map((e) => e.opcion));
}

const lineaAguja = (dm: number, desvio: number) =>
  `Declinación magnética: ${formatoEW(dm)}. Desvío de la aguja al rumbo que llevamos: ${formatoEW(desvio)}.`;

const AVISO_FAROS = "Usa las situaciones de los faros que has medido en tu carta («Mis faros»).";

/** Situación por dos demoras de aguja simultáneas. */
export function preguntaDosDemoras(az: Azar, todos: readonly FaroCarta[]): Pregunta {
  const faros = farosDelEstrecho(todos);
  if (faros.length < 2) throw new FarosInsuficientes(2);

  for (let intento = 0; intento < 300; intento++) {
    const barco = barcoAlAzar(az);
    const vistos = faros.map((f) => ({ f, r: visible(barco, f) })).filter((x) => x.r !== null) as { f: FaroCarta; r: { dv: number; d: number } }[];
    const pares: [typeof vistos[number], typeof vistos[number]][] = [];
    for (let i = 0; i < vistos.length; i++)
      for (let j = i + 1; j < vistos.length; j++) {
        const ang = Math.abs(normalizar180(vistos[i].r.dv - vistos[j].r.dv));
        if (ang >= 40 && ang <= 140) pares.push([vistos[i], vistos[j]]);
      }
    if (pares.length === 0) continue;

    const [a, b] = az.mezclar(az.elegir(pares));
    const { dm, desvio, ct } = datosAguja(az);
    const da1 = normalizar360(Math.round(a.r.dv - ct));
    const da2 = normalizar360(Math.round(b.r.dv - ct));
    const conDv = (c: number) => dosDemoras(a.f, da1 + c, b.f, da2 + c);
    let correcta;
    try {
      correcta = conDv(ct);
    } catch {
      continue;
    }
    const corr = correccionTotal(dm, desvio);

    return {
      tema: "carta-dos-demoras",
      enunciado: [
        "Navegando por el Estrecho, se toman simultáneamente las demoras de aguja de dos faros:",
        `  ${a.f.nombre}: Da = ${formatoRumbo(da1)}`,
        `  ${b.f.nombre}: Da = ${formatoRumbo(da2)}`,
        lineaAguja(dm, desvio),
        "Calcular la situación.",
        AVISO_FAROS,
      ],
      opciones: opcionesSituacion(az, correcta.posicion, [
        { pos: () => conDv(-ct).posicion, error: "Se ha restado la Ct: para pasar de aguja a verdadera, Dv = Da + Ct." },
        { pos: () => conDv(dm).posicion, error: "Se ha olvidado el desvío: Ct = dm + Δ." },
        { pos: () => conDv(dm - desvio).posicion, error: "Error de signo en el desvío al calcular la Ct." },
      ]),
      solucion: [
        ...corr.pasos,
        "",
        `${a.f.nombre}: Dv = Da + Ct = ${formatoRumbo(da1)} ${ct >= 0 ? "+" : "−"} ${formatoNumero(Math.abs(ct), 1)}° = ${formatoRumbo(da1 + ct)}`,
        `${b.f.nombre}: Dv = Da + Ct = ${formatoRumbo(da2)} ${ct >= 0 ? "+" : "−"} ${formatoNumero(Math.abs(ct), 1)}° = ${formatoRumbo(da2 + ct)}`,
        "",
        ...correcta.pasos,
      ],
    };
  }
  throw new FarosInsuficientes(2);
}

/** Situación por demora de aguja y distancia (radar) a un faro. */
export function preguntaDemoraDistancia(az: Azar, todos: readonly FaroCarta[]): Pregunta {
  const faros = farosDelEstrecho(todos);
  if (faros.length < 1) throw new FarosInsuficientes(1);

  for (let intento = 0; intento < 300; intento++) {
    const barco = barcoAlAzar(az);
    const vistos = faros.map((f) => ({ f, r: visible(barco, f) })).filter((x) => x.r !== null) as { f: FaroCarta; r: { dv: number; d: number } }[];
    if (vistos.length === 0) continue;

    const { f, r } = az.elegir(vistos);
    const { dm, desvio, ct } = datosAguja(az);
    const da = normalizar360(Math.round(r.dv - ct));
    const d = Math.round(r.d * 10) / 10;
    const conDv = (dv: number) => demoraYDistancia(f, dv, d);
    const correcta = conDv(da + ct);
    const corr = correccionTotal(dm, desvio);

    return {
      tema: "carta-demora-distancia",
      enunciado: [
        `Navegando por el Estrecho, se toma demora de aguja del faro de ${f.nombre}, Da = ${formatoRumbo(da)}, y con el radar se mide una distancia de ${formatoNumero(d, 1)} millas.`,
        lineaAguja(dm, desvio),
        "Calcular la situación.",
        AVISO_FAROS,
      ],
      opciones: opcionesSituacion(az, correcta.posicion, [
        { pos: () => conDv(da + ct + 180).posicion, error: "Se ha llevado la distancia en la dirección de la demora: el barco está en la opuesta, desde el faro." },
        { pos: () => conDv(da - ct).posicion, error: "Se ha restado la Ct: para pasar de aguja a verdadera, Dv = Da + Ct." },
        { pos: () => conDv(da + dm).posicion, error: "Se ha olvidado el desvío: Ct = dm + Δ." },
      ]),
      solucion: [
        ...corr.pasos,
        "",
        `Dv = Da + Ct = ${formatoRumbo(da)} ${ct >= 0 ? "+" : "−"} ${formatoNumero(Math.abs(ct), 1)}° = ${formatoRumbo(da + ct)}`,
        "",
        ...correcta.pasos,
      ],
    };
  }
  throw new FarosInsuficientes(1);
}
