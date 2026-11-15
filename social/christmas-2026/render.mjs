// Render every poster HTML page to JPG. Usage: node render.mjs <html_dir> <out_dir> [filter]
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const [htmlDir, outDir, filter = ""] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const files = fs.readdirSync(htmlDir).filter((f) => f.endsWith(".html") && f.includes(filter)).sort();
const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const page = await ctx.newPage();
for (const f of files) {
  const story = f.includes("_story");
  await page.setViewportSize({ width: 1080, height: story ? 1920 : 1350 });
  await page.goto("file://" + path.resolve(htmlDir, f), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(outDir, f.replace(".html", ".jpg")), type: "jpeg", quality: 92 });
}
await browser.close();
console.log(`rendered ${files.length}`);
