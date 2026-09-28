# QA de contenido — Bloque 2 (B2)

**Estado:** contenido de rama `content/block-2-canonical-v1`. **NO publicado en la web.**
**No integrado todavía en `main` ni en producción.**
**Versión canónica:** `BLOCK2_CANONICAL_V1.0`
**Bancos:** conceptos `B2_CONCEPT_BANK_V1.0`, tests `BLOCK2_TEST_BANK_V1.0`,
matrices `B2_TEST_MATRIX_V1.0` / `B2_FLASHCARD_MATRIX_V1.0`, flashcards `BLOCK2_FLASHCARD_BANK_V1.0`.
**Idioma:** es. **IA en runtime:** ninguna.

Este informe resume la materialización de la especificación aprobada de B2
(`README.md`, `STATUS.json`, `canonical/units.json`, `canonical/u01..u12.md`) en
archivos de contenido versionados. Se generó a partir de los propios archivos,
no se redactó a mano.

---

## 1. Recuentos

| Elemento | Esperado | Generado |
| --- | ---: | ---: |
| Unidades | 12 | 12 |
| Conceptos activos | 72 | 72 |
| Preguntas activas | 240 | 240 |
| Flashcards activas | 96 | 96 |

Verificación: `node scripts/validate-block2-content.mjs` → `BLOCK2_CONTENT_VALIDATION=PASS`.

## 2. Preguntas — distribuciones

**Por unidad:** 20 preguntas (240 en total), 6 por cada bloque de conceptos + 2 de integración.

**Dificultad global (exacta):**

| Nivel | Total | Por unidad | Esperado |
| --- | ---: | ---: | --- |
| 1 — reconocimiento | 60 | 5 | 60 |
| 2 — aplicación | 108 | 9 | 108 |
| 3 — diagnóstico/decisión | 72 | 6 | 72 |

**Posición de la respuesta correcta (global, exacta):**

| Posición | Total |
| --- | ---: |
| opt_1 | 60 |
| opt_2 | 60 |
| opt_3 | 60 |
| opt_4 | 60 |

Cada unidad mantiene 5 respuestas en cada posición.

**Tipos (A–F):** A=72, B=54, C=27, D=30, E=34, F=23. Cada unidad usa los seis tipos.
A = reconocimiento conceptual, B = escenario/aplicación, C = predecir/trazar,
D = comparación/selección, E = diagnóstico/corrección, F = operación segura/comando.

**Lenguaje:** COMMON=70, PYTHON=19, POWERSHELL=5, PYTHON_POWERSHELL=146.

**Cobertura de conceptos (preguntas primarias):** mínimo 3, máximo 4, media = 240/72.
Los 72 conceptos tienen al menos 3 preguntas primarias y el bloque base de 18 preguntas
por unidad (3 por concepto) queda garantizado antes de las 2 de integración.

**Opciones:** 4 opciones por pregunta con textos únicos dentro de cada pregunta; exactamente
una respuesta correcta; sin enunciados de opción vacíos; sin prompts duplicados (0).

## 3. Flashcards — distribuciones

**Por unidad:** 8 (96 en total): 6 base (una por concepto) + 2 de contraste/relación.

**Tipos:** CD=37, CR=30, CM=15, PX=8, EC=6.

**Lenguaje:** COMMON=29, PYTHON=4, POWERSHELL=2, PYTHON_POWERSHELL=61.

**Reversibilidad:** verdadero=35, falso=61. Solo se marca reversible cuando la
pregunta inversa (término ↔ definición) sigue siendo inequívoca.

**Cobertura de conceptos (primarias):** 72/72 conceptos con al menos 1 flashcard primaria
(mínimo 1, máximo 2).

Sin anversos ni reversos duplicados (0 / 0).

## 4. Integridad

- `integrity.json` incluye SHA-256 determinista de los archivos fuente de B2
  (manifiesto, conceptos, preguntas, flashcards, matrices de cobertura y canónicos),
  excluyendo `integrity.json`.
- Las matrices de cobertura `coverage/test-matrix.json` y `coverage/flashcard-matrix.json`
  se derivan de los archivos reales; el validador las recalcula y exige igualdad exacta.

## 5. Comprobaciones de alcance

El contenido respeta el alcance de B2 declarado en `README.md`:

- Sin bases de datos/SQL, sin APIs HTTP/REST, sin autenticación, sin POO,
  sin concurrencia/async, sin frameworks web, sin Docker, sin cloud, sin CI/CD,
  sin Git avanzado.
- Sin `pandas` ni librerías pesadas de datos: se trabaja con `csv`, `json`,
  colecciones nativas y pipelines de PowerShell.
