import { describe, expect, it } from "vitest";
import {
  aCuadrantal,
  desdeCuadrantal,
  formatoAbatimiento,
  formatoCuadrantal,
  formatoEW,
  formatoLatitud,
  formatoLongitud,
  formatoRumbo,
  formatoSigno,
  leerAngulo,
  leerCuadrantal,
  leerRumbo,
  normalizar180,
  normalizar360,
} from "./angulos";
import { aPolar, desdePolar, sumarPolar } from "./vectores";
import {
  convertirDistancia,
  convertirVelocidad,
  formatoDuracion,
  formatoNumero,
  leerDuracion,
  leerHora,
  leerNumero,
  sumarAHora,
} from "./unidades";

describe("normalización de ángulos", () => {
  it("lleva a 0–360", () => {
    expect(normalizar360(370)).toBe(10);
    expect(normalizar360(-10)).toBe(350);
    expect(normalizar360(360)).toBe(0);
    expect(normalizar360(-360)).toBe(0);
    expect(normalizar360(720.5)).toBe(0.5);
  });

  it("lleva a −180–180", () => {
    expect(normalizar180(350)).toBe(-10);
    expect(normalizar180(190)).toBe(-170);
    expect(normalizar180(180)).toBe(180);
  });
});

describe("lectura de ángulos", () => {
  it("acepta muchas formas de escribir", () => {
    expect(leerAngulo("45")).toBe(45);
    expect(leerAngulo("45,5")).toBe(45.5);
    expect(leerAngulo("45.5")).toBe(45.5);
    expect(leerAngulo("45°30'")).toBe(45.5);
    expect(leerAngulo("45º 30'")).toBe(45.5);
    expect(leerAngulo("45 30")).toBe(45.5);
    expect(leerAngulo("4°15′")).toBe(4.25);
    expect(leerAngulo("-4°15'")).toBe(-4.25);
    expect(leerAngulo(" 0 ")).toBe(0);
  });

  it("rechaza lo que no tiene sentido", () => {
    expect(() => leerAngulo("")).toThrow(/Falta/);
    expect(() => leerAngulo("abc")).toThrow(/No entiendo/);
    expect(() => leerAngulo("45 75")).toThrow(/minutos/);
    expect(() => leerAngulo("45.5 30")).toThrow(/enteros/);
    expect(() => leerRumbo("400")).toThrow(/entre 0° y 360°/);
    expect(() => leerRumbo("-5")).toThrow(/entre 0° y 360°/);
  });

  it("360 como rumbo es 000", () => {
    expect(leerRumbo("360")).toBe(0);
  });
});

describe("formato", () => {
  it("rumbos con tres cifras", () => {
    expect(formatoRumbo(45)).toBe("045°");
    expect(formatoRumbo(312.5)).toBe("312° 30′");
    expect(formatoRumbo(0)).toBe("000°");
    expect(formatoRumbo(359.9999)).toBe("000°");
    expect(formatoRumbo(-1)).toBe("359°");
    expect(formatoRumbo(10.258333)).toBe("010° 15,5′");
  });

  it("E/W y signo", () => {
    expect(formatoEW(-1.8)).toBe("1° 48′ W");
    expect(formatoEW(2.45)).toBe("2° 27′ E");
    expect(formatoEW(0)).toBe("0°");
    expect(formatoSigno(-1.5)).toBe("−1° 30′");
    expect(formatoSigno(3)).toBe("+3°");
    expect(formatoAbatimiento(5)).toBe("+5° (viento por babor)");
    expect(formatoAbatimiento(-4)).toBe("−4° (viento por estribor)");
  });

  it("latitud y longitud", () => {
    expect(formatoLatitud(28.4666667)).toBe("28° 28′ N");
    expect(formatoLongitud(-16.25)).toBe("016° 15′ W");
    expect(formatoLatitud(-33)).toBe("33° 0′ S");
  });
});

describe("rumbos cuadrantales", () => {
  it("circular a cuadrantal y vuelta", () => {
    const casos: [number, string][] = [
      [45, "N 45° E"],
      [135, "S 45° E"],
      [225, "S 45° W"],
      [300, "N 60° W"],
      [0, "N 0° E"],
      [180, "S 0° E"],
    ];
    for (const [circ, texto] of casos) {
      expect(formatoCuadrantal(aCuadrantal(circ))).toBe(texto);
      expect(desdeCuadrantal(aCuadrantal(circ))).toBe(circ);
    }
  });

  it("lee el formato habitual", () => {
    expect(desdeCuadrantal(leerCuadrantal("N45E"))).toBe(45);
    expect(desdeCuadrantal(leerCuadrantal("s 30 w"))).toBe(210);
    expect(desdeCuadrantal(leerCuadrantal("N 45°30' W"))).toBe(314.5);
    expect(() => leerCuadrantal("E45N")).toThrow();
    expect(() => desdeCuadrantal({ desde: "N", grados: 95, hacia: "E" })).toThrow();
  });
});

