"use client";

import { useEffect, useMemo, useState } from "react";

type FilamentItem = {
  id: string;
  type: string;
  color: string;
  brand: string;
  finish: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  id: string;
  type: string;
  color: string;
  brand: string;
  finish: string;
  notes: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  id: "",
  type: "",
  color: "",
  brand: "",
  finish: "",
  notes: "",
  isActive: true,
};

function toFormState(item: FilamentItem): FormState {
  return {
    id: item.id,
    type: item.type,
    color: item.color,
    brand: item.brand,
    finish: item.finish,
    notes: item.notes,
    isActive: item.isActive,
  };
}

export default function FilamentsManager() {
  const [items, setItems] = useState<FilamentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState("");

  const isEditing = Boolean(form.id);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/filaments", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        items?: FilamentItem[];
      };
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setError("");
    setMsg("");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((x) => {
      if (statusFilter === "active" && !x.isActive) return false;
      if (statusFilter === "inactive" && x.isActive) return false;
      if (!q) return true;
      const hay = `${x.type} ${x.color} ${x.brand} ${x.finish} ${x.notes}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, statusFilter]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMsg("");
    try {
      if (!form.type.trim() && !form.color.trim()) {
        throw new Error("Type or color is required.");
      }

      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/admin/filaments", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        items?: FilamentItem[];
      };
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setItems(Array.isArray(data.items) ? data.items : []);
      setMsg(isEditing ? "Filament updated." : "Filament created.");
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string) {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/filaments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        items?: FilamentItem[];
      };
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setItems(Array.isArray(data.items) ? data.items : []);
      if (form.id === id) setForm(EMPTY_FORM);
      setMsg("Filament removed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: FilamentItem, nextValue: boolean) {
    setTogglingId(item.id);
    setError("");
    setMsg("");
    const previousItems = items;
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, isActive: nextValue } : row))
    );
    try {
      const res = await fetch("/api/admin/filaments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: nextValue }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        items?: FilamentItem[];
      };
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setItems(previousItems);
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setTogglingId("");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px,minmax(0,1fr)]">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <h2 className="text-xl font-semibold text-white">
          {isEditing ? "Edit Filament" : "Add Filament"}
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Stored in a dedicated admin filament database collection.
        </p>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-white/80">Type</label>
            <input
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              placeholder="PLA"
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
            />
          </div>
          <div>
            <label className="text-sm text-white/80">Color</label>
            <input
              value={form.color}
              onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
              placeholder="Matte Black"
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
            />
          </div>
          <div>
            <label className="text-sm text-white/80">Brand</label>
            <input
              value={form.brand}
              onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
              placeholder="Bambu / eSUN"
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
            />
          </div>
          <div>
            <label className="text-sm text-white/80">Finish</label>
            <input
              value={form.finish}
              onChange={(e) => setForm((prev) => ({ ...prev, finish: e.target.value }))}
              placeholder="Silk / Matte / Glossy"
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
            />
          </div>
          <div>
            <label className="text-sm text-white/80">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional production notes"
              className="mt-1 min-h-[90px] w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Active (available for sale)
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#FF8B64] px-4 py-2 font-medium text-black transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : isEditing ? "Save changes" : "Add filament"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-white transition hover:bg-white/10"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        {msg && <p className="mt-3 text-sm text-emerald-300">{msg}</p>}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-white">Filament Library</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr,170px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search type, color, brand, finish..."
            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="rounded-xl border border-white/20 bg-[#0D0D0D] px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10">
          <div className="border-b border-white/10 px-3 py-2 text-sm text-white/70">
            {loading ? "Loading..." : `Showing ${filtered.length} filament option(s)`}
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[680px] text-left text-sm text-white/85">
              <thead className="sticky top-0 bg-[#161616] text-white/65">
                <tr>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Color</th>
                  <th className="px-3 py-2">Brand</th>
                  <th className="px-3 py-2">Finish</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="px-3 py-5 text-center text-white/60" colSpan={6}>
                      No filament records found.
                    </td>
                  </tr>
                )}
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{item.type || "-"}</td>
                    <td className="px-3 py-2">{item.color || "-"}</td>
                    <td className="px-3 py-2">{item.brand || "-"}</td>
                    <td className="px-3 py-2">{item.finish || "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            item.isActive
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-white/15 text-white/70"
                          }`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-white/80">
                          <input
                            type="checkbox"
                            checked={item.isActive}
                            disabled={togglingId === item.id}
                            onChange={(e) => void toggleActive(item, e.target.checked)}
                            className="h-4 w-4 accent-[#FF8B64]"
                          />
                          <span>{item.isActive ? "ON" : "OFF"}</span>
                        </label>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setForm(toFormState(item))}
                          className="rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs text-white transition hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeItem(item.id)}
                          disabled={saving}
                          className="rounded-lg border border-red-300/40 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
