/**
 * RC1 independent content audit for Bloque 1.
 *
 * scripts/validate-content.mjs guarantees the structural contract (counts, IDs,
 * quotas, integrity). This audit adds semantic checks that a structural
 * validator cannot see:
 *
 *   1. duplicate or near-duplicate prompts;
 *   2. options that are functionally identical (same Python AST);
 *   3. distractors that are syntactically valid in a "which one is correct" item;
 *   4. explanations that quote a distractor verbatim (contradiction);
 *   5. Python snippets that are executed to compare real stdout with the
 *      expected answer of "what will be printed" questions;
 *   6. flashcard duplication (front/back);
 *   7. concepts that are not backed by their canonical unit text;
 *   8. code fences whose language contradicts the question language.
 *
 * Usage: node scripts/rc1-content-audit.mjs [--out qa/RC1_CONTENT_AUDIT.json]
 *
 * Exit code 0 when no blocker-level finding remains, 1 otherwise. Warnings are
 * reported for human review and never mutate the content bank.
 */

import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadBlock1 } from "./content-validation-lib.mjs";

const root = process.cwd();
const EXPECTED = { units: 12, concepts: 56, questions: 200, flashcards: 80 };

const STOPWORDS = new Set([
  "para", "como", "que", "los", "las", "una", "uno", "unos", "unas", "del", "con",
  "por", "sin", "sobre", "entre", "este", "esta", "estos", "estas", "ese", "esa",
  "mas", "menos", "pero", "porque", "cuando", "donde", "tambien", "todos", "toda",
  "todas", "todo", "ningun", "ninguna", "hay", "ser", "son", "esta", "estan",
  "hace", "hacer", "siguiente", "siguientes", "opcion", "opciones", "correcta",
  "correcto", "incorrecta", "incorrecto", "ejemplo", "ejemplos", "solo", "cada",
  "mismo", "misma", "usar", "usa", "utiliza", "utilizar", "the", "and", "for",
  "with", "from", "this", "that",
]);

const blockers = [];
const warnings = [];
const evidence = {};

const block = (check, id, message) => blockers.push({ check, id, message });
const warn = (check, id, message) => warnings.push({ check, id, message });

const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("es");

