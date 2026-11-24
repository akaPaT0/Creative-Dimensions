"""
Download the free (CC0) Poly Haven assets the scenes use into poster-studio/assets/.
Works with normal Python or Blender's Python. render_poster.py calls it automatically
when an asset is missing, so you normally never run it by hand.

  python fetch_assets.py            # everything the Christmas scene needs
  python fetch_assets.py hdri:fireplace model:Sofa_01 texture:dark_planks
"""
import json
import os
import sys
import urllib.request

API = "https://api.polyhaven.com/files/"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "polyhaven")
UA = {"User-Agent": "poster-studio-asset-fetch/1.0"}

CHRISTMAS = [
    "hdri:christmas_photo_studio_01",
    "model:television_02",
    "model:wooden_candlestick",
    "texture:rosewood_veneer1",
]


def _get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        return r.read()


def _save(url, path):
    if os.path.isfile(path) and os.path.getsize(path) > 0:
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    print("  downloading", os.path.relpath(path, ROOT), flush=True)
    data = _get(url)
    with open(path + ".part", "wb") as f:
        f.write(data)
    os.replace(path + ".part", path)
    return path


def fetch(spec, hdri_res="4k", model_res="1k", tex_res="2k"):
    """spec = 'hdri:<id>' | 'model:<id>' | 'texture:<id>'. Returns the local path(s)."""
    kind, asset = spec.split(":", 1)
    files = json.loads(_get(API + asset))
    folder = os.path.join(ROOT, asset)
    if kind == "hdri":
        f = files["hdri"][hdri_res]["hdr"]
        return _save(f["url"], os.path.join(folder, f"{asset}_{hdri_res}.hdr"))
    if kind == "model":
        g = files["gltf"][model_res]["gltf"]
        main = _save(g["url"], os.path.join(folder, os.path.basename(g["url"].split("?")[0])))
        for rel, inc in g.get("include", {}).items():
            _save(inc["url"], os.path.join(folder, rel))
        return main
    if kind == "texture":
        out = {}
        for key, name in (("Diffuse", "diff"), ("Rough", "rough"), ("nor_gl", "nor")):
            if key in files:
                f = files[key][tex_res]["jpg"]
                out[name] = _save(f["url"], os.path.join(folder, f"{asset}_{name}_{tex_res}.jpg"))
        return out
    raise ValueError(spec)


def local_path(spec, hdri_res="4k", model_res="1k", tex_res="2k"):
    """Path if already downloaded, else download it now."""
    kind, asset = spec.split(":", 1)
    folder = os.path.join(ROOT, asset)
    if kind == "hdri":
        p = os.path.join(folder, f"{asset}_{hdri_res}.hdr")
        if os.path.isfile(p):
            return p
    elif kind == "model" and os.path.isdir(folder):
        for f in os.listdir(folder):
            if f.endswith(".gltf"):
                return os.path.join(folder, f)
    elif kind == "texture" and os.path.isdir(folder):
        out = {n: os.path.join(folder, f"{asset}_{n}_{tex_res}.jpg") for n in ("diff", "rough", "nor")}
        if all(os.path.isfile(p) for p in out.values()):
            return out
    return fetch(spec, hdri_res, model_res, tex_res)


if __name__ == "__main__":
    for s in sys.argv[1:] or CHRISTMAS:
        print(s)
        fetch(s)
    print("done ->", ROOT)
