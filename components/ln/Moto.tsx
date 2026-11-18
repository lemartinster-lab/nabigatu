"use client";

import { useState } from "react";
import { EntradaInvalida } from "@/lib/nucleo/angulos";
import { formatoDuracion, formatoNumero, leerNumero, leerPositivo } from "@/lib/nucleo/unidades";
import { ortoYOcaso } from "@/lib/ln/luz";
import { autonomia, comprobarAlcance, NORMAS_MOTO, NORMAS_REVISADAS, LIMITE_LICENCIA, LIMITE_PNB } from "@/lib/ln/moto";
import type { Nivel } from "@/lib/modulos";
import { intentar, opt, req, reqPosicion, type Fila } from "../calculo";
import { Campo, CampoPosicion, POSICION_VACIA, Resultado } from "../campos";

const HORA = 3_600_000;

function leerFecha(t: string): number {
  let m = t.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  let y: number, mo: number, d: number;
  if (m) [d, mo, y] = [+m[1], +m[2], +m[3]];
  else {
    m = t.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) throw new EntradaInvalida("Fecha: usa el formato 18/11/2026");
    [y, mo, d] = [+m[1], +m[2], +m[3]];
  }
  const ms = Date.UTC(y, mo - 1, d);
  const c = new Date(ms);
  if (c.getUTCDate() !== d || c.getUTCMonth() !== mo - 1) throw new EntradaInvalida("Esa fecha no existe");
  return ms;
}

function hoyTexto(): string {
  const h = new Date();
  return `${h.getDate()}/${h.getMonth() + 1}/${h.getFullYear()}`;
}

