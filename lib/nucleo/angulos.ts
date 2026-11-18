/**
 * Ángulos náuticos: normalización, lectura, formato y conversiones.
 *
 * Criterio de signos (el del PER y titulaciones superiores):
 *   Este (E, NE) = positivo   ·   Oeste (W, NW) = negativo
 * Para el abatimiento: viento por babor = positivo · por estribor = negativo.
 */

export class EntradaInvalida extends Error {}

/** Lleva cualquier ángulo al intervalo [0, 360). */
export function normalizar360(grados: number): number {
  const r = ((grados % 360) + 360) % 360;
  // Evita 359,9999999 por ruido de coma flotante y el -0.
  const limpio = Math.abs(r - 360) < 1e-9 ? 0 : r;
  return Object.is(limpio, -0) ? 0 : limpio;
}

/** Lleva un ángulo al intervalo (-180, 180]: útil para diferencias de rumbo. */
export function normalizar180(grados: number): number {
  const r = normalizar360(grados);
  return r > 180 ? r - 360 : r;
}

/** Redondea al décimo de minuto para quitar ruido sin perder precisión náutica. */
export function redondearGrados(grados: number): number {
  return Math.round(grados * 600) / 600;
}

/**
 * Lee un ángulo escrito de muchas formas:
 *   "45"  "45,5"  "45.5"  "45°30'"  "45 30"  "45º 30,5'"  "-4°15'"
 * Devuelve grados decimales. El signo solo se admite delante.
 */
export function leerAngulo(texto: string): number {
  const limpio = texto.trim().replace(/,/g, ".").replace(/[º°]/g, " ").replace(/['′’]/g, " ");
  if (limpio === "") throw new EntradaInvalida("Falta el valor");

  const m = limpio.match(/^([+-])?\s*(\d+(?:\.\d+)?)(?:\s+(\d+(?:\.\d+)?))?\s*$/);
  if (!m) throw new EntradaInvalida(`No entiendo el ángulo «${texto}»`);

  const [, signo, g, min] = m;
  const grados = parseFloat(g);
  const minutos = min !== undefined ? parseFloat(min) : 0;

  if (min !== undefined && !Number.isInteger(grados)) {
    throw new EntradaInvalida("Si escribes minutos, los grados deben ser enteros");
  }
  if (minutos >= 60) throw new EntradaInvalida("Los minutos deben ser menores que 60");

  const valor = grados + minutos / 60;
  return signo === "-" ? -valor : valor;
}

/** Lee un rumbo o demora (0 a 360). */
export function leerRumbo(texto: string): number {
  const v = leerAngulo(texto);
  if (v < 0 || v > 360) throw new EntradaInvalida("Un rumbo debe estar entre 0° y 360°");
  return normalizar360(v);
}

/** Separa grados decimales en grados y minutos (con un decimal de minuto). */
export function aGradosMinutos(grados: number): { g: number; m: number } {
  const abs = Math.abs(redondearGrados(grados));
  let g = Math.floor(abs);
  let m = Math.round((abs - g) * 600) / 10;
  if (m >= 60) {
    g += 1;
    m = 0;
  }
  return { g, m };
}

function minutosTexto(m: number): string {
  return m === 0 ? "" : ` ${String(m).replace(".", ",")}′`;
}

/** Formatea un rumbo con tres cifras: 045°, 312° 30′, 000°. */
export function formatoRumbo(grados: number): string {
  const { g, m } = aGradosMinutos(normalizar360(grados));
  const gg = g === 360 ? 0 : g;
  return `${String(gg).padStart(3, "0")}°${minutosTexto(m)}`;
}

/** Formatea un ángulo con signo como E/W: −1,5 → «1° 30′ W». */
export function formatoEW(grados: number): string {
  const r = redondearGrados(grados);
  if (r === 0) return "0°";
  const { g, m } = aGradosMinutos(r);
  return `${g}°${minutosTexto(m)} ${r > 0 ? "E" : "W"}`;
}

/** Formatea un ángulo con signo explícito: +2° 27′ / −1° 48′. */
export function formatoSigno(grados: number): string {
  const r = redondearGrados(grados);
  if (r === 0) return "0°";
  const { g, m } = aGradosMinutos(r);
  return `${r > 0 ? "+" : "−"}${g}°${minutosTexto(m)}`;
}

/** Abatimiento con su banda: +5 → «5° (viento por babor)». */
export function formatoAbatimiento(grados: number): string {
  const r = redondearGrados(grados);
  if (r === 0) return "0°";
  const { g, m } = aGradosMinutos(r);
  return `${r > 0 ? "+" : "−"}${g}°${minutosTexto(m)} (viento por ${r > 0 ? "babor" : "estribor"})`;
}

// ---------- Rumbos cuadrantales ----------

export type Cuadrantal = { desde: "N" | "S"; grados: number; hacia: "E" | "W" };

/** 135° → S45E · 300° → N60W */
export function aCuadrantal(rumbo: number): Cuadrantal {
  const r = normalizar360(rumbo);
  if (r <= 90) return { desde: "N", grados: r, hacia: "E" };
  if (r <= 180) return { desde: "S", grados: 180 - r, hacia: "E" };
  if (r <= 270) return { desde: "S", grados: r - 180, hacia: "W" };
  return { desde: "N", grados: 360 - r, hacia: "W" };
}

export function desdeCuadrantal(c: Cuadrantal): number {
  if (c.grados < 0 || c.grados > 90) throw new EntradaInvalida("En cuadrantal, los grados van de 0 a 90");
  if (c.desde === "N") return normalizar360(c.hacia === "E" ? c.grados : 360 - c.grados);
  return normalizar360(c.hacia === "E" ? 180 - c.grados : 180 + c.grados);
}

export function formatoCuadrantal(c: Cuadrantal): string {
  const { g, m } = aGradosMinutos(c.grados);
  return `${c.desde} ${g}°${minutosTexto(m)} ${c.hacia}`;
}

/** Lee «N45E», «s 30 w», «N 45°30' E». */
export function leerCuadrantal(texto: string): Cuadrantal {
  const m = texto.trim().toUpperCase().match(/^([NS])\s*(.+?)\s*([EW])$/);
  if (!m) throw new EntradaInvalida("Formato cuadrantal: N45E, S30W…");
  return { desde: m[1] as "N" | "S", grados: leerAngulo(m[2]), hacia: m[3] as "E" | "W" };
}

// ---------- Latitud y longitud ----------

/** Formatea una latitud: 28.4667 → «28° 28′ N». */
export function formatoLatitud(grados: number): string {
  const { g, m } = aGradosMinutos(grados);
  return `${g}°${minutosTexto(m) || " 0′"} ${grados >= 0 ? "N" : "S"}`;
}

/** Formatea una longitud: -16.25 → «016° 15′ W». */
export function formatoLongitud(grados: number): string {
  const { g, m } = aGradosMinutos(grados);
  return `${String(g).padStart(3, "0")}°${minutosTexto(m) || " 0′"} ${grados >= 0 ? "E" : "W"}`;
}
