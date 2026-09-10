#!/usr/bin/env node
/**
 * Launch, doctor, drive, and tear down a dedicated brag.fast Next.js
 * instance. Never pointed at the owner preview (77.42.31.66 / :3002).
 */
import { spawn, execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACTS = join(SKILL_DIR, "artifacts");
const FORBIDDEN_HOSTS = new Set(["77.42.31.66", "localhost"]);
const FORBIDDEN_PORTS = new Set([80, 3002]);
const DEFAULT_PORT = 3019;
const DEFAULT_HOST = "127.0.0.1";
const READY_MS = 120_000;

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function findRepoRoot() {
  let dir = SKILL_DIR;
  while (true) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      if (pkg.name === "bragfast-v2") {
        return dir;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      die("control-bragfast: could not find bragfast-v2 package.json");
    }
    dir = parent;
  }
}

const REPO = findRepoRoot();
const RUN_DIR = process.env.BRAGFAST_VERIFY_RUN_DIR || "/tmp/bragfast-verify";
const STATE_PATH = join(RUN_DIR, "run.json");
const LOG_PATH = join(RUN_DIR, "next.log");
const COOKIE_PATH = join(RUN_DIR, "cookies.json");

function loadState() {
  if (!existsSync(STATE_PATH)) {
    return null;
  }
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

function saveState(state) {
  mkdirSync(RUN_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function pidAlive(pid) {
  if (!pid) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function portPid(port) {
  try {
    const out = execFileSync("ss", ["-tlnp"], { encoding: "utf8" });
    const matchPort = new RegExp(`:${port}(\\s|$)`);
    for (const line of out.split("\n")) {
      if (!matchPort.test(line)) {
        continue;
      }
      const match = line.match(/pid=(\d+)/);
      if (match) {
        return Number(match[1]);
      }
    }
  } catch {
    return null;
  }
  return null;
}

function assertSafeBase(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    die(`unsafe verify URL: ${urlString}`);
  }
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
  if (FORBIDDEN_HOSTS.has(url.hostname) && url.hostname !== "127.0.0.1") {
    die(`refusing to drive ${url.hostname} — that is not a verification instance`);
  }
  if (url.hostname === "77.42.31.66" || FORBIDDEN_PORTS.has(port)) {
    die(
      `refusing to drive ${urlString} — owner preview / pm2 :3002 is off limits`,
    );
  }
  if (url.hostname !== "127.0.0.1") {
    die(`verification instance must bind 127.0.0.1, got ${url.hostname}`);
  }
  return url;
}

function requireLaunched() {
  const state = loadState();
  if (!state?.url || !state.pid) {
    die("no verification instance. Run: control-bragfast launch");
  }
  assertSafeBase(state.url);
  if (!pidAlive(state.pid)) {
    die(`verification pid ${state.pid} is dead. Run launch again.`);
  }
  return state;
}

function artifactPath(path) {
  if (!path) {
    die("missing --path / --out");
  }
  if (isAbsolute(path)) {
    return path;
  }
  if (path.startsWith("artifacts/") || path.startsWith("artifacts\\")) {
    return join(SKILL_DIR, path);
  }
  return resolve(process.cwd(), path);
}

function writeArtifact(path, contents) {
  const full = artifactPath(path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents);
  return full;
}

function loadCookies() {
  if (!existsSync(COOKIE_PATH)) {
    return {};
  }
  return JSON.parse(readFileSync(COOKIE_PATH, "utf8"));
}

function saveCookies(cookies) {
  mkdirSync(RUN_DIR, { recursive: true });
  writeFileSync(COOKIE_PATH, JSON.stringify(cookies, null, 2));
}

function cookieHeader() {
  const cookies = loadCookies();
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function storeSetCookie(headers) {
  const cookies = loadCookies();
  const raw = headers.getSetCookie?.() ?? [];
  for (const line of raw) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) {
      cookies[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
  }
  saveCookies(cookies);
}

async function fetchPath(path, { method = "GET", body, follow = true } = {}) {
  const state = requireLaunched();
  const url = new URL(path, state.url);
  assertSafeBase(`${url.protocol}//${url.hostname}:${url.port || ""}`);
  const headers = { Accept: "text/html,application/json,*/*" };
  const cookie = cookieHeader();
  if (cookie) {
    headers.Cookie = cookie;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(url, {
    method,
    headers,
    body,
    redirect: follow ? "follow" : "manual",
  });
  storeSetCookie(response.headers);
  const text = await response.text();
  const finalUrl = new URL(response.url || url.href);
  return { url: finalUrl, requestUrl: url, response, text };
}

function titleOf(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1] : "";
}

function h1Of(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : "";
}

async function waitReady(url, pid) {
  const deadline = Date.now() + READY_MS;
  let last = "";
  while (Date.now() < deadline) {
    if (!pidAlive(pid)) {
      die(`next exited before ready. See ${LOG_PATH}`);
    }
    try {
      const response = await fetch(url, { redirect: "follow" });
      const text = await response.text();
      last = `${response.status} ${titleOf(text)}`;
      if (response.ok && /brag\.fast/i.test(text)) {
        return;
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await sleep(500);
  }
  die(`instance not ready after ${READY_MS}ms (${last}). See ${LOG_PATH}`);
}

async function cmdLaunch() {
  mkdirSync(RUN_DIR, { recursive: true });
  mkdirSync(ARTIFACTS, { recursive: true });
  const port = Number(process.env.BRAGFAST_VERIFY_PORT || DEFAULT_PORT);
  if (FORBIDDEN_PORTS.has(port) || port === 80 || port === 443) {
    die(`port ${port} is reserved. Use BRAGFAST_VERIFY_PORT (default ${DEFAULT_PORT}).`);
  }
  const url = `http://${DEFAULT_HOST}:${port}/`;
  assertSafeBase(url);

  const existing = loadState();
  if (existing?.pid && pidAlive(existing.pid) && existing.url === url) {
    console.log(`already running pid ${existing.pid} at ${url}`);
    return;
  }

  const occupant = portPid(port);
  if (occupant && (!existing || occupant !== existing.pid)) {
    die(
      `port ${port} is already taken by pid ${occupant}. Pick another BRAGFAST_VERIFY_PORT.`,
    );
  }

  const nextBin = join(REPO, "node_modules/next/dist/bin/next");
  if (!existsSync(nextBin)) {
    die("next is not installed. Run npm install in the repo root.");
  }
  if (!existsSync(join(REPO, ".env.local"))) {
    die("missing .env.local (NEXT_PUBLIC_CONVEX_URL). Cannot render catalog pages.");
  }

  const logFd = openSync(LOG_PATH, "w");
  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--port", String(port), "--hostname", DEFAULT_HOST],
    {
      cwd: REPO,
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env, PORT: String(port) },
    },
  );
  if (!child.pid) {
    die("failed to spawn next dev");
  }
  child.unref();
  const state = {
    pid: child.pid,
    port,
    host: DEFAULT_HOST,
    url,
    log: LOG_PATH,
    startedAt: new Date().toISOString(),
  };
  saveState(state);
  saveCookies({});
  console.log(`launched pid ${child.pid} → ${url}`);
  await waitReady(url, child.pid);
  console.log("ready");
}

function cmdDoctor() {
  const state = requireLaunched();
  const occupant = portPid(state.port);
  if (occupant && occupant !== state.pid) {
    const children = (() => {
      try {
        return execFileSync("pgrep", ["-P", String(state.pid)], {
          encoding: "utf8",
        })
          .trim()
          .split("\n")
          .map(Number);
      } catch {
        return [];
      }
    })();
    if (!children.includes(occupant)) {
      die(
        `port ${state.port} is owned by pid ${occupant}, not verification pid ${state.pid}`,
      );
    }
  }

  return fetchPath("/")
    .then(({ response, text, url }) => {
      if (!response.ok) {
        die(`GET / → ${response.status}`);
      }
      if (!/brag\.fast/i.test(text)) {
        die("GET / HTML is missing brag.fast — wrong app?");
      }
      const title = titleOf(text);
      console.log(`ok pid=${state.pid} url=${state.url} title=${title}`);
      console.log(`log ${state.log}`);
      console.log(`final ${url.href}`);
      if (/77\.42\.31\.66/.test(url.href)) {
        die("doctor resolved to the owner preview");
      }
    });
}

async function cmdHttp(args) {
  const method = (args[0] || "GET").toUpperCase();
  const path = args[1];
  if (!path) {
    die("usage: control-bragfast http GET <path> [--out file] [--no-follow]");
  }
  const follow = !args.includes("--no-follow");
  let out = null;
  const outIdx = args.indexOf("--out");
  if (outIdx >= 0) {
    out = args[outIdx + 1];
  }
  let json = null;
  const jsonIdx = args.indexOf("--json");
  if (jsonIdx >= 0) {
    json = args[jsonIdx + 1];
  }

  const { response, text, url } = await fetchPath(path, {
    method,
    body: json,
    follow,
  });
  const location = response.headers.get("location") || "";
  console.log(`status ${response.status}`);
  console.log(`final ${url.href}`);
  if (location) {
    console.log(`location ${location}`);
  }
  console.log(`title ${titleOf(text)}`);
  const h1 = h1Of(text);
  if (h1) {
    console.log(`h1 ${h1}`);
  }
  if (out) {
    const saved = writeArtifact(out, text);
    console.log(`saved ${saved}`);
  }
}

function playwrightPaths() {
  const require = createRequire(import.meta.url);
  const candidates = [
    "/tmp/pw-repro/node_modules/playwright-core",
    join(REPO, "node_modules/playwright-core"),
    join(REPO, "node_modules/playwright"),
  ];
  const root = candidates.find((path) => existsSync(path));
  if (!root) {
    return null;
  }
  const chrome =
    process.env.CHROME_PATH ||
    [
      "/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
      "/root/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome",
    ].find((path) => existsSync(path));
  return { root, chrome, require };
}

async function withPage(fn) {
  const state = requireLaunched();
  const pw = playwrightPaths();
  if (!pw?.chrome) {
    die(
      "browser harness needs playwright-core and Chrome. HTTP GET is the primary drive for SSR pages.",
    );
  }
  const { chromium } = pw.require(pw.root);
  const browser = await chromium.launch({
    executablePath: pw.chrome,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const cookieDict = loadCookies();
    const context = await browser.newContext({
      locale: cookieDict.lang === "en" ? "en-GB" : "nl-NL",
      viewport: { width: 1280, height: 800 },
    });
    const cookies = Object.entries(cookieDict).map(([name, value]) => ({
      name,
      value,
      url: state.url,
    }));
    if (cookies.length) {
      await context.addCookies(cookies);
    }
    const page = await context.newPage();
    return await fn(page, state);
  } finally {
    await browser.close();
  }
}

function parseFlag(args, name) {
  const idx = args.indexOf(name);
  if (idx < 0) {
    return null;
  }
  return args[idx + 1] ?? null;
}

function ariaDump(node, depth = 0) {
  if (!node) {
    return "";
  }
  const bits = [node.role, node.name ? `"${node.name}"` : ""]
    .filter(Boolean)
    .join(" ");
  const line = `${"  ".repeat(depth)}${bits}`.trimEnd();
  const kids = (node.children ?? []).map((child) => ariaDump(child, depth + 1));
  return [line, ...kids].filter(Boolean).join("\n");
}

async function cmdBrowser(args) {
  const action = args[0];
  const rest = args.slice(1);
  if (!action) {
    die(
      "usage: control-bragfast browser goto|click|fill|snapshot|screenshot ...",
    );
  }

  if (action === "goto") {
    const path = rest[0] || "/";
    const out = parseFlag(rest, "--path");
    await withPage(async (page, state) => {
      await page.goto(new URL(path, state.url).href, {
        waitUntil: "load",
      });
      if (out) {
        writeArtifact(out, await page.content());
      }
      console.log(`url ${page.url()}`);
      console.log(`title ${await page.title()}`);
    });
    return;
  }

  if (action === "click") {
    const role = parseFlag(rest, "--role");
    const name = parseFlag(rest, "--name");
    const path = rest.find((arg) => arg.startsWith("/")) || "/";
    await withPage(async (page, state) => {
      await page.goto(new URL(path, state.url).href, {
        waitUntil: "load",
      });
      if (!role || !name) {
        die("browser click needs --role and --name");
      }
      await page.getByRole(role, { name: new RegExp(name, "i") }).click();
      console.log(`clicked ${role} ${name}`);
      console.log(`url ${page.url()}`);
    });
    return;
  }

  if (action === "fill") {
    const selector = parseFlag(rest, "--selector") || "#catalog-search";
    const value = parseFlag(rest, "--value");
    const path = rest.find((arg) => arg.startsWith("/")) || "/";
    if (value == null) {
      die("browser fill needs --value");
    }
    const submit = rest.includes("--submit");
    const out = parseFlag(rest, "--path");
    await withPage(async (page, state) => {
      await page.goto(new URL(path, state.url).href, {
        waitUntil: "load",
      });
      await page.locator(selector).fill(value);
      if (submit) {
        await page.locator(selector).press("Enter");
        await page.waitForLoadState("load");
      }
      console.log(`url ${page.url()}`);
      if (out) {
        if (out.endsWith(".png")) {
          const full = artifactPath(out);
          mkdirSync(dirname(full), { recursive: true });
          await page.screenshot({ path: full, fullPage: true });
          console.log(`saved ${full}`);
        } else {
          writeArtifact(out, await page.content());
          console.log(`saved ${artifactPath(out)}`);
        }
      }
    });
    return;
  }

  if (action === "screenshot") {
    const path = parseFlag(rest, "--goto") || rest.find((arg) => arg.startsWith("/")) || "/";
    const out = parseFlag(rest, "--path");
    if (!out) {
      die("browser screenshot needs --path");
    }
    await withPage(async (page, state) => {
      await page.goto(new URL(path, state.url).href, {
        waitUntil: "load",
      });
      const full = artifactPath(out);
      mkdirSync(dirname(full), { recursive: true });
      await page.screenshot({ path: full, fullPage: true });
      console.log(`saved ${full}`);
      console.log(`url ${page.url()}`);
    });
    return;
  }

  if (action === "snapshot") {
    const path = parseFlag(rest, "--goto") || rest.find((arg) => arg.startsWith("/")) || "/";
    const out = parseFlag(rest, "--path");
    await withPage(async (page, state) => {
      await page.goto(new URL(path, state.url).href, {
        waitUntil: "load",
      });
      const snapshot = await page.accessibility.snapshot();
      const text = ariaDump(snapshot);
      if (out) {
        const saved = writeArtifact(out, `${page.url()}\n${text}\n`);
        console.log(`saved ${saved}`);
      } else {
        console.log(text);
      }
    });
    return;
  }

  die(`unknown browser action ${action}`);
}

function cmdCleanup() {
  const state = loadState();
  if (!state?.pid) {
    console.log("nothing to clean");
    return;
  }
  if (pidAlive(state.pid)) {
    try {
      process.kill(-state.pid, "SIGTERM");
    } catch {
      try {
        process.kill(state.pid, "SIGTERM");
      } catch {
        // already gone
      }
    }
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && pidAlive(state.pid)) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
    if (pidAlive(state.pid)) {
      try {
        process.kill(-state.pid, "SIGKILL");
      } catch {
        try {
          process.kill(state.pid, "SIGKILL");
        } catch {
          // ignore
        }
      }
    }
    console.log(`killed pid ${state.pid}`);
  } else {
    console.log(`pid ${state.pid} already gone`);
  }
  try {
    unlinkSync(STATE_PATH);
  } catch {
    // ignore
  }
  try {
    unlinkSync(COOKIE_PATH);
  } catch {
    // ignore
  }
  try {
    unlinkSync(LOG_PATH);
  } catch {
    // ignore
  }
  console.log(`evidence kept under ${ARTIFACTS}`);
}

const [command, ...rest] = process.argv.slice(2);

if (!command || command === "help" || command === "-h") {
  console.log(`control-bragfast — dedicated brag.fast verification driver

  launch
  doctor
  http GET <path> [--out artifacts/...] [--no-follow]
  http POST /api/locale --json '{"locale":"en"}'
  browser goto <path>
  browser click --role button --name "Inloggen" /
  browser fill --selector "#catalog-search" --value anne --submit --path artifacts/x.html
  browser screenshot --goto / --path artifacts/home.png
  browser snapshot --aria --goto / --path artifacts/home.aria.txt
  cleanup

Binds 127.0.0.1:${DEFAULT_PORT}. Never drives http://77.42.31.66/ or :3002.
`);
  process.exit(0);
}

const run = {
  launch: cmdLaunch,
  doctor: cmdDoctor,
  http: () => cmdHttp(rest),
  browser: () => cmdBrowser(rest),
  cleanup: cmdCleanup,
}[command];

if (!run) {
  die(`unknown command ${command}`);
}

Promise.resolve(run()).catch((error) => {
  die(error instanceof Error ? error.stack || error.message : String(error));
});
