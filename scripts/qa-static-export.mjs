import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Cloudflare Pages gate for the static HTML export.
 *
 * Fails unless `next build` produced the routes the product promises, including
 * the home page, the exported 404 and the twelve unit pages.
 */
const root = process.cwd();
const outDir = path.join(root, "out");

const unitFiles = Array.from(
  { length: 12 },
  (_, index) => `estudiar/b1/u${String(index + 1).padStart(2, "0")}.html`,
);

const expectedHtml = [
  "index.html",
  "404.html",
  "estudiar.html",
  "estudiar/b1.html",
  ...unitFiles,
  "tests.html",
  "tests/sesion.html",
  "tests/resultados.html",
  "tarjetas.html",
  "tarjetas/sesion.html",
  "tarjetas/resultados.html",
  "progreso.html",
  "ajustes.html",
];

async function readExport(relativePath) {
  try {
    const file = path.join(outDir, relativePath);
    const info = await stat(file);
    if (!info.isFile()) return null;
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

const failures = [];

for (const relativePath of expectedHtml) {
  const html = await readExport(relativePath);
  if (html === null) {
    failures.push(`Missing exported route: out/${relativePath}`);
    continue;
  }
  if (!html.includes('id="main-content"')) {
    failures.push(`out/${relativePath} does not contain the app shell`);
  }
}

const exportedUnits = (
  await Promise.all(unitFiles.map(async (file) => (await readExport(file)) !== null))
).filter(Boolean).length;

if (exportedUnits !== 12) {
  failures.push(`Expected 12 exported units, got ${exportedUnits}`);
}

for (const relativePath of ["index.html", "404.html"]) {
  const html = await readExport(relativePath);
  if (html !== null && !html.includes("<h1")) {
    failures.push(`out/${relativePath} does not render a heading`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("STATIC_EXPORT_VERIFY=PASS");
console.log(`EXPORTED_ROUTES=${expectedHtml.length}`);
console.log(`EXPORTED_UNITS=${exportedUnits}`);
console.log("OUT_INDEX=out/index.html");
console.log("OUT_404=out/404.html");
