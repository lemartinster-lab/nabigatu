"use client";

import { BEAUFORT, DOUGLAS } from "@/lib/teoria/escalas";
import { formatoNumero } from "@/lib/nucleo/unidades";

const intervalo = (min: number, max: number | null, unidad: string) =>
  max === null ? `${formatoNumero(min)} ${unidad} o más` : min === max ? `${formatoNumero(min)} ${unidad}` : `${formatoNumero(min)} a ${formatoNumero(max)} ${unidad}`;

export function EscalasMeteo() {
  return (
    <>
      <p className="text-sm text-slate-600">
        Las dos escalas que más se preguntan de memoria. La Beaufort mide la fuerza del viento y la Douglas, el estado de la mar
        de viento por la altura de las olas.
      </p>
      <section className="flex flex-col gap-2">
        <h3 className="font-semibold text-sky-950">Escala Beaufort (viento)</h3>
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Fuerza</th>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">Nudos</th>
                <th className="px-3 py-2 font-medium">Aspecto de la mar</th>
              </tr>
            </thead>
            <tbody>
              {BEAUFORT.map((g) => (
                <tr key={g.fuerza} className={`border-t border-slate-100 ${g.fuerza >= 7 ? "bg-rose-50/60" : ""}`}>
                  <td className="px-3 py-2 font-semibold">{g.fuerza}</td>
                  <td className="px-3 py-2">{g.nombre}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{intervalo(g.nudos[0], g.nudos[1], "kn")}</td>
                  <td className="min-w-[14rem] px-3 py-2 text-slate-600">{g.mar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">Truco: 6 fresco, 7 frescachón y a partir de 8 todo es «temporal».</p>
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="font-semibold text-sky-950">Escala Douglas (mar de viento)</h3>
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Grado</th>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">Altura de las olas</th>
              </tr>
            </thead>
            <tbody>
              {DOUGLAS.map((g) => (
                <tr key={g.grado} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold">{g.grado}</td>
                  <td className="px-3 py-2">{g.nombre}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{intervalo(g.metros[0], g.metros[1], "m")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          Para la mar de fondo (oleaje que llega de lejos) se usa otra descripción: no la confundas con la mar de viento.
        </p>
      </section>
    </>
  );
}
