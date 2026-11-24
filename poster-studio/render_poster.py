"""
Creative Dimensions Poster Studio: photoreal product renders from Blender (5.3+).

Usage (Windows example):
  "C:\\Program Files\\Blender Foundation\\Blender 5.3\\blender.exe" -b -P render_poster.py -- --config configs\\example.json
Options after "--":
  --config PATH     JSON config (paths inside it are relative to the config file)
  --preview         fast low-sample render to check framing
  --model PATH      override the first model's file
  --formats a,b     override formats (feed, story, square)

Pipeline: build a studio (sweep backdrop, softbox lights, camera with depth of field),
import and normalise the model(s), give them a realistic 3D-printed material
(PLA with layer lines), render with Cycles + AgX, then apply a photographic
"realistic filter" (bloom, halation, chromatic aberration, vignette, grain).
Overlays (text, logo, price) come in a later step.
"""
import argparse
import json
import math
import os
import sys
import time

import bpy
import mathutils
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import christmas_scene  # noqa: E402

BASE_W_PER_M2 = float(os.environ.get("PS_BASE", "45"))
WALL_DIST = 2.6  # back wall distance in product sizes: further = darker, moodier set
FORMATS = {"feed": (1080, 1350), "story": (1080, 1920), "square": (1080, 1080)}

DEFAULTS = {
    "name": "poster",
    "output_dir": "renders",
    "formats": ["feed"],
    "resolution_percent": 100,
    "samples": 256,
    "preview_samples": 24,
    "device": "auto",  # auto | GPU | CPU
    "save_blend": True,
    "models": [],  # empty = demo spiral tree
    "scene": christmas_scene.SCENE_DEFAULTS,
    "backdrop": {"color": "#0f0e0d", "roughness": 0.85},
    "lighting": {"preset": "dark_glow", "intensity": 1.0, "glow_color": "#ff7a3d", "rim_color": "#ffb08a"},
    "camera": {"elevation_deg": 10, "orbit_deg": -18, "lens_mm": 85, "fstop": 4.0, "fill": 0.68, "shift_y": 0.0},
    "look": {
        "view_transform": "AgX",
        "look": "AgX - Medium High Contrast",
        "exposure": 0.0,
        "bloom": 0.22,
        "halation": 0.18,
        "chromatic_aberration": 0.6,
        "vignette": 0.32,
        "grain": 0.016,
        "warmth": 0.03,
        "seed": 7,
    },
}

MODEL_DEFAULTS = {
    "path": "",
    "height_cm": 12.0,
    "position_cm": [0.0, 0.0],
    "rotation_deg": 0.0,
    "material": "pla_matte",  # pla_matte | pla_silk | resin | keep
    "color": "#2f6b45",
    "layer_height_mm": 0.2,
    "layer_lines": 0.35,  # 0 disables the visible print layers
}


# ----------------------------------------------------------------------------- helpers
def deep_merge(base, over):
    out = dict(base)
    for k, v in (over or {}).items():
        out[k] = deep_merge(base[k], v) if isinstance(v, dict) and isinstance(base.get(k), dict) else v
    return out


def hex_rgb(h):
    """Hex sRGB colour -> linear RGB tuple (what Blender colour sockets expect)."""
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def log(*a):
    print("[poster-studio]", *a, flush=True)


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--config", default="")
    p.add_argument("--preview", action="store_true")
    p.add_argument("--model", default="")
    p.add_argument("--formats", default="")
    return p.parse_args(argv)


# ----------------------------------------------------------------------------- scene
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.unit_settings.system = "METRIC"
    return s


