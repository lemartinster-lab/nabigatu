"use client";

import { useEffect, useMemo, useState } from "react";
import { MARCAS, type Marca } from "@/lib/teoria/chuletas";
import {
  aleatorio,
  barajar,
  ESCENARIOS,
  NOMBRE_ACCION,
  NOMBRE_BUQUE,
  opciones,
  RITMOS,
  type Accion,
  type Escenario,
  type Ritmo,
  type TipoBuque,
} from "@/lib/teoria/interactivo";
import { Segmentado } from "../campos";
import { Boya } from "./Chuletas";

const LUZ = { blanca: "#ffffff", roja: "#ef4444", verde: "#22c55e" } as const;
const semillaNueva = () => Math.floor(Math.random() * 2 ** 31);

function BotonOpcion({ texto, estado, onClick }: { texto: string; estado: "normal" | "correcta" | "fallada" | "apagada"; onClick?: () => void }) {
  const estilo = {
    normal: "bg-slate-50 ring-slate-300 hover:ring-sky-500",
    correcta: "bg-emerald-50 ring-emerald-500",
    fallada: "bg-rose-50 ring-rose-400",
    apagada: "bg-slate-50 ring-slate-200 opacity-60",
  }[estado];
  return (
    <button type="button" disabled={!onClick} onClick={onClick} className={`rounded-xl px-4 py-3 text-left font-medium text-slate-900 ring-1 transition ${estilo}`}>
      {texto}
    </button>
  );
}

function Marcador({ aciertos, total }: { aciertos: number; total: number }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-sky-700" aria-live="polite">
      {aciertos} de {total} aciertos
    </span>
  );
}

// ---------- «¿Qué ves de noche?» ----------

function Noche({ e }: { e: Escenario }) {
  return (
    <svg viewBox="0 0 200 120" className="w-full rounded-2xl bg-slate-950" role="img" aria-label="Luces vistas de noche">
      <rect x={0} y={96} width={200} height={24} fill="#0b1a33" />
      {e.luces.map((l, i) => (
        <g key={i}>
          <circle cx={l.x} cy={l.y} r={9} fill={LUZ[l.color]} opacity={0.25} />
          <circle cx={l.x} cy={l.y} r={4} fill={LUZ[l.color]} />
        </g>
      ))}
    </svg>
  );
}

