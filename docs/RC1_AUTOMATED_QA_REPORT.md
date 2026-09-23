# RC1 — Informe de QA automatizada y release gate

**Proyecto:** `programacion-practica` (Bloque 1 V1)
**Versión auditada:** `0.1.0-rc.1` (no promovida a estable)
**Fecha/hora de cierre:** 2026-09-23 22:33 (Europe/Madrid)
**Commit base:** `d0b146da898d170441869072d73aff450cd995d2` (tree `7650a3fd7b26fe87aa10d5f30af21b5af294cc6a`)
**Rama de trabajo:** `qa/rc1-ai-release-20260923-214621`
**Entorno:** Node v24.13.0 · npm 11.6.2 · Next.js 16.3.5 · Playwright 1.56.1 (chromium headless) · Windows 11 / PowerShell 7.6.5 · Python 3.11.9 (solo herramienta de QA)

# 1. Veredicto

**PASS** — La RC puede pasar a revisión de publicación sin auditoría manual unidad por unidad.

- Los gates existentes pasan completos (`npm run check`).
- El build de producción pasa y es reproducible (misma superficie en dos builds).
- La suite E2E real (23 escenarios de navegador) pasa: 23/23.
- No quedan defectos funcionales P0/P1 reproducibles en el changeset.
- No quedan errores de contenido de alta confianza (0 blockers, 1 warning documentado).
- Recuentos canónicos intactos: **12 unidades / 56 conceptos / 200 preguntas / 80 flashcards**.
- Sin dependencia de IA/LLM en runtime y sin secretos en ficheros versionados ni en el bundle.

Detalle de las cuatro advertencias no bloqueantes en la sección 7. El único punto que depende del orquestador es incluir en el commit los dos ficheros de coverage (ya preparados en el índice) y regenerar el inventario de fuentes (sección 9).

# 2. Alcance y límites de esta ejecución

- Auditoría completa del Bloque 1 (no por muestreo).
- Correcciones automáticas, mínimas y explicables.
- **No** se ha desplegado, publicado, hecho `git push`, creado repos remotos, ni tocado DNS/dominios.
- **No** se ha ejecutado `git commit` (los cambios quedan en el índice de git; ver sección 9).
- **No** se ha cambiado la versión del candidato ni el contenido educativo por preferencia.
- Sin uso de TinyFish, sin dependencias de IA en runtime, sin exponer ni escribir API keys.
- Independencia total respecto a otros proyectos y utilidades externas: `validate:bootstrap` comprueba que ninguna referencia a proyectos ajenos aparece en el árbol (guard de independencia en PASS).

# 3. Inventario inspeccionado

| Área | Contenido |
| --- | --- |
| Scripts de calidad existentes | `validate:bootstrap`, `validate:content`, `validate:study`, `validate:quiz`, `validate:flashcards`, `validate:progress`, `validate:ux`, `validate:qa`, `lint`, `typecheck`, `test`, `build`, `qa:http`, `qa:build-surface` |
| Rutas de la app | 23 rutas reales: `/`, `/estudiar`, `/estudiar/b1`, `/estudiar/b1/u01…u12` (12), `/tests`, `/tests/sesion`, `/tests/resultados`, `/tarjetas`, `/tarjetas/sesion`, `/tarjetas/resultados`, `/progreso`, `/ajustes` + 404 controlado (`_not-found`) y `error.tsx` |
| Contenido canónico | `content/block-1/manifest.json`, `canonical/units.json` + 12 `uNN.md`, `concepts/concepts.json`, `questions/u01…u12.json`, `flashcards/u01…u12.json`, `coverage/test-matrix.json`, `coverage/flashcard-matrix.json`, `integrity.json` |
| Tests existentes | 54 tests `node:test` (`tests/*.test.mjs`), 0 saltados |
| Tooling de RC | `scripts/qa-http-smoke.mjs` (16 rutas), `scripts/qa-build-surface.mjs`, `scripts/qa-source-inventory.mjs`, `release/RC1_ACCEPTANCE.json`, `release/RC1_BUILD_MANIFEST.json`, `START_RC1_ACCEPTANCE*.ps1` |

# 4. Gates ejecutados (resultado final)

