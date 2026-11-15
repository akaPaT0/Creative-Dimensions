# Creative Dimensions packaging stickers

Preview of all designs: `ALL-STICKERS-preview.png` · How they look on bags and boxes: `PACKAGING-mockup.png`

**Fold-over seal (07):** fold it in the middle over the top of a bag or the edge of a box lid. The front shows the logo; the back half is printed upside down so "thank you" reads upright on the other side.

| Design | Size | A4 sheet |
|---|---|---|
| 01 Round logo seal | 2.5" (63.5 mm) round | 6 per sheet |
| 02 Thank-you sticker | 2" (50.8 mm) round | 12 per sheet |
| 03 Wordmark label, dark | 76 × 30 mm | 14 per sheet |
| 04 Wordmark label, light | 76 × 30 mm | 14 per sheet |
| 05 Mini box seal | 1.5" (38 mm) round | 20 per sheet |
| 06 Big front logo (bags & box lids) | 4" (100 mm) round | 2 per sheet |
| 07 Fold-over seal (bag top / box lid edge) | 40 × 120 mm | 6 per sheet |

## What to send the printer
- **Online sticker shops / die-cut vinyl:** `print/<design>_print-with-3mm-bleed.pdf` (vector, fonts embedded). If they ask for an image, use the `_300dpi.png`. If they ask for a cut line, send `_cutline.pdf` too (magenta hairline at the cut).
- **Local print shop (vinyl sheet + plotter cutter):** `a4-sheets/<design>_A4_N-up.pdf`. The `_with-cutlines` version has magenta cut lines for the plotter.
- `preview/` has transparent PNGs for mockups and social posts.

Colours are RGB. Ask the printer for a proof, because the coral and the teal-to-orange gradient print slightly differently on each vinyl.
The swoosh was redrawn as vector art from `app/icon.png`.

Rebuild: `node stickers/build.mjs`
