# Programación Práctica — Informe de publicación V1.0.0

**Versión:** `1.0.0`
**Objetivo de despliegue:** Cloudflare Pages · Next.js (Static HTML Export)
**Fecha:** 2026-09-23
**Rama de trabajo:** `release/v1.0.0-20260923-230047`
**Estado:** `PASS` (sin bloqueantes)

Este informe documenta la preparación de la release candidate validada de
**Programación Práctica v1.0.0** como artefacto estático apto para un repositorio
GitHub público y para Cloudflare Pages. No se ha creado ningún commit, tag,
push ni deploy: esa fase corresponde al orquestador exterior.

## 1. Contexto canónico

| Magnitud | Esperado | Verificado |
| --- | --- | --- |
| Unidades | 12 | 12 |
| Conceptos | 56 | 56 |
| Preguntas | 200 | 200 |
| Flashcards | 80 | 80 |

Recuentos comprobados por `npm run validate:content`, `npm run validate:bootstrap`
y `release/RC1_SOURCE_INVENTORY.json`. Python + PowerShell; estado/progreso en
`localStorage`; sin IA/LLM en runtime; sin backend ni API externa obligatoria.

## 2. Configuración de export estático

- `next.config.ts` activa `output: "export"`, por lo que `next build` genera el
  sitio completo en `out/`.
- No se activa `trailingSlash`: el export emite `out/<ruta>.html`
  (`out/estudiar.html`, `out/estudiar/b1/u01.html`, …) y Cloudflare Pages
  resuelve `/estudiar/b1/u01` a ese fichero.
- No hay Route Handlers, Server Actions, middleware, ISR ni rutas con
  `runtime: "nodejs"`. La única ruta dinámica (`/estudiar/b1/[unitId]`) usa
  `generateStaticParams` con `dynamicParams = false` y exporta las 12 unidades.

### 2.1 Adaptación de sesiones y resultados por query params

`await searchParams` fuerza render por petición y `output: "export"` lo rechaza
(`Route /tarjetas with dynamic = "error" couldn't be rendered statically`).
Para conservar `/tests`, `/tarjetas`, las sesiones y los resultados sin SSR:

- `lib/navigation/search-params.ts` expone `useClientSearchParams()`, un store
  externo (`useSyncExternalStore`) cuyo snapshot de servidor es vacío: el HTML
  exportado es determinista y el navegador re-renderiza con la query real tras
  la hidratación, sin desajustes de hidratación (mismo contrato que el tema).
- Las rutas de sesión y resultados son páginas cliente que reconstruyen la
  sesión desde `?sid=&seed=&mode=&size=&ids=` (y `?reverse=` en flashcards).
  El HTML exportado contiene siempre el estado controlado ("Sesión no válida" /
  "Falta el identificador de sesión") con un único `h1`.
- El contexto de práctica (`/tests?unit=u05`, `/tests?mode=errors`,
  `/tarjetas?mode=adaptive`) se deriva en render desde la query en
  `QuizSetup`/`FlashcardSetup`, sin efectos ni `setState` en efectos.
- `lib/content/client-bank.ts` publica el banco canónico (200 preguntas, 80
  tarjetas) al navegador reutilizando los mismos filtros y orden que los
  cargadores de build (`lib/content/bank.ts`), de modo que no hay lógica
  duplicada.

Ninguna función existente se ha perdido: sesiones, reanudación, resultados,
filtros y enlaces contextuales siguen operativos (verificado por E2E).

## 3. E2E contra el artefacto `out/`

- `playwright.config.ts` deja de usar `next start` y arranca
  `node scripts/serve-static-export.mjs`, que sirve `out/` como un host
  estático: `/<ruta>` → `<ruta>.html`, rutas desconocidas → `out/404.html` con
  HTTP 404, assets de `_next/static` cacheables y payloads RSC servidos a partir
  de los ficheros exportados.
- **25/25 tests pasan** (`npm run test:e2e`), incluyendo toda la cobertura
  previa (23 escenarios) más `e2e/static-export.spec.ts`, que comprueba de forma
  explícita `out/index.html`, `out/404.html`, las 12 unidades exportadas y el
  código HTTP de las rutas servidas.
