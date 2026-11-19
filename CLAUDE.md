# Nabigatu: guía para Claude

Calculadora de navegación para las titulaciones náuticas de recreo españolas (licencia de navegación o «titulín», Patrón para Navegación Básica, PER, Patrón de Yate y Capitán de Yate, RD 875/2014). Cada cálculo da el resultado y el **desarrollo paso a paso**, como se resuelve en el examen. Detalle de módulos y validaciones en `README.md`.

## Cómo trabajar con el propietario

- Responde y escribe siempre en **español** (código, comentarios, mensajes de la interfaz y commits incluidos), con explicaciones detalladas, no listas superficiales.
- **Antes de editar código:** explica qué vas a cambiar y por qué, lista todos los archivos afectados y espera su confirmación explícita.
- **Después de editar código:** ejecuta `npx tsc --noEmit` y `npm test` y da el resultado antes de seguir.
- Cierra cada tarea con un resumen: qué se hizo, qué archivos se tocaron, resultado de las pruebas y pendientes.
- Trabaja desde un móvil a menudo: respuestas que se lean bien en pantalla pequeña.

## Pila y comandos

- Next.js 16 (App Router, Turbopack), React 19, TypeScript estricto, Tailwind CSS 4, Vitest 5. Sin backend ni base de datos: todo se calcula en el navegador.
- `npm run dev` · `npm run build` · `npm run typecheck` (`tsc --noEmit`) · `npm test` (`vitest run`).
- Alias de importación: `@/` es la raíz del repo.
- Despliegue: Vercel publica automáticamente cada push a `main`. Para cambios, rama + PR y fusionar cuando el propietario lo pida.
- En un contenedor Linux recién clonado, `next build` puede fallar con «Cannot find module '../lightningcss.linux-x64-gnu.node'»: instala el binario sin tocar el lockfile (`npm i --no-save lightningcss-linux-x64-gnu@<versión de lightningcss>`) y borra `.next`. No es un fallo del código.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `lib/nucleo/` | Común: ángulos, coordenadas, vectores, unidades |
| `lib/ln/`, `lib/per/`, `lib/py/`, `lib/cy/` | Cálculos de cada titulación (funciones puras, con sus `*.test.ts`); `ln` es la licencia de navegación y las motos de agua |
| `lib/pnb/` | Patrón para Navegación Básica: atribuciones con su artículo y el banco de preguntas de las UT1–UT6 comunes al PNB y al PER (`preguntas.ts`) |
| `lib/teoria/` | Tests de teoría de todas las titulaciones: estructura oficial de cada examen (`examenes.ts`, anexo II), motor de examen de prueba, práctica y repaso (`motor.ts`), «Mis fallos» (`fallos.ts`, en `localStorage`; sale tras 2 aciertos seguidos), bancos (`banco.ts` los reúne; `meteorologia.ts`, `seguridad-py.ts`, `navegacion.ts`, `maniobra-emergencias.ts`), escalas Beaufort y Douglas (`escalas.ts`) y datos de las chuletas de balizamiento y luces del RIPA (`chuletas.ts`, dibujadas en `components/teoria/Chuletas.tsx`). En cada pregunta la primera opción es la correcta |
| `lib/examen/generador.ts` | Ejercicios tipo test con distractores basados en errores típicos |
| `lib/modulos.ts` | Catálogo de módulos por titulación; un nivel incluye los inferiores |
| `lib/cy/efemerides.ts`, `catalogo-estrellas.ts`, `almanaque.ts` | Almanaque calculado (VSOP87, Aries, 108 estrellas, página del día, fenómenos, incrementos) |
| `lib/faros.ts` | «Mis faros», guardados en `localStorage` |
| `components/App.tsx` | Navegación; el mapa `COMPONENTES` asocia cada id de módulo a su formulario |
| `components/ln/`, `pnb/`, `teoria/`, `per/`, `py/`, `cy/`, `examen/` | Formularios de cada módulo |
| `components/campos.tsx`, `calculo.ts` | Campos reutilizables y el patrón de cálculo de los formularios |

## Convenciones

- **Signos:** Este y Norte positivos; Oeste y Sur negativos. hL = hG + λ. Abatimiento positivo con viento por babor. Rc es el rumbo *hacia* el que va la corriente.
- **Ángulos** en grados decimales dentro de `lib/`; se muestran con los formateadores existentes (`formatoRumbo`, `formatoLatitud`, `formatoLongitud`, `formatoHorario`, `formatoDeclinacion`, `formatoNumero`…), con **coma decimal** y minutos a la décima. No inventes formatos nuevos si ya existe uno.
- **Errores de entrada:** lanza `EntradaInvalida` (de `lib/nucleo/angulos.ts`) con un mensaje claro en español.
- **Formularios:** el cálculo va dentro de `intentar(() => …)`; `req()` para datos obligatorios (si faltan, el resultado queda en espera) y `opt()` para opcionales. Devuelve `{ resultados, pasos }`; los `pasos` son el desarrollo que ve el usuario.
- **Nuevo módulo:** función pura y tests en `lib/<nivel>/`, entrada en `MODULOS` de `lib/modulos.ts`, formulario en `components/<nivel>/` y registro en `COMPONENTES` de `components/App.tsx`.
- La interfaz es para móvil primero: comprueba que las tablas anchas tengan desplazamiento horizontal.

## Pruebas y rigor

- Los cálculos se validan con **ejercicios de exámenes oficiales** (Junta de Andalucía, Euskadi…) y, en astronomía, con el Almanaque Náutico 2026 y la hoja 2027 de nauticalalmanac.it. Cuando añadas o cambies un cálculo, añade un test con un caso real y su fuente en el nombre del test.
- No relajes la tolerancia de un test para que pase: si un valor oficial no cuadra, investiga.
- La astronomía con almanaque es del **Capitán de Yate**; el Patrón de Yate se queda en mareas, estima, loxodrómica, situación y horas.
- **Nuevo banco de preguntas:** añade su `Tema` en `lib/teoria/tipos.ts`, el archivo del banco en `lib/teoria/`, inclúyelo en `banco.ts` y pon el tema en la unidad que corresponda de `examenes.ts`. Cada unidad necesita al menos el doble de preguntas que el examen (lo comprueba un test).
- Las preguntas de teoría son de práctica, redactadas para Nabigatu: no copies preguntas de exámenes oficiales ni de academias. Cada una lleva su explicación, y las de legislación deben poder comprobarse en el BOE.
- Las normas de la licencia de navegación y de las motos de agua (`lib/ln/moto.ts`) citan su artículo del BOE (RD 875/2014 y RD 259/2002) y la fecha de revisión en `NORMAS_REVISADAS`: si cambias una norma, compruébala en el texto consolidado y actualiza esa fecha.

## Límites

- El Almanaque Náutico de nauticalalmanac.it **prohíbe su redistribución**: no copies sus tablas a la app ni al repo. Solo se admiten unos pocos valores de referencia dentro de los tests.
- La app no trae coordenadas de faros de serie (cada edición de la carta difiere); las mete el usuario.
- Mantén el aviso: Nabigatu es una herramienta de estudio y no sustituye a la carta, los instrumentos ni el Almanaque oficial en el examen.
