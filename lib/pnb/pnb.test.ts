import { describe, expect, it } from "vitest";
import { ATRIBUCIONES_PNB } from "./atribuciones";
import { PREGUNTAS_PNB } from "./preguntas";
import {
  corregirExamenPnb,
  generarExamenPnb,
  generarPracticaPnb,
  generarRepasoPnb,
  MAX_ERRORES,
  TOTAL_PREGUNTAS,
  UNIDADES_PNB,
  type PreguntaMostrada,
} from "./examen";
import { comprobarAlcance, LIMITE_PNB } from "../ln/moto";
import { ACIERTOS_PARA_QUITAR, anotarRespuesta, filtrarFallos } from "./fallos";

describe("banco de preguntas del PNB", () => {
  it("cada pregunta tiene cuatro respuestas distintas, explicación e id único", () => {
    const ids = new Set(PREGUNTAS_PNB.map((p) => p.id));
    expect(ids.size).toBe(PREGUNTAS_PNB.length);
    for (const p of PREGUNTAS_PNB) {
      expect(new Set(p.opciones).size, p.id).toBe(4);
      expect(p.explicacion.length, p.id).toBeGreaterThan(10);
    }
  });

  it("hay preguntas de sobra para cada unidad del examen oficial", () => {
    for (const u of UNIDADES_PNB) {
      expect(PREGUNTAS_PNB.filter((p) => p.unidad === u.id).length, u.id).toBeGreaterThan(u.preguntas);
    }
  });
});

describe("examen de prueba (RD 875/2014, anexo II, 2.B)", () => {
  it("27 preguntas con el reparto oficial por unidades y sin repetir", () => {
    const ex = generarExamenPnb(12345);
    expect(ex).toHaveLength(TOTAL_PREGUNTAS);
    expect(UNIDADES_PNB.reduce((s, u) => s + u.preguntas, 0)).toBe(TOTAL_PREGUNTAS);
    for (const u of UNIDADES_PNB) expect(ex.filter((p) => p.unidad === u.id)).toHaveLength(u.preguntas);
    expect(new Set(ex.map((p) => p.id)).size).toBe(TOTAL_PREGUNTAS);
  });

  it("la respuesta correcta sigue siéndolo tras barajar", () => {
    for (const p of generarExamenPnb(7)) {
      const original = PREGUNTAS_PNB.find((q) => q.id === p.id)!;
      expect(p.opciones[p.correcta]).toBe(original.opciones[0]);
    }
  });

  it("la misma semilla da el mismo examen", () => {
    expect(generarExamenPnb(99)).toEqual(generarExamenPnb(99));
  });

  it("la práctica de una unidad trae todas sus preguntas", () => {
    expect(generarPracticaPnb("balizamiento", 1)).toHaveLength(PREGUNTAS_PNB.filter((p) => p.unidad === "balizamiento").length);
  });
});

