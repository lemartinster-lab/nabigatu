/**
 * Escalas Beaufort (fuerza del viento) y Douglas (estado de la mar de viento),
 * con las denominaciones usadas en España.
 */

export interface GradoBeaufort {
  fuerza: number;
  nombre: string;
  /** Velocidad del viento en nudos: [mínimo, máximo]; máximo null en el último grado. */
  nudos: [number, number | null];
  mar: string;
}

export const BEAUFORT: GradoBeaufort[] = [
  { fuerza: 0, nombre: "Calma", nudos: [0, 0], mar: "Mar como un espejo" },
  { fuerza: 1, nombre: "Ventolina", nudos: [1, 3], mar: "Pequeñas ondas sin espuma" },
  { fuerza: 2, nombre: "Flojito", nudos: [4, 6], mar: "Olas pequeñas que no rompen" },
  { fuerza: 3, nombre: "Flojo", nudos: [7, 10], mar: "Olas cortas; algunas crestas empiezan a romper" },
  { fuerza: 4, nombre: "Bonancible", nudos: [11, 16], mar: "Olas más largas; borreguillos numerosos" },
  { fuerza: 5, nombre: "Fresquito", nudos: [17, 21], mar: "Olas moderadas y alargadas; muchos borreguillos" },
  { fuerza: 6, nombre: "Fresco", nudos: [22, 27], mar: "Olas grandes; crestas de espuma blanca extendidas" },
  { fuerza: 7, nombre: "Frescachón", nudos: [28, 33], mar: "La mar engruesa; la espuma se alinea con el viento" },
  { fuerza: 8, nombre: "Temporal", nudos: [34, 40], mar: "Olas altas; las crestas se rompen en rociones" },
  { fuerza: 9, nombre: "Temporal fuerte", nudos: [41, 47], mar: "Olas muy altas; densas franjas de espuma" },
  { fuerza: 10, nombre: "Temporal duro", nudos: [48, 55], mar: "Olas muy gruesas; la superficie se ve blanca" },
  { fuerza: 11, nombre: "Temporal muy duro", nudos: [56, 63], mar: "Olas excepcionalmente altas; visibilidad reducida" },
  { fuerza: 12, nombre: "Temporal huracanado", nudos: [64, null], mar: "Aire lleno de espuma y rociones; mar blanca" },
];

export interface GradoDouglas {
  grado: number;
  nombre: string;
  /** Altura de las olas en metros: [mínimo, máximo]; máximo null en el último grado. */
  metros: [number, number | null];
}

export const DOUGLAS: GradoDouglas[] = [
  { grado: 0, nombre: "Calma", metros: [0, 0] },
  { grado: 1, nombre: "Rizada", metros: [0, 0.1] },
  { grado: 2, nombre: "Marejadilla", metros: [0.1, 0.5] },
  { grado: 3, nombre: "Marejada", metros: [0.5, 1.25] },
  { grado: 4, nombre: "Fuerte marejada", metros: [1.25, 2.5] },
  { grado: 5, nombre: "Gruesa", metros: [2.5, 4] },
  { grado: 6, nombre: "Muy gruesa", metros: [4, 6] },
  { grado: 7, nombre: "Arbolada", metros: [6, 9] },
  { grado: 8, nombre: "Montañosa", metros: [9, 14] },
  { grado: 9, nombre: "Enorme", metros: [14, null] },
];

/** Grado Beaufort que corresponde a una velocidad en nudos (redondeada al nudo). */
export function gradoBeaufort(nudos: number): GradoBeaufort {
  const v = Math.round(nudos);
  return BEAUFORT.find((g) => v >= g.nudos[0] && (g.nudos[1] === null || v <= g.nudos[1])) ?? BEAUFORT[BEAUFORT.length - 1];
}