- Las tecnologías nombradas se limitan a las incluidas en los canónicos:
  `pathlib`, `shutil`, `json`, `csv`, `re`, `logging`, `argparse` y constructos
  de PowerShell (`Join-Path`, `Test-Path`, `Get-Item`, `Get-ChildItem`,
  `Copy-Item`, `Move-Item`, `Rename-Item`, `Remove-Item`, `Import-Csv`,
  `Export-Csv`, `ConvertFrom-Json`, `ConvertTo-Json` con `-Depth`,
  `Where-Object`, `Select-Object`, `Sort-Object`, `Group-Object`,
  `Measure-Object`, `try/catch/finally`, `-ErrorAction Stop`, `Write-Verbose`,
  `Write-Warning`, `Write-Error`).
- La pipeline de PowerShell se trata como flujo de **objetos**, no de texto formateado.
- Los ejemplos destructivos (`unlink`, `Remove-Item`) aparecen solo en contexto
  diagnóstico y la respuesta segura (cuarentena, respaldo, validación previa) es
  la correcta; no se propone el borrado recursivo indiscriminado como patrón normal.

## 6. Limitaciones y notas honestas

- La validación de sintaxis/ejecución automática de *snippets* ejecutables citada en
  el plan de B2 (`README.md`, criterio 7) se cierra con el gate B2-only descrito en
  la sección 9 de este informe (`scripts/validate-block2-snippets.mjs`). Ese gate
  ejecuta casos curados en directorios temporales; los casos destructivos solo se
  ejecutan contra fixtures temporales desechables y los inseguros no se ejecutan. No se declara cobertura ejecutable del 100 %.
- Nota de integración: `.gitignore` exceptúa tanto `content/block-1/coverage/` como
  `content/block-2/coverage/`, de modo que `coverage/test-matrix.json` y
  `coverage/flashcard-matrix.json` de B2 se versionan con el resto del bloque. No
  fue necesario modificar `.gitignore` para cerrar el gate de snippets.
- Este informe y los archivos de B2 **no** están conectados a la aplicación en runtime;
  B1 permanece intacto y publicado. B2 se integra cuando el contenido y los gates
  estén cerrados.

## 7. Revisión semántica

Se realizó una revisión semántica completa adicional sobre los 72 conceptos,
las 240 preguntas y las 96 flashcards. Resultado: **0 BLOCKER, 0 HIGH**.
Se detectaron seis incidencias MEDIUM (codificación de STATUS, dos casos de
reversibilidad ambigua, solapamiento mecánico test/tarjeta, un distractor
malformado y una premisa diagnóstica imprecisa) y se corrigieron antes de
versionar este estado.

## 8. Cómo validar

```bash
node scripts/validate-block2-content.mjs
node scripts/validate-block2-snippets.mjs
```

Salida esperada: `BLOCK2_CONTENT_VALIDATION=PASS` con métricas de recuentos,
dificultad, posiciones de respuesta y cobertura de conceptos. Sale con código
distinto de cero y lista de fallos accionables ante cualquier incumplimiento.

## 9. Gate de snippets ejecutables (criterio 7) y ejemplos destructivos (criterio 8)

El gate `scripts/validate-block2-snippets.mjs` cierra el criterio 7 y refuerza el
criterio 8. Inventaría los fragmentos con forma de código de B2 (52 elementos con
referencias de origen), versiona casos curados (`B2_SNIPPET_CASES_V1.0`) y ejecuta
solo los casos `EXECUTE_SAFE_PURE` y `EXECUTE_SAFE_TEMP_MUTATION` con aserciones
explícitas, en directorios temporales únicos que se eliminan en `finally`.

- Registro e inventario versionados: `snippets/snippet-cases.json`,
  `snippets/inventory.json`.
- Informe detallado: `snippets/SNIPPET_QA_REPORT.md`.
- Los ejemplos destructivos (`unlink`, `Remove-Item`) se ejecutan **solo** contra
  fixtures desechables creados por el propio caso dentro del *temp root*; el resto
  de ejemplos destructivos (`except: pass`, `Remove-Item -Recurse -Force`,
  `Move-Item -Force`) quedan `UNSAFE_NOT_EXECUTED` y prueban el `DENY_CHECK`.
- El gate verifica que el árbol del repositorio no cambió (`REPO_MUTATION_GUARD`) y
  que las mutaciones no escapan del *temp root* (`TEMP_ONLY_GUARD`).

Salida esperada: `BLOCK2_SNIPPET_GATE=PASS`.
