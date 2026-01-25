"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_CATEGORIES = ["new-arrivals", "keychains", "tools", "accessories", "fanboys"];
const DEFAULT_SUBCATEGORIES = ["cute", "minecraft", "cars", "anime", "tools", "other"];

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ✅ Safe JSON reader (prevents "Unexpected token ..." crashes)
async function readJsonSafe(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!ct.includes("application/json")) {
    throw new Error(
      `Non-JSON response (${res.status}) ct=${ct || "none"} body=${text.slice(0, 200)}`
    );
  }

  return text ? JSON.parse(text) : null;
}

export default function AdminProductForm() {
  // options (editable in UI)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [subCategories, setSubCategories] = useState<string[]>(DEFAULT_SUBCATEGORIES);

  // product fields
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [category, setCategory] = useState<string>("keychains");
  const [subCategory, setSubCategory] = useState<string>("cute");

  const [priceUSD, setPriceUSD] = useState<string>("2");
  const [description, setDescription] = useState("");

  // MULTI images (order matters: first = cover => -1.webp)
  const [images, setImages] = useState<File[]>([]);

  // add-new option UI
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // previews
  const previewUrls = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);

  // Auto slug from name (unless user edited slug manually)
  useEffect(() => {
    if (slugTouched) return;
    if (!name.trim()) {
      setSlug("");
      return;
    }
    setSlug(slugify(name));
  }, [name, slugTouched]);

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      for (const u of previewUrls) URL.revokeObjectURL(u);
    };
  }, [previewUrls]);

  async function fetchNextId(cat: string, sub: string) {
    if (!cat || !sub) return;
    try {
      const r = await fetch(
        `/api/admin/next-id?category=${encodeURIComponent(cat)}&subCategory=${encodeURIComponent(sub)}`
      );
      if (!r.ok) return;
      const data = await readJsonSafe(r);
      if (data?.id) setId(data.id);
    } catch {
      // ignore
    }
  }

  // Auto ID from category + subCategory
  useEffect(() => {
    fetchNextId(category, subCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subCategory]);

  async function regenerateId() {
    setMsg(null);
    await fetchNextId(category, subCategory);
  }

  function addCategory() {
    const v = slugify(newCategory);
    if (!v) return;

    setCategories((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setCategory(v);
    setNewCategory("");
    setMsg(`Category added: ${v}`);
  }

  function addSubCategory() {
    const v = slugify(newSubCategory);
    if (!v) return;

    setSubCategories((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setSubCategory(v);
    setNewSubCategory("");
    setMsg(`Sub-category added: ${v}`);
  }

  function removeImageAt(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImage(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  function makeCover(index: number) {
    setImages((prev) => {
      if (index <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return next;
    });
  }

  // Optional: prevent 413 payload too large (tweak to your server limits)
  const MAX_MB_TOTAL = 20;
  const MAX_MB_EACH = 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!id.trim()) return setMsg("ID is required (auto-generated).");
    if (!name.trim()) return setMsg("Name is required.");
    if (!category.trim()) return setMsg("Category is required.");
    if (!subCategory.trim()) return setMsg("Sub-category is required.");
    if (!priceUSD.trim()) return setMsg("priceUSD is required.");
    if (!description.trim()) return setMsg("Description is required.");
    if (images.length === 0) return setMsg("At least 1 image is required.");

    // size guard (avoid 413)
    const totalMB = images.reduce((s, f) => s + f.size, 0) / (1024 * 1024);
    if (totalMB > MAX_MB_TOTAL) {
      return setMsg(`Images too large: ${totalMB.toFixed(1)}MB. Keep total under ${MAX_MB_TOTAL}MB.`);
    }
    for (const f of images) {
      const mb = f.size / (1024 * 1024);
      if (mb > MAX_MB_EACH) {
        return setMsg(`"${f.name}" is ${mb.toFixed(1)}MB. Keep each image under ${MAX_MB_EACH}MB.`);
      }
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("name", name);
      fd.set("slug", slug || name);
      fd.set("category", category);
      fd.set("subCategory", subCategory);
      fd.set("priceUSD", priceUSD);
      fd.set("description", description);

      // Append multiple images in chosen order (first = cover)
      for (const file of images) fd.append("images", file);

      const res = await fetch("/api/admin/add-product", { method: "POST", body: fd });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.error || "Failed");

      setMsg(
        `Saved ✅ ${data.product.category}/${data.product.slug} (${data.product.images?.length || 0} images)`
      );

      // reset fields (keep category/subCategory)
      setName("");
      setSlug("");
      setSlugTouched(false);
      setPriceUSD("2");
      setDescription("");
      setImages([]);

      await regenerateId();
    } catch (err: any) {
      setMsg(err?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 w-full max-w-2xl space-y-4">
      {/* ID + price */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-white/80 text-sm">ID (auto)</label>
          <div className="mt-1 flex gap-2">
            <input
              readOnly
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 outline-none"
              value={id}
              placeholder="KECU008"
            />
            <button
              type="button"
              onClick={regenerateId}
              className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
            >
              Regen
            </button>
          </div>
        </div>

        <div>
          <label className="text-white/80 text-sm">Price USD</label>
          <input
            type="number"
            step="0.1"
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
            value={priceUSD}
            onChange={(e) => setPriceUSD(e.target.value)}
            placeholder="2"
          />
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-white/80 text-sm">Name</label>
        <input
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cute Barbie Comb"
        />
      </div>

      {/* Slug + Auto button */}
      <div>
        <label className="text-white/80 text-sm">Slug</label>
        <div className="mt-1 flex gap-2">
          <input
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="cute-barbie-comb"
          />
          <button
            type="button"
            onClick={() => setSlugTouched(false)}
            className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
            title="Return to auto-generated slug"
          >
            Auto
          </button>
        </div>
      </div>

      {/* Category + SubCategory + Add new */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div>
            <label className="text-white/80 text-sm">Category</label>
            <select
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-2 text-white outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new category..."
            />
            <button
              type="button"
              onClick={addCategory}
              className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-white/80 text-sm">Sub-category</label>
            <select
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-2 text-white outline-none"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
            >
              {subCategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
              value={newSubCategory}
              onChange={(e) => setNewSubCategory(e.target.value)}
              placeholder="Add new sub-category..."
            />
            <button
              type="button"
              onClick={addSubCategory}
              className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* MULTI Image upload */}
      <div>
        <label className="text-white/80 text-sm">Images (multiple)</label>
        <input
          className="mt-1 w-full text-white/80"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            // ✅ append instead of replace
            setImages((prev) => {
              const seen = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
              const toAdd = files.filter((f) => !seen.has(`${f.name}-${f.size}-${f.lastModified}`));
              return [...prev, ...toAdd];
            });

            // ✅ allow adding the same file again later if needed
            e.currentTarget.value = "";
          }}
        />

        <div className="mt-2 flex items-center gap-2">
          <p className="text-white/40 text-xs">
            Order matters: first image becomes <b>-1</b> (cover). Saved as: /products/{category}/{subCategory}/{slug}
            -1.webp, -2.webp...
          </p>
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => setImages([])}
              className="ml-auto rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10 transition"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Preview grid + ordering controls */}
      {previewUrls.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/60 text-sm mb-3">
            Preview ({previewUrls.length}) <span className="text-white/40">(first is cover)</span>
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {previewUrls.map((u, i) => (
              <div key={u} className="relative rounded-xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`preview-${i}`} className="w-full h-40 object-cover" />

                {/* index badge */}
                <div className="absolute bottom-2 left-2 rounded-lg border border-white/15 bg-black/35 px-2 py-1 text-xs text-white">
                  {i === 0 ? "Cover (1)" : i + 1}
                </div>

                {/* controls */}
                <div className="absolute top-2 left-2 flex gap-2">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveImage(i, -1)}
                    className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/55 disabled:opacity-40 transition"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === previewUrls.length - 1}
                    onClick={() => moveImage(i, 1)}
                    className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/55 disabled:opacity-40 transition"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => makeCover(i)}
                    className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/55 disabled:opacity-40 transition"
                    title="Make cover (move to first)"
                  >
                    Cover
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeImageAt(i)}
                  className="absolute top-2 right-2 rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/55 transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="text-white/80 text-sm">Description</label>
        <textarea
          className="mt-1 w-full min-h-[140px] rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write the product description..."
        />
      </div>

      {/* Submit */}
      <button
        disabled={busy}
        className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-white hover:bg-white/10 disabled:opacity-60 transition"
        type="submit"
      >
        {busy ? "Saving..." : "Save product"}
      </button>

      {msg && <p className="text-white/70 text-sm">{msg}</p>}
    </form>
  );
}
