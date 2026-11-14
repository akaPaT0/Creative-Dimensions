"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, Switch, ui } from "./ui";
import { Box, ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";

const DEFAULT_CATEGORIES = [
  "christmas",
  "halloween",
  "new-arrivals",
  "keychains",
  "tools",
  "accessories",
  "desk-add-ons",
  "fanboys",
];
const DEFAULT_SUBCATEGORIES = ["cute", "minecraft", "cars", "anime", "tools", "other"];

function mergeUnique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safePathSegment(s: string) {
  return slugify(s) || "model";
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

type ProductOptionRow = {
  category?: unknown;
  subCategory?: unknown;
};

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
  const [isNew, setIsNew] = useState(true);
  const [featured, setFeatured] = useState(false);

  // MULTI images (order matters: first = cover => -1.webp)
  const [images, setImages] = useState<File[]>([]);
  // Optional single 3D model (.glb)
  const [modelFile, setModelFile] = useState<File | null>(null);

  // add-new option UI
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // previews
  const previewUrls = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);
  const targetModelPath = useMemo(() => {
    const cat = safePathSegment(category);
    const sub = safePathSegment(subCategory);
    const base = safePathSegment(slug || name || id);
    return `/models/${cat}/${sub}/${base}.glb`;
  }, [category, subCategory, slug, name, id]);

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

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const res = await fetch("/api/admin/products", { cache: "no-store" });
        if (!res.ok) return;
        const data = await readJsonSafe(res);
        if (cancelled) return;

        const products: ProductOptionRow[] = Array.isArray(data?.products)
          ? data.products
          : [];
        const dbCategories = products
          .map((p) => (typeof p?.category === "string" ? p.category : ""))
          .filter(Boolean);
        const dbSubCategories = products
          .map((p) => (typeof p?.subCategory === "string" ? p.subCategory : ""))
          .filter(Boolean);

        setCategories((prev) => mergeUnique([...prev, ...dbCategories]));
        setSubCategories((prev) => mergeUnique([...prev, ...dbSubCategories]));
      } catch {
        // keep defaults if the options fetch fails
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

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

    setCategories((prev) => mergeUnique([...prev, v]));
    setCategory(v);
    setNewCategory("");
    setMsg(`Category added: ${v}`);
  }

  function addSubCategory() {
    const v = slugify(newSubCategory);
    if (!v) return;

    setSubCategories((prev) => mergeUnique([...prev, v]));
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
  const MAX_MODEL_MB = 25;

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
    if (modelFile) {
      const isGlb = modelFile.name.toLowerCase().endsWith(".glb");
      if (!isGlb) return setMsg("3D model must be a .glb file.");
      const modelMb = modelFile.size / (1024 * 1024);
      if (modelMb > MAX_MODEL_MB) {
        return setMsg(
          `Model is ${modelMb.toFixed(1)}MB. Keep model under ${MAX_MODEL_MB}MB.`
        );
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
      fd.set("isNew", String(isNew));
      fd.set("featured", String(featured));

      // Append multiple images in chosen order (first = cover)
      for (const file of images) fd.append("images", file);
      if (modelFile) fd.set("model", modelFile);

      const res = await fetch("/api/admin/add-product", { method: "POST", body: fd });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.error || "Failed");

      setMsg(
        `Saved ${data.product.category}/${data.product.slug} (${data.product.images?.length || 0} images)`
      );

      // reset fields (keep category/subCategory)
      setName("");
      setSlug("");
      setSlugTouched(false);
      setPriceUSD("2");
      setDescription("");
      setIsNew(true);
      setFeatured(false);
      setImages([]);
      setModelFile(null);

      await regenerateId();
    } catch (err: any) {
      setMsg(err?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  const coverLabel = (i: number) => (i === 0 ? "Cover" : String(i + 1));

  return (
    <form id="create-product" onSubmit={onSubmit} className="space-y-4">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Details */}
        <section className={`${ui.panelPad} space-y-4`}>
          <h2 className="text-base font-bold text-white">Details</h2>

          <Field label="Name">
            <input
              className={ui.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cute Barbie Comb"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field label="Link (slug)" hint={slugTouched ? "Edited by hand" : "Made from the name"}>
              <div className="flex gap-2">
                <input
                  className={ui.input}
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="cute-barbie-comb"
                />
                {slugTouched && (
                  <button
                    type="button"
                    onClick={() => setSlugTouched(false)}
                    className={`shrink-0 ${ui.btn}`}
                    title="Go back to the slug made from the name"
                  >
                    Auto
                  </button>
                )}
              </div>
            </Field>
            <Field label="Price $">
              <input
                type="number"
                step="0.1"
                className={ui.input}
                value={priceUSD}
                onChange={(e) => setPriceUSD(e.target.value)}
                placeholder="2"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select className={ui.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  className={`${ui.input} py-2 text-xs`}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category"
                />
                <button type="button" onClick={addCategory} className={`shrink-0 ${ui.btnSm}`} disabled={!newCategory.trim()}>
                  Add
                </button>
              </div>
            </Field>
            <Field label="Sub-category">
              <select className={ui.select} value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                {subCategories.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  className={`${ui.input} py-2 text-xs`}
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  placeholder="New sub-category"
                />
                <button type="button" onClick={addSubCategory} className={`shrink-0 ${ui.btnSm}`} disabled={!newSubCategory.trim()}>
                  Add
                </button>
              </div>
            </Field>
          </div>

          <Field label="Description">
            <textarea
              className={`min-h-[160px] ${ui.input}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What it is, size, colours, what it's good for…"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.06] pt-4">
            <Switch checked={isNew} onChange={setIsNew} label="Mark as new" />
            <Switch checked={featured} onChange={setFeatured} label="Featured on home" />
            <span className={`ml-auto ${ui.mono}`}>
              ID {id || "…"}{" "}
              <button type="button" onClick={regenerateId} className="ml-1 text-white/50 underline-offset-2 hover:text-white hover:underline">
                regenerate
              </button>
            </span>
          </div>
        </section>

        {/* Media */}
        <div className="space-y-4">
          <section className={`${ui.panelPad} space-y-3`}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Photos {images.length > 0 && <span className="text-white/40">({images.length})</span>}
              </h2>
              {images.length > 0 && (
                <button type="button" onClick={() => setImages([])} className="text-xs font-semibold text-white/45 hover:text-white">
                  Clear all
                </button>
              )}
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-[#0f0f11] px-4 py-7 text-center transition hover:border-[#FF8B64]/50 hover:bg-[#FF8B64]/[0.03]">
              <ImagePlus size={22} className="text-[#FF8B64]" aria-hidden="true" />
              <span className="text-sm font-semibold text-white">Add photos</span>
              <span className="text-xs text-white/40">PNG, JPG or WebP · under {MAX_MB_EACH}MB each</span>
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setImages((prev) => {
                    const seen = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
                    const toAdd = files.filter((f) => !seen.has(`${f.name}-${f.size}-${f.lastModified}`));
                    return [...prev, ...toAdd];
                  });
                  e.currentTarget.value = "";
                }}
              />
            </label>

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previewUrls.map((u, i) => (
                  <div
                    key={u}
                    className={`group relative aspect-square overflow-hidden rounded-xl border bg-black ${
                      i === 0 ? "border-[#FF8B64]/60" : "border-white/10"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    <span
                      className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        i === 0 ? "bg-[#FF8B64] text-[#0D0D0D]" : "bg-black/60 text-white"
                      }`}
                    >
                      {coverLabel(i)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImageAt(i)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white/80 hover:bg-red-500/80 hover:text-white transition"
                      aria-label={`Remove photo ${i + 1}`}
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                    <div className="absolute inset-x-1.5 bottom-1.5 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveImage(i, -1)}
                        className="flex h-6 flex-1 items-center justify-center rounded-md bg-black/70 text-white hover:bg-black disabled:opacity-30"
                        aria-label="Move earlier"
                      >
                        <ChevronLeft size={13} aria-hidden="true" />
                      </button>
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => makeCover(i)}
                          className="flex h-6 flex-[2] items-center justify-center rounded-md bg-black/70 text-[10px] font-bold text-white hover:bg-black"
                        >
                          Cover
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={i === previewUrls.length - 1}
                        onClick={() => moveImage(i, 1)}
                        className="flex h-6 flex-1 items-center justify-center rounded-md bg-black/70 text-white hover:bg-black disabled:opacity-30"
                        aria-label="Move later"
                      >
                        <ChevronRight size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className={ui.note}>
              The first photo is the cover. Saved as {category}/{subCategory}/{slug || "slug"}-001.webp, -002…
            </p>
          </section>

          <section className={`${ui.panelPad} space-y-3`}>
            <h2 className="text-base font-bold text-white">
              3D model <span className="text-sm font-normal text-white/40">optional</span>
            </h2>
            {modelFile ? (
              <div className={`${ui.inset} flex items-center gap-3 px-3 py-2.5 text-sm`}>
                <Box size={16} className="shrink-0 text-[#FF8B64]" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-white/85">{modelFile.name}</span>
                <button type="button" onClick={() => setModelFile(null)} className="text-xs font-semibold text-white/45 hover:text-white">
                  Remove
                </button>
              </div>
            ) : (
              <input
                className={ui.file}
                type="file"
                accept=".glb,model/gltf-binary"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setModelFile(file);
                  e.currentTarget.value = "";
                }}
              />
            )}
            <p className={ui.note}>
              One .glb file lets customers pick colours on the product page. Saved to{" "}
              <code className="text-white/55">{targetModelPath.replace(/^\/+/, "")}</code>
            </p>
          </section>
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#161619]/95 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className={`min-w-0 text-sm ${msg ? "text-white/80" : "text-white/40"}`}>
          {msg || (name ? `${name} · $${priceUSD || 0} · ${images.length} photo${images.length === 1 ? "" : "s"}` : "Fill in the details and add at least one photo.")}
        </p>
        <button disabled={busy} className={`${ui.btnPrimary} shrink-0`} type="submit">
          {busy ? "Saving…" : "Save product"}
        </button>
      </div>
    </form>
  );
}
