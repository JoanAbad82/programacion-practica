import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Reports the route surface of the static HTML export (`out/`).
 *
 * The production target is Cloudflare Pages with Next.js Static HTML Export,
 * so the surface is the exported document set plus its RSC payloads, not the
 * `.next` server manifests used before `output: "export"`.
 */
const outDir = path.join(process.cwd(), "out");

async function collect(directory, prefix = "") {
  const output = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      output.push(...(await collect(path.join(directory, entry.name), relative)));
    } else if (entry.isFile()) {
      output.push(relative);
    }
  }

  return output;
}

let files = [];

try {
  files = await collect(outDir);
} catch {
  console.error("Missing static artifact: run `npm run build` before qa:build-surface.");
  process.exit(1);
}

const routes = files
  .filter((file) => file.endsWith(".html"))
  .map((file) => (file === "index.html" ? "/" : `/${file.slice(0, -".html".length)}`))
  .sort();

const surface = {
  staticExport: true,
  routes,
  unitRoutes: routes.filter((route) => /^\/estudiar\/b1\/u\d\d$/.test(route)),
  rscPayloads: files.filter((file) => file.endsWith(".txt")).sort(),
};

console.log(JSON.stringify(surface));
