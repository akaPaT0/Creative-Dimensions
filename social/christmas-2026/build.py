"""Build poster HTML pages for the Christmas 2026 campaign.

Usage: python3 build.py <images_dir> <html_out_dir>
Then:  node render.mjs <html_out_dir> <png_out_dir>
"""
import html
import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import HOOKS, THEMES, VARIANT_IMAGES  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
IMG_DIR, OUT = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
os.makedirs(OUT, exist_ok=True)

cat = json.load(open(os.path.join(ROOT, "catalog", "christmas-2026.json")))
PRODUCTS = {}
for p in cat["products"]:
    imgs = json.loads(p["images"]) if isinstance(p["images"], str) else p["images"]
    p["_imgs"] = [os.path.basename(u) for u in imgs]
    PRODUCTS[p["SKU"]] = p

SITE = "creativedimensionslb.com"
IG = "@creativedimensions.lb"
WA = "WhatsApp +961 70 304 007"
SUB_LABEL = {"decorations": "Decor", "ornaments": "Ornament", "fidgets": "Keychain",
             "figurines": "Figurine"}
SWATCH = {"Green": "#2f5d3a", "Red": "#c0262d", "White": "#efeae2"}

FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@'
         '0,9..144,500;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;700;800'
         '&display=block" rel="stylesheet">')

CSS = """
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0b0c0b;color:#f4ede4;font-family:Inter,sans-serif;overflow:hidden;position:relative}
.serif{font-family:Fraunces,serif}
.coral{color:#ff8b64}
.top{position:absolute;left:64px;right:64px;display:flex;justify-content:space-between;
 font-size:22px;letter-spacing:.32em;font-weight:700;text-transform:uppercase;z-index:5}
.top span:last-child{color:#c9bfb3}
.photo{position:absolute;left:0;width:1080px;height:1080px;object-fit:cover;
 -webkit-mask-image:radial-gradient(ellipse 72% 70% at 50% 48%,#000 62%,transparent 100%)}
.snow{position:absolute;border-radius:50%;background:#fff;z-index:4}
.eyebrow{font-size:22px;letter-spacing:.28em;font-weight:700;text-transform:uppercase;color:#ff8b64}
h1{font-family:Fraunces,serif;font-weight:700;line-height:1.02;letter-spacing:-.01em}
.hook{color:#d8cfc4;font-weight:500}
.price{background:#ff8b64;color:#0b0c0b;border-radius:50%;display:flex;flex-direction:column;
 align-items:center;justify-content:center;font-weight:800;box-shadow:0 0 0 6px rgba(255,139,100,.18)}
.price small{font-size:18px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-top:-4px}
.chip{display:inline-flex;align-items:center;gap:10px;border:2px solid rgba(255,139,100,.7);
 color:#ffb79e;border-radius:999px;padding:10px 22px;font-weight:700;font-size:22px;
 letter-spacing:.08em;text-transform:uppercase}
.dot{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.5)}
.foot{position:absolute;left:64px;right:64px;display:flex;justify-content:space-between;
 font-size:23px;color:#a99f93;font-weight:500;border-top:1px solid rgba(255,255,255,.14);padding-top:22px}
.cta{background:#ff8b64;color:#0b0c0b;font-weight:800;border-radius:999px;text-align:center}
.tile{position:relative;overflow:hidden;border-radius:28px;background:#0b0c0b;
 border:1px solid rgba(255,255,255,.08)}
.tile img{position:absolute;width:100%;height:100%;left:0;top:-4%;object-fit:cover;transform:scale(1.42)}
.tile .lbl{position:absolute;left:0;right:0;bottom:0;padding:40px 18px 16px;
 background:linear-gradient(transparent,rgba(11,12,11,.92) 55%);font-weight:700}
.tile .lbl b{color:#ff8b64}
.glow{position:absolute;border-radius:50%;filter:blur(90px);z-index:0}
"""


def snow(w, h, seed, n=46):
    rnd = random.Random(seed)
    out = []
    for _ in range(n):
        s = rnd.choice([3, 4, 4, 5, 6, 8])
        out.append(f'<div class="snow" style="left:{rnd.randint(0, w)}px;top:{rnd.randint(0, h)}px;'
                   f'width:{s}px;height:{s}px;opacity:{rnd.uniform(.12, .5):.2f}"></div>')
    return "".join(out)


def money(v):
    return f"${v:g}"


def page(w, h, body, seed):
    return (f'<!DOCTYPE html><html><head><meta charset="utf-8">{FONTS}<style>{CSS}'
            f'body{{width:{w}px;height:{h}px}}</style></head><body>{body}{snow(w, h, seed)}</body></html>')