const removeAccents = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const words = (value, keepNumbers = false) =>
  removeAccents(normalize(value))
    .replace(/[^a-z0-9_$\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 || keepNumbers);

const contentWords = (value, keepNumbers = false) =>
  new Set(words(value, keepNumbers).filter((token) => !STOPWORDS.has(token)));

const jaccard = (a, b) => {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  return shared / (a.size + b.size - shared);
};

const FENCE = /```([a-zA-Z-]*)\n([\s\S]*?)```/g;
const INLINE = /`([^`\n]+)`/g;
const BARE_CODE = /^`([^`\n]+)`$/;

const fences = (value) => {
  const found = [];
  for (const match of String(value ?? "").matchAll(FENCE)) {
    found.push({ language: (match[1] || "text").toLocaleLowerCase("en"), code: match[2] });
  }
  return found;
};

const inlineSpans = (value) =>
  [...String(value ?? "").matchAll(INLINE)].map((match) => match[1]);

const correctOption = (question) =>
  question.options.find((option) => option.id === question.correctOptionId);

const UNSAFE_CODE = /\b(input|open|import|eval|exec|__\w+|while\s+True|socket|requests|subprocess)\b/;

const PYTHON_HELPER = [
  "import ast, hashlib, json, subprocess, sys",
  "cases = json.load(sys.stdin)",
  "results = []",
  "for case in cases:",
  "    item = {'id': case['id']}",
  "    code = case['code']",
  "    if case.get('syntax'):",
  "        try:",
  "            tree = ast.parse(code)",
  "            item['syntax'] = 'OK'",
  "            item['ast'] = hashlib.sha256(ast.dump(tree).encode('utf-8')).hexdigest()",
  "        except SyntaxError as error:",
  "            item['syntax'] = 'ERROR'",
  "            item['message'] = '%s: %s' % (type(error).__name__, error.msg)",
  "    if case.get('run'):",
  "        try:",
  "            proc = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, timeout=20)",
  "            item['returncode'] = proc.returncode",
  "            item['stdout'] = proc.stdout.strip()",
  "            item['stderr'] = (proc.stderr.strip().splitlines() or [''])[-1]",
  "        except subprocess.TimeoutExpired:",
  "            item['timeout'] = True",
  "    results.append(item)",
  "json.dump(results, sys.stdout)",
].join("\n");

function resolvePython() {
  for (const candidate of ["python", "python3", "py"]) {
    const probe = spawnSync(candidate, ["-c", "print(1)"], { encoding: "utf8" });
    if (!probe.error && probe.status === 0) return candidate;
  }
  return null;
}

const python = resolvePython();

function runPythonCases(cases) {
  if (!python || cases.length === 0) return [];
  const result = spawnSync(python, ["-c", PYTHON_HELPER], {
    input: JSON.stringify(cases),
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || !result.stdout) {
    warn("python-helper", "audit", `Python helper failed: ${result.error?.message ?? result.stderr?.slice(0, 200)}`);
    return [];
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    warn("python-helper", "audit", "Python helper returned invalid JSON");
    return [];
  }
}

function powerShellParseErrors(code, id) {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$code = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${Buffer.from(code, "utf8").toString("base64")}'))`,
    "$tokens = $null; $errors = $null",
    "[System.Management.Automation.Language.Parser]::ParseInput($code, [ref]$tokens, [ref]$errors) | Out-Null",
    "if ($errors -and $errors.Count -gt 0) { 'ERROR' } else { 'OK' }",
  ].join("; ");
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")],
    { encoding: "utf8", timeout: 30000 },
  );
  if (result.error) {
    warn("powershell-parser", id, `PowerShell parser unavailable: ${result.error.message}`);
    return null;
  }
  return (result.stdout ?? "").trim() === "OK" ? [] : ["syntax error"];
}

// 0. Release hygiene: required canonical assets must be committable ---------
const requiredAssets = [
  "content/block-1/manifest.json",
  "content/block-1/integrity.json",
  "content/block-1/coverage/test-matrix.json",
  "content/block-1/coverage/flashcard-matrix.json",
];

const gitCheck = spawnSync("git", ["check-ignore", "--stdin"], {
  input: requiredAssets.join("\n"),
  encoding: "utf8",
  timeout: 30000,
});

if (gitCheck.error) {
  warn("git-hygiene", "assets", `git unavailable, cannot verify tracked canonical assets: ${gitCheck.error.message}`);
} else {
  const ignored = (gitCheck.stdout ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const asset of ignored) {
    block(
      "git-ignored-asset",
      asset,
      "required canonical asset is ignored by git and would be missing from a clean clone",
    );
  }
  evidence.requiredAssetsIgnored = ignored;
}

const data = await loadBlock1(root);
const { units, concepts, questions, flashcards } = data;

// 1. Canonical counts -------------------------------------------------------
evidence.counts = {
  units: units.length,
  concepts: concepts.length,
  questions: questions.length,
  flashcards: flashcards.length,
};
for (const [key, expected] of Object.entries(EXPECTED)) {
  const actual = evidence.counts[key];
  if (actual !== expected) block("counts", key, `expected ${expected}, got ${actual}`);
}

// 2. Unit metadata ---------------------------------------------------------
const unitIds = new Set(units.map((unit) => unit.unitId));
for (const [index, unit] of units.entries()) {
  const expectedId = `U${String(index + 1).padStart(2, "0")}`;
  if (unit.unitId !== expectedId) block("unit-order", unit.unitId, `expected ${expectedId} at position ${index + 1}`);
  if (unit.order !== index + 1) block("unit-order", unit.unitId, `order ${unit.order} does not match position ${index + 1}`);
  if (!unit.objective?.trim()) block("unit-metadata", unit.unitId, "empty objective");
  if (unit.status !== "ACTIVE") block("unit-metadata", unit.unitId, `status ${unit.status}`);
  const canonical = await readFile(path.join(data.blockRoot, unit.canonicalFile), "utf8").catch(() => null);
  if (!canonical) {
    block("unit-canonical", unit.unitId, `missing ${unit.canonicalFile}`);
    continue;
  }
  if (!canonical.includes(`# ${unit.unitId} — ${unit.title}`)) {
    block("unit-canonical", unit.unitId, "canonical heading does not match unit title");
  }
}

// 3. Concepts --------------------------------------------------------------
const conceptIds = new Set(concepts.map((concept) => concept.conceptId));
if (conceptIds.size !== concepts.length) block("concept-ids", "concepts", "duplicate concept IDs");
for (const concept of concepts) {
  if (!unitIds.has(concept.unitId)) block("concept-unit", concept.conceptId, `unknown unit ${concept.unitId}`);
  if (!concept.conceptId.startsWith(`B1-${concept.unitId}-`)) {
    block("concept-unit", concept.conceptId, `does not match unit ${concept.unitId}`);
  }
  if (!concept.definition?.trim()) block("concept-definition", concept.conceptId, "empty definition");
  if (!concept.name?.trim()) block("concept-definition", concept.conceptId, "empty name");
}

// 4. Questions: structure and references -----------------------------------
const questionIds = new Set(questions.map((question) => question.id));
if (questionIds.size !== questions.length) block("question-ids", "questions", "duplicate question IDs");
const inlineSyntaxWarnings = [];

for (const question of questions) {
  if (!unitIds.has(question.unitId)) block("question-unit", question.id, `unknown unit ${question.unitId}`);
  if (!conceptIds.has(question.primaryConceptId)) block("question-concept", question.id, `unknown concept ${question.primaryConceptId}`);
  if (!question.prompt?.trim()) block("question-prompt", question.id, "empty prompt");
  if (!question.explanation?.trim()) block("question-explanation", question.id, "empty explanation");
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    block("question-options", question.id, `expected 4 options, got ${question.options?.length ?? 0}`);
    continue;
  }
  const optionIds = new Set(question.options.map((option) => option.id));
  if (optionIds.size !== 4) block("question-options", question.id, "duplicate option IDs");
  const optionTexts = question.options.map((option) => String(option.text).trim());
  if (new Set(optionTexts).size !== optionTexts.length) {
    block("question-options", question.id, "duplicated option text");
  }
  if (!optionIds.has(question.correctOptionId)) {
    block("question-options", question.id, `correctOptionId ${question.correctOptionId} not present`);
  }

  // code fences must match the declared question language
  const declared = question.language;
  for (const option of question.options) {
    for (const { language } of fences(option.text)) {
      if (language === "python" && declared === "POWERSHELL") {
        block("fence-language", question.id, `${option.id}: python fence in a POWERSHELL question`);
      }
      if (language === "powershell" && declared === "PYTHON") {
        block("fence-language", question.id, `${option.id}: powershell fence in a PYTHON question`);
      }
    }
  }

  // Options that only differ in whitespace are duplicates, but indentation is
  // meaningful inside code blocks, so fenced options are excluded.
  const proseOptions = question.options.filter((option) => fences(option.text).length === 0);
  const codeNormalized = proseOptions.map((option) => normalize(option.text));
  const duplicates = new Set();
  for (let i = 0; i < codeNormalized.length; i += 1) {
    for (let j = i + 1; j < codeNormalized.length; j += 1) {
      if (codeNormalized[i] === codeNormalized[j]) duplicates.add(`${proseOptions[i].id}/${proseOptions[j].id}`);
    }
  }
  if (duplicates.size > 0) block("option-duplicate", question.id, `whitespace-insensitive duplicates: ${[...duplicates].join(" ")}`);
}

