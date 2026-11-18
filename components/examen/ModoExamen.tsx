"use client";

import { useCallback, useEffect, useState } from "react";
import type { Nivel } from "@/lib/modulos";
import { generarPregunta, temasDeNivel, type Pregunta, type Tema } from "@/lib/examen/generador";

const LETRAS = ["a", "b", "c", "d"];

function semillaNueva() {
  return Math.floor(Math.random() * 2 ** 31);
}

export function ModoExamen({ nivel }: { nivel: Nivel }) {
  const temas = temasDeNivel(nivel);
  const [tema, setTema] = useState<Tema | "todos">("todos");
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const [elegida, setElegida] = useState<number | null>(null);
  const [marcador, setMarcador] = useState({ aciertos: 0, total: 0 });

  const nueva = useCallback(() => {
    const disponibles = temas.map((t) => t.id);
    const t = tema === "todos" ? disponibles[Math.floor(Math.random() * disponibles.length)] : tema;
    setPregunta(generarPregunta(t, semillaNueva()));
    setElegida(null);
  }, [tema, nivel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Primera pregunta al entrar y al cambiar de tema (solo en el navegador: usa azar).
  useEffect(() => {
    nueva();
  }, [nueva]);

  const responder = (i: number) => {
    if (elegida !== null || !pregunta) return;
    setElegida(i);
    setMarcador((m) => ({ aciertos: m.aciertos + (pregunta.opciones[i].correcta ? 1 : 0), total: m.total + 1 }));
  };

  const nombreTema = (id: Tema) => temas.find((t) => t.id === id)?.nombre ?? id;
  const acierto = elegida !== null && pregunta?.opciones[elegida].correcta;

  return (
    <>
      <p className="text-sm text-slate-600">
        Ejercicios tipo test generados al azar, con cuatro opciones como en el examen. Las respuestas incorrectas son los
        errores más habituales, y al responder verás por qué. Los ejercicios que necesitan la carta del Estrecho no se
        generan aquí.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Tema
          <select
            value={tema}
            onChange={(e) => setTema(e.target.value as Tema | "todos")}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-base"
          >
            <option value="todos">Todos los temas ({nivel === "PER" ? "PER" : "PER y Patrón de Yate"})</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto rounded-xl bg-white px-4 py-2 text-sm ring-1 ring-slate-200" aria-live="polite">
          Aciertos: <strong>{marcador.aciertos}</strong> de <strong>{marcador.total}</strong>
          {marcador.total > 0 && <span className="text-slate-500"> ({Math.round((marcador.aciertos / marcador.total) * 100)}%)</span>}
        </div>
      </div>

      {pregunta && (
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200" aria-label="Pregunta">
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">{nombreTema(pregunta.tema)}</div>
          <div className="flex flex-col gap-1 text-slate-800">
            {pregunta.enunciado.map((l, i) =>
              l.startsWith("  ") ? (
                <div key={i} className="font-mono text-sm">{l.trim()}</div>
              ) : (
                <p key={i}>{l}</p>
              ),
            )}
          </div>

          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Opciones">
            {pregunta.opciones.map((o, i) => {
              const respondida = elegida !== null;
              const estilo = !respondida
                ? "bg-slate-50 ring-slate-300 hover:ring-sky-500"
                : o.correcta
                  ? "bg-emerald-50 ring-emerald-500"
                  : i === elegida
                    ? "bg-rose-50 ring-rose-400"
                    : "bg-slate-50 ring-slate-200 opacity-70";
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={elegida === i}
                  disabled={respondida}
                  onClick={() => responder(i)}
                  className={`flex flex-col items-start gap-1 rounded-xl px-4 py-3 text-left ring-1 transition ${estilo}`}
                >
                  <span className="font-medium text-slate-900">
                    {LETRAS[i]}) {o.texto}
                    {respondida && o.correcta && <span className="ml-2 text-emerald-700">✓ Correcta</span>}
                  </span>
                  {respondida && !o.correcta && o.error && (
                    <span className={`text-xs ${i === elegida ? "text-rose-700" : "text-slate-500"}`}>{o.error}</span>
                  )}
                </button>
              );
            })}
          </div>

          {elegida !== null && (
            <>
              <div
                role="status"
                className={`rounded-xl px-4 py-3 font-semibold ${acierto ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}
              >
                {acierto ? "¡Correcto!" : "No es correcta. Revisa el desarrollo."}
              </div>
              <details className="rounded-xl bg-slate-50 p-3" open={!acierto}>
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">Solución paso a paso</summary>
                <ol className="mt-2 flex flex-col gap-1 font-mono text-sm text-slate-700">
                  {pregunta.solucion.map((p, i) => (p === "" ? <li key={i} className="h-2" aria-hidden /> : <li key={i}>{p}</li>))}
                </ol>
              </details>
            </>
          )}

          <button
            type="button"
            onClick={nueva}
            className="self-end rounded-xl bg-sky-900 px-5 py-3 font-semibold text-white hover:bg-sky-800"
          >
            {elegida === null ? "Saltar pregunta" : "Siguiente pregunta →"}
          </button>
        </section>
      )}
    </>
  );
}
