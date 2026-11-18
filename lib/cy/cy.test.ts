import { describe, expect, it } from "vitest";
import { ortodromica } from "./ortodromica";
import { convertirHora, leerInstante, formatoInstante, arcoATiempo, husoHorario } from "./tiempo";
import { horarioDelAstro, formatoHorario, formatoDeclinacion } from "./astros";
import { corregirAltura } from "./alturas";
import { alturaYAzimut, corteDeRectas, latitudMeridiana, latitudPolar, pasoPorMeridiano, rectaDeAltura } from "./astronomica";
import type { Posicion } from "../nucleo/coordenadas";

const pos = (lg: number, lm: number, ns: 1 | -1, Lg: number, Lm: number, ew: 1 | -1): Posicion => ({
  lat: ns * (lg + lm / 60),
  lon: ew * (Lg + Lm / 60),
});

// Ejercicios de ortodrómica de exámenes oficiales de Capitán de Yate (Junta de Andalucía y Euskadi).
// En cada uno, el resultado debe coincidir con una de las opciones del examen.
describe("ortodrómica: comprobada con exámenes oficiales", () => {
  const distancia: [string, Posicion, Posicion, number][] = [
    ["Andalucía 2019-1", pos(53, 53, -1, 166, 10, 1), pos(34, 34, -1, 106, 41, -1), 3669],
    ["Andalucía 2019-2", pos(48, 18, 1, 116, 41, 1), pos(23, 53, -1, 176, 15, -1), 5625],
    ["Andalucía 2022-3", pos(33, 41, -1, 132, 27, 1), pos(16, 19, 1, 81, 52, -1), 8678],
    ["Andalucía 2023-1", pos(65, 33, -1, 93, 14, -1), pos(12, 31, 1, 169, 56, 1), 6252],
    ["Andalucía 2024-3", pos(31, 51, 1, 147, 13, 1), pos(1, 29, -1, 155, 36, -1), 3809],
  ];
  for (const [n, a, b, d] of distancia) {
    it(`distancia ${n} → ${d} millas`, () => expect(Math.round(ortodromica(a, b).distancia)).toBe(d));
  }

  const rumbo: [string, Posicion, Posicion, number][] = [
    ["Andalucía 2022-3", pos(33, 41, -1, 132, 27, 1), pos(16, 19, 1, 81, 52, -1), 111],
    ["Andalucía 2023-1", pos(21, 39, -1, 116, 46, 1), pos(6, 43, 1, 35, 35, -1), 245],
    ["Andalucía 2023-3", pos(38, 0, -1, 99, 0, 1), pos(4, 0, -1, 121, 0, -1), 129],
    ["Euskadi 2024", pos(71, 9, 1, 23, 35, 1), pos(47, 34, 1, 52, 40, -1), 278],
  ];
  for (const [n, a, b, r] of rumbo) {
    it(`rumbo inicial ${n} → ${r}°`, () => expect(Math.round(ortodromica(a, b).rumboInicial)).toBe(r));
  }

  it("rumbo inicial Andalucía 2021 → S 61,8° E", () => {
    const r = ortodromica(pos(23, 15, -1, 44, 0, -1), pos(35, 30, -1, 20, 0, 1));
    expect(180 - r.rumboInicial).toBeCloseTo(61.8, 1);
  });
});

describe("ortodrómica: propiedades", () => {
  it("por el ecuador coincide con la loxodrómica", () => {
    const r = ortodromica({ lat: 0, lon: 0 }, { lat: 0, lon: 10 });
    expect(r.distancia).toBeCloseTo(600);
    expect(r.rumboInicial).toBeCloseTo(90);
  });
  it("los puntos intermedios están sobre la derrota", () => {
    const a = pos(40, 0, 1, 10, 0, -1);
    const b = pos(40, 0, 1, 70, 0, -1);
    const r = ortodromica(a, b, 3);
    expect(r.intermedios).toHaveLength(3);
    const total = ortodromica(a, r.intermedios[0]).distancia * 4;
    expect(total).toBeCloseTo(r.distancia, 0);
    expect(r.vertice.lat).toBeGreaterThan(40); // la ortodrómica sube hacia el polo
    expect(r.vertice.enLaDerrota).toBe(true);
  });
});

describe("horas", () => {
  it("HcL = HcG + λ con cambio de fecha", () => {
    const r = convertirHora(leerInstante("06/11/2021", "07:40"), "HZ", -(120 + 16 / 60 + 43 / 3600), 0);
    // Huso −8 → HcG = 15:40; HcL = 15:40 − 8h 01m 07s = 07:38:53
    expect(formatoInstante(r.HcG)).toBe("06/11/2021 15h 40m 00s");
    expect(formatoInstante(r.HcL)).toBe("06/11/2021 07h 38m 53s");
  });
  it("cruza la medianoche", () => {
    const r = convertirHora(leerInstante("01/01/2026", "22:00"), "HcG", 150, 0);
    expect(formatoInstante(r.HcL)).toBe("02/01/2026 08h 00m 00s");
  });
  it("arco a tiempo y husos", () => {
    expect(arcoATiempo(16.4)).toBe("1h 05m 36s");
    expect(husoHorario(-16.5)).toBe(-1);
    expect(husoHorario(180)).toBe(12);
  });
  it("fechas imposibles", () => {
    expect(() => leerInstante("31/02/2026", "10:00")).toThrow(/no existe/);
  });
});

