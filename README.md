# Programación Práctica

Plataforma de aprendizaje local para aprender a leer, entender y modificar
código con Python y PowerShell. Todo el contenido está validado en el
repositorio y la aplicación no necesita backend: se publica como sitio
estático.

## Objetivo

Construir una base práctica de programación con estudio guiado, práctica
objetiva y recuperación activa, midiendo el dominio **por concepto** y no por
mera exposición.

## Funciones

- **Estudiar**: Bloque 1 con 12 unidades canónicas y 56 conceptos.
- **Tests**: 200 preguntas validadas con 4 modos (bloque, unidad, repaso de
  errores y adaptativo) y sesiones de 10, 20 o 30 preguntas.
- **Tarjetas**: 80 flashcards con repetición adaptativa y tres valoraciones
  (no la sabía / dudé / la sabía).
- **Progreso**: dominio unificado por concepto a partir de estudio, tests y
  tarjetas.
- **Ajustes**: tema claro, oscuro o sistema y borrado controlado de los datos
  locales.
- **Sesiones reproducibles**: cada sesión guarda identificador y semilla; los
  parámetros viajan en la URL, por lo que una sesión puede reanudarse o
  compartirse como enlace.

## Stack

- Next.js 16 (App Router) con **Static HTML Export** (`output: "export"`).
- React 19 + TypeScript.
- Tailwind CSS 4.
- Playwright para los escenarios end-to-end.
- Node.js >= 22.13.

Sin base de datos, sin API externa obligatoria, sin SSR en producción y sin
IA/LLM en tiempo de ejecución.

## Uso local

```bash
npm install
npm run dev          # servidor de desarrollo en http://localhost:3000
npm run build        # genera el sitio estático en out/
```

Para revisar el artefacto real de producción, sirve `out/` con el servidor
estático incluido:

```bash
npm run build
npm start            # http://127.0.0.1:4310 (equivale a node scripts/serve-static-export.mjs)
```

`next start` no se usa: no es compatible con `output: "export"`, que es
precisamente el objetivo de despliegue.

## QA

```bash
npm run check                 # validadores + lint + typecheck + tests + build + export
npm run audit:content         # auditoría de contenido -> qa/RC1_CONTENT_AUDIT.json
npm run build                 # next build (Static HTML Export -> out/)
npm run test:e2e              # Playwright contra out/ servido estáticamente
npm run test:e2e:install      # instala Chromium para Playwright
npm run qa:http               # smoke HTTP de 16 rutas sobre out/
npm audit --omit=dev          # dependencias de producción
node scripts/qa-source-inventory.mjs --verify   # inventario SHA-256 del código fuente
```

Recuentos canónicos verificados por los validadores: **12 unidades, 56
conceptos, 200 preguntas y 80 flashcards**.

## Publicación en Cloudflare Pages

Este repositorio se publica como **Next.js (Static HTML Export)**. No usa
Pages Functions, Workers, SSR ni backend.

| Ajuste | Valor |
| --- | --- |
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npx next build` |
| Build output directory | `out` |
| Variables de entorno | ninguna |
| Root directory | raíz del repositorio |

`next build` genera `out/` con `/`, `/estudiar`, `/estudiar/b1`,
`/estudiar/b1/u01` … `/u12`, `/tests`, `/tarjetas`, `/progreso`, `/ajustes` y un
`404.html` propio. Las sesiones y los resultados de tests y tarjetas se
reconstruyen desde los parámetros de la URL en el navegador, por lo que
conservan su comportamiento en un sitio completamente estático.

## Progreso local

El progreso vive **solo en el navegador** (`localStorage`) y permanece en tres
espacios versionados e independientes:

- `pp-study-progress-v1` — estado de estudio por unidad.
- `pp-quiz-history-v1` — sesiones, respuestas y estadísticas de tests.
- `pp-flashcard-history-v1` — sesiones, valoraciones y cola de repaso.

La preferencia visual `pp-theme` es independiente y no se borra al reiniciar
el progreso educativo. No hay cuentas, sincronización entre dispositivos ni
envío de datos a servicios externos; borrar los datos del navegador elimina el
progreso local.

## Estructura

```text
app/          rutas (App Router) del sitio
components/   UI de estudio, tests, tarjetas, progreso y ajustes
content/      contenido canónico del Bloque 1 (unidades, conceptos, preguntas, tarjetas)
lib/          motores, almacenamiento local, carga de contenido y helpers
scripts/      validadores, auditorías, inventario y servidor estático de QA
e2e/          escenarios Playwright
schemas/      JSON Schemas del contenido y del progreso
docs/         informes de QA y publicación
```

## Licencia

Este repositorio no declara licencia.
