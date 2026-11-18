/**
 * Patrón para Navegación Básica (PNB): atribuciones, requisitos y examen.
 *
 * Fuente: Real Decreto 875/2014, texto consolidado del BOE (última actualización
 * publicada el 30/12/2025): arts. 8.d, 9.d, 11.1, 13, 15 y 18 y anexo II (2.B).
 */
import type { Norma } from "../ln/moto";

const RD875 = "https://www.boe.es/eli/es/rd/2014/10/10/875/con";

/** Fecha en que se revisó esta ficha contra el BOE. */
export const PNB_REVISADO = "18/11/2026";

export const ATRIBUCIONES_PNB: Norma[] = [
  {
    titulo: "Barcos a motor de hasta 8 metros",
    texto: "Puedes gobernar embarcaciones de recreo a motor de hasta 8 metros de eslora, sin alejarte más de 5 millas en cualquier dirección de un puerto, marina o lugar de abrigo.",
    fuente: "Real Decreto 875/2014, art. 8.d",
    url: RD875,
  },
  {
    titulo: "Motos de agua",
    texto: "También habilita para gobernar motos náuticas, dentro de los límites de navegación que les correspondan.",
    fuente: "Real Decreto 875/2014, art. 8.d",
    url: RD875,
  },
  {
    titulo: "Vela, con las prácticas complementarias",
    texto: "Si haces además las prácticas de vela, puedes gobernar embarcaciones de recreo a vela de hasta 8 metros, con el mismo límite de 5 millas.",
    fuente: "Real Decreto 875/2014, art. 9.d",
    url: RD875,
  },
  {
    titulo: "Frente a la licencia de navegación",
    texto: "La licencia de navegación («titulín») se queda en navegaciones diurnas a no más de 2 millas. El PNB amplía el alejamiento a 5 millas y la eslora a 8 metros.",
    fuente: "Real Decreto 875/2014, arts. 8.d y 11.1",
    url: RD875,
  },
  {
    titulo: "Edad",
    texto: "18 años cumplidos el día de las pruebas. Desde los 16, con el consentimiento por escrito de padres o tutores.",
    fuente: "Real Decreto 875/2014, art. 13",
    url: RD875,
  },
  {
    titulo: "Examen teórico",
    texto: "27 preguntas tipo test con cuatro respuestas y 45 minutos. Apruebas con 17 aciertos (10 fallos como máximo), y además no puedes fallar más de 2 de balizamiento ni más de 5 del reglamento de abordajes.",
    fuente: "Real Decreto 875/2014, anexo II, 2.B",
    url: RD875,
  },
  {
    titulo: "Prácticas y radio",
    texto: "Son obligatorias las prácticas básicas de seguridad y navegación y el curso de radiocomunicaciones. Si ya tienes el de radiooperador de corto alcance, no repites el de radio.",
    fuente: "Real Decreto 875/2014, arts. 15 y 18",
    url: RD875,
  },
];