describe("horario del astro", () => {
  it("interpola el hG del Sol en una tabla horaria", () => {
    const r = horarioDelAstro({ hG0: 183.5, hG1: 198.5, dec0: -7, dec1: -7.0167, intervaloHoras: 1, transcurrido: 0.5, lon: -16 });
    expect(r.hG).toBeCloseTo(191, 6);
    expect(r.dec).toBeCloseTo(-7.00835, 4);
    expect(r.hL).toBeCloseTo(175, 6);
    expect(r.horarioAstronomico).toMatch(/W$/);
  });
  it("tabla diaria: el horario da una vuelta completa", () => {
    const r = horarioDelAstro({ hG0: 180.5, hG1: 180.4, dec0: 0, intervaloHoras: 24, transcurrido: 6, lon: 0 });
    expect(r.hG).toBeCloseTo(270.475, 3);
  });
  it("estrella: hG♈ + ángulo sidéreo", () => {
    const r = horarioDelAstro({ hG0: 300, intervaloHoras: 1, transcurrido: 0, dec0: 0, anguloSidereo: 80, decEstrella: 40.95, lon: 10 });
    expect(r.hG).toBeCloseTo(20);
    expect(r.hL).toBeCloseTo(30);
    expect(r.dec).toBe(40.95);
  });
  it("formatos", () => {
    expect(formatoHorario(117.55)).toBe("117° 33,0′");
    expect(formatoDeclinacion(-6.995)).toBe("6° 59,7′ S");
  });
});

// Meridiana del Sol del examen de Capitán de Yate de Euskadi (6-11-2024, pregunta 36):
// 10-10-2024, HcG 15:38, Sol limbo inferior, Ai 50° 27,2′, error de índice −2,0′, eo 5 m.
// Opciones: 32° 24′ N (correcta), 39° 23′ N (= z), 44° 07′ N, 50° 36′ N (= av).
// Declinación del Sol a esa hora: 6° 59,7′ S; semidiámetro 16,0′.
describe("meridiana: comprobada con examen oficial", () => {
  const alt = corregirAltura({ ai: 50 + 27.2 / 60, ci: -2, eo: 5, astro: "sol-li", sd: 16.0 });
  it("altura verdadera 50° 36,6′", () => {
    expect(alt.av * 60).toBeCloseTo((50 * 60 + 36.6), 0);
  });
  it("latitud 32° 24′ N", () => {
    const r = latitudMeridiana(alt.av, -(6 + 59.7 / 60), 33);
    expect(Math.round(r.lat * 60)).toBe(32 * 60 + 24);
    expect(r.astroAl).toBe("S");
    expect(Math.round(r.z * 60)).toBe(39 * 60 + 23); // la opción-trampa 39° 23′
  });
});

describe("corrección de alturas", () => {
  it("estrella: sin semidiámetro ni paralaje", () => {
    const r = corregirAltura({ ai: 30, ci: 0, eo: 4, astro: "estrella" });
    expect(r.depresion).toBeCloseTo(3.52, 2);
    expect(r.refraccion).toBeCloseTo(1.7, 1); // tablas: 1,7′ a 30°
    expect(r.correccionTotal).toBeCloseTo(-(3.52 + r.refraccion), 2);
  });
  it("limbo superior resta el semidiámetro", () => {
    const li = corregirAltura({ ai: 40, ci: 0, eo: 3, astro: "sol-li", sd: 16 });
    const ls = corregirAltura({ ai: 40, ci: 0, eo: 3, astro: "sol-ls", sd: 16 });
    expect((li.av - ls.av) * 60).toBeCloseTo(32, 1);
  });
  it("errores", () => {
    expect(() => corregirAltura({ ai: 95, ci: 0, eo: 3, astro: "estrella" })).toThrow();
  });
});

describe("Polar y recta de altura", () => {
  it("latitud por la Polar recupera la latitud real", () => {
    const lat = 36.5;
    const dec = 89.37;
    for (const hL of [0, 90, 200, 300]) {
      const { ae } = alturaYAzimut(lat, hL, dec);
      expect(latitudPolar(ae, hL, dec).lat).toBeCloseTo(lat, 6);
    }
  });

  it("azimut y altura: astro en el meridiano al S", () => {
    const r = alturaYAzimut(40, 0, 10);
    expect(r.ae).toBeCloseTo(60);
    expect(r.z).toBeCloseTo(180);
  });

  it("dos rectas de altura recuperan la situación verdadera", () => {
    const real = { lat: 28 + 10 / 60, lon: -(16 + 40 / 60) };
    const estima = { lat: 28 + 20 / 60, lon: -(16 + 25 / 60) };
    const astros = [
      { hG: 30, dec: 20 },
      { hG: 300, dec: -10 },
    ];
    const rectas = astros.map(({ hG, dec }) => {
      const av = alturaYAzimut(real.lat, hG + real.lon, dec).ae; // altura «observada» desde la situación real
      return rectaDeAltura(estima, hG, dec, av);
    });
    const r = corteDeRectas(estima, rectas[0].z, rectas[0].da!, rectas[1].z, rectas[1].da!);
    // Error de linealizar: menos de 0,5′ con 15 millas de error en la estima.
    expect(Math.abs(r.posicion.lat - real.lat) * 60).toBeLessThan(0.5);
    expect(Math.abs(r.posicion.lon - real.lon) * 60).toBeLessThan(0.5);
  });

  it("rectas paralelas dan error", () => {
    expect(() => corteDeRectas({ lat: 0, lon: 0 }, 90, 5, 270, 3)).toThrow();
  });

  it("paso por el meridiano", () => {
    const r = pasoPorMeridiano(leerInstante("10/10/2024", "11:47"), -6, 2);
    expect(formatoInstante(r.hcg)).toBe("10/10/2024 12h 11m 00s");
    expect(formatoInstante(r.ho)).toBe("10/10/2024 14h 11m 00s");
  });
});
