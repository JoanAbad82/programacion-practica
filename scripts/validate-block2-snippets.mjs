// Validador autocontenido de snippets ejecutables del Bloque 2 (B2).
// Valida exclusivamente content/block-2/snippets, no altera B1 y NO modifica el
// arbol de trabajo del repositorio: todo caso con mutacion corre en un directorio
// temporal unico que se elimina en un bloque finally.
// Uso: node scripts/validate-block2-snippets.mjs
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const SNIPPETS_DIR = path.join(ROOT, "content", "block-2", "snippets");
const CASES_FILE = path.join(SNIPPETS_DIR, "snippet-cases.json");
const INVENTORY_FILE = path.join(SNIPPETS_DIR, "inventory.json");

const EXPECTED = {
  registryVersion: "B2_SNIPPET_CASES_V1.0",
  inventoryVersion: "B2_SNIPPET_INVENTORY_V1.0",
  blockId: "B2",
};

const LANGUAGES = ["PYTHON", "POWERSHELL"];
const CLASSIFICATIONS = [
  "EXECUTE_SAFE_PURE",
  "EXECUTE_SAFE_TEMP_MUTATION",
  "PARSE_ONLY",
  "PROSE_NOT_EXECUTABLE",
  "UNSAFE_NOT_EXECUTED",
];
const EXECUTABLE = new Set(["EXECUTE_SAFE_PURE", "EXECUTE_SAFE_TEMP_MUTATION"]);
const RESULT_PREFIX = "RESULT:";
const TEMP_ENV_VAR = "B2_SNIPPET_TEMP";
const CASE_TIMEOUT_MS = 20000;
const IGNORED_TOP_LEVEL = new Set(["node_modules", ".git", ".next", "out", "test-results", ".turbo", "dist"]);

