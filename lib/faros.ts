/**
 * «Mis faros»: posiciones que el usuario mide en su propia carta y guarda en el navegador.
 * No se incluyen coordenadas de serie: cada carta de examen puede diferir alguna décima de minuto.
 */
import type { Posicion } from "./nucleo/coordenadas";

export interface Faro extends Posicion {
  id: string;
  nombre: string;
}

/** Faros y puntos que aparecen en los ejercicios de la carta del Estrecho. */
export const SUGERENCIAS_ESTRECHO = [
  "Cabo Roche",
  "Cabo Trafalgar",
  "Barbate",
  "Punta de Gracia",
  "Punta Camarinal",
  "Punta Paloma",
  "Isla de Tarifa",
  "Punta Carnero",
  "Punta Europa",
  "Algeciras (bocana)",
  "Punta Almina",
  "Isla del Perejil",
  "Punta Cires",
  "Punta Alcázar",
  "Punta Malabata",
  "Tánger",
  "Cabo Espartel",
  "Ras El Aswad (Cabo Negro)",
];

const CLAVE = "nabigatu:faros:v1";
const EVENTO = "nabigatu-faros";

export function leerFaros(): Faro[] {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    if (!Array.isArray(datos)) return [];
    return datos.filter(
      (f): f is Faro =>
        f && typeof f.nombre === "string" && typeof f.lat === "number" && typeof f.lon === "number" && typeof f.id === "string",
    );
  } catch {
    return [];
  }
}

export function guardarFaros(faros: Faro[]): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(faros));
    window.dispatchEvent(new Event(EVENTO));
    return true;
  } catch {
    return false;
  }
}

export function suscribirFaros(cb: () => void): () => void {
  const h = () => cb();
  window.addEventListener(EVENTO, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVENTO, h);
    window.removeEventListener("storage", h);
  };
}

export function nuevoId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
