# Nabigatu

**Nabigatu** («navegar» en euskera) es una calculadora de navegación para las titulaciones náuticas de recreo españolas: PER, Patrón de Yate y Capitán de Yate. Cada cálculo da el resultado al momento y el **desarrollo paso a paso**, como se resuelve en el examen.

> **Aviso:** es una herramienta de apoyo y de estudio. No sustituye a la carta náutica, a los instrumentos de a bordo ni al criterio del patrón.

## Fase 1: PER (disponible)

| Módulo | Qué calcula |
|--------|-------------|
| Rumbo a dar al timonel | Problema completo: Ref → (corriente) Rs → (viento) Rv → (Ct) Ra |
| Corrección total | Ct = dm + Δ |
| Rumbos y demoras | Rv = Ra + Ct, Ra = Rv − Ct (y lo mismo con demoras) |
| Ct por enfilación o demora | Ct = Dv − Da, y desvío Δ = Ct − dm |
| Declinación magnética | Actualiza la dm de la carta al año actual |
| Distancia, velocidad y tiempo | D = V × t, con hora estimada de llegada |
| Viento | Rs = Rv + Ab |
| Corriente | Rumbo y velocidad efectivos, rumbo para compensarla y corriente desconocida |
| Conversiones | Grados y minutos ↔ decimales, cuadrantal ↔ circular, millas, cables, km, nudos |

**Criterio de signos:** Este positivo, Oeste negativo. Abatimiento positivo con viento por babor y negativo por estribor. Rc es el rumbo **hacia** el que va la corriente.

## Fase 2: Patrón de Yate (disponible)

| Módulo | Qué calcula |
|--------|-------------|
| Mareas | Sonda a una hora oficial y hora para una sonda, por el método del coseno, con adelanto horario |
| Situación por estima | Uno o varios rumbos, con rumbos de aguja, abatimiento y corriente (latitud media) |
| Loxodrómica | Rumbo directo y distancia entre dos posiciones, también cruzando el meridiano de 180° |
| Situación por demoras | Dos demoras simultáneas, no simultáneas (traslado), demora y distancia, y rumbo para pasar a X millas |
| Llegar a una hora | Rumbo de aguja y velocidad para estar en un punto a una hora fijada con corriente |

Los métodos de mareas y loxodrómica se han contrastado con un examen oficial de Patrón de Yate (3.ª convocatoria de 2020, Junta de Andalucía): los tests reproducen las respuestas correctas de esos ejercicios.

## Modo examen

Ejercicios tipo test generados al azar, con cuatro opciones, para el PER, el Patrón de Yate y el Capitán de Yate (en astronomía, el enunciado incluye los datos del Almanaque). Las opciones incorrectas corresponden a los errores típicos (signo de la Ct, olvidar el adelanto, regla de los doceavos, no aplicar cos lm…) y cada una explica su error. Los ejercicios que necesitan la carta del Estrecho no se generan.

## Fase 3: Capitán de Yate (disponible)

| Módulo | Qué calcula |
|--------|-------------|
| Ortodrómica | Rumbo inicial, distancia, rumbo final, vértice y puntos intermedios |
| Horas y fechas | HcG, HcL, hora de zona y hora oficial, con cambio de fecha |
| Horario del astro | hG, hL y declinación del Sol o de una estrella interpolando los datos del Almanaque Náutico |
| Corrección de alturas | De la altura instrumental a la verdadera (índice, depresión, refracción, paralaje y semidiámetro) |
| Meridiana | Latitud por la altura meridiana y hora del paso por el meridiano |
| Latitud por la Polar | Resolviendo el triángulo de posición |
| Recta de altura | Altura estimada, azimut, Δa, punto determinante y situación por dos rectas |

Los datos del Almanaque Náutico (hG, declinación, ángulo sidéreo, semidiámetro, Pmg) los introduce el usuario, igual que en el examen.

Comprobaciones con exámenes oficiales: diez ejercicios de ortodrómica (Junta de Andalucía 2019–2024, Euskadi 2024 y otro de 2021) y una meridiana del Sol (Euskadi, noviembre de 2024) dan exactamente la opción correcta. Están incluidos como tests.

## Almanaque calculado

Calcula el horario en Greenwich y la declinación del Sol (con su semidiámetro), del punto Aries y de 108 estrellas de navegación para cualquier instante UT, y con una situación de estima da el azimut y la altura estimada. Sirve para practicar sin el Almanaque Náutico; en el examen hay que usar el Almanaque.

- Sol: teoría VSOP87 recortada (195 términos) con FK5, nutación y aberración.
- Punto Aries: tiempo sidéreo aparente de Greenwich.
- Estrellas: posiciones J2000 de Hipparcos (catálogo de PyEphem) con movimiento propio, precesión, nutación y aberración.

Contrastado con astropy (error máximo de 0,07′ en el horario del Sol entre 2019 y 2030) y con ocho ejercicios de estrellas de exámenes oficiales de Capitán de Yate (Algol, Denebola, Fomalhaut, Rigel, Mintaka, Vindemiatrix, Alnitak y Acamar): en todos, el resultado es una de las opciones del examen, siete de ellos a la décima de minuto exacta. Están incluidos como tests.

## Mis faros

Lista de faros con la situación medida por el usuario en su propia carta, guardada en el navegador. Cualquier campo de posición permite elegirlos con un toque. La app no trae coordenadas de serie: cada edición de la carta del examen puede diferir alguna décima de minuto.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `lib/nucleo/` | Común a todos los niveles: ángulos, vectores, unidades y tiempo |
| `lib/per/` | Cálculos del PER |
| `lib/py/` | Cálculos del Patrón de Yate |
| `lib/cy/` | Cálculos del Capitán de Yate |
| `lib/examen/` | Generador de ejercicios tipo test |
| `lib/modulos.ts` | Catálogo de módulos por titulación |
| `lib/cy/efemerides.ts`, `lib/cy/catalogo-estrellas.ts` | Almanaque calculado |
| `lib/faros.ts`, `components/MisFaros.tsx` | Mis faros |
| `components/per/`, `components/py/`, `components/cy/` | Formularios de cada módulo |
| `components/examen/` | Modo examen |
| `components/campos.tsx` | Campos, selectores y presentación de resultados |
| `lib/**/*.test.ts` | Tests con ejercicios tipo examen |

Para añadir un nivel se crea `lib/<nivel>/` con sus cálculos y tests, se añaden sus formularios y se registran en `lib/modulos.ts`.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm test           # Vitest
npm run build
```

Despliegue: importa el repositorio en Vercel. No necesita variables de entorno.
