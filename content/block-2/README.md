# Bloque 2 — Automatización práctica con archivos y datos

**ID:** B2  
**Versión canónica de diseño:** `BLOCK2_CANONICAL_V1.0`  
**Estado:** especificación aprobada, aún no publicada en la web.  
**Lenguajes:** Python + PowerShell.  
**IA en runtime:** ninguna.

## Objetivo terminal

Al finalizar B1+B2, el alumno debe poder recibir una tarea local del tipo:

> «Revisa esta carpeta, procesa estos archivos, valida estos datos y genera un informe.»

y convertirla en un script razonablemente seguro, entendiendo tanto la implementación en Python como la equivalente en PowerShell.

La progresión pedagógica de B2 pasa de **diseñar una automatización** a **inspeccionar**, **modificar de forma segura**, **procesar datos**, **manejar errores**, **parametrizar**, **registrar** y finalmente **integrar todo en una herramienta reproducible**.

## Recuentos previstos

| Elemento | B2 |
| --- | ---: |
| Unidades | 12 |
| Conceptos | 72 |
| Preguntas | 240 |
| Flashcards | 96 |
| Prácticas guiadas | 11 |
| Proyecto integrado | 1 |

Las preguntas y flashcards todavía no se consideran bancos canónicos: se redactarán después de cerrar el contenido canónico de las 12 unidades.

---

## U01 — Diseñar una automatización antes de programarla

**Objetivo:** definir una tarea automatizable con alcance, entradas, salidas, precondiciones y efectos controlados antes de escribir código.

**Conceptos:**
- `B2-U01-AUTOMATION-SCOPE`: delimitar exactamente qué puede leer, crear, modificar o mover el script y qué queda fuera.
- `B2-U01-INPUT-OUTPUT-CONTRACT`: especificar entradas, formato y salida esperada.
- `B2-U01-PRECONDITIONS`: comprobar las condiciones necesarias antes de actuar.
- `B2-U01-SIDE-EFFECTS`: reconocer cambios observables fuera del cálculo interno.
- `B2-U01-IDEMPOTENCE`: diseñar una segunda ejecución que no duplique ni destruya trabajo.
- `B2-U01-DRY-RUN`: simular las acciones sin aplicarlas.

**Patrón mental:** observar → validar → planificar → ejecutar → verificar.

**Práctica:** diseñar la organización de una carpeta sin modificarla. El programa debe detectar candidatos, validar reglas y mostrar el plan.

**Errores a detectar:** modificar antes de validar, asumir rutas fijas, no separar consulta y modificación, y no prever una segunda ejecución.

---

## U02 — Rutas, carpetas y recorrido del sistema de archivos

**Objetivo:** construir y recorrer rutas de forma robusta, distinguiendo archivos y directorios y obteniendo metadatos útiles.

**Conceptos:**
- `B2-U02-PATH-COMPOSITION`: composición robusta de rutas.
- `B2-U02-PATH-EXISTENCE-TYPE`: existencia y tipo de ruta.
- `B2-U02-DIRECTORY-ENUMERATION`: enumeración de contenido.
- `B2-U02-RECURSION`: recorrido recursivo controlado.
- `B2-U02-FILE-METADATA`: nombre, extensión, tamaño, fechas y atributos.
- `B2-U02-DIRECTORY-CREATION`: creación segura de directorios.

**Python:** `pathlib.Path`, `exists()`, `is_file()`, `is_dir()`, `iterdir()`, `rglob()`, `stat()`, `mkdir()`.

**PowerShell:** `Join-Path`, `Test-Path`, `Get-Item`, `Get-ChildItem`, `-Recurse`, `New-Item`.

**Práctica:** generar un inventario de una carpeta con nombre, tipo, extensión y tamaño sin modificar nada.

**Error clave:** evitar concatenaciones frágiles de rutas como `"C:\carpeta\" + nombre`.

---

## U03 — Copiar, mover, renombrar y eliminar con seguridad

**Objetivo:** aplicar operaciones con efectos reales usando políticas explícitas de colisión, recuperación y validación.

