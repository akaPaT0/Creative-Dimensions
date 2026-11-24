"""
Christmas set for Poster Studio: walnut tabletop in a decorated living room.

Layout is built relative to the camera so the props always land behind and around the
product: a decorated tree with glowing lights, a vintage CRT TV, lit candlesticks,
wrapped gifts, fairy-light bokeh and falling snow. The room itself is a real Christmas
studio HDRI from Poly Haven (CC0), which also lights the scene.
"""
import math
import os
import random

import bpy
import mathutils

import fetch_assets

SCENE_DEFAULTS = {
    "preset": "studio",  # studio | christmas
    "hdri": "christmas_photo_studio_01",
    "hdri_strength": 0.32,
    "hdri_rotation_deg": 0,
    "table_texture": "rosewood_veneer1",
    "tree": True,
    "tv": True,
    "tv_image": "",  # optional picture on the TV screen (path relative to the config)
    "candles": True,
    "gifts": True,
    "gift_colors": ["#b3121f", "#1f5a36", "#d9c7a3"],
    "snow": 150,  # number of falling flakes, 0 = off
    "bokeh_lights": 50,  # far fairy lights, 0 = off
    "seed": 3,
}

TABLE_H = 0.75  # metres from floor to tabletop (tabletop is z = 0)


def _hex(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def _link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def _mat(name, color, rough=0.5, metal=0.0, emit=None, emit_strength=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    if m.node_tree is None:
        m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*_hex(color), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    if emit:
        b.inputs["Emission Color"].default_value = (*_hex(emit), 1)
        b.inputs["Emission Strength"].default_value = emit_strength
    return m


def _prim(kind, name, loc, scale=(1, 1, 1), mat=None, **kw):
    getattr(bpy.ops.mesh, f"primitive_{kind}_add")(location=loc, **kw)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = scale
    if mat:
        ob.data.materials.append(mat)
    return ob


def _smooth(ob):
    for p in ob.data.polygons:
        p.use_smooth = True


def _import_gltf(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    root = _link(bpy.data.objects.new(os.path.basename(path), None))
    for o in new:
        if o.parent is None:
            o.parent = root
    return root, new


# ----------------------------------------------------------------------------- world & table
def world_hdri(sc):
    path = fetch_assets.local_path("hdri:" + sc["hdri"])
    w = bpy.data.worlds.new("Christmas Room")
    bpy.context.scene.world = w
    nt = w.node_tree
    N, L = nt.nodes, nt.links
    bg = N.get("Background") or N.new("ShaderNodeBackground")
    env = N.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(path, check_existing=True)
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value[2] = math.radians(sc["hdri_rotation_deg"])
    L.new(tc.outputs["Generated"], mp.inputs["Vector"])
    L.new(mp.outputs["Vector"], env.inputs["Vector"])
    L.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = sc["hdri_strength"]


def table(sc, fwd, right):
    tex = fetch_assets.local_path("texture:" + sc["table_texture"])
    me = bpy.data.meshes.new("Tabletop")
    W, D = 3.0, 2.4
    c = fwd * 0.7
    corners = [c + right * sx * W / 2 + fwd * sy * D / 2 for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    me.from_pydata([tuple(v) for v in corners], [], [(0, 1, 2, 3)])
    top = _link(bpy.data.objects.new("Tabletop", me))
    m = bpy.data.materials.new("Walnut")
    if m.node_tree is None:
        m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / 0.9, 1 / 0.9, 1)  # one texture tile per 90 cm
    mp.inputs["Rotation"].default_value[2] = math.atan2(fwd.x, fwd.y)  # grain runs away from camera
    L.new(tc.outputs["Object"], mp.inputs["Vector"])

    def img(key, colorspace):
        n = N.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(tex[key], check_existing=True)
        n.image.colorspace_settings.name = colorspace
        L.new(mp.outputs["Vector"], n.inputs["Vector"])
        return n
    L.new(img("diff", "sRGB").outputs["Color"], b.inputs["Base Color"])
    L.new(img("rough", "Non-Color").outputs["Color"], b.inputs["Roughness"])
    nm = N.new("ShaderNodeNormalMap")
    L.new(img("nor", "Non-Color").outputs["Color"], nm.inputs["Color"])
    L.new(nm.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Specular IOR Level"].default_value = 0.25
    b.inputs["Coat Weight"].default_value = 0.1  # satin lacquered table
    b.inputs["Coat Roughness"].default_value = 0.25
    top.data.materials.append(m)
    # dark floor far below so nothing shows the void
    _prim("plane", "Floor", (c.x, c.y, -TABLE_H), (6, 6, 1), _mat("Floor", "#2a1c14", rough=0.6))
    return top


# ----------------------------------------------------------------------------- props
def christmas_tree(rng, base, height=1.8):
    """Decorated tree: layered foliage, warm string lights, baubles and a star.
    It sits out of focus behind the product, so its lights turn into soft bokeh."""
    green = _mat("Fir", "#16301f", rough=0.85)
    tiers = 8
    for i in range(tiers):
        t = i / tiers
        r = 0.62 * (1 - t) ** 1.1 + 0.05
        h = height * 0.22
        z = base.z + 0.12 + t * height * 0.86
        bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=r, radius2=r * 0.15, depth=h,
                                        location=(base.x, base.y, z + h / 2))
        ob = bpy.context.active_object
        ob.name = f"Tree tier {i}"
        ob.data.materials.append(green)
        tex = bpy.data.textures.new(f"tree noise {i}", "CLOUDS")
        tex.noise_scale = 0.06
        sub = ob.modifiers.new("sub", "SUBSURF"); sub.levels = 3; sub.render_levels = 3
        dsp = ob.modifiers.new("disp", "DISPLACE"); dsp.texture = tex; dsp.strength = 0.09
        _smooth(ob)
    trunk = _prim("cylinder", "Trunk", (base.x, base.y, base.z + 0.08), (0.07, 0.07, 0.08),
                  _mat("Trunk", "#3b2516", rough=0.9))
    warm = _mat("Tree lights", "#ffd9a0", emit="#ffc77a", emit_strength=60)
    reds = [_mat("Bauble red", "#a10f1a", rough=0.15, metal=0.3, coat=1),
            _mat("Bauble gold", "#c9952f", rough=0.2, metal=1.0),
            _mat("Bauble silver", "#cfd3d8", rough=0.12, metal=1.0)]
    for k in range(260):  # lights spiral around the tree
        t = rng.random() ** 0.85
        a = rng.random() * 2 * math.pi
        z = base.z + 0.2 + t * height * 0.9
        r = (0.62 * (1 - t) ** 1.1 + 0.05) * (0.82 + rng.random() * 0.18)
        _prim("uv_sphere", "Light", (base.x + r * math.cos(a), base.y + r * math.sin(a), z), (0.011,) * 3, warm,
              segments=8, ring_count=6)
    for k in range(46):
        t = rng.random() ** 0.9 * 0.92
        a = rng.random() * 2 * math.pi
        z = base.z + 0.2 + t * height * 0.88
        r = (0.62 * (1 - t) ** 1.1 + 0.05) * 0.9
        s = 0.03 + rng.random() * 0.02
        ob = _prim("uv_sphere", "Bauble", (base.x + r * math.cos(a), base.y + r * math.sin(a), z), (s,) * 3,
                   rng.choice(reds), segments=24, ring_count=12)
        _smooth(ob)
    star = _mat("Tree star", "#ffd47a", rough=0.3, metal=1.0, emit="#ffcf70", emit_strength=25)
    _prim("ico_sphere", "Star", (base.x, base.y, base.z + height + 0.06), (0.07, 0.025, 0.07), star, subdivisions=1)


def vintage_tv(sc, cfg_dir, pos, face_dir):
    """Poly Haven 'television_02' (CC0) with a glowing screen."""
    path = fetch_assets.local_path("model:television_02")
    root, _ = _import_gltf(path)
    root.location = pos
    root.rotation_euler.z = math.atan2(-face_dir.x, face_dir.y)  # screen (model -Y) faces the camera
    # Glowing screen: plane just in front of the tube (screen measured from the model: 31 x 23 cm)
    me = bpy.data.meshes.new("TV Screen")
    me.from_pydata([(-0.155, -0.124, 0.145), (0.155, -0.124, 0.145), (0.155, -0.124, 0.375), (-0.155, -0.124, 0.375)],
                   [], [(0, 1, 2, 3)])
    me.uv_layers.new()
    for i, uv in enumerate(((0, 0), (1, 0), (1, 1), (0, 1))):
        me.uv_layers[0].data[i].uv = uv
    scr = _link(bpy.data.objects.new("TV Screen", me))
    scr.parent = root
    m = bpy.data.materials.new("TV glow")
    if m.node_tree is None:
        m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    out = N["Material Output"]
    em = N.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 2.2
    if sc["tv_image"]:
        p = sc["tv_image"] if os.path.isabs(sc["tv_image"]) else os.path.join(cfg_dir, sc["tv_image"])
        im = N.new("ShaderNodeTexImage")
        im.image = bpy.data.images.load(p, check_existing=True)
        L.new(im.outputs["Color"], em.inputs["Color"])
    else:  # warm-to-cool "film on TV" glow
        uv = N.new("ShaderNodeTexCoord")
        ramp = N.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = (*_hex("#ff9a52"), 1)
        ramp.color_ramp.elements[1].color = (*_hex("#7fb3ff"), 1)
        sep = N.new("ShaderNodeSeparateXYZ")
        L.new(uv.outputs["UV"], sep.inputs[0])
        L.new(sep.outputs["X"], ramp.inputs["Fac"])
        L.new(ramp.outputs["Color"], em.inputs["Color"])
    L.new(em.outputs["Emission"], out.inputs["Surface"])
    me.materials.append(m)
    return root


def candlestick(pos, scale=1.0):
    """Poly Haven 'wooden_candlestick' (CC0) with a live flame and its light."""
    path = fetch_assets.local_path("model:wooden_candlestick")
    root, _ = _import_gltf(path)
    root.location = pos
    root.scale = (scale,) * 3
    flame_m = _mat("Flame", "#ffb347", emit="#ff9a2e", emit_strength=80)
    tip = mathutils.Vector(pos) + mathutils.Vector((0, 0, 0.236 * scale))
    fl = _prim("uv_sphere", "Flame", tip.to_tuple(), (0.0055 * scale, 0.0055 * scale, 0.016 * scale), flame_m,
               segments=16, ring_count=10)
    _smooth(fl)
    ld = bpy.data.lights.new("Candle light", "POINT")
    ld.energy = 2.5 * scale
    ld.color = _hex("#ff9b45")
    ld.shadow_soft_size = 0.008
    lo = _link(bpy.data.objects.new("Candle light", ld))
    lo.location = (tip + mathutils.Vector((0, 0, 0.012 * scale))).to_tuple()
    lo.visible_camera = False


def gift(pos, size, color, ribbon, rot):
    """Wrapped box with a cross ribbon and a bow."""
    sx, sy, sz = size
    paper = _mat("Gift paper", color, rough=0.55, coat=0.2)
    rib = _mat("Ribbon", ribbon, rough=0.3, metal=0.6)
    root = _link(bpy.data.objects.new("Gift", None))
    root.location = pos
    root.rotation_euler.z = rot
    def part(kind, loc, scale, mat):
        ob = _prim(kind, "Gift part", loc, scale, mat)
        ob.parent = root
        ob.location = loc
        bev = ob.modifiers.new("bevel", "BEVEL"); bev.width = min(sx, sy, sz) * 0.04; bev.segments = 3
        return ob
    part("cube", (0, 0, sz / 2), (sx / 2, sy / 2, sz / 2), paper)
    w = min(sx, sy) * 0.09
    part("cube", (0, 0, sz / 2), (w / 2 + 0.0004, sy / 2 + 0.0006, sz / 2 + 0.0006), rib)
    part("cube", (0, 0, sz / 2), (sx / 2 + 0.0006, w / 2 + 0.0004, sz / 2 + 0.0006), rib)
    for ang in (0.6, -0.6):  # bow loops
        bpy.ops.mesh.primitive_torus_add(major_radius=w * 1.4, minor_radius=w * 0.35, location=(0, 0, 0))
        t = bpy.context.active_object
        t.data.materials.append(rib)
        t.parent = root
        t.location = (math.sin(ang) * w * 1.2, 0, sz + w * 1.1)
        t.rotation_euler = (math.pi / 2, ang, 0)
        _smooth(t)
    return root


def bokeh_lights(rng, n, fwd, right, center_z):
    cols = ["#ffd08a", "#ffb35c", "#fff0cf", "#ff8a5c"]
    mats = [_mat(f"Fairy {c}", c, emit=c, emit_strength=45) for c in cols]
    for _ in range(n):
        d = 2.6 + rng.random() * 1.6
        x = (rng.random() - 0.5) * d * 1.3
        z = center_z + rng.uniform(-0.15, 1.2)
        p = fwd * d + right * x
        _prim("uv_sphere", "Fairy light", (p.x, p.y, z), (0.012,) * 3, rng.choice(mats), segments=8, ring_count=6)


# ----------------------------------------------------------------------------- public
def build(cfg, cfg_dir, product_lo, product_hi):
    """Everything except the falling snow (which needs the camera)."""
    sc = cfg["scene"]
    rng = random.Random(sc["seed"])
    a = math.radians(cfg["camera"]["orbit_deg"])
    fwd = mathutils.Vector((-math.sin(a), math.cos(a), 0))  # from camera into the scene
    right = mathutils.Vector((math.cos(a), math.sin(a), 0))
    S = max((product_hi - product_lo).x, (product_hi - product_lo).y, (product_hi - product_lo).z)
    world_hdri(sc)
    table(sc, fwd, right)
    if sc["tree"]:
        christmas_tree(rng, fwd * 2.0 - right * 0.5 + mathutils.Vector((0, 0, -TABLE_H)))
    if sc["tv"]:
        vintage_tv(sc, cfg_dir, (fwd * 1.35 + right * 0.36).to_tuple(), fwd)
    if sc["candles"]:
        candlestick((fwd * 0.42 - right * 0.2).to_tuple(), 1.0)
        candlestick((fwd * 0.55 - right * 0.07).to_tuple(), 0.78)
    if sc["gifts"]:
        cols = sc["gift_colors"]
        gift((fwd * S * 0.75 + right * S * 0.95).to_tuple(), (S * 0.6, S * 0.55, S * 0.42), cols[0], "#d6b25e", 0.35)
        gift((fwd * S * 1.4 - right * S * 0.95).to_tuple(), (S * 0.5, S * 0.5, S * 0.62), cols[1 % len(cols)], "#b3121f", -0.25)
        gift((fwd * S * 1.9 + right * S * 0.45).to_tuple(), (S * 0.42, S * 0.42, S * 0.3), cols[2 % len(cols)], "#1f5a36", 0.8)
    if sc["bokeh_lights"]:
        bokeh_lights(rng, sc["bokeh_lights"], fwd, right, (product_lo.z + product_hi.z) / 2)


def add_snow(cfg, cam):
    """Falling snow spread through the camera's view, near and far, so it turns into soft flakes."""
    n = cfg["scene"]["snow"]
    if not n:
        return
    rng = random.Random(cfg["scene"]["seed"] + 1)
    s = bpy.context.scene
    flake = _mat("Snow", "#ffffff", rough=0.6, emit="#ffffff", emit_strength=0.6)
    focus = (cam.data.dof.focus_object.location - cam.location).length
    m = cam.matrix_world
    tan_x = 18 / cam.data.lens
    aspect = s.render.resolution_x / s.render.resolution_y
    tx, ty = (tan_x, tan_x / aspect) if aspect >= 1 else (tan_x * aspect, tan_x)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1)
    proto = bpy.context.active_object
    proto.data.materials.append(flake)
    _smooth(proto)
    proto.hide_render = True
    proto.hide_viewport = True
    for _ in range(n):
        while True:
            depth = focus * (0.5 + rng.random() ** 1.8 * 2.6)
            fx, fy = rng.uniform(-1.1, 1.1), rng.uniform(-1.1, 1.1)
            # keep flakes from covering the product: nothing in the centre in front of it
            if not (depth < focus * 1.25 and abs(fx) < 0.42 and abs(fy) < 0.55):
                break
        x, y = fx * tx * depth, fy * ty * depth
        ob = proto.copy()
        ob.hide_render = False
        ob.hide_viewport = False
        _link(ob)
        r = focus * rng.uniform(0.0018, 0.0042)
        ob.scale = (r, r, r * 0.6)
        ob.location = m @ mathutils.Vector((x, y, -depth))
