"use client";

import { useState } from "react";
import { aCuadrantal, formatoCuadrantal, formatoRumbo, leerRumbo, normalizar360 } from "@/lib/nucleo/angulos";
import { formatoDuracion, formatoNumero, leerDuracion, leerNumero, leerPositivo } from "@/lib/nucleo/unidades";
import { estima, formatoPosicion, rumboYDistancia, type Tramo } from "@/lib/py/estima";
import { llegarAHora } from "@/lib/py/llegada";
import { formatoLatitud, formatoLongitud } from "@/lib/nucleo/angulos";
import { Incompleto, intentar, opt, req, reqPosicion } from "../calculo";
import { Campo, CampoConSigno, CampoPosicion, POSICION_VACIA, Resultado, Segmentado } from "../campos";
import { conSigno } from "../per/Correccion";

export function Loxodromica() {
  const [a, setA] = useState(POSICION_VACIA);
  const [b, setB] = useState(POSICION_VACIA);
  const [velocidad, setVelocidad] = useState("");

  const salida = intentar(() => {
    const r = rumboYDistancia(reqPosicion(a), reqPosicion(b));
    const v = opt(velocidad, (t) => leerPositivo(t, "Velocidad"));
    const resultados = [
      { etiqueta: "Rumbo directo", valor: `${formatoRumbo(r.rumbo)} (${formatoNumero(Math.round(r.rumbo * 2) / 2, 1)}°)`, destacado: true },
      { etiqueta: "Distancia", valor: `${formatoNumero(r.distancia, 1)} millas`, destacado: true },
      { etiqueta: "Rumbo cuadrantal", valor: formatoCuadrantal(aCuadrantal(r.rumbo)) },
    ];
    if (v) resultados.push({ etiqueta: `Tiempo a ${formatoNumero(v)} nudos`, valor: formatoDuracion(r.distancia / v) });
    return { resultados, pasos: r.pasos };
  });

  return (
    <>
      <p className="text-sm text-slate-600">Rumbo y distancia loxodrómicos por latitud media. Funciona también cruzando el meridiano de 180°.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoPosicion etiqueta="Salida" valor={a} onChange={setA} />
        <CampoPosicion etiqueta="Llegada" valor={b} onChange={setB} />
      </div>
      <div className="sm:w-1/3">
        <Campo etiqueta="Velocidad (opcional)" valor={velocidad} onChange={setVelocidad} unidad="nudos" ayuda="Para calcular el tiempo." />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

type FilaTramo = { rumbo: string; velocidad: string; tiempo: string };
const TRAMO_VACIO: FilaTramo = { rumbo: "", velocidad: "", tiempo: "" };

export function Estima() {
  const [salidaPos, setSalidaPos] = useState(POSICION_VACIA);
  const [tipoRumbo, setTipoRumbo] = useState<"verdadero" | "aguja">("verdadero");
  const [ct, setCt] = useState("");
  const [sCt, setSCt] = useState<1 | -1>(-1);
  const [ab, setAb] = useState("");
  const [sAb, setSAb] = useState<1 | -1>(1);
  const [rc, setRc] = useState("");
  const [ic, setIc] = useState("");
  const [tramos, setTramos] = useState<FilaTramo[]>([{ ...TRAMO_VACIO }]);

  const cambiar = (i: number, campo: keyof FilaTramo, v: string) =>
    setTramos((ts) => ts.map((t, j) => (j === i ? { ...t, [campo]: v } : t)));

  const salida = intentar(() => {
    const p0 = reqPosicion(salidaPos);
    const ctV = tipoRumbo === "aguja" ? req(ct, (t) => conSigno(t, sCt)) : 0;
    const abV = opt(ab, (t) => conSigno(t, sAb)) ?? 0;
    const lista: Tramo[] = [];
    const previos: string[] = [];
    let horasTotal = 0;

    tramos.forEach((t, i) => {
      if (!t.rumbo && !t.velocidad && !t.tiempo && i > 0) return;
      const r = req(t.rumbo, leerRumbo);
      const v = req(t.velocidad, (x) => leerPositivo(x, "Velocidad"));
      const h = req(t.tiempo, leerDuracion);
      horasTotal += h;
      const rs = normalizar360(r + ctV + abV);
      if (ctV !== 0 || abV !== 0) {
        previos.push(
          `Tramo ${i + 1}: ${tipoRumbo === "aguja" ? `Ra ${formatoRumbo(r)} + Ct` : `Rv ${formatoRumbo(r)}`}${abV ? " + Ab" : ""} = Rs ${formatoRumbo(rs)}`,
        );
      }
      lista.push({ rumbo: rs, distancia: v * h, nombre: `Tramo ${i + 1} (${formatoNumero(v)} nudos × ${formatoDuracion(h)})` });
    });
    if (lista.length === 0) throw new Incompleto();

    const rcV = opt(rc, leerRumbo);
    const icV = opt(ic, (t) => leerNumero(t, "Intensidad"));
    if (rcV !== undefined && icV) {
      lista.push({ rumbo: rcV, distancia: icV * horasTotal, nombre: `Corriente (${formatoNumero(icV)} nudos × ${formatoDuracion(horasTotal)})` });
    }

    const r = estima(p0, lista);
    return {
      resultados: [
        { etiqueta: "Latitud de estima", valor: formatoLatitud(r.llegada.lat), destacado: true },
        { etiqueta: "Longitud de estima", valor: formatoLongitud(r.llegada.lon), destacado: true },
        { etiqueta: "Rumbo directo", valor: formatoRumbo(r.rumboDirecto) },
        { etiqueta: "Distancia directa", valor: `${formatoNumero(r.distanciaDirecta, 1)} millas` },
      ],
      pasos: [...previos, ...(previos.length ? [""] : []), ...r.pasos, "", `Situación de estima: ${formatoPosicion(r.llegada)}`],
    };
  });

  return (
    <>
      <p className="text-sm text-slate-600">
        Situación tras navegar uno o varios rumbos. La corriente se aplica durante todo el tiempo navegado.
      </p>
      <CampoPosicion etiqueta="Situación de salida" valor={salidaPos} onChange={setSalidaPos} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmentado
          etiqueta="Los rumbos son"
          opciones={[
            { valor: "verdadero", etiqueta: "Verdaderos" },
            { valor: "aguja", etiqueta: "De aguja" },
          ]}
          valor={tipoRumbo}
          onChange={setTipoRumbo}
        />
        {tipoRumbo === "aguja" && <CampoConSigno etiqueta="Corrección total (Ct)" valor={ct} onChange={setCt} signo={sCt} onSigno={setSCt} placeholder="3" />}
      </div>

      <div className="flex flex-col gap-2">
        {tramos.map((t, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <div className="col-span-3 flex items-center justify-between text-sm font-semibold text-slate-700">
              Tramo {i + 1}
              {tramos.length > 1 && (
                <button type="button" className="text-xs font-normal text-slate-500" onClick={() => setTramos((ts) => ts.filter((_, j) => j !== i))}>
                  Quitar
                </button>
              )}
            </div>
            <Campo etiqueta="Rumbo" valor={t.rumbo} onChange={(v) => cambiar(i, "rumbo", v)} placeholder="120" unidad="°" />
            <Campo etiqueta="Velocidad" valor={t.velocidad} onChange={(v) => cambiar(i, "velocidad", v)} placeholder="10" unidad="kn" />
            <Campo etiqueta="Tiempo" valor={t.tiempo} onChange={(v) => cambiar(i, "tiempo", v)} placeholder="3:00" modo="text" />
          </div>
        ))}
        {tramos.length < 6 && (
          <button type="button" className="self-start text-sm font-medium text-sky-800" onClick={() => setTramos((ts) => [...ts, { ...TRAMO_VACIO }])}>
            + Añadir tramo
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <CampoConSigno etiqueta="Abatimiento (opcional)" valor={ab} onChange={setAb} signo={sAb} onSigno={setSAb} positivo="Babor" negativo="Estribor" placeholder="10" />
        <Campo etiqueta="Rumbo corriente (opcional)" valor={rc} onChange={setRc} placeholder="135" unidad="°" />
        <Campo etiqueta="Intensidad corriente" valor={ic} onChange={setIc} placeholder="3" unidad="kn" />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

export function LlegarAHora() {
  const [ref, setRef] = useState("");
  const [distancia, setDistancia] = useState("");
  const [tiempo, setTiempo] = useState("");
  const [rc, setRc] = useState("");
  const [ic, setIc] = useState("");
  const [ab, setAb] = useState("");
  const [sAb, setSAb] = useState<1 | -1>(1);
  const [ct, setCt] = useState("");
  const [sCt, setSCt] = useState<1 | -1>(-1);

  const salida = intentar(() => {
    const r = llegarAHora({
      ref: req(ref, leerRumbo),
      distancia: req(distancia, (t) => leerPositivo(t, "Distancia")),
      horas: req(tiempo, leerDuracion),
      rc: opt(rc, leerRumbo),
      ic: opt(ic, (t) => leerNumero(t, "Intensidad")),
      ab: opt(ab, (t) => conSigno(t, sAb)),
      ct: opt(ct, (t) => conSigno(t, sCt)),
    });
    const resultados = [];
    if (r.ra !== undefined) resultados.push({ etiqueta: "Rumbo de aguja (Ra)", valor: formatoRumbo(r.ra), destacado: true });
    resultados.push(
      { etiqueta: "Velocidad del barco (Vb)", valor: `${formatoNumero(r.vb)} nudos`, destacado: true },
      { etiqueta: "Rumbo verdadero (Rv)", valor: formatoRumbo(r.rv), destacado: r.ra === undefined },
      { etiqueta: "Velocidad efectiva", valor: `${formatoNumero(r.vef)} nudos` },
    );
    return { resultados, pasos: r.pasos };
  });

  return (
    <>
      <p className="text-sm text-slate-600">
        Qué rumbo de aguja y qué velocidad necesitas para estar en un punto a una hora fijada. Mide en la carta el rumbo y la distancia al destino.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Rumbo al destino (Ref)" valor={ref} onChange={setRef} placeholder="298" unidad="°" />
        <Campo etiqueta="Distancia" valor={distancia} onChange={setDistancia} placeholder="14" unidad="millas" />
        <Campo etiqueta="Tiempo disponible" valor={tiempo} onChange={setTiempo} placeholder="4:00" modo="text" ayuda="Hora de llegada − hora de salida" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Rumbo de la corriente (opcional)" valor={rc} onChange={setRc} placeholder="225" unidad="°" />
        <Campo etiqueta="Intensidad de la corriente" valor={ic} onChange={setIc} placeholder="3" unidad="nudos" />
        <CampoConSigno etiqueta="Abatimiento (opcional)" valor={ab} onChange={setAb} signo={sAb} onSigno={setSAb} positivo="Babor" negativo="Estribor" placeholder="5" />
        <CampoConSigno etiqueta="Corrección total (opcional)" valor={ct} onChange={setCt} signo={sCt} onSigno={setSCt} placeholder="8" />
      </div>
      <Resultado salida={salida} />
    </>
  );
}
