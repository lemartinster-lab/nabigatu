"use client";

import { CENTELLEOS_CARDINAL, LUCES_RIPA, MARCAS, type ColorBaliza, type ColorLuz, type Marca, type MarcaDia, type MarcaTope } from "@/lib/teoria/chuletas";

const PINTURA: Record<ColorBaliza, string> = {
  rojo: "#c81e1e",
  verde: "#15803d",
  negro: "#111827",
  amarillo: "#facc15",
  blanco: "#ffffff",
  azul: "#1d4ed8",
};

const LUZ: Record<ColorLuz, string> = { blanca: "#ffffff", roja: "#ef4444", verde: "#22c55e", amarilla: "#facc15" };

/** Marca de tope dibujada en una caja de 40×34, centrada en x = 20. */
function Tope({ tipo }: { tipo: MarcaTope }) {
  const negro = PINTURA.negro;
  const conoArriba = (y: number, c: string) => <polygon points={`20,${y} 30,${y + 13} 10,${y + 13}`} fill={c} />;
  const conoAbajo = (y: number, c: string) => <polygon points={`10,${y} 30,${y} 20,${y + 13}`} fill={c} />;
  switch (tipo) {
    case "cilindro-rojo":
      return <rect x={12} y={12} width={16} height={18} fill={PINTURA.rojo} />;
    case "cono-verde":
      return conoArriba(14, PINTURA.verde);
    case "conos-arriba":
      return (
        <>
          {conoArriba(2, negro)}
          {conoArriba(18, negro)}
        </>
      );
    case "conos-abajo":
      return (
        <>
          {conoAbajo(2, negro)}
          {conoAbajo(18, negro)}
        </>
      );
    case "conos-base":
      return (
        <>
          {conoArriba(2, negro)}
          {conoAbajo(16, negro)}
        </>
      );
    case "conos-vertice":
      return (
        <>
          {conoAbajo(2, negro)}
          {conoArriba(16, negro)}
        </>
      );
    case "dos-esferas":
      return (
        <>
          <circle cx={20} cy={8} r={6} fill={negro} />
          <circle cx={20} cy={24} r={6} fill={negro} />
        </>
      );
    case "esfera-roja":
      return <circle cx={20} cy={22} r={8} fill={PINTURA.rojo} />;
    case "aspa":
      return (
        <g stroke={PINTURA.amarillo} strokeWidth={5} strokeLinecap="round">
          <line x1={11} y1={13} x2={29} y2={31} />
          <line x1={29} y1={13} x2={11} y2={31} />
        </g>
      );
    case "cruz-amarilla":
      return (
        <g stroke={PINTURA.amarillo} strokeWidth={5} strokeLinecap="round">
          <line x1={20} y1={11} x2={20} y2={32} />
          <line x1={10} y1={21} x2={30} y2={21} />
        </g>
      );
    default:
      return null;
  }
}

