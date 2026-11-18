import { describe, expect, it } from "vitest";
import { estima, rumboYDistancia } from "./estima";
import { formatoHoraMin, horaParaSonda, prepararTabla, sondaAHora, type Extremo } from "./mareas";
import { demoraYDistancia, demorasNoSimultaneas, dosDemoras, pasarADistancia } from "./situacion";
import { llegarAHora } from "./llegada";
import { leerHora } from "../nucleo/unidades";
import { aPlano, diferenciaLongitud, type Posicion } from "../nucleo/coordenadas";
import { aPolar } from "../nucleo/vectores";

const gm = (g: number, m: number) => g + m / 60;
const ext = (hora: string, altura: number): Extremo => ({ minutos: leerHora(hora), altura });

// Tabla de mareas de Cádiz del 12-11-2020 usada en el examen oficial de Patrón de Yate
// (3.ª convocatoria 2020, Junta de Andalucía). Horas UT.
const CADIZ_2020 = [ext("05:49", 0.9), ext("12:01", 3.3), ext("18:19", 0.6), ext("00:30", 3.33)];

describe("mareas: comprobado con el examen oficial", () => {
  it("sonda en un bajo de 1,90 m a las 08:25 oficiales, adelanto +1 h → 3,17 m", () => {
    const r = sondaAHora(CADIZ_2020, leerHora("08:25"), 1, 1.9);
    expect(r.sonda).toBeCloseTo(3.17, 2);
  });

  it("hora para tener 3,30 m sobre un bajo de 2,15 m entre la 1.ª pleamar y la 2.ª bajamar → 17:26", () => {
    const r = horaParaSonda(CADIZ_2020, 3.3, 1, 2.15);
    const entrePmYBm = r.soluciones.find((s) => s.intervalo === 1)!;
    expect(entrePmYBm.sube).toBe(false);
    expect(formatoHoraMin(entrePmYBm.horaOficial)).toBe("17:26");
  });

  it("devuelve una solución por cada intervalo en que se alcanza la altura", () => {
    const r = horaParaSonda(CADIZ_2020, 3.3, 1, 2.15);
    expect(r.soluciones.map((s) => s.intervalo)).toEqual([0, 1, 2]);
  });
});

describe("mareas: casos generales", () => {
  it("en los extremos la altura es la de la tabla", () => {
    expect(sondaAHora(CADIZ_2020, leerHora("06:49"), 1, 0).altura).toBeCloseTo(0.9);
    expect(sondaAHora(CADIZ_2020, leerHora("13:01"), 1, 0).altura).toBeCloseTo(3.3);
  });

  it("a mitad de intervalo la altura es la media", () => {
    const r = sondaAHora([ext("06:00", 1), ext("12:00", 3)], leerHora("09:00"), 0, 0);
    expect(r.altura).toBeCloseTo(2);
  });

  it("entiende la pleamar pasada la medianoche", () => {
    const t = prepararTabla(CADIZ_2020);
    expect(t[3].minutos).toBe(1440 + 30);
    // 01:00 oficial del día siguiente = 00:00 UT, entre la bajamar de 18:19 y la pleamar de 00:30
    const r = sondaAHora(CADIZ_2020, leerHora("01:00"), 1, 0);
    expect(r.altura).toBeGreaterThan(3.2);
  });

  it("errores claros", () => {
    expect(() => sondaAHora(CADIZ_2020, leerHora("05:00"), 1, 0)).toThrow(/fuera de la tabla/);
    expect(() => horaParaSonda(CADIZ_2020, 10, 1, 2)).toThrow(/nunca alcanza/);
    expect(() => prepararTabla([ext("06:00", 1)])).toThrow(/al menos dos/);
    expect(() => prepararTabla([ext("06:00", 1), ext("18:00", 3)])).toThrow(/6 horas/);
  });
});

describe("loxodrómica: comprobado con el examen oficial", () => {
  it("de 38°20′N 179°05′E a 35°42′N 178°38′W, cruzando el meridiano de 180° → 145,5°", () => {
    const r = rumboYDistancia({ lat: gm(38, 20), lon: gm(179, 5) }, { lat: gm(35, 42), lon: -gm(178, 38) });
    expect(Math.round(r.rumbo * 2) / 2).toBe(145.5);
    expect(r.dLon).toBeCloseTo(137, 0); // hacia el Este
    expect(r.pasos.join(" ")).toMatch(/meridiano de 180°/);
  });
});

