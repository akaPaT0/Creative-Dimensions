"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Background from "@/app/components/Background";
import ColorPicker from "@/components/customize/ColorPicker";
import CustomizableProductGrid from "@/components/customize/CustomizableProductGrid";
import ModelViewer3D from "@/components/customize/ModelViewer3D";
import type { CustomizableProduct, FilamentOption, MaterialSlot } from "@/types/customize";

type ProductApiRow = {
  id?: string;
  name?: string;
  description?: string;
  customizeColors?: {
    modelUrl?: string;
    defaultHexes?: string[];
  };
};

type StoredCartItem = {
  productId: string;
  quantity: number;
  customization?: {
    summary: string;
    slots: Array<{
      slot: string;
      label: string;
      filamentId: string;
      filamentLabel: string;
      colorValue: string;
    }>;
  };
};

const STORAGE_KEY = "cd_cart_v1";
const CART_UPDATED_EVENT = "cd-cart-updated";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toFilamentColors(hexes: string[] | undefined) {
  const valid =
    Array.isArray(hexes)
      ? hexes
          .map((hex) => (typeof hex === "string" ? hex.trim() : ""))
          .filter((hex) => /^#([0-9a-fA-F]{6})$/.test(hex))
      : [];
  if (!valid.length) {
    return [
      { name: "White", hex: "#f5f5f5" },
      { name: "Black", hex: "#1e1e1e" },
    ];
  }
  return valid.map((hex, index) => ({ name: `Color ${index + 1}`, hex }));
}

function cleanHex(value: unknown) {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  const normalized = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : "";
}

function getModelUrl(product: CustomizableProduct) {
  return product.model3dUrl || product.model3d?.url || "";
}

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function pickBestFilamentId(slotLabel: string, options: FilamentOption[]) {
  const slotTokens = tokenize(slotLabel);
  if (!slotTokens.length || !options.length) return options[0]?.id || "";
  let best = options[0]?.id || "";
  let bestScore = -1;

  for (const option of options) {
    const text = `${option.label} ${option.color} ${option.type} ${option.brand} ${option.finish}`;
    const optionTokens = tokenize(text);
    const tokenSet = new Set(optionTokens);
    let score = 0;
    for (const token of slotTokens) {
      if (tokenSet.has(token)) {
        score += 4;
      } else if (optionTokens.some((word) => word.includes(token) || token.includes(word))) {
        score += 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = option.id;
    }
  }

  return best;
}

function pickFilamentByHex(hex: string, options: FilamentOption[]) {
  if (!hex) return "";
  const target = cleanHex(hex);
  if (!target) return "";
  const exact = options.find((x) => cleanHex(x.hex) === target);
  return exact?.id || "";
}

function parseStoredCart(raw: unknown): StoredCartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: StoredCartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const productId = typeof row.productId === "string" ? row.productId : "";
    const quantity =
      typeof row.quantity === "number" && Number.isFinite(row.quantity)
        ? Math.max(1, Math.floor(row.quantity))
        : 1;
    if (!productId) continue;
    const customizationRaw =
      row.customization && typeof row.customization === "object"
        ? (row.customization as Record<string, unknown>)
        : null;
    const slots = Array.isArray(customizationRaw?.slots)
      ? customizationRaw.slots
          .map((slot) => {
            if (!slot || typeof slot !== "object") return null;
            const s = slot as Record<string, unknown>;
            const filamentId = typeof s.filamentId === "string" ? s.filamentId : "";
            if (!filamentId) return null;
            return {
              slot: typeof s.slot === "string" ? s.slot : "",
              label: typeof s.label === "string" ? s.label : "",
              filamentId,
              filamentLabel: typeof s.filamentLabel === "string" ? s.filamentLabel : "",
              colorValue: typeof s.colorValue === "string" ? s.colorValue : "",
            };
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
      : [];
    const summary = typeof customizationRaw?.summary === "string" ? customizationRaw.summary : "";
    out.push({
      productId,
      quantity,
      customization: slots.length ? { summary, slots } : undefined,
    });
  }
  return out;
}

function buildFingerprint(item: StoredCartItem) {
  return JSON.stringify({
    productId: item.productId,
    slots: (item.customization?.slots || []).map((x) => ({ slot: x.slot, filamentId: x.filamentId })),
  });
}

export default function CustomizeModelsPage() {
  const [products, setProducts] = useState<CustomizableProduct[]>([]);
  const [filamentOptions, setFilamentOptions] = useState<FilamentOption[]>([]);
  const [slots, setSlots] = useState<MaterialSlot[]>([]);
  const [selectedFilamentIds, setSelectedFilamentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        setLoadError("");
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as {
          products?: ProductApiRow[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "Failed to load products.");
        }

        const mapped = Array.isArray(data.products)
          ? data.products
              .map((row): CustomizableProduct | null => {
                const id = typeof row.id === "string" ? row.id : "";
                const name = typeof row.name === "string" ? row.name : "";
                const description =
                  typeof row.description === "string" ? row.description : "";
                const modelUrl =
                  typeof row.customizeColors?.modelUrl === "string"
                    ? row.customizeColors.modelUrl.trim()
                    : "";
                if (!id || !name || !modelUrl) return null;
                return {
                  id,
                  name,
                  description,
                  model3dUrl: modelUrl,
                  defaultHexes: row.customizeColors?.defaultHexes || [],
                  filamentColors: toFilamentColors(row.customizeColors?.defaultHexes),
                };
              })
              .filter((x): x is CustomizableProduct => Boolean(x))
          : [];

        const filamentsRes = await fetch("/api/filaments", { cache: "no-store" });
        const filamentsData = (await filamentsRes.json().catch(() => ({}))) as {
          items?: Array<{
            id?: string;
            type?: string;
            color?: string;
            hex?: string;
            brand?: string;
            finish?: string;
          }>;
          error?: string;
        };
        if (!filamentsRes.ok) {
          throw new Error(filamentsData.error || "Failed to load active filaments.");
        }

        const mappedFilaments = Array.isArray(filamentsData.items)
          ? filamentsData.items
              .map((x): FilamentOption | null => {
                const id = typeof x.id === "string" ? x.id : "";
                const color = typeof x.color === "string" ? x.color.trim() : "";
                if (!id || !color) return null;
                const type = typeof x.type === "string" ? x.type.trim() : "";
                const brand = typeof x.brand === "string" ? x.brand.trim() : "";
                const finish = typeof x.finish === "string" ? x.finish.trim() : "";
                const hex = cleanHex(x.hex);
                const label = [color, type, brand, finish].filter(Boolean).join(" ");
                return { id, type, color, hex, brand, finish, label: label || color };
              })
              .filter((x): x is FilamentOption => Boolean(x))
          : [];

        if (!cancelled) setProducts(mapped);
        if (!cancelled) setFilamentOptions(mappedFilaments);
      } catch (error) {
        if (!cancelled) {
          setProducts([]);
          setFilamentOptions([]);
          setLoadError(error instanceof Error ? error.message : "Failed to load products.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const productsWithModel = useMemo(
    () => products.filter((p) => Boolean(getModelUrl(p))),
    [products]
  );

  const [selectedProductId, setSelectedProductId] = useState(
    productsWithModel[0]?.id || ""
  );
  useEffect(() => {
    if (!productsWithModel.length) {
      setSelectedProductId("");
      return;
    }
    if (!productsWithModel.some((p) => p.id === selectedProductId)) {
      setSelectedProductId(productsWithModel[0].id);
    }
  }, [productsWithModel, selectedProductId]);

  const selectedProduct =
    productsWithModel.find((p) => p.id === selectedProductId) || productsWithModel[0];
  useEffect(() => {
    setSlots([]);
    setSelectedFilamentIds([]);
  }, [selectedProductId]);

  useEffect(() => {
    if (!selectedProduct || !filamentOptions.length || !slots.length) return;
    setSelectedFilamentIds((prev) => {
      const fallbackId = filamentOptions[0]?.id || "";
      const next = slots.map((slot, index) => {
        if (prev[index] && filamentOptions.some((f) => f.id === prev[index])) return prev[index];
        const byDefaultHex = pickFilamentByHex(selectedProduct.defaultHexes?.[index] || "", filamentOptions);
        if (byDefaultHex) return byDefaultHex;
        const byLabel = pickBestFilamentId(slot.label, filamentOptions);
        return byLabel || fallbackId;
      });
      const same = next.length === prev.length && next.every((x, i) => x === prev[i]);
      return same ? prev : next;
    });
  }, [filamentOptions, selectedProduct, slots]);

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <Navbar />
        <main className="relative z-10 mx-auto max-w-[1480px] px-6 lg:px-8 pt-24 pb-16">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6 text-white/80">
            Loading products...
          </div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <Navbar />
        <main className="relative z-10 mx-auto max-w-[1480px] px-6 lg:px-8 pt-24 pb-16">
          <div className="rounded-2xl border border-red-300/30 bg-red-400/10 backdrop-blur-xl backdrop-saturate-150 p-6 text-red-100">
            {loadError}
          </div>
        </main>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <Navbar />
        <main className="relative z-10 mx-auto max-w-[1480px] px-6 lg:px-8 pt-24 pb-16">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6 text-white/80">
            No products with 3D model URLs were found.
          </div>
        </main>
      </div>
    );
  }

  const modelUrl = getModelUrl(selectedProduct);
  const selectedColors = slots.map((_, index) => {
    const filament = filamentOptions.find((x) => x.id === selectedFilamentIds[index]);
    return filament?.hex || filament?.color || selectedProduct.defaultHexes?.[index] || "";
  });
  const canAddToCart =
    slots.length > 0 &&
    slots.every((_, index) => Boolean(selectedFilamentIds[index])) &&
    selectedFilamentIds.every((id) => filamentOptions.some((x) => x.id === id));

  function handleAddToCart() {
    if (typeof window === "undefined" || !canAddToCart) return;
    setAdding(true);
    try {
      const selectedSlots = slots
        .map((slot, index) => {
          const option = filamentOptions.find((x) => x.id === selectedFilamentIds[index]);
          if (!option) return null;
          const slotLetter = LETTERS[index] || String(index + 1);
          return {
            slot: slotLetter,
            label: slot.label || `Slot ${slotLetter}`,
            filamentId: option.id,
            filamentLabel: option.label,
            colorValue: option.hex || option.color,
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x));

      const summary = selectedSlots.length
        ? `Custom colors (${selectedSlots.map((x) => `${x.slot}:${x.colorValue}`).join(", ")})`
        : "";

      const newItem: StoredCartItem = {
        productId: selectedProduct.id,
        quantity: 1,
        customization: selectedSlots.length ? { summary, slots: selectedSlots } : undefined,
      };

      let current: StoredCartItem[] = [];
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        current = raw ? parseStoredCart(JSON.parse(raw)) : [];
      } catch {
        current = [];
      }

      const fingerprint = buildFingerprint(newItem);
      const idx = current.findIndex((x) => buildFingerprint(x) === fingerprint);
      if (idx >= 0) {
        current[idx] = { ...current[idx], quantity: current[idx].quantity + 1 };
      } else {
        current.push(newItem);
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));

      setAdded(true);
      window.setTimeout(() => setAdded(false), 1200);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-[1480px] px-6 lg:px-8 pt-24 pb-16 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Studio</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-white">
              Customize Models
            </h1>
            <p className="mt-2 text-white/70 max-w-2xl">
              Assign active filament colors per detected model material slot and preview the result.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10 transition"
          >
            <ChevronLeft size={16} strokeWidth={2.25} />
            <span className="lg:hidden">Back</span>
            <span className="hidden lg:inline">Back to Shop</span>
          </Link>
        </div>

        <div className="mt-6 lg:hidden grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-3.5">
            <CustomizableProductGrid
              products={productsWithModel}
              selectedId={selectedProduct.id}
              onSelect={(id) => {
                setSelectedProductId(id);
              }}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white truncate">{selectedProduct.name}</h2>
              <div className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                {slots.length} slot{slots.length === 1 ? "" : "s"}
              </div>
            </div>
            <ModelViewer3D
              modelUrl={modelUrl}
              selectedColors={selectedColors}
              defaultHexes={selectedProduct.defaultHexes || []}
              onSlotsDetected={setSlots}
              heightClassName="h-[300px]"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-3.5">
            <ColorPicker
              slots={slots}
              selectedFilamentIds={selectedFilamentIds}
              filamentOptions={filamentOptions}
              defaultHexes={selectedProduct.defaultHexes || []}
              onSelectSlotFilament={(index, id) => {
                setSelectedFilamentIds((prev) => {
                  const next = [...prev];
                  next[index] = id;
                  return next;
                });
              }}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-3.5">
            <p className="mb-2 text-xs text-white/60">
              Your selected filament slots will be saved as a custom cart item.
            </p>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart || adding}
              className="w-full rounded-xl border border-white/15 bg-[#FF8B64] px-4 py-3 text-sm font-medium text-black hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Adding..." : added ? "Added to cart" : "Add to cart"}
            </button>
          </div>
        </div>

        <div className="mt-6 hidden lg:grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-4 sm:p-5">
            <CustomizableProductGrid
              products={productsWithModel}
              selectedId={selectedProduct.id}
              onSelect={(id) => {
                setSelectedProductId(id);
              }}
            />
          </aside>

          <section className="grid gap-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Preview</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{selectedProduct.name}</h2>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                  {slots.length} slot{slots.length === 1 ? "" : "s"} detected
                </div>
              </div>
              <ModelViewer3D
                modelUrl={modelUrl}
                selectedColors={selectedColors}
                defaultHexes={selectedProduct.defaultHexes || []}
                onSlotsDetected={setSlots}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-4 sm:p-5">
              <ColorPicker
                slots={slots}
                selectedFilamentIds={selectedFilamentIds}
                filamentOptions={filamentOptions}
                defaultHexes={selectedProduct.defaultHexes || []}
                onSelectSlotFilament={(index, id) => {
                  setSelectedFilamentIds((prev) => {
                    const next = [...prev];
                    next[index] = id;
                    return next;
                  });
                }}
              />
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/55">
                  Your selected filament slots will be saved as a custom cart item.
                </p>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart || adding}
                  className="rounded-xl border border-white/15 bg-[#FF8B64] px-4 py-2.5 text-sm font-medium text-black hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding ? "Adding..." : added ? "Added to cart" : "Add to cart"}
                </button>
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </main>
    </div>
  );
}
