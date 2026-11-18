/**
 * Generador de ejercicios tipo examen con cuatro opciones.
 *
 * Las opciones incorrectas no son aleatorias: corresponden a los errores típicos
 * (signo de la Ct, olvidar el adelanto, regla de los doceavos, no usar cos lm…),
 * y cada una lleva la explicación del error para aprender de él.
 */
import { formatoEW, formatoRumbo, normalizar360 } from "../nucleo/angulos";
import { formatoLatitud, formatoLongitud } from "../nucleo/angulos";
import { formatoDuracion, formatoNumero } from "../nucleo/unidades";
import type { Nivel } from "../modulos";
import { correccionTotal, deVerdaderoAAguja } from "../per/correccion";
import { actualizarDeclinacion } from "../per/declinacion";
import { resolverDVT } from "../per/dvt";
import { corrienteDesconocida, efectoCorriente, rumboADar } from "../per/viento-corriente";
import { estima, rumboYDistancia } from "../py/estima";
import { formatoHoraMin, horaParaSonda, sondaAHora, type Extremo } from "../py/mareas";
import { llegarAHora } from "../py/llegada";
import { ortodromica } from "../cy/ortodromica";
import { convertirHora, formatoInstante } from "../cy/tiempo";
import { corregirAltura, formatoAltura } from "../cy/alturas";
import { formatoDeclinacion, formatoHorario } from "../cy/astros";
import { alturaYAzimut, latitudMeridiana, rectaDeAltura } from "../cy/astronomica";
import { preguntaDemoraDistancia, preguntaDosDemoras, preguntaEnfilacion, type FaroCarta } from "./carta";

export { FarosInsuficientes, type FaroCarta } from "./carta";

export type Tema =
  | "rumbos"
  | "declinacion"
  | "dvt"
  | "corriente"
  | "corriente-desconocida"
  | "rumbo-a-dar"
  | "mareas-sonda"
  | "mareas-hora"
  | "loxodromica"
  | "estima"
  | "llegada"
  | "orto-distancia"
  | "orto-rumbo"
  | "horas"
  | "meridiana"
  | "altura"
  | "recta"
  | TemaCarta;

/** Ejercicios sobre la carta del Estrecho: necesitan los faros de «Mis faros». */
export type TemaCarta = "carta-dos-demoras" | "carta-demora-distancia" | "carta-enfilacion";

export function esTemaCarta(t: Tema): t is TemaCarta {
  return t.startsWith("carta-");
}

export const TEMAS: { id: Tema; nombre: string; nivel: Nivel }[] = [
  { id: "rumbos", nombre: "Corrección total y rumbos", nivel: "PER" },
  { id: "declinacion", nombre: "Declinación magnética", nivel: "PER" },
  { id: "dvt", nombre: "Distancia, velocidad y tiempo", nivel: "PER" },
  { id: "corriente", nombre: "Efecto de la corriente", nivel: "PER" },
  { id: "corriente-desconocida", nombre: "Corriente desconocida", nivel: "PER" },
  { id: "rumbo-a-dar", nombre: "Rumbo a dar con viento y corriente", nivel: "PER" },
  { id: "carta-dos-demoras", nombre: "Carta: situación por dos demoras", nivel: "PER" },
  { id: "carta-demora-distancia", nombre: "Carta: situación por demora y distancia", nivel: "PER" },
  { id: "carta-enfilacion", nombre: "Carta: Ct y desvío por enfilación", nivel: "PER" },
  { id: "mareas-sonda", nombre: "Mareas: sonda a una hora", nivel: "PY" },
  { id: "mareas-hora", nombre: "Mareas: hora para una sonda", nivel: "PY" },
  { id: "loxodromica", nombre: "Loxodrómica: rumbo directo", nivel: "PY" },
  { id: "estima", nombre: "Situación por estima", nivel: "PY" },
  { id: "llegada", nombre: "Llegar a una hora con corriente", nivel: "PY" },
  { id: "orto-distancia", nombre: "Ortodrómica: distancia", nivel: "CY" },
  { id: "orto-rumbo", nombre: "Ortodrómica: rumbo inicial", nivel: "CY" },
  { id: "horas", nombre: "Hora civil del lugar", nivel: "CY" },
  { id: "altura", nombre: "Corrección de alturas", nivel: "CY" },
  { id: "meridiana", nombre: "Latitud por meridiana del Sol", nivel: "CY" },
  { id: "recta", nombre: "Recta de altura: altura estimada y azimut", nivel: "CY" },
];

const ORDEN: Nivel[] = ["LN", "PNB", "PER", "PY", "CY"];
export function temasDeNivel(nivel: Nivel) {
  return TEMAS.filter((t) => ORDEN.indexOf(t.nivel) <= ORDEN.indexOf(nivel));
}

export interface Opcion {
  texto: string;
  correcta: boolean;
  /** Por qué es incorrecta (el error típico que lleva a ella). */
  error?: string;
}

export interface Pregunta {
  tema: Tema;
  enunciado: string[];
  opciones: Opcion[];
  solucion: string[];
}

// ---------- Azar reproducible ----------