- Cobertura mantenida: contrato de 23 rutas + 404 + enlaces internos;
  estudio/persistencia; 4 modos de tests; tamaños 10/20/30;
  feedback/resultados/errores/reanudación; flashcards y modo adaptativo;
  progreso; tema/reset; desktop 1440×900 y móvil 390×844; accesibilidad y
  jerarquía de títulos; ausencia de errores JS/hidratación.

### 3.1 Nota de entorno (payloads de segmento en Windows)

Next exporta un payload RSC por segmento (`__next.<a>.<b>.__PAGE__.txt`) porque
el router cliente los precarga. El nombre canónico se construye reemplazando
`/` por `.` (`convertSegmentPathToStaticExportFilename`); en un build POSIX
(Linux, y por tanto Cloudflare Pages) esos ficheros quedan planos en `out/` y
coinciden exactamente con las URLs solicitadas. En Windows el colector devuelve
separadores `\`, por lo que el mismo nombre se materializa anidado
(`__next.<a>/<b>/__PAGE__.txt`). El servidor de QA resuelve la ruta punteada
contra ese fichero anidado para reproducir fielmente el artefacto desplegado.
Sin esa resolución el sitio **sigue funcionando** (Next degrada al payload
completo `<ruta>.txt`), pero se registrarían 404 de precarga en consola.

## 4. Identidad final

- Nombre visible único: **Programación Práctica** (cabecera, pie, `metadata` y
  títulos de unidad).
- Eliminadas las referencias de desarrollo visibles al usuario:
  `components/layout/site-header.tsx` ya no muestra "nombre provisional" y el
  README ya no presenta el proyecto como provisional/Bloque 1 en curso.
- El diseño minimalista no se ha alterado (mismo CSS y estructura).

## 5. Versión

- `package.json` → `"version": "1.0.0"`.
- `package-lock.json` → `1.0.0` (raíz y entrada `""`, coherentes).
- `release/RC1_ACCEPTANCE.json` → `version: 1.0.0`, `target:
  cloudflare-pages-static`, `static_export: out`; `scripts/qa-validation-lib.mjs`
  y `tests/release-candidate.test.mjs` comparan ahora contra `package.json`
  como única fuente de verdad.
- No se ha creado ningún tag.

## 6. Repositorio público

- README reescrito: objetivo, funciones, stack, uso local, QA, progreso local,
  estructura y guía de Cloudflare Pages (preset **Next.js (Static HTML
  Export)**, `npx next build`, directorio `out`, sin variables de entorno).
- `qa/playwright-report.json` (artefacto generado con rutas absolutas de
  máquina) deja de estar versionado: el fichero se sigue generando en la misma
  ruta para QA, pero queda cubierto por `.gitignore` junto a la carpeta
  `qa/playwright-report/`.
- `scripts/PUBLISH_TO_GITHUB.ps1` ya no lleva una cuenta personal embebida:
  `-Owner` es un parámetro obligatorio.
- `AGENTS.md` / `CLAUDE.md` son ficheros que genera `next dev` (Next 16) con las
  reglas para agentes de este Next; se versionan tal y como recomienda el propio
  generador para que el árbol quede limpio tras ejecutar `npm run dev`. No
  contienen secretos ni datos de máquina y no afectan al sitio.
- No se añade licencia (no existía) y no se declaran afiliaciones.
- Se mantienen como historia explícita `PHASE*_STATUS.md`, `RELEASE_RC1.md`,
  `docs/RC1_AUTOMATED_QA_REPORT.md`, `release/RC1_BUILD_MANIFEST.json` y los
  scripts `START_HERE.cmd` / `scripts/INSTALL_AND_VALIDATE.ps1`; son ficheros
  versionados sin secretos ni datos de máquina, y no afectan al sitio.

## 7. Inventario de fuentes

`scripts/qa-source-inventory.mjs` se ha corregido: el conjunto de ficheros
proviene de git (`ls-files --cached --others --exclude-standard`), de modo que
**nunca** inventaría utilidades locales ignoradas (payloads `PHASE*`,
`out/`, `test-results/`, informes de Playwright, `.env*`, `*.tsbuildinfo`). Si
git no está disponible usa un escaneo de sistema de ficheros con las mismas
exclusiones. El inventario SHA-256 se regenera con
`node scripts/qa-source-inventory.mjs` y se verifica con
`node scripts/qa-source-inventory.mjs --verify` → **PASS** con **178 ficheros**
(el conjunto coincide exactamente con `git ls-files --cached --others
--exclude-standard`, incluidos los dos ficheros canónicos
`content/block-1/coverage/*.json`).

## 8. Gates ejecutados

| Gate | Comando | Resultado |
| --- | --- | --- |
| Suite completa | `npm run check` | **PASS** (validadores, lint, typecheck, 54/54 tests, build, export) |
| Contenido | `npm run audit:content` | **PASS** · 0 bloqueantes · 1 warning conocido · Python 13/14 · 145 opciones AST |
| Build estático | `npm run build` | **PASS** → `out/` (25 documentos exportados) |
| Export explícito | `npm run qa:static-export` | **PASS** · 24 rutas · 12 unidades |
| E2E | `npm run test:e2e` | **PASS** · 25/25 |
| Smoke HTTP | `npm run qa:http` | **PASS** · 16/16 rutas sobre `out/` |
| Superficie de export | `npm run qa:build-surface` | **PASS** (rutas y payloads del artefacto estático) |
| Dependencias | `npm audit --omit=dev` | **PASS** · 0 vulnerabilidades |
| Inventario | `node scripts/qa-source-inventory.mjs --verify` | **PASS** |

### 8.1 Artefacto estático

- `out/index.html` y `out/404.html` presentes y con `h1`.
- 12 rutas de unidad exportadas: `out/estudiar/b1/u01.html` … `u12.html`.
- Rutas de aplicación: `/`, `/estudiar`, `/estudiar/b1`, `/tests`,
  `/tests/sesion`, `/tests/resultados`, `/tarjetas`, `/tarjetas/sesion`,
  `/tarjetas/resultados`, `/progreso`, `/ajustes`.
- Assets versionados en `out/_next/static` y payloads RSC junto a cada ruta.

## 9. Comprobaciones de seguridad y dependencias

- **Sin IA/LLM en runtime:** `app/`, `components/` y `lib/` no contienen
  proveedores de IA ni llamadas de red (`fetch`, `axios`, `XMLHttpRequest`,
  `WebSocket`, URLs externas). El único uso de la palabra es el patrón del
  validador `scripts/qa-validation-lib.mjs`.
- **Sin secretos versionados:** escaneo de patrones `sk-…`, `AKIA…`, `ghp_…`,
  `AIza…`, `Bearer …`, `PRIVATE KEY`, `api_key`/`secret_key` → 0 hallazgos.
- **Sin API externa obligatoria ni backend:** la app solo usa `localStorage`.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## 10. Advertencias y notas

1. **Contenido (aceptada, no bloqueante):** el auditor informa de 1 warning,
   `B1-Q0028` ("2 options are syntactically valid; the item relies on
   semantics"). Es un distractor clásico y válido, se mantiene igual que en RC1;
   no se toca contenido canónico (invalidaría `integrity.json` y las matrices).
2. **Historia del proyecto:** ver §6. Los ficheros de fases y de RC1 se
   conservan como trazabilidad y están marcados como históricos desde
   `RELEASE_RC1.md`.
3. **Payloads de segmento en Windows:** ver §3.1. No requiere acción en
   Cloudflare (build Linux) y no afecta a la funcionalidad del sitio.

## 11. Cierre

Se ha revisado `git diff` completo, se han ejecutado todos los gates y se ha
regenerado el inventario de fuentes. **No se ha ejecutado commit, tag, push ni
deploy.** El repositorio queda listo para que el orquestador exterior publique
v1.0.0 como sitio estático en Cloudflare Pages.
