import { describe, expect, it } from "vitest";
import { correccionTotal, ctDesdeDemora, deAgujaAVerdadero, deVerdaderoAAguja } from "./correccion";
import { actualizarDeclinacion } from "./declinacion";
import { resolverDVT } from "./dvt";
import {
  corrienteDesconocida,
  efectoCorriente,
  rumboADar,
  rumboContraCorriente,
  rumboSuperficie,
} from "./viento-corriente";
import { leerHora } from "../nucleo/unidades";

describe("corrección total", () => {
  it("Ct = dm + Δ con signos E+/W−", () => {
    const r = correccionTotal(-3, 2); // dm 3°W, Δ 2°E
    expect(r.ct).toBe(-1);
    expect(r.pasos.at(-1)).toBe("Ct = −1° → 1° W");
  });

  it("con minutos", () => {
    expect(correccionTotal(-1.8, -2.5).ct).toBeCloseTo(-4.3);
  });
});

describe("rumbos y demoras", () => {
  it("Rv = Ra + Ct y Ra = Rv − Ct", () => {
    expect(deVerdaderoAAguja(45, -1).aguja).toBe(46);
    expect(deAgujaAVerdadero(46, -1).verdadero).toBe(45);
  });

  it("pasa por el norte correctamente", () => {
    expect(deAgujaAVerdadero(358, 5).verdadero).toBe(3);
    expect(deVerdaderoAAguja(2, 4).aguja).toBe(358);
    expect(deVerdaderoAAguja(2, 4).pasos.join(" ")).toMatch(/360°/);
  });

  it("también vale para demoras", () => {
    const r = deAgujaAVerdadero(130, -5, "demora");
    expect(r.verdadero).toBe(125);
    expect(r.pasos[0]).toBe("Dv = Da + Ct");
  });

  it("Ct y desvío a partir de una enfilación", () => {
    const r = ctDesdeDemora(125, 130, -3);
    expect(r.ct).toBe(-5);
    expect(r.desvio).toBe(-2);
    expect(r.pasos.at(-1)).toBe("Δ = −2° → 2° W");
  });

  it("Ct desde demora alrededor del norte", () => {
    expect(ctDesdeDemora(2, 358).ct).toBe(4);
    expect(ctDesdeDemora(358, 2).ct).toBe(-4);
  });

  it("avisa si la Ct es sospechosamente grande", () => {
    expect(ctDesdeDemora(100, 40).pasos.join(" ")).toMatch(/Revisa/);
  });
});

describe("actualización de la declinación magnética", () => {
  it("4°15′W 2005 (7′E) en 2026", () => {
    const r = actualizarDeclinacion(-4.25, 2005, 7, 2026);
    expect(r.dm).toBeCloseTo(-1.8);
    expect(r.pasos.at(-1)).toBe("dm 2026 = −1° 48′ → 1° 48′ W");
  });

  it("2°10′W 2010 (8′W) en 2026", () => {
    expect(actualizarDeclinacion(-(2 + 10 / 60), 2010, -8, 2026).dm).toBeCloseTo(-4.3);
  });

  it("puede cambiar de W a E", () => {
    expect(actualizarDeclinacion(-0.5, 2000, 6, 2020).dm).toBeCloseTo(1.5);
  });

  it("rechaza años imposibles", () => {
    expect(() => actualizarDeclinacion(-1, 2030, 5, 2026)).toThrow(/anterior/);
  });
});

describe("distancia, velocidad y tiempo", () => {
  it("calcula el dato que falta", () => {
    expect(resolverDVT({ distancia: 18, velocidad: 6 }).tiempo).toBe(3);
    expect(resolverDVT({ velocidad: 8, tiempo: 2.5 }).distancia).toBe(20);
    expect(resolverDVT({ distancia: 24, tiempo: 4 }).velocidad).toBe(6);
  });

  it("hora estimada de llegada", () => {
    const r = resolverDVT({ distancia: 18, velocidad: 6, horaSalida: leerHora("22:30") });
    expect(r.llegada).toBe("01:30 (día siguiente)");
    expect(resolverDVT({ distancia: 15, velocidad: 6, horaSalida: leerHora("09:00") }).llegada).toBe("11:30");
  });

  it("exige exactamente dos datos positivos", () => {
    expect(() => resolverDVT({ distancia: 10 })).toThrow(/dos/);
    expect(() => resolverDVT({ distancia: 10, velocidad: 5, tiempo: 2 })).toThrow(/dos/);
    expect(() => resolverDVT({ distancia: 10, velocidad: 0 })).toThrow(/mayores/);
  });
});

