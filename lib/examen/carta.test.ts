import { describe, expect, it } from "vitest";
import { aPlano } from "../nucleo/coordenadas";
import { aPolar } from "../nucleo/vectores";
import { enElMar, farosDelEstrecho, FarosInsuficientes } from "./carta";
import { generarPregunta, TEMAS } from "./generador";
import { FAROS_PRUEBA } from "./carta.fixtures";

const gm = (g: number, m: number) => g + m / 60;


/** Lee «36° 01,2′ N  005° 40,3′ W» como grados decimales. */
function leerSituacion(t: string) {
  const m = t.match(/(\d+)°\s*([\d,]+)?′?\s*([NS])\s+(\d+)°\s*([\d,]+)?′?\s*([EW])/);
  if (!m) throw new Error(`Situación ilegible: ${t}`);
  const lat = (+m[1] + (m[2] ? parseFloat(m[2].replace(",", ".")) : 0) / 60) * (m[3] === "S" ? -1 : 1);
  const lon = (+m[4] + (m[5] ? parseFloat(m[5].replace(",", ".")) : 0) / 60) * (m[6] === "W" ? -1 : 1);
  return { lat, lon };
}
const millas = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => aPolar(aPlano(a, b)).modulo;

describe("carta del Estrecho: contorno de mar", () => {
  it("el centro del Estrecho y el Atlántico son mar; los faros y la costa no", () => {
    expect(enElMar({ lat: gm(35, 57), lon: -gm(5, 35) })).toBe(true);
    expect(enElMar({ lat: gm(35, 55), lon: -gm(6, 10) })).toBe(true);
    for (const f of FAROS_PRUEBA) expect(enElMar(f), f.nombre).toBe(false);
    expect(enElMar({ lat: gm(36, 30), lon: -gm(5, 40) })).toBe(false); // interior de Cádiz
    expect(enElMar({ lat: gm(35, 40), lon: -gm(5, 40) })).toBe(false); // interior de Marruecos
  });
  it("solo usa faros dentro de la zona de la carta", () => {
    const fuera = { nombre: "Cabo Machichaco", lat: gm(43, 27), lon: -gm(2, 45) };
    expect(farosDelEstrecho([...FAROS_PRUEBA, fuera])).toHaveLength(FAROS_PRUEBA.length);
  });
});

for (const tema of ["carta-dos-demoras", "carta-demora-distancia"] as const) {
  describe(`modo examen: ${tema}`, () => {
    it("300 preguntas válidas, con el barco en el mar y opciones a más de 1 milla entre sí", () => {
      for (let semilla = 1; semilla <= 300; semilla++) {
        const p = generarPregunta(tema, semilla * 104729, FAROS_PRUEBA);
        expect(p.opciones).toHaveLength(4);
        expect(p.opciones.filter((o) => o.correcta)).toHaveLength(1);
        const todo = [...p.enunciado, ...p.opciones.map((o) => o.texto), ...p.solucion].join(" ");
        expect(todo).not.toMatch(/NaN|undefined|Infinity/);
        for (const o of p.opciones) if (!o.correcta) expect(o.error).toBeTruthy();

        const pos = p.opciones.map((o) => leerSituacion(o.texto));
        const correcta = pos[p.opciones.findIndex((o) => o.correcta)];
        // La situación correcta, redondeada la demora al grado, queda en el agua o muy cerca del contorno.
        expect(enElMar(correcta) || FAROS_PRUEBA.every((f) => millas(f, correcta) > 1.5)).toBe(true);
        for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) expect(millas(pos[i], pos[j])).toBeGreaterThanOrEqual(0.95);
        // La solución termina con la situación de la opción correcta.
        expect(p.solucion.at(-1)).toContain(p.opciones.find((o) => o.correcta)!.texto);
      }
    });

    it("sin faros del Estrecho avisa de cuántos hacen falta", () => {
      expect(() => generarPregunta(tema, 1, [])).toThrow(FarosInsuficientes);
    });

    it("la misma semilla y los mismos faros dan la misma pregunta", () => {
      expect(generarPregunta(tema, 42, FAROS_PRUEBA)).toEqual(generarPregunta(tema, 42, FAROS_PRUEBA));
    });
  });
}

it("los temas de carta son del PER", () => {
  expect(TEMAS.filter((t) => t.id.startsWith("carta-")).every((t) => t.nivel === "PER")).toBe(true);
});
