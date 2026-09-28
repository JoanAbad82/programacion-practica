# QA de snippets ejecutables — Bloque 2 (B2)

**Bloque:** B2 — Automatización práctica con archivos y datos
**Rama:** `content/block-2-canonical-v1` · **NO publicado en la web** · sin integración en `main`.
**Versión canónica:** `BLOCK2_CANONICAL_V1.0`
**Inventario:** `B2_SNIPPET_INVENTORY_V1.0` (`snippets/inventory.json`)
**Registro de casos:** `B2_SNIPPET_CASES_V1.0` (`snippets/snippet-cases.json`)
**Validador:** `scripts/validate-block2-snippets.mjs`

Este informe cierra el criterio de producción 7 del README de B2 («los snippets ejecutables se validen automáticamente cuando sea posible») y refuerza el criterio 8 («los ejemplos destructivos sean seguros por defecto»). Se generó a partir del propio inventario y del registro de casos versionados; el validador **no ejecuta cadenas extraídas de las preguntas**, solo los casos curados de `snippet-cases.json`.

---

## 1. Resultado del gate

```
BLOCK2_SNIPPET_GATE=PASS
```

| Métrica | Valor |
| --- | ---: |
| Elementos inventariados | 52 |
| Casos registrados | 41 |
| Casos Python | 21 |
| Casos PowerShell | 20 |
| Ejecutados `EXECUTE_SAFE_PURE` | 24 |
| Ejecutados `EXECUTE_SAFE_TEMP_MUTATION` | 12 |
| `PARSE_ONLY` | 2 |
| `UNSAFE_NOT_EXECUTED` | 3 |
| `PROSE_NOT_EXECUTABLE` | 11 |
| Aserciones explícitas evaluadas | 139/139 |
| Guardas `TEMP_ONLY_GUARD` / `REPO_MUTATION_GUARD` / `DENY_CHECK` | PASS / PASS / PASS |

## 2. Runtimes usados

| Runtime | Comando | Versión |
| --- | --- | --- |
| Python | `python` | `Python 3.11.9` |
| PowerShell | `pwsh` | `7.6.6` |

El validador resuelve el ejecutable en tiempo de ejecución (`python`/`python3`/`py` y `pwsh`/`powershell`), reporta la versión y falla si falta alguno.

## 3. Recuentos de inventario

El inventario cubre fragmentos con forma de código y constructos ejecutables nombrados en los canónicos, el README, las preguntas, opciones, explicaciones y flashcards. Cada elemento tiene una o más referencias de origen (archivo + ID de pregunta/tarjeta).

| Clasificación | Python | PowerShell | COMMON | Total |
| --- | ---: | ---: | ---: | ---: |
| `EXECUTE_SAFE_PURE` | 13 | 11 | 0 | 24 |
| `EXECUTE_SAFE_TEMP_MUTATION` | 6 | 6 | 0 | 12 |
| `PARSE_ONLY` | 1 | 1 | 0 | 2 |
| `UNSAFE_NOT_EXECUTED` | 1 | 2 | 0 | 3 |
| `PROSE_NOT_EXECUTABLE` | 0 | 0 | 11 | 11 |
| **Total** | **21** | **20** | **11** | **52** |

**Cobertura ejecutable honesta:** 36 de 52 elementos (24 puros + 12 de mutación temporal) se ejecutan de verdad con aserciones explícitas. **No se declara cobertura del 100 %**: quedan 2 elementos `PARSE_ONLY` (solo sintaxis), 3 `UNSAFE_NOT_EXECUTED` (deliberadamente no ejecutados) y 11 `PROSE_NOT_EXECUTABLE` (enunciados conceptuales, no ejecutables).

## 4. Casos ejecutados

- **24 casos `EXECUTE_SAFE_PURE`:** solo calculan/parsean en memoria. El validador comprueba además que su directorio de trabajo temporal queda **vacío**, lo que demuestra que no escriben nada.
- **12 casos `EXECUTE_SAFE_TEMP_MUTATION`:** crean su propio *fixture* dentro de un directorio temporal único por caso y verifican el resultado leyendo de vuelta.
- **2 casos destructivos ejecutados** (`py-unlink-destructive`, `ps-remove-item-temp`): borran únicamente archivos creados por el propio caso dentro del fixture temporal; también se comprueba que un archivo «testigo» del fixture sigue existiendo.
- Cada caso declara `expect` (aserciones explícitas sobre un objeto `RESULT:` en JSON) además de un código de salida esperado; no basta con `exit 0`. En total se evaluaron **139 aserciones**.

