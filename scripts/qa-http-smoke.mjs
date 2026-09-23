import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";

const root = process.cwd();

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
  });
}

const port = await getFreePort();
if (!port) throw new Error("Could not allocate QA port.");

const child = spawn(
  process.execPath,
  [path.join(root, "scripts", "serve-static-export.mjs")],
  {
    cwd: root,
    env: { ...process.env, PP_E2E_PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);

let logs = "";
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    logs = (logs + chunk.toString()).slice(-20000);
  });
}

const base = `http://127.0.0.1:${port}`;

async function waitForServer() {
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Static export server exited early (run \`npm run build\` first).\n${logs}`,
      );
    }

    try {
      const response = await fetch(base, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for Next server.\n${logs}`);
}

const checks = [
  ["/", 200],
  ["/estudiar", 200],
  ["/estudiar/b1", 200],
  ["/estudiar/b1/u01", 200],
  ["/estudiar/b1/u12", 200],
  ["/tests", 200],
  ["/tests?unit=u01", 200],
  ["/tests/sesion", 200],
  ["/tests/resultados", 200],
  ["/tarjetas", 200],
  ["/tarjetas?unit=u01", 200],
  ["/tarjetas/sesion", 200],
  ["/tarjetas/resultados", 200],
  ["/progreso", 200],
  ["/ajustes", 200],
  ["/qa-route-that-must-not-exist", 404],
];

let passed = 0;

try {
  await waitForServer();

  for (const [route, expectedStatus] of checks) {
    const response = await fetch(`${base}${route}`, { redirect: "manual" });
    const html = await response.text();

    if (response.status !== expectedStatus) {
      throw new Error(
        `${route}: expected HTTP ${expectedStatus}, got ${response.status}`,
      );
    }

    if (!html.includes('id="main-content"')) {
      throw new Error(`${route}: accessible main target missing`);
    }

    passed += 1;
  }

  console.log("QA_HTTP_SMOKE=PASS");
  console.log(`HTTP_ROUTES=${passed}/${checks.length}`);
} finally {
  if (child.exitCode === null) {
    child.kill("SIGTERM");
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 3000);
      child.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}
