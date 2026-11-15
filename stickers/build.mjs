// Creative Dimensions packaging stickers.
// Output: print-ready PDF (vector, 3 mm bleed), 300 dpi PNG with bleed, cut-line PDF,
// transparent preview PNG and A4 sheets. Run: node stickers/build.mjs
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const DIR = path.dirname(fileURLToPath(import.meta.url));
const BLEED = 3; // mm
const CORAL = "#FF8B64", INK = "#0D0D0D", CREAM = "#FFF6EF", WHITE = "#FFFFFF";
const FONT = '<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=block" rel="stylesheet">';

// Swoosh path, redrawn as vector from app/icon.png (512 box).
const SWOOSH_D = "M4 366 C 40 290, 95 200, 165 194 C 215 190, 245 230, 248 290 C 250 318, 262 332, 285 328 C 360 312, 440 220, 508 96 C 470 190, 410 300, 330 372 C 290 408, 245 425, 210 405 C 182 388, 178 350, 178 320 C 178 282, 160 262, 130 266 C 85 272, 40 320, 4 366 Z";
let uid = 0;
function swoosh(x, y, w) {
  const id = "s" + uid++;
  const k = w / 512;
  return `<g transform="translate(${x} ${y}) scale(${k})">
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

// Each design is drawn in a mm coordinate system of its trim size (w x h).
const designs = [
  {
    name: "01-round-logo-seal", label: "Round logo seal", w: 63.5, h: 63.5, shape: "circle", bg: INK,
    art: (w) => `
      <circle cx="${w / 2}" cy="${w / 2}" r="${w / 2 - 3.2}" fill="none" stroke="${CORAL}" stroke-width=".55"/>
      <defs><path id="arcTop" d="M ${8.3} ${w / 2} A ${w / 2 - 8.3} ${w / 2 - 8.3} 0 0 1 ${w - 8.3} ${w / 2}"/>
            <path id="arcBot" d="M ${5.6} ${w / 2} A ${w / 2 - 5.6} ${w / 2 - 5.6} 0 0 0 ${w - 5.6} ${w / 2}"/></defs>
      <text font-family="Ubuntu" font-weight="700" font-size="4.3" letter-spacing=".55" fill="${WHITE}">
        <textPath href="#arcTop" startOffset="50%" text-anchor="middle">CREATIVE DIMENSIONS</textPath></text>
      <text font-family="Ubuntu" font-weight="500" font-size="3.3" letter-spacing=".9" fill="${CORAL}">
        <textPath href="#arcBot" startOffset="50%" text-anchor="middle">3D PRINTED IN LEBANON</textPath></text>
      ${swoosh(w / 2 - 17.5, w / 2 - 19.5, 35)}
      <circle cx="${w / 2 - 22}" cy="${w / 2 + 6.5}" r=".7" fill="${CORAL}"/>
      <circle cx="${w / 2 + 22}" cy="${w / 2 + 6.5}" r=".7" fill="${CORAL}"/>`,
  },
  {
    name: "02-round-thank-you", label: "Thank-you sticker", w: 50.8, h: 50.8, shape: "circle", bg: CREAM,
    art: (w) => `
      <circle cx="${w / 2}" cy="${w / 2}" r="${w / 2 - 2.6}" fill="none" stroke="${CORAL}" stroke-width=".5" stroke-dasharray="1.2 1"/>
      ${swoosh(w / 2 - 8, 6.2, 16)}
      <text x="${w / 2}" y="27.4" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="8.4" fill="${INK}" letter-spacing="-.2">thank you</text>
      <text x="${w / 2}" y="32.6" text-anchor="middle" font-family="Ubuntu" font-weight="500" font-size="2.5" fill="${INK}" opacity=".8">for supporting a small business</text>
      <rect x="${w / 2 - 16.5}" y="35.6" width="33" height="5.6" rx="2.8" fill="${CORAL}"/>
      <text x="${w / 2}" y="39.4" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="2.65" fill="${INK}">@creativedimensions.lb</text>`,
  },
  {
    name: "03-label-dark", label: "Wordmark label (dark)", w: 76, h: 30, shape: "rounded", r: 4, bg: INK,
    art: (w, h) => `
      ${swoosh(4, 3.2, 20)}
      <text x="26.5" y="13.8" font-family="Ubuntu" font-weight="700" font-size="6.1" fill="${WHITE}" letter-spacing=".15">CREATIVE</text>
      <text x="26.5" y="20" font-family="Ubuntu" font-weight="700" font-size="6.1" fill="${CORAL}" letter-spacing=".15">DIMENSIONS</text>
      <text x="26.7" y="24.6" font-family="Ubuntu" font-weight="400" font-size="2.6" fill="#bdb6ae" letter-spacing=".1">creativedimensionslb.com</text>`,
  },
  {
    name: "04-label-light", label: "Wordmark label (light)", w: 76, h: 30, shape: "rounded", r: 4, bg: WHITE,
    art: (w, h) => `
      ${swoosh(4, 3.2, 20)}
      <text x="26.5" y="13.8" font-family="Ubuntu" font-weight="700" font-size="6.1" fill="${INK}" letter-spacing=".15">CREATIVE</text>
      <text x="26.5" y="20" font-family="Ubuntu" font-weight="700" font-size="6.1" fill="#F0703E" letter-spacing=".15">DIMENSIONS</text>
      <text x="26.7" y="24.6" font-family="Ubuntu" font-weight="400" font-size="2.6" fill="#5a5550" letter-spacing=".1">creativedimensionslb.com</text>`,
  },
  {
    name: "05-mini-box-seal", label: "Mini box seal", w: 38, h: 38, shape: "circle", bg: INK,
    art: (w) => `
      <circle cx="${w / 2}" cy="${w / 2}" r="${w / 2 - 2.4}" fill="none" stroke="${CORAL}" stroke-width=".5"/>
      ${swoosh(w / 2 - 11, w / 2 - 15.5, 22)}
      <defs><path id="arcMini" d="M ${4.6} ${w / 2} A ${w / 2 - 4.6} ${w / 2 - 4.6} 0 0 0 ${w - 4.6} ${w / 2}"/></defs>
      <text font-family="Ubuntu" font-weight="700" font-size="2.5" letter-spacing=".45" fill="${WHITE}">
        <textPath href="#arcMini" startOffset="50%" text-anchor="middle">CREATIVE DIMENSIONS</textPath></text>`,
  },
];

function trimPath(d) {
  if (d.shape === "circle") return `<circle cx="${d.w / 2}" cy="${d.h / 2}" r="${d.w / 2}"/>`;
  return `<rect x="0" y="0" width="${d.w}" height="${d.h}" rx="${d.r}"/>`;
}

// mode: "print" (bleed, full bg), "cut" (bleed size, hairline only), "preview" (shape only, transparent)
function svg(d, mode) {
  const b = mode === "preview" ? 0 : BLEED;
  const W = d.w + 2 * b, H = d.h + 2 * b;
  let inner;
  if (mode === "cut") {
    inner = `<g fill="none" stroke="#FF00FF" stroke-width=".1">${trimPath(d)}</g>`;
  } else {
    const bg = mode === "print"
      ? `<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="${d.bg}"/>`
      : `<g fill="${d.bg}">${trimPath(d)}</g>`;
    inner = bg + d.art(d.w, d.h);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="${-b} ${-b} ${W} ${H}">${inner}</svg>`;
}

