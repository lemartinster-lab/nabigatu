"use client";

import { useState } from "react";
import {
  aCuadrantal,
  aGradosMinutos,
  desdeCuadrantal,
  formatoCuadrantal,
  formatoRumbo,
  leerAngulo,
  leerCuadrantal,
  leerRumbo,
} from "@/lib/nucleo/angulos";
import {
  convertirDistancia,
  convertirVelocidad,
  formatoNumero,
  leerNumero,
  type UnidadDistancia,
  type UnidadVelocidad,
} from "@/lib/nucleo/unidades";
import { intentar, req } from "../calculo";
import { Campo, Resultado, Segmentado } from "../campos";

type Tipo = "angulo" | "cuadrantal" | "distancia" | "velocidad";

const DIST: { valor: UnidadDistancia; etiqueta: string }[] = [
  { valor: "mn", etiqueta: "Millas" },
  { valor: "cable", etiqueta: "Cables" },
  { valor: "km", etiqueta: "km" },
  { valor: "m", etiqueta: "m" },
];
const VEL: { valor: UnidadVelocidad; etiqueta: string }[] = [
  { valor: "nudos", etiqueta: "Nudos" },
  { valor: "kmh", etiqueta: "km/h" },
  { valor: "ms", etiqueta: "m/s" },
];

export function Conversiones() {
  const [tipo, setTipo] = useState<Tipo>("angulo");
  const [valor, setValor] = useState("");
  const [udDist, setUdDist] = useState<UnidadDistancia>("mn");
  const [udVel, setUdVel] = useState<UnidadVelocidad>("nudos");

  const salida = intentar(() => {
    if (tipo === "angulo") {
      const g = req(valor, leerAngulo);
      const { g: gg, m } = aGradosMinutos(g);
      const signo = g < 0 ? "−" : "";
      return {
        resultados: [
          { etiqueta: "Grados y minutos", valor: `${signo}${gg}° ${String(m).replace(".", ",")}′`, destacado: true },
          { etiqueta: "Grados decimales", valor: `${formatoNumero(g, 4)}°`, destacado: true },
        ],
        pasos: [`Minutos = parte decimal × 60`, `${formatoNumero(Math.abs(g) - gg, 4)} × 60 = ${String(m).replace(".", ",")}′`],
      };
    }
    if (tipo === "cuadrantal") {
      const t = req(valor, (x) => x);
      if (/^[NSns]/.test(t.trim())) {
        const c = leerCuadrantal(t);
        const r = desdeCuadrantal(c);
        return {
          resultados: [{ etiqueta: "Rumbo circular", valor: formatoRumbo(r), destacado: true }],
          pasos: [`${formatoCuadrantal(c)} → ${formatoRumbo(r)}`, "N…E = g · S…E = 180 − g · S…W = 180 + g · N…W = 360 − g"],
        };
      }
      const r = leerRumbo(t);
      const c = aCuadrantal(r);
      return {
        resultados: [{ etiqueta: "Rumbo cuadrantal", valor: formatoCuadrantal(c), destacado: true }],
        pasos: [`${formatoRumbo(r)} → ${formatoCuadrantal(c)}`],
      };
    }
    if (tipo === "distancia") {
      const v = req(valor, (x) => leerNumero(x, "Distancia"));
      return {
        resultados: DIST.filter((u) => u.valor !== udDist).map((u) => ({
          etiqueta: u.etiqueta,
          valor: formatoNumero(convertirDistancia(v, udDist, u.valor), 3),
        })),
        pasos: ["1 milla náutica = 1.852 m = 10 cables", "1 cable = 185,2 m"],
      };
    }
    const v = req(valor, (x) => leerNumero(x, "Velocidad"));
    return {
      resultados: VEL.filter((u) => u.valor !== udVel).map((u) => ({
        etiqueta: u.etiqueta,
        valor: formatoNumero(convertirVelocidad(v, udVel, u.valor), 3),
      })),
      pasos: ["1 nudo = 1 milla por hora = 1,852 km/h"],
    };
  });

  const ayuda: Record<Tipo, { etiqueta: string; placeholder: string; ayuda: string }> = {
    angulo: { etiqueta: "Ángulo", placeholder: "28°27,5' o 28,4583", ayuda: "Escribe en grados y minutos o en grados decimales." },
    cuadrantal: { etiqueta: "Rumbo", placeholder: "N45E o 135", ayuda: "Escribe un cuadrantal (N45E, S30W) o un circular (135)." },
    distancia: { etiqueta: "Distancia", placeholder: "10", ayuda: "" },
    velocidad: { etiqueta: "Velocidad", placeholder: "6", ayuda: "" },
  };

  return (
    <>
      <Segmentado
        opciones={[
          { valor: "angulo", etiqueta: "Ángulos" },
          { valor: "cuadrantal", etiqueta: "Cuadrantal" },
          { valor: "distancia", etiqueta: "Distancia" },
          { valor: "velocidad", etiqueta: "Velocidad" },
        ]}
        valor={tipo}
        onChange={(t) => {
          setTipo(t);
          setValor("");
        }}
      />
      {tipo === "distancia" && <Segmentado etiqueta="Unidad de partida" opciones={DIST} valor={udDist} onChange={setUdDist} />}
      {tipo === "velocidad" && <Segmentado etiqueta="Unidad de partida" opciones={VEL} valor={udVel} onChange={setUdVel} />}
      <Campo
        etiqueta={ayuda[tipo].etiqueta}
        valor={valor}
        onChange={setValor}
        placeholder={ayuda[tipo].placeholder}
        ayuda={ayuda[tipo].ayuda || undefined}
        modo={tipo === "cuadrantal" ? "text" : "decimal"}
      />
      <Resultado salida={salida} />
    </>
  );
}
