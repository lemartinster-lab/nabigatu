import { describe, expect, it } from "vitest";
import { BANCO, preguntasDeTemas } from "./banco";
import { BEAUFORT, DOUGLAS, gradoBeaufort } from "./escalas";
import { EXAMENES } from "./examenes";
import { ACIERTOS_PARA_QUITAR, anotarRespuesta, filtrarFallos } from "./fallos";
import {
  corregirExamen,
  generarExamen,
  generarPractica,
  generarRepaso,
  planExamen,
  unidadesDisponibles,
  unidadesPendientes,
  type PreguntaMostrada,
} from "./motor";

describe("banco de preguntas", () => {
  it("cada pregunta tiene cuatro respuestas distintas, explicación e id único", () => {
    const ids = new Set(BANCO.map((p) => p.id));
    expect(ids.size).toBe(BANCO.length);
    for (const p of BANCO) {
      expect(new Set(p.opciones).size, p.id).toBe(4);
      expect(p.explicacion.length, p.id).toBeGreaterThan(10);
    }
  });

  it("cada unidad con temas tiene al menos el doble de preguntas que el examen, para que los exámenes varíen", () => {
    for (const def of Object.values(EXAMENES)) {
      for (const u of def.unidades.filter((x) => x.temas.length > 0)) {
        expect(preguntasDeTemas(u.temas).length, `${def.nivel} UT${u.ut}`).toBeGreaterThanOrEqual(u.preguntas * 2);
      }
    }
  });
});

describe("estructura oficial (RD 875/2014, anexo II)", () => {
  it("las unidades suman el total oficial de cada examen", () => {
    expect(EXAMENES.PNB.unidades.reduce((s, u) => s + u.preguntas, 0)).toBe(27);
    expect(EXAMENES.PER.unidades.reduce((s, u) => s + u.preguntas, 0)).toBe(45);
    expect(EXAMENES.PY.unidades.reduce((s, u) => s + u.preguntas, 0)).toBe(40);
  });

  it("PNB completo: 27 preguntas y 10 errores", () => {
    expect(planExamen(EXAMENES.PNB)).toEqual({ preguntas: 27, maxErrores: 10, completo: true });
  });

  it("PER parcial: UT1–UT6 y meteorología (31 preguntas), errores en proporción: 13·31/45 = 8", () => {
    expect(unidadesDisponibles(EXAMENES.PER).map((u) => u.ut)).toEqual([1, 2, 3, 4, 5, 6, 9]);
    expect(unidadesPendientes(EXAMENES.PER).map((u) => u.ut)).toEqual([7, 8, 10, 11]);
    expect(planExamen(EXAMENES.PER)).toEqual({ preguntas: 31, maxErrores: 8, completo: false });
  });

  it("Patrón de Yate parcial: solo meteorología (10 preguntas), 12·10/40 = 3 errores", () => {
    expect(planExamen(EXAMENES.PY)).toEqual({ preguntas: 10, maxErrores: 3, completo: false });
  });
});

describe("examen de prueba", () => {
  it("PNB: 27 preguntas con el reparto oficial, sin repetir", () => {
    const ex = generarExamen(EXAMENES.PNB, 12345);
    expect(ex).toHaveLength(27);
    for (const u of EXAMENES.PNB.unidades) expect(ex.filter((p) => p.ut === u.ut)).toHaveLength(u.preguntas);
    expect(new Set(ex.map((p) => p.id)).size).toBe(27);
  });

  it("PER: incluye 4 de meteorología básica", () => {
    const ex = generarExamen(EXAMENES.PER, 5);
    expect(ex).toHaveLength(31);
    expect(ex.filter((p) => p.ut === 9).every((p) => p.tema === "meteo-basica")).toBe(true);
  });

  it("la respuesta correcta sigue siéndolo tras barajar", () => {
    for (const p of generarExamen(EXAMENES.PER, 7)) {
      const original = BANCO.find((q) => q.id === p.id)!;
      expect(p.opciones[p.correcta]).toBe(original.opciones[0]);
    }
  });

  it("la misma semilla da el mismo examen", () => {
    expect(generarExamen(EXAMENES.PY, 99)).toEqual(generarExamen(EXAMENES.PY, 99));
  });

  it("la práctica de un tema trae todas sus preguntas", () => {
    expect(generarPractica(["balizamiento"], 1)).toHaveLength(preguntasDeTemas(["balizamiento"]).length);
  });
});