**Conceptos:**
- `B2-U03-COPY`
- `B2-U03-MOVE`
- `B2-U03-RENAME`
- `B2-U03-DELETE`
- `B2-U03-COLLISION-POLICY`
- `B2-U03-BACKUP-ROLLBACK`

**Python:** `shutil.copy2()`, `shutil.move()`, `Path.rename()`, `Path.unlink()`.

**PowerShell:** `Copy-Item`, `Move-Item`, `Rename-Item`, `Remove-Item`.

**Práctica:** renombrar documentos por lotes mostrando primero `nombre_actual → nombre_propuesto` y aplicando solo tras la validación.

**Principio:** una automatización correcta debe saber exactamente qué va a cambiar antes de cambiarlo.

No se enseñará la eliminación recursiva indiscriminada como patrón normal.

---

## U04 — Archivos de texto y codificación

**Objetivo:** leer y escribir texto de forma predecible entendiendo codificación, saltos de línea y modos de apertura.

**Conceptos:**
- `B2-U04-TEXT-ENCODING`
- `B2-U04-TEXT-READ`
- `B2-U04-TEXT-WRITE`
- `B2-U04-TEXT-APPEND`
- `B2-U04-LINE-PROCESSING`
- `B2-U04-BOM-NEWLINES`

**Python:** `open(..., encoding="utf-8")`, context managers, `Path.read_text()`, `Path.write_text()`.

**PowerShell:** `Get-Content`, `Set-Content`, `Add-Content` y codificación explícita.

**Práctica:** procesar un log, eliminar líneas vacías, normalizar campos y generar un archivo nuevo sin alterar el original.

Debe quedar clara la diferencia entre leer texto completo, procesar por líneas y trabajar con datos estructurados.

---

## U05 — Datos tabulares con CSV

**Objetivo:** importar, validar, filtrar, transformar y exportar datos tabulares sencillos.

**Conceptos:**
- `B2-U05-CSV-STRUCTURE`
- `B2-U05-CSV-PARSE`
- `B2-U05-CSV-TYPES`
- `B2-U05-CSV-FILTER`
- `B2-U05-CSV-TRANSFORM`
- `B2-U05-CSV-EXPORT`

**Python:** `csv.DictReader` y `csv.DictWriter`.

**PowerShell:** `Import-Csv` y `Export-Csv`.

**Práctica:** procesar un inventario o fichero de incidencias, seleccionar registros, calcular un campo nuevo y generar un segundo CSV.

No se introduce todavía `pandas`: primero debe entenderse el modelo de registro tabular.

---

## U06 — Datos estructurados con JSON

**Objetivo:** trabajar con datos jerárquicos preservando tipos, estructura y validaciones mínimas.

**Conceptos:**
- `B2-U06-JSON-OBJECTS-ARRAYS`
- `B2-U06-JSON-PARSE`
- `B2-U06-JSON-SERIALIZE`
- `B2-U06-NESTED-ACCESS`
- `B2-U06-JSON-TYPES`
- `B2-U06-JSON-SHAPE-VALIDATION`

**Python:** `json.load`, `loads`, `dump`, `dumps`.

**PowerShell:** `ConvertFrom-Json`, `ConvertTo-Json`, incluido el significado de `-Depth`.

**Práctica:** leer una configuración JSON, validar campos obligatorios y generar un resumen legible.

Distinción fundamental: **texto que contiene JSON ≠ objeto ya deserializado**.

---

## U07 — Búsqueda de patrones y expresiones regulares

**Objetivo:** usar patrones cuando aportan valor real sin convertir regex en una solución universal.

**Conceptos:**
- `B2-U07-LITERAL-MATCH`
- `B2-U07-REGEX-ANCHORS`
- `B2-U07-REGEX-CHARACTER-CLASSES`
- `B2-U07-REGEX-QUANTIFIERS`
- `B2-U07-CAPTURE-GROUPS`
- `B2-U07-REGEX-REPLACE`

**Python:** `re.search`, `re.findall`, `re.sub`.

**PowerShell:** `-match`, `-replace`, `Select-String`, `$Matches`.

**Práctica:** localizar identificadores como `INC-2026-00421`, fechas o códigos y extraer únicamente registros válidos.

También se enseña cuándo no usar regex: una comparación literal debe preferirse cuando basta.