| Gate | Comando | Resultado |
| --- | --- | --- |
| Bootstrap / independencia / manifiesto | `npm run validate:bootstrap` | **PASS** (`REQUIRED_FILES=23`, `INDEPENDENCE_GUARD=PASS`) |
| Contenido canónico | `npm run validate:content` | **PASS** (12/12, 56/56, 200/200, 80/80, `CONTENT_INTEGRITY=PASS`) |
| Estudio | `npm run validate:study` | **PASS** (12/12 rutas de unidad) |
| Quiz | `npm run validate:quiz` | **PASS** (4/4 modos, 10/20/30, feedback, repaso de errores, adaptativo, historial) |
| Flashcards | `npm run validate:flashcards` | **PASS** (80/80, filtros, valoraciones MISS/DOUBT/KNOW, repetición adaptativa) |
| Progreso | `npm run validate:progress` | **PASS** (56/56 conceptos, estados, unificación estudio+quiz+tarjetas) |
| UX / accesibilidad | `npm run validate:ux` | **PASS** (responsive, foco, skip link, tema, estados vacíos) |
| QA de release | `npm run validate:qa` | **PASS** (`RUNTIME_AI=ABSENT`, 3 namespaces de persistencia, reanudación, 404/error) |
| Lint | `npm run lint` | **PASS** (0 errores) |
| Typecheck | `npm run typecheck` | **PASS** (0 errores) |
| Tests de regresión | `npm test` | **PASS** 54/54, 0 fail, 0 skipped |
| Build de producción | `npm run build` | **PASS** (25 páginas, 15 rutas de app + `_not-found`) |
| Smoke HTTP | `npm run qa:http` | **PASS** `HTTP_ROUTES=16/16` |
| Auditoría de contenido independiente | `npm run audit:content` | **PASS** 0 blockers / 1 warning |
| E2E navegador real | `npm run test:e2e` | **PASS** 23/23 (~54 s, 0 flaky, 0 skipped) |
| Reproducibilidad de builds | `npm run build` ×2 + `node scripts/qa-build-surface.mjs` | **PASS** superficie idéntica `13beb833…c948` (= `release/RC1_BUILD_MANIFEST.json`) |
| Dependencias de producción | `npm audit --omit=dev` | **PASS** 0 vulnerabilidades |
| Dependencias (incl. dev) | `npm audit` | **PASS** 0 vulnerabilidades |
| Secreto en ficheros versionados | escaneo de 167 ficheros con patrones `sk-…`, `api_key=`, `secret=`, `Bearer …`, `AKIA…`, `ghp_…` y tokens de proveedores de IA | **PASS** 0 hallazgos |
| Secretos/IA en bundle | escaneo de `.next/static` | **PASS** 0 hallazgos |

Verificación de higiene previa (línea base, antes de corregir nada): `lint`, `typecheck`, `validate:*`, `npm test` (54/54) y `build` ya pasaban. Ningún gate se ha relajado, silenciado ni saltado; no se ha reducido cobertura.

# 5. Auditoría integral del contenido

Se añadió `scripts/rc1-content-audit.mjs` (`npm run audit:content`), que reutiliza el cargador canónico pero aplica comprobaciones semánticas que el validador estructural no cubre. Resultado: **0 blockers, 1 warning**.

Comprobado sobre las 200 preguntas y las 80 flashcards:

