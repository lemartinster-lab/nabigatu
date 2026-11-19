import { describe, expect, it } from "vitest";
import { MARCAS } from "./chuletas";
import { aleatorio, duracion, encendidos, ESCENARIOS, opciones, RITMOS } from "./interactivo";

describe("«¿Qué ves de noche?»", () => {
  it("cada escenario tiene luces dentro del dibujo y una explicación con su regla", () => {
    for (const e of ESCENARIOS) {
      expect(e.luces.length, e.id).toBeGreaterThan(0);
      for (const l of e.luces) {
        expect(l.x).toBeGreaterThanOrEqual(0);
        expect(l.x).toBeLessThanOrEqual(200);
        expect(l.y).toBeGreaterThanOrEqual(0);
        expect(l.y).toBeLessThanOrEqual(120);
      }
      expect(e.explicacion, e.id).toMatch(/[Rr]egla|No hay regla|varado/);
    }
  });

  it("vuelta encontrada: se ven los dos costados (verde a la izquierda, roja a la derecha)", () => {
    for (const e of ESCENARIOS.filter((x) => x.accion === "ambos-estribor")) {
      const verde = e.luces.find((l) => l.color === "verde")!;
      const roja = e.luces.filter((l) => l.color === "roja").sort((a, b) => b.y - a.y)[0];
      expect(verde.x, e.id).toBeLessThan(roja.x);
    }
  });

  it("los veleros no llevan luz de tope blanca", () => {
    for (const e of ESCENARIOS.filter((x) => x.buque === "velero")) expect(e.luces.some((l) => l.color === "blanca"), e.id).toBe(false);
  });

  it("un buque de motor solo sigue a rumbo cuando el otro buque de motor viene por su babor", () => {
    expect(ESCENARIOS.filter((e) => e.accion === "mantener").map((e) => e.id)).toEqual(["motor-estribor-del-otro"]);
  });
});

describe("ritmos de las luces de las marcas", () => {
  it("hay ritmo para todas las marcas de la chuleta", () => {
    for (const m of MARCAS) expect(RITMOS[m.id], m.id).toBeDefined();
  });

  it("los periodos coinciden con su abreviatura", () => {
    for (const [id, r] of Object.entries(RITMOS)) {
      const s = /(\d+)s$/.exec(r.abreviatura);
      if (s) expect(duracion(r), id).toBe(Number(s[1]) * 1000);
    }
  });

  it("cardinales: este 3, sur 6 más uno largo, oeste 9 centelleos; norte continuo (60 por minuto)", () => {
    expect(encendidos(RITMOS.este)).toBe(3);
    expect(encendidos(RITMOS.sur)).toBe(7);
    expect(RITMOS.sur.fases.filter((f) => f.color && f.ms >= 2000)).toHaveLength(1);
    expect(encendidos(RITMOS.oeste)).toBe(9);
    expect(duracion(RITMOS.norte)).toBe(1000);
  });

  it("peligro aislado: grupo de 2 destellos; isofase: luz y oscuridad iguales", () => {
    expect(encendidos(RITMOS["peligro-aislado"])).toBe(2);
    const [luz, oscuro] = RITMOS["aguas-seguras"].fases;
    expect(luz.ms).toBe(oscuro.ms);
  });
});

describe("opciones", () => {
  it("cuatro opciones distintas que incluyen la correcta", () => {
    const o = opciones("b", ["a", "b", "c", "d", "e"], aleatorio(1));
    expect(o).toHaveLength(4);
    expect(new Set(o).size).toBe(4);
    expect(o).toContain("b");
  });
});
