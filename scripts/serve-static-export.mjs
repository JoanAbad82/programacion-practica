import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Minimal static host for the Cloudflare Pages artifact.
 *
 * Serves `out/` the way a static host does: documents resolve to
 * `<route>.html`, unknown paths return the exported `404.html` with HTTP 404,
 * and Next.js client navigation keeps working because the exported RSC
 * payloads (`<route>.txt`, `__next.*.txt`) are served as files.
 *
 *   node scripts/serve-static-export.mjs            # port 4310 (or PP_E2E_PORT)
 */
const root = process.cwd();
const outDir = path.join(root, "out");
const port = Number(process.env.PP_E2E_PORT ?? 4310);
const host = process.env.PP_STATIC_HOST ?? "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/x-component; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

// Next exports one RSC payload per segment so the client router can prefetch
// them. The canonical file name is `__next.<a>.<b>.__PAGE__.txt`
// (`convertSegmentPathToStaticExportFilename` replaces `/` with `.`), which is
// exactly what the router requests and what a POSIX build — and therefore
// Cloudflare Pages — writes to `out/`.
//
// On Windows the collector returns `..\`-separated relative paths, so the same
// name lands as the nested `__next.<a>/<b>/__PAGE__.txt`. Resolving the dotted
// request path here keeps the QA server faithful to the deployed (Linux)
// artifact instead of the local build quirk.
const NESTED_RSC_PAYLOAD = /^__next\.(.+)\.((?:__PAGE__|_full|_tree)\.txt)$/;

async function findFile(candidates) {
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      // Candidate does not exist; keep looking.
    }
  }

  return null;
}

function nestedRscPayload(relative) {
  const segments = relative.split("/");
  const last = segments.length - 1;
  const match = NESTED_RSC_PAYLOAD.exec(segments[last]);
  if (!match) return null;

  const [first, ...rest] = match[1].split(".");

  return path.join(
    outDir,
    ...segments.slice(0, last),
    `__next.${first}`,
    ...rest,
    match[2],
  );
}

function resolveCandidates(pathname, isRsc) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, "");

  if (relative.split("/").some((segment) => segment === "..")) return null;

  const base = path.join(outDir, relative);
  const candidates = [];

  if (relative === "") candidates.push(path.join(outDir, "index.html"));
  if (isRsc) candidates.push(`${base}.txt`);
  candidates.push(base, `${base}.html`, path.join(base, "index.html"));

  const nested = nestedRscPayload(relative);
  if (nested) candidates.push(nested);

  return candidates;
}

async function ensureArtifact() {
  const index = await findFile([path.join(outDir, "index.html")]);
  if (!index) {
    throw new Error(
      "Missing static artifact: run `npm run build` before serving out/.",
    );
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  const isRsc =
    url.searchParams.has("_rsc") || request.headers.rsc === "1";
  const candidates = resolveCandidates(url.pathname, isRsc);
  const file = candidates ? await findFile(candidates) : null;

  if (file) {
    const body = await readFile(file);
    const extension = path.extname(file).toLowerCase();
    const immutable = url.pathname.startsWith("/_next/static/");

    response.writeHead(200, {
      "content-type": contentTypes[extension] ?? "application/octet-stream",
      "cache-control": immutable
        ? "public, max-age=31536000, immutable"
        : "no-store",
    });
    response.end(body);
    return;
  }

  const notFound = await findFile([path.join(outDir, "404.html")]);
  const body = notFound ? await readFile(notFound) : Buffer.from("Not found");

  response.writeHead(404, {
    "content-type": contentTypes[".html"],
    "cache-control": "no-store",
  });
  response.end(body);
});

await ensureArtifact();

server.listen(port, host, () => {
  console.log(`STATIC_EXPORT_SERVING=http://${host}:${port} (out/)`);
});