---

## U08 — Filtrar, transformar, ordenar, agrupar y resumir

**Objetivo:** convertir colecciones de registros en resultados útiles mediante pipelines legibles y verificables.

**Conceptos:**
- `B2-U08-FILTER`
- `B2-U08-TRANSFORM`
- `B2-U08-SORT`
- `B2-U08-GROUP`
- `B2-U08-DEDUPE`
- `B2-U08-AGGREGATE`

**Python:** listas, diccionarios, comprehensions, `sorted()`, `set()` y acumuladores.

**PowerShell:** `Where-Object`, `Select-Object`, `Sort-Object`, `Group-Object`, `Measure-Object`.

Punto clave: la pipeline de PowerShell transmite **objetos**, no simplemente texto formateado.

**Práctica:** procesar tickets por categoría, prioridad y estado; ordenar resultados y deduplicar por identificador.

---

## U09 — Validación, excepciones y códigos de salida

**Objetivo:** construir scripts que esperan fallos previsibles y terminan con un resultado inequívoco.

**Conceptos:**
- `B2-U09-INPUT-VALIDATION`
- `B2-U09-TRY-EXCEPT`
- `B2-U09-TRY-CATCH`
- `B2-U09-SPECIFIC-ERRORS`
- `B2-U09-FINALLY-CLEANUP`
- `B2-U09-EXIT-CODES`

**Python:** `FileNotFoundError`, `PermissionError`, `ValueError`, `JSONDecodeError`, códigos de salida.

**PowerShell:** `try/catch/finally`, `throw`, `-ErrorAction Stop`, `$LASTEXITCODE` cuando corresponda.

**Práctica:** procesar entradas que pueden contener una ruta inexistente, JSON mal formado o permisos insuficientes, produciendo mensajes útiles y salida coherente.

Se desaconseja explícitamente `except: pass` y sus equivalentes conceptuales.

---

## U10 — Scripts reutilizables y parámetros

**Objetivo:** convertir ejemplos aislados en herramientas reutilizables y configurables.

**Conceptos:**
- `B2-U10-ENTRYPOINT`
- `B2-U10-PARAMETERS`
- `B2-U10-DEFAULTS`
- `B2-U10-NAMED-ARGUMENTS`
- `B2-U10-RETURN-VS-OUTPUT`
- `B2-U10-MODULE-REUSE`

**Python:** `if __name__ == "__main__":` y `argparse` a nivel práctico.

**PowerShell:** `param(...)`, parámetros con nombre y validaciones sencillas como `ValidateSet`.

**Práctica:** convertir un script anterior en una herramienta invocable con ruta de entrada, salida y formato como parámetros.

---

## U11 — Automatizaciones fiables: logs, dry-run e idempotencia

**Objetivo:** implementar observabilidad, simulación y control de repetición.

**Conceptos:**
- `B2-U11-LOGGING`
- `B2-U11-TIMESTAMPS`
- `B2-U11-LOG-LEVELS`
- `B2-U11-DRY-RUN-IMPLEMENTATION`
- `B2-U11-IDEMPOTENT-CHANGES`
- `B2-U11-EXECUTION-SUMMARY`

**Python:** módulo `logging` a nivel básico.

**PowerShell:** `Write-Verbose`, `Write-Warning`, `Write-Error` y registro explícito cuando proceda.

**Práctica:** convertir una operación por lotes en **PLAN → revisión → APPLY → informe final** y volver a ejecutarla para confirmar que no duplica ni destruye trabajo.

---

## U12 — Proyecto integrado: auditor y organizador seguro de archivos

**Objetivo:** conectar todo B2 en una herramienta reproducible.

**Conceptos:**
- `B2-U12-PIPELINE-STAGES`
- `B2-U12-RECORD-SCHEMA`
- `B2-U12-PLAN-APPLY`
- `B2-U12-CHANGE-JOURNAL`
- `B2-U12-POSTCONDITION-VERIFY`
- `B2-U12-REPRODUCIBLE-REPORT`

**Proyecto final:** auditor y organizador seguro de archivos.

