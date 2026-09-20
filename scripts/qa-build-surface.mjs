import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

const appPaths = await readJson(".next/server/app-paths-manifest.json");
const prerender = await readJson(".next/prerender-manifest.json");

const surface = {
  appPaths: Object.keys(appPaths).sort(),
  prerenderRoutes: Object.keys(prerender.routes ?? {}).sort(),
  dynamicRoutes: Object.keys(prerender.dynamicRoutes ?? {}).sort(),
};

console.log(JSON.stringify(surface));