// Reglas estaticas de rechazo. Un caso ejecutable que coincida con cualquiera de
// estas reglas se rechaza ANTES de correr. Los casos UNSAFE_NOT_EXECUTED deben
// coincidir con al menos una (control positivo de que el deny-check funciona).
const DENY_RULES = [
  { id: "py-rmtree", languages: ["PYTHON"], pattern: /shutil\.rmtree\b/, reason: "borrado recursivo" },
  { id: "py-os-delete", languages: ["PYTHON"], pattern: /\bos\.(remove|unlink|rmdir|removedirs|walk)\b/, reason: "borrado fuera del fixture temporal" },
  { id: "py-shell-process", languages: ["PYTHON"], pattern: /(\bos\.system\b|\bsubprocess\b|\bos\.popen\b|\bos\.exec)/, reason: "ejecucion de procesos/shell" },
  { id: "py-except-pass", languages: ["PYTHON"], pattern: /except\s*(Exception\s*)?:/, reason: "manejador amplio/silencioso (oculta el error real)" },
  { id: "py-ctypes", languages: ["PYTHON"], pattern: /\b(ctypes|winreg|shutil\.rmtree)\b/, reason: "acceso de bajo nivel al sistema" },
  { id: "ps-remove-recurse", languages: ["POWERSHELL"], pattern: /Remove-Item\b[^\n]*-Recurse/, reason: "borrado recursivo" },
  { id: "ps-recurse-force", languages: ["POWERSHELL"], pattern: /-Recurse[^\n]*-Force/, reason: "borrado recursivo forzado" },
  { id: "ps-move-force", languages: ["POWERSHELL"], pattern: /Move-Item\b[^\n]*-Force/, reason: "sobrescritura silenciosa sin politica de colision" },
  { id: "ps-disk", languages: ["POWERSHELL"], pattern: /\b(Format-Volume|Clear-Disk|Format-|Initialize-Disk|Set-Disk)\b/, reason: "mutacion de disco" },
  { id: "network", languages: ["PYTHON", "POWERSHELL"], pattern: /(Invoke-WebRequest|Invoke-RestMethod|\biwr\b|\birm\b|Start-BitsTransfer|\bcurl\b|\bwget\b|urllib|requests\.|socket\.|\bhttps?:\/\/)/i, reason: "acceso de red" },
  { id: "process-control", languages: ["PYTHON", "POWERSHELL"], pattern: /(Start-Process|Stop-Process|Kill-Process|taskkill|Get-Process[^\n]*Stop)/i, reason: "control de procesos" },
  { id: "services-tasks", languages: ["POWERSHELL"], pattern: /(schtasks|Register-ScheduledTask|New-Service|sc\.exe|Set-Service|New-ScheduledTask)/i, reason: "servicios/tareas programadas" },
  { id: "package-install", languages: ["PYTHON", "POWERSHELL"], pattern: /(Install-Module|Install-Package|pip\s+install|npm\s+install|winget|choco|Install-WindowsFeature)/i, reason: "instalacion de paquetes" },
  { id: "registry", languages: ["POWERSHELL"], pattern: /(Set-ItemProperty[^\n]*(HK|\\Registry)|New-ItemProperty[^\n]*(HK|\\Registry)|reg\s+add|\bHKLM:|\bHKCU:)/i, reason: "mutacion del registro" },
  { id: "env-persistence", languages: ["PYTHON", "POWERSHELL"], pattern: /(\[Environment\]::SetEnvironmentVariable|\$env:[A-Za-z_][A-Za-z0-9_]*\s*=)/, reason: "persistencia de entorno" },
  { id: "home-profile", languages: ["PYTHON", "POWERSHELL"], pattern: /(\$HOME|\$env:USERPROFILE|\$env:APPDATA|%USERPROFILE%|~[\\/])/i, reason: "mutacion de perfil de usuario" },
  { id: "absolute-path", languages: ["PYTHON", "POWERSHELL"], pattern: /([A-Za-z]:\\)|(\/(usr|etc|var|bin|tmp)\/)/, reason: "ruta absoluta fijada en duro" },
  { id: "parent-traversal", languages: ["PYTHON", "POWERSHELL"], pattern: /(["']\.\.[\\/])/, reason: "travesia de directorios fuera del fixture temporal" },
  { id: "chdir", languages: ["PYTHON", "POWERSHELL"], pattern: /(os\.chdir|Set-Location|Push-Location)/i, reason: "cambio de directorio de trabajo" },
];

const STATE = {
  checks: 0,
  executedPure: 0,
  executedTemp: 0,
  parseOnly: 0,
  unsafe: 0,
  prose: 0,
  assertions: 0,
  assertionFailures: 0,
};

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const stripAnsi = (text) => text.replace(/\u001b\[[0-9;]*m/g, "");

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
    }
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    return ka.length === kb.length && ka.every((key, index) => key === kb[index] && deepEqual(a[key], b[key]));
  }
  return false;
}

function runProcess(command, args, options = {}) {
  const { cwd, env, input, timeoutMs = CASE_TIMEOUT_MS } = options;
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, { cwd, env, windowsHide: true });
    } catch (err) {
      resolve({ code: null, timedOut: false, spawnError: err, stdout: "", stderr: String(err) });
      return;
    }
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code: null, timedOut, stdout, stderr, spawnError: null, ...payload });
    };
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill();
      } catch {
        /* ignore */
      }
    }, timeoutMs);
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (err) => finish({ code: null, spawnError: err, stderr: `${stderr}${err}` }));
    child.on("close", (code, signal) => finish({ code, signal }));
    if (input !== undefined) {
      try {
        child.stdin.write(input);
      } catch {
        /* ignore */
      }
    }
    try {
      child.stdin.end();
    } catch {
      /* ignore */
    }
  });
}

function resolveRuntime(candidates, versionArgs) {
  for (const command of candidates) {
    const result = spawnSync(command, versionArgs, { encoding: "utf8", windowsHide: true, timeout: 15000 });
    if (result.error || result.status !== 0) continue;
    const version = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split(/\r?\n/)[0]?.trim();
    if (version) return { command, version };
  }
  return null;
}

function matchDenyRules(language, code) {
  return DENY_RULES.filter((rule) => rule.languages.includes(language) && rule.pattern.test(code));
}

function psEncodedCommand(script) {
  return Buffer.from(script, "utf16le").toString("base64");
}

function psParseScript(codeBase64) {
  return [
    `$src = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${codeBase64}'))`,
    "$tokens = $null; $errors = $null",
    "[void][System.Management.Automation.Language.Parser]::ParseInput($src, [ref]$tokens, [ref]$errors)",
    "if ($errors.Count -gt 0) { $errors | ForEach-Object { [Console]::Error.WriteLine($_.Message) }; exit 1 }",
    "exit 0",
  ].join("\n");
}

function extractResult(stdout) {
  const lines = stripAnsi(stdout).split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const index = lines[i].indexOf(RESULT_PREFIX);
    if (index !== -1) {
      return JSON.parse(lines[i].slice(index + RESULT_PREFIX.length).trim());
    }
  }
  return null;
}