export function crearAzar(semilla: number) {
  let s = semilla >>> 0;
  const siguiente = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    real: (min: number, max: number) => min + siguiente() * (max - min),
    entero: (min: number, max: number) => Math.floor(min + siguiente() * (max - min + 1)),
    elegir: <T>(arr: readonly T[]) => arr[Math.floor(siguiente() * arr.length)],
    signo: (): 1 | -1 => (siguiente() < 0.5 ? 1 : -1),
    mezclar: <T>(arr: T[]) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(siguiente() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}
type Azar = ReturnType<typeof crearAzar>;

/** Monta 4 opciones distintas: la correcta, los errores típicos y, si hace falta, variantes. */
function opciones(
  az: Azar,
  correcta: string,
  errores: { texto: string; error: string }[],
  relleno: () => string,
): Opcion[] {
  const usadas = new Set([correcta]);
  const lista: Opcion[] = [{ texto: correcta, correcta: true }];
  for (const e of errores) {
    if (lista.length === 4) break;
    if (usadas.has(e.texto)) continue;
    usadas.add(e.texto);
    lista.push({ texto: e.texto, correcta: false, error: e.error });
  }
  let intentos = 0;
  while (lista.length < 4 && intentos++ < 50) {
    const t = relleno();
    if (usadas.has(t)) continue;
    usadas.add(t);
    lista.push({ texto: t, correcta: false, error: "Valor que no corresponde a ningún cálculo correcto." });
  }
  return az.mezclar(lista);
}

const rumboEntero = (r: number) => formatoRumbo(Math.round(normalizar360(r)) % 360);
const redondeoMedio = (x: number) => Math.round(x * 2) / 2;

// ---------- PER ----------

function preguntaRumbos(az: Azar): Pregunta {
  const dm = az.signo() * az.entero(1, 6);
  const desvio = az.signo() * az.entero(1, 8);
  const rv = az.entero(0, 359);
  const ct = correccionTotal(dm, desvio);
  const ra = deVerdaderoAAguja(rv, ct.ct);
  return {
    tema: "rumbos",
    enunciado: [
      `Queremos navegar al rumbo verdadero ${formatoRumbo(rv)}.`,
      `Declinación magnética: ${formatoEW(dm)}. Desvío para ese rumbo: ${formatoEW(desvio)}.`,
      "Calcular el rumbo de aguja.",
    ],
    opciones: opciones(
      az,
      `Ra = ${rumboEntero(ra.aguja)}`,
      [
        { texto: `Ra = ${rumboEntero(rv + ct.ct)}`, error: "Se ha sumado la Ct en lugar de restarla: Ra = Rv − Ct." },
        { texto: `Ra = ${rumboEntero(rv - dm)}`, error: "Se ha olvidado el desvío: Ct = dm + Δ." },
        { texto: `Ra = ${rumboEntero(rv - (dm - desvio))}`, error: "Error de signo en el desvío al calcular la Ct." },
      ],
      () => `Ra = ${rumboEntero(ra.aguja + az.signo() * az.entero(2, 12))}`,
    ),
    solucion: [...ct.pasos, "", ...ra.pasos],
  };
}

function preguntaDeclinacion(az: Azar): Pregunta {
  const dmCarta = az.signo() * (az.entero(0, 6) + az.entero(0, 5) * 10 / 60);
  const anioCarta = az.entero(1998, 2018);
  const variacion = az.signo() * az.entero(3, 9);
  const anio = new Date().getFullYear();
  const r = actualizarDeclinacion(dmCarta, anioCarta, variacion, anio);
  const malSentido = actualizarDeclinacion(dmCarta, anioCarta, -variacion, anio).dm;
  const unAnio = dmCarta + variacion / 60;
  const sinActualizar = dmCarta;
  const varTexto = `${Math.abs(variacion)}′ ${variacion > 0 ? "E" : "W"}`;
  return {
    tema: "declinacion",
    enunciado: [
      `La rosa de la carta indica: ${formatoEW(dmCarta)} ${anioCarta} (${varTexto}).`,
      `Calcular la declinación magnética para ${anio}.`,
    ],
    opciones: opciones(
      az,
      formatoEW(r.dm),
      [
        { texto: formatoEW(malSentido), error: "Se ha aplicado la variación anual en el sentido contrario." },
        { texto: formatoEW(unAnio), error: "Se ha aplicado la variación de un solo año en lugar de multiplicarla por los años transcurridos." },
        { texto: formatoEW(sinActualizar), error: "Se ha usado la dm de la carta sin actualizar." },
      ],
      () => formatoEW(r.dm + az.signo() * az.entero(10, 60) / 60),
    ),
    solucion: r.pasos,
  };
}

function preguntaDVT(az: Azar): Pregunta {
  const v = az.entero(4, 12) + az.elegir([0, 0.5]);
  const t = az.entero(1, 5) + az.elegir([0.25, 0.5, 0.75, 1 / 3, 2 / 3]);
  const d = Math.round(v * t * 10) / 10;
  const r = resolverDVT({ distancia: d, velocidad: v });
  const horas = Math.floor(r.tiempo);
  const decimalComoMin = `${horas} h ${Math.round((r.tiempo - horas) * 100)} min`;
  return {
    tema: "dvt",
    enunciado: [`Debemos recorrer ${formatoNumero(d, 1)} millas a ${formatoNumero(v, 1)} nudos.`, "¿Cuánto tiempo tardaremos?"],
    opciones: opciones(
      az,
      formatoDuracion(r.tiempo),
      [
        { texto: decimalComoMin, error: "Se han tomado los decimales de hora como minutos (0,5 h son 30 min, no 50)." },
        { texto: formatoDuracion(v / d), error: "Se ha dividido al revés: t = D ÷ V." },
        { texto: formatoDuracion(r.tiempo + 0.25), error: "Error de cálculo en la división." },
      ],
      () => formatoDuracion(r.tiempo + az.signo() * az.entero(10, 40) / 60),
    ),
    solucion: r.pasos,
  };
}

function preguntaCorriente(az: Azar): Pregunta {
  const rs = az.entero(0, 359);
  const vb = az.entero(4, 10);
  const rc = az.entero(0, 35) * 10;
  const ic = az.entero(1, 3) + az.elegir([0, 0.5]);
  const r = efectoCorriente(rs, vb, rc, ic);
  const contraria = efectoCorriente(rs, vb, rc + 180, ic);
  const fmt = (ref: number, vef: number) => `Ref = ${rumboEntero(ref)}, Vef = ${formatoNumero(vef, 1)} nudos`;
  return {
    tema: "corriente",
    enunciado: [
      `Navegamos al rumbo de superficie ${formatoRumbo(rs)} con velocidad ${vb} nudos.`,
      `Hay una corriente de rumbo ${formatoRumbo(rc)} e intensidad horaria ${formatoNumero(ic, 1)} nudos.`,
      "Calcular el rumbo y la velocidad efectivos.",
    ],
    opciones: opciones(
      az,
      fmt(r.ref, r.vef),
      [
        { texto: fmt(contraria.ref, contraria.vef), error: "Se ha tomado la corriente en sentido contrario: el rumbo de la corriente indica hacia dónde va." },
        { texto: fmt(rs, vb + ic), error: "Se han sumado las velocidades como números: hay que sumar los vectores." },
        { texto: fmt(r.ref, vb), error: "Se ha corregido el rumbo pero no la velocidad." },
      ],
      () => fmt(r.ref + az.signo() * az.entero(4, 15), r.vef + az.signo() * 0.8),
    ),
    solucion: r.pasos,
  };
}

function preguntaCorrienteDesconocida(az: Azar): Pregunta {
  const rs = az.entero(0, 359);
  const vb = az.entero(5, 9);
  const rcReal = az.entero(0, 35) * 10;
  const icReal = az.entero(1, 3);
  const efectivo = efectoCorriente(rs, vb, rcReal, icReal);
  const ref = Math.round(efectivo.ref);
  const vef = Math.round(efectivo.vef * 10) / 10;
  const r = corrienteDesconocida(rs, vb, ref, vef);
  const fmt = (rc: number, ic: number) => `Rc = ${rumboEntero(rc)}, Ic = ${formatoNumero(ic, 1)} nudos`;
  return {
    tema: "corriente-desconocida",
    enunciado: [
      `Navegamos al rumbo de superficie ${formatoRumbo(rs)} a ${vb} nudos.`,
      `Por las situaciones observadas sabemos que avanzamos realmente al ${formatoRumbo(ref)} a ${formatoNumero(vef, 1)} nudos.`,
      "Calcular el rumbo y la intensidad horaria de la corriente.",
    ],
    opciones: opciones(
      az,
      fmt(r.rc, r.ic),
      [
        { texto: fmt(r.rc + 180, r.ic), error: "Se ha restado al revés: corriente = efectivo − superficie." },
        { texto: fmt(r.rc, Math.abs(vef - vb)), error: "Se ha restado solo las velocidades: hay que restar los vectores." },
        { texto: fmt(ref, r.ic), error: "Se ha tomado el rumbo efectivo como rumbo de la corriente." },
      ],
      () => fmt(r.rc + az.signo() * az.entero(20, 60), r.ic + az.signo() * 0.5),
    ),
    solucion: r.pasos,
  };
}

function preguntaRumboADar(az: Azar): Pregunta {
  const ref = az.entero(0, 359);
  const vb = az.entero(5, 9);
  const rc = az.entero(0, 35) * 10;
  const ic = az.entero(1, 2);
  const ab = az.signo() * az.entero(3, 12);
  const ct = az.signo() * az.entero(1, 9);
  const r = rumboADar({ ref, vb, rc, ic, ab, ct });
  const sumandoAb = rumboADar({ ref, vb, rc, ic, ab: -ab, ct });
  const ctAlReves = rumboADar({ ref, vb, rc, ic, ab, ct: -ct });
  const sinCorriente = rumboADar({ ref, vb, ab, ct });
  return {
    tema: "rumbo-a-dar",
    enunciado: [
      `Queremos avanzar al rumbo efectivo ${formatoRumbo(ref)}. Velocidad del barco: ${vb} nudos.`,
      `Corriente de rumbo ${formatoRumbo(rc)} e intensidad ${ic} nudos.`,
      `El viento, que entra por ${ab > 0 ? "babor" : "estribor"}, nos produce ${Math.abs(ab)}° de abatimiento.`,
      `Corrección total: ${formatoEW(ct)}.`,
      "Calcular el rumbo de aguja a dar al timonel.",
    ],
    opciones: opciones(
      az,
      `Ra = ${rumboEntero(r.ra!)}`,
      [
        { texto: `Ra = ${rumboEntero(sumandoAb.ra!)}`, error: "Abatimiento con el signo cambiado: para pasar de Rs a Rv se resta, Rv = Rs − Ab." },
        { texto: `Ra = ${rumboEntero(ctAlReves.ra!)}`, error: "Ct con el signo cambiado: Ra = Rv − Ct." },
        { texto: `Ra = ${rumboEntero(sinCorriente.ra!)}`, error: "No se ha compensado la corriente." },
      ],
      () => `Ra = ${rumboEntero(r.ra! + az.signo() * az.entero(3, 15))}`,
    ),
    solucion: r.pasos,
  };
}

// ---------- Patrón de Yate ----------

function tablaMareas(az: Azar): Extremo[] {
  const empiezaBajamar = az.signo() > 0;
  let t = az.entero(30, 390);
  const bajo = () => Math.round(az.real(0.4, 1.2) * 100) / 100;
  const alto = () => Math.round(az.real(2.8, 3.6) * 100) / 100;
  const tabla: Extremo[] = [];
  for (let i = 0; i < 4; i++) {
    const esBajamar = empiezaBajamar ? i % 2 === 0 : i % 2 === 1;
    tabla.push({ minutos: t % 1440, altura: esBajamar ? bajo() : alto() });
    t += az.entero(360, 385);
  }
  return tabla;
}

function textoTabla(tabla: Extremo[]): string[] {
  return ["Anuario de mareas (horas UT):", ...tabla.map((e) => `  ${formatoHoraMin(e.minutos)}  ${formatoNumero(e.altura)} m`)];
}

/** Regla de los doceavos (para generar el error típico). */
function doceavos(e1: Extremo, e2: Extremo, t: number): number {
  const D = e2.minutos - e1.minutos;
  const sexto = (t / D) * 6;
  const pesos = [1, 2, 3, 3, 2, 1];
  let acumulado = 0;
  for (let i = 0; i < 6; i++) {
    const parte = Math.min(Math.max(sexto - i, 0), 1);
    acumulado += parte * pesos[i];
  }
  return e1.altura + ((e2.altura - e1.altura) * acumulado) / 12;
}

function preguntaMareasSonda(az: Azar): Pregunta {
  const tabla = tablaMareas(az);
  const adelanto = az.elegir([1, 2]);
  const sondaCarta = Math.round(az.real(1.2, 3.2) * 20) / 20;
  const i = az.entero(0, 1);
  const e1 = tabla[i];
  const e2Base = tabla[i + 1];
  const e2 = { ...e2Base, minutos: e2Base.minutos < e1.minutos ? e2Base.minutos + 1440 : e2Base.minutos };
  const ut = e1.minutos + Math.round((e2.minutos - e1.minutos) * az.real(0.15, 0.85));
  const oficial = ut + adelanto * 60;
  const r = sondaAHora(tabla, oficial % 1440, adelanto, sondaCarta);

  let sinAdelanto: number | undefined;
  try {
    sinAdelanto = sondaAHora(tabla, oficial % 1440, 0, sondaCarta).sonda;
  } catch {
    sinAdelanto = undefined;
  }
  const fmt = (x: number) => `${formatoNumero(x)} m`;
  const errores = [
    { texto: fmt(sondaCarta + doceavos(e1, e2, ut - e1.minutos)), error: "Se ha usado la regla de los doceavos; el examen se resuelve con el método del coseno." },
    { texto: fmt(r.altura), error: "Se ha dado la altura de la marea sin sumarle la sonda de la carta." },
  ];
  if (sinAdelanto !== undefined) {
    errores.push({ texto: fmt(sinAdelanto), error: "No se ha restado el adelanto: el anuario está en UT y la hora del enunciado es oficial." });
  }
  return {
    tema: "mareas-sonda",
    enunciado: [
      ...textoTabla(tabla),
      `Calcular la sonda a la hora oficial ${formatoHoraMin(oficial)} en un bajo con sonda en la carta de ${formatoNumero(sondaCarta)} m.`,
      `Adelanto vigente: +${adelanto} h.`,
    ],
    opciones: opciones(az, fmt(r.sonda), errores, () => fmt(r.sonda + az.signo() * az.entero(10, 45) / 100)),
    solucion: r.pasos,
  };
}

function preguntaMareasHora(az: Azar): Pregunta {
  const tabla = tablaMareas(az);
  const adelanto = az.elegir([1, 2]);
  const sondaCarta = Math.round(az.real(1.5, 2.8) * 20) / 20;
  const i = az.entero(0, 2);
  const e1 = tabla[i];
  const e2 = tabla[i + 1];
  const fraccion = az.real(0.2, 0.8);
  const altura = e1.altura + (e2.altura - e1.altura) * fraccion;
  const sondaBuscada = Math.round((sondaCarta + altura) * 100) / 100;
  const r = horaParaSonda(tabla, sondaBuscada, adelanto, sondaCarta);
  const sol = r.soluciones.find((s) => s.intervalo === i) ?? r.soluciones[0];
  const sube = sol.sube;
  const otro = r.soluciones.find((s) => s.intervalo !== sol.intervalo);
  const nombre = (k: number) => (tabla[k].altura > tabla[k + 1 < tabla.length ? k + 1 : k - 1].altura ? "pleamar" : "bajamar");
  const ordinal = (k: number) => {
    const tipoK = nombre(k);
    const n = tabla.slice(0, k + 1).filter((_, j) => nombre(j) === tipoK).length;
    return `${n === 1 ? "primera" : n === 2 ? "segunda" : "tercera"} ${tipoK}`;
  };
  const errores = [
    { texto: formatoHoraMin(sol.horaUT), error: "Se ha dado la hora UT: hay que sumar el adelanto para obtener la hora oficial." },
    { texto: formatoHoraMin(sol.horaUT - adelanto * 60), error: "Se ha restado el adelanto en vez de sumarlo." },
  ];
  if (otro) errores.push({ texto: formatoHoraMin(otro.horaOficial), error: "Es la solución de otro intervalo de la marea, no del que pide el enunciado." });
  return {
    tema: "mareas-hora",
    enunciado: [
      ...textoTabla(tabla),
      `Calcular la hora oficial, entre la ${ordinal(i)} y la ${ordinal(i + 1)}, en que la sonda en un bajo de ${formatoNumero(sondaCarta)} m en la carta será de ${formatoNumero(sondaBuscada)} m (marea ${sube ? "subiendo" : "bajando"}).`,
      `Adelanto vigente: +${adelanto} h.`,
    ],
    opciones: opciones(az, formatoHoraMin(sol.horaOficial), errores, () => formatoHoraMin(sol.horaOficial + az.signo() * az.entero(15, 50))),
    solucion: r.pasos,
  };
}

function posicionAzar(az: Azar, cerca180 = false) {
  const lat = az.signo() * (az.entero(5, 50) + az.entero(0, 59) / 60);
  const lon = cerca180 ? (az.signo() > 0 ? 1 : -1) * (az.entero(176, 179) + az.entero(0, 59) / 60) : az.signo() * (az.entero(1, 170) + az.entero(0, 59) / 60);
  return { lat, lon };
}

function preguntaLoxodromica(az: Azar): Pregunta {
  const cruza = az.signo() > 0;
  const a = posicionAzar(az, cruza);
  let b = { lat: a.lat + az.signo() * az.entero(1, 6) + az.entero(0, 59) / 60, lon: 0 };
  if (cruza) {
    const lonB = (a.lon > 0 ? -1 : 1) * (az.entero(176, 179) + az.entero(0, 59) / 60);
    b = { ...b, lon: lonB };
  } else {
    b = { ...b, lon: a.lon + az.signo() * (az.entero(1, 5) + az.entero(0, 59) / 60) };
  }
  b.lat = Math.max(-60, Math.min(60, b.lat));
  const r = rumboYDistancia(a, b);
  const sinCos = normalizar360((Math.atan2(r.dLon, r.dLat) * 180) / Math.PI);
  const fmt = (x: number) => `${formatoNumero(redondeoMedio(normalizar360(x)) % 360, 1)}°`;
  return {
    tema: "loxodromica",
    enunciado: [
      `Desde la situación ${formatoLatitud(a.lat)} ${formatoLongitud(a.lon)} damos rumbo a la situación ${formatoLatitud(b.lat)} ${formatoLongitud(b.lon)}.`,
      "Calcular el rumbo directo (aproximar al medio grado).",
    ],
    opciones: opciones(
      az,
      fmt(r.rumbo),
      [
        { texto: fmt(sinCos), error: "Se ha usado la diferencia de longitud sin convertirla en apartamiento (A = Δλ · cos lm)." },
        { texto: fmt(r.rumbo + 180), error: "Es el rumbo opuesto: se han restado las coordenadas al revés." },
        { texto: fmt(cruza ? 360 - r.rumbo : 180 - r.rumbo), error: cruza ? "Se ha ido por el camino largo en lugar de cruzar el meridiano de 180°." : "Error al pasar el rumbo cuadrantal a circular." },
      ],
      () => fmt(r.rumbo + az.signo() * az.entero(3, 12)),
    ),
    solucion: r.pasos,
  };
}

function preguntaEstima(az: Azar): Pregunta {
  const salida = { lat: 35.8 + az.real(0, 0.35), lon: -(5.2 + az.real(0, 1)) };
  salida.lat = Math.round(salida.lat * 60) / 60;
  salida.lon = Math.round(salida.lon * 60) / 60;
  const rumbo = az.entero(0, 359);
  const v = az.entero(5, 9);
  const horas = az.elegir([1, 1.5, 2, 2.5]);
  const rc = az.entero(0, 35) * 10;
  const ic = az.entero(1, 3);
  const tramos = [
    { rumbo, distancia: v * horas, nombre: "Barco" },
    { rumbo: rc, distancia: ic * horas, nombre: "Corriente" },
  ];
  const r = estima(salida, tramos);
  const sinCorriente = estima(salida, [tramos[0]]).llegada;
  const corrienteAlReves = estima(salida, [tramos[0], { ...tramos[1], rumbo: rc + 180 }]).llegada;
  const sinCos = { lat: r.llegada.lat, lon: salida.lon + (r.llegada.lon - salida.lon) * Math.cos(((salida.lat + r.llegada.lat) / 2) * (Math.PI / 180)) };
  const fmt = (p: { lat: number; lon: number }) => `${formatoLatitud(p.lat)}  ${formatoLongitud(p.lon)}`;
  return {
    tema: "estima",
    enunciado: [
      `Estamos en ${fmt(salida)}. Navegamos al rumbo verdadero ${formatoRumbo(rumbo)} a ${v} nudos durante ${formatoDuracion(horas)}.`,
      `Hay una corriente de rumbo ${formatoRumbo(rc)} e intensidad horaria ${ic} nudos. No hay viento.`,
      "Calcular la situación de estima al final.",
    ],
    opciones: opciones(
      az,
      fmt(r.llegada),
      [
        { texto: fmt(sinCorriente), error: "No se ha tenido en cuenta la corriente." },
        { texto: fmt(corrienteAlReves), error: "Corriente en sentido contrario: su rumbo indica hacia dónde va." },
        { texto: fmt(sinCos), error: "Se ha tomado el apartamiento como diferencia de longitud sin dividir por cos lm." },
      ],
      () => fmt({ lat: r.llegada.lat + az.signo() * az.entero(2, 6) / 60, lon: r.llegada.lon + az.signo() * az.entero(2, 6) / 60 }),
    ),
    solucion: r.pasos,
  };
}

function preguntaLlegada(az: Azar): Pregunta {
  const ref = az.entero(0, 359);
  const distancia = az.entero(10, 30);
  const horas = az.elegir([2, 2.5, 3, 4]);
  const rc = az.entero(0, 35) * 10;
  const ic = az.entero(1, 3);
  const ct = az.signo() * az.entero(1, 9);
  const r = llegarAHora({ ref, distancia, horas, rc, ic, ct });
  const sumando = llegarAHora({ ref, distancia, horas, rc: rc + 180, ic, ct });
  const ctMal = llegarAHora({ ref, distancia, horas, rc, ic, ct: -ct });
  const fmt = (ra: number, vb: number) => `Ra = ${rumboEntero(ra)}, Vb = ${formatoNumero(vb, 1)} nudos`;
  return {
    tema: "llegada",
    enunciado: [
      `El destino está al ${formatoRumbo(ref)} verdadero, a ${distancia} millas. Debemos llegar en ${formatoDuracion(horas)}.`,
      `Corriente de rumbo ${formatoRumbo(rc)} e intensidad horaria ${ic} nudos. Corrección total ${formatoEW(ct)}. Sin viento.`,
      "Calcular el rumbo de aguja y la velocidad del barco necesarios.",
    ],
    opciones: opciones(
      az,
      fmt(r.ra!, r.vb),
      [
        { texto: fmt(sumando.ra!, sumando.vb), error: "Se ha sumado la corriente en lugar de restarla: superficie = efectivo − corriente." },
        { texto: fmt(ctMal.ra!, ctMal.vb), error: "Ct con el signo cambiado: Ra = Rv − Ct." },
        { texto: fmt(ref - ct, r.vef), error: "No se ha compensado la corriente." },
      ],
      () => fmt(r.ra! + az.signo() * az.entero(4, 15), r.vb + az.signo() * 0.7),
    ),
    solucion: r.pasos,
  };
}


// ---------- Capitán de Yate ----------

function posicionOceanica(az: Azar) {
  return {
    lat: az.signo() * (az.entero(0, 60) + az.entero(0, 59) / 60),
    lon: az.signo() * (az.entero(0, 179) + az.entero(0, 59) / 60),
  };
}

function parOrtodromico(az: Azar) {
  const a = posicionOceanica(az);
  let b = posicionOceanica(az);
  // Derrotas largas como en el examen (entre ~1500 y ~9000 millas)
  for (let i = 0; i < 30; i++) {
    const d = ortodromica(a, b).distancia;
    if (d > 1500 && d < 9500) break;
    b = posicionOceanica(az);
  }
  return { a, b };
}

const textoPos = (p: { lat: number; lon: number }) => `${formatoLatitud(p.lat)}, ${formatoLongitud(p.lon)}`;

function preguntaOrtoDistancia(az: Azar): Pregunta {
  const { a, b } = parOrtodromico(az);
  const r = ortodromica(a, b);
  const lox = rumboYDistancia(a, b).distancia;
  const latCambiada = ortodromica(a, { ...b, lat: -b.lat }).distancia;
  const fmt = (d: number) => `${Math.round(d)}′`;
  return {
    tema: "orto-distancia",
    enunciado: [`Calcular la distancia ortodrómica, redondeada a la milla, entre los puntos ${textoPos(a)} y ${textoPos(b)}.`],
    opciones: opciones(
      az,
      fmt(r.distancia),
      [
        { texto: fmt(lox), error: "Es la distancia loxodrómica, no la ortodrómica (que siempre es menor o igual)." },
        { texto: fmt(21600 - r.distancia), error: "Es el arco mayor del círculo máximo (21.600′ − D): se ha ido por el lado largo." },
        { texto: fmt(latCambiada), error: "Se ha tomado la latitud de llegada con el signo cambiado (N/S)." },
      ],
      () => fmt(r.distancia + az.signo() * az.entero(150, 900)),
    ),
    solucion: r.pasos,
  };
}

function preguntaOrtoRumbo(az: Azar): Pregunta {
  const { a, b } = parOrtodromico(az);
  const r = ortodromica(a, b);
  const lox = rumboYDistancia(a, b).rumbo;
  const fmt = (x: number) => `${String(Math.round(normalizar360(x)) % 360).padStart(3, "0")}°`;
  return {
    tema: "orto-rumbo",
    enunciado: [`Calcular el rumbo inicial para navegar por ortodrómica desde el punto ${textoPos(a)} hasta el punto ${textoPos(b)}.`],
    opciones: opciones(
      az,
      fmt(r.rumboInicial),
      [
        { texto: fmt(360 - r.rumboInicial), error: "Se ha cambiado el sentido E/W del rumbo: revisa hacia dónde va la diferencia de longitud." },
        { texto: fmt(180 - r.rumboInicial), error: "Error al pasar el rumbo cuadrantal (N/S…E/W) a circular." },
        { texto: fmt(lox), error: "Es el rumbo loxodrómico; el ortodrómico cambia a lo largo de la derrota." },
      ],
      () => fmt(r.rumboInicial + az.signo() * az.entero(15, 40)),
    ),
    solucion: r.pasos,
  };
}

function preguntaHoras(az: Azar): Pregunta {
  const lon = az.signo() * (az.entero(20, 179) + az.entero(0, 59) / 60 + az.entero(0, 59) / 3600);
  const base = Date.UTC(2026, az.entero(0, 11), az.entero(1, 28), az.entero(0, 23), az.entero(0, 59), az.entero(0, 59));
  const r = convertirHora(base, "HcG", lon, 0);
  const restando = base - (lon / 15) * 3_600_000;
  const mismaFecha = (() => {
    const t = new Date(r.HcL);
    const g = new Date(base);
    return Date.UTC(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate(), t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds());
  })();
  return {
    tema: "horas",
    enunciado: [
      `Nos encontramos en longitud ${formatoLongitud(lon)} (${Math.abs(lon).toFixed(4).replace(".", ",")}°).`,
      `Siendo HcG = ${formatoInstante(base)}, calcular la hora civil del lugar (HcL) y la fecha.`,
    ],
    opciones: opciones(
      az,
      formatoInstante(r.HcL),
      [
        { texto: formatoInstante(restando), error: `Se ha aplicado la longitud al revés: al ${lon >= 0 ? "E se suma" : "W se resta"}.` },
        { texto: formatoInstante(mismaFecha), error: "La hora es correcta pero se ha olvidado el cambio de fecha." },
        { texto: formatoInstante(r.HZ), error: "Es la hora de zona (huso horario entero), no la hora civil del lugar." },
      ],
      () => formatoInstante(r.HcL + az.signo() * az.entero(4, 40) * 60_000),
    ),
    solucion: r.pasos,
  };
}

function datosSol(az: Azar) {
  return {
    dec: az.signo() * (az.entero(0, 23) + az.entero(0, 59) / 60 + az.entero(0, 9) / 600),
    sd: az.elegir([15.8, 15.9, 16.0, 16.1, 16.2, 16.3]),
  };
}

function preguntaAltura(az: Azar): Pregunta {
  const ai = az.entero(15, 70) + az.entero(0, 599) / 600;
  const ci = az.signo() * az.entero(1, 30) / 10;
  const eo = az.elegir([2, 2.5, 3, 4, 5, 6, 8]);
  const { sd } = datosSol(az);
  const r = corregirAltura({ ai, ci, eo, astro: "sol-li", sd });
  const sinDep = corregirAltura({ ai, ci, eo: 0, astro: "sol-li", sd }).av;
  const ls = corregirAltura({ ai, ci, eo, astro: "sol-ls", sd }).av;
  const ciMal = corregirAltura({ ai, ci: -ci, eo, astro: "sol-li", sd }).av;
  return {
    tema: "altura",
    enunciado: [
      `Se observa el Sol, limbo inferior, con altura instrumental Ai = ${formatoAltura(ai)}.`,
      `Error de índice = ${Math.abs(ci).toFixed(1).replace(".", ",")}′ (${ci >= 0 ? "+" : "−"}). Elevación del observador: ${formatoNumero(eo, 1)} m. Semidiámetro (Almanaque): ${sd.toFixed(1).replace(".", ",")}′.`,
      "Calcular la altura verdadera.",
    ],
    opciones: opciones(
      az,
      formatoAltura(r.av),
      [
        { texto: formatoAltura(sinDep), error: "No se ha restado la depresión del horizonte por la elevación del observador." },
        { texto: formatoAltura(ls), error: "Se ha restado el semidiámetro: en el limbo inferior se suma." },
        { texto: formatoAltura(ciMal), error: "Se ha aplicado el error de índice con el signo cambiado." },
      ],
      () => formatoAltura(r.av + (az.signo() * az.entero(2, 9)) / 60),
    ),
    solucion: r.pasos,
  };
}

function preguntaMeridiana(az: Azar): Pregunta {
  for (;;) {
    const { dec, sd } = datosSol(az);
    const lat = az.signo() * (az.entero(0, 60) + az.entero(0, 59) / 60);
    if (Math.abs(lat - dec) < 8 || Math.abs(lat - dec) > 75) continue;
    const eo = az.elegir([2, 3, 4, 5, 6]);
    const ci = az.signo() * az.entero(0, 25) / 10;
    // Altura instrumental coherente con la latitud real
    const avReal = 90 - Math.abs(lat - dec);
    const corr = corregirAltura({ ai: avReal, ci, eo, astro: "sol-li", sd }).correccionTotal;
    const ai = Math.round((avReal - corr / 60) * 600) / 600;
    const alt = corregirAltura({ ai, ci, eo, astro: "sol-li", sd });
    const latEst = lat + az.signo() * az.entero(5, 25) / 60;
    const r = latitudMeridiana(alt.av, dec, latEst);
    const latMal = r.astroAl === "S" ? dec - r.z : dec + r.z;
    const fmt = (l: number) => formatoLatitud(Math.round(l * 60) / 60);
    const opts = opciones(
      az,
      fmt(r.lat),
      [
        { texto: fmt(Math.sign(r.lat || 1) * r.z), error: "Es la distancia cenital z = 90° − av; falta combinarla con la declinación." },
        { texto: fmt(Math.sign(r.lat || 1) * alt.av), error: "Es la altura verdadera, no la latitud." },
        ...(Math.abs(latMal) <= 90 ? [{ texto: fmt(latMal), error: "Se ha combinado z y la declinación con el signo equivocado: mira a qué lado pasa el Sol." }] : []),
      ],
      () => fmt(r.lat + (az.signo() * az.entero(15, 60)) / 60),
    );
    return {
      tema: "meridiana",
      enunciado: [
        `En latitud de estima ${formatoLatitud(latEst)} se observa el Sol, limbo inferior, en el meridiano con Ai = ${formatoAltura(ai)}.`,
        `Error de índice ${Math.abs(ci).toFixed(1).replace(".", ",")}′ (${ci >= 0 ? "+" : "−"}), elevación del observador ${eo} m.`,
        `Datos del Almanaque: declinación del Sol ${formatoDeclinacion(dec)}, semidiámetro ${sd.toFixed(1).replace(".", ",")}′.`,
        "Calcular la latitud por altura meridiana.",
      ],
      opciones: opts,
      solucion: [...alt.pasos, "", ...r.pasos],
    };
  }
}

function preguntaRecta(az: Azar): Pregunta {
  for (;;) {
    const estima = posicionOceanica(az);
    const dec = az.signo() * (az.entero(0, 60) + az.entero(0, 599) / 600);
    const hG = az.entero(0, 359) + az.entero(0, 599) / 600;
    const r = rectaDeAltura(estima, hG, dec);
    if (r.ae < 12 || r.ae > 75) continue;
    const latMal = alturaYAzimut(-estima.lat, r.hL, dec);
    const hlMal = alturaYAzimut(estima.lat, normalizar360(hG - estima.lon), dec);
    const fmt = (z: number, ae: number) => `Z = ${String(Math.round(normalizar360(z)) % 360).padStart(3, "0")}°, ae = ${formatoAltura(ae)}`;
    return {
      tema: "recta",
      enunciado: [
        `Desde la situación de estima ${textoPos(estima)} se observa un astro.`,
        `Datos del Almanaque para la hora de la observación: hG = ${formatoHorario(hG)}, declinación ${formatoDeclinacion(dec)}.`,
        "Calcular el azimut y la altura estimada.",
      ],
      opciones: opciones(
        az,
        fmt(r.z, r.ae),
        [
          { texto: fmt(360 - r.z, r.ae), error: "Azimut con el sentido E/W cambiado: si el horario del lugar es menor de 180°, el astro está al W." },
          { texto: fmt(latMal.z, latMal.ae), error: "Se ha tomado la latitud con el signo cambiado (N/S)." },
          { texto: fmt(hlMal.z, hlMal.ae), error: "Se ha aplicado la longitud al revés al calcular el horario del lugar (hL = hG + λ, λ al E positiva)." },
        ],
        () => fmt(r.z + az.signo() * az.entero(5, 20), r.ae + (az.signo() * az.entero(10, 40)) / 60),
      ),
      solucion: r.pasos,
    };
  }
}

const GENERADORES: Record<Exclude<Tema, TemaCarta>, (az: Azar) => Pregunta> = {
  rumbos: preguntaRumbos,
  declinacion: preguntaDeclinacion,
  dvt: preguntaDVT,
  corriente: preguntaCorriente,
  "corriente-desconocida": preguntaCorrienteDesconocida,
  "rumbo-a-dar": preguntaRumboADar,
  "mareas-sonda": preguntaMareasSonda,
  "mareas-hora": preguntaMareasHora,
  loxodromica: preguntaLoxodromica,
  estima: preguntaEstima,
  llegada: preguntaLlegada,
  "orto-distancia": preguntaOrtoDistancia,
  "orto-rumbo": preguntaOrtoRumbo,
  horas: preguntaHoras,
  altura: preguntaAltura,
  meridiana: preguntaMeridiana,
  recta: preguntaRecta,
};

/**
 * Genera una pregunta. Si un caso al azar resulta imposible (p. ej. corriente
 * demasiado fuerte), se prueba con otra semilla. Los ejercicios de carta usan los
 * faros del alumno y lanzan FarosInsuficientes si no tiene bastantes.
 */
export function generarPregunta(tema: Tema, semilla: number, faros: readonly FaroCarta[] = []): Pregunta {
  if (esTemaCarta(tema)) {
    const gen = { "carta-dos-demoras": preguntaDosDemoras, "carta-demora-distancia": preguntaDemoraDistancia, "carta-enfilacion": preguntaEnfilacion }[tema];
    return gen(crearAzar(semilla), faros);
  }
  for (let intento = 0; intento < 20; intento++) {
    try {
      const p = GENERADORES[tema](crearAzar(semilla + intento * 7919));
      if (p.opciones.length === 4 && p.opciones.filter((o) => o.correcta).length === 1) return p;
    } catch {
      /* caso imposible: se prueba otro */
    }
  }
  throw new Error(`No se ha podido generar una pregunta de ${tema}`);
}
