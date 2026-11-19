/**
 * Datos de los ejercicios interactivos:
 * - «¿Qué ves de noche?»: escenarios del RIPA con las luces que se ven y la maniobra correcta
 *   para quien los observa, que navega en un buque de propulsión mecánica.
 * - «Reconoce la marca»: ritmo de la luz de cada marca de balizamiento (IALA, región A).
 */
import { alturaYAzimut } from "../cy/astronomica";
import { MARCAS, type Marca } from "./chuletas";

// ---------- «¿Qué ves de noche?» ----------

export type TipoBuque =
  | "motor"
  | "motor-grande"
  | "velero"
  | "sin-gobierno"
  | "restringido"
  | "arrastre"
  | "pesca"
  | "fondeado"
  | "practico"
  | "varado";

export const NOMBRE_BUQUE: Record<TipoBuque, string> = {
  motor: "Buque de motor de menos de 50 m",
  "motor-grande": "Buque de motor de 50 m o más",
  velero: "Velero navegando a vela",
  "sin-gobierno": "Buque sin gobierno",
  restringido: "Buque con capacidad de maniobra restringida",
  arrastre: "Pesquero de arrastre",
  pesca: "Pesquero (no de arrastre)",
  fondeado: "Buque fondeado",
  practico: "Buque de práctico",
  varado: "Buque varado",
};

export type Accion = "apartarme" | "mantener" | "ambos-estribor" | "no-navega";

export const NOMBRE_ACCION: Record<Accion, string> = {
  apartarme: "Me aparto yo, con antelación: normalmente caigo a estribor o reduzco",
  mantener: "Mantengo rumbo y velocidad, vigilando que el otro maniobre",
  "ambos-estribor": "Vuelta encontrada: los dos caemos a estribor",
  "no-navega": "No navega: lo dejo a una banda con buen margen",
};

export type ColorLuzNoche = "blanca" | "roja" | "verde";

/** Luz dibujada en una caja de 200×120: x de izquierda a derecha, y de arriba abajo. */
export interface LuzVista {
  color: ColorLuzNoche;
  x: number;
  y: number;
}

export interface Escenario {
  id: string;
  buque: TipoBuque;
  /** Dónde aparece respecto a tu proa. */
  donde: string;
  luces: LuzVista[];
  accion: Accion;
  explicacion: string;
}

