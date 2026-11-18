"use client";

import { useMemo, useState } from "react";
import { formatoRumbo } from "@/lib/nucleo/angulos";
import { leerLatitud, leerLongitud } from "@/lib/nucleo/coordenadas";
import { formatoNumero } from "@/lib/nucleo/unidades";
import { ESTRELLAS, datosAstro, nombreEstrella } from "@/lib/cy/efemerides";
import { formatoDeclinacion, formatoHorario } from "@/lib/cy/astros";
import { formatoAltura } from "@/lib/cy/alturas";
import { alturaYAzimut } from "@/lib/cy/astronomica";
import { formatoInstante, leerInstante } from "@/lib/cy/tiempo";
import { intentar, opt, req, type Fila } from "../calculo";
import { Campo, CampoConSigno, Resultado } from "../campos";

export function AlmanaqueCalculado() {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [astro, setAstro] = useState("sol");
  const [lon, setLon] = useState("");
  const [sLon, setSLon] = useState<1 | -1>(-1);
  const [lat, setLat] = useState("");
  const [sLat, setSLat] = useState<1 | -1>(1);

  const estrellas = useMemo(
    () => [...ESTRELLAS].sort((a, b) => nombreEstrella(a).localeCompare(nombreEstrella(b), "es")),
    [],
  );

  const salida = intentar(() => {
    const ms = req(fecha, () => leerInstante(fecha, req(hora, (h) => h)));
    const objetivo = astro === "sol" || astro === "aries" ? astro : estrellas.find((e) => e.nombre === astro)!;
    const d = datosAstro(objetivo, ms);
    const nombre = astro === "sol" ? "Sol" : astro === "aries" ? "Punto Aries (♈)" : nombreEstrella(objetivo as (typeof ESTRELLAS)[number]);

    const resultados: Fila[] = [{ etiqueta: `hG ${nombre}`, valor: formatoHorario(d.hG), destacado: true }];
    if (astro !== "aries") resultados.push({ etiqueta: "Declinación", valor: formatoDeclinacion(d.dec), destacado: true });
    if (d.as !== undefined) resultados.push({ etiqueta: "Ángulo sidéreo (AS)", valor: formatoHorario(d.as) });
    if (d.sd !== undefined) resultados.push({ etiqueta: "Semidiámetro", valor: `${formatoNumero(d.sd, 1)}′` });
    if (astro !== "aries" && d.as !== undefined) resultados.push({ etiqueta: "hG ♈ (Aries)", valor: formatoHorario(d.hGAries) });

    const pasos = [
      `Instante: ${formatoInstante(ms)} UT`,
      astro === "sol"
        ? "Sol: teoría VSOP87 recortada con nutación y aberración; hG = hG♈ − ascensión recta aparente"
        : astro === "aries"
          ? "Aries: tiempo sidéreo aparente de Greenwich"
          : "Estrella: posición J2000 de Hipparcos + movimiento propio, precesión, nutación y aberración; hG★ = hG♈ + AS",
    ];

    const lonV = opt(lon, (t) => leerLongitud(t, sLon));
    if (lonV !== undefined) {
      const hL = (((d.hG + lonV) % 360) + 360) % 360;
      resultados.push({ etiqueta: "Horario del lugar (hL)", valor: formatoHorario(hL), destacado: true });
      pasos.push(`hL = hG + λ = ${formatoHorario(hL)}`);
      const latV = opt(lat, (t) => leerLatitud(t, sLat));
      if (latV !== undefined && astro !== "aries") {
        const r = alturaYAzimut(latV, hL, d.dec);
        resultados.push(
          { etiqueta: "Azimut (Z)", valor: formatoRumbo(r.z), destacado: true },
          { etiqueta: "Altura estimada (ae)", valor: formatoAltura(r.ae), destacado: true },
        );
        pasos.push(`Desde la estima: Z = ${formatoRumbo(r.z)}, ae = ${formatoAltura(r.ae)}${r.ae < 0 ? " (bajo el horizonte)" : ""}`);
      }
    }
    pasos.push("Valores calculados, no oficiales: pueden diferir alguna décima de minuto del Almanaque Náutico.");
    return { resultados, pasos };
  });

  return (
    <>
      <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <strong>Para practicar sin el Almanaque.</strong> Los valores se calculan con fórmulas astronómicas y reproducen las
        soluciones de los exámenes oficiales que he comprobado, pero en el examen tendrás que usar el Almanaque Náutico.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Fecha" valor={fecha} onChange={setFecha} placeholder="26/09/2025" modo="text" />
        <Campo etiqueta="Hora UT (HcG)" valor={hora} onChange={setHora} placeholder="07:53:04" modo="text" />
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
          Astro
          <select value={astro} onChange={(e) => setAstro(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base">
            <option value="sol">Sol</option>
            <option value="aries">Punto Aries (♈)</option>
            <optgroup label="Estrellas">
              {estrellas.map((e) => (
                <option key={e.nombre} value={e.nombre}>
                  {nombreEstrella(e)}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <CampoConSigno etiqueta="Longitud (opcional)" valor={lon} onChange={setLon} signo={sLon} onSigno={setSLon} placeholder="35°27'" ayuda="Para el horario del lugar." />
        <CampoConSigno etiqueta="Latitud de estima (opcional)" valor={lat} onChange={setLat} signo={sLat} onSigno={setSLat} positivo="N" negativo="S" placeholder="19°48'" ayuda="Con la longitud, da el azimut y la altura estimada." />
      </div>
      <Resultado salida={salida} />
    </>
  );
}
