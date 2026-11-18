import { describe, expect, it } from "vitest";
import { ortoYOcaso } from "./luz";
import { autonomia, comprobarAlcance, NORMAS_MOTO } from "./moto";

const hhmm = (ms: number) => new Date(ms).toISOString().slice(11, 16);

// Referencia: PyEphem (horizonte −0° 34′, limbo superior). Diferencias medidas < 3 s.
describe("orto y ocaso", () => {
  it("Santa Cruz de Tenerife, 18-11-2026 (UT)", () => {
    const r = ortoYOcaso(Date.UTC(2026, 10, 18), { lat: 28.4636, lon: -16.2518 }, 0);
    expect(hhmm(r.orto!)).toBe("07:29");
    expect(hhmm(r.ocaso!)).toBe("18:10");
    // Ventana de las motos náuticas: orto + 1 h a ocaso − 1 h
    expect(hhmm(r.motoDesde!)).toBe("08:29");
    expect(hhmm(r.motoHasta!)).toBe("17:10");
  });
  it("Donostia, solsticio de invierno", () => {
    const r = ortoYOcaso(Date.UTC(2026, 11, 21), { lat: 43.3183, lon: -1.9812 }, 1);
    expect(hhmm(r.orto!)).toBe("07:36");
    expect(hhmm(r.ocaso!)).toBe("16:35");
    expect(r.horasDeLuz).toBeCloseTo(8.97, 1);
  });
  it("Palma, 1 de agosto, con la hora oficial de verano", () => {
    const r = ortoYOcaso(Date.UTC(2026, 7, 1), { lat: 39.5696, lon: 2.6502 }, 2);
    expect(hhmm(r.orto!)).toBe("04:48");
    expect(hhmm(r.ocaso!)).toBe("19:02");
  });
  it("sin orto en la noche polar", () => {
    const r = ortoYOcaso(Date.UTC(2026, 11, 21), { lat: 78, lon: 15 }, 1);
    expect(r.orto).toBeUndefined();
    expect(r.motoDesde).toBeUndefined();
  });
});

describe("alcance de la licencia", () => {
  const puerto = { lat: 28 + 28 / 60, lon: -(16 + 14 / 60) };
  it("dentro de 2 millas", () => {
    const r = comprobarAlcance(puerto, { lat: puerto.lat + 1.5 / 60, lon: puerto.lon }, 20);
    expect(r.distancia).toBeCloseTo(1.5, 2);
    expect(r.dentro).toBe(true);
    expect(r.pasos.join(" ")).toMatch(/Ida y vuelta/);
  });
  it("fuera de 2 millas", () => {
    const r = comprobarAlcance(puerto, { lat: puerto.lat - 2.5 / 60, lon: puerto.lon });
    expect(r.dentro).toBe(false);
    expect(r.margen).toBeCloseTo(-0.5, 2);
  });
});

describe("autonomía", () => {
  it("regla del tercio", () => {
    const r = autonomia({ deposito: 60, consumo: 20, velocidad: 25 });
    expect(r.horasTotales).toBe(3);
    expect(r.litrosReserva).toBe(20);
    expect(r.horasIda).toBe(1);
    expect(r.radio).toBe(25);
  });
  it("reserva distinta y errores", () => {
    expect(autonomia({ deposito: 50, consumo: 25, velocidad: 20, reserva: 0.2 }).radio).toBeCloseTo(16);
    expect(() => autonomia({ deposito: 0, consumo: 10, velocidad: 20 })).toThrow();
    expect(() => autonomia({ deposito: 50, consumo: 10, velocidad: 20, reserva: 1 })).toThrow();
  });
});

describe("normas", () => {
  it("cada norma cita su fuente oficial", () => {
    for (const n of NORMAS_MOTO) {
      expect(n.fuente).toMatch(/Real Decreto|Capitanía/);
      if (n.fuente.startsWith("Real Decreto")) expect(n.url).toMatch(/^https:\/\/www\.boe\.es\//);
      else expect(n.url).toBe("");
    }
  });
});
