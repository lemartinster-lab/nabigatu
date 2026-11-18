import { EntradaInvalida } from "@/lib/nucleo/angulos";

/** Se lanza cuando falta un dato obligatorio: no es un error, solo no hay nada que mostrar aún. */
export class Incompleto extends Error {}

export interface Fila {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}

export type Salida =
  | { estado: "vacio" }
  | { estado: "error"; mensaje: string }
  | { estado: "ok"; resultados: Fila[]; pasos: string[] };

export function intentar(fn: () => { resultados: Fila[]; pasos: string[] }): Salida {
  try {
    return { estado: "ok", ...fn() };
  } catch (e) {
    if (e instanceof Incompleto) return { estado: "vacio" };
    if (e instanceof EntradaInvalida) return { estado: "error", mensaje: e.message };
    return { estado: "error", mensaje: "No se ha podido calcular. Revisa los datos." };
  }
}

/** Dato obligatorio: si está vacío, el cálculo queda en espera. */
export function req<T>(texto: string, lector: (t: string) => T): T {
  if (texto.trim() === "") throw new Incompleto();
  return lector(texto);
}

/** Dato opcional. */
export function opt<T>(texto: string, lector: (t: string) => T): T | undefined {
  return texto.trim() === "" ? undefined : lector(texto);
}