| Comprobación | Resultado |
| --- | --- |
| 12 unidades, 56 conceptos, 200 preguntas, 80 flashcards | OK |
| IDs únicos y contiguos; referencias unidad/concepto válidas | OK |
| 4 opciones por pregunta, IDs de opción válidos, texto de opción único | OK |
| Exactamente una `correctOptionId` presente y válida por pregunta | OK |
| Coherencia `unitId` ↔ `primaryConceptId` ↔ fichero canónico ↔ objetivo ↔ orden | OK |
| Enunciado + explicación no vacíos; explicación no repite literalmente un distractor | OK |
| Duplicados exactos de enunciado | 0 |
| Duplicados casi idénticos de enunciado (Jaccard ≥ 0,85 con números preservados) | 0 |
| Opciones funcionalmente idénticas en la misma pregunta | 0 (145 opciones Python normalizadas a AST) |
| Opciones duplicadas ignorando espacios (solo prosa; en código la indentación es significativa) | 0 |
| Opciones absurdas/placeholder ("todas las anteriores", "n/a", "lorem", "xxx") | 0 |
| Preguntas "¿cuál está correctamente escrito/estructurado?" con las 4 opciones en bloque de código: exactamente una opción válida y marcada como correcta | Gate estricto **3/3** (`B1-Q0035`, `B1-Q0101`, `B1-Q0128`) |
| Resto de preguntas con las 4 opciones en bloque de código (revisión informativa, `evidence.syntaxReviewed`) | 4/4 revisadas: `B1-Q0033`, `B1-Q0105`, `B1-Q0129` tienen una sola opción parseable (la correcta); `B1-Q0153` tiene dos sintácticamente válidas y su criterio es semántico (presencia de `return`), revisado sin cambios |
| Código de la opción correcta parsea (Python/PowerShell) | OK |
| **Ejecución real de Python** de preguntas "¿qué se mostrará/produce/devuelve?" | 13/14 verificadas: stdout o valor de la última expresión **coincide** con la respuesta correcta |
| Preguntas no verificables mecánicamente | 1 (`B1-Q0126`, enunciado en prosa sin código ejecutable; revisado manualmente: `acciones=["AAPL","MSFT"]` con un `for` imprime ambos valores, coincide con la opción correcta) |
| Flashcards: anverso/reverso no vacíos, anverso ≠ reverso, anverso único | OK |
| Flashcards casi duplicadas (anverso ≥ 0,85 y reverso ≥ 0,7) | 0 tras la corrección (antes: `B1-FC0008`/`B1-FC0068`) |
| Conceptos trazables al texto canónico de su unidad (tokens significativos con normalización de acentos) | OK en los 56 |
| Referencias cruzadas de identificadores entre unidades | 0 no justificadas |
| Coherencia del campo `language` con el lenguaje de los bloques de código de cada opción | OK |
| Metadatos de unidad (orden, título vs encabezado canónico, objetivo, estado ACTIVE) | OK |

Evidencia cruda: `qa/RC1_CONTENT_AUDIT.json`.

# 6. Cobertura E2E añadida (Playwright)

La cobertura previa era contractual (lectura estática de fuentes) más un smoke HTTP. Se añadió una suite de navegador real, mantenible y determinista:

- `playwright.config.ts`: un solo proyecto chromium, puerto QA **4310** (no colisiona con el servidor manual de aceptación en 3000, configurable con `PP_E2E_PORT`), `webServer` contra **build de producción** (`next start`), `actionTimeout` 15 s, informe JSON + HTML.
- `e2e/support/content.ts`: lee el banco canónico para conocer la respuesta correcta de cada pregunta (nada hardcodeado).
- `e2e/support/helpers.ts`: captura de excepciones no controladas y `console.error`, detección de overflow horizontal y de solapamiento de la cabecera.

| Escenario | Qué verifica |
| --- | --- |
| `routes.spec.ts` | Las 23 rutas responden < 400 (sin 5xx), con `main#main-content`, un único `h1` y sin errores de consola/excepción; 404 controlado con navegación útil; los enlaces internos principales no están rotos |
| `study.spec.ts` | Abrir U01, estado "En curso" → "Estudiada", navegar a U02, volver atrás y recargar con el progreso persistido; índice con las 12 unidades; enlace de práctica `/tests?unit=u05` con modo "Por unidad" preseleccionado |
| `quiz.spec.ts` | Sesión de 10: respuesta correcta e incorrecta con feedback y explicación, resultado final 3/10 (30%), revisión de los 7 errores; reanudación de sesión interrumpida en la pregunta 3 tras recarga; los 4 modos (Bloque, Unidad, Adaptativo V1, Errores) arrancan con su configuración real; tamaños 10/20/30; sesión inválida no reconstruida |
| `flashcards.spec.ts` | Las tres valoraciones (No la sabía / Dudé / La sabía) actualizan el historial y sobreviven a la recarga; sesión completa con "La sabía" termina en resultados 10/10 y alimenta el panel de historial; el modo adaptativo no entra en bucle ni pierde la cola (exposición ≤ 3, cola ≥ 1, intentos = clics); sesión inválida controlada |
| `settings-progress-theme.spec.ts` | Tema Sistema/Claro/Oscuro aplicado (`data-theme`) y persistido tras recarga; `/progreso` refleja actividad real (1/12 unidades, 50% de acierto, tarjeta de unidad y conceptos); borrado de progreso local elimina los 3 namespaces y **conserva** `pp-theme` |
| `responsive-a11y.spec.ts` | 1440×900 y 390×844 en 7 rutas: sin overflow horizontal, cabecera que no tapa el inicio del contenido; controles móviles (menú, botón principal ≥ 40 px) visibles y utilizables; skip link enfocable y foco visible; navegación por teclado; jerarquía de títulos sin saltos y un solo `h1`; todos los controles de `main` con nombre accesible |

Comando de reproducción:

