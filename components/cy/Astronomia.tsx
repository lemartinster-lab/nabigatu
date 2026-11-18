"use client";

import { useState } from "react";
import { EntradaInvalida, formatoLatitud, formatoLongitud, formatoRumbo, leerAngulo } from "@/lib/nucleo/angulos";
import { leerLatitud, leerLongitud } from "@/lib/nucleo/coordenadas";
import { formatoNumero, leerDuracion, leerNumero } from "@/lib/nucleo/unidades";
import { ortodromica } from "@/lib/cy/ortodromica";
import { NOMBRE_HORA, convertirHora, formatoInstante, leerInstante, type TipoHora } from "@/lib/cy/tiempo";
import { formatoDeclinacion, formatoHorario, horarioDelAstro } from "@/lib/cy/astros";
import { corregirAltura, formatoAltura, type Astro } from "@/lib/cy/alturas";
import { corteDeRectas, latitudMeridiana, latitudPolar, pasoPorMeridiano, rectaDeAltura } from "@/lib/cy/astronomica";
import { intentar, opt, req, reqPosicion, type Fila } from "../calculo";
import { Campo, CampoConSigno, CampoPosicion, POSICION_VACIA, Resultado, Segmentado } from "../campos";

// ---------- Utilidades de formulario ----------

const angulo = (t: string) => Math.abs(leerAngulo(t));
const conSignoAng = (t: string, s: 1 | -1) => s * Math.abs(leerAngulo(t));

/** «22:22», «22m 22s» o «22 22» → horas. */
function leerMinSeg(t: string): number {
  const m = t.trim().toLowerCase().match(/^(\d{1,2})\s*[:m ]\s*(\d{1,2}(?:[.,]\d+)?)\s*s?$/);
  if (m) {
    const s = parseFloat(m[2].replace(",", "."));
    if (s >= 60) throw new EntradaInvalida("Los segundos deben ser menores que 60");
    return (+m[1] + s / 60) / 60;
  }
  const solo = t.trim().match(/^(\d{1,2})\s*m?$/);
  if (solo) return +solo[1] / 60;
  throw new EntradaInvalida("Escribe minutos y segundos: 22:22 o 22m 22s");
}

/** Bloque reutilizable: altura instrumental y sus correcciones. */
function useAltura(astroInicial: Astro) {
  const [ai, setAi] = useState("");
  const [ci, setCi] = useState("");
  const [sCi, setSCi] = useState<1 | -1>(-1);
  const [eo, setEo] = useState("");
  const [astro, setAstro] = useState<Astro>(astroInicial);
  const [sd, setSd] = useState("16,0");

  const calcular = () =>
    corregirAltura({
      ai: req(ai, angulo),
      ci: (opt(ci, (t) => Math.abs(leerNumero(t, "Error de índice"))) ?? 0) * sCi,
      eo: req(eo, (t) => leerNumero(t, "Elevación")),
      astro,
      sd: opt(sd, (t) => leerNumero(t, "Semidiámetro")),
    });

  const campos = (permitirEstrella = true) => (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <div className="text-sm font-semibold text-slate-700">Observación</div>
      <Segmentado
        opciones={[
          { valor: "sol-li" as Astro, etiqueta: "Sol limbo inf." },
          { valor: "sol-ls" as Astro, etiqueta: "Sol limbo sup." },
          ...(permitirEstrella ? [{ valor: "estrella" as Astro, etiqueta: "Estrella" }] : []),
        ]}
        valor={astro}
        onChange={setAstro}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Altura instrumental (Ai)" valor={ai} onChange={setAi} placeholder="50°27,2'" />
        <CampoConSigno etiqueta="Error de índice (minutos)" valor={ci} onChange={setCi} signo={sCi} onSigno={setSCi} positivo="+" negativo="−" placeholder="2,0" ayuda="Con el signo del enunciado" />
        <Campo etiqueta="Elevación del observador" valor={eo} onChange={setEo} placeholder="5" unidad="m" />
        {astro !== "estrella" && <Campo etiqueta="Semidiámetro (Almanaque)" valor={sd} onChange={setSd} unidad="′" />}
      </div>
    </div>
  );
  return { calcular, campos, astro };
}

// ---------- Ortodrómica ----------

