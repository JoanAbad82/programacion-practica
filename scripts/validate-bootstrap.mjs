import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const required = [
  "package.json", "tsconfig.json", "next.config.ts", "eslint.config.mjs", "postcss.config.mjs",
  "app/layout.tsx", "app/page.tsx", "app/globals.css",
  "app/estudiar/page.tsx", "app/tests/page.tsx", "app/tarjetas/page.tsx", "app/progreso/page.tsx", "app/ajustes/page.tsx",
  "content/block-1/manifest.json", "schemas/question.schema.json", "schemas/flashcard.schema.json", "schemas/progress.schema.json",
  "types/content.ts", "types/question.ts", "types/flashcard.ts", "types/progress.ts",
  "lib/progress/mastery.ts", "lib/storage/progress-repository.ts"
];

const failures = [];
for (const file of required) {
  try { await readFile(path.join(root, file)); } catch { failures.push(`MISSING ${file}`); }
}

const manifest = JSON.parse(await readFile(path.join(root, "content/block-1/manifest.json"), "utf8"));
const expected = { units: 12, concepts: 56, questions: 200, flashcards: 80 };
for (const [key, value] of Object.entries(expected)) if (manifest[key] !== value) failures.push(`MANIFEST ${key}: expected ${value}, got ${manifest[key]}`);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full)); else out.push(full);
  }
  return out;
}

for (const file of await walk(root)) {
  if (file.endsWith("scripts/validate-bootstrap.mjs")) continue;
  if (/\.(png|jpg|jpeg|gif|webp|ico)$/i.test(file)) continue;
  const text = await readFile(file, "utf8").catch(() => "");
  if (/rep[aà]s\s*actiu|repasactiu/i.test(text)) failures.push(`INDEPENDENCE_GUARD reference found in ${path.relative(root, file)}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("BOOTSTRAP_VALIDATION=PASS");
console.log(`REQUIRED_FILES=${required.length}`);
console.log("INDEPENDENCE_GUARD=PASS");
console.log("MANIFEST=PASS");
