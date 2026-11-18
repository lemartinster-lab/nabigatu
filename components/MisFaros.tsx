"use client";

import { useState } from "react";
import { EntradaInvalida, formatoLatitud, formatoLongitud } from "@/lib/nucleo/angulos";
import type { Posicion } from "@/lib/nucleo/coordenadas";
import { SUGERENCIAS_ESTRECHO, guardarFaros, leerFaros, nuevoId, type Faro } from "@/lib/faros";
import { reqPosicion } from "./calculo";
import { CampoPosicion, POSICION_VACIA, posicionAValor, useMisFaros, type ValorPosicion } from "./campos";

export function MisFaros() {
  const faros = useMisFaros();
  const [nombre, setNombre] = useState("");
  const [pos, setPos] = useState<ValorPosicion>(POSICION_VACIA);
  const [editando, setEditando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  let posicion: Posicion | null = null;
  let errorPosicion: string | null = null;
  try {
    posicion = reqPosicion(pos);
  } catch (e) {
    if (e instanceof EntradaInvalida) errorPosicion = e.message;
  }
  const puedeGuardar = nombre.trim() !== "" && posicion !== null;

  const guardar = () => {
    if (!puedeGuardar || !posicion) return;
    const actuales = leerFaros();
    const faro: Faro = { id: editando ?? nuevoId(), nombre: nombre.trim(), ...posicion };
    const lista = editando ? actuales.map((f) => (f.id === editando ? faro : f)) : [...actuales, faro];
    lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    setMensaje(guardarFaros(lista) ? `«${faro.nombre}» guardado.` : "No se ha podido guardar en este navegador.");
    setNombre("");
    setPos(POSICION_VACIA);
    setEditando(null);
  };

  const editar = (f: Faro) => {
    setEditando(f.id);
    setNombre(f.nombre);
    setPos(posicionAValor(f));
    setMensaje(null);
  };

  const borrar = (f: Faro) => {
    guardarFaros(leerFaros().filter((x) => x.id !== f.id));
    if (editando === f.id) {
      setEditando(null);
      setNombre("");
      setPos(POSICION_VACIA);
    }
    setMensaje(`«${f.nombre}» borrado.`);
  };

  const pendientes = SUGERENCIAS_ESTRECHO.filter((s) => !faros.some((f) => f.nombre.toLowerCase() === s.toLowerCase()));

  return (
    <>
      <p className="text-sm text-slate-600">
        Mide en tu carta la situación de cada faro y guárdala aquí una sola vez. Después podrás elegirlo en cualquier campo
        de posición («Situación por demoras», «Loxodrómica»…). Se guardan en este navegador.
      </p>
      <p className="text-xs text-slate-500">
        La app no trae coordenadas de serie a propósito: cada edición de la carta del examen puede diferir alguna décima
        de minuto, y lo que cuenta es lo que mides en la tuya.
      </p>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200" aria-label={editando ? "Editar faro" : "Añadir faro"}>
        <div className="text-sm font-semibold text-slate-700">{editando ? "Editar faro" : "Añadir faro"}</div>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Nombre</span>
          <input
            list="sugerencias-faros"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Punta Europa"
            aria-label="Nombre"
            className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-lg"
          />
          <datalist id="sugerencias-faros">
            {pendientes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <CampoPosicion etiqueta="Situación medida en la carta" valor={pos} onChange={setPos} conFaros={false} />
        {errorPosicion && <p className="text-sm text-rose-700">{errorPosicion}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!puedeGuardar}
            onClick={guardar}
            className="rounded-xl bg-sky-900 px-4 py-2.5 font-semibold text-white disabled:bg-slate-300"
          >
            {editando ? "Guardar cambios" : "Añadir"}
          </button>
          {editando && (
            <button
              type="button"
              onClick={() => {
                setEditando(null);
                setNombre("");
                setPos(POSICION_VACIA);
              }}
              className="rounded-xl px-4 py-2.5 text-slate-600"
            >
              Cancelar
            </button>
          )}
        </div>
        {mensaje && (
          <p role="status" className="text-sm text-emerald-700">
            {mensaje}
          </p>
        )}
      </section>

      <section aria-label="Faros guardados" className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-slate-700">Guardados ({faros.length})</div>
        {faros.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no has guardado ningún faro.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {faros.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900">{f.nombre}</div>
                  <div className="text-sm tabular-nums text-slate-500">
                    {formatoLatitud(f.lat)} · {formatoLongitud(f.lon)}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => editar(f)} className="rounded-lg px-2 py-1 text-sm text-sky-800 hover:bg-sky-50">
                    Editar
                  </button>
                  <button type="button" onClick={() => borrar(f)} className="rounded-lg px-2 py-1 text-sm text-rose-700 hover:bg-rose-50">
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {pendientes.length > 0 && faros.length > 0 && (
          <p className="text-xs text-slate-500">Faros habituales de la carta del Estrecho que aún no tienes: {pendientes.join(", ")}.</p>
        )}
      </section>
    </>
  );
}