def setup_render(s, cfg, preview):
    s.render.engine = "CYCLES"
    c = s.cycles
    dev = cfg["device"].upper()
    use_gpu = False
    if dev in ("AUTO", "GPU"):
        try:
            prefs = bpy.context.preferences.addons["cycles"].preferences
            for backend in ("OPTIX", "CUDA", "HIP", "ONEAPI", "METAL"):
                try:
                    prefs.compute_device_type = backend
                except TypeError:
                    continue
                prefs.get_devices()
                gpus = [d for d in prefs.devices if d.type != "CPU"]
                if gpus:
                    for d in prefs.devices:
                        d.use = True
                    use_gpu = True
                    log("GPU rendering with", backend, [d.name for d in gpus])
                    break
        except Exception as e:  # no GPU support in this build/machine
            log("GPU setup skipped:", e)
    c.device = "GPU" if use_gpu else "CPU"
    if not use_gpu:
        log("CPU rendering")
    c.samples = cfg["preview_samples"] if preview else cfg["samples"]
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.02 if preview else 0.008
    c.use_denoising = True
    c.denoiser = "OPENIMAGEDENOISE"
    c.max_bounces = 10
    c.diffuse_bounces = 4
    c.glossy_bounces = 4
    c.transmission_bounces = 8
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.blur_glossy = 0.5  # tames fireflies
    c.sample_clamp_indirect = 6.0
    s.render.film_transparent = False
    s.render.filter_size = 1.5

    look = cfg["look"]
    vs = s.view_settings
    vs.view_transform = look["view_transform"]
    try:
        vs.look = look["look"]
    except TypeError:
        log("look not available, using None:", look["look"])
    vs.exposure = look["exposure"]
    vs.gamma = 1.0
    s.display_settings.display_device = "sRGB"
    s.sequencer_colorspace_settings.name = "sRGB"

    s.render.image_settings.file_format = "PNG"
    s.render.image_settings.color_mode = "RGB"
    s.render.image_settings.color_depth = "16"
    s.render.resolution_percentage = 50 if preview else cfg["resolution_percent"]


def make_world(s, strength=0.08, color="#1c1c1e"):
    w = bpy.data.worlds.new("Studio World")
    s.world = w
    nt = w.node_tree
    bg = nt.nodes.get("Background") or nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (*hex_rgb(color), 1)
    bg.inputs["Strength"].default_value = strength


# ----------------------------------------------------------------------------- materials
def new_material(name):
    m = bpy.data.materials.new(name)
    if m.node_tree is None:  # older Blender: node trees are opt-in
        m.use_nodes = True
    return m, m.node_tree, m.node_tree.nodes["Principled BSDF"]


def printed_material(mcfg):
    """Realistic FDM/resin print: subsurface, micro-roughness variation and horizontal layer lines."""
    kind = mcfg["material"]
    m, nt, bsdf = new_material(f"{kind} {mcfg['color']}")
    N, L = nt.nodes, nt.links
    bsdf.inputs["Base Color"].default_value = (*hex_rgb(mcfg["color"]), 1)
    params = {
        "pla_matte": dict(rough=0.48, spec=0.45, sss=0.06, coat=0.0, metal=0.0),
        "pla_silk": dict(rough=0.22, spec=0.6, sss=0.03, coat=0.25, metal=0.35),
        "resin": dict(rough=0.18, spec=0.5, sss=0.18, coat=0.4, metal=0.0),
    }.get(kind, dict(rough=0.45, spec=0.5, sss=0.05, coat=0.0, metal=0.0))
    bsdf.inputs["Metallic"].default_value = params["metal"]
    bsdf.inputs["Specular IOR Level"].default_value = params["spec"]
    bsdf.inputs["Subsurface Weight"].default_value = params["sss"]
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.6, 0.35)
    bsdf.inputs["Subsurface Scale"].default_value = 0.004
    bsdf.inputs["Coat Weight"].default_value = params["coat"]
    bsdf.inputs["Coat Roughness"].default_value = 0.15

    # Roughness breaks up slightly across the surface, like real plastic.
    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 180.0
    noise.inputs["Detail"].default_value = 6.0
    rmap = N.new("ShaderNodeMapRange")
    rmap.inputs["To Min"].default_value = params["rough"] - 0.06
    rmap.inputs["To Max"].default_value = params["rough"] + 0.06
    L.new(noise.outputs["Fac"], rmap.inputs["Value"])
    L.new(rmap.outputs["Result"], bsdf.inputs["Roughness"])

    # Layer lines follow world Z so they stay horizontal whatever the model's scale.
    if mcfg["layer_lines"] > 0 and kind != "resin":
        geo = N.new("ShaderNodeNewGeometry")
        sep = N.new("ShaderNodeSeparateXYZ")
        div = N.new("ShaderNodeMath"); div.operation = "DIVIDE"
        div.inputs[1].default_value = mcfg["layer_height_mm"] / 1000.0
        mul = N.new("ShaderNodeMath"); mul.operation = "MULTIPLY"
        mul.inputs[1].default_value = 2 * math.pi
        sin = N.new("ShaderNodeMath"); sin.operation = "SINE"
        bump = N.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = mcfg["layer_lines"]
        bump.inputs["Distance"].default_value = mcfg["layer_height_mm"] / 1000.0 * 0.35
        L.new(geo.outputs["Position"], sep.inputs[0])
        L.new(sep.outputs["Z"], div.inputs[0])
        L.new(div.outputs[0], mul.inputs[0])
        L.new(mul.outputs[0], sin.inputs[0])
        L.new(sin.outputs[0], bump.inputs["Height"])
        L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m


