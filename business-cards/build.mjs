// Creative Dimensions business cards (85 x 55 mm, front + back).
// QR code points to https://www.creativedimensionslb.com/info (matrix in qr-matrix.json).
// Run: node business-cards/build.mjs
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const DIR = path.dirname(fileURLToPath(import.meta.url));
const W = 85, H = 55, BLEED = 3;
const CORAL = "#FF8B64", INK = "#0D0D0D", WHITE = "#FFFFFF", MUTED = "#bdb6ae";
const FONT = '<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=block" rel="stylesheet">';

const SWOOSH_D = "M4 366 C 40 290, 95 200, 165 194 C 215 190, 245 230, 248 290 C 250 318, 262 332, 285 328 C 360 312, 440 220, 508 96 C 470 190, 410 300, 330 372 C 290 408, 245 425, 210 405 C 182 388, 178 350, 178 320 C 178 282, 160 262, 130 266 C 85 272, 40 320, 4 366 Z";
let uid = 0;
function swoosh(x, y, w, opacity = 1) {
  const id = "s" + uid++;
  return `<g transform="translate(${x} ${y}) scale(${w / 512})" opacity="${opacity}">
  <defs>
    <linearGradient id="${id}g" x1="0" y1="0" x2="512" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7fd6b4"/><stop offset=".18" stop-color="#2f8f86"/>
      <stop offset=".38" stop-color="#1f6a6c"/><stop offset=".46" stop-color="#2f605c"/>
      <stop offset=".52" stop-color="#8a5f3e"/><stop offset=".6" stop-color="#d9692a"/>
      <stop offset=".78" stop-color="#f2741f"/><stop offset="1" stop-color="#ff8a2a"/>
    </linearGradient>
    <linearGradient id="${id}s" x1="0" y1="190" x2="0" y2="425" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/>
    </linearGradient>
  </defs>
  <path fill="url(#${id}g)" d="${SWOOSH_D}"/><path fill="url(#${id}s)" d="${SWOOSH_D}"/></g>`;
}

// 24-unit line icons (Lucide shapes), drawn in coral.
const icon = (inner, x, y, s, c = CORAL) =>
  `<g transform="translate(${x} ${y}) scale(${s / 24})" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
const I = {
  wa: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  ig: '<rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="17.6" cy="6.4" r="1" fill="currentColor"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  web: '<circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4.4" ry="10"/><path d="M2 12h20M4.2 6.5h15.6M4.2 17.5h15.6"/>',
};

function qr(x, y, size) {
  const m = JSON.parse(fs.readFileSync(path.join(DIR, "qr-matrix.json"), "utf8"));
  const n = m.length, k = size / n;
  let d = "";
  m.forEach((row, r) => row.forEach((v, c) => { if (v) d += `M${(x + c * k).toFixed(3)} ${(y + r * k).toFixed(3)}h${k.toFixed(3)}v${k.toFixed(3)}h${(-k).toFixed(3)}z`; }));
  return `<path d="${d}" fill="${INK}" shape-rendering="crispEdges"/>`;
}

const front = () => `
  <rect x="${-BLEED}" y="${-BLEED}" width="${W + 2 * BLEED}" height="${H + 2 * BLEED}" fill="${INK}"/>
  ${swoosh(W / 2 - 15, 4.2, 30)}
  <text x="${W / 2}" y="34.6" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="5.6" letter-spacing=".12">
    <tspan fill="${WHITE}">CREATIVE</tspan> <tspan fill="${CORAL}">DIMENSIONS</tspan></text>
  <text x="${W / 2}" y="39.6" text-anchor="middle" font-family="Ubuntu" font-weight="500" font-size="2.15" letter-spacing=".7" fill="${MUTED}">3D PRINTING STUDIO · LEBANON</text>
  <rect x="${W / 2 - 6}" y="44" width="12" height=".5" rx=".25" fill="${CORAL}"/>
  <text x="${W / 2}" y="49.4" text-anchor="middle" font-family="Ubuntu" font-weight="400" font-size="2.05" fill="${MUTED}" font-style="italic">Designed with taste. Printed with precision.</text>`;

const rows = [
  [I.wa, "+961 70 304 007", "WhatsApp"],
  [I.ig, "@creativedimensions.lb", "Instagram"],
  [I.mail, "support@creativedimensionslb.com", "Email"],
  [I.web, "creativedimensionslb.com", "Shop online"],
];
const back = () => `
  <rect x="${-BLEED}" y="${-BLEED}" width="${W + 2 * BLEED}" height="${H + 2 * BLEED}" fill="${INK}"/>
  <rect x="${-BLEED}" y="${-BLEED}" width="${W + 2 * BLEED}" height="${BLEED + 2.2}" fill="${CORAL}"/>
  ${swoosh(6, 7.4, 10)}
  <text x="17.6" y="12.6" font-family="Ubuntu" font-weight="700" font-size="3.1" letter-spacing=".08">
    <tspan fill="${WHITE}">CREATIVE</tspan> <tspan fill="${CORAL}">DIMENSIONS</tspan></text>
  ${rows.map(([ic, main, sub], i) => {
    const y = 19.6 + i * 8.2;
    return `${icon(ic, 6.2, y - 0.2, 4)}
      <text x="12.6" y="${y + 1.9}" font-family="Ubuntu" font-weight="500" font-size="${main.length > 26 ? 2.12 : 2.45}" fill="${WHITE}">${main}</text>
      <text x="12.6" y="${y + 4.7}" font-family="Ubuntu" font-weight="400" font-size="1.75" fill="${MUTED}">${sub}</text>`;
  }).join("")}
  <rect x="56.5" y="12.5" width="23.5" height="23.5" rx="2.2" fill="${WHITE}"/>
  ${qr(58.9, 14.9, 18.7)}
  <text x="68.25" y="40.6" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="2.3" fill="${CORAL}">Scan me</text>
  <text x="68.25" y="43.6" text-anchor="middle" font-family="Ubuntu" font-weight="400" font-size="1.7" fill="${MUTED}">all our contacts</text>
  <text x="68.25" y="45.9" text-anchor="middle" font-family="Ubuntu" font-weight="400" font-size="1.7" fill="${MUTED}">in one place</text>`;

const side = (art, b = BLEED) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W + 2 * b}mm" height="${H + 2 * b}mm" viewBox="${-b} ${-b} ${W + 2 * b} ${H + 2 * b}">${art}</svg>`;
const doc = (pages, wmm, hmm) => `<!DOCTYPE html><html><head><meta charset="utf-8">${FONT}
<style>@page{size:${wmm}mm ${hmm}mm;margin:0}*{margin:0;padding:0}html,body{background:transparent}
.p{width:${wmm}mm;height:${hmm}mm;overflow:hidden;page-break-after:always}svg{display:block}</style></head>
<body>${pages.map((p) => `<div class="p">${p}</div>`).join("")}</body></html>`;

