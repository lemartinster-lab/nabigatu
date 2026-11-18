"use client";

import type { Salida } from "./calculo";

interface CampoProps {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ayuda?: string;
  unidad?: string;
  modo?: "decimal" | "text" | "numeric";
}

export function Campo({ etiqueta, valor, onChange, placeholder, ayuda, unidad, modo = "decimal" }: CampoProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-600/20">
        <input
          className="w-0 min-w-0 flex-1 px-3 py-2.5 text-lg text-slate-900 outline-none placeholder:text-slate-400"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={modo}
          autoComplete="off"
          spellCheck={false}
        />
        {unidad && <span className="flex items-center bg-slate-50 px-3 text-sm text-slate-500">{unidad}</span>}
      </div>
      {ayuda && <span className="text-xs text-slate-500">{ayuda}</span>}
    </label>
  );
}

interface Opcion<T extends string | number> {
  valor: T;
  etiqueta: string;
}

export function Segmentado<T extends string | number>({
  opciones,
  valor,
  onChange,
  etiqueta,
}: {
  opciones: Opcion<T>[];
  valor: T;
  onChange: (v: T) => void;
  etiqueta?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {etiqueta && <span className="text-sm font-medium text-slate-700">{etiqueta}</span>}
      <div className="flex rounded-xl bg-slate-200/70 p-1" role="radiogroup" aria-label={etiqueta}>
        {opciones.map((o) => (
          <button
            key={String(o.valor)}
            type="button"
            role="radio"
            aria-checked={valor === o.valor}
            onClick={() => onChange(o.valor)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              valor === o.valor ? "bg-white text-sky-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {o.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Ángulo con signo elegido por botones (E/W, babor/estribor). */
export function CampoConSigno({
  etiqueta,
  valor,
  onChange,
  signo,
  onSigno,
  positivo = "E",
  negativo = "W",
  placeholder = "4°15'",
  ayuda,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  signo: 1 | -1;
  onSigno: (s: 1 | -1) => void;
  positivo?: string;
  negativo?: string;
  placeholder?: string;
  ayuda?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      <div className="flex gap-2">
        <input
          className="w-0 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-lg text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode="decimal"
          autoComplete="off"
          aria-label={etiqueta}
        />
        <div className="flex rounded-xl bg-slate-200/70 p-1" role="radiogroup" aria-label={`Signo de ${etiqueta}`}>
          {([
            [1, positivo],
            [-1, negativo],
          ] as const).map(([s, txt]) => (
            <button
              key={txt}
              type="button"
              role="radio"
              aria-checked={signo === s}
              onClick={() => onSigno(s)}
              className={`min-w-11 rounded-lg px-2.5 text-sm font-semibold transition ${
                signo === s ? "bg-white text-sky-800 shadow-sm" : "text-slate-600"
              }`}
            >
              {txt}
            </button>
          ))}
        </div>
      </div>
      {ayuda && <span className="text-xs text-slate-500">{ayuda}</span>}
    </div>
  );
}

export function Resultado({ salida }: { salida: Salida }) {
  if (salida.estado === "vacio") {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        Rellena los datos y el resultado aparecerá aquí al momento.
      </div>
    );
  }
  if (salida.estado === "error") {
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
        {salida.mensaje}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <div className="grid gap-2 sm:grid-cols-2">
        {salida.resultados.map((r) => (
          <div
            key={r.etiqueta}
            className={`rounded-2xl p-4 ${r.destacado ? "bg-sky-900 text-white" : "bg-white ring-1 ring-slate-200"}`}
          >
            <div className={`text-xs font-medium uppercase tracking-wide ${r.destacado ? "text-sky-200" : "text-slate-500"}`}>
              {r.etiqueta}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{r.valor}</div>
          </div>
        ))}
      </div>
      <details className="group rounded-2xl bg-white p-4 ring-1 ring-slate-200" open>
        <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700">Desarrollo paso a paso</summary>
        <ol className="mt-3 flex flex-col gap-1 font-mono text-sm text-slate-700">
          {salida.pasos.map((p, i) =>
            p === "" ? (
              <li key={i} className="h-2" aria-hidden />
            ) : (
              <li key={i} className={/^\d\)/.test(p) ? "mt-1 font-sans font-semibold text-sky-900" : ""}>
                {p}
              </li>
            ),
          )}
        </ol>
      </details>
    </div>
  );
}
