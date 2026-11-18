"use client";

import { useEffect, useState } from "react";
import { ATRIBUCIONES_PNB, PNB_REVISADO } from "@/lib/pnb/atribuciones";
import {
  corregirExamenPnb,
  DURACION_MINUTOS,
  generarExamenPnb,
  generarPracticaPnb,
  generarRepasoPnb,
  MAX_ERRORES,
  TOTAL_PREGUNTAS,
  UNIDADES_PNB,
  type CorreccionPnb,
  type PreguntaMostrada,
} from "@/lib/pnb/examen";
import type { UnidadPnb } from "@/lib/pnb/preguntas";
import { ACIERTOS_PARA_QUITAR, leerFallos, registrarRespuestas, suscribirFallos } from "@/lib/pnb/fallos";
import { Segmentado } from "../campos";

const LETRAS = ["a", "b", "c", "d"];

function semillaNueva() {
  return Math.floor(Math.random() * 2 ** 31);
}

const nombreUnidad = (id: UnidadPnb) => UNIDADES_PNB.find((u) => u.id === id)?.nombre ?? id;

export function AtribucionesPnb() {
  return (
    <>
      <p className="text-sm text-slate-600">
        Qué te permite el Patrón para Navegación Básica (PNB) y cómo se obtiene, con el artículo del BOE de donde sale cada dato.
      </p>
      <ul className="flex flex-col gap-2">
        {ATRIBUCIONES_PNB.map((n) => (
          <li key={n.titulo} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="font-semibold text-sky-950">{n.titulo}</div>
            <p className="mt-1 text-slate-700">{n.texto}</p>
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-sky-800 underline">
              {n.fuente}
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        Revisado el {PNB_REVISADO} con el texto consolidado del Real Decreto 875/2014 (última actualización publicada el
        30/12/2025). Es un resumen informativo: para fines jurídicos vale el BOE.
      </p>
    </>
  );
}

function Opciones({
  pregunta,
  elegida,
  corregir,
  onElegir,
}: {
  pregunta: PreguntaMostrada;
  elegida: number | null;
  /** Si es true, se marcan la correcta y el fallo. */
  corregir: boolean;
  onElegir?: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Respuestas">
      {pregunta.opciones.map((o, i) => {
        const estilo = corregir
          ? i === pregunta.correcta
            ? "bg-emerald-50 ring-emerald-500"
            : i === elegida
              ? "bg-rose-50 ring-rose-400"
              : "bg-slate-50 ring-slate-200 opacity-70"
          : i === elegida
            ? "bg-sky-50 ring-2 ring-sky-700"
            : "bg-slate-50 ring-slate-300 hover:ring-sky-500";
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={elegida === i}
            disabled={!onElegir}
            onClick={() => onElegir?.(i)}
            className={`rounded-xl px-4 py-3 text-left ring-1 transition ${estilo}`}
          >
            <span className="font-medium text-slate-900">
              {LETRAS[i]}) {o}
              {corregir && i === pregunta.correcta && <span className="ml-2 text-emerald-700">Correcta</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Lista de fallos guardada en el navegador, actualizada si cambia. */
function useFallos() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const leer = () => setIds(Object.keys(leerFallos()));
    leer();
    return suscribirFallos(leer);
  }, []);
  return ids;
}

/**
 * Ronda de preguntas con la corrección al responder. Cada respuesta se anota en
 * «Mis fallos»: los fallos entran en la lista y los aciertos de la lista suman racha.
 */
function Ronda({ generar, titulo }: { generar: () => PreguntaMostrada[]; titulo: (p: PreguntaMostrada) => string }) {
  const [preguntas, setPreguntas] = useState(generar);
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [marcador, setMarcador] = useState({ aciertos: 0, total: 0 });
  const p = preguntas[i];
  const fin = i >= preguntas.length;

  const responder = (k: number) => {
    if (elegida !== null) return;
    setElegida(k);
    registrarRespuestas([{ id: p.id, acierto: k === p.correcta }]);
    setMarcador((m) => ({ aciertos: m.aciertos + (k === p.correcta ? 1 : 0), total: m.total + 1 }));
  };
  const reiniciar = () => {
    setPreguntas(generar());
    setI(0);
    setElegida(null);
    setMarcador({ aciertos: 0, total: 0 });
  };

  if (preguntas.length === 0) {
    return (
      <section className="rounded-2xl bg-emerald-50 p-4 text-emerald-950 ring-1 ring-emerald-200">
        No tienes fallos pendientes. Cuando falles una pregunta en el examen de prueba o en la práctica, aparecerá aquí hasta que la
        aciertes {ACIERTOS_PARA_QUITAR} veces seguidas.
      </section>
    );
  }

  if (fin) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="font-semibold text-sky-950">
          Ronda terminada: {marcador.aciertos} de {marcador.total} aciertos.
        </p>
        <button type="button" onClick={reiniciar} className="self-start rounded-xl bg-sky-900 px-5 py-3 font-semibold text-white hover:bg-sky-800">
          Otra ronda
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200" aria-label="Pregunta">
      <div className="flex justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-sky-700">
        <span>{titulo(p)}</span>
        <span aria-live="polite">
          {i + 1} de {preguntas.length} · {marcador.aciertos} aciertos
        </span>
      </div>
      <p className="text-slate-800">{p.enunciado}</p>
      <Opciones pregunta={p} elegida={elegida} corregir={elegida !== null} onElegir={elegida === null ? responder : undefined} />
      {elegida !== null && (
        <div role="status" className={`rounded-xl px-4 py-3 ${elegida === p.correcta ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
          <span className="font-semibold">{elegida === p.correcta ? "Correcto. " : "No es esa. "}</span>
          {p.explicacion}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setI(i + 1);
          setElegida(null);
        }}
        className="self-end rounded-xl bg-sky-900 px-5 py-3 font-semibold text-white hover:bg-sky-800"
      >
        {elegida === null ? "Saltar" : "Siguiente →"}
      </button>
    </section>
  );
}

function Resultado({ c, preguntas, respuestas, otra }: { c: CorreccionPnb; preguntas: PreguntaMostrada[]; respuestas: (number | null)[]; otra: () => void }) {
  const falladas = preguntas.map((p, i) => ({ p, r: respuestas[i] })).filter(({ p, r }) => r !== p.correcta);
  return (
    <section className="flex flex-col gap-4" aria-label="Resultado">
      <div role="status" className={`rounded-2xl p-4 ${c.aprobado ? "bg-emerald-100 text-emerald-950" : "bg-rose-100 text-rose-950"}`}>
        <div className="text-2xl font-bold">{c.aprobado ? "Aprobado" : "Suspenso"}</div>
        <div className="mt-1">
          {c.aciertos} aciertos y {c.errores} errores de {preguntas.length}.
        </div>
        {c.motivos.map((m) => (
          <div key={m} className="mt-1 text-sm">
            {m}
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Unidad</th>
              <th className="px-3 py-2 font-medium">Errores</th>
              <th className="px-3 py-2 font-medium">Máximo</th>
            </tr>
          </thead>
          <tbody>
            {c.porUnidad.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{u.nombre}</td>
                <td className={`px-3 py-2 font-semibold ${u.superada ? "text-slate-900" : "text-rose-700"}`}>
                  {u.errores} de {u.preguntas}
                </td>
                <td className="px-3 py-2 text-slate-600">{u.maxErrores ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {falladas.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-sky-950">Repasa las que fallaste</h3>
          {falladas.map(({ p, r }) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">{nombreUnidad(p.unidad)}</div>
              <p className="text-slate-800">{p.enunciado}</p>
              {r === null && <p className="text-sm text-rose-700">Sin contestar.</p>}
              <Opciones pregunta={p} elegida={r} corregir />
              <p className="text-sm text-slate-700">{p.explicacion}</p>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={otra} className="self-start rounded-xl bg-sky-900 px-5 py-3 font-semibold text-white hover:bg-sky-800">
        Hacer otro examen
      </button>
    </section>
  );
}

function ExamenPrueba() {
  const [preguntas, setPreguntas] = useState(() => generarExamenPnb(semillaNueva()));
  const [respuestas, setRespuestas] = useState<(number | null)[]>(() => Array(TOTAL_PREGUNTAS).fill(null));
  const [i, setI] = useState(0);
  const [correccion, setCorreccion] = useState<CorreccionPnb | null>(null);
  const p = preguntas[i];
  const contestadas = respuestas.filter((r) => r !== null).length;

  const otra = () => {
    setPreguntas(generarExamenPnb(semillaNueva()));
    setRespuestas(Array(TOTAL_PREGUNTAS).fill(null));
    setI(0);
    setCorreccion(null);
  };

  if (correccion) return <Resultado c={correccion} preguntas={preguntas} respuestas={respuestas} otra={otra} />;

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200" aria-label="Examen de prueba">
      <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-sky-700">
        <span>{nombreUnidad(p.unidad)}</span>
        <span>
          Pregunta {i + 1} de {preguntas.length}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden>
        <div className="h-full bg-sky-800" style={{ width: `${(contestadas / preguntas.length) * 100}%` }} />
      </div>
      <p className="text-slate-800">{p.enunciado}</p>
      <Opciones
        pregunta={p}
        elegida={respuestas[i]}
        corregir={false}
        onElegir={(k) => setRespuestas((rs) => rs.map((r, j) => (j === i ? k : r)))}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={i === 0}
          onClick={() => setI(i - 1)}
          className="rounded-xl px-4 py-3 font-medium text-sky-900 ring-1 ring-slate-300 disabled:opacity-40"
        >
          ← Anterior
        </button>
        {i < preguntas.length - 1 ? (
          <button type="button" onClick={() => setI(i + 1)} className="rounded-xl bg-sky-900 px-5 py-3 font-semibold text-white hover:bg-sky-800">
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              registrarRespuestas(preguntas.map((q, j) => ({ id: q.id, acierto: respuestas[j] === q.correcta })));
              setCorreccion(corregirExamenPnb(preguntas, respuestas));
            }}
            className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            Corregir examen
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500" aria-live="polite">
        {contestadas} de {preguntas.length} contestadas. Las que dejes en blanco cuentan como error.
      </p>
    </section>
  );
}

type Modo = "examen" | "practica" | "repaso";

export function TestPnb() {
  const [modo, setModo] = useState<Modo>("examen");
  const [tema, setTema] = useState<UnidadPnb>("balizamiento");
  const [clave, setClave] = useState(0);
  const fallos = useFallos();
  const otraVez = () => setClave((k) => k + 1);

  return (
    <>
      <p className="text-sm text-slate-600">
        El examen oficial son {TOTAL_PREGUNTAS} preguntas en {DURACION_MINUTOS} minutos. Apruebas con {TOTAL_PREGUNTAS - MAX_ERRORES}{" "}
        aciertos, sin pasar de 2 errores en balizamiento ni de 5 en el reglamento. Estas preguntas son de práctica, redactadas
        para Nabigatu sobre el temario oficial: no son las del examen.
      </p>
      <Segmentado
        etiqueta="Qué quieres hacer"
        opciones={[
          { valor: "examen", etiqueta: "Examen" },
          { valor: "practica", etiqueta: "Por tema" },
          { valor: "repaso", etiqueta: `Mis fallos (${fallos.length})` },
        ]}
        valor={modo}
        onChange={(v) => {
          setModo(v);
          otraVez();
        }}
      />
      {modo === "practica" && (
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Tema
          <select
            value={tema}
            onChange={(e) => {
              setTema(e.target.value as UnidadPnb);
              otraVez();
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-base"
          >
            {UNIDADES_PNB.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </label>
      )}
      {modo === "repaso" && (
        <p className="text-sm text-slate-600">
          Las preguntas que has fallado, en cualquier examen o práctica. Cada una sale de la lista cuando la aciertas{" "}
          {ACIERTOS_PARA_QUITAR} veces seguidas; si la vuelves a fallar, empieza de cero. Se guardan en este navegador.
        </p>
      )}
      {modo === "examen" && <ExamenPrueba key={clave} />}
      {modo === "practica" && <Ronda key={`${tema}-${clave}`} generar={() => generarPracticaPnb(tema, semillaNueva())} titulo={() => nombreUnidad(tema)} />}
      {modo === "repaso" && (
        <Ronda key={`repaso-${clave}`} generar={() => generarRepasoPnb(Object.keys(leerFallos()), semillaNueva())} titulo={(p) => nombreUnidad(p.unidad)} />
      )}
    </>
  );
}
