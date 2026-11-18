"use client";

import { useState } from "react";
import { formatoEW, formatoRumbo, leerAngulo, leerRumbo } from "@/lib/nucleo/angulos";
import { correccionTotal, ctDesdeDemora, deAgujaAVerdadero, deVerdaderoAAguja, type Tipo } from "@/lib/per/correccion";
import { intentar, opt, req } from "../calculo";
import { Campo, CampoConSigno, Resultado, Segmentado } from "../campos";

/** Lee un valor E/W: el usuario escribe el número sin signo y elige E o W con los botones. */
export function conSigno(texto: string, signo: 1 | -1): number {
  return signo * Math.abs(leerAngulo(texto));
}

export function CorreccionTotal() {
  const [dm, setDm] = useState("");
  const [sDm, setSDm] = useState<1 | -1>(-1);
  const [desvio, setDesvio] = useState("");
  const [sDes, setSDes] = useState<1 | -1>(1);

  const salida = intentar(() => {
    const r = correccionTotal(req(dm, (t) => conSigno(t, sDm)), req(desvio, (t) => conSigno(t, sDes)));
    return { resultados: [{ etiqueta: "Corrección total (Ct)", valor: formatoEW(r.ct), destacado: true }], pasos: r.pasos };
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoConSigno etiqueta="Declinación magnética (dm)" valor={dm} onChange={setDm} signo={sDm} onSigno={setSDm} ayuda="La de este año. Si es la de la carta, actualízala antes en «Declinación magnética»." />
        <CampoConSigno etiqueta="Desvío (Δ)" valor={desvio} onChange={setDesvio} signo={sDes} onSigno={setSDes} placeholder="2" ayuda="De la tablilla de desvíos, para el rumbo de aguja." />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

export function RumbosDemoras() {
  const [tipo, setTipo] = useState<Tipo>("rumbo");
  const [sentido, setSentido] = useState<"aguja" | "verdadero">("verdadero");
  const [valor, setValor] = useState("");
  const [ct, setCt] = useState("");
  const [sCt, setSCt] = useState<1 | -1>(-1);

  const v = tipo === "rumbo" ? { V: "Rv", A: "Ra", nombre: "Rumbo" } : { V: "Dv", A: "Da", nombre: "Demora" };
  const origen = sentido === "verdadero" ? v.V : v.A;
  const destino = sentido === "verdadero" ? v.A : v.V;

  const salida = intentar(() => {
    const x = req(valor, leerRumbo);
    const c = req(ct, (t) => conSigno(t, sCt));
    if (sentido === "verdadero") {
      const r = deVerdaderoAAguja(x, c, tipo);
      return { resultados: [{ etiqueta: `${v.nombre} de aguja (${v.A})`, valor: formatoRumbo(r.aguja), destacado: true }], pasos: r.pasos };
    }
    const r = deAgujaAVerdadero(x, c, tipo);
    return { resultados: [{ etiqueta: `${v.nombre} verdadero (${v.V})`, valor: formatoRumbo(r.verdadero), destacado: true }], pasos: r.pasos };
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmentado etiqueta="¿Qué calculas?" opciones={[{ valor: "rumbo", etiqueta: "Rumbo" }, { valor: "demora", etiqueta: "Demora" }]} valor={tipo} onChange={setTipo} />
        <Segmentado
          etiqueta="Sentido"
          opciones={[
            { valor: "verdadero", etiqueta: `${v.V} → ${v.A}` },
            { valor: "aguja", etiqueta: `${v.A} → ${v.V}` },
          ]}
          valor={sentido}
          onChange={setSentido}
        />
        <Campo etiqueta={`${v.nombre} ${sentido === "verdadero" ? "verdadero" : "de aguja"} (${origen})`} valor={valor} onChange={setValor} placeholder="045" unidad="°" />
        <CampoConSigno etiqueta="Corrección total (Ct)" valor={ct} onChange={setCt} signo={sCt} onSigno={setSCt} placeholder="1" />
      </div>
      <p className="text-xs text-slate-500">Resultado: {destino}</p>
      <Resultado salida={salida} />
    </>
  );
}

export function CtPorDemora() {
  const [dv, setDv] = useState("");
  const [da, setDa] = useState("");
  const [dm, setDm] = useState("");
  const [sDm, setSDm] = useState<1 | -1>(-1);

  const salida = intentar(() => {
    const r = ctDesdeDemora(req(dv, leerRumbo), req(da, leerRumbo), opt(dm, (t) => conSigno(t, sDm)));
    const resultados = [{ etiqueta: "Corrección total (Ct)", valor: formatoEW(r.ct), destacado: true }];
    if (r.desvio !== undefined) resultados.push({ etiqueta: "Desvío (Δ)", valor: formatoEW(r.desvio), destacado: false });
    return { resultados, pasos: r.pasos };
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Demora verdadera (Dv)" valor={dv} onChange={setDv} placeholder="125" unidad="°" ayuda="Medida en la carta (p. ej. la de una enfilación)." />
        <Campo etiqueta="Demora de aguja (Da)" valor={da} onChange={setDa} placeholder="130" unidad="°" ayuda="Leída con la aguja del barco." />
        <CampoConSigno etiqueta="dm (opcional)" valor={dm} onChange={setDm} signo={sDm} onSigno={setSDm} placeholder="3" ayuda="Si la pones, calculo también el desvío." />
      </div>
      <Resultado salida={salida} />
    </>
  );
}
