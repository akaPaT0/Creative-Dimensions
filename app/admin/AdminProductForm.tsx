"use client";

import { useMemo, useState } from "react";

export default function AdminProductForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("keychains");
  const [subCategory, setSubCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!title.trim()) return setMsg("Title is required.");
    if (!category.trim()) return setMsg("Category is required.");
    if (!image) return setMsg("Image is required.");

    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("title", title);
      fd.set("slug", slug || title);
      fd.set("category", category);
      fd.set("subCategory", subCategory);
      fd.set("price", price);
      fd.set("description", description);
      fd.set("image", image);

      const res = await fetch("/api/admin/add-product", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      setMsg(`Saved ✅ ${data.product.category}/${data.product.slug}`);
      setTitle("");
      setSlug("");
      setSubCategory("");
      setPrice("");
      setDescription("");
      setImage(null);
    } catch (err: any) {
      setMsg(err?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-2xl space-y-4">
      <div>
        <label className="text-white/80 text-sm">Title</label>
        <input
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Axolotl Keychain"
        />
      </div>

      <div>
        <label className="text-white/80 text-sm">Slug (optional)</label>
        <input
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. axolotl-keychain"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-white/80 text-sm">Category</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="keychains"
          />
        </div>

        <div>
          <label className="text-white/80 text-sm">Sub-category (optional)</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            placeholder="animals"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-white/80 text-sm">Price (optional)</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="$10"
          />
        </div>

        <div>
          <label className="text-white/80 text-sm">Image</label>
          <input
            className="mt-1 w-full text-white/80"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      {previewUrl && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/60 text-sm mb-2">Preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="preview" className="max-h-64 rounded-xl" />
        </div>
      )}

      <div>
        <label className="text-white/80 text-sm">Description (optional)</label>
        <textarea
          className="mt-1 w-full min-h-[110px] rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short product description…"
        />
      </div>

      <button
        disabled={busy}
        className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-white hover:bg-white/10 disabled:opacity-60 transition"
        type="submit"
      >
        {busy ? "Saving..." : "Save product"}
      </button>

      {msg && <p className="text-white/70 text-sm">{msg}</p>}

      <p className="text-white/40 text-xs">
        This saves by committing to GitHub then Vercel redeploys.
      </p>
    </form>
  );
}