# ----------------------------------------------------------------------------- geometry
def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def mesh_from(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    for p in me.polygons:
        p.use_smooth = True
    return link(bpy.data.objects.new(name, me))


def make_sweep(s, cfg, size):
    """Seamless photo-studio sweep: floor from the front, curving up into a back wall."""
    W, D, H = size * 16, size * 10, size * 14
    back, R = size * WALL_DIST, size * 1.6  # wall distance behind the product, curve radius
    y0 = back - R
    prof = [(float(y), 0.0) for y in np.linspace(-D, y0, 10)]
    for i in range(1, 21):
        a = (i / 20) * math.pi / 2
        prof.append((y0 + R * math.sin(a), R - R * math.cos(a)))
    prof += [(back, float(z)) for z in np.linspace(R, H, 6)[1:]]
    verts, faces = [], []
    for y, z in prof:
        verts += [(-W / 2, y, z), (W / 2, y, z)]
    for i in range(len(prof) - 1):
        a, b = i * 2, (i + 1) * 2
        faces.append((a, a + 1, b + 1, b))
    ob = mesh_from("Backdrop", verts, faces)
    m, nt, bsdf = new_material("Backdrop")
    bsdf.inputs["Base Color"].default_value = (*hex_rgb(cfg["backdrop"]["color"]), 1)
    bsdf.inputs["Roughness"].default_value = cfg["backdrop"]["roughness"]
    bsdf.inputs["Specular IOR Level"].default_value = 0.3
    ob.data.materials.append(m)
    return ob


def demo_spiral_tree(height=0.12):
    """Ribbed spiral Christmas tree, a stand-in until a real model is supplied."""
    rings, seg, ribs, R = 140, 192, 12, height * 0.33
    verts, faces = [], []
    for i in range(rings + 1):
        t = i / rings
        z = t * height
        r = R * (1 - t) ** 1.05
        for j in range(seg):
            th = 2 * math.pi * j / seg
            rr = r * (1 + 0.085 * math.cos(ribs * th + t * 2.4 * math.pi))
            verts.append((rr * math.cos(th), rr * math.sin(th), z))
    for i in range(rings):
        for j in range(seg):
            a = i * seg + j
            b = i * seg + (j + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    verts.append((0, 0, 0))
    c = len(verts) - 1
    for j in range(seg):
        faces.append((c, (j + 1) % seg, j))
    ob = mesh_from("Demo Spiral Tree", verts, faces)
    star = bpy.data.meshes.new("Star")
    pts = []
    for k in range(10):
        a = math.pi / 2 + k * math.pi / 5
        rad = height * (0.07 if k % 2 == 0 else 0.03)
        pts.append((rad * math.cos(a), 0, rad * math.sin(a)))
    sv = [(x, -height * 0.012, z) for x, _, z in pts] + [(x, height * 0.012, z) for x, _, z in pts]
    sf = [tuple(range(10))[::-1], tuple(range(10, 20))] + [(k, (k + 1) % 10, 10 + (k + 1) % 10, 10 + k) for k in range(10)]
    star.from_pydata(sv, [], sf)
    so = link(bpy.data.objects.new("Demo Star", star))
    so.location = (0, 0, height + height * 0.045)
    return [ob, so]


def import_model(path):
    before = set(bpy.data.objects)
    ext = os.path.splitext(path)[1].lower()
    if ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".stl":
        bpy.ops.wm.stl_import(filepath=path)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    elif ext == ".ply":
        bpy.ops.wm.ply_import(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext == ".blend":
        with bpy.data.libraries.load(path) as (src, dst):
            dst.objects = src.objects
        for o in dst.objects:
            if o is not None:
                link(o)
    else:
        raise ValueError(f"Unsupported model format: {ext}")
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:  # imported scenes may bring cameras/lights; keep only geometry
        if o.type in ("CAMERA", "LIGHT"):
            bpy.data.objects.remove(o)
    return [o for o in bpy.data.objects if o not in before]


def world_bbox(objs):
    bpy.context.view_layer.update()
    pts = []
    for o in objs:
        if o.type == "MESH":
            pts += [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
    lo = mathutils.Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = mathutils.Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def place_model(objs, mcfg, idx):
    """Parent to an empty, scale to the requested height, stand it on the floor."""
    root = link(bpy.data.objects.new(f"Model {idx}", None))
    for o in objs:
        if o.parent is None:
            o.parent = root
    lo, hi = world_bbox(objs)
    h = max(hi.z - lo.z, 1e-9)
    k = (mcfg["height_cm"] / 100.0) / h
    root.scale = (k, k, k)
    bpy.context.view_layer.update()
    lo, hi = world_bbox(objs)
    cx, cy = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2
    px, py = (v / 100.0 for v in mcfg["position_cm"])
    root.location = (px - cx, py - cy, -lo.z)
    bpy.context.view_layer.update()
    # rotate about the model's own centre
    pivot = link(bpy.data.objects.new(f"Model {idx} Pivot", None))
    pivot.location = (px, py, 0)
    root.parent = pivot
    root.location = (-cx, -cy, -lo.z)
    pivot.rotation_euler.z = math.radians(mcfg["rotation_deg"])
    bpy.context.view_layer.update()
    return pivot


# ----------------------------------------------------------------------------- lights & camera
def area_light(name, size, energy, color, loc, target, spread_deg=None):
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = "RECTANGLE"
    ld.size, ld.size_y = size, size * 0.75
    ld.energy = energy
    ld.color = hex_rgb(color)
    if spread_deg is not None:
        ld.spread = math.radians(spread_deg)
    ob = link(bpy.data.objects.new(name, ld))
    ob.location = loc
    d = mathutils.Vector(target) - mathutils.Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return ob


def make_lights(cfg, h, center):
    """Softbox studio scaled to the product: energies follow distance squared."""
    L = cfg["lighting"]
    I = L["intensity"]
    preset = L["preset"]
    cx, cy, cz = center
    def pos(az, el, dist):
        a, e = math.radians(az), math.radians(el)
        return (cx + dist * math.sin(a) * math.cos(e), cy - dist * math.cos(a) * math.cos(e), cz + dist * math.sin(e))
    d = h * 2.8  # close softboxes: light falls off across the floor like a real studio
    base = BASE_W_PER_M2 * (d ** 2)  # keeps exposure constant whatever the product size
    if preset == "christmas":  # the room HDRI is the ambient light; softboxes shape the product
        area_light("Key", h * 2.2, base * 0.38 * I, "#ffe9d2", pos(-45, 45, d), center)
        area_light("Fill", h * 3.5, base * 0.08 * I, "#dfe8ff", pos(60, 12, d), center)
        area_light("Rim L", h * 1.2, base * 0.5 * I, L["rim_color"], pos(-150, 28, d * 0.9), center, 60)
        area_light("Rim R", h * 1.2, base * 0.35 * I, L["rim_color"], pos(150, 28, d * 0.9), center, 60)
        return
    if preset == "clean_white":
        make_world(bpy.context.scene, 0.12, "#f2efea")
        area_light("Key", h * 3, base * 0.32 * I, "#fff4ea", pos(-40, 38, d), center)
        area_light("Fill", h * 4, base * 0.12 * I, "#eef3ff", pos(55, 20, d), center)
        area_light("Top", h * 3, base * 0.1 * I, "#ffffff", pos(0, 80, d), center)
        area_light("Rim", h * 1.5, base * 0.18 * I, "#ffffff", pos(160, 30, d), center)
    else:  # dark_glow: matches the catalogue photos (dark set, warm halo behind the product)
        make_world(bpy.context.scene, 0.04, "#151517")
        area_light("Key", h * 2.0, base * 0.7 * I, "#fff1e4", pos(-45, 38, d), center)
        area_light("Fill", h * 3.5, base * 0.14 * I, "#dfe8ff", pos(60, 12, d), center)
        area_light("Rim L", h * 1.2, base * 0.75 * I, L["rim_color"], pos(-150, 28, d * 0.9), center, 60)
        area_light("Rim R", h * 1.2, base * 0.55 * I, L["rim_color"], pos(150, 28, d * 0.9), center, 60)
        # Soft round halo on the back wall, behind the product (like the catalogue photos).
        back = h * WALL_DIST
        ld = bpy.data.lights.new("Backdrop Glow", "SPOT")
        ld.energy = base * 4.5 * I
        ld.color = hex_rgb(L["glow_color"])
        ld.spot_size = math.radians(70)
        ld.spot_blend = 1.0
        ld.shadow_soft_size = h * 0.2
        glow = link(bpy.data.objects.new("Backdrop Glow", ld))
        # Aim at the spot on the wall that sits straight behind the product as seen by the camera.
        orbit = math.radians(cfg["camera"]["orbit_deg"])
        hx = cx - math.tan(orbit) * (back - cy)
        hz = cz + h * 0.55
        src = mathutils.Vector((hx, back - h * 1.3, hz + h * 0.25))
        glow.location = src
        glow.rotation_euler = (mathutils.Vector((hx, back, hz)) - src).to_track_quat("-Z", "Y").to_euler()
        glow.visible_camera = False
        glow.visible_glossy = False


def make_camera(s, cfg, lo, hi, fmt):
    """Camera on an orbit around the product. Distance and aim are solved by projecting the
    product's bounding box through the real lens, so tall, wide and flat products all fill
    the frame by the same amount and sit centred."""
    from bpy_extras.object_utils import world_to_camera_view
    C = cfg["camera"]
    w, hgt = FORMATS[fmt]
    s.render.resolution_x, s.render.resolution_y = w, hgt
    cd = bpy.data.cameras.new("Camera")
    cd.lens = C["lens_mm"]
    cd.sensor_width = 36
    cd.sensor_fit = "AUTO"
    cd.shift_y = C["shift_y"]
    cam = link(bpy.data.objects.new("Camera", cd))
    s.camera = cam
    corners = [mathutils.Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]
    tgt = link(bpy.data.objects.new("Camera Target", None))
    tgt.location = (lo + hi) / 2
    a, e = math.radians(C["orbit_deg"]), math.radians(C["elevation_deg"])
    direction = mathutils.Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    size = (hi - lo).length

    def place(dist):
        cam.location = tgt.location + direction * dist
        cam.rotation_euler = (tgt.location - cam.location).to_track_quat("-Z", "Y").to_euler()
        bpy.context.view_layer.update()
        pts = [world_to_camera_view(s, cam, c) for c in corners]
        xs, ys = [p.x for p in pts], [p.y for p in pts]
        return min(xs), max(xs), min(ys), max(ys)

    dist = size * 3
    for _ in range(6):  # converge on distance and on centring the projected box
        x0, x1, y0, y1 = place(dist)
        extent = max(x1 - x0, y1 - y0)
        dist *= extent / C["fill"]
        x0, x1, y0, y1 = place(dist)
        off_x, off_y = (x0 + x1) / 2 - 0.5, (y0 + y1) / 2 - 0.5
        frame_h = 2 * dist * math.tan(math.atan(18 / C["lens_mm"]))  # approx world size of the long side
        right = cam.matrix_world.to_3x3() @ mathutils.Vector((1, 0, 0))
        up = cam.matrix_world.to_3x3() @ mathutils.Vector((0, 1, 0))
        aspect = w / hgt
        tgt.location += right * off_x * frame_h * min(1, aspect) + up * off_y * frame_h / max(1, aspect)
    place(dist)
    cd.clip_start = dist * 0.02
    cd.clip_end = dist * 60
    cd.dof.use_dof = True
    focus = link(bpy.data.objects.new("Focus", None))
    focus.location = (lo + hi) / 2
    cd.dof.focus_object = focus
    cd.dof.aperture_fstop = C["fstop"]
    return cam


# ----------------------------------------------------------------------------- realistic filter
def _blur(img, radius, passes=3):
    """Fast separable box blur (3 passes ~ gaussian), works on HxWxC float arrays."""
    r = max(1, int(radius))
    out = img
    for _ in range(passes):
        for axis in (0, 1):
            pad = [(0, 0)] * out.ndim
            pad[axis] = (r + 1, r)
            p = np.pad(out, pad, mode="edge")
            cs = np.cumsum(p, axis=axis)
            n = out.shape[axis]
            hi = np.take(cs, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
            lo = np.take(cs, np.arange(0, n), axis=axis)
            out = (hi - lo) / (2 * r + 1)
    return out


def _blur_big(img, radius):
    """Blur via downsample -> blur -> upsample for large radii."""
    f = max(1, int(radius // 8))
    if f == 1:
        return _blur(img, radius)
    h, w = img.shape[:2]
    small = img[: h - h % f, : w - w % f].reshape(h // f, f, w // f, f, -1).mean(axis=(1, 3))
    small = _blur(small, radius / f)
    big = np.repeat(np.repeat(small, f, axis=0), f, axis=1)
    out = np.empty_like(img)
    out[: big.shape[0], : big.shape[1]] = big
    out[big.shape[0]:, :] = out[big.shape[0] - 1: big.shape[0], :]
    out[:, big.shape[1]:] = out[:, big.shape[1] - 1: big.shape[1]]
    return _blur(out, f)  # smooth the upsampling blocks


def _radial_scale(ch, k):
    """Resample one channel scaled about the centre (for lateral chromatic aberration)."""
    h, w = ch.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cy, cx = (h - 1) / 2, (w - 1) / 2
    sy = cy + (yy - cy) / (1 + k)
    sx = cx + (xx - cx) / (1 + k)
    x0 = np.clip(np.floor(sx).astype(int), 0, w - 2); y0 = np.clip(np.floor(sy).astype(int), 0, h - 2)
    fx = np.clip(sx - x0, 0, 1); fy = np.clip(sy - y0, 0, 1)
    a = ch[y0, x0] * (1 - fx) + ch[y0, x0 + 1] * fx
    b = ch[y0 + 1, x0] * (1 - fx) + ch[y0 + 1, x0 + 1] * fx
    return a * (1 - fy) + b * fy


def realistic_filter(img, look):
    """Display-referred photographic finish. img: HxWx3 float in 0..1 (sRGB encoded)."""
    rng = np.random.default_rng(look["seed"])
    h, w, _ = img.shape
    lum = img @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)

    # Bloom: soft glow around bright areas.
    if look["bloom"] > 0:
        hl = np.clip((lum - 0.62) / 0.38, 0, 1)[..., None] ** 2 * img
        glow = _blur_big(hl, w * 0.018) * 0.6 + _blur_big(hl, w * 0.05) * 0.4
        img = 1 - (1 - img) * (1 - np.clip(glow * look["bloom"] * 2.2, 0, 1))  # screen blend

    # Halation: warm red fringe film adds around strong highlights.
    if look["halation"] > 0:
        hl = np.clip((lum - 0.72) / 0.28, 0, 1)[..., None]
        hal = _blur_big(hl, w * 0.008) * np.array([1.0, 0.32, 0.12], dtype=np.float32)
        img = img + hal * look["halation"] * 0.6

    # Lateral chromatic aberration: red slightly larger, blue slightly smaller toward edges.
    ca = look["chromatic_aberration"]
    if ca > 0:
        k = ca * 0.0012
        img = np.stack([_radial_scale(img[..., 0], k), img[..., 1], _radial_scale(img[..., 2], -k)], axis=-1)

    # Warm grade in the mids, protecting blacks and whites.
    if look["warmth"]:
        mid = (4 * lum * (1 - lum))[..., None]
        img = img + mid * look["warmth"] * np.array([1.0, 0.25, -0.8], dtype=np.float32)

    # Lens vignette.
    if look["vignette"] > 0:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / math.sqrt(2)
        img = img * (1 - look["vignette"] * np.clip(r, 0, 1) ** 2.4)[..., None]

    # Film grain: fine, luminance-shaped, strongest in the mids like real sensor/film noise.
    if look["grain"] > 0:
        g = rng.standard_normal((h, w, 1)).astype(np.float32)
        g = _blur(g, 1, passes=1) * 1.6
        lum2 = (np.clip(img, 0, 1) @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
        img = img + g * look["grain"] * (0.35 + 1.3 * lum2 * (1 - lum2))

    return np.clip(img, 0, 1)


def finish_image(raw_path, final_path, look):
    im = bpy.data.images.load(raw_path, check_existing=False)
    im.colorspace_settings.name = "Non-Color"  # read the saved sRGB values untouched
    w, h = im.size
    px = np.empty(w * h * 4, dtype=np.float32)
    im.pixels.foreach_get(px)
    rgb = px.reshape(h, w, 4)[..., :3]
    out = realistic_filter(rgb, look)
    res = np.ones((h, w, 4), dtype=np.float32)
    res[..., :3] = out
    dst = bpy.data.images.new("final", w, h, alpha=False, float_buffer=True)
    dst.colorspace_settings.name = "Non-Color"
    dst.pixels.foreach_set(res.ravel())
    dst.filepath_raw = final_path
    dst.file_format = "PNG"
    dst.save()
    bpy.data.images.remove(im)
    bpy.data.images.remove(dst)


# ----------------------------------------------------------------------------- main
def main():
    args = parse_args()
    cfg_dir = os.getcwd()
    user = {}
    if args.config:
        cfg_path = os.path.abspath(args.config)
        cfg_dir = os.path.dirname(cfg_path)
        with open(cfg_path, encoding="utf-8") as f:
            user = json.load(f)
    cfg = deep_merge(DEFAULTS, user)
    models = [deep_merge(MODEL_DEFAULTS, m) for m in (cfg["models"] or [{}])]
    if args.model:
        models[0]["path"] = args.model
    if args.formats:
        cfg["formats"] = [x.strip() for x in args.formats.split(",") if x.strip()]
    out_dir = os.path.join(cfg_dir, cfg["output_dir"])
    os.makedirs(out_dir, exist_ok=True)

    for fmt in cfg["formats"]:
        if fmt not in FORMATS:
            raise SystemExit(f"Unknown format {fmt}; use one of {list(FORMATS)}")
        t0 = time.time()
        s = reset_scene()
        setup_render(s, cfg, args.preview)

        all_objs = []
        for i, m in enumerate(models):
            if m["path"]:
                path = m["path"] if os.path.isabs(m["path"]) else os.path.join(cfg_dir, m["path"])
                if not os.path.isfile(path):
                    raise SystemExit(f"[poster-studio] Model file not found: {os.path.normpath(path)}\n"
                                     f"Put the file there or fix \"path\" in the config (it is relative to the config file).")
                log("importing", path)
                objs = import_model(path)
            else:
                log("no model given, using the demo spiral tree")
                objs = demo_spiral_tree()
            if m["material"] != "keep":
                mat = printed_material(m)
                for o in objs:
                    if o.type == "MESH":
                        o.data.materials.clear()
                        o.data.materials.append(mat)
            place_model(objs, m, i)
            all_objs += [o for o in objs if o.type == "MESH"]

        lo, hi = world_bbox(all_objs)
        size = max(hi.z - lo.z, hi.x - lo.x, hi.y - lo.y)
        christmas = cfg["scene"]["preset"] == "christmas"
        if christmas:
            christmas_scene.build(cfg, cfg_dir, lo, hi)
            cfg["lighting"]["preset"] = "christmas"
        else:
            make_sweep(s, cfg, size)
        center = ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z + (hi.z - lo.z) * 0.5)
        make_lights(cfg, size, center)
        cam = make_camera(s, cfg, lo, hi, fmt)
        if christmas:
            christmas_scene.add_snow(cfg, cam)

        tag = f"{cfg['name']}_{fmt}" + ("_preview" if args.preview else "")
        raw = os.path.join(out_dir, tag + "_raw.png")
        final = os.path.join(out_dir, tag + ".png")
        if cfg["save_blend"] and not args.preview:
            bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, tag + ".blend"))
        s.render.filepath = raw
        log(f"rendering {fmt} {s.render.resolution_x}x{s.render.resolution_y} @ {s.render.resolution_percentage}% , {s.cycles.samples} samples")
        bpy.ops.render.render(write_still=True)
        finish_image(raw, final, cfg["look"])
        log(f"saved {final} in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
