"use client";

import { FormEvent, useEffect, useState } from "react";

type PromoType = "percent" | "fixed" | "free_shipping";

type PromoCodeRecord = {
  code: string;
  label: string;
  description: string;
  active: boolean;
  type: PromoType;
  value: number;
  minSubtotal: number;
  maxDiscount: number;
  updatedAt: string;
  createdAt: string;
};

type FormState = {
  code: string;
  label: string;
  description: string;
  active: boolean;
  type: PromoType;
  value: number;
  minSubtotal: number;
  maxDiscount: number;
};

const EMPTY_FORM: FormState = {
  code: "",
  label: "",
  description: "",
  active: true,
  type: "percent",
  value: 10,
  minSubtotal: 0,
  maxDiscount: 0,
};

export default function AdminPromoCodes() {
  const [promos, setPromos] = useState<PromoCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/promocodes", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        promos?: PromoCodeRecord[];
      };
      if (!res.ok) {
        throw new Error(data.error || "Failed to load promo codes");
      }
      setPromos(Array.isArray(data.promos) ? data.promos : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setEditingCode(null);
    setForm(EMPTY_FORM);
    setSuccess("");
    setError("");
  }

  function onEdit(promo: PromoCodeRecord) {
    setEditingCode(promo.code);
    setForm({
      code: promo.code,
      label: promo.label,
      description: promo.description,
      active: promo.active,
      type: promo.type,
      value: promo.value,
      minSubtotal: promo.minSubtotal,
      maxDiscount: promo.maxDiscount,
    });
    setSuccess("");
    setError("");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        label: form.label.trim(),
        description: form.description.trim(),
        active: form.active,
        type: form.type,
        value: Number(form.value),
        minSubtotal: Number(form.minSubtotal),
        maxDiscount: Number(form.maxDiscount),
      };

      const res = await fetch("/api/admin/promocodes", {
        method: editingCode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setSuccess(editingCode ? "Promo updated." : "Promo created.");
      await load();
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(code: string) {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/promocodes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      setPromos((prev) => prev.filter((x) => x.code !== code));
      if (editingCode === code) resetForm();
      setSuccess("Promo deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-white text-xl font-semibold">Promo Codes</h2>
          <p className="mt-1 text-sm text-white/60">
            Create, edit, disable, and remove checkout promo features.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
        >
          Refresh
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm text-white/80">
          Code*
          <input
            value={form.code}
            onChange={(e) => setForm((x) => ({ ...x, code: e.target.value.toUpperCase() }))}
            disabled={Boolean(editingCode)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64] disabled:opacity-60"
            placeholder="CD10"
            required
          />
        </label>

        <label className="text-sm text-white/80">
          Label
          <input
            value={form.label}
            onChange={(e) => setForm((x) => ({ ...x, label: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
            placeholder="10% Off"
          />
        </label>

        <label className="text-sm text-white/80">
          Type
          <select
            value={form.type}
            onChange={(e) => setForm((x) => ({ ...x, type: e.target.value as PromoType }))}
            className="mt-1 w-full rounded-xl border border-white/20 bg-[#0D0D0D]/60 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
          >
            <option value="percent">Percent Discount</option>
            <option value="fixed">Fixed Discount</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
        </label>

        <label className="text-sm text-white/80">
          Value
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.value}
            onChange={(e) => setForm((x) => ({ ...x, value: Number(e.target.value) }))}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
          />
        </label>

        <label className="text-sm text-white/80">
          Min Subtotal
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.minSubtotal}
            onChange={(e) => setForm((x) => ({ ...x, minSubtotal: Number(e.target.value) }))}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
          />
        </label>

        <label className="text-sm text-white/80">
          Max Discount
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.maxDiscount}
            onChange={(e) => setForm((x) => ({ ...x, maxDiscount: Number(e.target.value) }))}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
          />
        </label>

        <label className="text-sm text-white/80 sm:col-span-2 lg:col-span-2">
          Description
          <input
            value={form.description}
            onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
            placeholder="Explain what this promo does..."
          />
        </label>

        <label className="text-sm text-white/80 flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((x) => ({ ...x, active: e.target.checked }))}
            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#FF8B64]"
          />
          Active
        </label>

        <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 disabled:opacity-60 transition"
          >
            {saving ? "Saving..." : editingCode ? "Update Promo" : "Create Promo"}
          </button>
          {editingCode && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-300">{success}</p>}

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 text-sm text-white/60">
          {loading ? "Loading promo codes..." : `${promos.length} promo code(s)`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-white/60">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3">Rules</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white/85">
              {!loading &&
                promos.map((promo) => (
                  <tr key={promo.code} className="border-b border-white/10 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{promo.code}</div>
                      <div className="text-xs text-white/60">{promo.label || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {promo.type === "percent" && `${promo.value}% off`}
                      {promo.type === "fixed" && `$${promo.value} off`}
                      {promo.type === "free_shipping" && "Free shipping"}
                      {promo.description && (
                        <div className="text-xs text-white/60 mt-1">{promo.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      Min ${promo.minSubtotal || 0}
                      {promo.maxDiscount > 0 ? `, Max $${promo.maxDiscount}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
                          promo.active
                            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                            : "border-white/20 bg-white/5 text-white/65"
                        }`}
                      >
                        {promo.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(promo)}
                          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(promo.code)}
                          className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-100 hover:bg-red-500/20 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && promos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/60">
                    No promo codes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