export const ESCENARIOS: Escenario[] = [
  {
    id: "motor-proa",
    buque: "motor",
    donde: "justo por tu proa",
    luces: [
      { color: "blanca", x: 100, y: 30 },
      { color: "verde", x: 80, y: 80 },
      { color: "roja", x: 120, y: 80 },
    ],
    accion: "ambos-estribor",
    explicacion: "Ves su luz de tope y sus dos costados: viene de vuelta encontrada. Regla 14: los dos caéis a estribor.",
  },
  {
    id: "motor-babor-del-otro",
    buque: "motor",
    donde: "por tu amura de estribor",
    luces: [
      { color: "blanca", x: 85, y: 35 },
      { color: "roja", x: 105, y: 82 },
    ],
    accion: "apartarme",
    explicacion: "Ves su tope y su luz roja: cruza de estribor a babor por delante de ti. Regla 15: quien tiene al otro por estribor se aparta, y eres tú.",
  },
  {
    id: "motor-estribor-del-otro",
    buque: "motor",
    donde: "por tu amura de babor",
    luces: [
      { color: "blanca", x: 115, y: 35 },
      { color: "verde", x: 95, y: 82 },
    ],
    accion: "mantener",
    explicacion: "Ves su tope y su luz verde: cruza de babor a estribor. Él te tiene por su estribor y debe apartarse. Regla 17: mantienes rumbo y velocidad, atento por si no maniobra.",
  },
  {
    id: "motor-popa",
    buque: "motor",
    donde: "por tu proa, cada vez más cerca",
    luces: [{ color: "blanca", x: 100, y: 75 }],
    accion: "apartarme",
    explicacion: "Solo ves una luz blanca baja que se acerca: es su luz de alcance y lo vas alcanzando. Regla 13: el que alcanza se aparta.",
  },
  {
    id: "motor-grande-proa",
    buque: "motor-grande",
    donde: "justo por tu proa",
    luces: [
      { color: "blanca", x: 100, y: 15 },
      { color: "blanca", x: 100, y: 42 },
      { color: "verde", x: 82, y: 85 },
      { color: "roja", x: 118, y: 85 },
    ],
    accion: "ambos-estribor",
    explicacion: "Dos luces de tope en línea (la de popa más alta) y los dos costados: un buque grande de vuelta encontrada. Regla 14: los dos a estribor.",
  },
  {
    id: "velero-roja",
    buque: "velero",
    donde: "por tu amura de estribor",
    luces: [{ color: "roja", x: 100, y: 80 }],
    accion: "apartarme",
    explicacion: "Solo una luz de costado, sin luz de tope: es un velero. Regla 18: el buque de motor se aparta del de vela.",
  },
  {
    id: "velero-verde",
    buque: "velero",
    donde: "por tu amura de babor",
    luces: [{ color: "verde", x: 100, y: 80 }],
    accion: "apartarme",
    explicacion: "Velero visto por su estribor. Aunque venga por tu babor, la regla 18 manda: el buque de motor se aparta del de vela.",
  },
  {
    id: "sin-gobierno",
    buque: "sin-gobierno",
    donde: "por tu proa",
    luces: [
      { color: "roja", x: 100, y: 30 },
      { color: "roja", x: 100, y: 55 },
    ],
    accion: "apartarme",
    explicacion: "Dos rojas todo horizonte en vertical: sin gobierno («rojo sobre rojo, sin gobierno estoy yo»). Sin luces de costado, no tiene arrancada. Regla 18: te apartas.",
  },
  {
    id: "restringido",
    buque: "restringido",
    donde: "por tu amura de babor",
    luces: [
      { color: "roja", x: 90, y: 20 },
      { color: "blanca", x: 90, y: 42 },
      { color: "roja", x: 90, y: 64 },
      { color: "blanca", x: 120, y: 30 },
      { color: "verde", x: 105, y: 88 },
    ],
    accion: "apartarme",
    explicacion: "Roja, blanca y roja en vertical: capacidad de maniobra restringida, con arrancada (lleva tope y costado). Regla 18: te apartas aunque venga por tu babor.",
  },
  {
    id: "arrastre",
    buque: "arrastre",
    donde: "por tu amura de estribor",
    luces: [
      { color: "verde", x: 100, y: 35 },
      { color: "blanca", x: 100, y: 58 },
      { color: "roja", x: 112, y: 88 },
    ],
    accion: "apartarme",
    explicacion: "Verde sobre blanca: pesquero de arrastre («verde sobre blanco, arrastrando»), visto por su babor. Regla 18: te apartas de un buque pescando.",
  },
  {
    id: "pesca",
    buque: "pesca",
    donde: "por tu amura de babor",
    luces: [
      { color: "roja", x: 100, y: 35 },
      { color: "blanca", x: 100, y: 58 },
      { color: "verde", x: 88, y: 88 },
    ],
    accion: "apartarme",
    explicacion: "Roja sobre blanca: pescando, pero no al arrastre («rojo sobre blanco, pescando»). Regla 18: te apartas.",
  },
  {
    id: "fondeado",
    buque: "fondeado",
    donde: "por tu proa, sin moverse",
    luces: [{ color: "blanca", x: 100, y: 50 }],
    accion: "no-navega",
    explicacion: "Una sola blanca todo horizonte que no se mueve: un buque fondeado de menos de 50 m. No hay regla de cruce: lo dejas a una banda con margen.",
  },
  {
    id: "practico",
    buque: "practico",
    donde: "justo por tu proa",
    luces: [
      { color: "blanca", x: 100, y: 25 },
      { color: "roja", x: 100, y: 48 },
      { color: "verde", x: 82, y: 86 },
      { color: "roja", x: 118, y: 86 },
    ],
    accion: "ambos-estribor",
    explicacion: "Blanca sobre roja: práctico en servicio («blanco sobre rojo, práctico a bordo»), y con los dos costados viene de vuelta encontrada. Es un buque de motor: regla 14, los dos a estribor.",
  },
  {
    id: "varado",
    buque: "varado",
    donde: "por tu proa, sin moverse",
    luces: [
      { color: "blanca", x: 100, y: 20 },
      { color: "roja", x: 100, y: 48 },
      { color: "roja", x: 100, y: 72 },
    ],
    accion: "no-navega",
    explicacion: "Luz de fondeo y dos rojas en vertical: un buque varado. Ahí hay poco fondo: lo dejas bien separado.",
  },
];

// ---------- «Reconoce la marca»: ritmos de luz ----------

/** Un tramo del ritmo: color (o null si está apagada) y duración en milisegundos. */
export interface Fase {
  color: string | null;
  ms: number;
}

export interface Ritmo {
  /** Abreviatura de la carta, por ejemplo «Q(6)+LFl 15s». */
  abreviatura: string;
  fases: Fase[];
}

const R = "#ef4444";
const G = "#22c55e";
const W = "#ffffff";
const Y = "#facc15";
const B = "#3b82f6";

