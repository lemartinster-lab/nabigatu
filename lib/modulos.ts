/**
 * Catálogo de módulos por titulación. Añadir un nivel nuevo (Patrón de Yate,
 * Capitán de Yate) es añadir entradas aquí y sus cálculos en lib/<nivel>/.
 */

export type Nivel = "PER" | "PY" | "CY";

export const NIVELES: { id: Nivel; nombre: string; corto: string; descripcion: string }[] = [
  {
    id: "PER",
    nombre: "Patrón de Embarcaciones de Recreo",
    corto: "PER",
    descripcion: "Navegación costera: carta, rumbos, viento y corriente",
  },
  {
    id: "PY",
    nombre: "Patrón de Yate",
    corto: "Patrón de Yate",
    descripcion: "Mareas, estima, loxodrómica y situación, además de todo el PER",
  },
  {
    id: "CY",
    nombre: "Capitán de Yate",
    corto: "Capitán de Yate",
    descripcion: "Ortodrómica y navegación astronómica, además de todo lo anterior",
  },
];

export interface Modulo {
  id: string;
  titulo: string;
  resumen: string;
  nivel: Nivel;
  disponible: boolean;
}

export const MODULOS: Modulo[] = [
  { id: "examen", titulo: "Modo examen", resumen: "Ejercicios tipo test con la solución", nivel: "PER", disponible: true },
  { id: "rumbo-a-dar", titulo: "Rumbo a dar al timonel", resumen: "Problema completo: corriente, viento y aguja", nivel: "PER", disponible: true },
  { id: "ct", titulo: "Corrección total", resumen: "Ct = dm + Δ", nivel: "PER", disponible: true },
  { id: "rumbos", titulo: "Rumbos y demoras", resumen: "De aguja a verdadero y al revés", nivel: "PER", disponible: true },
  { id: "ct-demora", titulo: "Ct por enfilación o demora", resumen: "Ct = Dv − Da y desvío", nivel: "PER", disponible: true },
  { id: "dm", titulo: "Declinación magnética", resumen: "Actualizar la dm de la carta", nivel: "PER", disponible: true },
  { id: "dvt", titulo: "Distancia, velocidad y tiempo", resumen: "D = V × t y hora de llegada", nivel: "PER", disponible: true },
  { id: "viento", titulo: "Viento: abatimiento", resumen: "Rs = Rv + Ab", nivel: "PER", disponible: true },
  { id: "corriente", titulo: "Corriente", resumen: "Rumbo y velocidad efectivos", nivel: "PER", disponible: true },
  { id: "conversiones", titulo: "Conversiones", resumen: "Ángulos, cuadrantales y unidades", nivel: "PER", disponible: true },

  { id: "mareas", titulo: "Mareas", resumen: "Sonda a una hora y hora para una sonda", nivel: "PY", disponible: true },
  { id: "estima", titulo: "Situación por estima", resumen: "Uno o varios rumbos, con viento y corriente", nivel: "PY", disponible: true },
  { id: "loxodromica", titulo: "Loxodrómica", resumen: "Rumbo y distancia entre dos posiciones", nivel: "PY", disponible: true },
  { id: "situacion", titulo: "Situación por demoras", resumen: "Dos demoras, traslado, demora y distancia", nivel: "PY", disponible: true },
  { id: "llegada", titulo: "Llegar a una hora", resumen: "Rumbo y velocidad para estar a la hora fijada", nivel: "PY", disponible: true },

  { id: "ortodromica", titulo: "Ortodrómica", resumen: "Rumbo inicial, distancia y vértice", nivel: "CY", disponible: true },
  { id: "horas", titulo: "Horas y fechas", resumen: "HcG, HcL, hora de zona y oficial", nivel: "CY", disponible: true },
  { id: "horario", titulo: "Horario del astro", resumen: "hG, hL y declinación con el Almanaque", nivel: "CY", disponible: true },
  { id: "alturas", titulo: "Corrección de alturas", resumen: "De la altura instrumental a la verdadera", nivel: "CY", disponible: true },
  { id: "meridiana", titulo: "Meridiana", resumen: "Latitud por la altura meridiana y hora del paso", nivel: "CY", disponible: true },
  { id: "polar", titulo: "Latitud por la Polar", resumen: "Con su altura y horario del lugar", nivel: "CY", disponible: true },
  { id: "recta-altura", titulo: "Recta de altura", resumen: "ae, Z, Δa y situación por dos rectas", nivel: "CY", disponible: true },
];

const ORDEN: Nivel[] = ["PER", "PY", "CY"];

/** Una titulación incluye los módulos de las titulaciones inferiores. */
export function modulosDeNivel(nivel: Nivel): Modulo[] {
  const hasta = ORDEN.indexOf(nivel);
  return MODULOS.filter((m) => ORDEN.indexOf(m.nivel) <= hasta);
}
