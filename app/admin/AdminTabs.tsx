"use client";

import { useState } from "react";
import AdminProductForm from "./AdminProductForm";
import AdminProductsManager from "./AdminProductsManager";
import AdminInsights from "./AdminInsights";

type TabKey = "create" | "catalog" | "insights";

export default function AdminTabs() {
  const [tab, setTab] = useState<TabKey>("create");

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setTab("create")}
          className={`rounded-xl px-4 py-2 text-sm transition ${
            tab === "create"
              ? "bg-[#FF8B64] text-black"
              : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          Create Product
        </button>
        <button
          type="button"
          onClick={() => setTab("catalog")}
          className={`rounded-xl px-4 py-2 text-sm transition ${
            tab === "catalog"
              ? "bg-[#FF8B64] text-black"
              : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          Catalog Manager
        </button>
        <button
          type="button"
          onClick={() => setTab("insights")}
          className={`rounded-xl px-4 py-2 text-sm transition ${
            tab === "insights"
              ? "bg-[#FF8B64] text-black"
              : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          User Insights
        </button>
      </div>

      <div className="mt-5">
        {tab === "create" && <AdminProductForm />}
        {tab === "catalog" && <AdminProductsManager />}
        {tab === "insights" && <AdminInsights />}
      </div>
    </section>
  );
}
