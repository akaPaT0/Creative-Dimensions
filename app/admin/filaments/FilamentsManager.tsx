"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState, Field, FilterChips, Switch, ui } from "../ui";
import { Pencil, RefreshCw, Search, Trash2 } from "lucide-react";

type FilamentItem = {
  id: string;
  type: string;
  color: string;
  hex: string;
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
  hex: string;
  brand: string;
  finish: string;
  notes: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  id: "",
  type: "",
  color: "",
  hex: "",
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
    hex: item.hex,
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
      const hay = `${x.type} ${x.color} ${x.hex} ${x.brand} ${x.finish} ${x.notes}`.toLowerCase();
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
    if (!window.confirm("Delete this filament?")) return;
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
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Library */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search type, colour, brand or finish"
              className={`${ui.input} pl-10`}
            />
          </div>
          <button type="button" onClick={() => void load()} className={ui.btn} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </button>
        </div>

        <FilterChips
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All", count: items.length },
            { value: "active", label: "In stock", count: items.filter((x) => x.isActive).length },
            { value: "inactive", label: "Off", count: items.filter((x) => !x.isActive).length },
          ]}
        />

        <div className={`${ui.panel} overflow-hidden`}>
          {loading && (
            <div className="divide-y divide-white/[0.06]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-white/[0.02]" />
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && <EmptyState title="No filaments found" hint="Add one with the form." />}
          {!loading && filtered.length > 0 && (
            <ul className="divide-y divide-white/[0.06]">
              {filtered.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 ${form.id === item.id ? "bg-[#FF8B64]/[0.05]" : ""} ${item.isActive ? "" : "opacity-60"}`}
                >
                  <span
                    className="h-10 w-10 shrink-0 rounded-full border border-white/15 shadow-inner"
                    style={{ backgroundColor: item.hex || "transparent" }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.color || "Unnamed colour"} <span className="font-normal text-white/45">· {item.type || "–"}</span>
                    </p>
                    <p className="truncate text-xs text-white/40">
                      {[item.brand, item.finish, item.hex].filter(Boolean).join(" · ") || "No details"}
                    </p>
                  </div>
                  <Switch
                    checked={item.isActive}
                    disabled={togglingId === item.id}
                    onChange={(v) => void toggleActive(item, v)}
                    label=""
                    srLabel={`${item.color || "Filament"} in stock`}
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setForm(toFormState(item))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white"
                      aria-label={`Edit ${item.color}`}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeItem(item.id)}
                      disabled={saving}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                      aria-label={`Delete ${item.color}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className={`${ui.panelPad} space-y-4 lg:sticky lg:top-6`}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{isEditing ? "Edit filament" : "New filament"}</h2>
          {isEditing && (
            <button type="button" onClick={resetForm} className="text-xs font-semibold text-white/50 hover:text-white">
              Cancel
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <input
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              placeholder="PLA"
              className={ui.input}
            />
          </Field>
          <Field label="Colour">
            <input
              value={form.color}
              onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
              placeholder="Matte Black"
              className={ui.input}
            />
          </Field>
        </div>

        <Field label="Swatch colour">
          <div className="flex gap-2">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(form.hex) ? form.hex : "#ff8b64"}
              onChange={(e) => setForm((prev) => ({ ...prev, hex: e.target.value }))}
              className="h-[42px] w-12 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-[#0f0f11] p-1"
              aria-label="Pick swatch colour"
            />
            <input
              value={form.hex}
              onChange={(e) => setForm((prev) => ({ ...prev, hex: e.target.value }))}
              placeholder="#ff8b64"
              className={`${ui.input} font-mono`}
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <input
              value={form.brand}
              onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
              placeholder="Bambu"
              className={ui.input}
            />
          </Field>
          <Field label="Finish">
            <input
              value={form.finish}
              onChange={(e) => setForm((prev) => ({ ...prev, finish: e.target.value }))}
              placeholder="Silk / Matte"
              className={ui.input}
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional production notes"
            className={`min-h-[80px] ${ui.input}`}
          />
        </Field>

        {msg && <p className={ui.success}>{msg}</p>}
        {error && <p className={ui.error}>{error}</p>}

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <Switch
            checked={form.isActive}
            onChange={(v) => setForm((prev) => ({ ...prev, isActive: v }))}
            label="In stock"
          />
          <button type="submit" disabled={saving} className={ui.btnPrimary}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Add filament"}
          </button>
        </div>
      </form>
    </div>
  );
}
