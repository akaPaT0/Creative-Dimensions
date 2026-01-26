"use client";

import React from "react";
import ImageSorter from "@/app/admin/components/ImageSorter";

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

export default function EditProductClient({ product }: { product: Product }) {
  const initialImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  const [name, setName] = React.useState(product.name ?? "");
  const [slug, setSlug] = React.useState(product.slug ?? "");
  const [category, setCategory] = React.useState(product.category ?? "");
  const [subCategory, setSubCategory] = React.useState(product.subCategory ?? "");
  const [priceUSD, setPriceUSD] = React.useState<string>(String(product.priceUSD ?? ""));
  const [description, setDescription] = React.useState(product.description ?? "");
  const [isNew, setIsNew] = React.useState(Boolean(product.isNew));
  const [featured, setFeatured] = React.useState(Boolean(product.featured));

  // ✅ THIS is the array you reorder
  const [images, setImages] = React.useState<string[]>(initialImages);

  // Optional replacement uploads (if you upload, backend replaces and deletes old ones)
  const [newFiles, setNewFiles] = React.useState<File[]>([]);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("slug", slug);
      formData.set("category", category);
      formData.set("subCategory", subCategory);
      formData.set("priceUSD", priceUSD);
      formData.set("description", description);
      formData.set("isNew", String(isNew));
      formData.set("featured", String(featured));

      // ✅ REQUIRED: tells your PUT route the NEW ORDER / removals
      formData.set("imagesOrder", JSON.stringify(images));

      // Optional: replacing images by uploading new ones
      for (const f of newFiles) formData.append("images", f);

      const r = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to update product");

      // If you uploaded new files, server returns product with new images[] paths
      if (data?.product?.images && Array.isArray(data.product.images)) {
        setImages(data.product.images);
      }

      setNewFiles([]);
      setSuccess("Saved.");
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          <div className="text-xs text-white/70">Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs text-white/70">Slug</div>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs text-white/70">Category</div>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs text-white/70">SubCategory</div>
          <input
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs text-white/70">Price (USD)</div>
          <input
            value={priceUSD}
            onChange={(e) => setPriceUSD(e.target.value)}
            inputMode="decimal"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
          />
        </label>

        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
            isNew
          </label>

          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            featured
          </label>
        </div>
      </div>

      <label className="space-y-1 block">
        <div className="text-xs text-white/70">Description</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
        />
      </label>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <ImageSorter images={images} onChange={setImages} />

        <div className="space-y-2">
          <div className="text-sm text-white/80">Replace images (upload new)</div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm text-white/70"
          />
          {newFiles.length > 0 && (
            <div className="text-xs text-white/60">
              Selected {newFiles.length} file(s). Saving will replace the whole images set.
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
