import { describe, expect, it } from "vitest";
import {
  fenomenosSol,
  formatoHoraMinuto,
  formatoHoraUT,
  incremento,
  paginaAlmanaque,
  tablaIncrementos,
  type Fenomeno,
} from "./almanaque";

const dia = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d);
const gm = (g: number, m: number) => g + m / 60;
/** Diferencia angular en minutos de arco. */
const difMin = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180) * 60;
/** Minutos desde la medianoche UT del día. */
const minutos = (f: Fenomeno, dia0: number) => {
  if ("no" in f) throw new Error(`Sin fenómeno: ${f.no}`);
  return (f.ms - dia0) / 60_000;
};
const hm = (h: number, m: number) => h * 60 + m;

// Valores de referencia del Almanaque Náutico 2026 (nauticalalmanac.it). El impreso da las
// horas de los fenómenos al minuto y los ángulos a la décima de minuto.
describe("página del día: Almanaque Náutico 2026", () => {
  const casos = [
    { f: dia(2026, 1, 1), hG0: gm(179, 10.0), dec0: -gm(23, 1.0), hG13: gm(14, 6.2), dec13: -gm(22, 58.4), aries0: gm(100, 39.7) },
    { f: dia(2026, 6, 21), hG0: gm(179, 34.4), dec0: gm(23, 26.3), hG13: gm(14, 32.6), dec13: gm(23, 26.3), aries0: gm(269, 12.5) },
    { f: dia(2026, 11, 18), hG0: gm(183, 44.1), dec0: -gm(19, 10.3), hG13: gm(18, 42.4), dec13: -gm(19, 18.1), aries0: gm(57, 3.4) },
  ];
  for (const c of casos) {
    it(`tabla horaria del ${new Date(c.f).toISOString().slice(0, 10)} (±0,1′)`, () => {
      const p = paginaAlmanaque(c.f);
      expect(p.filas).toHaveLength(25);
      expect(difMin(p.filas[0].hGSol, c.hG0)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(p.filas[0].decSol - c.dec0) * 60).toBeLessThanOrEqual(0.1);
      expect(difMin(p.filas[13].hGSol, c.hG13)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(p.filas[13].decSol - c.dec13) * 60).toBeLessThanOrEqual(0.1);
      expect(difMin(p.filas[0].hGAries, c.aries0)).toBeLessThanOrEqual(0.1);
    });
  }

  it("paso del Sol por el meridiano de Greenwich al segundo", () => {
    const pmg: [number, string][] = [
      [dia(2026, 1, 1), "12 h 03 m 34 s"],
      [dia(2026, 6, 21), "12 h 01 m 49 s"],
      [dia(2026, 9, 10), "11 h 56 m 59 s"],
      [dia(2026, 11, 18), "11 h 45 m 10 s"],
      [dia(2026, 12, 31), "12 h 02 m 58 s"],
    ];
    for (const [f, esperado] of pmg) expect(formatoHoraUT(paginaAlmanaque(f).pmg)).toBe(esperado);
  });

  it("semidiámetro, v y d del Sol con valores razonables", () => {
    const p = paginaAlmanaque(dia(2026, 1, 1));
    expect(p.sd).toBeGreaterThan(16.2); // perihelio: el Sol se ve más grande
    expect(p.v).toBeLessThan(0); // en enero el Sol «atrasa»: hG crece menos de 15°/h
    expect(p.d).toBeGreaterThan(0); // la declinación sur disminuye
    expect(p.estrellas.length).toBeGreaterThan(50);
  });
});

describe("salida, puesta y crepúsculos: Almanaque Náutico 2026 (±1 min)", () => {
  // [latitud, náutico, civil, salida, puesta, fin civil, fin náutico]
  const tabla: { f: number; filas: [number, ...number[]][] }[] = [
    {
      f: dia(2026, 11, 18),
      filas: [
        [52, hm(6, 6), hm(6, 47), hm(7, 25), hm(16, 5), hm(16, 43), hm(17, 24)],
        [45, hm(5, 54), hm(6, 30), hm(7, 2), hm(16, 29), hm(17, 1), hm(17, 36)],
        [0, hm(4, 54), hm(5, 20), hm(5, 42), hm(17, 49), hm(18, 11), hm(18, 36)],
        [-40, hm(3, 23), hm(4, 1), hm(4, 32), hm(18, 58), hm(19, 29), hm(20, 7)],
      ],
    },
    {
      f: dia(2026, 6, 21),
      filas: [
        [52, hm(1, 32), hm(2, 51)],
        [45, hm(2, 46), hm(3, 36)],
        [-40, hm(6, 17), hm(6, 51)],
      ],
    },
  ];
  for (const { f, filas } of tabla) {
    for (const [lat, ...esperado] of filas) {
      it(`${new Date(f).toISOString().slice(0, 10)} en ${lat}°`, () => {
        const r = fenomenosSol(f, lat);
        const calc = [r.inicioCrepusculoNautico, r.inicioCrepusculoCivil, r.salida, r.puesta, r.finCrepusculoCivil, r.finCrepusculoNautico];
        esperado.forEach((e, i) => expect(Math.abs(minutos(calc[i], f) - e)).toBeLessThanOrEqual(1));
      });
    }
  }

  it("en latitudes altas en verano no hay crepúsculo náutico", () => {
    const r = fenomenosSol(dia(2026, 6, 21), 60);
    expect(r.inicioCrepusculoNautico).toEqual({ no: "siempre-encima" });
    expect(formatoHoraMinuto(r.inicioCrepusculoNautico, dia(2026, 6, 21))).toBe("Sol siempre por encima");
    expect("ms" in r.salida).toBe(true);
  });
});

describe("fenómenos para una situación: hoja de cálculo 2027 (±0,5 min)", () => {
  it("01-01-2027 en 45° 45′ N 010° 10′ W", () => {
    const f = dia(2027, 1, 1);
    const r = fenomenosSol(f, gm(45, 45), -gm(10, 10));
    const esperado = [hm(7, 9.82), hm(7, 47.46), hm(8, 21.68), hm(17, 6.53), hm(17, 40.75), hm(18, 18.39)];
    const calc = [r.inicioCrepusculoNautico, r.inicioCrepusculoCivil, r.salida, r.puesta, r.finCrepusculoCivil, r.finCrepusculoNautico];
    esperado.forEach((e, i) => expect(Math.abs(minutos(calc[i], f) - e)).toBeLessThanOrEqual(0.5));
    expect(formatoHoraUT(paginaAlmanaque(f).pmg)).toBe("12 h 03 m 26 s");
  });
});

describe("tabla de incrementos", () => {
  it("coincide con la tabla impresa", () => {
    expect(incremento("sol", 44, 0) * 60).toBeCloseTo(11 * 60, 6);
    expect(Math.round(incremento("aries", 44, 0) * 600) / 10).toBe(661.8); // 11° 01,8′
    expect(Math.round(incremento("aries", 56, 9) * 600) / 10).toBe(844.6); // 14° 04,6′
    expect(Math.round(incremento("aries", 2, 0) * 600) / 10).toBe(30.1); // 0° 30,1′
  });
  it("una fila por segundo", () => {
    const t = tablaIncrementos(1);
    expect(t).toHaveLength(60);
    expect(t[0].sol).toBeCloseTo(0.25, 9);
    expect(t[59].s).toBe(59);
  });
  it("rechaza minutos fuera de rango", () => {
    expect(() => incremento("sol", 60)).toThrow();
  });
});