```powershell
npm install                       # (ver nota de bloqueo de ficheros más abajo)
npx playwright install chromium   # navegador mínimo (headless shell)
npm run build
npm run test:e2e                  # 23/23
```

**Nota operativa (bloqueo de ficheros en Windows).** Mientras el servidor de la prueba de aceptación manual está vivo (`npm run start` en el puerto 3000), `npm ci` falla con `EPERM`/`-4048` porque intenta eliminar `node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node`, que ese proceso tiene cargado. La instalación reproducible desde el lockfile debe hacerse con el servidor de aceptación detenido, o usar `npm install` (verificado en esta ejecución: 330 paquetes restaurados, 0 vulnerabilidades). No es un defecto del repositorio, sino del entorno de la máquina.

# 7. Incidencias encontradas y corregidas

| # | Severidad | Incidencia | Evidencia | Corrección |
| --- | --- | --- | --- | --- |
| 1 | P1 (bloqueante de release) | `content/block-1/coverage/test-matrix.json` y `flashcard-matrix.json` eran **ignorados por git** (el patrón `coverage/` de `.gitignore` también capturaba `content/block-1/coverage/`) y no estaban versionados: ninguna copia limpia del repositorio podía validar el contenido | Reproducido con `git archive HEAD` + `node scripts/validate-content.mjs` → `ENOENT … test-matrix.json`; tras incorporar los dos ficheros → `CONTENT_VALIDATION=PASS`. Son requeridos por `manifest.json` e `integrity.json` | Añadida la excepción `!content/block-1/coverage/` en `.gitignore`; ambos ficheros quedan preparados en el índice para el commit. Guard de regresión añadido al auditor (`git-ignored-asset`, verificado en positivo y en negativo) |
| 2 | P2 (contenido) | Duplicación real de flashcards: `B1-FC0008` (U02) y `B1-FC0068` (U11) compartían **anverso idéntico** (`Get-Location`) y reverso casi idéntico | Auditoría de la sección 5 (`flashcard-duplicate`) | `B1-FC0008` pasa a `Get-Date` —única orden explícitamente mostrada en `canonical/u02.md` y sin cobertura de flashcard previa— con reverso "Comando que consulta la fecha y la hora actuales" y concepto secundario `B1-U02-CMDLET`. No cambian recuentos, tipo, unidad, idioma ni reversibilidad, y `B1-U11-GET-LOCATION` sigue cubierto por `B1-FC0068`. Se actualizó el SHA-256 en `content/block-1/integrity.json` |
| 3 | P3 (UI) | Texto obsoleto dirigido al usuario en la unidad: "El motor de tests se implementará en Phase 4…" cuando el motor ya está implementado | Inspección de `app/estudiar/b1/[unitId]/page.tsx` | Sustituido por texto vigente: "Pon a prueba lo estudiado con las preguntas del Bloque 1. La sesión se abre ya filtrada por esta unidad." (el enlace `/tests?unit=` y su contexto de práctica se mantienen) |
| 4 | P3 (UI) | Markdown sin renderizar visible al usuario en 3 puntos (backticks literales en `quiz-setup.tsx` y `flashcard-setup.tsx`) | Inspección de JSX: el texto no pasa por el renderizador de rich text | Envueltos en `<code>` (mismo texto, sin cambios de diseño ni de significado) |
| 5 | P3 (metadatos de release) | `package-lock.json` declaraba `version: 0.1.0` mientras `package.json` es `0.1.0-rc.1` (inconsistencia previa que queda corregida al instalar la dependencia de test) | `git diff package-lock.json` | Lockfile regenerado por npm; ambas versiones coinciden |

# 8. Documentación de amenazas consideradas y no corregidas (warnings)

1. **`B1-Q0028` (warning de contenido).** "¿Cuál de estas instrucciones Python está correctamente escrita?" admite dos opciones sintácticamente válidas: `print(Hola)` y `print("Hola")`. El ítem evalúa semántica (falta de comillas) y es un distractor clásico y defendible en dificultad 2; no se toca el contenido y se documenta como warning.
2. **`B1-FC0033` / `B1-FC0035` (revisión manual de flashcards).** Comparten texto de reverso ("Igual, diferente, mayor…") pero los anversos difieren (símbolos Python vs PowerShell), por lo que evalúan conocimientos distintos y no se considera duplicación real.
3. **`release/RC1_SOURCE_INVENTORY.json` desactualizado.** El inventario SHA-256 de fuentes corresponde al árbol anterior a este changeset (y sí coincide con los 156 ficheros versionados de `HEAD`). No se regenera dentro de esta ejecución porque el generador recorre el sistema de ficheros —incluyendo utilidades locales ignoradas por git— y delataría ficheros no versionados. Debe regenerarse tras el commit: `node scripts/qa-source-inventory.mjs` (modo write) y verificarse con `--verify`.
4. **Utilidad de aceptación fijada al commit base.** `START_RC1_ACCEPTANCE_R2.ps1` exige `HEAD=d0b146d` y `STATUS=CLEAN`; tras el commit del orquestador fallará por diseño. Es el comportamiento esperado del paquete de aceptación, no un defecto de la aplicación.