/** Boya de castillete: marca de tope arriba, cuerpo con sus franjas y agua. */
function Boya({ m }: { m: Marca }) {
  const x = 6;
  const y = 40;
  const w = 28;
  const h = 46;
  const n = m.franjas.length;
  return (
    <svg viewBox="0 0 40 96" className="h-28 w-12 shrink-0" role="img" aria-label={`Dibujo de la marca ${m.nombre}`}>
      <line x1={20} y1={32} x2={20} y2={40} stroke="#374151" strokeWidth={2} />
      <Tope tipo={m.tope} />
      <defs>
        <clipPath id={`cuerpo-${m.id}`}>
          <path d={`M${x + 4},${y} h${w - 8} l4,${h} h-${w} z`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#cuerpo-${m.id})`}>
        {m.franjas.map((c, i) =>
          m.vertical ? (
            <rect key={i} x={x + (i * w) / n} y={y} width={w / n + 0.5} height={h} fill={PINTURA[c]} />
          ) : (
            <rect key={i} x={x} y={y + (i * h) / n} width={w} height={h / n + 0.5} fill={PINTURA[c]} />
          ),
        )}
      </g>
      <path d={`M${x + 4},${y} h${w - 8} l4,${h} h-${w} z`} fill="none" stroke="#374151" strokeWidth={1} />
      <path d="M0,90 q5,-3 10,0 t10,0 t10,0 t10,0" fill="none" stroke="#38bdf8" strokeWidth={2} />
    </svg>
  );
}

const GRUPOS: { id: Marca["grupo"]; titulo: string; ayuda: string }[] = [
  { id: "lateral", titulo: "Laterales (región A)", ayuda: "Entrando en puerto desde la mar: rojas por babor y verdes por estribor." },
  {
    id: "cardinal",
    titulo: "Cardinales",
    ayuda: "Se pasa por el lado que dice su nombre. Los conos apuntan a donde está el negro, y los centelleos van como el reloj: este a las 3, sur a las 6, oeste a las 9.",
  },
  { id: "otras", titulo: "Otras marcas", ayuda: "Peligro aislado, aguas navegables, especiales y nuevo peligro." },
];

export function ChuletaBalizamiento() {
  return (
    <>
      <p className="text-sm text-slate-600">Sistema IALA, región A (la de España y Europa). Debajo de cada marca, su luz y qué indica.</p>
      {GRUPOS.map((g) => (
        <section key={g.id} className="flex flex-col gap-2">
          <h3 className="font-semibold text-sky-950">{g.titulo}</h3>
          <p className="text-sm text-slate-600">{g.ayuda}</p>
          <ul className="flex flex-col gap-2">
            {MARCAS.filter((m) => m.grupo === g.id).map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                <Boya m={m} />
                <div className="min-w-0">
                  <div className="font-semibold text-sky-950">{m.nombre}</div>
                  <div className="text-sm text-slate-700">{m.significado}</div>
                  <div className="mt-1 text-sm text-slate-500">Luz: {m.luz}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-xs text-slate-500">
        Centelleos de las cardinales: norte {CENTELLEOS_CARDINAL.norte}, este {CENTELLEOS_CARDINAL.este}, sur{" "}
        {CENTELLEOS_CARDINAL.sur} (más un destello largo), oeste {CENTELLEOS_CARDINAL.oeste}.
      </p>
    </>
  );
}

function LucesVerticales({ luces }: { luces: ColorLuz[] }) {
  if (luces.length === 0) return <div className="w-10 shrink-0" aria-hidden />;
  return (
    <svg viewBox={`0 0 40 ${luces.length * 24 + 8}`} className="w-10 shrink-0 rounded-lg bg-slate-900" role="img" aria-label={`Luces todo horizonte: ${luces.join(" sobre ")}`}>
      {luces.map((c, i) => (
        <circle key={i} cx={20} cy={16 + i * 24} r={8} fill={LUZ[c]} />
      ))}
    </svg>
  );
}

function FormaDia({ forma, y }: { forma: MarcaDia; y: number }) {
  const n = "#111827";
  switch (forma) {
    case "bola":
      return <circle cx={15} cy={y + 8} r={8} fill={n} />;
    case "cono-abajo":
      return <polygon points={`6,${y} 24,${y} 15,${y + 16}`} fill={n} />;
    case "conos-vertice":
      return <polygon points={`6,${y} 24,${y} 15,${y + 8} 24,${y + 16} 6,${y + 16} 15,${y + 8}`} fill={n} />;
    case "bicono":
      return <polygon points={`15,${y} 24,${y + 8} 15,${y + 16} 6,${y + 8}`} fill={n} />;
    case "cilindro":
      return <rect x={7} y={y} width={16} height={16} fill={n} />;
  }
}

function MarcasDia({ formas }: { formas: MarcaDia[] }) {
  if (formas.length === 0) return <div className="w-8 shrink-0" aria-hidden />;
  return (
    <svg viewBox={`0 0 30 ${formas.length * 20 + 4}`} className="w-8 shrink-0" role="img" aria-label={`Marcas de día: ${formas.join(", ")}`}>
      {formas.map((f, i) => (
        <FormaDia key={i} forma={f} y={2 + i * 20} />
      ))}
    </svg>
  );
}

export function ChuletaLuces() {
  return (
    <>
      <p className="text-sm text-slate-600">
        A la izquierda, las luces todo horizonte en vertical (de noche); a su lado, las marcas de día. Las luces de tope, costado y
        alcance van explicadas en el texto.
      </p>
      <ul className="flex flex-col gap-2">
        {LUCES_RIPA.map((l) => (
          <li key={l.id} className="flex items-start gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <LucesVerticales luces={l.todoHorizonte} />
            <MarcasDia formas={l.dia} />
            <div className="min-w-0">
              <div className="font-semibold text-sky-950">{l.buque}</div>
              {l.todoHorizonte.length > 0 && <div className="text-sm text-slate-700">De noche: {l.todoHorizonte.join(" sobre ")}, todo horizonte.</div>}
              {l.ademas && <div className="text-sm text-slate-700">{l.ademas}.</div>}
              {l.truco && <div className="mt-1 text-sm font-medium text-sky-800">{l.truco}</div>}
              <div className="mt-1 text-xs text-slate-500">RIPA, {l.regla}</div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        Sectores: luz de tope 225°, cada luz de costado 112,5° y luz de alcance 135°. Las todo horizonte se ven desde 360°.
      </p>
    </>
  );
}