## 5. Casos no ejecutados (y por qué)

### `PARSE_ONLY` (2)

| Caso | Motivo |
| --- | --- |
| `py-entrypoint-guard` (`if __name__ == "__main__"`) | Es una estructura de entrada, no un cálculo; se valida con `ast.parse` sin ejecutar. |
| `ps-param-validateset` (`param(...)`, `ValidateSet`) | El bloque `param` va al inicio de un script; se valida con el parser de PowerShell sin dot-sourcearlo. |

### `UNSAFE_NOT_EXECUTED` (3)

| Caso | Motivo |
| --- | --- |
| `py-except-pass-unsafe` (`except: pass`) | Antipatrón desaconsejado explícitamente; oculta el error real. |
| `ps-remove-recurse-unsafe` (`Remove-Item -Recurse -Force`) | Borrado recursivo indiscriminado, prohibido como patrón normal en B2. |
| `ps-move-force-unsafe` (`Move-Item -Force`) | Sobrescritura silenciosa sin política de colisión. |

Estos tres casos se registran con su código **solo como control positivo** del `DENY_CHECK`: el validador exige que coincidan con al menos una regla de rechazo, probando que el filtro estático los bloquearía antes de ejecutarlos.

### `PROSE_NOT_EXECUTABLE` (11)

Diseño previo (alcance/contrato/precondiciones/dry-run/idempotencia), efectos secundarios, política de colisión y respaldo, BOM/terminadores, tipos JSON declarativos, preferir coincidencia literal, deduplicación por clave, validación de entrada, `return` frente a `output`, log/dry-run/resumen de ejecución y las etapas `PLAN/APPLY` con journal, postcondiciones y reporte reproducible. Son enunciados conceptuales: no se presentan falsamente como snippets ejecutables.

## 6. Diseño de seguridad del validador

