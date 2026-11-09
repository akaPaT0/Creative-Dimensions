"use client";

import { useEffect, useMemo, useState } from "react";
import ImageSorter from "./components/ImageSorter";
import VariantEditor, { type VariantDraft } from "./components/VariantEditor";
import { suggestSwatch } from "@/app/lib/product-variants";
import { Pencil, RefreshCw, Search, Trash2, X } from "lucide-react";
import { EmptyState, FilterChips, StatStrip, Switch, ui } from "./ui";

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subCategory?: string;
  priceUSD: number;
  description: string;
  isNew?: boolean;
  featured?: boolean;
  image?: string;
  images?: string[];
  variants?: { label: string; hex: string; hex2?: string; image: string }[];
  customizeColors?: {
    modelUrl: string;
    defaultHexes: string[];
    slotLabels?: string[];
  };
};

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

function mergeUnique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

export default function AdminProductsManager() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");

  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setMsg(null);
    setLoading(true);
    try {
      const r = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load");
      setProducts(data.products || []);
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const [savingFlag, setSavingFlag] = useState<Record<string, boolean>>({});

  async function toggleFlag(p: Product, flag: "isNew" | "featured") {
    const key = `${p.id}:${flag}`;
    if (savingFlag[key]) return;
    const value = !p[flag];
    setMsg(null);
    setSavingFlag((s) => ({ ...s, [key]: true }));
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, [flag]: value } : x)));
    try {
      const r = await fetch(`/api/admin/products/${encodeURIComponent(p.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flag]: value }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Failed to save");
    } catch (e: any) {
      setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, [flag]: !value } : x)));
      setMsg(`${p.name}: ${e?.message || "Could not update"}`);
    } finally {
      setSavingFlag((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;

    return products.filter((p) => {
      const hay = `${p.id} ${p.name} ${p.slug} ${p.category} ${p.subCategory || ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [products, q]);

  const [catFilter, setCatFilter] = useState<string>("all");
  const visible = useMemo(
    () =>
      filtered.filter((p) =>
        catFilter === "all"
          ? true
          : catFilter === "featured"
            ? !!p.featured
            : catFilter === "new"
              ? !!p.isNew
              : p.category === catFilter
      ),
    [filtered, catFilter]
  );

  const stats = useMemo(() => {
    const total = products.length;
    const featuredCount = products.filter((p) => p.featured).length;
    const newCount = products.filter((p) => p.isNew).length;
    const categories = new Set(products.map((p) => p.category));
    return {
      total,
      featuredCount,
      newCount,
      categoriesCount: categories.size,
    };
  }, [products]);

  const categoryOptions = useMemo(
    () => mergeUnique(products.map((p) => p.category)),
    [products]
  );
  const subCategoryOptions = useMemo(
    () => mergeUnique(products.map((p) => p.subCategory || "")),
    [products]
  );

  return (
    <div id="manage-products" className="space-y-4">
      <StatStrip
        items={[
          { label: "Products", value: loading ? "–" : stats.total },
          { label: "Featured", value: loading ? "–" : stats.featuredCount, accent: true },
          { label: "Marked new", value: loading ? "–" : stats.newCount },
          { label: "Categories", value: loading ? "–" : stats.categoriesCount },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, ID or slug"
            className={`${ui.input} pl-10`}
          />
        </div>
        <button type="button" onClick={refresh} className={ui.btn} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <FilterChips
        value={catFilter}
        onChange={setCatFilter}
        options={[
          { value: "all", label: "All", count: products.length },
          { value: "featured", label: "Featured", count: stats.featuredCount },
          { value: "new", label: "New", count: stats.newCount },
          ...categoryOptions.map((c) => ({
            value: c,
            label: c.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
            count: products.filter((p) => p.category === c).length,
          })),
        ]}
      />

      {msg && <p className={ui.error}>{msg}</p>}

      <div className={`${ui.panel} overflow-hidden`}>
        <div className="hidden grid-cols-[56px_minmax(0,1fr)_120px_70px_120px_auto] items-center gap-4 border-b border-white/[0.06] px-5 py-2.5 md:grid">
          <span className="sr-only">Photo</span>
          <span className={ui.th + " px-0 py-0"}>Product</span>
          <span className={ui.th + " px-0 py-0"}>Category</span>
          <span className={ui.th + " px-0 py-0 text-right"}>Price</span>
          <span className={ui.th + " px-0 py-0"}>Show as</span>
          <span className="sr-only">Actions</span>
        </div>

        {loading && (
          <div className="divide-y divide-white/[0.06]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                <div className="h-14 w-14 animate-pulse rounded-xl bg-white/[0.06]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <EmptyState title="No products found" hint="Try another search or filter." />
        )}

        {!loading && visible.length > 0 && (
          <ul className="divide-y divide-white/[0.06]">
            {visible.map((p) => {
              const img = (p.images && p.images[0]) || p.image || "/products/placeholder.jpg";
              return (
                <li
                  key={p.id}
                  className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-3 transition-colors hover:bg-white/[0.02] sm:px-5 md:grid-cols-[56px_minmax(0,1fr)_120px_70px_120px_auto]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 rounded-xl border border-white/10 bg-black object-cover"
                  />

                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="block max-w-full truncate text-left text-sm font-semibold text-white hover:text-[#FF8B64] transition-colors"
                    >
                      {p.name}
                    </button>
                    <p className={`truncate ${ui.mono}`}>
                      {p.id} · {p.slug}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/45 md:hidden">
                      {p.category}
                      {p.subCategory ? ` / ${p.subCategory}` : ""} · <span className="text-white/80">${p.priceUSD}</span>
                    </p>
                  </div>

                  <div className="hidden min-w-0 md:block">
                    <p className="truncate text-sm capitalize text-white/75">{p.category.replace(/-/g, " ")}</p>
                    <p className="truncate text-xs text-white/40">{p.subCategory || "–"}</p>
                  </div>

                  <p className="hidden text-right text-sm font-semibold tabular-nums text-white md:block">${p.priceUSD}</p>

                  <div className="col-span-3 col-start-2 flex gap-1.5 md:col-span-1 md:col-start-auto md:flex-col">
                    <FlagToggle
                      label="New"
                      on={!!p.isNew}
                      busy={!!savingFlag[`${p.id}:isNew`]}
                      onClick={() => toggleFlag(p, "isNew")}
                    />
                    <FlagToggle
                      label="Featured"
                      on={!!p.featured}
                      busy={!!savingFlag[`${p.id}:featured`]}
                      onClick={() => toggleFlag(p, "featured")}
                    />
                  </div>

                  <div className="col-start-3 row-start-1 flex justify-end gap-1.5 md:col-start-auto md:row-start-auto">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className={ui.btnSm}
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(p)}
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg text-white/35 transition hover:bg-red-500/10 hover:text-red-300"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <EditModal
          product={editing}
          categoryOptions={categoryOptions}
          subCategoryOptions={subCategoryOptions}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}

      {deleting && (
        <ConfirmDelete
          product={deleting}
          onCancel={() => setDeleting(null)}
          onDeleted={async () => {
            setDeleting(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function FlagToggle({
  label,
  on,
  busy,
  onClick,
}: {
  label: string;
  on: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      disabled={busy}
      className={`inline-flex w-[104px] items-center justify-between gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-60 ${
        on
          ? "border-[#FF8B64]/50 bg-[#FF8B64]/12 text-[#FF8B64]"
          : "border-white/10 bg-white/[0.03] text-white/45 hover:text-white/75"
      }`}
    >
      {label}
      <span
        className={`relative h-4 w-7 shrink-0 rounded-full transition ${on ? "bg-[#FF8B64]" : "bg-white/15"}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${on ? "left-[14px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

/** Scrollable modal */
function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[999]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative h-full w-full overflow-y-auto px-3 py-6 sm:px-4 sm:py-10">
        <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#161619] shadow-[0_30px_100px_rgba(0,0,0,0.7)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function EditModal({
  product,
  categoryOptions,
  subCategoryOptions,
  onClose,
  onSaved,
}: {
  product: Product;
  categoryOptions: string[];
  subCategoryOptions: string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [slugTouched, setSlugTouched] = useState(false);

  const [category, setCategory] = useState(product.category);
  const [subCategory, setSubCategory] = useState(product.subCategory || "");
  const [priceUSD, setPriceUSD] = useState(String(product.priceUSD));
  const [description, setDescription] = useState(product.description);
  const categoryListId = `category-options-${product.id}`;
  const subCategoryListId = `subcategory-options-${product.id}`;

  const [isNew, setIsNew] = useState(!!product.isNew);
  const [featured, setFeatured] = useState(!!product.featured);

  // ✅ Existing images you can reorder/remove
  const initialExistingImages =
    (product.images && product.images.length
      ? product.images
      : product.image
        ? [product.image]
        : []) as string[];
  const [existingImages, setExistingImages] = useState<string[]>(initialExistingImages);

  // ✅ FIX: only send imagesOrder if user actually changed it
  const initialImagesOrderStr = useMemo(() => JSON.stringify(initialExistingImages), []);

  // Optional: uploading new files replaces old images (backend handles deletion)
  const [images, setImages] = useState<File[]>([]);
  // Colour per existing photo, keyed by image URL.
  const [variantDrafts, setVariantDrafts] = useState<Record<string, VariantDraft>>(() =>
    Object.fromEntries(
      (product.variants ?? []).map((v) => {
        // Swatches left on the default white were never picked: fill them from the name.
        const untouched = !v.hex2 && (v.hex === "#ffffff" || v.hex === "#fff");
        const suggestion = untouched ? suggestSwatch(v.label) : null;
        const draft: VariantDraft = suggestion
          ? { label: v.label, hex: suggestion.hex, hex2: suggestion.hex2 }
          : { label: v.label, hex: v.hex, hex2: v.hex2, manual: !untouched };
        return [v.image, draft];
      })
    )
  );
  const [modelFile, setModelFile] = useState<File | null>(null);
  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);
  const targetModelPath = useMemo(() => {
    const cat = safePathSegment(category);
    const sub = safePathSegment(subCategory);
    const base = safePathSegment(slug || name || product.id);
    return `/models/${cat}/${sub}/${base}.glb`;
  }, [category, subCategory, slug, name, product.id]);

  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  async function save() {
    setMsg(null);
    setBusy(true);
    try {
      if (modelFile) {
        const isGlb = modelFile.name.toLowerCase().endsWith(".glb");
        if (!isGlb) throw new Error("3D model must be a .glb file.");
        const modelMb = modelFile.size / (1024 * 1024);
        if (modelMb > 25) throw new Error("Model must be under 25MB.");
      }

      const fd = new FormData();
      fd.set("name", name);
      fd.set("slug", slug);
      fd.set("category", category);
      fd.set("subCategory", subCategory);
      fd.set("priceUSD", priceUSD);
      fd.set("description", description);
      fd.set("isNew", String(isNew));
      fd.set("featured", String(featured));

      // ✅ FIX: persist order/removals ONLY if changed
      const currentImagesOrderStr = JSON.stringify(existingImages);
      if (currentImagesOrderStr !== initialImagesOrderStr) {
        fd.set("imagesOrder", currentImagesOrderStr);
      }

      // Colours follow the current photo order; replacing photos clears them server-side.
      if (images.length === 0) {
        const variants = existingImages
          .filter((url) => variantDrafts[url]?.label.trim())
          .map((url) => ({
            label: variantDrafts[url].label.trim(),
            hex: variantDrafts[url].hex,
            ...(variantDrafts[url].hex2 ? { hex2: variantDrafts[url].hex2 } : {}),
            image: url,
          }));
        fd.set("variants", JSON.stringify(variants));
      }

      // Optional: replace images by uploading new files
      for (const f of images) fd.append("images", f);
      if (modelFile) fd.set("model", modelFile);

      const r = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: "PUT",
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to save");

      await onSaved();
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#161619] px-5 py-4">
        <div className="min-w-0">
          <div className="truncate text-base font-bold text-white">{product.name}</div>
          <div className={ui.mono}>{product.id}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white transition"
          aria-label="Close"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {msg && <p className={ui.error}>{msg}</p>}

        <div>
          <label className={ui.label}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1.5 ${ui.input}`}
          />
        </div>

        <div>
          <label className={ui.label}>Slug</label>
          <div className="mt-1.5 flex gap-2">
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className={ui.input}
            />
            <button
              type="button"
              onClick={() => setSlugTouched(false)}
              className={`shrink-0 ${ui.btn}`}
            >
              Auto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={ui.label}>Category</label>
            <input
              list={categoryListId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`mt-1.5 ${ui.input}`}
            />
            <datalist id={categoryListId}>
              {mergeUnique([...categoryOptions, category]).map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={ui.label}>Sub-category</label>
            <input
              list={subCategoryListId}
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className={`mt-1.5 ${ui.input}`}
            />
            <datalist id={subCategoryListId}>
              {mergeUnique([...subCategoryOptions, subCategory]).map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={ui.label}>Price USD</label>
            <input
              value={priceUSD}
              onChange={(e) => setPriceUSD(e.target.value)}
              type="number"
              step="0.1"
              className={`mt-1.5 ${ui.input}`}
            />
          </div>

          <div className="flex items-end gap-5 pb-2.5">
            <Switch checked={isNew} onChange={setIsNew} label="New" />
            <Switch checked={featured} onChange={setFeatured} label="Featured" />
          </div>
        </div>

        <div>
          <label className={ui.label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`mt-1.5 min-h-[120px] ${ui.input}`}
          />
        </div>

        {/* Existing images: reorder/remove */}
        <div className={`${ui.inset} p-4 space-y-3`}>
          <ImageSorter images={existingImages} onChange={setExistingImages} />
          <p className={ui.note}>Reorder/remove existing images, then Save.</p>
        </div>

        <VariantEditor
          images={existingImages}
          value={variantDrafts}
          onChange={setVariantDrafts}
          disabled={images.length > 0}
        />

        {/* Replace images (optional) */}
        <div>
          <label className={ui.label}>Replace images (optional)</label>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className={`mt-1.5 ${ui.file}`}
            onChange={(e) => setImages(Array.from(e.target.files || []))}
          />
          <p className={`mt-1.5 ${ui.note}`}>
            If you upload images here, old images will be deleted and replaced with new ones.
          </p>
        </div>

        <div>
          <label className={ui.label}>Replace 3D model (optional, max 1 .glb)</label>
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            className={`mt-1.5 ${ui.file}`}
            onChange={(e) => setModelFile(e.target.files?.[0] || null)}
          />
          <p className={`mt-1.5 ${ui.note}`}>
            Current model: {product.customizeColors?.modelUrl || "none"}
          </p>
          <p className={`mt-1.5 ${ui.note}`}>
            Storage path: <code>{targetModelPath.replace(/^\/+/, "")}</code>
          </p>
          {modelFile && (
            <p className="text-white/60 text-xs mt-1">New model: {modelFile.name}</p>
          )}
        </div>

        {previews.length > 0 && (
          <div className={`${ui.inset} p-3`}>
            <p className="text-white/60 text-sm mb-3">New images preview</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {previews.map((u, i) => (
                <div key={u} className="rounded-xl overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt={`new-${i}`} className="w-full h-32 object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-white/[0.06] bg-[#161619] px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className={ui.btn}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className={ui.btnPrimary}
        >
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </ModalShell>
  );
}

function ConfirmDelete({
  product,
  onCancel,
  onDeleted,
}: {
  product: Product;
  onCancel: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function doDelete() {
    setMsg(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Failed to delete");
      await onDeleted();
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell>
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div>
          <div className="text-base font-bold text-white">Delete product</div>
          <div className={ui.mono}>{product.id}</div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className={ui.btn}
        >
          Close
        </button>
      </div>

      <div className="p-5 space-y-3">
        <p className="text-white/80">
          Are you sure you want to delete <span className="font-semibold">{product.name}</span>?
        </p>
        <p className="text-white/50 text-sm">
          This removes it from the product DB and deletes related storage files.
        </p>
        {msg && <p className={ui.error}>{msg}</p>}
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-white/[0.06] bg-[#161619] px-5 py-4">
        <button
          type="button"
          onClick={onCancel}
          className={ui.btn}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={doDelete}
          className={ui.btnDanger}
        >
          {busy ? "Deleting..." : "Yes, delete"}
        </button>
      </div>
    </ModalShell>
  );
}
