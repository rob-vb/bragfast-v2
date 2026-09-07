import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const playwrightPath = [
  "/tmp/pw-repro/node_modules/playwright-core",
  new URL("../node_modules/playwright-core", import.meta.url).pathname,
].find((path) => existsSync(path));
if (!playwrightPath) {
  throw new Error("playwright-core is not installed");
}
const { chromium } = require(playwrightPath);

const PREVIEW = process.env.REPRO_URL || "http://77.42.31.66/";
const chrome =
  process.env.CHROME_PATH ||
  "/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const BLUSH = "rgb(250, 113, 90)";

const browser = await chromium.launch({
  executablePath: chrome,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const failures = [];

function checkButtons(label, buttons) {
  for (const button of buttons) {
    if (button.backgroundImage.includes("gradient")) {
      failures.push(
        `${label}: "${button.text}" uses ${button.backgroundImage}`,
      );
    }
  }
  const signIn = buttons.find((button) =>
    /sign in|inloggen/i.test(button.text),
  );
  if (signIn && signIn.backgroundColor !== BLUSH) {
    failures.push(
      `${label}: sign-in fill is ${signIn.backgroundColor}, expected ${BLUSH}`,
    );
  }
  const search = buttons.find((button) =>
    /search|zoeken/i.test(button.text),
  );
  if (search && search.backgroundColor !== BLUSH) {
    failures.push(
      `${label}: search fill is ${search.backgroundColor}, expected ${BLUSH}`,
    );
  }
}

async function measureHome(viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(PREVIEW, { waitUntil: "networkidle" });

  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll("button, [data-slot='button']")].map((el) => {
      const cs = getComputedStyle(el);
      return {
        text: (el.innerText || "").trim().slice(0, 40),
        backgroundImage: cs.backgroundImage,
        backgroundColor: cs.backgroundColor,
      };
    }),
  );
  checkButtons(`${viewport.width}x${viewport.height} home`, buttons);

  await page.getByRole("button", { name: /inloggen|sign in/i }).click();
  await page.locator('[role="dialog"]').waitFor();

  const dialog = await page.evaluate(() => {
    const el = document.querySelector('[role="dialog"]');
    const r = el.getBoundingClientRect();
    let overlay = el.parentElement;
    while (overlay && getComputedStyle(overlay).position !== "fixed") {
      overlay = overlay.parentElement;
    }
    const o = overlay?.getBoundingClientRect();
    return {
      top: r.top,
      overlayHeight: o?.height ?? 0,
      viewportHeight: window.innerHeight,
    };
  });

  if (dialog.top < -1) {
    failures.push(
      `${viewport.width}x${viewport.height}: dialog top ${dialog.top} is above the viewport`,
    );
  }
  if (dialog.overlayHeight < dialog.viewportHeight * 0.9) {
    failures.push(
      `${viewport.width}x${viewport.height}: overlay height ${dialog.overlayHeight} is not the viewport (${dialog.viewportHeight})`,
    );
  }

  await page.close();
}

async function measureCityChips() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(new URL("/nl/haarlem", PREVIEW).href, { waitUntil: "networkidle" });
  const chips = await page.evaluate(() =>
    [...document.querySelectorAll("a.candy-key, button.candy-key")].map((el) => {
      const cs = getComputedStyle(el);
      return {
        text: (el.innerText || "").trim().slice(0, 40),
        backgroundImage: cs.backgroundImage,
        boxShadow: cs.boxShadow,
      };
    }),
  );
  for (const chip of chips) {
    if (chip.backgroundImage.includes("gradient")) {
      failures.push(`haarlem chip "${chip.text}" uses ${chip.backgroundImage}`);
    }
  }
  await page.close();
}

for (const viewport of [
  { width: 390, height: 700 },
  { width: 1280, height: 720 },
  { width: 1280, height: 500 },
]) {
  await measureHome(viewport);
}
await measureCityChips();
await browser.close();

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("UI_CONTROLS_VERIFIED");
