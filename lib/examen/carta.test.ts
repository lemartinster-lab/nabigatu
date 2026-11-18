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

describe("modo examen: carta-enfilacion", () => {
  const RAD = Math.PI / 180;
  const leerGrados = (t: string) => {
    const m = t.match(/(\d+)°(?:\s*([\d,]+)′)?\s*([EW])?/);
    if (!m) throw new Error(t);
    const v = +m[1] + (m[2] ? parseFloat(m[2].replace(",", ".")) / 60 : 0);
    return m[3] === "W" ? -v : v;
  };
  it("300 preguntas: la opción correcta sale de la línea entre los faros y las opciones se distinguen con el transportador", () => {
    for (let semilla = 1; semilla <= 300; semilla++) {
      const p = generarPregunta("carta-enfilacion", semilla * 104729, FAROS_PRUEBA);
      const m = p.enunciado[0].match(/faro de (.+) y, detrás de él, el de (.+)\.$/)!;
      const cerca = FAROS_PRUEBA.find((f) => f.nombre === m[1])!;
      const lejos = FAROS_PRUEBA.find((f) => f.nombre === m[2])!;
      const v = aPlano(lejos, cerca);
      const dv = (Math.atan2(v.x, v.y) / RAD + 360) % 360;
      const da = leerGrados(p.enunciado[1].split("=")[1]);
      const ct = ((dv - da + 540) % 360) - 180;
      const dmLinea = p.enunciado.find((l) => l.startsWith("Declinación"));
      const esperado = dmLinea ? ct - leerGrados(dmLinea.split(":")[1]) : ct;
      const correcta = p.opciones.find((o) => o.correcta)!;
      expect(Math.abs(leerGrados(correcta.texto.split("=")[1]) - esperado)).toBeLessThanOrEqual(0.26);
      const valores = p.opciones.map((o) => leerGrados(o.texto.split("=")[1]));
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) expect(Math.abs(valores[i] - valores[j])).toBeGreaterThanOrEqual(1.5);
    }
  });
  it("sin faros avisa", () => {
    expect(() => generarPregunta("carta-enfilacion", 1, FAROS_PRUEBA.slice(0, 1))).toThrow(FarosInsuficientes);
  });
});