1. **Solo casos curados.** Nunca se ejecuta texto extraído de preguntas, opciones o explicaciones.
2. **Temp único por caso.** El validador crea un *temp root* con `mkdtemp`, un subdirectorio por caso y lo elimina en un bloque `finally`. El `cwd` de todos los casos es el subdirectorio temporal, y `B2_SNIPPET_TEMP` apunta a él.
3. **Guardas estáticas (`DENY_CHECK`).** Antes de ejecutar, se rechaza cualquier caso que contenga borrado recursivo (`shutil.rmtree`, `Remove-Item -Recurse`), `os.remove/unlink/rmdir`, shell/subproceso, red, servicios/tareas, registro, instalación de paquetes, persistencia de entorno, mutación del perfil, rutas absolutas fijadas (`C:\`, `/usr/`...), travesía con `..` o `chdir`.
4. **Prueba temp-only.** Tras cada caso de mutación se comprueba que existan artefactos **dentro** del fixture y que ninguno resuelva fuera del *temp root*; los casos puros deben dejar su directorio vacío.
5. **Guarda de repositorio (`REPO_MUTATION_GUARD`).** Se toma una huella (SHA-256 de todos los archivos del árbol, excluyendo `node_modules`, `.git`, `.next`, `out`...) y `git status --porcelain` antes y después; si algo cambia, el gate falla. Los archivos B2 añadidos en el árbol de trabajo no se confunden con mutaciones porque están presentes en ambas instantáneas.
6. **Sin efectos laterales del validador.** No genera ni modifica el registro ni este informe; solo lee y escribe en el *temp root*.

## 7. Fallos y correcciones de contenido

La auditoría automática **no demostró que ninguna afirmación técnica de B2 fuese incorrecta**, por lo que **no fue necesaria ninguna corrección de contenido** en `questions/`, `flashcards/` ni `concepts/`. Las dos únicas aserciones que hubo que ajustar estaban en los propios casos curados del registro (no en el material canónico):

- `ps-measure-sum`: `Measure-Object -Sum` no calcula `Average` salvo que se pida `-Average`; se añadió `-Average` al caso.
- `ps-group-object`: el recuento pedido era el de miembros del grupo (`.Count` del grupo), no el número de grupos; se corrigió la aserción del caso.

Nota (sin corrección): la opción correcta de `B2-Q0022` ilustra la ruta con `datos/sub/f.txt` usando `/` como notación esquemática; la afirmación evaluada («une los tres segmentos con el separador del sistema») es correcta, y el caso `py-path-compose` la verifica de forma independiente del separador.

## 8. Inventario completo

| ID | Constructo | Clasificación | Referencias de origen |
| --- | --- | --- | --- |
| `B2-INV-PY-001` | pathlib.Path: composicion con el operador / | `EXECUTE_SAFE_PURE` | README.md, canonical/u02.md, questions/u02.json#B2-Q0021, questions/u02.json#B2-Q0022, flashcards/u02.json#B2-FC0009 |
| `B2-INV-PY-002` | Path.mkdir(parents=True, exist_ok=True) idempotente | `EXECUTE_SAFE_TEMP_MUTATION` | canonical/u02.md, questions/u02.json#B2-Q0036 |
| `B2-INV-PY-003` | iterdir() / rglob() + stat()/suffix (metadatos) | `EXECUTE_SAFE_TEMP_MUTATION` | canonical/u02.md, questions/u02.json#B2-Q0027, questions/u02.json#B2-Q0028, questions/u02.json#B2-Q0030, questions/u02.json#B2-Q0031, questions/u02.json#B2-Q0033, flashcards/u02.json#B2-FC0013 |
| `B2-INV-PY-004` | shutil.copy2 / shutil.move / Path.rename | `EXECUTE_SAFE_TEMP_MUTATION` | canonical/u03.md, questions/u03.json#B2-Q0042, questions/u03.json#B2-Q0044, questions/u03.json#B2-Q0047, flashcards/u03.json#B2-FC0017, flashcards/u03.json#B2-FC0018, flashcards/u03.json#B2-FC0019 |
| `B2-INV-PY-005` | Path.unlink: borrado de un archivo | `EXECUTE_SAFE_TEMP_MUTATION` | canonical/u03.md, questions/u03.json#B2-Q0051 |
| `B2-INV-PY-006` | open(..., encoding='utf-8') / Path.read_text / Path.write_text (append) | `EXECUTE_SAFE_TEMP_MUTATION` | README.md, canonical/u04.md |
| `B2-INV-PY-007` | csv.DictReader: registros accesibles por encabezado | `EXECUTE_SAFE_PURE` | canonical/u05.md, questions/u05.json#B2-Q0084 |
| `B2-INV-PY-008` | list comprehension de filtrado [r for r in filas if ...] | `EXECUTE_SAFE_PURE` | canonical/u08.md, questions/u05.json#B2-Q0091 |
| `B2-INV-PY-009` | conversion numerica de campos CSV antes de calcular | `EXECUTE_SAFE_PURE` | canonical/u05.md, questions/u05.json#B2-Q0095 |
| `B2-INV-PY-010` | csv.DictWriter exportando con encoding utf-8 explicito | `EXECUTE_SAFE_TEMP_MUTATION` | canonical/u05.md, questions/u05.json#B2-Q0098 |
| `B2-INV-PY-011` | json.loads / json.dumps round-trip preservando tipos | `EXECUTE_SAFE_PURE` | canonical/u06.md, questions/u06.json#B2-Q0104, questions/u06.json#B2-Q0107 |
| `B2-INV-PY-012` | texto JSON sin deserializar vs objeto (subindice por clave) | `EXECUTE_SAFE_PURE` | canonical/u06.md, questions/u06.json#B2-Q0106 |
| `B2-INV-PY-013` | re.search con grupos de captura y re.findall | `EXECUTE_SAFE_PURE` | canonical/u07.md, questions/u07.json#B2-Q0134 |
| `B2-INV-PY-014` | re.sub sustitucion guiada por patron | `EXECUTE_SAFE_PURE` | canonical/u07.md, questions/u07.json#B2-Q0136, flashcards/u07.json#B2-FC0056 |
| `B2-INV-PY-015` | sorted()/set()/dict acumulador (filtrar, transformar, agrupar) | `EXECUTE_SAFE_PURE` | canonical/u08.md, questions/u08.json#B2-Q0154 |
| `B2-INV-PY-016` | try/except/finally con excepcion especifica (ValueError/JSONDecodeError/FileNotFoundError) | `EXECUTE_SAFE_PURE` | canonical/u09.md, questions/u09.json#B2-Q0164, questions/u09.json#B2-Q0166, questions/u09.json#B2-Q0173, questions/u09.json#B2-Q0174, questions/u09.json#B2-Q0180, flashcards/u09.json#B2-FC0066 |
| `B2-INV-PY-017` | sys.exit(codigo) como codigo de salida del proceso | `EXECUTE_SAFE_PURE` | canonical/u09.md, questions/u09.json#B2-Q0176, flashcards/u09.json#B2-FC0070 |
| `B2-INV-PY-018` | argparse: defaults y elecciones (choices) | `EXECUTE_SAFE_PURE` | canonical/u10.md, questions/u10.json#B2-Q0188, questions/u10.json#B2-Q0200 |
| `B2-INV-PY-019` | entrypoint guard: if __name__ == "__main__" | `PARSE_ONLY` | canonical/u10.md, questions/u10.json#B2-Q0181, flashcards/u10.json#B2-FC0073 |
| `B2-INV-PY-020` | modulo logging: niveles y salida controlada | `EXECUTE_SAFE_PURE` | canonical/u11.md, questions/u11.json#B2-Q0201, flashcards/u11.json#B2-FC0081 |
| `B2-INV-PY-021` | antipatron except: pass (oculta el error real) | `UNSAFE_NOT_EXECUTED` | README.md, canonical/u09.md, questions/u09.json#B2-Q0166, questions/u09.json#B2-Q0180 |
| `B2-INV-PS-001` | Join-Path: composicion de rutas | `EXECUTE_SAFE_PURE` | README.md, canonical/u02.md, flashcards/u02.json#B2-FC0009 |
| `B2-INV-PS-002` | Test-Path / Get-Item / Get-ChildItem (-Recurse -Filter) / New-Item -Force | `EXECUTE_SAFE_TEMP_MUTATION` | README.md, canonical/u02.md, questions/u02.json#B2-Q0027, questions/u02.json#B2-Q0028, questions/u02.json#B2-Q0030, questions/u02.json#B2-Q0033, questions/u02.json#B2-Q0036, flashcards/u02.json#B2-FC0013 |
| `B2-INV-PS-003` | Copy-Item / Move-Item / Rename-Item | `EXECUTE_SAFE_TEMP_MUTATION` | canonical/u03.md, questions/u03.json#B2-Q0042, questions/u03.json#B2-Q0044, questions/u03.json#B2-Q0047, flashcards/u03.json#B2-FC0017, flashcards/u03.json#B2-FC0018, flashcards/u03.json#B2-FC0019 |
| `B2-INV-PS-004` | Remove-Item de un archivo con -ErrorAction Stop | `EXECUTE_SAFE_TEMP_MUTATION` | canonical/u03.md, questions/u03.json#B2-Q0051, questions/u09.json#B2-Q0169 |
| `B2-INV-PS-005` | Get-Content / Set-Content / Add-Content con encoding | `EXECUTE_SAFE_TEMP_MUTATION` | README.md, canonical/u04.md |
| `B2-INV-PS-006` | Import-Csv: registros con propiedades por encabezado | `EXECUTE_SAFE_TEMP_MUTATION` | canonical/u05.md, questions/u05.json#B2-Q0084 |
| `B2-INV-PS-007` | Export-Csv con -NoTypeInformation y encoding | `EXECUTE_SAFE_TEMP_MUTATION` | canonical/u05.md, questions/u05.json#B2-Q0096, questions/u05.json#B2-Q0098 |
| `B2-INV-PS-008` | ConvertFrom-Json: deserializacion | `EXECUTE_SAFE_PURE` | canonical/u06.md, questions/u06.json#B2-Q0104, questions/u06.json#B2-Q0106, flashcards/u06.json#B2-FC0047 |
| `B2-INV-PS-009` | ConvertTo-Json -Depth: anidamiento frente a truncamiento | `EXECUTE_SAFE_PURE` | canonical/u06.md, questions/u06.json#B2-Q0107, questions/u06.json#B2-Q0108, flashcards/u06.json#B2-FC0047 |
| `B2-INV-PS-010` | -match / -replace / $Matches | `EXECUTE_SAFE_PURE` | canonical/u07.md, questions/u07.json#B2-Q0136, questions/u07.json#B2-Q0121 |
| `B2-INV-PS-011` | Where-Object: filtrado de objetos | `EXECUTE_SAFE_PURE` | canonical/u08.md, questions/u08.json#B2-Q0142 |
| `B2-INV-PS-012` | Select-Object -Property: proyeccion | `EXECUTE_SAFE_PURE` | canonical/u08.md, questions/u08.json#B2-Q0145 |
| `B2-INV-PS-013` | Sort-Object -Unique: orden y deduplicacion | `EXECUTE_SAFE_PURE` | canonical/u08.md, questions/u08.json#B2-Q0153, questions/u08.json#B2-Q0154 |
| `B2-INV-PS-014` | Group-Object: agrupacion por clave | `EXECUTE_SAFE_PURE` | canonical/u08.md, questions/u08.json#B2-Q0151 |
| `B2-INV-PS-015` | Measure-Object -Sum: agregacion | `EXECUTE_SAFE_PURE` | canonical/u08.md, questions/u08.json#B2-Q0157 |
| `B2-INV-PS-016` | try/catch/finally + -ErrorAction Stop + codigos de salida | `EXECUTE_SAFE_PURE` | canonical/u09.md, questions/u09.json#B2-Q0167, questions/u09.json#B2-Q0168, questions/u09.json#B2-Q0169, questions/u09.json#B2-Q0176, flashcards/u09.json#B2-FC0067 |
| `B2-INV-PS-017` | Write-Verbose / Write-Warning / Write-Error | `EXECUTE_SAFE_PURE` | README.md, canonical/u11.md |
| `B2-INV-PS-018` | param(...) con defaults y ValidateSet | `PARSE_ONLY` | canonical/u10.md, questions/u10.json#B2-Q0184 |
| `B2-INV-PS-019` | Remove-Item -Recurse -Force: borrado recursivo indiscriminado | `UNSAFE_NOT_EXECUTED` | README.md, canonical/u03.md |
| `B2-INV-PS-020` | Move-Item -Force: sobrescritura silenciosa sin politica de colision | `UNSAFE_NOT_EXECUTED` | canonical/u03.md, questions/u03.json#B2-Q0046 |
| `B2-INV-PROSE-001` | Diseno previo: alcance, contrato E/S, precondiciones, dry-run e idempotencia | `PROSE_NOT_EXECUTABLE` | README.md, canonical/u01.md, questions/u01.json#B2-Q0016, flashcards/u01.json#B2-FC0005 |
| `B2-INV-PROSE-002` | Efectos secundarios y separacion entre consulta y modificacion | `PROSE_NOT_EXECUTABLE` | README.md, canonical/u01.md |
| `B2-INV-PROSE-003` | Politica de colision y respaldo/rollback | `PROSE_NOT_EXECUTABLE` | canonical/u03.md, questions/u03.json#B2-Q0056 |
| `B2-INV-PROSE-004` | BOM y terminadores de linea como concepto textual | `PROSE_NOT_EXECUTABLE` | canonical/u04.md |
| `B2-INV-PROSE-005` | Tipos JSON declarativos (string/number/boolean/null/object/array) | `PROSE_NOT_EXECUTABLE` | canonical/u06.md, questions/u06.json#B2-Q0113 |
| `B2-INV-PROSE-006` | Preferir coincidencia literal frente a expresiones regulares cuando basta | `PROSE_NOT_EXECUTABLE` | README.md, canonical/u07.md, questions/u07.json#B2-Q0121 |
| `B2-INV-PROSE-007` | Deduplicacion por una clave definida | `PROSE_NOT_EXECUTABLE` | canonical/u08.md, questions/u08.json#B2-Q0153 |
| `B2-INV-PROSE-008` | Validacion de la entrada (contrato) antes de actuar | `PROSE_NOT_EXECUTABLE` | canonical/u09.md, questions/u09.json#B2-Q0161 |
| `B2-INV-PROSE-009` | Distinguir devolver datos (return) de mostrar al usuario (output) | `PROSE_NOT_EXECUTABLE` | canonical/u10.md, questions/u10.json#B2-Q0193 |
| `B2-INV-PROSE-010` | Log, dry-run, idempotencia y resumen de ejecucion como diseno | `PROSE_NOT_EXECUTABLE` | canonical/u11.md, questions/u11.json#B2-Q0216, flashcards/u11.json#B2-FC0086 |
| `B2-INV-PROSE-011` | Etapas PLAN/APPLY, journal de cambios, postcondiciones y reporte reproducible | `PROSE_NOT_EXECUTABLE` | README.md, canonical/u12.md, questions/u12.json#B2-Q0227, flashcards/u12.json#B2-FC0091 |

## 9. Registro de casos

| Caso | Lenguaje | Clasificación | Destructivo | Temp-only | Inventario |
| --- | --- | --- | --- | --- | --- |
| `py-path-compose` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-001` |
| `py-mkdir-idempotent` | `PYTHON` | `EXECUTE_SAFE_TEMP_MUTATION` | no | sí | `B2-INV-PY-002` |
| `py-enumerate-metadata` | `PYTHON` | `EXECUTE_SAFE_TEMP_MUTATION` | no | sí | `B2-INV-PY-003` |
| `py-copy-move-rename` | `PYTHON` | `EXECUTE_SAFE_TEMP_MUTATION` | no | sí | `B2-INV-PY-004` |
| `py-unlink-destructive` | `PYTHON` | `EXECUTE_SAFE_TEMP_MUTATION` | sí | sí | `B2-INV-PY-005` |
| `py-text-encoding` | `PYTHON` | `EXECUTE_SAFE_TEMP_MUTATION` | no | sí | `B2-INV-PY-006` |
| `py-csv-parse` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-007` |
| `py-csv-filter-comprehension` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-008` |
| `py-csv-numeric-transform` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-009` |
| `py-csv-export-encoding` | `PYTHON` | `EXECUTE_SAFE_TEMP_MUTATION` | no | sí | `B2-INV-PY-010` |
| `py-json-roundtrip` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-011` |
| `py-json-text-vs-object` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-012` |
| `py-regex-capture` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-013` |
| `py-regex-sub` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-014` |
| `py-collections-pipeline` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-015` |
| `py-try-except-finally` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-016` |
| `py-exit-codes` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-017` |
| `py-argparse-defaults` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-018` |
| `py-entrypoint-guard` | `PYTHON` | `PARSE_ONLY` | no | no | `B2-INV-PY-019` |
| `py-logging-levels` | `PYTHON` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PY-020` |
| `py-except-pass-unsafe` | `PYTHON` | `UNSAFE_NOT_EXECUTED` | no | no | `B2-INV-PY-021` |
| `ps-join-path` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-001` |
| `ps-enumerate-metadata` | `POWERSHELL` | `EXECUTE_SAFE_TEMP_MUTATION` | no | sí | `B2-INV-PS-002` |
| `ps-copy-move-rename` | `POWERSHELL` | `EXECUTE_SAFE_TEMP_MUTATION` | no | sí | `B2-INV-PS-003` |
| `ps-remove-item-temp` | `POWERSHELL` | `EXECUTE_SAFE_TEMP_MUTATION` | sí | sí | `B2-INV-PS-004` |
| `ps-text-content` | `POWERSHELL` | `EXECUTE_SAFE_TEMP_MUTATION` | no | sí | `B2-INV-PS-005` |
| `ps-import-csv` | `POWERSHELL` | `EXECUTE_SAFE_TEMP_MUTATION` | no | sí | `B2-INV-PS-006` |
| `ps-export-csv` | `POWERSHELL` | `EXECUTE_SAFE_TEMP_MUTATION` | no | sí | `B2-INV-PS-007` |
| `ps-convertfrom-json` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-008` |
| `ps-convertto-json-depth` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-009` |
| `ps-regex-match-replace` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-010` |
| `ps-where-object` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-011` |
| `ps-select-object` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-012` |
| `ps-sort-unique` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-013` |
| `ps-group-object` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-014` |
| `ps-measure-sum` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-015` |
| `ps-try-catch-erroraction` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-016` |
| `ps-write-streams` | `POWERSHELL` | `EXECUTE_SAFE_PURE` | no | no | `B2-INV-PS-017` |
| `ps-param-validateset` | `POWERSHELL` | `PARSE_ONLY` | no | no | `B2-INV-PS-018` |
| `ps-remove-recurse-unsafe` | `POWERSHELL` | `UNSAFE_NOT_EXECUTED` | sí | no | `B2-INV-PS-019` |
| `ps-move-force-unsafe` | `POWERSHELL` | `UNSAFE_NOT_EXECUTED` | sí | no | `B2-INV-PS-020` |

## 10. Cómo ejecutar

```bash
node scripts/validate-block2-snippets.mjs
```

Salida esperada: `BLOCK2_SNIPPET_GATE=PASS` con recuentos por lenguaje y clasificación. Ante cualquier fallo, sale con código distinto de cero y lista de fallos accionables. El validador es B2-only y no altera la validación de B1.

## 11. Limitaciones honestas

- Los 11 elementos `PROSE_NOT_EXECUTABLE` y los 3 `UNSAFE_NOT_EXECUTED` **no se ejecutan por diseño**; por eso no se declara cobertura ejecutable del 100 %.
- Los dos elementos `PARSE_ONLY` solo se validan sintácticamente.
- Las versiones concretas de runtime usadas en esta ejecución fueron `Python 3.11.9` y `pwsh 7.6.6`; el validador admite otros ejecutables presentes en el sistema y reporta la versión efectiva.
