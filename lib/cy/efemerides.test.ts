import { describe, expect, it } from "vitest";
import { buscarEstrella, datosAstro, ESTRELLAS } from "./efemerides";
import { formatoHorario } from "./astros";
import { alturaYAzimut } from "./astronomica";
import { formatoAltura } from "./alturas";

const ut = (y: number, mo: number, d: number, h: number, mi: number, s: number) => Date.UTC(y, mo - 1, d, h, mi, s);
const hL = (hG: number, lon: number) => (((hG + lon) % 360) + 360) % 360;

// Ejercicios de estrellas de exámenes oficiales de Capitán de Yate (Junta de Andalucía).
// En todos, el valor calculado es una de las cuatro opciones del examen.
describe("efemérides: comprobadas con exámenes oficiales", () => {
  it("Algol, hG 06-04-2019 22:22:22 UT → 123° 09,4′", () => {
    expect(formatoHorario(datosAstro(buscarEstrella("Algol"), ut(2019, 4, 6, 22, 22, 22)).hG)).toBe("123° 09,4′");
  });
  it("Denebola, hG 04-07-2019 19:25:20 UT → 036° 20,4′ (±0,1′)", () => {
    const h = datosAstro(buscarEstrella("Denebola"), ut(2019, 7, 4, 19, 25, 20)).hG;
    expect(Math.abs(h - (36 + 20.4 / 60)) * 60).toBeLessThanOrEqual(0.15);
  });
  it("Fomalhaut, hL en Bora Bora 01-11-2024 22:15:11 UT → 238° 59,3′", () => {
    const h = datosAstro(buscarEstrella("Fomalhaut"), ut(2024, 11, 1, 22, 15, 11)).hG;
    expect(formatoHorario(hL(h, -(151 + 44.2 / 60)))).toBe("238° 59,3′");
  });
  it("Rigel, hL 23-11-2023 18:43:38 UT en 132° 32′ W → 131° 55,7′", () => {
    const h = datosAstro(buscarEstrella("Rigel"), ut(2023, 11, 23, 18, 43, 38)).hG;
    expect(formatoHorario(hL(h, -(132 + 32 / 60)))).toBe("131° 55,7′");
  });
  it("Mintaka, hL 07-08-2025 22:11:11 UT en 152° 02,2′ E → 358° 11,3′", () => {
    const h = datosAstro(buscarEstrella("Mintaka"), ut(2025, 8, 7, 22, 11, 11)).hG;
    expect(formatoHorario(hL(h, 152 + 2.2 / 60))).toBe("358° 11,3′");
  });
  it("Vindemiatrix, hL en Palermo 26-07-2026 21:52:38 UT → 090° 14,9′", () => {
    const h = datosAstro(buscarEstrella("Vindemiatrix"), ut(2026, 7, 26, 21, 52, 38)).hG;
    expect(formatoHorario(hL(h, 13 + 21.7 / 60))).toBe("090° 14,9′");
  });
  it("Alnitak, Z y ae desde 19° 48′ N 035° 27′ W, 26-09-2025 07:53:04 UT → Z 187°, ae 68° 06,9′", () => {
    const d = datosAstro(buscarEstrella("Alnitak"), ut(2025, 9, 26, 7, 53, 4));
    const r = alturaYAzimut(19.8, hL(d.hG, -35.45), d.dec);
    expect(Math.round(r.z)).toBe(187);
    expect(formatoAltura(r.ae)).toBe("68° 6,9′");
  });
  it("Acamar, Z y ae desde 27° 07,2′ S 109° 21,3′ W, 21-07-2022 08:08:08 UT → Z 128°, ae 14° 58,8′", () => {
    const d = datosAstro(buscarEstrella("Acamar"), ut(2022, 7, 21, 8, 8, 8));
    const r = alturaYAzimut(-(27 + 7.2 / 60), hL(d.hG, -(109 + 21.3 / 60)), d.dec);
    expect(Math.round(r.z)).toBe(128);
    expect(formatoAltura(r.ae)).toBe("14° 58,8′");
  });
});

describe("efemérides: Sol", () => {
  it("declinación del Sol 10-10-2024 15:38 UT ≈ 6° 59,7′ S (meridiana del examen de Euskadi)", () => {
    const d = datosAstro("sol", ut(2024, 10, 10, 15, 38, 0));
    expect(d.dec * 60).toBeCloseTo(-(6 * 60 + 59.7), 0);
    expect(d.sd).toBeGreaterThan(15.9);
    expect(d.sd).toBeLessThan(16.1);
  });
  it("equinoccio: declinación casi nula", () => {
    expect(Math.abs(datosAstro("sol", ut(2026, 3, 20, 14, 46, 0)).dec)).toBeLessThan(0.05);
  });
  it("solsticio de junio: declinación ≈ 23° 26′ N", () => {
    expect(datosAstro("sol", ut(2026, 6, 21, 8, 24, 0)).dec).toBeCloseTo(23.44, 1);
  });
  it("al mediodía de Greenwich el hG del Sol ronda los 0°/360° (± ecuación de tiempo)", () => {
    const h = datosAstro("sol", ut(2026, 11, 18, 12, 0, 0)).hG;
    const desvio = Math.abs(((h + 180) % 360) - 180);
    expect(desvio).toBeLessThan(4.5); // la ecuación de tiempo nunca pasa de ~16,5 min = 4,1°
  });
});

describe("catálogo", () => {
  it("contiene la Polar y nombres en castellano", () => {
    expect(buscarEstrella("Polar").nombre).toBe("Polaris");
    expect(buscarEstrella("sirio").nombre).toBe("Sirius");
    expect(buscarEstrella("Adhara").nombre).toBe("Adara");
    expect(ESTRELLAS.length).toBeGreaterThan(100);
  });
  it("estrella desconocida", () => {
    expect(() => buscarEstrella("Tatooine")).toThrow(/No encuentro/);
  });
});