def img_url(name):
    return "file://" + os.path.join(IMG_DIR, name)


def extras(p):
    """Personalisation chip or colour swatches."""
    if p.get("personalization"):
        return '<span class="chip">✦ Add your name</span>'
    vs = [v for v in p.get("variants", []) if v.get("label")]
    if len(vs) > 1:
        dots = "".join(f'<span class="dot" style="background:{v.get('hex', '#888')}"></span>' for v in vs)
        return f'<span class="chip">{dots}&nbsp;{len(vs)} colours</span>'
    if p["SKU"] in ("CH003", "CH030", "CH031"):
        return '<span class="chip">✦ Your photo</span>'
    return ""


def unit(p):
    d = p["description"].lower()
    if "for the set" in d or "for all nine" in d:
        return "set"
    if "each" in d or "per " in d:
        return "each"
    return ""


def product_feed(p, img, seed):
    head, hook, _ = HOOKS[p["SKU"]]
    u = unit(p)
    body = f"""
<div class="glow" style="width:700px;height:500px;left:190px;top:420px;background:rgba(255,120,60,.10)"></div>
<div class="top" style="top:52px"><span class="coral">Creative Dimensions</span><span>Christmas '26</span></div>
<img class="photo" style="top:75px" src="{img_url(img)}">
<div style="position:absolute;left:0;right:0;top:820px;height:330px;z-index:3;background:linear-gradient(transparent,#0b0c0b 70%)"></div>
<div style="position:absolute;left:64px;right:64px;top:975px;z-index:5">
  <div class="eyebrow">{'New · ' if p.get('isNew') else ''}{SUB_LABEL.get(p['subCategory'], '')}</div>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:30px;margin-top:14px">
    <div style="flex:1">
      <h1 style="font-size:{78 if len(head) < 20 else 66}px">{html.escape(head)}</h1>
      <div class="hook" style="font-size:31px;margin-top:14px">{html.escape(hook)}</div>
      <div style="margin-top:20px;height:52px">{extras(p)}</div>
    </div>
    <div class="price" style="width:178px;height:178px;font-size:{64 if len(money(p['priceUSD'])) < 4 else 52}px;flex:none">
      {money(p['priceUSD'])}{f'<small>{u}</small>' if u else ''}</div>
  </div>
</div>
<div class="foot" style="top:1262px"><span>{SITE}</span><span class="coral" style="font-weight:700">{IG}</span></div>
"""
    return page(1080, 1350, body, seed)


def product_story(p, img, seed):
    head, hook, _ = HOOKS[p["SKU"]]
    u = unit(p)
    body = f"""
<div class="glow" style="width:800px;height:600px;left:140px;top:800px;background:rgba(255,120,60,.12)"></div>
<div class="top" style="top:150px"><span class="coral">Creative Dimensions</span><span>Christmas '26</span></div>
<div style="position:absolute;left:64px;right:64px;top:250px;z-index:5;text-align:center">
  <div class="eyebrow">{'New · ' if p.get('isNew') else ''}{SUB_LABEL.get(p['subCategory'], '')}</div>
  <h1 style="font-size:{92 if len(head) < 20 else 78}px;margin-top:18px">{html.escape(head)}</h1>
  <div class="hook" style="font-size:36px;margin-top:18px">{html.escape(hook)}</div>
</div>
<img class="photo" style="top:520px" src="{img_url(img)}">
<div style="position:absolute;left:64px;right:64px;top:1480px;z-index:5;display:flex;align-items:center;justify-content:center;gap:28px">
  <div class="price" style="width:160px;height:160px;font-size:{58 if len(money(p['priceUSD'])) < 4 else 46}px">
    {money(p['priceUSD'])}{f'<small>{u}</small>' if u else ''}</div>
  {extras(p)}
</div>
<div class="cta" style="position:absolute;left:190px;right:190px;top:1670px;font-size:34px;padding:24px;z-index:5">Shop now · link in bio</div>
<div style="position:absolute;left:0;right:0;top:1772px;text-align:center;font-size:24px;color:#a99f93;z-index:5">{IG} · {WA}</div>
"""
    return page(1080, 1920, body, seed)


def tile_info(key):
    if key in VARIANT_IMAGES:
        img, label = VARIANT_IMAGES[key]
        return img, label, ""
    p = PRODUCTS[key]
    return p["_imgs"][0], HOOKS[key][0], money(p["priceUSD"])


def tiles(keys, rects, fs):
    out = []
    for k, (tx, ty, tw, th) in zip(keys, rects):
        img, label, price = tile_info(k)
        lbl = html.escape(label) + (f' &nbsp;<b>{price}</b>' if price else "")
        out.append(f'<div class="tile" style="left:{tx}px;top:{ty}px;width:{tw}px;height:{th}px;position:absolute">'
                   f'<img src="{img_url(img)}"><div class="lbl" style="font-size:{fs}px">{lbl}</div></div>')
    return "".join(out)


def grid_rects(n, x, y, cols, tw, th, gap):
    return [(x + (i % cols) * (tw + gap), y + (i // cols) * (th + gap), tw, th) for i in range(n)]


def trio_rects(x, y, w, gap, layout):
    if layout == "feed":   # big left, two stacked right
        big = 620
        sw = w - big - gap
        sh = (big - gap) // 2
        return [(x, y, big, big), (x + big + gap, y, sw, sh), (x + big + gap, y + sh + gap, sw, sh)]
    half = (w - gap) // 2   # story: wide on top, two squares below
    return [(x, y, w, 560), (x, y + 560 + gap, half, half), (x + half + gap, y + 560 + gap, half, half)]


def theme_feed(t, seed):
    tid, eyebrow, head, sub, keys, _ = t
    if len(keys) > 3:
        g = tiles(keys, grid_rects(len(keys), 64, 420, 3, 305, 340, 18), 22)
    else:
        g = tiles(keys, trio_rects(64, 420, 952, 18, "feed"), 26)
    body = f"""
<div class="glow" style="width:900px;height:600px;left:90px;top:500px;background:rgba(255,120,60,.10)"></div>
<div class="top" style="top:52px"><span class="coral">Creative Dimensions</span><span>Christmas '26</span></div>
<div style="position:absolute;left:64px;right:64px;top:150px;z-index:5">
  <div class="eyebrow">{html.escape(eyebrow)}</div>
  <h1 style="font-size:{86 if len(head) < 22 else 72}px;margin-top:14px">{html.escape(head)}</h1>
  <div class="hook" style="font-size:32px;margin-top:12px">{html.escape(sub)}</div>
</div>
{g}
<div style="position:absolute;left:64px;right:64px;top:{1150 if len(keys) > 3 else 1100}px;z-index:5;text-align:center">
  <span class="chip" style="font-size:22px">Shop via link in bio · {WA}</span></div>
<div class="foot" style="top:1262px"><span>{SITE}</span><span class="coral" style="font-weight:700">{IG}</span></div>
"""
    return page(1080, 1350, body, seed)


def theme_story(t, seed):
    tid, eyebrow, head, sub, keys, _ = t
    if len(keys) > 3:
        g = tiles(keys, grid_rects(len(keys), 64, 520, 2, 466, 340, 20), 26)
    else:
        g = tiles(keys, trio_rects(64, 520, 952, 20, "story"), 28)
    body = f"""
<div class="glow" style="width:900px;height:800px;left:90px;top:700px;background:rgba(255,120,60,.10)"></div>
<div class="top" style="top:150px"><span class="coral">Creative Dimensions</span><span>Christmas '26</span></div>
<div style="position:absolute;left:64px;right:64px;top:240px;z-index:5;text-align:center">
  <div class="eyebrow">{html.escape(eyebrow)}</div>
  <h1 style="font-size:{92 if len(head) < 22 else 76}px;margin-top:16px">{html.escape(head)}</h1>
  <div class="hook" style="font-size:34px;margin-top:14px">{html.escape(sub)}</div>
</div>
{g}
<div class="cta" style="position:absolute;left:190px;right:190px;top:1670px;font-size:34px;padding:24px;z-index:5">Shop now · link in bio</div>
<div style="position:absolute;left:0;right:0;top:1772px;text-align:center;font-size:24px;color:#a99f93;z-index:5">{IG} · {WA}</div>
"""
    return page(1080, 1920, body, seed)


def slug(s):
    return "".join(c if c.isalnum() else "-" for c in s.lower()).strip("-").replace("--", "-")


jobs = []
for i, t in enumerate(THEMES):
    name = f"{t[0]}-{slug(t[2])}"
    for fmt, fn in (("feed", theme_feed), ("story", theme_story)):
        jobs.append((f"{name}_{fmt}", fn(t, i * 7 + len(fmt))))
for sku, p in PRODUCTS.items():
    img = p["_imgs"][0]
    name = f"{sku}-{p['slug']}"
    jobs.append((f"{name}_feed", product_feed(p, img, sum(map(ord, sku)) * 13)))
    jobs.append((f"{name}_story", product_story(p, img, sum(map(ord, sku)) * 17)))

for name, doc in jobs:
    open(os.path.join(OUT, name + ".html"), "w").write(doc)
print(len(jobs), "pages")
