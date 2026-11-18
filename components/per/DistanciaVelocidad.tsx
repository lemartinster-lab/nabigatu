"use client";

import { useState } from "react";
import { leerDuracion, leerHora, leerPositivo, formatoDuracion, formatoNumero } from "@/lib/nucleo/unidades";
import { resolverDVT } from "@/lib/per/dvt";
import { intentar, opt, Incompleto, type Fila } from "../calculo";
import { Campo, Resultado } from "../campos";

export function DistanciaVelocidad() {
  const [d, setD] = useState("");
  const [v, setV] = useState("");
  const [t, setT] = useState("");
  const [salidaHora, setSalidaHora] = useState("");

  const salida = intentar(() => {
    const datos = {
      distancia: opt(d, (x) => leerPositivo(x, "Distancia")),
      velocidad: opt(v, (x) => leerPositivo(x, "Velocidad")),
      tiempo: opt(t, leerDuracion),
      horaSalida: opt(salidaHora, leerHora),
    };
    const rellenos = [datos.distancia, datos.velocidad, datos.tiempo].filter((x) => x !== undefined).length;
    if (rellenos < 2) throw new Incompleto();

    const r = resolverDVT(datos);
    const resultados: Fila[] = [];
    if (datos.distancia === undefined) resultados.push({ etiqueta: "Distancia", valor: `${formatoNumero(r.distancia)} millas`, destacado: true });
    if (datos.velocidad === undefined) resultados.push({ etiqueta: "Velocidad", valor: `${formatoNumero(r.velocidad)} nudos`, destacado: true });
    if (datos.tiempo === undefined) resultados.push({ etiqueta: "Tiempo", valor: formatoDuracion(r.tiempo), destacado: true });
    if (r.llegada) resultados.push({ etiqueta: "Hora de llegada", valor: r.llegada });
    return { resultados, pasos: r.pasos };
  });

  return (
    <>
      <p className="text-sm text-slate-600">Rellena dos datos cualesquiera y calculo el tercero.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Distancia" valor={d} onChange={setD} placeholder="18" unidad="millas" />
        <Campo etiqueta="Velocidad" valor={v} onChange={setV} placeholder="6" unidad="nudos" />
        <Campo etiqueta="Tiempo" valor={t} onChange={setT} placeholder="2:30" modo="text" ayuda="2:30, 2h 30m o 2,5 (horas)" />
      </div>
      <div className="sm:w-1/3">
        <Campo etiqueta="Hora de salida (opcional)" valor={salidaHora} onChange={setSalidaHora} placeholder="09:15" modo="text" ayuda="Para calcular la hora de llegada." />
      </div>
      <Resultado salida={salida} />
    </>
  );
}
