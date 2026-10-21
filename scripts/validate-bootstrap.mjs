import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const required = [
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "app/layout.tsx",
  "app/page.tsx",
  "app/globals.css",
  "app/estudiar/page.tsx",
  "app/tests/page.tsx",
  "app/tarjetas/page.tsx",
  "app/progreso/page.tsx",
  "app/ajustes/page.tsx",
  "content/block-1/manifest.json",
  "schemas/question.schema.json",
  "schemas/flashcard.schema.json",
  "schemas/progress.schema.json",
  "types/content.ts",
  "types/question.ts",
  "types/flashcard.ts",
  "types/progress.ts",
  "lib/progress/mastery.ts",
  "lib/storage/progress-repository.ts"
];

const failures = [];

for (const file of required) {
  try {
    await readFile(path.join(root, file));
  } catch {
    failures.push(`MISSING ${file}`);
  }
}

const manifest = JSON.parse(
  await readFile(path.join(root, "content/block-1/manifest.json"), "utf8"),
);

const expected = {
  units: 12,
  concepts: 56,
  questions: 200,
  flashcards: 80,
};

for (const [key, value] of Object.entries(expected)) {
  if (manifest[key] !== value) {
    failures.push(`MANIFEST ${key}: expected ${value}, got ${manifest[key]}`);
  }
}

async function walk(dir) {
  const out = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next", "out", "build", "coverage"].includes(entry.name)) {
      continue;
    }

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...await walk(full));
    } else {
      out.push(full);
    }
  }

  return out;
}

function isMaintenanceArtifact(rel) {
  return /^(?:APPLY_PHASE1_R\d+\.cmd|PHASE1_R\d+_FIX\.ps1)$/i.test(rel);
}

for (const file of await walk(root)) {
  const rel = path.relative(root, file).split(path.sep).join("/");

  if (rel === "scripts/validate-bootstrap.mjs") continue;
  if (rel === "package-lock.json") continue;
  if (isMaintenanceArtifact(rel)) continue;
  if (/\.(png|jpg|jpeg|gif|webp|ico|zip|pdf)$/i.test(rel)) continue;

  const source = await readFile(file, "utf8").catch(() => "");

  // Generic repository and site isolation: reject links to sibling projects.
  // Never embed the identity of a restricted project in a public validator.
  const otherSite = [...source.matchAll(/https?:\/\/([a-z0-9-]+)\.pages\.dev\b/gi)]
    .some((match) => match[1].toLowerCase() !== "programacion-practica");
  const otherRepository = [...source.matchAll(/https?:\/\/github\.com\/JoanAbad82\/([a-z0-9_.-]+)/gi)]
    .some((match) => match[1].toLowerCase() !== "programacion-practica");
  if (otherSite || otherRepository) {
    failures.push("INDEPENDENCE_GUARD external project reference found in " + rel);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("BOOTSTRAP_VALIDATION=PASS");
console.log(`REQUIRED_FILES=${required.length}`);
console.log("INDEPENDENCE_GUARD=PASS");
console.log("MANIFEST=PASS");