const destellos = (color: string, n: number, on: number, off: number): Fase[] =>
  Array.from({ length: n }, () => [
    { color, ms: on },
    { color: null, ms: off },
  ]).flat();

/** Completa con oscuridad hasta el periodo indicado. */
function periodo(fases: Fase[], ms: number): Fase[] {
  const usado = fases.reduce((s, f) => s + f.ms, 0);
  return usado < ms ? [...fases, { color: null, ms: ms - usado }] : fases;
}

/**
 * Ritmo de ejemplo de cada marca. Las laterales y la especial admiten varios ritmos; aquí se
 * usa uno habitual. Centelleo (Q): 60 por minuto.
 */
export const RITMOS: Record<Marca["id"], Ritmo> = {
  babor: { abreviatura: "Fl R 4s", fases: periodo(destellos(R, 1, 500, 0), 4000) },
  estribor: { abreviatura: "Fl G 4s", fases: periodo(destellos(G, 1, 500, 0), 4000) },
  "canal-estribor": { abreviatura: "Fl(2+1) R 10s", fases: periodo([...destellos(R, 2, 400, 600), { color: null, ms: 1000 }, ...destellos(R, 1, 400, 0)], 10000) },
  "canal-babor": { abreviatura: "Fl(2+1) G 10s", fases: periodo([...destellos(G, 2, 400, 600), { color: null, ms: 1000 }, ...destellos(G, 1, 400, 0)], 10000) },
  norte: { abreviatura: "Q", fases: destellos(W, 1, 400, 600) },
  este: { abreviatura: "Q(3) 10s", fases: periodo(destellos(W, 3, 400, 600), 10000) },
  sur: { abreviatura: "Q(6)+LFl 15s", fases: periodo([...destellos(W, 6, 400, 600), { color: W, ms: 2000 }], 15000) },
  oeste: { abreviatura: "Q(9) 15s", fases: periodo(destellos(W, 9, 400, 600), 15000) },
  "peligro-aislado": { abreviatura: "Fl(2) 5s", fases: periodo(destellos(W, 2, 500, 500), 5000) },
  "aguas-seguras": { abreviatura: "Iso 4s", fases: [{ color: W, ms: 2000 }, { color: null, ms: 2000 }] },
  especial: { abreviatura: "Fl Y 5s", fases: periodo(destellos(Y, 1, 500, 0), 5000) },
  "nuevo-peligro": { abreviatura: "Al.Bu.Y 3s", fases: [{ color: B, ms: 1000 }, { color: null, ms: 500 }, { color: Y, ms: 1000 }, { color: null, ms: 500 }] },
};

export const duracion = (r: Ritmo) => r.fases.reduce((s, f) => s + f.ms, 0);
export const encendidos = (r: Ritmo, color?: string) => r.fases.filter((f) => f.color !== null && (color === undefined || f.color === color)).length;

/** Marcas que se pueden preguntar de noche: todas menos las que solo se distinguen de día. */
export const MARCAS_NOCHE = MARCAS;

// ---------- Generador común ----------

export function aleatorio(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function barajar<T>(lista: readonly T[], rnd: () => number): T[] {
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Cuatro opciones: la correcta y tres distractores, barajadas. */
export function opciones<T>(correcta: T, todas: readonly T[], rnd: () => number): T[] {
  const otras = barajar(
    todas.filter((x) => x !== correcta),
    rnd,
  ).slice(0, 3);
  return barajar([correcta, ...otras], rnd);
}

// ---------- Deslizadores: marea y recorrido diario de un astro ----------


/**
 * Altura de la marea por el método del coseno, el mismo de lib/py/mareas.ts:
 * h = h1 + (h2 − h1) · (1 − cos(180° · t / D)) / 2.
 */
export function alturaMarea(h1: number, h2: number, duracionMin: number, tMin: number): number {
  const t = Math.max(0, Math.min(duracionMin, tMin));
  return h1 + (h2 - h1) * (1 - Math.cos((Math.PI * t) / duracionMin)) / 2;
}

export interface PuntoCielo {
  hL: number;
  altura: number;
  azimut: number;
}

/** Recorrido de un astro a lo largo del día (horario del lugar de 0° a 360°). */
export function trayectoriaDiurna(lat: number, dec: number, pasoGrados = 5): PuntoCielo[] {
  const r: PuntoCielo[] = [];
  for (let hL = 0; hL <= 360; hL += pasoGrados) {
    const { ae, z } = alturaYAzimut(lat, hL, dec);
    r.push({ hL, altura: ae, azimut: z });
  }
  return r;
}

/** Altura en el paso por el meridiano superior: 90° − |lat − dec|. */
export const alturaMeridiana = (lat: number, dec: number) => 90 - Math.abs(lat - dec);
