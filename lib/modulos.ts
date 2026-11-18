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
    descripcion: "Estima, mareas y loxodrómica (próximamente)",
  },
  {
    id: "CY",
    nombre: "Capitán de Yate",
    corto: "Capitán de Yate",
    descripcion: "Ortodrómica y navegación astronómica (próximamente)",
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
  { id: "rumbo-a-dar", titulo: "Rumbo a dar al timonel", resumen: "Problema completo: corriente, viento y aguja", nivel: "PER", disponible: true },
  { id: "ct", titulo: "Corrección total", resumen: "Ct = dm + Δ", nivel: "PER", disponible: true },
  { id: "rumbos", titulo: "Rumbos y demoras", resumen: "De aguja a verdadero y al revés", nivel: "PER", disponible: true },
  { id: "ct-demora", titulo: "Ct por enfilación o demora", resumen: "Ct = Dv − Da y desvío", nivel: "PER", disponible: true },
  { id: "dm", titulo: "Declinación magnética", resumen: "Actualizar la dm de la carta", nivel: "PER", disponible: true },
  { id: "dvt", titulo: "Distancia, velocidad y tiempo", resumen: "D = V × t y hora de llegada", nivel: "PER", disponible: true },
  { id: "viento", titulo: "Viento: abatimiento", resumen: "Rs = Rv + Ab", nivel: "PER", disponible: true },
  { id: "corriente", titulo: "Corriente", resumen: "Rumbo y velocidad efectivos", nivel: "PER", disponible: true },
  { id: "conversiones", titulo: "Conversiones", resumen: "Ángulos, cuadrantales y unidades", nivel: "PER", disponible: true },

  { id: "estima", titulo: "Situación por estima", resumen: "Posición tras navegar un rumbo y distancia", nivel: "PY", disponible: false },
  { id: "loxodromica", titulo: "Loxodrómica", resumen: "Rumbo y distancia entre dos posiciones", nivel: "PY", disponible: false },
  { id: "mareas", titulo: "Mareas", resumen: "Hora y altura de la marea", nivel: "PY", disponible: false },

  { id: "ortodromica", titulo: "Ortodrómica", resumen: "Navegación por círculo máximo", nivel: "CY", disponible: false },
  { id: "recta-altura", titulo: "Recta de altura", resumen: "Situación por observación de astros", nivel: "CY", disponible: false },
  { id: "meridiana", titulo: "Meridiana", resumen: "Latitud por la altura del Sol al mediodía", nivel: "CY", disponible: false },
];

const ORDEN: Nivel[] = ["PER", "PY", "CY"];

/** Una titulación incluye los módulos de las titulaciones inferiores. */
export function modulosDeNivel(nivel: Nivel): Modulo[] {
  const hasta = ORDEN.indexOf(nivel);
  return MODULOS.filter((m) => ORDEN.indexOf(m.nivel) <= hasta);
}
