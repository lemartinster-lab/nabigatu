"use client";

import { useEffect, useState, type ComponentType } from "react";
import { MODULOS, NIVELES, modulosDeNivel, type Nivel } from "@/lib/modulos";
import { CorreccionTotal, CtPorDemora, RumbosDemoras } from "./per/Correccion";
import { Declinacion } from "./per/Declinacion";
import { DistanciaVelocidad } from "./per/DistanciaVelocidad";
import { Corriente, RumboADar, Viento } from "./per/VientoCorriente";
import { Conversiones } from "./per/Conversiones";
import { Mareas } from "./py/Mareas";
import { Estima, LlegarAHora, Loxodromica } from "./py/Navegacion";
import { Situacion } from "./py/Situacion";
import { ModoExamen } from "./examen/ModoExamen";

const COMPONENTES: Record<string, ComponentType<{ nivel: Nivel }>> = {
  examen: ModoExamen,
  "rumbo-a-dar": RumboADar,
  ct: CorreccionTotal,
  rumbos: RumbosDemoras,
  "ct-demora": CtPorDemora,
  dm: Declinacion,
  dvt: DistanciaVelocidad,
  viento: Viento,
  corriente: Corriente,
  conversiones: Conversiones,
  mareas: Mareas,
  estima: Estima,
  loxodromica: Loxodromica,
  situacion: Situacion,
  llegada: LlegarAHora,
};

const CLAVE = "nabigatu:v1";

const NOMBRE_NIVEL: Record<Nivel, string> = { PER: "PER", PY: "Patrón de Yate", CY: "Capitán de Yate" };

export function App() {
  const [nivel, setNivel] = useState<Nivel>("PER");
  const [activo, setActivo] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE) ?? "{}") as { nivel?: Nivel };
      if (g.nivel && NIVELES.some((n) => n.id === g.nivel)) setNivel(g.nivel);
    } catch {
      /* sin almacenamiento: se usa el PER */
    }
    setCargado(true);
  }, []);

  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ nivel }));
    } catch {
      /* ignorar */
    }
  }, [cargado, nivel]);

  const modulos = modulosDeNivel(nivel);
  const modulo = MODULOS.find((m) => m.id === activo);
  const Componente = activo ? COMPONENTES[activo] : undefined;

  const abrir = (id: string) => {
    setActivo(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => setActivo(null)} className="flex items-center gap-2 text-left">
            <Rosa />
            <div>
              <div className="text-lg font-bold leading-tight text-sky-950">Nabigatu</div>
              <div className="text-xs text-slate-500">Navegación y examen</div>
            </div>
          </button>
          <label className="flex flex-col items-end text-xs text-slate-500">
            Mi titulación
            <select
              value={nivel}
              onChange={(e) => {
                setNivel(e.target.value as Nivel);
                setActivo(null);
              }}
              className="mt-0.5 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-800"
            >
              {NIVELES.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.corto}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <nav
          className={`border-slate-200 p-4 lg:block lg:w-80 lg:shrink-0 lg:border-r ${activo ? "hidden" : "block"}`}
          aria-label="Módulos"
        >
          <p className="mb-3 text-sm text-slate-600">{NIVELES.find((n) => n.id === nivel)?.descripcion}</p>
          <ul className="flex flex-col gap-2">
            {modulos.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={!m.disponible}
                  onClick={() => abrir(m.id)}
                  aria-current={activo === m.id ? "page" : undefined}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    activo === m.id
                      ? "bg-sky-900 text-white"
                      : m.disponible
                        ? "bg-white ring-1 ring-slate-200 hover:ring-sky-400"
                        : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{m.titulo}</span>
                    {(m.nivel !== "PER" || m.id === "examen") && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${activo === m.id ? "bg-sky-700" : "bg-slate-200 text-slate-500"}`}>
                        {m.id === "examen" ? "Practicar" : m.disponible ? NOMBRE_NIVEL[m.nivel] : "Próximamente"}
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${activo === m.id ? "text-sky-100" : "text-slate-500"}`}>{m.resumen}</div>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className={`flex-1 p-4 sm:p-6 ${activo ? "block" : "hidden lg:block"}`}>
          {modulo && Componente ? (
            <article className="mx-auto flex max-w-3xl flex-col gap-5">
              <button type="button" onClick={() => setActivo(null)} className="self-start text-sm font-medium text-sky-800 lg:hidden">
                ← Todos los cálculos
              </button>
              <div>
                <h1 className="text-2xl font-bold text-sky-950">{modulo.titulo}</h1>
                <p className="text-slate-600">{modulo.resumen}</p>
              </div>
              <Componente key={`${modulo.id}-${nivel}`} nivel={nivel} />
            </article>
          ) : (
            <Bienvenida />
          )}
        </main>
      </div>

      <footer className="border-t border-slate-200 px-4 py-4 text-xs leading-relaxed text-slate-500">
        <strong>Aviso:</strong> Nabigatu es una herramienta de apoyo y de estudio. No sustituye a la carta náutica, a los
        instrumentos de a bordo ni al criterio del patrón. Comprueba siempre los resultados antes de navegar.
      </footer>
    </div>
  );
}

function Bienvenida() {
  return (
    <div className="mx-auto hidden max-w-xl flex-col items-center gap-4 py-16 text-center text-slate-600 lg:flex">
      <Rosa grande />
      <h1 className="text-2xl font-bold text-sky-950">Elige un cálculo</h1>
      <p>
        Cada cálculo muestra el resultado al momento y el desarrollo paso a paso, como se resuelve en el examen.
        Criterio de signos: <strong>Este positivo, Oeste negativo</strong>; abatimiento positivo con viento por babor.
      </p>
    </div>
  );
}

function Rosa({ grande = false }: { grande?: boolean }) {
  const s = grande ? 72 : 36;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="#0c4a6e" />
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="#7dd3fc" strokeWidth="0.8" />
      <path d="M20 4 L23 20 L20 36 L17 20 Z" fill="#f8fafc" />
      <path d="M4 20 L20 17 L36 20 L20 23 Z" fill="#bae6fd" />
      <path d="M20 4 L23 20 L17 20 Z" fill="#f97316" />
      <circle cx="20" cy="20" r="2" fill="#0c4a6e" />
    </svg>
  );
}