/** Hora oficial «hh:mm» de un instante UTC con el adelanto dado. */
function horaOficial(ms: number, adelanto: number): string {
  const t = new Date(ms + adelanto * HORA);
  return `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
}

export function HorasDeLuz() {
  const [fecha, setFecha] = useState(hoyTexto());
  const [pos, setPos] = useState({ lat: "28°28'", sLat: 1 as const, lon: "016°15'", sLon: -1 as const } as typeof POSICION_VACIA);
  const [adelanto, setAdelanto] = useState("0");

  const salida = intentar(() => {
    const dia = req(fecha, leerFecha);
    const p = reqPosicion(pos);
    const adel = req(adelanto, (t) => leerNumero(t, "Adelanto"));
    const r = ortoYOcaso(dia, p, adel);
    const resultados: Fila[] = [];
    const pasos: string[] = [];
    if (r.motoDesde !== undefined && r.motoHasta !== undefined) {
      resultados.push({ etiqueta: "Motos de agua: se puede navegar", valor: `${horaOficial(r.motoDesde, adel)} a ${horaOficial(r.motoHasta, adel)}`, destacado: true });
    } else {
      resultados.push({ etiqueta: "Motos de agua", valor: "Ese día no hay ventana de navegación", destacado: true });
    }
    if (r.orto !== undefined) resultados.push({ etiqueta: "Orto (salida del sol)", valor: horaOficial(r.orto, adel) });
    if (r.ocaso !== undefined) resultados.push({ etiqueta: "Ocaso (puesta del sol)", valor: horaOficial(r.ocaso, adel) });
    resultados.push({ etiqueta: "Horas de luz", valor: formatoDuracion(r.horasDeLuz) });
    pasos.push(
      "Orto y ocaso: el borde superior del Sol en el horizonte, con la refracción normal.",
      `Horas en hora oficial (UT ${adel >= 0 ? "+" : "−"} ${formatoNumero(Math.abs(adel))} h).`,
      "Motos náuticas: solo de día, entre una hora después del orto y una hora antes del ocaso (Real Decreto 259/2002, art. 10.7).",
      "La licencia de navegación permite navegaciones diurnas (Real Decreto 875/2014, art. 11.1).",
    );
    return { resultados, pasos };
  });

  return (
    <>
      <p className="text-sm text-slate-600">A qué hora sale y se pone el sol, y en qué horario puedes navegar con una moto de agua.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Fecha" valor={fecha} onChange={setFecha} placeholder="18/11/2026" modo="text" />
        <Campo etiqueta="Adelanto de la hora oficial" valor={adelanto} onChange={setAdelanto} unidad="h" ayuda="Canarias: 0 en invierno, +1 en verano. Península y Baleares: +1 y +2." />
      </div>
      <CampoPosicion etiqueta="Lugar" valor={pos} onChange={setPos} ayuda="Viene con Santa Cruz de Tenerife; cámbialo por tu playa o puerto." />
      <Resultado salida={salida} />
    </>
  );
}

export function AlcanceLicencia({ nivel }: { nivel: Nivel }) {
  const limite = nivel === "PNB" ? LIMITE_PNB : LIMITE_LICENCIA;
  const [abrigo, setAbrigo] = useState(POSICION_VACIA);
  const [destino, setDestino] = useState(POSICION_VACIA);
  const [velocidad, setVelocidad] = useState("");

  const salida = intentar(() => {
    const r = comprobarAlcance(reqPosicion(abrigo), reqPosicion(destino), opt(velocidad, (t) => leerPositivo(t, "Velocidad")), limite);
    return {
      resultados: [
        { etiqueta: r.dentro ? "Dentro del límite" : "Fuera del límite", valor: r.dentro ? `Sí · margen ${formatoNumero(r.margen, 2)} mn` : `No · te pasas ${formatoNumero(-r.margen, 2)} mn`, destacado: true },
        { etiqueta: "Distancia", valor: `${formatoNumero(r.distancia, 2)} millas` },
      ],
      pasos: r.pasos,
    };
  });

  return (
    <>
      <p className="text-sm text-slate-600">
        Con {limite.titulo} no puedes alejarte más de {limite.millas} millas de un puerto, marina o abrigo.
        Comprueba si el punto al que quieres ir está dentro.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoPosicion etiqueta="Puerto, marina o abrigo" valor={abrigo} onChange={setAbrigo} />
        <CampoPosicion etiqueta="Punto al que quieres ir" valor={destino} onChange={setDestino} />
      </div>
      <div className="sm:w-1/3">
        <Campo etiqueta="Velocidad (opcional)" valor={velocidad} onChange={setVelocidad} unidad="nudos" ayuda="Para el tiempo de ida y vuelta." />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

export function Autonomia() {
  const [deposito, setDeposito] = useState("");
  const [consumo, setConsumo] = useState("");
  const [velocidad, setVelocidad] = useState("");
  const [reserva, setReserva] = useState("33,3");

  const salida = intentar(() => {
    const r = autonomia({
      deposito: req(deposito, (t) => leerPositivo(t, "Depósito")),
      consumo: req(consumo, (t) => leerPositivo(t, "Consumo")),
      velocidad: req(velocidad, (t) => leerPositivo(t, "Velocidad")),
      reserva: (opt(reserva, (t) => leerNumero(t, "Reserva")) ?? 33.333) / 100,
    });
    return {
      resultados: [
        { etiqueta: "Máximo alejamiento por combustible", valor: `${formatoNumero(r.radio, 1)} millas`, destacado: true },
        { etiqueta: "Tiempo de ida como máximo", valor: formatoDuracion(r.horasIda), destacado: true },
        { etiqueta: "Autonomía con el depósito lleno", valor: formatoDuracion(r.horasTotales) },
        { etiqueta: "Reserva", valor: `${formatoNumero(r.litrosReserva, 1)} L` },
      ],
      pasos: r.pasos,
    };
  });

  return (
    <>
      <p className="text-sm text-slate-600">
        Regla del tercio: un tercio del combustible para ir, otro para volver y otro de reserva. El consumo lo da el fabricante o la empresa de alquiler.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Combustible en el depósito" valor={deposito} onChange={setDeposito} placeholder="60" unidad="L" />
        <Campo etiqueta="Consumo a velocidad de crucero" valor={consumo} onChange={setConsumo} placeholder="20" unidad="L/h" />
        <Campo etiqueta="Velocidad de crucero" valor={velocidad} onChange={setVelocidad} placeholder="25" unidad="nudos" />
        <Campo etiqueta="Reserva" valor={reserva} onChange={setReserva} unidad="%" ayuda="33,3 % es la regla del tercio." />
      </div>
      <Resultado salida={salida} />
    </>
  );
}

export function NormasMoto() {
  return (
    <>
      <p className="text-sm text-slate-600">
        Lo esencial para navegar con una moto de agua con la licencia de navegación, con el artículo de donde sale cada norma.
      </p>
      <ul className="flex flex-col gap-2">
        {NORMAS_MOTO.map((n) => (
          <li key={n.titulo} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="font-semibold text-sky-950">{n.titulo}</div>
            <p className="mt-1 text-slate-700">{n.texto}</p>
            {n.url ? (
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-sky-800 underline">
                {n.fuente}
              </a>
            ) : (
              <span className="mt-1 inline-block text-sm text-slate-500">{n.fuente}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        Revisado el {NORMAS_REVISADAS} con los textos consolidados del BOE (última actualización publicada el 30/12/2025). Es un
        resumen informativo: para fines jurídicos vale el BOE, y cada Capitanía puede añadir normas locales.
      </p>
    </>
  );
}