// 5. Prompt duplicates -----------------------------------------------------
const promptKeys = new Map();
for (const question of questions) {
  const key = normalize(question.prompt);
  if (promptKeys.has(key)) {
    block("prompt-exact-duplicate", question.id, `identical prompt as ${promptKeys.get(key)}`);
  } else {
    promptKeys.set(key, question.id);
  }
}

const promptTokens = questions.map((question) => ({ id: question.id, tokens: contentWords(question.prompt, true) }));
for (let i = 0; i < promptTokens.length; i += 1) {
  for (let j = i + 1; j < promptTokens.length; j += 1) {
    const similarity = jaccard(promptTokens[i].tokens, promptTokens[j].tokens);
    if (similarity >= 0.85) {
      warn("prompt-near-duplicate", `${promptTokens[i].id}/${promptTokens[j].id}`, `similarity ${similarity.toFixed(2)}`);
    }
  }
}

// 6. Explanation vs distractor contradiction -------------------------------
for (const question of questions) {
  const explanation = normalize(question.explanation);
  for (const option of question.options) {
    if (option.id === question.correctOptionId) continue;
    const text = normalize(option.text).replaceAll("`", "");
    if (text.length >= 20 && explanation.includes(text)) {
      block("explanation-contradiction", question.id, `explanation repeats distractor ${option.id} verbatim`);
    }
  }
}

