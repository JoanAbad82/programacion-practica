import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputRelative = "release/RC1_SOURCE_INVENTORY.json";
const outputPath = path.join(root, outputRelative);
const mode = process.argv.includes("--verify") ? "verify" : "write";

function excluded(relativePath, isDirectory) {
  const normalized = relativePath.replaceAll("\\", "/");
  const parts = normalized.split("/");

  if (parts.some((part) => [".git", ".next", "node_modules"].includes(part))) {
    return true;
  }

  if (parts.some((part) => /^PHASE\d+_PAYLOAD$/i.test(part))) return true;
  if (/^APPLY_PHASE\d+_R\d+\.cmd$/i.test(normalized)) return true;
  if (/^PHASE\d+_R\d+_(?:APPLY|FIX)\.ps1$/i.test(normalized)) return true;
  if (/^PHASE\d+_PACKAGE_MANIFEST\.json$/i.test(normalized)) return true;
  if (/\.tsbuildinfo$/i.test(normalized)) return true;
  if (normalized === outputRelative) return true;
  if (isDirectory && normalized === "RELEASE_ARTIFACTS") return true;

  return false;
}

async function collect(directory = root) {
  const files = [];

  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const relative = path.relative(root, full).replaceAll("\\", "/");

      if (excluded(relative, entry.isDirectory())) continue;

      if (entry.isDirectory()) {
        await visit(full);
      } else if (entry.isFile()) {
        files.push(relative);
      }
    }
  }

  await visit(directory);
  files.sort();

  const records = [];
  for (const relative of files) {
    const full = path.join(root, relative);
    const bytes = await readFile(full);
    const info = await stat(full);
    records.push({
      path: relative,
      bytes: info.size,
      sha256: createHash("sha256").update(bytes).digest("hex").toUpperCase(),
    });
  }

  return {
    release: "PROGRAMACION_PRACTICA_RC1",
    version: "0.1.0-rc.1",
    algorithm: "SHA-256",
    file_count: records.length,
    files: records,
  };
}

const current = await collect();

if (mode === "write") {
  await writeFile(outputPath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
  console.log("RC1_SOURCE_INVENTORY=PASS");
  console.log(`SOURCE_FILES=${current.file_count}`);
} else {
  const expected = JSON.parse(await readFile(outputPath, "utf8"));
  if (JSON.stringify(expected) !== JSON.stringify(current)) {
    console.error("RC1 source inventory mismatch.");
    process.exit(1);
  }
  console.log("RC1_SOURCE_INVENTORY_VERIFY=PASS");
  console.log(`SOURCE_FILES=${current.file_count}`);
}