Debe:
1. recibir una carpeta como entrada;
2. recorrer archivos y subdirectorios;
3. extraer metadatos;
4. clasificar mediante reglas explícitas;
5. generar informes CSV y JSON;
6. ofrecer `dry-run`;
7. crear directorios y mover archivos solo si se activa la modificación;
8. no borrar archivos;
9. resolver colisiones de nombres;
10. registrar cada acción;
11. verificar postcondiciones;
12. soportar una segunda ejecución sin desorganizar lo ya procesado.

Habrá una implementación de referencia en Python y otra en PowerShell. La meta es comprender el diseño común, no memorizar dos soluciones.

---

## Plan del banco de preguntas

Cada unidad tendrá **20 preguntas**:

- 18 preguntas primarias: tres por cada uno de los seis conceptos.
- 2 preguntas de integración entre conceptos.

Total: **240 preguntas**.

### Dificultad

| Nivel | Por unidad | Total |
| --- | ---: | ---: |
| 1 — reconocimiento/comprensión | 5 | 60 |
| 2 — aplicación | 9 | 108 |
| 3 — diagnóstico/decisión | 6 | 72 |
| **Total** | **20** | **240** |

Cada pregunta tendrá cuatro opciones y exactamente una respuesta correcta.

Las familias de pregunta serán:
- comprensión conceptual;
- lectura de código;
- predicción de resultado;
- detección/corrección de errores;
- selección de la operación segura;
- resolución de escenarios reales breves.

Los snippets ejecutables se validarán automáticamente cuando sea seguro hacerlo. Los distractores difíciles deberán representar errores plausibles de razonamiento, no respuestas absurdas.

---

## Plan de flashcards

**8 tarjetas por unidad = 96.**

Las primeras seis garantizarán al menos una tarjeta por concepto. Las dos restantes reforzarán relaciones útiles, por ejemplo:

- dry-run ↔ apply;
- JSON texto ↔ objeto;
- return ↔ output;
- try/except ↔ try/catch;
- ruta absoluta ↔ ruta relativa.

Solo se marcará una tarjeta como reversible cuando la pregunta inversa siga teniendo una interpretación única y útil.

Las tarjetas no deben ser copias mecánicas de las preguntas de test.

---

## Patrón de práctica

Cada unidad seguirá, cuando sea aplicable:

**problema → ejemplo mínimo → práctica guiada → variante → error deliberado → corrección → mini-reto**

La dificultad práctica crece de forma deliberada:

- U01 diseña sin modificar.
- U02 inspecciona.
- U03 empieza a modificar.
- U04 procesa texto.
- U05-U06 trabajan con datos estructurados.
- U07 extrae información.
- U08 transforma conjuntos de datos.
- U09 aprende a fallar correctamente.
- U10 convierte código en herramienta.
- U11 la hace segura y observable.
- U12 integra todo.

---

## Fuera de alcance de B2

Se reserva para bloques posteriores:

- bases de datos y SQL;
- APIs HTTP/REST;
- autenticación;
- programación orientada a objetos;
- concurrencia y async;
- frameworks web;
- packaging avanzado;
- Docker;
- automatización cloud;
- CI/CD;
- Git avanzado.

La exclusión es deliberada para conservar una progresión pedagógica estable.

---

## Criterios para cerrar B2

B2 no se considerará listo para producción hasta que:

1. las 12 unidades estén redactadas canónicamente;
2. existan exactamente 72 conceptos con definición;
3. cada concepto tenga cobertura en tests;
4. cada concepto tenga al menos una flashcard;
5. existan exactamente 240 preguntas con respuesta única defendible;
6. existan exactamente 96 flashcards;
7. los snippets ejecutables se validen automáticamente cuando sea posible;
8. los ejemplos destructivos sean seguros por defecto;
9. todas las unidades contengan práctica;
10. U12 reutilice conceptos previos sin introducir tecnologías nuevas de forma encubierta;
11. se mantenga cero dependencia de IA/LLM en runtime;
12. pase una auditoría de contenido y QA equivalente o superior a B1.

## Estado de publicación

Esta rama existe para conservar y desarrollar B2 en GitHub **sin incorporarlo todavía a la web de producción**. La integración en `main` y la publicación en Cloudflare se harán únicamente cuando el contenido y los gates de B2 estén completos.
