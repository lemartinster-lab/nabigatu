"use client";

import { useState } from "react";
import { EntradaInvalida, formatoRumbo, leerRumbo } from "@/lib/nucleo/angulos";
import { formatoNumero, leerNumero, leerPositivo } from "@/lib/nucleo/unidades";
import {
  corrienteDesconocida,
  efectoCorriente,
  rumboADar,
  rumboContraCorriente,
  rumboSuperficie,
} from "@/lib/per/viento-corriente";
import { intentar, opt, req, type Fila } from "../calculo";
import { Campo, CampoConSigno, Resultado, Segmentado } from "../campos";
import { conSigno } from "./Correccion";

const leerIntensidad = (t: string) => {
  const v = leerNumero(t, "Intensidad");
  if (v < 0) throw new EntradaInvalida("La intensidad de la corriente no puede ser negativa");
  return v;
};

export function Viento() {
  const [rv, setRv] = useState("");
  const [ab, setAb] = useState("");
  const [sAb, setSAb] = useState<1 | -1>(1);

  const salida = intentar(() => {
    const r = rumboSuperficie(req(rv, leerRumbo), req(ab, (t) => conSigno(t, sAb)));
    return { resultados: [{ etiqueta: "Rumbo de superficie (Rs)", valor: formatoRumbo(r.rs), destacado: true }], pasos: r.pasos };
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Rumbo verdadero (Rv)" valor={rv} onChange={setRv} placeholder="090" unidad="°" />
        <CampoConSigno
          etiqueta="Abatimiento (Ab)"
          valor={ab}
          onChange={setAb}
          signo={sAb}
          onSigno={setSAb}
          positivo="Babor"
          negativo="Estribor"
          placeholder="5"
          ayuda="¿Por qué banda entra el viento? Por babor suma; por estribor resta."
        />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

type ModoCorriente = "efecto" | "compensar" | "deducir";

export function Corriente() {
  const [modo, setModo] = useState<ModoCorriente>("efecto");
  const [rumbo, setRumbo] = useState("");
  const [vb, setVb] = useState("");
  const [rc, setRc] = useState("");
  const [ic, setIc] = useState("");
  const [ref, setRef] = useState("");
  const [vef, setVef] = useState("");

  const salida = intentar(() => {
    if (modo === "efecto") {
      const r = efectoCorriente(req(rumbo, leerRumbo), req(vb, (t) => leerPositivo(t, "Velocidad")), req(rc, leerRumbo), req(ic, leerIntensidad));
      return {
        resultados: [
          { etiqueta: "Rumbo efectivo (Ref)", valor: formatoRumbo(r.ref), destacado: true },
          { etiqueta: "Velocidad efectiva (Vef)", valor: `${formatoNumero(r.vef)} nudos`, destacado: true },
        ],
        pasos: r.pasos,
      };
    }
    if (modo === "compensar") {
      const r = rumboContraCorriente(req(ref, leerRumbo), req(vb, (t) => leerPositivo(t, "Velocidad")), req(rc, leerRumbo), req(ic, leerIntensidad));
      return {
        resultados: [
          { etiqueta: "Rumbo de superficie a hacer (Rs)", valor: formatoRumbo(r.rs), destacado: true },
          { etiqueta: "Velocidad efectiva (Vef)", valor: `${formatoNumero(r.vef)} nudos`, destacado: true },
        ],
        pasos: r.pasos,
      };
    }
    const r = corrienteDesconocida(req(rumbo, leerRumbo), req(vb, (t) => leerPositivo(t, "Velocidad")), req(ref, leerRumbo), req(vef, (t) => leerPositivo(t, "Velocidad efectiva")));
    return {
      resultados: [
        { etiqueta: "Rumbo de la corriente (Rc)", valor: formatoRumbo(r.rc), destacado: true },
        { etiqueta: "Intensidad (Ic)", valor: `${formatoNumero(r.ic)} nudos`, destacado: true },
      ],
      pasos: r.pasos,
    };
  });

  return (
    <>
      <Segmentado
        etiqueta="¿Qué quieres saber?"
        opciones={[
          { valor: "efecto", etiqueta: "Por dónde voy" },
          { valor: "compensar", etiqueta: "Qué rumbo hacer" },
          { valor: "deducir", etiqueta: "Qué corriente hay" },
        ]}
        valor={modo}
        onChange={setModo}
      />
      <p className="text-sm text-slate-600">
        {modo === "efecto" && "Navegas a un rumbo y velocidad con una corriente conocida: ¿por dónde avanzas realmente?"}
        {modo === "compensar" && "Quieres avanzar por un rumbo de la carta con corriente: ¿qué rumbo de superficie debes hacer?"}
        {modo === "deducir" && "Sabes lo que navegaste y por dónde avanzaste realmente (situación observada): ¿qué corriente hubo?"}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {modo !== "compensar" && <Campo etiqueta="Rumbo de superficie (Rs)" valor={rumbo} onChange={setRumbo} placeholder="000" unidad="°" />}
        {modo !== "efecto" && <Campo etiqueta={modo === "compensar" ? "Rumbo efectivo deseado (Ref)" : "Rumbo efectivo (Ref)"} valor={ref} onChange={setRef} placeholder="018" unidad="°" />}
        <Campo etiqueta="Velocidad del barco (Vb)" valor={vb} onChange={setVb} placeholder="6" unidad="nudos" />
        {modo === "deducir" ? (
          <Campo etiqueta="Velocidad efectiva (Vef)" valor={vef} onChange={setVef} placeholder="6,3" unidad="nudos" />
        ) : (
          <>
            <Campo etiqueta="Rumbo de la corriente (Rc)" valor={rc} onChange={setRc} placeholder="090" unidad="°" ayuda="Hacia dónde va la corriente." />
            <Campo etiqueta="Intensidad de la corriente (Ic)" valor={ic} onChange={setIc} placeholder="2" unidad="nudos" />
          </>
        )}
      </div>
      <Resultado salida={salida} />
    </>
  );
}

export function RumboADar() {
  const [ref, setRef] = useState("");
  const [vb, setVb] = useState("");
  const [rc, setRc] = useState("");
  const [ic, setIc] = useState("");
  const [ab, setAb] = useState("");
  const [sAb, setSAb] = useState<1 | -1>(1);
  const [ct, setCt] = useState("");
  const [sCt, setSCt] = useState<1 | -1>(-1);

  const salida = intentar(() => {
    const rcV = opt(rc, leerRumbo);
    const icV = opt(ic, leerIntensidad);
    const r = rumboADar({
      ref: req(ref, leerRumbo),
      vb: req(vb, (t) => leerPositivo(t, "Velocidad")),
      rc: rcV,
      ic: rcV !== undefined ? icV : undefined,
      ab: opt(ab, (t) => conSigno(t, sAb)),
      ct: opt(ct, (t) => conSigno(t, sCt)),
    });
    const resultados: Fila[] = [];
    if (r.ra !== undefined) resultados.push({ etiqueta: "Rumbo de aguja al timonel (Ra)", valor: formatoRumbo(r.ra), destacado: true });
    resultados.push(
      { etiqueta: "Rumbo verdadero (Rv)", valor: formatoRumbo(r.rv), destacado: r.ra === undefined },
      { etiqueta: "Rumbo de superficie (Rs)", valor: formatoRumbo(r.rs) },
      { etiqueta: "Velocidad efectiva (Vef)", valor: `${formatoNumero(r.vef)} nudos` },
    );
    if (r.ra === undefined) resultados.push({ etiqueta: "Ct", valor: "Añádela para obtener el Ra" });
    return { resultados, pasos: r.pasos };
  });

  return (
    <>
      <p className="text-sm text-slate-600">
        El ejercicio típico del examen: trazas en la carta el rumbo al destino y calculas qué rumbo de aguja dar. Corriente, viento y Ct son opcionales; usa los que tengas.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Rumbo efectivo al destino (Ref)" valor={ref} onChange={setRef} placeholder="000" unidad="°" ayuda="El que trazas en la carta." />
        <Campo etiqueta="Velocidad del barco (Vb)" valor={vb} onChange={setVb} placeholder="6" unidad="nudos" />
        <Campo etiqueta="Rumbo de la corriente (Rc)" valor={rc} onChange={setRc} placeholder="090" unidad="°" ayuda="Opcional. Hacia dónde va la corriente." />
        <Campo etiqueta="Intensidad de la corriente (Ic)" valor={ic} onChange={setIc} placeholder="2" unidad="nudos" />
        <CampoConSigno etiqueta="Abatimiento (opcional)" valor={ab} onChange={setAb} signo={sAb} onSigno={setSAb} positivo="Babor" negativo="Estribor" placeholder="5" ayuda="Banda por la que entra el viento." />
        <CampoConSigno etiqueta="Corrección total (opcional)" valor={ct} onChange={setCt} signo={sCt} onSigno={setSCt} placeholder="1" />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