describe("corrección con los criterios oficiales", () => {
  const ex = generarExamenPnb(2026);
  const todasBien = () => ex.map((p) => p.correcta as number | null);
  const fallar = (r: (number | null)[], cuantas: number, filtro: (p: PreguntaMostrada) => boolean) => {
    let n = 0;
    ex.forEach((p, i) => {
      if (n < cuantas && filtro(p)) {
        r[i] = (p.correcta + 1) % 4;
        n++;
      }
    });
    return r;
  };

  it("todo bien: aprobado con 27 aciertos", () => {
    const c = corregirExamenPnb(ex, todasBien());
    expect(c.aprobado).toBe(true);
    expect(c.aciertos).toBe(27);
  });

  it("10 errores repartidos sin pasar los límites: aprobado con 17", () => {
    let r = fallar(todasBien(), 2, (p) => p.unidad === "balizamiento");
    r = fallar(r, 5, (p) => p.unidad === "reglamento");
    r = fallar(r, 3, (p) => p.unidad === "nomenclatura");
    const c = corregirExamenPnb(ex, r);
    expect(c.errores).toBe(MAX_ERRORES);
    expect(c.aciertos).toBe(17);
    expect(c.aprobado).toBe(true);
  });

  it("11 errores: suspenso aunque se respeten los límites por unidad", () => {
    let r = fallar(todasBien(), 4, (p) => p.unidad === "nomenclatura");
    r = fallar(r, 4, (p) => p.unidad === "seguridad");
    r = fallar(r, 2, (p) => p.unidad === "legislacion");
    r = fallar(r, 1, (p) => p.unidad === "amarre");
    const c = corregirExamenPnb(ex, r);
    expect(c.errores).toBe(11);
    expect(c.aprobado).toBe(false);
  });

  it("3 errores de balizamiento suspenden aunque el total sea bajo", () => {
    const c = corregirExamenPnb(ex, fallar(todasBien(), 3, (p) => p.unidad === "balizamiento"));
    expect(c.errores).toBe(3);
    expect(c.aprobado).toBe(false);
    expect(c.motivos[0]).toContain("Balizamiento");
  });

  it("6 errores del reglamento suspenden", () => {
    const c = corregirExamenPnb(ex, fallar(todasBien(), 6, (p) => p.unidad === "reglamento"));
    expect(c.aprobado).toBe(false);
  });

  it("una pregunta sin contestar cuenta como error", () => {
    const r = todasBien();
    r[0] = null;
    expect(corregirExamenPnb(ex, r).errores).toBe(1);
  });
});

describe("atribuciones y límite del PNB", () => {
  it("cada atribución cita el RD 875/2014", () => {
    for (const a of ATRIBUCIONES_PNB) expect(a.fuente, a.titulo).toContain("875/2014");
  });

  it("4 millas está dentro del límite del PNB y fuera del de la licencia", () => {
    const abrigo = { lat: 28.0, lon: -16.0 };
    const destino = { lat: 28.0 + 4 / 60, lon: -16.0 };
    expect(comprobarAlcance(abrigo, destino, undefined, LIMITE_PNB).dentro).toBe(true);
    expect(comprobarAlcance(abrigo, destino).dentro).toBe(false);
  });
});

describe("repasar mis fallos", () => {
  it("un fallo entra en la lista y sale tras dos aciertos seguidos", () => {
    let f = anotarRespuesta({}, "bal-norte", false);
    expect(f).toEqual({ "bal-norte": 0 });
    f = anotarRespuesta(f, "bal-norte", true);
    expect(f).toEqual({ "bal-norte": 1 });
    f = anotarRespuesta(f, "bal-norte", true);
    expect(f).toEqual({});
  });

  it("un fallo en medio devuelve la racha a cero", () => {
    let f = anotarRespuesta({}, "bal-sur", false);
    f = anotarRespuesta(f, "bal-sur", true);
    f = anotarRespuesta(f, "bal-sur", false);
    expect(f["bal-sur"]).toBe(0);
    expect(ACIERTOS_PARA_QUITAR).toBe(2);
  });

  it("acertar una pregunta que no estaba en la lista no la añade", () => {
    expect(anotarRespuesta({}, "rip-cruce", true)).toEqual({});
  });

  it("lo leído del navegador se limpia: ids desconocidos y valores raros fuera", () => {
    expect(filtrarFallos({ "bal-norte": 1, "no-existe": 0, "rip-cruce": "x", "rip-alcance": 5 })).toEqual({ "bal-norte": 1 });
    expect(filtrarFallos(null)).toEqual({});
    expect(filtrarFallos([1, 2])).toEqual({});
  });

  it("el repaso trae justo las preguntas de la lista", () => {
    const r = generarRepasoPnb(["bal-norte", "rip-cruce", "no-existe"], 3);
    expect(r.map((p) => p.id).sort()).toEqual(["bal-norte", "rip-cruce"]);
  });
});