async function listFilesRecursive(dir, base = dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full) || entry.name;
    if (entry.isDirectory()) {
      out.push(`${rel}/`);
      out.push(...(await listFilesRecursive(full, base)));
    } else {
      out.push(rel);
    }
  }
  return out;
}

async function repoFingerprint() {
  const files = [];
  const walk = async (dir, rel) => {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      const top = relPath.split("/")[0];
      if (IGNORED_TOP_LEVEL.has(top)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full, relPath);
      else if (entry.isFile()) {
        const bytes = await readFile(full);
        files.push([relPath, createHash("sha256").update(bytes).digest("hex")]);
      }
    }
  };
  await walk(ROOT, "");
  files.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const git = spawnSync("git", ["status", "--porcelain=v1", "-z"], { cwd: ROOT, encoding: "utf8", windowsHide: true });
  const gitStatus = git.error || git.status !== 0 ? "GIT_UNAVAILABLE" : git.stdout;
  return { gitStatus, files };
}

async function main() {
  const failures = [];
  const fail = (message) => failures.push(message);

  const registry = await readJson(CASES_FILE);
  const inventory = await readJson(INVENTORY_FILE);
  const cases = registry.cases ?? [];
  const items = inventory.items ?? [];

  // ---- Registry schema ----
  if (registry.registryVersion !== EXPECTED.registryVersion) fail(`registryVersion esperado ${EXPECTED.registryVersion}, recibido ${registry.registryVersion}`);
  if (registry.blockId !== EXPECTED.blockId) fail("registry.blockId debe ser B2");
  if (!Array.isArray(cases) || cases.length === 0) fail("registry.cases vacio o invalido");
  if (!registry.runtimeRequirements?.python || !registry.runtimeRequirements?.powershell) fail("runtimeRequirements incompleto");

  // ---- Inventory schema ----
  if (inventory.inventoryVersion !== EXPECTED.inventoryVersion) fail("inventoryVersion inesperado");
  if (inventory.blockId !== EXPECTED.blockId) fail("inventory.blockId debe ser B2");
  if (!Array.isArray(items) || items.length === 0) fail("inventory.items vacio o invalido");

  const itemById = new Map();
  for (const item of items) {
    if (!item.id || itemById.has(item.id)) fail(`inventory item id invalido o duplicado: ${item.id}`);
    itemById.set(item.id, item);
    if (!CLASSIFICATIONS.includes(item.classification)) fail(`inventory ${item.id}: clasificacion invalida ${item.classification}`);
    if (!["PYTHON", "POWERSHELL", "COMMON"].includes(item.language)) fail(`inventory ${item.id}: lenguaje invalido ${item.language}`);
    if (!Array.isArray(item.sourceRefs) || item.sourceRefs.length === 0) fail(`inventory ${item.id}: sin sourceRefs`);
  }

  // ---- Source reference validation ----
  const refTextCache = new Map();
  const fileText = async (rel) => {
    if (!refTextCache.has(rel)) {
      const text = await readFile(path.join(ROOT, rel), "utf8").catch(() => null);
      refTextCache.set(rel, text);
    }
    return refTextCache.get(rel);
  };
  const validateRefs = async (where, refs) => {
    if (!Array.isArray(refs) || refs.length === 0) {
      fail(`${where}: sourceRefs vacio`);
      return;
    }
    for (const ref of refs) {
      if (!ref?.file) {
        fail(`${where}: sourceRef con file ausente`);
        continue;
      }
      const text = await fileText(ref.file);
      if (text === null) {
        fail(`${where}: sourceRef apunta a archivo inexistente ${ref.file}`);
        continue;
      }
      if (ref.itemId && !text.includes(ref.itemId)) {
        fail(`${where}: itemId ${ref.itemId} no aparece en ${ref.file}`);
      }
    }
  };
  for (const item of items) await validateRefs(`inventory ${item.id}`, item.sourceRefs);

  // ---- Case schema + cross-checks ----
  const caseIds = new Set();
  const coveredItems = new Set();
  for (const testCase of cases) {
    const where = `case ${testCase.id}`;
    if (!testCase.id) fail("case sin id");
    if (caseIds.has(testCase.id)) fail(`${where}: id duplicado`);
    caseIds.add(testCase.id);
    if (!LANGUAGES.includes(testCase.language)) fail(`${where}: lenguaje invalido ${testCase.language}`);
    if (!CLASSIFICATIONS.includes(testCase.classification)) fail(`${where}: clasificacion invalida ${testCase.classification}`);
    if (!testCase.purpose?.trim()) fail(`${where}: purpose vacio`);
    if (typeof testCase.code !== "string" || !testCase.code.trim()) fail(`${where}: code vacio`);
    if (typeof testCase.expect !== "object" || testCase.expect === null) fail(`${where}: expect invalido`);
    for (const flag of ["destructive", "tempOnly", "mutation"]) {
      if (typeof testCase[flag] !== "boolean") fail(`${where}: ${flag} debe ser booleano`);
    }
    if (!Array.isArray(testCase.inventoryIds) || testCase.inventoryIds.length === 0) {
      fail(`${where}: sin inventoryIds`);
    } else {
      for (const inventoryId of testCase.inventoryIds) {
        const item = itemById.get(inventoryId);
        if (!item) {
          fail(`${where}: inventoryId inexistente ${inventoryId}`);
          continue;
        }
        if (item.language !== testCase.language) fail(`${where}: inventoryId ${inventoryId} es ${item.language}, no ${testCase.language}`);
        coveredItems.add(inventoryId);
      }
    }
    await validateRefs(where, testCase.sourceRefs);

    if (EXECUTABLE.has(testCase.classification)) {
      if (!Number.isInteger(testCase.expectExitCode)) fail(`${where}: expectExitCode debe ser entero`);
      if (Object.keys(testCase.expect).length === 0) fail(`${where}: expect vacio para caso ejecutable`);
      const isTemp = testCase.classification === "EXECUTE_SAFE_TEMP_MUTATION";
      if (testCase.tempOnly !== isTemp) fail(`${where}: tempOnly debe ser ${isTemp} para ${testCase.classification}`);
      if (isTemp && !testCase.code.includes(TEMP_ENV_VAR)) fail(`${where}: caso de mutacion no usa ${TEMP_ENV_VAR}`);
      if (testCase.classification === "EXECUTE_SAFE_PURE" && testCase.mutation) fail(`${where}: caso puro no debe declarar mutation`);
    } else {
      if (testCase.expectExitCode !== null) fail(`${where}: expectExitCode debe ser null para ${testCase.classification}`);
      if (testCase.tempOnly) fail(`${where}: ${testCase.classification} no debe ser tempOnly`);
      if (Object.keys(testCase.expect).length !== 0) fail(`${where}: ${testCase.classification} no debe declarar expect`);
    }

    // Deny checks.
    const matches = matchDenyRules(testCase.language, testCase.code);
    if (testCase.classification === "UNSAFE_NOT_EXECUTED") {
      if (matches.length === 0) fail(`${where}: UNSAFE_NOT_EXECUTED no coincide con ninguna regla de rechazo (control invalido)`);
    } else if (matches.length > 0) {
      fail(`${where}: rechazado por deny-check (${matches.map((rule) => rule.id).join(", ")})`);
    }
  }

  // Coverage: cada item ejecutable/parse-only debe estar cubierto por algun caso.
  for (const item of items) {
    if (["EXECUTE_SAFE_PURE", "EXECUTE_SAFE_TEMP_MUTATION", "PARSE_ONLY"].includes(item.classification) && !coveredItems.has(item.id)) {
      fail(`inventory ${item.id} (${item.classification}) no esta cubierto por ningun caso`);
    }
  }

  // ---- Runtimes ----
  const python = resolveRuntime(registry.runtimeRequirements.python.candidates, registry.runtimeRequirements.python.versionArgs);
  const powershell = resolveRuntime(registry.runtimeRequirements.powershell.candidates, registry.runtimeRequirements.powershell.versionArgs);
  if (!python) fail("No se encontro un interprete Python ejecutable (python/python3/py)");
  if (!powershell) fail("No se encontro PowerShell ejecutable (pwsh/powershell)");
  const runtime = { PYTHON: python, POWERSHELL: powershell };

  // ---- Repo mutation guard: snapshot ----
  const fingerprintBefore = await repoFingerprint();

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "b2-snippet-"));
  const casesDir = path.join(tempRoot, "cases");
  const runnersDir = path.join(tempRoot, "runners");
  await mkdir(casesDir, { recursive: true });
  await mkdir(runnersDir, { recursive: true });

  try {
    for (const testCase of cases) {
      if (!runtime[testCase.language]) continue;
      STATE.checks += 1;
      const where = `case ${testCase.id}`;
      const codeBase64 = Buffer.from(testCase.code, "utf8").toString("base64");

      // Syntax/parse validation (no ejecuta el codigo).
      if (testCase.language === "PYTHON") {
        const parse = await runProcess(
          runtime.PYTHON.command,
          ["-c", "import base64,sys,ast; ast.parse(base64.b64decode(sys.stdin.buffer.read()).decode('utf-8'))"],
          { cwd: runnersDir, input: codeBase64 },
        );
        if (parse.code !== 0) fail(`${where}: PYTHON no parsea (${stripAnsi(parse.stderr).trim().split(/\r?\n/)[0] ?? "sin detalle"})`);
      } else {
        const parse = await runProcess(
          runtime.POWERSHELL.command,
          ["-NoProfile", "-EncodedCommand", psEncodedCommand(psParseScript(codeBase64))],
          { cwd: runnersDir },
        );
        if (parse.code !== 0) fail(`${where}: POWERSHELL no parsea (${stripAnsi(parse.stderr).trim().split(/\r?\n/)[0] ?? "sin detalle"})`);
      }

      if (!EXECUTABLE.has(testCase.classification)) {
        if (testCase.classification === "PARSE_ONLY") STATE.parseOnly += 1;
        continue;
      }

      // Rechazo estatico antes de ejecutar (defensa en profundidad).
      if (matchDenyRules(testCase.language, testCase.code).length > 0) {
        fail(`${where}: rechazado por deny-check antes de ejecutar`);
        continue;
      }

      const caseDir = path.join(casesDir, testCase.id);
      await mkdir(caseDir, { recursive: true });
      const env = { ...process.env, [TEMP_ENV_VAR]: caseDir, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" };

      let run;
      if (testCase.language === "PYTHON") {
        const runner = path.join(runnersDir, `${testCase.id}.py`);
        await writeFile(runner, testCase.code, "utf8");
        run = await runProcess(runtime.PYTHON.command, [runner], { cwd: caseDir, env });
      } else {
        const psCode = "$OutputEncoding = [System.Text.UTF8Encoding]::new($false); [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)\n" + testCase.code;
        run = await runProcess(
          runtime.POWERSHELL.command,
          ["-NoProfile", "-EncodedCommand", psEncodedCommand(psCode)],
          { cwd: caseDir, env },
        );
      }

      if (run.timedOut) {
        fail(`${where}: timeout tras ${CASE_TIMEOUT_MS} ms`);
        continue;
      }
      if (run.spawnError) {
        fail(`${where}: no se pudo lanzar el proceso (${run.spawnError})`);
        continue;
      }
      if (run.code !== testCase.expectExitCode) {
        fail(`${where}: exit code esperado ${testCase.expectExitCode}, obtenido ${run.code}`);
      }

      let parsed = null;
      try {
        parsed = extractResult(run.stdout);
      } catch (err) {
        fail(`${where}: RESULT no es JSON valido (${err.message})`);
      }
      if (parsed === null) {
        fail(`${where}: no se encontro una linea ${RESULT_PREFIX} en stdout`);
      } else {
        for (const [key, expected] of Object.entries(testCase.expect)) {
          STATE.assertions += 1;
          if (!(key in parsed)) {
            STATE.assertionFailures += 1;
            fail(`${where}: falta la clave '${key}' en el resultado`);
          } else if (!deepEqual(parsed[key], expected)) {
            STATE.assertionFailures += 1;
            fail(`${where}: '${key}' esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(parsed[key])}`);
          }
        }
      }

      // Prueba de aislamiento: la mutacion solo puede ocurrir dentro del fixture temporal.
      const created = await listFilesRecursive(caseDir);
      if (testCase.classification === "EXECUTE_SAFE_PURE") {
        STATE.executedPure += 1;
        if (created.length > 0) fail(`${where}: caso puro creo archivos (${created.join(", ")})`);
      } else {
        STATE.executedTemp += 1;
        if (created.length === 0) fail(`${where}: caso de mutacion no creo nada dentro del fixture temporal`);
        for (const rel of created) {
          const resolved = path.resolve(caseDir, rel);
          if (!resolved.startsWith(path.resolve(tempRoot) + path.sep)) {
            fail(`${where}: artefacto fuera del temp root: ${resolved}`);
          }
        }
      }
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  }

  // ---- Repo mutation guard: verify ----
  const fingerprintAfter = await repoFingerprint();
  const repoGuardPass = fingerprintBefore.gitStatus === fingerprintAfter.gitStatus
    && fingerprintBefore.files.length === fingerprintAfter.files.length
    && fingerprintBefore.files.every((entry, index) => entry[0] === fingerprintAfter.files[index][0] && entry[1] === fingerprintAfter.files[index][1]);
  if (!repoGuardPass) {
    fail("REPO_MUTATION_GUARD=FAIL: el arbol de trabajo del repositorio cambio durante la validacion");
  }

  // ---- Counts ----
  const counts = {
    inventoryTotal: items.length,
    casesTotal: cases.length,
    pythonCases: cases.filter((c) => c.language === "PYTHON").length,
    powershellCases: cases.filter((c) => c.language === "POWERSHELL").length,
    pure: items.filter((i) => i.classification === "EXECUTE_SAFE_PURE").length,
    tempMutation: items.filter((i) => i.classification === "EXECUTE_SAFE_TEMP_MUTATION").length,
    parseOnly: items.filter((i) => i.classification === "PARSE_ONLY").length,
    unsafe: items.filter((i) => i.classification === "UNSAFE_NOT_EXECUTED").length,
    prose: items.filter((i) => i.classification === "PROSE_NOT_EXECUTABLE").length,
    destructiveRegistered: cases.filter((c) => c.destructive).length,
    destructiveExecutedTempOnly: cases.filter((c) => c.destructive && c.classification === "EXECUTE_SAFE_TEMP_MUTATION").length,
    destructiveUnsafeNotExecuted: cases.filter((c) => c.destructive && c.classification === "UNSAFE_NOT_EXECUTED").length,
  };
  STATE.prose = counts.prose;
  STATE.unsafe = cases.filter((c) => c.classification === "UNSAFE_NOT_EXECUTED").length;

  if (STATE.executedPure !== counts.pure) fail(`casos ejecutados puros ${STATE.executedPure} != items puros ${counts.pure}`);
  if (STATE.executedTemp !== counts.tempMutation) fail(`casos ejecutados con mutacion ${STATE.executedTemp} != items con mutacion ${counts.tempMutation}`);
  if (STATE.parseOnly !== counts.parseOnly) fail(`casos parse-only ${STATE.parseOnly} != items parse-only ${counts.parseOnly}`);

  const passed = failures.length === 0;
  if (!passed) {
    console.error("BLOCK2_SNIPPET_GATE=FAIL");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("BLOCK2_SNIPPET_GATE=PASS");
  console.log(`PYTHON_RUNTIME=${python.command} ${python.version}`);
  console.log(`POWERSHELL_RUNTIME=${powershell.command} ${powershell.version}`);
  console.log(`INVENTORY_TOTAL=${counts.inventoryTotal}`);
  console.log(`CASES_TOTAL=${counts.casesTotal}`);
  console.log(`PYTHON_CASES=${counts.pythonCases}`);
  console.log(`POWERSHELL_CASES=${counts.powershellCases}`);
  console.log(`EXECUTED_SAFE_PURE=${STATE.executedPure}`);
  console.log(`EXECUTED_SAFE_TEMP_MUTATION=${STATE.executedTemp}`);
  console.log(`PARSE_ONLY=${STATE.parseOnly}`);
  console.log(`UNSAFE_NOT_EXECUTED=${STATE.unsafe}`);
  console.log(`PROSE_NOT_EXECUTABLE=${STATE.prose}`);
  console.log(`DESTRUCTIVE_REGISTERED=${counts.destructiveRegistered}`);
  console.log(`DESTRUCTIVE_EXECUTED_TEMP_ONLY=${counts.destructiveExecutedTempOnly}`);
  console.log(`DESTRUCTIVE_UNSAFE_NOT_EXECUTED=${counts.destructiveUnsafeNotExecuted}`);
  console.log(`ASSERTIONS_PASS=${STATE.assertions}/${STATE.assertions}`);
  console.log("TEMP_ONLY_GUARD=PASS");
  console.log("REPO_MUTATION_GUARD=PASS");
  console.log("DENY_CHECK=PASS");
}

main().catch((err) => {
  console.error("BLOCK2_SNIPPET_GATE=FAIL");
  console.error(err);
  process.exit(1);
});
