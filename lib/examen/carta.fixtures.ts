import type { FaroCarta } from "./carta";

const gm = (g: number, m: number) => g + m / 60;

// Situaciones aproximadas de faros del Estrecho (datos públicos), solo para las pruebas.
// En la app el alumno usa las que mide en su propia carta.
export const FAROS_PRUEBA: FaroCarta[] = [
  { nombre: "Cabo Trafalgar", lat: gm(36, 11.0), lon: -gm(6, 2.0) },
  { nombre: "Barbate", lat: gm(36, 11.2), lon: -gm(5, 55.6) },
  { nombre: "Punta de Gracia", lat: gm(36, 5.4), lon: -gm(5, 48.5) },
  { nombre: "Punta Paloma", lat: gm(36, 3.9), lon: -gm(5, 43.2) },
  { nombre: "Isla de Tarifa", lat: gm(36, 0.1), lon: -gm(5, 36.5) },
  { nombre: "Punta Carnero", lat: gm(36, 4.6), lon: -gm(5, 25.6) },
  { nombre: "Punta Europa", lat: gm(36, 6.6), lon: -gm(5, 20.7) },
  { nombre: "Punta Almina", lat: gm(35, 54.0), lon: -gm(5, 16.8) },
  { nombre: "Punta Cires", lat: gm(35, 54.8), lon: -gm(5, 29.0) },
  { nombre: "Punta Malabata", lat: gm(35, 49.0), lon: -gm(5, 45.0) },
  { nombre: "Cabo Espartel", lat: gm(35, 47.5), lon: -gm(5, 55.5) },
];
