"use client";

import { useEffect, useMemo, useState } from "react";
import ImageSorter from "./components/ImageSorter";

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
};

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;

    return products.filter((p) => {
      const hay = `${p.id} ${p.name} ${p.slug} ${p.category} ${p.subCategory || ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [products, q]);

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

  return (
    <section
      id="manage-products"
      className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-white text-xl font-semibold">Catalog Manager</h2>
          <p className="text-white/50 text-sm">
            Search, edit, and delete products from a single control table.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, id, slug..."
            className="w-full md:w-80 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          />
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {msg && <p className="mt-3 text-white/70 text-sm">{msg}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">Total Products</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {stats.total}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">Featured</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {stats.featuredCount}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">New</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {stats.newCount}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">Categories</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {stats.categoriesCount}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <p className="text-white/70 text-sm">{loading ? "Loading..." : `${filtered.length} items`}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-white/60">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white/85">
              {filtered.map((p) => {
                const img = (p.images && p.images[0]) || p.image || "/products/placeholder.jpg";
                return (
                  <tr key={p.id} className="border-b border-white/10 last:border-b-0">
                    <td className="px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={p.name}
                        className="h-12 w-12 rounded-xl object-cover border border-white/10"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-white/80">{p.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-white/50 text-xs">{p.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{p.category}</div>
                      <div className="text-white/50 text-xs">{p.subCategory || "-"}</div>
                    </td>
                    <td className="px-4 py-3">${p.priceUSD}</td>
                    <td className="px-4 py-3 text-xs text-white/70">
                      <div>{p.isNew ? "NEW" : ""}</div>
                      <div>{p.featured ? "FEATURED" : ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(p)}
                          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white hover:bg-white/10 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(p)}
                          className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-red-100 hover:bg-red-500/20 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditModal
          product={editing}
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
    </section>
  );
}

/** ✅ FIXED: scrollable modal */
function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative h-full w-full overflow-y-auto px-4 py-8">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0D0D0D]/80 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function EditModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
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
  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);

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

      // Optional: replace images by uploading new files
      for (const f of images) fd.append("images", f);

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
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-white font-semibold">Edit product</div>
          <div className="text-white/50 text-xs font-mono">{product.id}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white hover:bg-white/10 transition"
        >
          Close
        </button>
      </div>

      <div className="p-5 space-y-4">
        {msg && <p className="text-white/70 text-sm">{msg}</p>}

        <div>
          <label className="text-white/70 text-sm">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm">Slug</label>
          <div className="mt-1 flex gap-2">
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
            />
            <button
              type="button"
              onClick={() => setSlugTouched(false)}
              className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
            >
              Auto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-white/70 text-sm">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">Sub-category</label>
            <input
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-white/70 text-sm">Price USD</label>
            <input
              value={priceUSD}
              onChange={(e) => setPriceUSD(e.target.value)}
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
            />
          </div>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-white/70 text-sm">
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
              isNew
            </label>
            <label className="flex items-center gap-2 text-white/70 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              featured
            </label>
          </div>
        </div>

        <div>
          <label className="text-white/70 text-sm">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full min-h-[120px] rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          />
        </div>

        {/* Existing images: reorder/remove */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <ImageSorter images={existingImages} onChange={setExistingImages} />
          <p className="text-white/40 text-xs">Reorder/remove existing images, then Save.</p>
        </div>

        {/* Replace images (optional) */}
        <div>
          <label className="text-white/70 text-sm">Replace images (optional)</label>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="mt-1 w-full text-white/70"
            onChange={(e) => setImages(Array.from(e.target.files || []))}
          />
          <p className="text-white/40 text-xs mt-1">
            If you upload images here, old images will be deleted and replaced with new ones.
          </p>
        </div>

        {previews.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
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

      <div className="p-5 border-t border-white/10 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-white hover:bg-white/15 disabled:opacity-60 transition"
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
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-white font-semibold">Delete product</div>
          <div className="text-white/50 text-xs font-mono">{product.id}</div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white hover:bg-white/10 transition"
        >
          Close
        </button>
      </div>

      <div className="p-5 space-y-3">
        <p className="text-white/80">
          Are you sure you want to delete <span className="font-semibold">{product.name}</span>?
        </p>
        <p className="text-white/50 text-sm">
          This removes it from <code className="text-white/70">products.ts</code> and deletes its images.
        </p>
        {msg && <p className="text-red-200/80 text-sm">{msg}</p>}
      </div>

      <div className="p-5 border-t border-white/10 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={doDelete}
          className="rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2 text-red-100 hover:bg-red-500/25 disabled:opacity-60 transition"
        >
          {busy ? "Deleting..." : "Yes, delete"}
        </button>
      </div>
    </ModalShell>
  );
}
