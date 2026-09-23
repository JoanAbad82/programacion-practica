import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * SHA-256 inventory of the source that will become public.
 *
 * The file list comes from git (`ls-files` + untracked-but-not-ignored), so
 * local utilities and derived artifacts that git ignores can never leak into
 * the inventory. When git is unavailable the script falls back to a filesystem
 * scan that skips the same derived directories.
 */
const root = process.cwd();
const outputRelative = "release/RC1_SOURCE_INVENTORY.json";
const outputPath = path.join(root, outputRelative);
const mode = process.argv.includes("--verify") ? "verify" : "write";

const ignoredDirectories = [
  ".git",
  ".next",
  "node_modules",
  "out",
  "build",
  "test-results",
  "playwright-report",
];

// `coverage/` is only a derived directory at the repository root: canonical
// content lives in `content/block-1/coverage/` and must stay inventoried.
const ignoredRootDirectories = ["coverage"];

const ignoredFiles = [/^qa\/playwright-report\.json$/i, /\.tsbuildinfo$/i];

function excluded(relativePath, isDirectory) {
  const normalized = relativePath.replaceAll("\\", "/");
  const parts = normalized.split("/");

  if (parts.some((part) => ignoredDirectories.includes(part))) return true;
  if (ignoredRootDirectories.includes(parts[0])) return true;
  if (parts.some((part) => /^PHASE\d+_PAYLOAD$/i.test(part))) return true;
  if (/^APPLY_PHASE\d+_R\d+\.cmd$/i.test(normalized)) return true;
  if (/^PHASE\d+_R\d+_(?:APPLY|FIX)\.ps1$/i.test(normalized)) return true;
  if (/^PHASE\d+_PACKAGE_MANIFEST\.json$/i.test(normalized)) return true;
  if (ignoredFiles.some((pattern) => pattern.test(normalized))) return true;
  if (normalized === outputRelative) return true;
  if (isDirectory && normalized === "RELEASE_ARTIFACTS") return true;

  return false;
}

function fromGit() {
  try {
    const output = execFileSync(
      "git",
      ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );

    return output
      .split("\0")
      .filter(Boolean)
      .map((file) => file.replaceAll("\\", "/"));
  } catch {
    return null;
  }
}

async function fromFilesystem(directory = root) {
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
  return files;
}

async function collect(relativeFiles) {
  const records = [];

  for (const relative of [...relativeFiles].sort()) {
    if (excluded(relative, false)) continue;

    const full = path.join(root, relative);

    try {
      const info = await stat(full);
      if (!info.isFile()) continue;

      const bytes = await readFile(full);
      records.push({
        path: relative,
        bytes: info.size,
        sha256: createHash("sha256").update(bytes).digest("hex").toUpperCase(),
      });
    } catch {
      // Tracked-but-deleted files stay in the index until they are committed;
      // the working tree is what gets published.
    }
  }

  return records;
}

const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);

const gitFiles = fromGit();
const files = await collect(gitFiles ?? (await fromFilesystem()));

const current = {
  release: "PROGRAMACION_PRACTICA_V1",
  version: packageJson.version,
  algorithm: "SHA-256",
  source: gitFiles ? "git-tracked-and-unignored" : "filesystem-scan",
  file_count: files.length,
  files,
};

if (mode === "write") {
  await writeFile(outputPath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
  console.log("RC1_SOURCE_INVENTORY=PASS");
  console.log(`SOURCE_FILES=${current.file_count}`);
} else {
  const expected = JSON.parse(await readFile(outputPath, "utf8"));
  if (JSON.stringify(expected) !== JSON.stringify(current)) {
    console.error("Source inventory mismatch.");
    process.exit(1);
  }
  console.log("RC1_SOURCE_INVENTORY_VERIFY=PASS");
  console.log(`SOURCE_FILES=${current.file_count}`);
}
