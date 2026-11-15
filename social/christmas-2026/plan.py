"""Write POSTING_PLAN.md: a 7-day Instagram + TikTok schedule with captions."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from content import HOOKS, THEMES  # noqa: E402

cat = json.load(open(os.path.join(HERE, "..", "..", "catalog", "christmas-2026.json")))
P = {p["SKU"]: p for p in cat["products"]}
T = {t[0]: t for t in THEMES}

DAYS = [
    ("Sun 15 Nov", ["T01", "CH012", "T02"]),
    ("Mon 16 Nov", ["CH008", "T05", "CH025"]),
    ("Tue 17 Nov", ["T03", "CH016", "CH033"]),
    ("Wed 18 Nov", ["T07", "CH002", "CH006"]),
    ("Thu 19 Nov", ["T04", "CH017", "T06"]),
    ("Fri 20 Nov", ["T08", "CH021", "CH024"]),
    ("Sat 21 Nov", ["T10", "CH001", "T12"]),
]
TIMES = ["12:30", "18:00", "21:00"]
ORDER = "Order: link in bio · creativedimensionslb.com · WhatsApp +961 70 304 007\nPickup or delivery across Lebanon 🇱🇧"
TAGS_IG = "#CreativeDimensions #Christmas2026 #ChristmasLebanon #Lebanon #Beirut #ChristmasDecor #ChristmasGifts #3DPrinting #3DPrinted #MadeInLebanon #GiftIdeas #ChristmasOrnaments"
TAGS_TT = "#christmas #christmasdecor #3dprinting #lebanon #beirut #giftideas #fyp"


def slug(s):
    return "".join(c if c.isalnum() else "-" for c in s.lower()).strip("-").replace("--", "-")


def item(key):
    if key in T:
        tid, eyebrow, head, sub, _, cap = T[key]
        base = f"{tid}-{slug(head)}"
        return base, head, cap, f"{head} 🎄"
    p = P[key]
    head, hook, cap = HOOKS[key]
    price = f"${p['priceUSD']:g}"
    return f"{key}-{p['slug']}", head, f"{cap}\n\n💰 {price}", f"{hook} {price} 🎄"


used, out = set(), []
out.append("# Christmas 2026: 7-day Instagram + TikTok plan\n")
out.append("All 90 posters are in this folder. Every product poster has two versions:\n"
           "- `feed-4x5/…_feed.jpg`: 1080×1350 for Instagram feed posts and carousels\n"
           "- `story-tiktok-9x16/…_story.jpg`: 1080×1920 for TikTok (photo mode), Reels covers and Stories\n\n"
           "**Every day:** 3 main drops (post the feed version on IG and the 9:16 version on TikTok), plus 3–4 extra Stories.\n"
           "Times are Lebanon time and only a suggestion. TikTok tip: add a trending Christmas sound to each photo post, "
           "or post a day's 3 drops as one swipeable photo carousel.\n")
for day, keys in DAYS:
    out.append(f"\n---\n\n## {day}\n")
    for t, k in zip(TIMES, keys):
        used.add(k)
        base, head, cap, tt = item(k)
        out.append(f"### {t} · {head}\n")
        out.append(f"- IG feed: `feed-4x5/{base}_feed.jpg`\n- TikTok / Reel / Story: `story-tiktok-9x16/{base}_story.jpg`\n")
        out.append("**Instagram caption**\n```\n" + f"{cap}\n\n{ORDER}\n\n{TAGS_IG}" + "\n```\n")
        out.append("**TikTok caption**\n```\n" + f"{tt} Link in bio. {TAGS_TT}" + "\n```\n")

rest = [k for k in list(T) + list(P) if k not in used]
out.append("\n---\n\n## Extra Stories (3–4 a day)\n\nUse the 9:16 versions. Add a link sticker to the product page or a poll (\"Which one?\").\n")
for i, (day, _) in enumerate(DAYS):
    chunk = rest[i::len(DAYS)]
    lines = [f"- `story-tiktok-9x16/{item(k)[0]}_story.jpg`: {item(k)[1]}" for k in chunk]
    out.append(f"\n**{day}**\n" + "\n".join(lines) + "\n")

out.append("\n---\n\nRegenerate: `python3 build.py <images_dir> <html_dir> && node render.mjs <html_dir> <out_dir>` "
           "(images are the product photos from Supabase storage listed in catalog/christmas-2026.json). "
           "Copy lives in `content.py`.\n")
open(os.path.join(HERE, "POSTING_PLAN.md"), "w").write("\n".join(out))
print("drops", len(used), "extra stories", len(rest))
