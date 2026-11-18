/**
 * Navegación ortodrómica (por círculo máximo).
 *
 *   cos D  = sen l1 · sen l2 + cos l1 · cos l2 · cos Δλ
 *   tg Ri  = sen Δλ · cos l2 ÷ (cos l1 · sen l2 − sen l1 · cos l2 · cos Δλ)
 *   Vértice: cos lv = cos l1 · sen Ri
 */
import { EntradaInvalida, aCuadrantal, formatoCuadrantal, formatoLatitud, formatoLongitud, formatoRumbo, normalizar360 } from "../nucleo/angulos";
import { diferenciaLongitud, type Posicion } from "../nucleo/coordenadas";
import { formatoNumero } from "../nucleo/unidades";
import type { Resultado } from "../per/correccion";

const RAD = Math.PI / 180;
const sin = (g: number) => Math.sin(g * RAD);
const cos = (g: number) => Math.cos(g * RAD);

export interface Vertice extends Posicion {
  /** Si el vértice queda entre la salida y la llegada. */
  enLaDerrota: boolean;
}

export function ortodromica(
  a: Posicion,
  b: Posicion,
  puntosIntermedios = 0,
): Resultado & {
  distancia: number;
  rumboInicial: number;
  rumboFinal: number;
  vertice: Vertice;
  intermedios: Posicion[];
} {
  const dLon = diferenciaLongitud(a.lon, b.lon);
  const cosD = sin(a.lat) * sin(b.lat) + cos(a.lat) * cos(b.lat) * cos(dLon);
  const dGrados = Math.acos(Math.max(-1, Math.min(1, cosD))) / RAD;
  if (dGrados < 1e-9) throw new EntradaInvalida("La salida y la llegada son la misma posición");
  if (Math.abs(dGrados - 180) < 1e-6) throw new EntradaInvalida("Puntos antípodas: hay infinitas ortodrómicas");
  const distancia = dGrados * 60;

  const y = sin(dLon) * cos(b.lat);
  const x = cos(a.lat) * sin(b.lat) - sin(a.lat) * cos(b.lat) * cos(dLon);
  const rumboInicial = normalizar360(Math.atan2(y, x) / RAD);

  // Rumbo final: el inicial del camino inverso, más 180°.
  const yf = sin(-dLon) * cos(a.lat);
  const xf = cos(b.lat) * sin(a.lat) - sin(b.lat) * cos(a.lat) * cos(dLon);
  const rumboFinal = normalizar360(Math.atan2(yf, xf) / RAD + 180);

  // Vectores 3D de los puntos y del polo del círculo máximo.
  const v = (p: Posicion) => [cos(p.lat) * cos(p.lon), cos(p.lat) * sin(p.lon), sin(p.lat)];
  const va = v(a);
  const vb = v(b);
  const n = [va[1] * vb[2] - va[2] * vb[1], va[2] * vb[0] - va[0] * vb[2], va[0] * vb[1] - va[1] * vb[0]];
  const nn = Math.hypot(n[0], n[1], n[2]);
  const pn = n.map((c) => c / nn);

  // Vértice: el punto del círculo máximo más cercano al polo (proyección del eje N sobre su plano).
  // Se elige el vértice hacia el que arranca la derrota (N si el rumbo inicial va al N).
  const haciaNorte = cos(rumboInicial) >= 0;
  let vv = [-pn[2] * pn[0], -pn[2] * pn[1], 1 - pn[2] * pn[2]];
  const nv = Math.hypot(vv[0], vv[1], vv[2]);
  vv = nv < 1e-12 ? [1, 0, 0] : vv.map((c) => ((haciaNorte ? 1 : -1) * c) / nv);
  const aPos = (w: number[]): Posicion => ({ lat: Math.atan2(w[2], Math.hypot(w[0], w[1])) / RAD, lon: Math.atan2(w[1], w[0]) / RAD });
  const angulo = (p: number[], q: number[]) => Math.acos(Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]))) / RAD;
  const enLaDerrota = Math.abs(angulo(va, vv) + angulo(vv, vb) - dGrados) < 1e-6;
  const vertice: Vertice = { ...aPos(vv), enLaDerrota };

  // Puntos intermedios por interpolación esférica.
  const intermedios: Posicion[] = [];
  const ang = dGrados * RAD;
  for (let k = 1; k <= puntosIntermedios; k++) {
    const f = k / (puntosIntermedios + 1);
    const s1 = Math.sin((1 - f) * ang) / Math.sin(ang);
    const s2 = Math.sin(f * ang) / Math.sin(ang);
    const [X, Y, Z] = [0, 1, 2].map((i) => s1 * va[i] + s2 * vb[i]);
    intermedios.push({ lat: Math.atan2(Z, Math.hypot(X, Y)) / RAD, lon: Math.atan2(Y, X) / RAD });
  }

  const pasos = [
    `Δλ = ${formatoNumero(Math.abs(dLon), 4)}° ${dLon >= 0 ? "E" : "W"}${Math.abs(b.lon - a.lon) > 180 ? " (cruzando el meridiano de 180°)" : ""}`,
    "cos D = sen l1 · sen l2 + cos l1 · cos l2 · cos Δλ",
    `cos D = ${formatoNumero(sin(a.lat), 5)} · ${formatoNumero(sin(b.lat), 5)} + ${formatoNumero(cos(a.lat), 5)} · ${formatoNumero(cos(b.lat), 5)} · ${formatoNumero(cos(dLon), 5)} = ${formatoNumero(cosD, 5)}`,
    `D = ${formatoNumero(dGrados, 4)}° × 60 = ${formatoNumero(distancia, 1)} millas`,
    "tg Ri = sen Δλ · cos l2 ÷ (cos l1 · sen l2 − sen l1 · cos l2 · cos Δλ)",
    `tg Ri = ${formatoNumero(y, 5)} ÷ ${formatoNumero(x, 5)} → Ri = ${formatoCuadrantal(aCuadrantal(rumboInicial))} = ${formatoRumbo(rumboInicial)}`,
    `Rumbo final = ${formatoRumbo(rumboFinal)}`,
    `Vértice: cos lv = cos l1 · |sen Ri| → lv = ${formatoNumero(Math.acos(Math.min(1, Math.abs(sin(rumboInicial) * cos(a.lat)))) / RAD, 3)}°; vértice en ${formatoLatitud(vertice.lat)} ${formatoLongitud(vertice.lon)}${vertice.enLaDerrota ? "" : " (fuera del tramo navegado)"}`,
  ];
  return { distancia, rumboInicial, rumboFinal, vertice, intermedios, pasos };
}
