# Nabigatu

**Nabigatu** («navegar» en euskera) es una calculadora de navegación para las titulaciones náuticas de recreo españolas. Cada cálculo da el resultado al momento y el **desarrollo paso a paso**, como se resuelve en el examen.

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

Ejercicios tipo test generados al azar, con cuatro opciones, para el PER y el Patrón de Yate. Las opciones incorrectas corresponden a los errores típicos (signo de la Ct, olvidar el adelanto, regla de los doceavos, no aplicar cos lm…) y cada una explica su error. Los ejercicios que necesitan la carta del Estrecho no se generan.

## Próximas fases

- **Capitán de Yate:** ortodrómica, recta de altura y meridiana.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `lib/nucleo/` | Común a todos los niveles: ángulos, vectores, unidades y tiempo |
| `lib/per/` | Cálculos del PER |
| `lib/py/` | Cálculos del Patrón de Yate |
| `lib/examen/` | Generador de ejercicios tipo test |
| `lib/modulos.ts` | Catálogo de módulos por titulación |
| `components/per/`, `components/py/` | Formularios de cada módulo |
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
