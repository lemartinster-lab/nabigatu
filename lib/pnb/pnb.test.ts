import { describe, expect, it } from "vitest";
import { ATRIBUCIONES_PNB } from "./atribuciones";
import { comprobarAlcance, LIMITE_PNB } from "../ln/moto";

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
