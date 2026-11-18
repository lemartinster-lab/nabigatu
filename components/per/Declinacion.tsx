"use client";

import { useState } from "react";
import { EntradaInvalida, formatoEW } from "@/lib/nucleo/angulos";
import { leerNumero } from "@/lib/nucleo/unidades";
import { actualizarDeclinacion } from "@/lib/per/declinacion";
import { intentar, req } from "../calculo";
import { Campo, CampoConSigno, Resultado } from "../campos";
import { conSigno } from "./Correccion";

function leerAnio(t: string): number {
  const n = leerNumero(t, "Año");
  if (!Number.isInteger(n) || n < 1900 || n > 2200) throw new EntradaInvalida("Escribe un año de cuatro cifras");
  return n;
}

export function Declinacion() {
  const [dm, setDm] = useState("");
  const [sDm, setSDm] = useState<1 | -1>(-1);
  const [anioCarta, setAnioCarta] = useState("");
  const [variacion, setVariacion] = useState("");
  const [sVar, setSVar] = useState<1 | -1>(1);
  const [anio, setAnio] = useState(String(new Date().getFullYear()));

  const salida = intentar(() => {
    const r = actualizarDeclinacion(
      req(dm, (t) => conSigno(t, sDm)),
      req(anioCarta, leerAnio),
      req(variacion, (t) => sVar * Math.abs(leerNumero(t, "Variación anual"))),
      req(anio, leerAnio),
    );
    return {
      resultados: [{ etiqueta: `dm para ${anio}`, valor: formatoEW(r.dm), destacado: true }],
      pasos: r.pasos,
    };
  });

  return (
    <>
      <p className="text-sm text-slate-600">
        En la rosa de la carta verás algo como <strong>«4°15′W 2005 (7′E)»</strong>: dm de 4°15′ W en 2005, que cambia 7′ hacia el Este cada año.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoConSigno etiqueta="dm de la carta" valor={dm} onChange={setDm} signo={sDm} onSigno={setSDm} />
        <Campo etiqueta="Año de la carta" valor={anioCarta} onChange={setAnioCarta} placeholder="2005" modo="numeric" />
        <CampoConSigno etiqueta="Variación anual (minutos)" valor={variacion} onChange={setVariacion} signo={sVar} onSigno={setSVar} placeholder="7" ayuda="El número entre paréntesis, en minutos de arco." />
        <Campo etiqueta="Año actual" valor={anio} onChange={setAnio} modo="numeric" />
      </div>
      <Resultado salida={salida} />
    </>
  );
}
