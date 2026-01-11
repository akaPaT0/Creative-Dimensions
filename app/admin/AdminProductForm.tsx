"use client";

import { useMemo, useState } from "react";

const categories = ["new-arrivals", "keychains", "tools", "accessories", "fanboys"] as const;
const subCategories = ["cute", "minecraft", "cars", "anime", "tools", "other"] as const;

export default function AdminProductForm() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("keychains");
  const [subCategory, setSubCategory] = useState<string>("");
  const [priceUSD, setPriceUSD] = useState<string>("2");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!id.trim()) return setMsg("ID is required (example: KECU008).");
    if (!name.trim()) return setMsg("Name is required.");
    if (!priceUSD.trim()) return setMsg("priceUSD is required.");
    if (!description.trim()) return setMsg("Description is required.");
    if (!image) return setMsg("Image is required.");

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
      fd.set("image", image);

      const res = await fetch("/api/admin/add-product", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      setMsg(`Saved ✅ ${data.product.category}/${data.product.slug}`);
      setId("");
      setName("");
      setSlug("");
      setSubCategory("");
      setPriceUSD("2");
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-white/80 text-sm">ID</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="KECU008"
          />
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

      <div>
        <label className="text-white/80 text-sm">Name</label>
        <input
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cute Crab"
        />
      </div>

      <div>
        <label className="text-white/80 text-sm">Slug (optional)</label>
        <input
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="cute-crab"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-white/80 text-sm">Category</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-2 text-white outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-white/80 text-sm">Sub-category (optional)</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-2 text-white outline-none"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
          >
            <option value="">(none)</option>
            {subCategories.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
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

      {previewUrl && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/60 text-sm mb-2">Preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="preview" className="max-h-64 rounded-xl" />
        </div>
      )}

      <div>
        <label className="text-white/80 text-sm">Description</label>
        <textarea
          className="mt-1 w-full min-h-[140px] rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write the product description..."
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
        Saves by committing image + products.ts to GitHub, then Vercel redeploys.
      </p>
    </form>
  );
}
