/**
 * Actualización de la declinación magnética de la carta al año en curso.
 *
 * En la rosa de la carta aparece, por ejemplo: «4°15′W 2005 (7′E)»
 *   dm del año de la carta = 4°15′ W
 *   variación anual        = 7′ hacia el E (la dm se mueve 7′ al Este cada año)
 *
 *   dm actual = dm carta + variación anual × (año actual − año carta)
 */
import { EntradaInvalida, formatoEW, formatoSigno, redondearGrados } from "../nucleo/angulos";
import type { Resultado } from "./correccion";

export function actualizarDeclinacion(
  dmCarta: number,
  anioCarta: number,
  variacionAnualMin: number,
  anioActual: number,
): Resultado & { dm: number; cambio: number } {
  if (!Number.isInteger(anioCarta) || !Number.isInteger(anioActual)) {
    throw new EntradaInvalida("Los años deben ser números enteros");
  }
  const anios = anioActual - anioCarta;
  if (anios < 0) throw new EntradaInvalida("El año actual no puede ser anterior al de la carta");

  const cambioMin = variacionAnualMin * anios;
  const cambio = cambioMin / 60;
  const dm = redondearGrados(dmCarta + cambio);
  const varTexto = `${Math.abs(variacionAnualMin).toString().replace(".", ",")}′ ${variacionAnualMin >= 0 ? "E" : "W"}`;

  return {
    dm,
    cambio,
    pasos: [
      `Años transcurridos = ${anioActual} − ${anioCarta} = ${anios}`,
      `Cambio = ${anios} × ${varTexto} = ${Math.abs(cambioMin).toString().replace(".", ",")}′ → ${formatoEW(cambio)}`,
      `dm ${anioActual} = (${formatoSigno(dmCarta)}) + (${formatoSigno(cambio)})`,
      `dm ${anioActual} = ${formatoSigno(dm)} → ${formatoEW(dm)}`,
    ],
  };
}