const doc = (body, wmm, hmm) => `<!DOCTYPE html><html><head><meta charset="utf-8">${FONT}
<style>@page{size:${wmm}mm ${hmm}mm;margin:0}*{margin:0;padding:0}html,body{width:${wmm}mm;height:${hmm}mm;background:transparent}
svg{display:block}</style></head><body>${body}</body></html>`;

const out = (...p) => { const f = path.join(DIR, ...p); fs.mkdirSync(path.dirname(f), { recursive: true }); return f; };
const MM = 96 / 25.4;

const browser = await chromium.launch();
async function render(html, wmm, hmm, { pdf, png, scale = 300 / 96, transparent = false }) {
  const ctx = await browser.newContext({ deviceScaleFactor: scale, viewport: { width: Math.ceil(wmm * MM), height: Math.ceil(hmm * MM) } });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (pdf) await page.pdf({ path: pdf, width: `${wmm}mm`, height: `${hmm}mm`, printBackground: true, pageRanges: "1" });
  if (png) await page.screenshot({ path: png, omitBackground: transparent, clip: { x: 0, y: 0, width: wmm * MM, height: hmm * MM } });
  await ctx.close();
}

for (const d of designs) {
  const W = d.w + 2 * BLEED, H = d.h + 2 * BLEED;
  await render(doc(svg(d, "print"), W, H), W, H, { pdf: out("print", `${d.name}_print-with-3mm-bleed.pdf`), png: out("print", `${d.name}_print-with-3mm-bleed_300dpi.png`) });
  await render(doc(svg(d, "cut"), W, H), W, H, { pdf: out("print", `${d.name}_cutline.pdf`) });
  await render(doc(svg(d, "preview"), d.w, d.h), d.w, d.h, { png: out("preview", `${d.name}.png`), transparent: true });
  fs.writeFileSync(out("print", `${d.name}.svg`), svg(d, "print"));
}