describe("vectores", () => {
  it("polar ↔ cartesiano", () => {
    const v = desdePolar({ rumbo: 90, modulo: 5 });
    expect(v.x).toBeCloseTo(5);
    expect(v.y).toBeCloseTo(0);
    const p = aPolar({ x: -3, y: -3 });
    expect(p.rumbo).toBeCloseTo(225);
    expect(p.modulo).toBeCloseTo(Math.sqrt(18));
  });

  it("suma de rumbos opuestos se anula", () => {
    const r = sumarPolar({ rumbo: 0, modulo: 4 }, { rumbo: 180, modulo: 4 });
    expect(r.modulo).toBeCloseTo(0);
  });
});

describe("unidades", () => {
  it("distancias", () => {
    expect(convertirDistancia(1, "mn", "m")).toBe(1852);
    expect(convertirDistancia(10, "cable", "mn")).toBeCloseTo(1);
    expect(convertirDistancia(100, "km", "mn")).toBeCloseTo(53.9957, 3);
  });

  it("velocidades", () => {
    expect(convertirVelocidad(10, "nudos", "kmh")).toBeCloseTo(18.52);
    expect(convertirVelocidad(1, "ms", "nudos")).toBeCloseTo(1.94384, 4);
  });

  it("números con coma", () => {
    expect(leerNumero("6,5")).toBe(6.5);
    expect(() => leerNumero("6,5,1")).toThrow();
    expect(formatoNumero(6.32456)).toBe("6,32");
    expect(formatoNumero(5)).toBe("5");
  });

  it("duraciones", () => {
    expect(leerDuracion("2:30")).toBe(2.5);
    expect(leerDuracion("2h 30m")).toBe(2.5);
    expect(leerDuracion("45m")).toBe(0.75);
    expect(leerDuracion("2,5")).toBe(2.5);
    expect(leerDuracion("1:05:36")).toBeCloseTo(1.0933, 3);
    expect(() => leerDuracion("dos horas")).toThrow();
    expect(formatoDuracion(2.5)).toBe("2 h 30 min");
    expect(formatoDuracion(0.75)).toBe("45 min");
    expect(formatoDuracion(3)).toBe("3 h");
  });

  it("horas del día", () => {
    expect(leerHora("09:15")).toBe(555);
    expect(sumarAHora(leerHora("22:30"), 3)).toBe("01:30 (día siguiente)");
    expect(sumarAHora(leerHora("10:00"), 2.25)).toBe("12:15");
    expect(() => leerHora("25:00")).toThrow();
  });
});

import { leerLatitud, leerLongitud, separarHemisferio } from "./coordenadas";

// Formatos con los que se escriben las coordenadas en la carta y en los enunciados de examen.
// Fallo detectado en «Mis faros» el 18-11-2026: «36°06,6' N» no se aceptaba.
describe("coordenadas escritas como en la carta", () => {
  const europaLat = 36 + 6.6 / 60;
  const europaLon = -(5 + 20.6 / 60);

  it("con la letra detrás, delante o pegada", () => {
    for (const t of ["36°06,6'N", "36º 06.6' N", "36 06,6 N", "N 36°06,6'", "n36°06,6'"]) {
      expect(leerLatitud(t, -1)).toBeCloseTo(europaLat, 9); // la letra manda sobre el botón
    }
    for (const t of ["005°20,6'W", "5º 20.6' W", "5 20,6 W", "W 005°20,6'", "5°20,6'O", "5°20,6' o"]) {
      expect(leerLongitud(t, 1)).toBeCloseTo(europaLon, 9);
    }
  });

  it("sin letra manda el botón, como antes", () => {
    expect(leerLatitud("36°06,6'", -1)).toBeCloseTo(-europaLat, 9);
    expect(leerLongitud("005°20,6'", -1)).toBeCloseTo(europaLon, 9);
    expect(leerLatitud("36,11", 1)).toBeCloseTo(36.11, 9);
  });

  it("con segundos", () => {
    expect(leerAngulo("36°06'36\"")).toBeCloseTo(europaLat, 9);
    expect(leerAngulo("5°20′36″")).toBeCloseTo(5 + 20.6 / 60, 9);
    expect(leerAngulo("36 6 36")).toBeCloseTo(europaLat, 9);
    expect(leerLatitud("36°06'36\" N", -1)).toBeCloseTo(europaLat, 9);
    expect(() => leerAngulo("36°06'75\"")).toThrow(/segundos/);
    expect(() => leerAngulo("36°06,5'30\"")).toThrow(/minutos deben ser enteros/);
  });

  it("separa la letra y dice qué signo indica", () => {
    expect(separarHemisferio("36°06,6' S", "lat")).toEqual({ numero: "36°06,6'", signo: -1 });
    expect(separarHemisferio("E 3°", "lon")).toEqual({ numero: "3°", signo: 1 });
    expect(separarHemisferio("36°06,6'", "lat")).toEqual({ numero: "36°06,6'" });
  });

  it("letra equivocada o sin número", () => {
    expect(() => leerLatitud("36°06,6' E", 1)).toThrow(/latitud usa N o S/);
    expect(() => leerLongitud("5° N", 1)).toThrow(/longitud usa E o W/);
    expect(() => leerLatitud("N", 1)).toThrow(/Falta el valor/);
  });
});