// 7. Placeholder options ---------------------------------------------------
const PLACEHOLDER = /(todas las anteriores|ninguna de las anteriores|ninguna de las opciones|todo lo anterior|lorem ipsum|\bn\/?a\b|\bxxx\b)/i;
for (const question of questions) {
  for (const option of question.options) {
    if (PLACEHOLDER.test(option.text)) warn("placeholder-option", question.id, `${option.id}: "${option.text.trim()}"`);
  }
}

// 8. Duplicated explanations and foreign concept references -----------------
const explanations = new Map();
for (const question of questions) {
  const key = normalize(question.explanation);
  if (explanations.has(key)) {
    warn("explanation-duplicate", question.id, `same explanation as ${explanations.get(key)}`);
  } else {
    explanations.set(key, question.id);
  }
}

const CONCEPT_REFERENCE = /B1-(U\d{2})-([A-Z0-9-]+)/g;
for (const question of questions) {
  const text = [question.prompt, question.explanation, ...question.options.map((option) => option.text)].join(" ");
  for (const match of text.matchAll(CONCEPT_REFERENCE)) {
    if (match[1] !== question.unitId) {
      warn("cross-unit-reference", question.id, `mentions ${match[0]} from ${match[1]}`);
    }
  }
}

// 9. Python semantics: AST equality + real execution -----------------------
const pythonCases = [];
for (const question of questions) {
  for (const option of question.options) {
    const bare = BARE_CODE.exec(option.text.trim());
    const blocks = fences(option.text);
    const code = bare ? bare[1] : blocks.length === 1 && blocks[0].language === "python" ? blocks[0].code : null;
    if (code && !UNSAFE_CODE.test(code)) {
      pythonCases.push({ id: `${question.id}:${option.id}`, code, syntax: true });
    }
  }
  for (const { language, code } of fences(question.prompt)) {
    if (language === "python" && !UNSAFE_CODE.test(code)) {
      pythonCases.push({ id: `${question.id}:prompt`, code, syntax: true });
    }
  }
}

const syntaxById = new Map(runPythonCases(pythonCases).map((item) => [item.id, item]));

for (const question of questions) {
  const perOption = question.options.map((option) => ({
    option,
    result: syntaxById.get(`${question.id}:${option.id}`),
  }));
  const parsed = perOption.filter((entry) => entry.result?.syntax === "OK");
  const asts = new Map();
  for (const entry of parsed) {
    const previous = asts.get(entry.result.ast);
    if (previous) {
      block("option-ast-duplicate", question.id, `${previous} and ${entry.option.id} build the same Python AST`);
    } else {
      asts.set(entry.result.ast, entry.option.id);
    }
  }

  // Pure syntax items ("which one is correctly written") must have exactly one
  // syntactically valid option, and it must be the marked correct one.
  const pureSyntax = /(correctamente (?:escrita|escrito|estructurad|escrit)|respeta la estructura)/i.test(question.prompt);
  const withFences = perOption.filter((entry) => fences(entry.option.text).length === 1);
  const fencedLanguage =
    withFences.length === 4 ? fences(question.options[0].text)[0].language : null;

  if (withFences.length === 4 && (fencedLanguage === "python" || fencedLanguage === "powershell")) {
    let valid;
    if (fencedLanguage === "python") {
      valid = parsed.map((entry) => entry.option.id);
    } else {
      valid = [];
      for (const entry of withFences) {
        const errors = powerShellParseErrors(fences(entry.option.text)[0].code, `${question.id}:${entry.option.id}`);
        if (errors === null) {
          valid = [];
          break;
        }
        if (errors.length === 0) valid.push(entry.option.id);
      }
    }

    const record = {
      question: question.id,
      language: fencedLanguage,
      validOptions: valid,
      correctOptionId: question.correctOptionId,
      gate: pureSyntax ? "strict" : "informational",
    };

    if (pureSyntax) {
      evidence.syntaxGates = [...(evidence.syntaxGates ?? []), record];
      if (valid.length !== 1) {
        block("syntax-uniqueness", question.id, `expected exactly 1 valid option, found ${valid.length}`);
      }
      if (valid.length === 1 && valid[0] !== question.correctOptionId) {
        block(
          "syntax-uniqueness",
          question.id,
          `only ${valid[0]} parses but the correct option is ${question.correctOptionId}`,
        );
      }
    } else {
      evidence.syntaxReviewed = [...(evidence.syntaxReviewed ?? []), record];
    }
  }

  // Inline pure-syntax items (bare `code` options) rely on semantics when more
  // than one option parses; reported for review, never auto-corrected.
  if (pureSyntax && question.language !== "POWERSHELL") {
    const bare = question.options.every((option) => BARE_CODE.test(option.text.trim()));
    if (bare && question.language === "PYTHON" && parsed.length > 1 && parsed.length < 4) {
      inlineSyntaxWarnings.push(
        warn(
          "syntax-uniqueness-inline",
          question.id,
          `${parsed.length} options are syntactically valid (${parsed.map((entry) => entry.option.id).join(", ")}); the item relies on semantics`,
        ),
      );
    }
  }
}

