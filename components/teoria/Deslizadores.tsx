"use client";

import { useState, type ReactNode } from "react";
import { formatoAbatimiento, formatoEW, formatoRumbo, formatoSigno } from "@/lib/nucleo/angulos";
import { formatoDuracion, formatoNumero } from "@/lib/nucleo/unidades";
import { correccionTotal, deAgujaAVerdadero } from "@/lib/per/correccion";
import { efectoCorriente, rumboSuperficie } from "@/lib/per/viento-corriente";
import { alturaYAzimut } from "@/lib/cy/astronomica";
import { formatoAltura } from "@/lib/cy/alturas";
import { formatoDeclinacion } from "@/lib/cy/astros";
import { alturaMarea, alturaMeridiana, trayectoriaDiurna } from "@/lib/teoria/interactivo";

const RAD = Math.PI / 180;

function Deslizador({
  etiqueta,
  valor,
  min,
  max,
  paso = 1,
  texto,
  onChange,
}: {
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso?: number;
  texto: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between gap-2 text-sm">
        <span className="font-medium text-slate-700">{etiqueta}</span>
        <span className="font-semibold tabular-nums text-sky-950">{texto}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-full accent-sky-800"
      />
    </label>
  );
}

function Resultados({ filas }: { filas: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl bg-sky-50 p-4 text-sm">
      {filas.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-slate-600">{k}</dt>
          <dd className="whitespace-nowrap text-right font-semibold tabular-nums text-sky-950">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">{children}</section>;
}

/** Punta de un vector desde (x0, y0) con rumbo náutico y longitud en píxeles. */
const punta = (x0: number, y0: number, rumbo: number, largo: number) => ({ x: x0 + largo * Math.sin(rumbo * RAD), y: y0 - largo * Math.cos(rumbo * RAD) });

function Flecha({ x1, y1, x2, y2, color, discontinua }: { x1: number; y1: number; x2: number; y2: number; color: string; discontinua?: boolean }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const a = 8;
  const p1 = `${x2 - a * Math.cos(ang - 0.4)},${y2 - a * Math.sin(ang - 0.4)}`;
  const p2 = `${x2 - a * Math.cos(ang + 0.4)},${y2 - a * Math.sin(ang + 0.4)}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={3} strokeDasharray={discontinua ? "6 5" : undefined} />
      {!discontinua && <polygon points={`${x2},${y2} ${p1} ${p2}`} fill={color} />}
    </g>
  );
}

function Leyenda({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {items.map(([color, texto]) => (
        <span key={texto} className="flex items-center gap-1">
          <span className="inline-block h-1 w-5 rounded" style={{ background: color }} />
          {texto}
        </span>
      ))}
    </div>
  );
}

// ---------- Triángulo de viento y corriente ----------

export function TrianguloVelocidades() {
  const [rv, setRv] = useState(45);
  const [vb, setVb] = useState(6);
  const [ab, setAb] = useState(5);
  const [rc, setRc] = useState(150);
  const [ic, setIc] = useState(2);
  const rs = rumboSuperficie(rv, ab).rs;
  const e = efectoCorriente(rs, vb, rc, ic);
  const k = 110 / (vb + ic);
  const o = { x: 150, y: 150 };
  const pv = punta(o.x, o.y, rv, vb * k);
  const ps = punta(o.x, o.y, rs, vb * k);
  const pc = punta(ps.x, ps.y, rc, ic * k);

  return (
    <>
      <p className="text-sm text-slate-600">
        Mueve los valores y mira cómo el viento separa el rumbo de superficie del verdadero, y cómo la corriente lleva el barco
        por el rumbo efectivo. Es el triángulo de velocidades de la carta.
      </p>
      <Panel>
        <svg viewBox="0 0 300 300" className="w-full rounded-2xl bg-sky-50" role="img" aria-label="Triángulo de velocidades">
          <text x={150} y={18} textAnchor="middle" fontSize={13} fill="#334155">
            N
          </text>
          <line x1={150} y1={24} x2={150} y2={276} stroke="#cbd5e1" />
          <line x1={24} y1={150} x2={276} y2={150} stroke="#cbd5e1" />
          <Flecha x1={o.x} y1={o.y} x2={pv.x} y2={pv.y} color="#64748b" discontinua />
          <Flecha x1={o.x} y1={o.y} x2={ps.x} y2={ps.y} color="#1d4ed8" />
          {ic > 0 && <Flecha x1={ps.x} y1={ps.y} x2={pc.x} y2={pc.y} color="#15803d" />}
          <Flecha x1={o.x} y1={o.y} x2={pc.x} y2={pc.y} color="#dc2626" />
          <circle cx={o.x} cy={o.y} r={4} fill="#0f172a" />
        </svg>
        <Leyenda
          items={[
            ["#64748b", "Rumbo verdadero"],
            ["#1d4ed8", "Superficie (con viento)"],
            ["#15803d", "Corriente"],
            ["#dc2626", "Efectivo"],
          ]}
        />
        <Deslizador etiqueta="Rumbo verdadero (Rv)" valor={rv} min={0} max={359} texto={formatoRumbo(rv)} onChange={setRv} />
        <Deslizador etiqueta="Velocidad del barco" valor={vb} min={1} max={20} paso={0.5} texto={`${formatoNumero(vb)} kn`} onChange={setVb} />
        <Deslizador etiqueta="Abatimiento" valor={ab} min={-15} max={15} texto={formatoAbatimiento(ab)} onChange={setAb} />
        <Deslizador etiqueta="Rumbo de la corriente (hacia donde va)" valor={rc} min={0} max={359} texto={formatoRumbo(rc)} onChange={setRc} />
        <Deslizador etiqueta="Intensidad de la corriente" valor={ic} min={0} max={6} paso={0.5} texto={`${formatoNumero(ic)} kn`} onChange={setIc} />
        <Resultados
          filas={[
            ["Rs = Rv + Ab", formatoRumbo(rs)],
            ["Rumbo efectivo", formatoRumbo(e.ref)],
            ["Velocidad efectiva", `${formatoNumero(e.vef)} kn`],
          ]}
        />
      </Panel>
    </>
  );
}

// ---------- Aguja y corrección total ----------

export function AgujaCorreccion() {
  const [dm, setDm] = useState(-4);
  const [desvio, setDesvio] = useState(2);
  const [ra, setRa] = useState(60);
  const ct = correccionTotal(dm, desvio).ct;
  const rv = deAgujaAVerdadero(ra, ct).verdadero;
  const c = 150;
  const R = 115;
  const linea = (ang: number, color: string, nombre: string, largo = R) => {
    const p = punta(c, c, ang, largo);
    const t = punta(c, c, ang, largo - 6);
    return (
      <g key={nombre}>
        <line x1={c} y1={c} x2={p.x} y2={p.y} stroke={color} strokeWidth={3} />
        <text
          x={t.x + 8}
          y={t.y + 4}
          textAnchor="start"
          fontSize={12}
          fontWeight={700}
          fill={color}
          stroke="white"
          strokeWidth={4}
          paintOrder="stroke"
        >
          {nombre}
        </text>
      </g>
    );
  };
  const proa = punta(c, c, rv, R - 10);

  return (
    <>
      <p className="text-sm text-slate-600">
        Los tres nortes: el verdadero (Nv), el magnético (Nm), separado por la declinación, y el de aguja (Na), separado además por
        el desvío. El rumbo de aguja se mide desde Na; el verdadero, desde Nv. Con signos: este positivo, oeste negativo.
      </p>
      <Panel>
        <svg viewBox="0 0 300 300" className="w-full rounded-2xl bg-sky-50" role="img" aria-label="Rosa con los tres nortes y el rumbo">
          <circle cx={c} cy={c} r={R} fill="white" stroke="#94a3b8" />
          {Array.from({ length: 36 }, (_, i) => {
            const a = punta(c, c, i * 10, R);
            const b = punta(c, c, i * 10, R - (i % 9 === 0 ? 12 : 6));
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#94a3b8" />;
          })}
          {linea(0, "#0f172a", "Nv", R)}
          {linea(dm, "#1d4ed8", "Nm", R - 28)}
          {linea(ct, "#ea580c", "Na", R - 56)}
          <Flecha x1={c} y1={c} x2={proa.x} y2={proa.y} color="#dc2626" />
          <circle cx={c} cy={c} r={4} fill="#0f172a" />
        </svg>
        <Leyenda
          items={[
            ["#0f172a", "Norte verdadero"],
            ["#1d4ed8", "Norte magnético"],
            ["#ea580c", "Norte de aguja"],
            ["#dc2626", "Proa"],
          ]}
        />
        <Deslizador etiqueta="Declinación magnética (dm)" valor={dm} min={-20} max={20} paso={0.5} texto={formatoEW(dm)} onChange={setDm} />
        <Deslizador etiqueta="Desvío (Δ)" valor={desvio} min={-15} max={15} paso={0.5} texto={formatoSigno(desvio)} onChange={setDesvio} />
        <Deslizador etiqueta="Rumbo de aguja (Ra)" valor={ra} min={0} max={359} texto={formatoRumbo(ra)} onChange={setRa} />
        <Resultados
          filas={[
            ["Ct = dm + Δ", `${formatoSigno(ct)} (${formatoEW(ct)})`],
            ["Rv = Ra + Ct", formatoRumbo(rv)],
          ]}
        />
      </Panel>
    </>
  );
}

// ---------- Curva de la marea ----------

export function CurvaMarea() {
  const [bm, setBm] = useState(0.6);
  const [pm, setPm] = useState(2.9);
  const [d, setD] = useState(375);
  const [sondaCarta, setSondaCarta] = useState(3);
  const [t, setT] = useState(150);
  const tt = Math.min(t, d);
  const altura = alturaMarea(bm, pm, d, tt);
  const W = 300;
  const H = 180;
  const m = 24;
  const hMax = Math.max(pm, bm) + 0.5;
  const px = (min: number) => m + ((W - 2 * m) * min) / d;
  const py = (h: number) => H - m - ((H - 2 * m) * h) / hMax;
  const puntos = Array.from({ length: 61 }, (_, i) => {
    const min = (d * i) / 60;
    return `${px(min)},${py(alturaMarea(bm, pm, d, min))}`;
  }).join(" ");
  const factor = (1 - Math.cos((Math.PI * tt) / d)) / 2;

  return (
    <>
      <p className="text-sm text-slate-600">
        La marea sube de la bajamar a la pleamar siguiendo una curva: despacio al principio y al final, y deprisa en el medio. Mueve
        la hora y mira la altura y la sonda real (sonda de la carta + altura de la marea).
      </p>
      <Panel>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl bg-sky-50" role="img" aria-label="Curva de la marea">
          <line x1={m} y1={py(0)} x2={W - m} y2={py(0)} stroke="#94a3b8" />
          <polyline points={puntos} fill="none" stroke="#1d4ed8" strokeWidth={3} />
          <line x1={px(tt)} y1={py(0)} x2={px(tt)} y2={py(altura)} stroke="#dc2626" strokeDasharray="4 3" />
          <circle cx={px(tt)} cy={py(altura)} r={6} fill="#dc2626" />
          <text x={m} y={H - 6} fontSize={11} fill="#475569">
            Bajamar
          </text>
          <text x={W - m} y={H - 6} fontSize={11} fill="#475569" textAnchor="end">
            Pleamar
          </text>
        </svg>
        <Deslizador etiqueta="Tiempo desde la bajamar" valor={tt} min={0} max={d} paso={5} texto={formatoDuracion(tt / 60)} onChange={setT} />
        <Deslizador etiqueta="Altura de la bajamar" valor={bm} min={0} max={2} paso={0.1} texto={`${formatoNumero(bm)} m`} onChange={setBm} />
        <Deslizador etiqueta="Altura de la pleamar" valor={pm} min={1} max={5} paso={0.1} texto={`${formatoNumero(pm)} m`} onChange={setPm} />
        <Deslizador etiqueta="Duración de la creciente" valor={d} min={300} max={450} paso={5} texto={formatoDuracion(d / 60)} onChange={setD} />
        <Deslizador etiqueta="Sonda de la carta" valor={sondaCarta} min={0} max={10} paso={0.5} texto={`${formatoNumero(sondaCarta)} m`} onChange={setSondaCarta} />
        <Resultados
          filas={[
            ["Factor (1 − cos(180°·t/D)) ÷ 2", formatoNumero(factor, 3)],
            ["Altura de la marea", `${formatoNumero(altura)} m`],
            ["Sonda real", `${formatoNumero(sondaCarta + altura)} m`],
          ]}
        />
        <p className="text-xs text-slate-500">Es el método del coseno, el mismo del módulo «Mareas».</p>
      </Panel>
    </>
  );
}

// ---------- Esfera celeste ----------

export function EsferaCeleste() {
  const [lat, setLat] = useState(28);
  const [dec, setDec] = useState(15);
  const [hL, setHL] = useState(330);
  const { ae, z } = alturaYAzimut(lat, hL, dec);
  const c = 150;
  const R = 120;
  const enCielo = (a: number, az: number) => {
    const r = (R * (90 - a)) / 90;
    return { x: c + r * Math.sin(az * RAD), y: c - r * Math.cos(az * RAD) };
  };
  // Recorrido diario: tramos por encima del horizonte.
  const tramos: string[][] = [];
  let actual: string[] = [];
  for (const p of trayectoriaDiurna(lat, dec, 3)) {
    if (p.altura >= 0) {
      const q = enCielo(p.altura, p.azimut);
      actual.push(`${q.x},${q.y}`);
    } else if (actual.length) {
      tramos.push(actual);
      actual = [];
    }
  }
  if (actual.length) tramos.push(actual);
  const astro = enCielo(Math.max(ae, 0), z);
  const polo = enCielo(Math.abs(lat), lat >= 0 ? 0 : 180);
  const visible = ae >= 0;
  const am = alturaMeridiana(lat, dec);

  return (
    <>
      <p className="text-sm text-slate-600">
        El cielo visto desde arriba: el círculo es el horizonte y el centro, el cenit. Mueve la latitud, la declinación y el horario
        del lugar para ver dónde está el astro y por dónde pasa a lo largo del día. Con hL = 0° cruza tu meridiano y está en su
        punto más alto.
      </p>
      <Panel>
        <svg viewBox="0 0 300 300" className="w-full rounded-2xl bg-slate-900" role="img" aria-label="Cielo con el recorrido del astro">
          <circle cx={c} cy={c} r={R} fill="#0b1a33" stroke="#64748b" />
          <circle cx={c} cy={c} r={R / 3} fill="none" stroke="#1e293b" />
          <circle cx={c} cy={c} r={(2 * R) / 3} fill="none" stroke="#1e293b" />
          {(
            [
              ["N", 0],
              ["E", 90],
              ["S", 180],
              ["W", 270],
            ] as const
          ).map(([n, a]) => {
            const p = punta(c, c, a, R + 14);
            return (
              <text key={n} x={p.x} y={p.y + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="#cbd5e1">
                {n}
              </text>
            );
          })}
          {tramos.map((t, i) => (
            <polyline key={i} points={t.join(" ")} fill="none" stroke="#facc15" strokeWidth={2} strokeDasharray="5 4" />
          ))}
          <circle cx={polo.x} cy={polo.y} r={4} fill="#93c5fd" />
          <circle cx={c} cy={c} r={2} fill="#cbd5e1" />
          {visible && <circle cx={astro.x} cy={astro.y} r={9} fill="#facc15" />}
        </svg>
        <Leyenda
          items={[
            ["#facc15", "Recorrido del astro"],
            ["#93c5fd", "Polo elevado"],
          ]}
        />
        <Deslizador etiqueta="Latitud del observador" valor={lat} min={-60} max={60} texto={`${Math.abs(lat)}° ${lat >= 0 ? "N" : "S"}`} onChange={setLat} />
        <Deslizador etiqueta="Declinación del astro" valor={dec} min={-30} max={30} paso={0.5} texto={formatoDeclinacion(dec)} onChange={setDec} />
        <Deslizador etiqueta="Horario del lugar (hL)" valor={hL} min={0} max={359} texto={`${hL}°`} onChange={setHL} />
        <Resultados
          filas={[
            ["Altura", visible ? formatoAltura(ae) : `${formatoAltura(ae)} (bajo el horizonte)`],
            ["Azimut", formatoRumbo(z)],
            ["Altura en la meridiana: 90° − |l − d|", formatoAltura(am)],
          ]}
        />
        <p className="text-xs text-slate-500">La altura del polo elevado es igual a la latitud: por eso la Polar da la latitud.</p>
      </Panel>
    </>
  );
}