describe("corrección con los criterios oficiales (PNB)", () => {
  const def = EXAMENES.PNB;
  const ex = generarExamen(def, 2026);
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
    const c = corregirExamen(def, ex, todasBien());
    expect(c.aprobado).toBe(true);
    expect(c.aciertos).toBe(27);
  });

  it("10 errores sin pasar los límites por unidad: aprobado con 17", () => {
    let r = fallar(todasBien(), 2, (p) => p.ut === 5);
    r = fallar(r, 5, (p) => p.ut === 6);
    r = fallar(r, 3, (p) => p.ut === 1);
    const c = corregirExamen(def, ex, r);
    expect(c.errores).toBe(10);
    expect(c.aprobado).toBe(true);
  });

  it("11 errores: suspenso aunque se respeten los límites por unidad", () => {
    let r = fallar(todasBien(), 4, (p) => p.ut === 1);
    r = fallar(r, 4, (p) => p.ut === 3);
    r = fallar(r, 2, (p) => p.ut === 4);
    r = fallar(r, 1, (p) => p.ut === 2);
    expect(corregirExamen(def, ex, r).aprobado).toBe(false);
  });

  it("3 errores de balizamiento suspenden aunque el total sea bajo", () => {
    const c = corregirExamen(def, ex, fallar(todasBien(), 3, (p) => p.ut === 5));
    expect(c.aprobado).toBe(false);
    expect(c.motivos[0]).toContain("Balizamiento");
  });

  it("una pregunta sin contestar cuenta como error", () => {
    const r = todasBien();
    r[0] = null;
    expect(corregirExamen(def, ex, r).errores).toBe(1);
  });
});

describe("corrección parcial (Patrón de Yate, solo meteorología)", () => {
  const ex = generarExamen(EXAMENES.PY, 3);
  it("4 errores de 10 suspenden: el máximo proporcional son 3", () => {
    const r = ex.map((p, i) => (i < 4 ? (p.correcta + 1) % 4 : p.correcta));
    const c = corregirExamen(EXAMENES.PY, ex, r);
    expect(c.maxErrores).toBe(3);
    expect(c.aprobado).toBe(false);
  });
});

describe("mis fallos", () => {
  it("un fallo entra y sale tras dos aciertos seguidos", () => {
    let f = anotarRespuesta({}, "met-beaufort-7", false);
    f = anotarRespuesta(f, "met-beaufort-7", true);
    expect(f).toEqual({ "met-beaufort-7": 1 });
    f = anotarRespuesta(f, "met-beaufort-7", true);
    expect(f).toEqual({});
    expect(ACIERTOS_PARA_QUITAR).toBe(2);
  });

  it("acertar una que no estaba no la añade, y un fallo en medio la devuelve a cero", () => {
    expect(anotarRespuesta({}, "rip-cruce", true)).toEqual({});
    let f = anotarRespuesta({}, "bal-sur", false);
    f = anotarRespuesta(f, "bal-sur", true);
    expect(anotarRespuesta(f, "bal-sur", false)["bal-sur"]).toBe(0);
  });

  it("lo leído del navegador se limpia; vale para preguntas de cualquier banco", () => {
    expect(filtrarFallos({ "bal-norte": 1, "mpy-fetch": 0, "no-existe": 0, "rip-cruce": "x", "rip-alcance": 5 })).toEqual({ "bal-norte": 1, "mpy-fetch": 0 });
    expect(filtrarFallos(null)).toEqual({});
  });

  it("el repaso trae justo las preguntas de la lista", () => {
    expect(generarRepaso(["bal-norte", "mpy-fetch", "no-existe"], 3).map((p) => p.id).sort()).toEqual(["bal-norte", "mpy-fetch"]);
  });
});

describe("escalas Beaufort y Douglas", () => {
  it("los intervalos son consecutivos y sin huecos", () => {
    for (let i = 1; i < BEAUFORT.length; i++) expect(BEAUFORT[i].nudos[0]).toBe((BEAUFORT[i - 1].nudos[1] as number) + 1);
    for (let i = 1; i < DOUGLAS.length; i++) expect(DOUGLAS[i].metros[0]).toBe(DOUGLAS[i - 1].metros[1]);
  });

  it("las preguntas del banco coinciden con la tabla", () => {
    expect(gradoBeaufort(36).fuerza).toBe(8);
    expect(gradoBeaufort(30).nombre).toBe("Frescachón");
    expect(gradoBeaufort(13).nombre).toBe("Bonancible");
    expect(gradoBeaufort(70).fuerza).toBe(12);
    expect(DOUGLAS[3]).toMatchObject({ nombre: "Marejada", metros: [0.5, 1.25] });
    expect(DOUGLAS[5]).toMatchObject({ nombre: "Gruesa", metros: [2.5, 4] });
  });
});