describe("loxodrómica y estima", () => {
  it("rumbos cardinales", () => {
    expect(rumboYDistancia({ lat: 36, lon: -6 }, { lat: 37, lon: -6 }).rumbo).toBeCloseTo(0);
    const e = rumboYDistancia({ lat: 0, lon: 0 }, { lat: 0, lon: 1 });
    expect(e.rumbo).toBeCloseTo(90);
    expect(e.distancia).toBeCloseTo(60);
  });

  it("estima y loxodrómica son inversas", () => {
    const salida = { lat: gm(36, 0), lon: -gm(5, 10) };
    const e = estima(salida, [{ rumbo: 125, distancia: 18 }]);
    const r = rumboYDistancia(salida, e.llegada);
    expect(r.rumbo).toBeCloseTo(125, 1);
    expect(r.distancia).toBeCloseTo(18, 1);
  });

  it("estima cruzando el meridiano de 180° hacia el Este", () => {
    const e = estima({ lat: 15, lon: gm(179, 15) }, [{ rumbo: 90, distancia: 60 }]);
    expect(e.llegada.lat).toBeCloseTo(15);
    expect(e.llegada.lon).toBeLessThan(0); // ahora longitud W
    // Δλ = 60 ÷ cos 15° = 62,1′ → 179° 15′ E + 62,1′ = 180° 17,1′ E = 179° 42,9′ W
    const lonEsperada = 179.25 + 60 / Math.cos((15 * Math.PI) / 180) / 60 - 360;
    expect(e.llegada.lon).toBeCloseTo(lonEsperada, 4);
    expect(e.llegada.lon).toBeCloseTo(-gm(179, 42.9), 2);
  });

  it("estima compuesta: los tramos se suman", () => {
    const salida = { lat: 36, lon: -6 };
    const compuesta = estima(salida, [
      { rumbo: 0, distancia: 10 },
      { rumbo: 90, distancia: 10 },
    ]);
    expect(compuesta.rumboDirecto).toBeCloseTo(45);
    expect(compuesta.distanciaDirecta).toBeCloseTo(Math.SQRT2 * 10);
  });

  it("la corriente se trata como un tramo más", () => {
    const sinCorriente = estima({ lat: 36, lon: -6 }, [{ rumbo: 0, distancia: 12 }]);
    const conCorriente = estima({ lat: 36, lon: -6 }, [
      { rumbo: 0, distancia: 12 },
      { rumbo: 180, distancia: 2, nombre: "Corriente" },
    ]);
    expect((sinCorriente.llegada.lat - conCorriente.llegada.lat) * 60).toBeCloseTo(2);
  });

  it("diferencia de longitud por el camino corto", () => {
    expect(diferenciaLongitud(179, -179)).toBeCloseTo(2);
    expect(diferenciaLongitud(-179, 179)).toBeCloseTo(-2);
  });
});

// Situación sintética para comprobar los cálculos de situación: un barco en P
// y dos faros con posiciones conocidas; se calculan las demoras y se vuelve a P.
const P: Posicion = { lat: gm(35, 55), lon: -gm(5, 40) };
const F1: Posicion = { lat: gm(36, 1), lon: -gm(5, 36) };
const F2: Posicion = { lat: gm(35, 50), lon: -gm(5, 30) };
const demoraDesde = (desde: Posicion, a: Posicion) => aPolar(aPlano(a, desde));

describe("situación", () => {
  it("por dos demoras simultáneas", () => {
    const r = dosDemoras(F1, demoraDesde(P, F1).rumbo, F2, demoraDesde(P, F2).rumbo);
    expect(r.posicion.lat).toBeCloseTo(P.lat, 3);
    expect(r.posicion.lon).toBeCloseTo(P.lon, 3);
  });

  it("por demora y distancia", () => {
    const { rumbo, modulo } = demoraDesde(P, F1);
    const r = demoraYDistancia(F1, rumbo, modulo);
    expect(r.posicion.lat).toBeCloseTo(P.lat, 3);
    expect(r.posicion.lon).toBeCloseTo(P.lon, 3);
  });

  it("por dos demoras no simultáneas (traslado de demora)", () => {
    // A las 10:00 en P0, navegamos al 045° a 6 nudos durante 1 h → P.
    const P0 = estima(P, [{ rumbo: 225, distancia: 6 }]).llegada;
    const dv1 = demoraDesde(P0, F1).rumbo;
    const dv2 = demoraDesde(P, F2).rumbo;
    const r = demorasNoSimultaneas(F1, dv1, F2, dv2, 45, 6, 1);
    expect(r.posicion.lat).toBeCloseTo(P.lat, 2);
    expect(r.posicion.lon).toBeCloseTo(P.lon, 2);
  });

  it("dos demoras al mismo faro", () => {
    const P0 = estima(P, [{ rumbo: 270, distancia: 4 }]).llegada; // venimos del W
    const r = demorasNoSimultaneas(F1, demoraDesde(P0, F1).rumbo, F1, demoraDesde(P, F1).rumbo, 90, 8, 0.5);
    expect(r.posicion.lat).toBeCloseTo(P.lat, 2);
    expect(r.posicion.lon).toBeCloseTo(P.lon, 2);
  });

  it("demoras paralelas dan error", () => {
    expect(() => dosDemoras(F1, 45, F2, 45)).toThrow(/paralelas/);
  });

  it("rumbo para pasar a una distancia de un faro", () => {
    const desde = { lat: 36, lon: -6 };
    const faro = { lat: 36 + 10 / 60, lon: -6 }; // 10 millas al N
    const est = pasarADistancia(desde, faro, 5, "estribor");
    const bab = pasarADistancia(desde, faro, 5, "babor");
    expect(est.rumbo).toBeCloseTo(330, 1); // sen α = 0,5 → α = 30°
    expect(bab.rumbo).toBeCloseTo(30, 1);
    expect(() => pasarADistancia(desde, faro, 12, "babor")).toThrow(/Ya estás/);
  });
});

describe("llegar a una hora", () => {
  it("sin corriente: velocidad = distancia ÷ tiempo", () => {
    const r = llegarAHora({ ref: 120, distancia: 15, horas: 2.5, ct: -2 });
    expect(r.vef).toBe(6);
    expect(r.vb).toBe(6);
    expect(r.ra).toBe(122);
  });

  it("con corriente de través", () => {
    const r = llegarAHora({ ref: 0, distancia: 12, horas: 2, rc: 90, ic: 2 });
    expect(r.vef).toBe(6);
    expect(r.rs).toBeCloseTo(341.57, 1);
    expect(r.vb).toBeCloseTo(Math.sqrt(40), 3);
  });
});