// A4 sheets: as many of each design as fit, with 4 mm gaps between bleed boxes.
for (const d of designs) {
  const A4W = 210, A4H = 297, M = 10, G = 4, b = BLEED;
  const cw = d.w + 2 * b, ch = d.h + 2 * b;
  const cols = Math.floor((A4W - 2 * M + G) / (cw + G)), rows = Math.floor((A4H - 2 * M + G) / (ch + G));
  const ox = (A4W - (cols * cw + (cols - 1) * G)) / 2, oy = (A4H - (rows * ch + (rows - 1) * G)) / 2;
  let art = "", cut = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = ox + c * (cw + G) + b, y = oy + r * (ch + G) + b;
    art += `<g transform="translate(${x} ${y})"><rect x="${-b}" y="${-b}" width="${cw}" height="${ch}" fill="${d.bg}"/>${d.art(d.w, d.h)}</g>`;
    cut += `<g transform="translate(${x} ${y})" fill="none" stroke="#FF00FF" stroke-width=".1">${trimPath(d)}</g>`;
  }
  const sheet = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297"><rect width="210" height="297" fill="#fff"/>${inner}</svg>`;
  await render(doc(sheet(art), A4W, A4H), A4W, A4H, { pdf: out("a4-sheets", `${d.name}_A4_${cols * rows}-up.pdf`), scale: 1 });
  await render(doc(sheet(art + cut), A4W, A4H), A4W, A4H, { pdf: out("a4-sheets", `${d.name}_A4_${cols * rows}-up_with-cutlines.pdf`), scale: 1 });
  d.up = cols * rows;
}

// Overview mockup of all designs.
let x = 12, items = "";
const ow = designs.reduce((s, d) => s + d.w + 12, 12), oh = 63.5 + 40;
for (const d of designs) {
  const y = 14 + (63.5 - d.h) / 2;
  items += `<g transform="translate(${x} ${y})"><g filter="url(#sh)">${svg(d, "preview").replace(/<svg[^>]*>|<\/svg>/g, "")}</g></g>
  <text x="${x + d.w / 2}" y="${14 + 63.5 + 9}" text-anchor="middle" font-family="Ubuntu" font-weight="700" font-size="3.6" fill="#2a2724">${d.label}</text>
  <text x="${x + d.w / 2}" y="${14 + 63.5 + 14}" text-anchor="middle" font-family="Ubuntu" font-size="3" fill="#7a736c">${d.shape === "circle" ? `${(d.w / 25.4).toFixed(1).replace(".0", "")}" round` : `${d.w} × ${d.h} mm`}</text>`;
  x += d.w + 12;
}
const ov = `<svg xmlns="http://www.w3.org/2000/svg" width="${ow}mm" height="${oh}mm" viewBox="0 0 ${ow} ${oh}">
<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy=".8" stdDeviation="1.2" flood-opacity=".28"/></filter></defs>
<rect width="${ow}" height="${oh}" fill="#ece6df"/>${items}</svg>`;
await render(doc(ov, ow, oh), ow, oh, { png: out("ALL-STICKERS-preview.png"), scale: 2 });
await browser.close();
console.log(designs.map((d) => `${d.name}: ${d.up}-up on A4`).join("\n"));
