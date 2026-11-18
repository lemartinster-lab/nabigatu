import { describe, expect, it } from "vitest";
import { TEMAS, generarPregunta, temasDeNivel } from "./generador";

describe("modo examen: generador", () => {
  for (const { id } of TEMAS) {
    it(`${id}: 300 preguntas válidas`, () => {
      for (let semilla = 1; semilla <= 300; semilla++) {
        const p = generarPregunta(id, semilla * 104729);
        expect(p.opciones).toHaveLength(4);
        expect(p.opciones.filter((o) => o.correcta)).toHaveLength(1);
        expect(new Set(p.opciones.map((o) => o.texto)).size).toBe(4);
        const todo = [...p.enunciado, ...p.opciones.map((o) => o.texto), ...p.solucion].join(" ");
        expect(todo).not.toMatch(/NaN|undefined|Infinity/);
        for (const o of p.opciones) if (!o.correcta) expect(o.error).toBeTruthy();
      }
    });
  }

  it("la misma semilla da la misma pregunta", () => {
    expect(generarPregunta("mareas-sonda", 42)).toEqual(generarPregunta("mareas-sonda", 42));
  });

  it("los temas se filtran por titulación", () => {
    expect(temasDeNivel("PER").every((t) => t.nivel === "PER")).toBe(true);
    expect(temasDeNivel("PY").length).toBeGreaterThan(temasDeNivel("PER").length);
  });
});
