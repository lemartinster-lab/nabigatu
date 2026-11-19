"use client";

import { ATRIBUCIONES_PNB, PNB_REVISADO } from "@/lib/pnb/atribuciones";
import { EXAMENES } from "@/lib/teoria/examenes";
import { TestTeoria } from "../teoria/TestTeoria";

export function AtribucionesPnb() {
  return (
    <>
      <p className="text-sm text-slate-600">
        Qué te permite el Patrón para Navegación Básica (PNB) y cómo se obtiene, con el artículo del BOE de donde sale cada dato.
      </p>
      <ul className="flex flex-col gap-2">
        {ATRIBUCIONES_PNB.map((n) => (
          <li key={n.titulo} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="font-semibold text-sky-950">{n.titulo}</div>
            <p className="mt-1 text-slate-700">{n.texto}</p>
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-sky-800 underline">
              {n.fuente}
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        Revisado el {PNB_REVISADO} con el texto consolidado del Real Decreto 875/2014 (última actualización publicada el
        30/12/2025). Es un resumen informativo: para fines jurídicos vale el BOE.
      </p>
    </>
  );
}

export function TestPnb() {
  return <TestTeoria def={EXAMENES.PNB} />;
}
