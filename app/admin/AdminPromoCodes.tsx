"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState, Field, Switch, ui } from "./ui";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";

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
    if (!window.confirm(`Delete promo code ${code}? Customers won't be able to use it.`)) return;
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

  const describe = (promo: PromoCodeRecord) =>
    promo.type === "percent"
      ? `${promo.value}% off`
      : promo.type === "fixed"
        ? `$${promo.value} off`
        : "Free delivery";

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Codes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">
            {loading ? "Loading codes…" : `${promos.length} ${promos.length === 1 ? "code" : "codes"} · ${promos.filter((p) => p.active).length} active`}
          </p>
          <button type="button" onClick={() => void load()} className={ui.btnSm} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {error && <p className={ui.error}>{error}</p>}
        {success && <p className={ui.success}>{success}</p>}

        <div className={`${ui.panel} overflow-hidden`}>
          {!loading && promos.length === 0 && (
            <EmptyState title="No promo codes yet" hint="Create your first one with the form." />
          )}
          {loading && (
            <div className="divide-y divide-white/[0.06]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-white/[0.02]" />
              ))}
            </div>
          )}
          {!loading && promos.length > 0 && (
            <ul className="divide-y divide-white/[0.06]">
              {promos.map((promo) => {
                const isEditing = editingCode === promo.code;
                return (
                  <li
                    key={promo.code}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5 ${isEditing ? "bg-[#FF8B64]/[0.05]" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-dashed border-white/20 px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-white">
                          {promo.code}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${promo.active ? "text-emerald-300" : "text-white/35"}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${promo.active ? "bg-emerald-400" : "bg-white/30"}`} />
                          {promo.active ? "Active" : "Off"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-[#FF8B64]">
                        {describe(promo)}
                        {promo.label && <span className="ml-2 font-normal text-white/50">{promo.label}</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-white/40">
                        {promo.minSubtotal ? `Orders over $${promo.minSubtotal}` : "Any order"}
                        {promo.maxDiscount > 0 ? ` · up to $${promo.maxDiscount}` : ""}
                        {promo.description ? ` · ${promo.description}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => onEdit(promo)} className={ui.btnSm}>
                        <Pencil size={13} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(promo.code)}
                        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg text-white/35 transition hover:bg-red-500/10 hover:text-red-300"
                        aria-label={`Delete ${promo.code}`}
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
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className={`${ui.panelPad} space-y-4 lg:sticky lg:top-6`}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{editingCode ? `Edit ${editingCode}` : "New code"}</h2>
          {editingCode && (
            <button type="button" onClick={resetForm} className="text-xs font-semibold text-white/50 hover:text-white">
              Cancel
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Code">
            <input
              value={form.code}
              onChange={(e) => setForm((x) => ({ ...x, code: e.target.value.toUpperCase() }))}
              disabled={Boolean(editingCode)}
              className={`${ui.input} font-mono uppercase tracking-wider`}
              placeholder="CD10"
              required
            />
          </Field>
          <Field label="Label">
            <input
              value={form.label}
              onChange={(e) => setForm((x) => ({ ...x, label: e.target.value }))}
              className={ui.input}
              placeholder="10% off"
            />
          </Field>
        </div>

        <Field label="Discount">
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-[#0f0f11] p-1">
            {(
              [
                ["percent", "Percent"],
                ["fixed", "Amount"],
                ["free_shipping", "Free delivery"],
              ] as [PromoType, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((x) => ({ ...x, type: value }))}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                  form.type === value ? "bg-[#FF8B64] text-[#0D0D0D]" : "text-white/55 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label={form.type === "percent" ? "Value %" : "Value $"}>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.value}
              disabled={form.type === "free_shipping"}
              onChange={(e) => setForm((x) => ({ ...x, value: Number(e.target.value) }))}
              className={ui.input}
            />
          </Field>
          <Field label="Min order $">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.minSubtotal}
              onChange={(e) => setForm((x) => ({ ...x, minSubtotal: Number(e.target.value) }))}
              className={ui.input}
            />
          </Field>
          <Field label="Max off $">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.maxDiscount}
              onChange={(e) => setForm((x) => ({ ...x, maxDiscount: Number(e.target.value) }))}
              className={ui.input}
            />
          </Field>
        </div>

        <Field label="Note" hint="Shown to you only.">
          <input
            value={form.description}
            onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))}
            className={ui.input}
            placeholder="What this code is for"
          />
        </Field>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <Switch
            checked={form.active}
            onChange={(v) => setForm((x) => ({ ...x, active: v }))}
            label="Active"
          />
          <button type="submit" disabled={saving} className={ui.btnPrimary}>
            {saving ? "Saving…" : editingCode ? "Save changes" : "Create code"}
          </button>
        </div>
      </form>
    </div>
  );
}
