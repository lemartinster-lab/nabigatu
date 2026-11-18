"use client";

import { useState } from "react";
import { formatoLatitud, formatoLongitud, formatoRumbo, leerRumbo } from "@/lib/nucleo/angulos";
import { formatoNumero, leerDuracion, leerPositivo } from "@/lib/nucleo/unidades";
import { demoraYDistancia, demorasNoSimultaneas, dosDemoras, pasarADistancia } from "@/lib/py/situacion";
import { intentar, req, reqPosicion } from "../calculo";
import { Campo, CampoPosicion, POSICION_VACIA, Resultado, Segmentado } from "../campos";

type Modo = "dos" | "traslado" | "distancia" | "pasar";

export function Situacion() {
  const [modo, setModo] = useState<Modo>("dos");
  const [f1, setF1] = useState(POSICION_VACIA);
  const [f2, setF2] = useState(POSICION_VACIA);
  const [dv1, setDv1] = useState("");
  const [dv2, setDv2] = useState("");
  const [mismoFaro, setMismoFaro] = useState(false);
  const [rumbo, setRumbo] = useState("");
  const [vel, setVel] = useState("");
  const [intervalo, setIntervalo] = useState("");
  const [dist, setDist] = useState("");
  const [desde, setDesde] = useState(POSICION_VACIA);
  const [banda, setBanda] = useState<"babor" | "estribor">("estribor");

  const posicionFilas = (p: { lat: number; lon: number }) => [
    { etiqueta: "Latitud", valor: formatoLatitud(p.lat), destacado: true },
    { etiqueta: "Longitud", valor: formatoLongitud(p.lon), destacado: true },
  ];

  const salida = intentar(() => {
    if (modo === "dos") {
      const r = dosDemoras(reqPosicion(f1), req(dv1, leerRumbo), reqPosicion(f2), req(dv2, leerRumbo));
      return { resultados: posicionFilas(r.posicion), pasos: r.pasos };
    }
    if (modo === "traslado") {
      const faro1 = reqPosicion(f1);
      const faro2 = mismoFaro ? faro1 : reqPosicion(f2);
      const r = demorasNoSimultaneas(
        faro1,
        req(dv1, leerRumbo),
        faro2,
        req(dv2, leerRumbo),
        req(rumbo, leerRumbo),
        req(vel, (t) => leerPositivo(t, "Velocidad")),
        req(intervalo, leerDuracion),
      );
      return { resultados: posicionFilas(r.posicion), pasos: r.pasos };
    }
    if (modo === "distancia") {
      const r = demoraYDistancia(reqPosicion(f1), req(dv1, leerRumbo), req(dist, (t) => leerPositivo(t, "Distancia")));
      return { resultados: posicionFilas(r.posicion), pasos: r.pasos };
    }
    const r = pasarADistancia(reqPosicion(desde), reqPosicion(f1), req(dist, (t) => leerPositivo(t, "Distancia")), banda);
    return {
      resultados: [
        { etiqueta: "Rumbo efectivo a hacer", valor: formatoRumbo(r.rumbo), destacado: true },
        { etiqueta: "Demora y distancia actuales", valor: `${formatoRumbo(r.demora)} · ${formatoNumero(r.distanciaActual, 1)} mn` },
      ],
      pasos: r.pasos,
    };
  });

  return (
    <>
      <Segmentado
        opciones={[
          { valor: "dos", etiqueta: "2 demoras" },
          { valor: "traslado", etiqueta: "No simultáneas" },
          { valor: "distancia", etiqueta: "Demora y dist." },
          { valor: "pasar", etiqueta: "Pasar a X millas" },
        ]}
        valor={modo}
        onChange={setModo}
      />
      <p className="text-sm text-slate-600">
        Lee en la carta las coordenadas de los faros y escribe las demoras <strong>verdaderas</strong> (si tienes demoras de aguja, súmales antes la Ct).
      </p>

      {modo === "pasar" ? (
        <>
          <CampoPosicion etiqueta="Nuestra situación" valor={desde} onChange={setDesde} />
          <CampoPosicion etiqueta="Faro o punto a pasar" valor={f1} onChange={setF1} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Distancia de paso" valor={dist} onChange={setDist} placeholder="5" unidad="millas" />
            <Segmentado
              etiqueta="Dejarlo por"
              opciones={[
                { valor: "babor", etiqueta: "Babor" },
                { valor: "estribor", etiqueta: "Estribor" },
              ]}
              valor={banda}
              onChange={setBanda}
            />
          </div>
        </>
      ) : (
        <>
          <CampoPosicion etiqueta={modo === "distancia" ? "Faro" : "Faro de la 1.ª demora"} valor={f1} onChange={setF1} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta={modo === "distancia" ? "Demora verdadera" : "1.ª demora verdadera"} valor={dv1} onChange={setDv1} placeholder="070" unidad="°" />
            {modo === "distancia" && <Campo etiqueta="Distancia al faro" valor={dist} onChange={setDist} placeholder="4,5" unidad="millas" />}
          </div>

          {modo !== "distancia" && (
            <>
              {modo === "traslado" && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={mismoFaro} onChange={(e) => setMismoFaro(e.target.checked)} className="size-4" />
                  Las dos demoras son al mismo faro
                </label>
              )}
              {!(modo === "traslado" && mismoFaro) && <CampoPosicion etiqueta="Faro de la 2.ª demora" valor={f2} onChange={setF2} />}
              <Campo etiqueta="2.ª demora verdadera" valor={dv2} onChange={setDv2} placeholder="045" unidad="°" />
            </>
          )}

          {modo === "traslado" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo etiqueta="Rumbo efectivo entre demoras" valor={rumbo} onChange={setRumbo} placeholder="150" unidad="°" />
              <Campo etiqueta="Velocidad efectiva" valor={vel} onChange={setVel} placeholder="5" unidad="nudos" />
              <Campo etiqueta="Tiempo entre demoras" valor={intervalo} onChange={setIntervalo} placeholder="2:00" modo="text" />
            </div>
          )}
        </>
      )}
      <Resultado salida={salida} />
    </>
  );
}