export function QueVesDeNoche() {
  const [orden, setOrden] = useState(() => barajar(ESCENARIOS, aleatorio(semillaNueva())));
  const [i, setI] = useState(0);
  const [buque, setBuque] = useState<TipoBuque | null>(null);
  const [accion, setAccion] = useState<Accion | null>(null);
  const [marcador, setMarcador] = useState({ aciertos: 0, total: 0 });
  const e = orden[i % orden.length];
  const opcionesBuque = useMemo(() => opciones(e.buque, Object.keys(NOMBRE_BUQUE) as TipoBuque[], aleatorio(semillaNueva())), [e]);
  const acciones = Object.keys(NOMBRE_ACCION) as Accion[];

  const elegirAccion = (a: Accion) => {
    setAccion(a);
    setMarcador((m) => ({ aciertos: m.aciertos + (a === e.accion && buque === e.buque ? 1 : 0), total: m.total + 1 }));
  };
  const siguiente = () => {
    if (i + 1 >= orden.length) {
      setOrden(barajar(ESCENARIOS, aleatorio(semillaNueva())));
      setI(0);
    } else setI(i + 1);
    setBuque(null);
    setAccion(null);
  };
  const estado = <T,>(x: T, elegida: T | null, correcta: T) =>
    elegida === null ? "normal" : x === correcta ? "correcta" : x === elegida ? "fallada" : "apagada";

  return (
    <>
      <p className="text-sm text-slate-600">
        Navegas de noche en un buque de motor. Mira las luces, di qué buque es y qué haces tú. Las luces de costado están
        dibujadas abajo; las todo horizonte, en vertical en el palo.
      </p>
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="flex justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Caso {i + 1} de {orden.length}
          </span>
          <Marcador {...marcador} />
        </div>
        <Noche e={e} />
        <p className="text-slate-800">
          Estas luces aparecen <strong>{e.donde}</strong>.
        </p>
        <p className="font-semibold text-sky-950">1. ¿Qué buque es?</p>
        <div className="flex flex-col gap-2">
          {opcionesBuque.map((b) => (
            <BotonOpcion key={b} texto={NOMBRE_BUQUE[b]} estado={estado(b, buque, e.buque)} onClick={buque === null ? () => setBuque(b) : undefined} />
          ))}
        </div>
        {buque !== null && (
          <>
            <p className="font-semibold text-sky-950">2. ¿Qué haces?</p>
            <div className="flex flex-col gap-2">
              {acciones.map((a) => (
                <BotonOpcion key={a} texto={NOMBRE_ACCION[a]} estado={estado(a, accion, e.accion)} onClick={accion === null ? () => elegirAccion(a) : undefined} />
              ))}
            </div>
          </>
        )}
        {accion !== null && (
          <>
            <div role="status" className={`rounded-xl px-4 py-3 ${accion === e.accion && buque === e.buque ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
              <span className="font-semibold">{accion === e.accion && buque === e.buque ? "Bien visto. " : "Repásalo. "}</span>
              {e.explicacion}
            </div>
            <button type="button" onClick={siguiente} className="self-end rounded-xl bg-sky-900 px-5 py-3 font-semibold text-white hover:bg-sky-800">
              Siguiente caso →
            </button>
          </>
        )}
      </section>
    </>
  );
}

// ---------- «Reconoce la marca» ----------

/** Luz que parpadea siguiendo su ritmo real, en bucle. */
function LuzParpadeante({ ritmo }: { ritmo: Ritmo }) {
  const [fase, setFase] = useState(0);
  useEffect(() => {
    setFase(0);
  }, [ritmo]);
  useEffect(() => {
    const t = setTimeout(() => setFase((f) => (f + 1) % ritmo.fases.length), ritmo.fases[fase % ritmo.fases.length].ms);
    return () => clearTimeout(t);
  }, [fase, ritmo]);
  const color = ritmo.fases[fase % ritmo.fases.length].color;
  return (
    <svg viewBox="0 0 200 120" className="w-full rounded-2xl bg-slate-950" role="img" aria-label="Luz de una marca vista de noche">
      <rect x={0} y={96} width={200} height={24} fill="#0b1a33" />
      {color && (
        <>
          <circle cx={100} cy={60} r={18} fill={color} opacity={0.25} />
          <circle cx={100} cy={60} r={7} fill={color} />
        </>
      )}
    </svg>
  );
}

type Momento = "dia" | "noche";

export function ReconoceMarca() {
  const [momento, setMomento] = useState<Momento>("dia");
  const [orden, setOrden] = useState(() => barajar(MARCAS, aleatorio(semillaNueva())));
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState<Marca["id"] | null>(null);
  const [marcador, setMarcador] = useState({ aciertos: 0, total: 0 });
  const m = orden[i % orden.length];
  const ids = MARCAS.map((x) => x.id);
  const ops = useMemo(() => opciones(m.id, ids, aleatorio(semillaNueva())), [m]); // eslint-disable-line react-hooks/exhaustive-deps
  const nombre = (id: Marca["id"]) => MARCAS.find((x) => x.id === id)!.nombre;

  const elegir = (id: Marca["id"]) => {
    setElegida(id);
    setMarcador((s) => ({ aciertos: s.aciertos + (id === m.id ? 1 : 0), total: s.total + 1 }));
  };
  const siguiente = () => {
    if (i + 1 >= orden.length) {
      setOrden(barajar(MARCAS, aleatorio(semillaNueva())));
      setI(0);
    } else setI(i + 1);
    setElegida(null);
  };
  const estado = (id: Marca["id"]) => (elegida === null ? "normal" : id === m.id ? "correcta" : id === elegida ? "fallada" : "apagada");

  return (
    <>
      <p className="text-sm text-slate-600">
        De día ves la marca dibujada; de noche solo su luz, con su ritmo real. Di qué marca es. Las laterales y la especial pueden
        tener otros ritmos: aquí se usa uno habitual.
      </p>
      <Segmentado
        etiqueta="Cuándo"
        opciones={[
          { valor: "dia", etiqueta: "De día" },
          { valor: "noche", etiqueta: "De noche" },
        ]}
        valor={momento}
        onChange={(v) => {
          setMomento(v);
          setElegida(null);
        }}
      />
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="flex justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Marca {i + 1} de {orden.length}
          </span>
          <Marcador {...marcador} />
        </div>
        {momento === "dia" ? (
          <div className="flex justify-center rounded-2xl bg-sky-50 py-4">
            <Boya m={m} className="h-44 w-20" />
          </div>
        ) : (
          <LuzParpadeante ritmo={RITMOS[m.id]} />
        )}
        <p className="font-semibold text-sky-950">¿Qué marca es?</p>
        <div className="flex flex-col gap-2">
          {ops.map((id) => (
            <BotonOpcion key={id} texto={nombre(id)} estado={estado(id)} onClick={elegida === null ? () => elegir(id) : undefined} />
          ))}
        </div>
        {elegida !== null && (
          <>
            <div role="status" className={`rounded-xl px-4 py-3 ${elegida === m.id ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
              <span className="font-semibold">{elegida === m.id ? "Correcto. " : `Es la ${m.nombre.toLowerCase()}. `}</span>
              {m.significado} Luz: {RITMOS[m.id].abreviatura} ({m.luz.toLowerCase()}).
            </div>
            <button type="button" onClick={siguiente} className="self-end rounded-xl bg-sky-900 px-5 py-3 font-semibold text-white hover:bg-sky-800">
              Siguiente marca →
            </button>
          </>
        )}
      </section>
    </>
  );
}
