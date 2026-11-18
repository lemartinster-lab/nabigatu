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
  | "llegada";

export const TEMAS: { id: Tema; nombre: string; nivel: Nivel }[] = [
  { id: "rumbos", nombre: "Corrección total y rumbos", nivel: "PER" },
  { id: "declinacion", nombre: "Declinación magnética", nivel: "PER" },
  { id: "dvt", nombre: "Distancia, velocidad y tiempo", nivel: "PER" },
  { id: "corriente", nombre: "Efecto de la corriente", nivel: "PER" },
  { id: "corriente-desconocida", nombre: "Corriente desconocida", nivel: "PER" },
  { id: "rumbo-a-dar", nombre: "Rumbo a dar con viento y corriente", nivel: "PER" },
  { id: "mareas-sonda", nombre: "Mareas: sonda a una hora", nivel: "PY" },
  { id: "mareas-hora", nombre: "Mareas: hora para una sonda", nivel: "PY" },
  { id: "loxodromica", nombre: "Loxodrómica: rumbo directo", nivel: "PY" },
  { id: "estima", nombre: "Situación por estima", nivel: "PY" },
  { id: "llegada", nombre: "Llegar a una hora con corriente", nivel: "PY" },
];

const ORDEN: Nivel[] = ["PER", "PY", "CY"];
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

const GENERADORES: Record<Tema, (az: Azar) => Pregunta> = {
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
};

/**
 * Genera una pregunta. Si un caso al azar resulta imposible (p. ej. corriente
 * demasiado fuerte), se prueba con otra semilla.
 */
export function generarPregunta(tema: Tema, semilla: number): Pregunta {
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