// 10. Execute "what will be printed" questions -----------------------------
const OUTPUT_PROMPT = /que (?:se )?(?:mostrar|imprime|salida|produce|devuelve|muestra)/i;
const executionCases = [];
const executionIndex = [];

for (const question of questions) {
  if (!OUTPUT_PROMPT.test(removeAccents(normalize(question.prompt)))) continue;
  const blocks = fences(question.prompt).filter(({ language }) => language === "python" || language === "text");
  let code = null;
  let lastSpan = null;
  if (blocks.length > 0) {
    code = blocks.map(({ code: value }) => value).join("\n");
  } else {
    const spans = inlineSpans(question.prompt);
    if (spans.length > 0) {
      code = spans.join("\n");
      lastSpan = spans[spans.length - 1];
    }
  }
  if (!code || UNSAFE_CODE.test(code)) continue;
  executionIndex.push({ question, code, lastSpan });
  executionCases.push({ id: `${question.id}:run`, code, syntax: true, run: true });
}

const executionResults = new Map(runPythonCases(executionCases).map((item) => [item.id, item]));
const fallbackCases = [];
for (const entry of executionIndex) {
  const result = executionResults.get(`${entry.question.id}:run`);
  if (
    result?.returncode === 0 &&
    !result.stdout &&
    entry.lastSpan &&
    /^[\w\s"'[\](),+\-*/%<>=!&|^~.]+$/.test(entry.lastSpan)
  ) {
    fallbackCases.push({
      id: `${entry.question.id}:eval-last`,
      code: `${entry.code}\nprint(repr(${entry.lastSpan}))`,
      run: true,
    });
  }
}
const fallbackResults = new Map(runPythonCases(fallbackCases).map((item) => [item.id, item]));

const stripQuotes = (value) =>
  /^'.*'$/.test(value) || /^".*"$/.test(value) ? value.slice(1, -1) : value;

let executed = 0;
let unverifiable = 0;
const executedQuestions = [];
const unverifiedQuestions = [];
for (const entry of executionIndex) {
  const { question } = entry;
  const expected = normalize(correctOption(question)?.text ?? "").replaceAll("`", "");
  let actual = executionResults.get(`${question.id}:run`);
  let output = actual?.stdout ?? "";
  let source = "stdout";

  if (actual?.returncode === 0 && !output) {
    const fallback = fallbackResults.get(`${question.id}:eval-last`);
    if (fallback?.returncode === 0 && fallback.stdout) {
      output = stripQuotes(fallback.stdout);
      source = "expression";
    }
  }

  if (actual?.returncode !== 0) {
    unverifiable += 1;
    unverifiedQuestions.push({ id: question.id, reason: `snippet does not run (${actual?.stderr ?? "unknown"})` });
    continue;
  }
  if (!output) {
    unverifiable += 1;
    unverifiedQuestions.push({ id: question.id, reason: "snippet produces no comparable output" });
    continue;
  }

  executed += 1;
  executedQuestions.push({ id: question.id, output, source, expected });
  if (normalize(output.replace(/\r/g, "")) !== expected) {
    block(
      "python-execution-mismatch",
      question.id,
      `expected "${expected}" but Python produced "${output}" (${source})`,
    );
  }
}

// 12. Flashcards -----------------------------------------------------------
const flashcardIds = new Set(flashcards.map((flashcard) => flashcard.id));
if (flashcardIds.size !== flashcards.length) block("flashcard-ids", "flashcards", "duplicate flashcard IDs");

const fronts = new Map();
for (const flashcard of flashcards) {
  if (!unitIds.has(flashcard.unitId)) block("flashcard-unit", flashcard.id, `unknown unit ${flashcard.unitId}`);
  if (!conceptIds.has(flashcard.primaryConceptId)) block("flashcard-concept", flashcard.id, `unknown concept ${flashcard.primaryConceptId}`);
  if (!flashcard.front?.trim()) block("flashcard-content", flashcard.id, "empty front");
  if (!flashcard.back?.trim()) block("flashcard-content", flashcard.id, "empty back");
  if (normalize(flashcard.front) === normalize(flashcard.back)) block("flashcard-content", flashcard.id, "front and back are identical");

  const key = normalize(flashcard.front);
  if (fronts.has(key)) {
    block("flashcard-duplicate", flashcard.id, `identical front as ${fronts.get(key)}`);
  } else {
    fronts.set(key, flashcard.id);
  }
}

for (let i = 0; i < flashcards.length; i += 1) {
  for (let j = i + 1; j < flashcards.length; j += 1) {
    const front = jaccard(contentWords(flashcards[i].front), contentWords(flashcards[j].front));
    const back = jaccard(contentWords(flashcards[i].back), contentWords(flashcards[j].back));
    if (front >= 0.85 && back >= 0.7) {
      warn(
        "flashcard-near-duplicate",
        `${flashcards[i].id}/${flashcards[j].id}`,
        `front ${front.toFixed(2)} / back ${back.toFixed(2)}`,
      );
    }
  }
}

// 13. Concepts backed by their canonical unit ------------------------------
const canonicalCache = new Map();
for (const concept of concepts) {
  const unit = units.find((candidate) => candidate.unitId === concept.unitId);
  if (!unit) continue;
  if (!canonicalCache.has(concept.unitId)) {
    canonicalCache.set(
      unit.unitId,
      removeAccents(normalize(await readFile(path.join(data.blockRoot, unit.canonicalFile), "utf8"))),
    );
  }
  const canonical = canonicalCache.get(concept.unitId);
  const name = removeAccents(normalize(concept.name)).replace(/[()/]/g, " ");
  const significant = words(name).filter((token) => token.length >= 5);
  if (significant.length === 0) continue;
  const found = significant.some((token) => canonical.includes(token.slice(0, Math.max(5, token.length - 2))));
  if (!found) warn("concept-canonical-link", concept.conceptId, `"${concept.name}" not traceable in ${unit.canonicalFile}`);
}

// --------------------------------------------------------------------------
evidence.pythonAvailable = Boolean(python);
evidence.pythonQuestionsExecuted = executed;
evidence.pythonQuestionsUnverifiable = unverifiable;
evidence.pythonVerified = executedQuestions;
evidence.pythonUnverified = unverifiedQuestions;
evidence.pythonOptionsAstChecked = [...syntaxById.values()].filter((item) => item.syntax === "OK").length;
evidence.inlineSyntaxWarnings = inlineSyntaxWarnings.length;

const report = {
  status: blockers.length === 0 ? "PASS" : "BLOCKED",
  counts: evidence.counts,
  evidence,
  blockers,
  warnings,
};

const outIndex = process.argv.indexOf("--out");
if (outIndex !== -1 && process.argv[outIndex + 1]) {
  const target = path.resolve(root, process.argv[outIndex + 1]);
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`CONTENT_AUDIT_REPORT=${path.relative(root, target)}`);
}

console.log(`CONTENT_AUDIT=${report.status}`);
console.log(`BLOCKERS=${blockers.length}`);
console.log(`WARNINGS=${warnings.length}`);
console.log(`PYTHON_EXECUTED=${executed}/${executionIndex.length}`);
console.log(`AST_OPTIONS_CHECKED=${evidence.pythonOptionsAstChecked}`);

for (const finding of blockers) console.log(`BLOCKER ${finding.check} ${finding.id}: ${finding.message}`);
for (const finding of warnings) console.log(`WARNING ${finding.check} ${finding.id}: ${finding.message}`);

process.exitCode = blockers.length === 0 ? 0 : 1;
