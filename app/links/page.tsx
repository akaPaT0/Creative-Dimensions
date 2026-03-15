"use client";

import { useMemo, useState } from "react";
import Background from "@/app/components/Background";
import LinkCard from "@/app/components/LinkCard";
import { savedLinks } from "@/app/data/links";

type SortOption = "name-asc" | "name-desc" | "category-asc";

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export default function LinksPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(savedLinks.map((link) => link.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return ["All", ...unique];
  }, []);

  const filteredLinks = useMemo(() => {
    const q = normalizeText(search);

    let items = savedLinks.filter((link) => {
      const matchesCategory =
        selectedCategory === "All" || link.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!q) return true;

      const haystack = [
        link.title,
        link.description,
        link.category,
        ...(link.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });

    items = [...items].sort((a, b) => {
      if (sortBy === "name-desc") {
        return b.title.localeCompare(a.title);
      }

      if (sortBy === "category-asc") {
        const categoryCompare = a.category.localeCompare(b.category);
        if (categoryCompare !== 0) return categoryCompare;
        return a.title.localeCompare(b.title);
      }

      return a.title.localeCompare(b.title);
    });

    return items;
  }, [search, selectedCategory, sortBy]);

  return (
    <main className="relative min-h-screen text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-16 sm:pt-20">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-white/50">
            Saved Links
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            My Useful Links
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65 sm:text-base">
            Search by name, category, or tags like 3D, CAD, design, and more.
          </p>
        </div>

        <div className="mb-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">
              Search
            </label>
            <input
              type="text"
              placeholder="Search links, categories, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.07]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">
              Sort
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="category-asc">Category A–Z</option>
            </select>
          </div>
        </div>

        <div className="mb-6 text-sm text-white/45">
          {filteredLinks.length} link{filteredLinks.length === 1 ? "" : "s"} found
        </div>

        {filteredLinks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60 backdrop-blur-md">
            No matching links found.
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {filteredLinks.map((link) => (
              <div key={link.url} className="mb-5 break-inside-avoid">
                <LinkCard
                  title={link.title}
                  description={link.description}
                  url={link.url}
                  category={link.category}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}