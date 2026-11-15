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
const W = 95, H = 55, BLEED = 3, M = 7; // M = inner margin used by every element
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

// Front: one centred stack with equal top and bottom space.
const front = () => `
  <rect x="${-BLEED}" y="${-BLEED}" width="${W + 2 * BLEED}" height="${H + 2 * BLEED}" fill="${INK}"/>
  ${swoosh(W / 2 - 16, 0.2, 32)}
  <text x="${W / 2}" y="35.2" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="6.2" letter-spacing=".14">
    <tspan fill="${WHITE}">CREATIVE</tspan> <tspan fill="${CORAL}">DIMENSIONS</tspan></text>
  <text x="${W / 2}" y="40.4" text-anchor="middle" font-family="Ubuntu" font-weight="500" font-size="2.35" letter-spacing=".8" fill="${MUTED}">3D PRINTING STUDIO · LEBANON</text>
  <rect x="${W / 2 - 7}" y="43.3" width="14" height=".5" rx=".25" fill="${CORAL}"/>
  <text x="${W / 2}" y="48.6" text-anchor="middle" font-family="Ubuntu" font-weight="400" font-size="2.25" fill="${MUTED}" font-style="italic">Designed with taste. Printed with precision.</text>`;

const rows = [
  [I.wa, "+961 70 304 007", "WhatsApp"],
  [I.ig, "@creativedimensions.lb", "Instagram"],
  [I.mail, "support@creativedimensionslb.com", "Email"],
  [I.web, "creativedimensionslb.com", "Shop online"],
];
// Back grid: 7 mm margins. Header across the full width; below it the contact list (left)
// and the QR (right) share the same top line, and the last row lines up with the QR caption.
const BODY_TOP = 18.5, QR_SIZE = 24, QR_X = W - M - QR_SIZE, PITCH = 7.97;
const back = () => `
  <rect x="${-BLEED}" y="${-BLEED}" width="${W + 2 * BLEED}" height="${H + 2 * BLEED}" fill="${INK}"/>
  ${swoosh(M - 0.3, 3.6, 11)}
  <text x="${M + 12.2}" y="11.2" font-family="Ubuntu" font-weight="700" font-size="3.4" letter-spacing=".1">
    <tspan fill="${WHITE}">CREATIVE</tspan> <tspan fill="${CORAL}">DIMENSIONS</tspan></text>
  <rect x="${M}" y="14.2" width="${W - 2 * M}" height=".35" fill="${CORAL}"/>
  ${rows.map(([ic, main, sub], i) => {
    const top = BODY_TOP + i * PITCH;
    return `${icon(ic, M, top - 0.1, 4.4)}
      <text x="${M + 6.6}" y="${top + 2}" font-family="Ubuntu" font-weight="500" font-size="${main.length > 26 ? 2.35 : 2.6}" fill="${WHITE}">${main}</text>
      <text x="${M + 6.6}" y="${top + 4.9}" font-family="Ubuntu" font-weight="400" font-size="1.85" fill="${MUTED}">${sub}</text>`;
  }).join("")}
  <rect x="${QR_X}" y="${BODY_TOP}" width="${QR_SIZE}" height="${QR_SIZE}" rx="2.2" fill="${WHITE}"/>
  ${qr(QR_X + 2.8, BODY_TOP + 2.8, QR_SIZE - 5.6)}
  <text x="${QR_X + QR_SIZE / 2}" y="${BODY_TOP + 3 * PITCH + 4.9}" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="2.2" fill="${CORAL}">Scan for all contacts</text>`;

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

// A4 home-print sheet: 10 cards (2 x 5, 95 x 55 mm) with a 2.5 mm white gap to cut along.
// Page 1 fronts, page 2 backs. The grid is centred and every card is identical, so it lines up
// whether the printer flips on the long or the short edge. Cut along the front's card edges:
// the backs run 1.25 mm into the gaps, so a small duplex shift leaves no white edge on the back.
const A4W = 210, A4H = 297, cols = 2, rowsN = 5, GAP = 2.5;
const gx = (A4W - cols * W - (cols - 1) * GAP) / 2, gy = (A4H - rowsN * H - (rowsN - 1) * GAP) / 2;
function sheet(art, overlap) {
  let g = "";
  for (let r = 0; r < rowsN; r++) for (let c = 0; c < cols; c++) {
    const x = gx + c * (W + GAP) - overlap, y = gy + r * (H + GAP) - overlap;
    const w = W + 2 * overlap, h = H + 2 * overlap;
    g += `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${-overlap} ${-overlap} ${w} ${h}" overflow="hidden">${art()}</svg>`;
  }
  // Short cut guides in the side margins, level with every card edge.
  let guides = "";
  for (let r = 0; r < rowsN; r++) for (const y of [gy + r * (H + GAP), gy + r * (H + GAP) + H]) {
    guides += `<path d="M1.5 ${y}H${gx - 1.5}M${A4W - gx + 1.5} ${y}H${A4W - 1.5}"/>`;
  }
  for (let c = 0; c < cols; c++) for (const x of [gx + c * (W + GAP), gx + c * (W + GAP) + W]) {
    guides += `<path d="M${x} 1V${gy - 1.5}M${x} ${A4H - gy + 1.5}V${A4H - 1}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">
    <rect width="210" height="297" fill="#fff"/>${g}<g stroke="#000" stroke-width=".2">${guides}</g></svg>`;
}
await render([sheet(front, 0), sheet(back, GAP / 2)], A4W, A4H, { pdf: out("print", "business-cards_A4_10-up_HOME-PRINT_front-and-back.pdf"), scale: 1 });

// Mockup: both sides on a table.
const MW = 230, MH = 120;
const card = (art, x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot} ${W / 2} ${H / 2})" filter="url(#sh)">
  <clipPath id="c${x}"><rect width="${W}" height="${H}" rx="1.5"/></clipPath><g clip-path="url(#c${x})">${art}</g></g>`;
const mock = `<svg xmlns="http://www.w3.org/2000/svg" width="${MW}mm" height="${MH}mm" viewBox="0 0 ${MW} ${MH}">
<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.6" stdDeviation="2.2" flood-opacity=".35"/></filter></defs>
<rect width="${MW}" height="${MH}" fill="#e9e3dc"/>
${card(front(), 10, 30, -4)}${card(back(), 122, 34, 3)}
<text x="57" y="108" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="5" fill="#5b544d">Front</text>
<text x="170" y="108" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="5" fill="#5b544d">Back</text></svg>`;
await render([mock], MW, MH, { png: out("BUSINESS-CARDS-mockup.png"), scale: 2.2 });
await browser.close();
console.log("done");