export function Ortodromica() {
  const [a, setA] = useState(POSICION_VACIA);
  const [b, setB] = useState(POSICION_VACIA);
  const [n, setN] = useState("");

  const salida = intentar(() => {
    const r = ortodromica(reqPosicion(a), reqPosicion(b), opt(n, (t) => Math.min(20, Math.max(0, Math.round(leerNumero(t, "Puntos"))))) ?? 0);
    const resultados: Fila[] = [
      { etiqueta: "Rumbo inicial", valor: formatoRumbo(r.rumboInicial), destacado: true },
      { etiqueta: "Distancia", valor: `${formatoNumero(r.distancia, 1)} millas (${Math.round(r.distancia)}′)`, destacado: true },
      { etiqueta: "Rumbo final", valor: formatoRumbo(r.rumboFinal) },
      { etiqueta: r.vertice.enLaDerrota ? "Vértice" : "Vértice (fuera del tramo)", valor: `${formatoLatitud(r.vertice.lat)} ${formatoLongitud(r.vertice.lon)}` },
    ];
    r.intermedios.forEach((p, i) => resultados.push({ etiqueta: `Punto ${i + 1}`, valor: `${formatoLatitud(p.lat)} ${formatoLongitud(p.lon)}` }));
    return { resultados, pasos: r.pasos };
  });

  return (
    <>
      <p className="text-sm text-slate-600">Derrota por círculo máximo: la más corta entre dos puntos.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoPosicion etiqueta="Salida" valor={a} onChange={setA} />
        <CampoPosicion etiqueta="Llegada" valor={b} onChange={setB} />
      </div>
      <div className="sm:w-1/3">
        <Campo etiqueta="Puntos intermedios (opcional)" valor={n} onChange={setN} placeholder="3" modo="numeric" />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

// ---------- Horas ----------

export function Horas() {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [desde, setDesde] = useState<TipoHora>("HcG");
  const [lon, setLon] = useState("");
  const [sLon, setSLon] = useState<1 | -1>(-1);
  const [adelanto, setAdelanto] = useState("0");

  const salida = intentar(() => {
    const r = convertirHora(
      req(fecha, () => leerInstante(fecha, req(hora, (h) => h))),
      desde,
      req(lon, (t) => leerLongitud(t, sLon)),
      req(adelanto, (t) => leerNumero(t, "Adelanto")),
    );
    return {
      resultados: (["HcG", "HcL", "HZ", "HO"] as TipoHora[]).map((k) => ({
        etiqueta: k === "HZ" ? `HZ (huso ${r.huso >= 0 ? "+" : ""}${r.huso})` : k,
        valor: formatoInstante(r[k]),
        destacado: k !== desde && (k === "HcG" || k === "HcL"),
      })),
      pasos: r.pasos,
    };
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Hora de partida
          <select value={desde} onChange={(e) => setDesde(e.target.value as TipoHora)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base">
            {(Object.keys(NOMBRE_HORA) as TipoHora[]).map((k) => (
              <option key={k} value={k}>
                {NOMBRE_HORA[k]}
              </option>
            ))}
          </select>
        </label>
        <Campo etiqueta="Fecha" valor={fecha} onChange={setFecha} placeholder="06/11/2026" modo="text" />
        <Campo etiqueta="Hora" valor={hora} onChange={setHora} placeholder="07:40:00" modo="text" />
        <CampoConSigno etiqueta="Longitud" valor={lon} onChange={setLon} signo={sLon} onSigno={setSLon} placeholder="120°16,7'" />
        <Campo etiqueta="Adelanto de la hora oficial" valor={adelanto} onChange={setAdelanto} unidad="h" ayuda="Península: +1 en invierno, +2 en verano. Canarias: 0 y +1." />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

// ---------- Horario del astro ----------

export function HorarioAstro() {
  const [tipo, setTipo] = useState<"sol" | "estrella">("sol");
  const [interpolar, setInterpolar] = useState<"1" | "24" | "no">("1");
  const [hG0, setHG0] = useState("");
  const [hG1, setHG1] = useState("");
  const [dec0, setDec0] = useState("");
  const [sDec0, setSDec0] = useState<1 | -1>(-1);
  const [dec1, setDec1] = useState("");
  const [sDec1, setSDec1] = useState<1 | -1>(-1);
  const [trans, setTrans] = useState("");
  const [as, setAs] = useState("");
  const [decE, setDecE] = useState("");
  const [sDecE, setSDecE] = useState<1 | -1>(1);
  const [lon, setLon] = useState("");
  const [sLon, setSLon] = useState<1 | -1>(-1);

  const esEstrella = tipo === "estrella";
  const salida = intentar(() => {
    const intervalo = interpolar === "24" ? 24 : 1;
    const r = horarioDelAstro({
      hG0: req(hG0, angulo),
      hG1: interpolar === "no" ? undefined : req(hG1, angulo),
      dec0: esEstrella ? 0 : req(dec0, (t) => conSignoAng(t, sDec0)),
      dec1: esEstrella || interpolar === "no" ? undefined : opt(dec1, (t) => conSignoAng(t, sDec1)),
      intervaloHoras: intervalo,
      transcurrido: interpolar === "no" ? 0 : req(trans, interpolar === "24" ? leerDuracion : leerMinSeg),
      anguloSidereo: esEstrella ? req(as, angulo) : undefined,
      decEstrella: esEstrella ? req(decE, (t) => conSignoAng(t, sDecE)) : undefined,
      lon: req(lon, (t) => leerLongitud(t, sLon)),
    });
    return {
      resultados: [
        { etiqueta: "Horario en Greenwich (hG)", valor: formatoHorario(r.hG), destacado: true },
        { etiqueta: "Horario del lugar (hL)", valor: formatoHorario(r.hL), destacado: true },
        { etiqueta: "Declinación", valor: formatoDeclinacion(r.dec) },
        { etiqueta: "Horario astronómico (P)", valor: r.horarioAstronomico },
      ],
      pasos: r.pasos,
    };
  });

  return (
    <>
      <p className="text-sm text-slate-600">
        Copia del Almanaque Náutico los valores tabulados y calculo el horario y la declinación a la hora exacta. ¿No tienes
        el Almanaque a mano? Usa «Almanaque calculado».
        {esEstrella && " Para una estrella, los hG son los del punto Aries (♈)."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmentado opciones={[{ valor: "sol" as const, etiqueta: "Sol" }, { valor: "estrella" as const, etiqueta: "Estrella" }]} valor={tipo} onChange={setTipo} />
        <Segmentado
          opciones={[
            { valor: "1" as const, etiqueta: "Tabla horaria" },
            { valor: "24" as const, etiqueta: "Tabla diaria" },
            { valor: "no" as const, etiqueta: "Valor exacto" },
          ]}
          valor={interpolar}
          onChange={setInterpolar}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta={`hG${esEstrella ? "♈" : ""} ${interpolar === "no" ? "a la hora de la observación" : `a la ${interpolar === "24" ? "0h del día" : "hora entera"}`}`} valor={hG0} onChange={setHG0} placeholder="183°30,0'" />
        {interpolar !== "no" && <Campo etiqueta={`hG${esEstrella ? "♈" : ""} a la ${interpolar === "24" ? "0h del día siguiente" : "hora siguiente"}`} valor={hG1} onChange={setHG1} placeholder="198°30,0'" />}
        {!esEstrella && <CampoConSigno etiqueta={interpolar === "no" ? "Declinación" : "Declinación (primer valor)"} valor={dec0} onChange={setDec0} signo={sDec0} onSigno={setSDec0} positivo="N" negativo="S" placeholder="6°59,2'" />}
        {!esEstrella && interpolar !== "no" && <CampoConSigno etiqueta="Declinación (segundo valor, opcional)" valor={dec1} onChange={setDec1} signo={sDec1} onSigno={setSDec1} positivo="N" negativo="S" placeholder="7°00,1'" />}
        {interpolar !== "no" && (
          <Campo
            etiqueta={interpolar === "24" ? "Tiempo desde las 0h (h:m:s)" : "Minutos y segundos tras la hora"}
            valor={trans}
            onChange={setTrans}
            placeholder={interpolar === "24" ? "15:38:00" : "22:22"}
            modo="text"
          />
        )}
        {esEstrella && <Campo etiqueta="Ángulo sidéreo de la estrella (AS)" valor={as} onChange={setAs} placeholder="290°50,4'" />}
        {esEstrella && <CampoConSigno etiqueta="Declinación de la estrella" valor={decE} onChange={setDecE} signo={sDecE} onSigno={setSDecE} positivo="N" negativo="S" placeholder="41°02,1'" />}
        <CampoConSigno etiqueta="Longitud del observador" valor={lon} onChange={setLon} signo={sLon} onSigno={setSLon} placeholder="151°44,2'" />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

// ---------- Corrección de alturas ----------

export function Alturas() {
  const alt = useAltura("sol-li");
  const salida = intentar(() => {
    const r = alt.calcular();
    return {
      resultados: [
        { etiqueta: "Altura verdadera (Av)", valor: formatoAltura(r.av), destacado: true },
        { etiqueta: "Corrección total", valor: `${r.correccionTotal >= 0 ? "+" : "−"}${formatoNumero(Math.abs(r.correccionTotal), 1)}′`, destacado: true },
      ],
      pasos: r.pasos,
    };
  });
  return (
    <>
      <p className="text-sm text-slate-600">
        De la altura medida con el sextante a la verdadera. Las fórmulas pueden diferir en una décima de minuto de las tablas del Almanaque.
      </p>
      {alt.campos()}
      <Resultado salida={salida} />
    </>
  );
}

// ---------- Meridiana ----------

export function Meridiana() {
  const [modo, setModo] = useState<"latitud" | "paso">("latitud");
  const alt = useAltura("sol-li");
  const [dec, setDec] = useState("");
  const [sDec, setSDec] = useState<1 | -1>(-1);
  const [latE, setLatE] = useState("");
  const [sLatE, setSLatE] = useState<1 | -1>(1);
  const [fecha, setFecha] = useState("");
  const [pmg, setPmg] = useState("");
  const [lon, setLon] = useState("");
  const [sLon, setSLon] = useState<1 | -1>(-1);
  const [adelanto, setAdelanto] = useState("0");

  const salida = intentar(() => {
    if (modo === "paso") {
      const r = pasoPorMeridiano(
        req(fecha, () => leerInstante(fecha, req(pmg, (h) => h))),
        req(lon, (t) => leerLongitud(t, sLon)),
        req(adelanto, (t) => leerNumero(t, "Adelanto")),
      );
      return {
        resultados: [
          { etiqueta: "HcG del paso", valor: formatoInstante(r.hcg).slice(11), destacado: true },
          { etiqueta: "Hora oficial del paso", valor: formatoInstante(r.ho).slice(11), destacado: true },
        ],
        pasos: r.pasos,
      };
    }
    const a = alt.calcular();
    const r = latitudMeridiana(a.av, req(dec, (t) => conSignoAng(t, sDec)), req(latE, (t) => leerLatitud(t, sLatE)));
    return {
      resultados: [
        { etiqueta: "Latitud", valor: formatoLatitud(r.lat), destacado: true },
        { etiqueta: "Altura verdadera", valor: formatoAltura(a.av) },
        { etiqueta: "Distancia cenital", valor: formatoAltura(r.z) },
      ],
      pasos: [...a.pasos, "", ...r.pasos],
    };
  });

  return (
    <>
      <Segmentado
        opciones={[
          { valor: "latitud" as const, etiqueta: "Latitud por meridiana" },
          { valor: "paso" as const, etiqueta: "Hora del paso" },
        ]}
        valor={modo}
        onChange={setModo}
      />
      {modo === "latitud" ? (
        <>
          {alt.campos(true)}
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoConSigno etiqueta="Declinación del astro (Almanaque)" valor={dec} onChange={setDec} signo={sDec} onSigno={setSDec} positivo="N" negativo="S" placeholder="6°59,7'" />
            <CampoConSigno etiqueta="Latitud de estima" valor={latE} onChange={setLatE} signo={sLatE} onSigno={setSLatE} positivo="N" negativo="S" placeholder="33°" ayuda="Para saber a qué lado pasa el astro." />
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600">Con la hora del paso del Sol por el meridiano de Greenwich (Pmg) que da el Almanaque para ese día.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Fecha" valor={fecha} onChange={setFecha} placeholder="10/10/2024" modo="text" />
            <Campo etiqueta="Pmg (Almanaque)" valor={pmg} onChange={setPmg} placeholder="11:47" modo="text" />
            <CampoConSigno etiqueta="Longitud" valor={lon} onChange={setLon} signo={sLon} onSigno={setSLon} placeholder="6°" />
            <Campo etiqueta="Adelanto de la hora oficial" valor={adelanto} onChange={setAdelanto} unidad="h" />
          </div>
        </>
      )}
      <Resultado salida={salida} />
    </>
  );
}

// ---------- Polar ----------

export function Polar() {
  const alt = useAltura("estrella");
  const [hL, setHL] = useState("");
  const [dec, setDec] = useState("89°22'");

  const salida = intentar(() => {
    const a = alt.calcular();
    const r = latitudPolar(a.av, req(hL, angulo), req(dec, angulo));
    return {
      resultados: [
        { etiqueta: "Latitud", valor: formatoLatitud(r.lat), destacado: true },
        { etiqueta: "Altura verdadera", valor: formatoAltura(a.av) },
        { etiqueta: "Azimut de la Polar", valor: formatoRumbo(r.azimut) },
      ],
      pasos: [...a.pasos, "", ...r.pasos],
    };
  });

  return (
    <>
      <p className="text-sm text-slate-600">
        Latitud por la altura de la Polar, resolviendo el triángulo de posición. Calcula antes su horario del lugar en «Horario del astro».
      </p>
      {alt.campos()}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Horario del lugar de la Polar (hL)" valor={hL} onChange={setHL} placeholder="215°30,0'" />
        <Campo etiqueta="Declinación de la Polar (Almanaque)" valor={dec} onChange={setDec} />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

// ---------- Recta de altura ----------

function useAstroRecta() {
  const [hG, setHG] = useState("");
  const [dec, setDec] = useState("");
  const [sDec, setSDec] = useState<1 | -1>(1);
  const [av, setAv] = useState("");
  const leer = () => ({
    hG: req(hG, angulo),
    dec: req(dec, (t) => conSignoAng(t, sDec)),
    av: opt(av, angulo),
  });
  const campos = (titulo: string) => (
    <div className="grid gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200 sm:grid-cols-3">
      <div className="text-sm font-semibold text-slate-700 sm:col-span-3">{titulo}</div>
      <Campo etiqueta="hG del astro" valor={hG} onChange={setHG} placeholder="030°15,0'" />
      <CampoConSigno etiqueta="Declinación" valor={dec} onChange={setDec} signo={sDec} onSigno={setSDec} positivo="N" negativo="S" placeholder="20°" />
      <Campo etiqueta="Altura verdadera (opcional)" valor={av} onChange={setAv} placeholder="45°12,3'" ayuda="Corrígela antes en «Corrección de alturas»." />
    </div>
  );
  const vacio = () => hG.trim() === "" && dec.trim() === "";
  return { leer, campos, vacio };
}

export function RectaAltura() {
  const [estima, setEstima] = useState(POSICION_VACIA);
  const r1 = useAstroRecta();
  const r2 = useAstroRecta();

  const salida = intentar(() => {
    const e = reqPosicion(estima);
    const d1 = r1.leer();
    const a = rectaDeAltura(e, d1.hG, d1.dec, d1.av);
    const resultados: Fila[] = [
      { etiqueta: "Astro 1: azimut Z", valor: formatoRumbo(a.z), destacado: true },
      { etiqueta: "Astro 1: altura estimada", valor: formatoAltura(a.ae), destacado: true },
    ];
    if (a.da !== undefined) resultados.push({ etiqueta: "Astro 1: Δa", valor: `${a.da >= 0 ? "+" : "−"}${formatoNumero(Math.abs(a.da), 1)}′` });
    const pasos = ["Astro 1", ...a.pasos];

    if (!r2.vacio()) {
      const d2 = r2.leer();
      const b = rectaDeAltura(e, d2.hG, d2.dec, d2.av);
      resultados.push({ etiqueta: "Astro 2: Z y ae", valor: `${formatoRumbo(b.z)} · ${formatoAltura(b.ae)}` });
      pasos.push("", "Astro 2", ...b.pasos);
      if (a.da !== undefined && b.da !== undefined) {
        const c = corteDeRectas(e, a.z, a.da, b.z, b.da);
        resultados.unshift(
          { etiqueta: "Situación: latitud", valor: formatoLatitud(c.posicion.lat), destacado: true },
          { etiqueta: "Situación: longitud", valor: formatoLongitud(c.posicion.lon), destacado: true },
        );
        pasos.push("", "Corte de las dos rectas", ...c.pasos);
      }
    }
    return { resultados, pasos };
  });

  return (
    <>
      <p className="text-sm text-slate-600">
        Altura estimada, azimut y Δa. Con dos astros y sus alturas verdaderas, calculo la situación por el corte. Si las observaciones no son simultáneas, usa la estima de la segunda y calcula la primera recta con la estima trasladada.
      </p>
      <CampoPosicion etiqueta="Situación de estima" valor={estima} onChange={setEstima} />
      {r1.campos("Astro 1")}
      {r2.campos("Astro 2 (opcional)")}
      <Resultado salida={salida} />
    </>
  );
}

