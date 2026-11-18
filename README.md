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

## Próximas fases

- **Patrón de Yate:** situación por estima, loxodrómica y mareas.
- **Capitán de Yate:** ortodrómica, recta de altura y meridiana.
- **Modo estudio:** ejercicios tipo examen con la solución.

El selector «Mi titulación» muestra los módulos del nivel elegido y de los inferiores.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `lib/nucleo/` | Común a todos los niveles: ángulos, vectores, unidades y tiempo |
| `lib/per/` | Cálculos del PER |
| `lib/modulos.ts` | Catálogo de módulos por titulación |
| `components/per/` | Formularios de cada módulo |
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