const out = (...p) => { const f = path.join(DIR, ...p); fs.mkdirSync(path.dirname(f), { recursive: true }); return f; };
const MM = 96 / 25.4;
const browser = await chromium.launch();
async function render(pages, wmm, hmm, { pdf, png, scale = 300 / 96 }) {
  const ctx = await browser.newContext({ deviceScaleFactor: scale, viewport: { width: Math.ceil(wmm * MM), height: Math.ceil(hmm * MM) } });
  const page = await ctx.newPage();
  await page.setContent(doc(pages, wmm, hmm), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (pdf) await page.pdf({ path: pdf, width: `${wmm}mm`, height: `${hmm}mm`, printBackground: true });
  if (png) await page.screenshot({ path: png, clip: { x: 0, y: 0, width: wmm * MM, height: hmm * MM } });
  await ctx.close();
}

const BW = W + 2 * BLEED, BH = H + 2 * BLEED;
// Single card: page 1 front, page 2 back (standard for printers).
await render([side(front()), side(back())], BW, BH, { pdf: out("print", "business-card_front-and-back_3mm-bleed.pdf") });
await render([side(front())], BW, BH, { png: out("print", "business-card_FRONT_3mm-bleed_300dpi.png") });
await render([side(back())], BW, BH, { png: out("print", "business-card_BACK_3mm-bleed_300dpi.png") });

// A4 sheets, 8-up (2 x 4) with crop marks: page 1 fronts, page 2 backs (layout is symmetric, so duplex lines up).
const A4W = 210, A4H = 297, G = 6, cols = 2, rowsN = 4;
const ox = (A4W - (cols * BW + (cols - 1) * G)) / 2, oy = (A4H - (rowsN * BH + (rowsN - 1) * G)) / 2;
function sheet(art) {
  let g = "", marks = "";
  for (let r = 0; r < rowsN; r++) for (let c = 0; c < cols; c++) {
    const x = ox + c * (BW + G) + BLEED, y = oy + r * (BH + G) + BLEED;
    g += `<g transform="translate(${x} ${y})">${art()}</g>`;
    for (const [mx, my] of [[x, y], [x + W, y], [x, y + H], [x + W, y + H]]) {
      const sx = mx === x ? -1 : 1, sy = my === y ? -1 : 1;
      marks += `<path d="M${mx + sx * (BLEED + 0.5)} ${my}h${sx * 2.5}M${mx} ${my + sy * (BLEED + 0.5)}v${sy * 2.5}" stroke="#000" stroke-width=".15"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297"><rect width="210" height="297" fill="#fff"/>${g}${marks}</svg>`;
}
await render([sheet(front), sheet(back)], A4W, A4H, { pdf: out("print", "business-cards_A4_8-up_fronts-then-backs.pdf"), scale: 1 });

// Mockup: both sides on a table.
const MW = 230, MH = 120;
const card = (art, x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot} ${W / 2} ${H / 2})" filter="url(#sh)">
  <clipPath id="c${x}"><rect width="${W}" height="${H}" rx="1.5"/></clipPath><g clip-path="url(#c${x})">${art}</g></g>`;
const mock = `<svg xmlns="http://www.w3.org/2000/svg" width="${MW}mm" height="${MH}mm" viewBox="0 0 ${MW} ${MH}">
<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.6" stdDeviation="2.2" flood-opacity=".35"/></filter></defs>
<rect width="${MW}" height="${MH}" fill="#e9e3dc"/>
${card(front(), 18, 30, -4)}${card(back(), 124, 34, 3)}
<text x="60" y="108" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="5" fill="#5b544d">Front</text>
<text x="167" y="108" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="5" fill="#5b544d">Back</text></svg>`;
await render([mock], MW, MH, { png: out("BUSINESS-CARDS-mockup.png"), scale: 2.2 });
await browser.close();
console.log("done");
