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
import {
  fenomenosSol,
  formatoHoraMinuto,
  formatoHoraUT,
  paginaAlmanaque,
  tablaIncrementos,
  type FenomenosSol,
} from "@/lib/cy/almanaque";
import { EntradaInvalida, formatoLatitud, formatoLongitud } from "@/lib/nucleo/angulos";
import { intentar, opt, req, type Fila } from "../calculo";
import { Campo, CampoConSigno, Resultado, Segmentado } from "../campos";

type Vista = "instante" | "pagina" | "incrementos";

export function AlmanaqueCalculado() {
  const [vista, setVista] = useState<Vista>("instante");
  return (
    <>
      <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <strong>Para practicar sin el Almanaque.</strong> Los valores se calculan con fórmulas astronómicas, coinciden con el
        Almanaque Náutico 2026 y reproducen las soluciones de los exámenes oficiales que he comprobado, pero en el examen
        tendrás que usar el Almanaque Náutico.
      </div>
      <Segmentado
        opciones={[
          { valor: "instante", etiqueta: "Un instante" },
          { valor: "pagina", etiqueta: "Página del día" },
          { valor: "incrementos", etiqueta: "Incrementos" },
        ]}
        valor={vista}
        onChange={setVista}
      />
      {vista === "instante" && <Instante />}
      {vista === "pagina" && <PaginaDelDia />}
      {vista === "incrementos" && <Incrementos />}
    </>
  );
}

/** Formato corto para tablas: «179° 10,0′». */
const hG = (g: number) => formatoHorario(g);