Además, `npm run test:e2e` requiere el navegador de Playwright (`npx playwright install chromium`, ~91 MB, headless shell). Es una dependencia de desarrollo para instalar una vez por máquina; no afecta al runtime ni al bundle.

# 9. Changeset y estado de git

Ficheros modificados:

- `.gitignore` (excepción para las matrices de cobertura + artefactos de Playwright)
- `package.json`, `package-lock.json` (devDependency `@playwright/test`, scripts nuevos, versión del lockfile alineada)
- `content/block-1/flashcards/u02.json` y `content/block-1/integrity.json` (corrección de duplicado)
- `app/estudiar/b1/[unitId]/page.tsx`, `components/quiz/quiz-setup.tsx`, `components/flashcards/flashcard-setup.tsx` (texto de UI)

Ficheros nuevos:

- `playwright.config.ts`
- `e2e/routes.spec.ts`, `e2e/study.spec.ts`, `e2e/quiz.spec.ts`, `e2e/flashcards.spec.ts`, `e2e/settings-progress-theme.spec.ts`, `e2e/responsive-a11y.spec.ts`, `e2e/support/content.ts`, `e2e/support/helpers.ts`
- `scripts/rc1-content-audit.mjs`
- `qa/RC1_AUTO_QA_RESULT.json`, `qa/RC1_CONTENT_AUDIT.json`, `qa/playwright-report.json`
- `content/block-1/coverage/test-matrix.json`, `content/block-1/coverage/flashcard-matrix.json` (ya existían en disco y eran canónicos: ahora dejan de estar ignorados y deben entrar al commit)

Scripts nuevos en `package.json` (aditivos; `check` no se ha modificado):

```text
audit:content     node scripts/rc1-content-audit.mjs --out qa/RC1_CONTENT_AUDIT.json
test:e2e          playwright test
test:e2e:install  playwright install chromium
test:e2e:report   playwright show-report qa/playwright-report
check:rc1         npm run check && npm run audit:content && npm run test:e2e
```

Estado de git al cerrar: **sin commit creado**. Los cambios están preparados con `git add` para que el commit del orquestador sea atómico e incluya los dos ficheros de coverage; el índice puede revertirse con `git reset` si el orquestador prefiere decidir el staging por su cuenta.

# 10. Evidencia reproducible (secuencia completa)

```powershell
npm install                       # con el servidor de aceptación (puerto 3000) detenido
npx playwright install chromium

npm run check                     # validadores + lint + typecheck + 54 tests + build
npm run qa:http                   # 16/16 rutas
npm run audit:content             # auditoría de contenido (0 blockers, 1 warning)
npm run build; npm run test:e2e   # 23/23 E2E sobre build de producción
npm audit --omit=dev              # 0 vulnerabilidades

# Reproducibilidad de la superficie de rutas
node scripts/qa-build-surface.mjs   # sha256 == release/RC1_BUILD_MANIFEST.json
```

Todos los comandos anteriores se han ejecutado en esta sesión sobre el changeset descrito en la sección 9, y `npm run check`, `qa:http`, `audit:content` y `test:e2e` se repitieron después de restaurar `node_modules` para asegurar que el estado final del entorno es verde.

# 11. Conclusión

`PASS` para release readiness local. Los gates existentes pasan, el build de producción es reproducible, la cobertura E2E real pasa completa, los recuentos canónicos siguen en 12/56/200/80, no hay dependencia de IA en runtime, no hay secretos versionados ni en el bundle, y no quedan P0/P1 reproducibles. Las correcciones aplicadas son mínimas, explicables y verificadas; las cuatro advertencias restantes son no bloqueantes y están documentadas. No se ha promovido `0.1.0-rc.1` a estable, no se ha publicado ni desplegado, y no se ha creado ningún commit.
