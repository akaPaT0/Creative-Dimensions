"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { Product } from "@/app/data/products";
import type { Material, Mesh } from "three";
import { Color, Object3D } from "three";

type CustomizeConfig = NonNullable<Product["customizeColors"]>;

type Props = {
  open: boolean;
  onClose: () => void;
  productName: string;
  config: CustomizeConfig;
  selectedHexes: string[];
  onChangeHexes: (next: string[]) => void;
  onReset: () => void;
  onSave: () => void;
};

type SlotInfo = {
  key: string;
  materialName: string;
};

type SlotBucket = {
  slot: SlotInfo;
  materials: Material[];
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const COLOR_OPTIONS = [
  "#000000",
  "#1f2937",
  "#374151",
  "#6b7280",
  "#9ca3af",
  "#d1d5db",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function toHex(input: string) {
  const s = input.trim();
  if (!s) return "#ffffff";
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  return "#ffffff";
}

function hasColor(material: Material) {
  return "color" in material;
}

function detectSlotBuckets(scene: Object3D) {
  const map = new Map<string, SlotBucket>();
  const unnamedMap = new Map<string, string>();
  let unnamedCount = 0;

  scene.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (!material) return;
      const named = material.name?.trim();
      const key = named || material.uuid;
      let bucket = map.get(key);
      if (!bucket) {
        if (!named) {
          unnamedCount += 1;
          unnamedMap.set(key, `Material ${unnamedCount}`);
        }
        bucket = {
          slot: {
            key,
            materialName: named || unnamedMap.get(key) || `Material ${unnamedCount || 1}`,
          },
          materials: [],
        };
        map.set(key, bucket);
      }
      bucket.materials.push(material);
    });
  });

  return Array.from(map.values());
}

function ModelPreview({
  modelUrl,
  selectedHexes,
  onSlotsDetected,
}: {
  modelUrl: string;
  selectedHexes: string[];
  onSlotsDetected: (slots: SlotInfo[]) => void;
}) {
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const buckets = useMemo(() => detectSlotBuckets(scene), [scene]);

  useEffect(() => {
    onSlotsDetected(buckets.map((x) => x.slot));
  }, [buckets, onSlotsDetected]);

  useEffect(() => {
    buckets.forEach((bucket, index) => {
      const hex = toHex(selectedHexes[index] || "#ffffff");
      bucket.materials.forEach((material) => {
        if (!hasColor(material)) return;
        const anyMaterial = material as Material & { color: Color };
        anyMaterial.color.set(hex);
        anyMaterial.needsUpdate = true;
      });
    });
  }, [buckets, selectedHexes]);

  return <primitive object={scene} scale={1.2} />;
}

export default function CustomizeColorsModal(props: Props) {
  const { open, onClose, productName, config, selectedHexes, onChangeHexes, onReset, onSave } =
    props;
  const [mounted, setMounted] = useState(false);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [modelReady, setModelReady] = useState(false);
  const [checkingModel, setCheckingModel] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setCheckingModel(true);
    setModelReady(false);
    fetch(config.modelUrl, { method: "HEAD", cache: "no-store" })
      .then((res) => {
        if (!alive) return;
        setModelReady(res.ok);
      })
      .catch(() => {
        if (!alive) return;
        setModelReady(false);
      })
      .finally(() => {
        if (!alive) return;
        setCheckingModel(false);
      });
    return () => {
      alive = false;
    };
  }, [config.modelUrl, open]);

  const palette = useMemo(() => {
    const merged = [...COLOR_OPTIONS, ...config.defaultHexes, ...selectedHexes]
      .map((x) => toHex(x))
      .filter(Boolean);
    return [...new Set(merged)];
  }, [config.defaultHexes, selectedHexes]);

  function updateSlot(index: number, hex: string) {
    const next = [...selectedHexes];
    next[index] = toHex(hex);
    onChangeHexes(next);
  }

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Customize colors"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
              aria-label="Close customize colors modal"
            />

            <div
              className="relative z-[10000] w-full sm:max-w-5xl rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0D0D0D]/80 backdrop-blur-xl backdrop-saturate-150 p-5 sm:p-6 text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-semibold text-lg">Customize Colors</div>
                  <div className="text-white/60 text-sm">{productName}</div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 transition"
                >
                  X
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr,1fr]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 text-white/75 text-sm">3D Preview</div>
                  <div className="h-[300px] sm:h-[380px] w-full rounded-xl overflow-hidden border border-white/10 bg-black/25">
                    {checkingModel ? (
                      <div className="h-full w-full flex items-center justify-center text-white/60 text-sm">
                        Loading model...
                      </div>
                    ) : modelReady ? (
                      <Canvas camera={{ position: [0, 0.6, 2.4], fov: 45 }}>
                        <ambientLight intensity={0.8} />
                        <directionalLight position={[3, 3, 3]} intensity={1.1} />
                        <directionalLight position={[-2, 1, -2]} intensity={0.35} />
                        <Suspense fallback={null}>
                          <ModelPreview
                            modelUrl={config.modelUrl}
                            selectedHexes={selectedHexes}
                            onSlotsDetected={setSlots}
                          />
                        </Suspense>
                        <OrbitControls enablePan={false} />
                      </Canvas>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center px-4 text-center text-white/60 text-sm">
                        Model not found at <code className="mx-1">{config.modelUrl}</code>.
                        Add the GLB file and reopen this modal.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white font-medium">Color Slots</div>
                  <p className="mt-1 text-xs text-white/55">
                    Slots are detected from the model materials automatically.
                  </p>

                  <div className="mt-4 space-y-3 max-h-[300px] overflow-auto pr-1">
                    {slots.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60">
                        No material slots detected yet.
                      </div>
                    ) : (
                      slots.map((slot, index) => {
                        const letter = LETTERS[index] || `${index + 1}`;
                        const label = config.slotLabels?.[index] || slot.materialName || `Slot ${letter}`;
                        const value = toHex(
                          selectedHexes[index] || config.defaultHexes[index] || "#ffffff"
                        );
                        return (
                          <label key={slot.key} className="block">
                            <div className="mb-1 text-sm text-white/80">Slot {letter}: {label}</div>
                            <div className="flex items-center gap-2">
                              <select
                                value={value}
                                onChange={(e) => updateSlot(index, e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-[#FF8B64]"
                              >
                                {palette.map((hex) => (
                                  <option key={hex} value={hex}>
                                    {hex.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                              <span
                                className="h-8 w-8 rounded-lg border border-white/15"
                                style={{ backgroundColor: value }}
                                title={value}
                              />
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={onReset}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/85 hover:bg-white/10 transition"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={onSave}
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-white/95 hover:bg-white/15 transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return <>{modal}</>;
}
