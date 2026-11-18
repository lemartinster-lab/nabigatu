"use client";

import { useState } from "react";
import { EntradaInvalida } from "@/lib/nucleo/angulos";
import { leerHora, leerNumero } from "@/lib/nucleo/unidades";
import { formatoHoraMin, horaParaSonda, sondaAHora, type Extremo } from "@/lib/py/mareas";
import { formatoNumero } from "@/lib/nucleo/unidades";
import { Incompleto, intentar, req } from "../calculo";
import { Campo, Resultado, Segmentado } from "../campos";

type Fila = { hora: string; altura: string };
const FILAS_INICIALES: Fila[] = Array.from({ length: 4 }, () => ({ hora: "", altura: "" }));

function leerTabla(filas: Fila[]): Extremo[] {
  const usadas = filas.filter((f) => f.hora.trim() !== "" || f.altura.trim() !== "");
  if (usadas.length < 2) throw new Incompleto();
  return usadas.map((f, i) => {
    if (f.hora.trim() === "" || f.altura.trim() === "") throw new Incompleto();
    try {
      return { minutos: leerHora(f.hora), altura: leerNumero(f.altura, `Altura de la fila ${i + 1}`) };
    } catch (e) {
      if (e instanceof EntradaInvalida) throw new EntradaInvalida(`Fila ${i + 1}: ${e.message}`);
      throw e;
    }
  });
}

export function Mareas() {
  const [modo, setModo] = useState<"sonda" | "hora">("sonda");
  const [filas, setFilas] = useState<Fila[]>(FILAS_INICIALES);
  const [adelanto, setAdelanto] = useState("1");
  const [sondaCarta, setSondaCarta] = useState("");
  const [hora, setHora] = useState("");
  const [sondaBuscada, setSondaBuscada] = useState("");

  const cambiarFila = (i: number, campo: keyof Fila, v: string) =>
    setFilas((fs) => fs.map((f, j) => (j === i ? { ...f, [campo]: v } : f)));

  const salida = intentar(() => {
    const tabla = leerTabla(filas);
    const adel = req(adelanto, (t) => leerNumero(t, "Adelanto"));
    const carta = req(sondaCarta, (t) => leerNumero(t, "Sonda de la carta"));
    if (modo === "sonda") {
      const r = sondaAHora(tabla, req(hora, leerHora), adel, carta);
      return {
        resultados: [
          { etiqueta: "Sonda", valor: `${formatoNumero(r.sonda)} m`, destacado: true },
          { etiqueta: "Altura de la marea", valor: `${formatoNumero(r.altura)} m` },
        ],
        pasos: r.pasos,
      };
    }
    const r = horaParaSonda(tabla, req(sondaBuscada, (t) => leerNumero(t, "Sonda buscada")), adel, carta);
    return {
      resultados: r.soluciones.map((s, i) => ({
        etiqueta: `${r.soluciones.length > 1 ? `${i + 1}) ` : ""}${s.sube ? "Subiendo" : "Bajando"}: ${formatoHoraMin(s.horaUT)} UT`,
        valor: `${formatoHoraMin(s.horaOficial)} oficial`,
        destacado: true,
      })),
      pasos: [
        ...(r.soluciones.length > 1 ? ["Hay varias soluciones: el enunciado indica en qué intervalo buscarla.", ""] : []),
        ...r.pasos,
      ],
    };
  });

  return (
    <>
      <Segmentado
        opciones={[
          { valor: "sonda", etiqueta: "Sonda a una hora" },
          { valor: "hora", etiqueta: "Hora para una sonda" },
        ]}
        valor={modo}
        onChange={setModo}
      />
      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
        <div className="mb-2 text-sm font-semibold text-slate-700">Anuario de mareas (horas UT, en orden)</div>
        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2">
          <span />
          <span className="text-xs text-slate-500">Hora UT</span>
          <span className="text-xs text-slate-500">Altura (m)</span>
          {filas.map((f, i) => (
            <div key={i} className="contents">
              <span className="text-xs text-slate-400">{i + 1}</span>
              <input
                aria-label={`Hora ${i + 1}`}
                className="w-full min-w-0 rounded-lg border border-slate-300 px-2 py-2 text-base"
                value={f.hora}
                onChange={(e) => cambiarFila(i, "hora", e.target.value)}
                placeholder="05:49"
                inputMode="text"
              />
              <input
                aria-label={`Altura ${i + 1}`}
                className="w-full min-w-0 rounded-lg border border-slate-300 px-2 py-2 text-base"
                value={f.altura}
                onChange={(e) => cambiarFila(i, "altura", e.target.value)}
                placeholder="0,90"
                inputMode="decimal"
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-3 text-sm">
          {filas.length < 6 && (
            <button type="button" className="font-medium text-sky-800" onClick={() => setFilas((fs) => [...fs, { hora: "", altura: "" }])}>
              + Añadir fila
            </button>
          )}
          <button type="button" className="text-slate-500" onClick={() => setFilas(FILAS_INICIALES)}>
            Vaciar tabla
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Si una hora es menor que la anterior, se entiende que es del día siguiente.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Adelanto vigente" valor={adelanto} onChange={setAdelanto} unidad="h" ayuda="Hora oficial = UT + adelanto" />
        <Campo etiqueta="Sonda en la carta" valor={sondaCarta} onChange={setSondaCarta} placeholder="1,90" unidad="m" ayuda="0 si solo quieres la altura de marea" />
        {modo === "sonda" ? (
          <Campo etiqueta="Hora oficial" valor={hora} onChange={setHora} placeholder="08:25" modo="text" />
        ) : (
          <Campo etiqueta="Sonda buscada" valor={sondaBuscada} onChange={setSondaBuscada} placeholder="3,30" unidad="m" />
        )}
      </div>
      <Resultado salida={salida} />
    </>
  );
}