describe("viento: abatimiento", () => {
  it("Rs = Rv + Ab", () => {
    expect(rumboSuperficie(90, 5).rs).toBe(95);
    expect(rumboSuperficie(358, 5).rs).toBe(3);
    expect(rumboSuperficie(10, -15).rs).toBe(355);
  });
});

describe("corriente", () => {
  it("efecto de una corriente de través", () => {
    const r = efectoCorriente(0, 6, 90, 2);
    expect(r.ref).toBeCloseTo(18.435, 2);
    expect(r.vef).toBeCloseTo(6.3246, 3);
  });

  it("corriente a favor y en contra", () => {
    expect(efectoCorriente(45, 6, 45, 2).vef).toBeCloseTo(8);
    expect(efectoCorriente(45, 6, 225, 2).vef).toBeCloseTo(4);
    expect(efectoCorriente(45, 6, 225, 2).ref).toBeCloseTo(45);
  });

  it("rumbo a hacer para compensar la corriente", () => {
    const r = rumboContraCorriente(0, 6, 90, 2);
    expect(r.rs).toBeCloseTo(340.53, 1);
    expect(r.vef).toBeCloseTo(5.657, 2);
  });

  it("ida y vuelta: navegando a ese Rs se avanza por el Ref deseado", () => {
    for (const [ref, vb, rc, ic] of [
      [0, 6, 90, 2],
      [135, 5, 200, 1.5],
      [270, 7, 30, 3],
      [350, 4, 80, 1],
    ]) {
      const c = rumboContraCorriente(ref, vb, rc, ic);
      const e = efectoCorriente(c.rs, vb, rc, ic);
      const diferencia = Math.abs(((e.ref - ref + 540) % 360) - 180);
      expect(diferencia).toBeLessThan(0.05);
      expect(e.vef).toBeCloseTo(c.vef, 2);
    }
  });

  it("deduce la corriente que hubo", () => {
    const r = corrienteDesconocida(0, 6, 18.435, 6.3246);
    expect(r.rc).toBeCloseTo(90, 0);
    expect(r.ic).toBeCloseTo(2, 2);
    expect(corrienteDesconocida(45, 6, 45, 6).pasos.at(-1)).toMatch(/No hay corriente/);
  });

  it("errores cuando la corriente lo hace imposible", () => {
    expect(() => rumboContraCorriente(0, 2, 90, 3)).toThrow(/demasiado fuerte/);
    expect(() => rumboContraCorriente(0, 4, 180, 5)).toThrow(/no avanza/);
  });
});

describe("rumbo a dar: problema completo", () => {
  it("corriente, viento y corrección total encadenados", () => {
    // Quiero ir al 000° a 6 nudos, corriente hacia el 090° de 2 nudos,
    // viento por babor con 5° de abatimiento, dm 3°W y Δ 2°E (Ct = −1°).
    const r = rumboADar({ ref: 0, vb: 6, rc: 90, ic: 2, ab: 5, ct: -1 });
    expect(r.rs).toBeCloseTo(340.53, 1);
    expect(r.rv).toBeCloseTo(335.53, 1);
    expect(r.ra).toBeCloseTo(336.53, 1);
    expect(r.vef).toBeCloseTo(5.657, 2);
    expect(r.pasos.join("\n")).toMatch(/1\) Corriente[\s\S]*2\) Viento[\s\S]*3\) Corrección total/);
  });

  it("sin corriente ni viento solo aplica la Ct", () => {
    const r = rumboADar({ ref: 120, vb: 5, ct: 3 });
    expect(r.rs).toBe(120);
    expect(r.rv).toBe(120);
    expect(r.ra).toBe(117);
    expect(r.vef).toBe(5);
  });
});