function Tabla({ cabecera, filas }: { cabecera: string[]; filas: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
      <table className="w-full text-right text-sm tabular-nums">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            {cabecera.map((c) => (
              <th key={c} className="px-3 py-2 font-medium first:text-left">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className="border-t border-slate-100">
              {f.map((c, j) => (
                <td key={j} className="whitespace-nowrap px-3 py-1.5 first:text-left first:font-medium">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LATITUDES = [52, 50, 45, 40, 35, 30, 20, 10, 0, -10, -20, -30, -40];
const nombreLat = (l: number) => (l === 0 ? "Ecuador" : `${Math.abs(l)}° ${l > 0 ? "N" : "S"}`);

function filaFenomenos(etiqueta: string, f: FenomenosSol, dia0: number): string[] {
  return [
    etiqueta,
    ...[f.inicioCrepusculoNautico, f.inicioCrepusculoCivil, f.salida, f.puesta, f.finCrepusculoCivil, f.finCrepusculoNautico].map((x) =>
      formatoHoraMinuto(x, dia0),
    ),
  ];
}

const CABECERA_FENOMENOS = ["Lat.", "Crep. náut.", "Crep. civil", "Salida", "Puesta", "Crep. civil", "Crep. náut."];

function PaginaDelDia() {
  const [fecha, setFecha] = useState("");
  const [lat, setLat] = useState("");
  const [sLat, setSLat] = useState<1 | -1>(1);
  const [lon, setLon] = useState("");
  const [sLon, setSLon] = useState<1 | -1>(-1);

  let pagina: ReturnType<typeof paginaAlmanaque> | undefined;
  let error: string | undefined;
  let lugar: { lat: number; lon: number } | undefined;
  try {
    if (fecha.trim()) {
      pagina = paginaAlmanaque(leerInstante(fecha, "00:00"));
      const latV = opt(lat, (t) => leerLatitud(t, sLat));
      if (latV !== undefined) lugar = { lat: latV, lon: opt(lon, (t) => leerLongitud(t, sLon)) ?? 0 };
    }
  } catch (e) {
    error = e instanceof EntradaInvalida ? e.message : "Revisa los datos.";
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Fecha" valor={fecha} onChange={setFecha} placeholder="18/11/2026" modo="text" />
        <div className="hidden sm:block" />
        <CampoConSigno tipo="lat" etiqueta="Latitud (opcional)" valor={lat} onChange={setLat} signo={sLat} onSigno={setSLat} positivo="N" negativo="S" placeholder="28°28'" ayuda="Salida, puesta y crepúsculos en tu situación." />
        <CampoConSigno tipo="lon" etiqueta="Longitud (opcional)" valor={lon} onChange={setLon} signo={sLon} onSigno={setSLon} placeholder="16°15'" ayuda="Sin longitud, horas para el meridiano de Greenwich." />
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p>}
      {pagina && (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Dato etiqueta="Paso meridiano (PMG)" valor={`${formatoHoraUT(pagina.pmg)} UT`} />
            <Dato etiqueta="Semidiámetro" valor={`${formatoNumero(pagina.sd, 1)}′`} />
            <Dato etiqueta="v (hG − 15°/h)" valor={`${formatoNumero(pagina.v, 1)}′/h`} />
            <Dato etiqueta="d (declinación)" valor={`${formatoNumero(pagina.d, 1)}′/h`} />
          </div>

          <h3 className="text-sm font-semibold text-slate-700">Sol y punto Aries, hora a hora (UT)</h3>
          <Tabla
            cabecera={["h", "hG Sol", "Dec Sol", "hG ♈"]}
            filas={pagina.filas.map((f) => [String(f.h), hG(f.hGSol), formatoDeclinacion(f.decSol), hG(f.hGAries)])}
          />
          <p className="text-xs text-slate-500">
            Para un instante entre dos horas: hG = hG de la hora + incremento de los minutos y segundos (pestaña
            «Incrementos»); la declinación se interpola entre las dos filas.
          </p>

          {lugar && (
            <>
              <h3 className="text-sm font-semibold text-slate-700">
                En {formatoLatitud(lugar.lat)}{lugar.lon ? ` y ${formatoLongitud(lugar.lon)}` : ""} (horas UT)
              </h3>
              <Tabla cabecera={CABECERA_FENOMENOS} filas={[filaFenomenos("Tu situación", fenomenosSol(pagina.dia0, lugar.lat, lugar.lon), pagina.dia0)]} />
              <p className="text-xs text-slate-500">
                Paso por tu meridiano: {formatoHoraUT(fenomenosSol(pagina.dia0, lugar.lat, lugar.lon).paso)} UT.
              </p>
            </>
          )}

          <h3 className="text-sm font-semibold text-slate-700">Crepúsculos, salida y puesta (meridiano de Greenwich)</h3>
          <Tabla cabecera={CABECERA_FENOMENOS} filas={LATITUDES.map((l) => filaFenomenos(nombreLat(l), fenomenosSol(pagina!.dia0, l), pagina!.dia0))} />
          <p className="text-xs text-slate-500">
            Como en el Almanaque, son horas civiles del lugar en el meridiano 0°; en otra longitud, súmales la longitud en
            tiempo si es W (réstala si es E) para pasarlas a UT.
          </p>

          <details className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">Estrellas: ángulo sidéreo y declinación</summary>
            <div className="mt-3">
              <Tabla
                cabecera={["Estrella", "AS", "Dec"]}
                filas={[...pagina.estrellas]
                  .sort((a, b) => nombreEstrella(a.estrella).localeCompare(nombreEstrella(b.estrella), "es"))
                  .map((e) => [nombreEstrella(e.estrella), hG(e.as), formatoDeclinacion(e.dec)])}
              />
            </div>
          </details>
        </>
      )}
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <div className="text-xs text-slate-500">{etiqueta}</div>
      <div className="font-semibold tabular-nums text-slate-900">{valor}</div>
    </div>
  );
}

function Incrementos() {
  const [minuto, setMinuto] = useState(0);
  const filas = useMemo(() => tablaIncrementos(minuto), [minuto]);
  return (
    <>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Minutos
        <select value={minuto} onChange={(e) => setMinuto(Number(e.target.value))} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base">
          {Array.from({ length: 60 }, (_, m) => (
            <option key={m} value={m}>
              {m} m
            </option>
          ))}
        </select>
      </label>
      <Tabla
        cabecera={["s", "Sol", "Aries"]}
        filas={filas.map((f) => [String(f.s), formatoIncremento(f.sol), formatoIncremento(f.aries)])}
      />
      <p className="text-xs text-slate-500">
        El Sol avanza 15° por hora y el punto Aries 15° 02,46′. Suma el incremento al hG de la hora entera del Almanaque.
      </p>
    </>
  );
}

/** «11° 01,8′» (sin ceros a la izquierda en los grados, como la tabla impresa). */
function formatoIncremento(g: number): string {
  let gg = Math.floor(g);
  let m = Math.round((g - gg) * 600 + 1e-6) / 10; // 2,75′ → 2,8′ pese al redondeo binario
  if (m >= 60) {
    gg += 1;
    m = 0;
  }
  return `${gg}° ${m.toFixed(1).replace(".", ",").padStart(4, "0")}′`;
}

function Instante() {
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
        <CampoConSigno tipo="lon" etiqueta="Longitud (opcional)" valor={lon} onChange={setLon} signo={sLon} onSigno={setSLon} placeholder="35°27'" ayuda="Para el horario del lugar." />
        <CampoConSigno tipo="lat" etiqueta="Latitud de estima (opcional)" valor={lat} onChange={setLat} signo={sLat} onSigno={setSLat} positivo="N" negativo="S" placeholder="19°48'" ayuda="Con la longitud, da el azimut y la altura estimada." />
      </div>
      <Resultado salida={salida} />
    </>
  );
}
