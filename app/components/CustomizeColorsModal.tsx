"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import type { Product } from "@/app/data/products";
import type { Material, Mesh } from "three";
import { Box3, Color, Object3D, Vector3 } from "three";

type CustomizeConfig = NonNullable<Product["customizeColors"]>;
type FilamentOption = {
  id: string;
  type: string;
  color: string;
  hex: string;
  brand: string;
  finish: string;
  label: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  productName: string;
  config: CustomizeConfig;
  selectedFilamentIds: string[];
  onChangeFilamentIds: (next: string[]) => void;
  filamentOptions: FilamentOption[];
  onSlotsChange?: (slots: SlotInfo[]) => void;
  onReset: () => void;
  onAddToCart: () => void;
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
  selectedColors,
  defaultHexes,
  onSlotsDetected,
}: {
  modelUrl: string;
  selectedColors: string[];
  defaultHexes: string[];
  onSlotsDetected: (slots: SlotInfo[]) => void;
}) {
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const buckets = useMemo(() => detectSlotBuckets(scene), [scene]);
  const fit = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const scale = 1.6 / maxDim;
    return { center, scale };
  }, [scene]);

  useEffect(() => {
    onSlotsDetected(buckets.map((x) => x.slot));
  }, [buckets, onSlotsDetected]);

  useEffect(() => {
    buckets.forEach((bucket, index) => {
      const raw = selectedColors[index] || defaultHexes[index] || "";
      if (!raw) return;
      bucket.materials.forEach((material) => {
        if (!hasColor(material)) return;
        const anyMaterial = material as Material & { color: Color };
        try {
          anyMaterial.color.set(raw);
        } catch {
          anyMaterial.color.set(toHex(raw));
        }
        anyMaterial.needsUpdate = true;
      });
    });
  }, [buckets, selectedColors, defaultHexes]);

  return (
    <group scale={fit.scale} position={[-fit.center.x * fit.scale, -fit.center.y * fit.scale, -fit.center.z * fit.scale]}>
      <primitive object={scene} />
    </group>
  );
}

export default function CustomizeColorsModal(props: Props) {
  const {
    open,
    onClose,
    productName,
    config,
    selectedFilamentIds,
    onChangeFilamentIds,
    filamentOptions,
    onSlotsChange,
    onReset,
    onAddToCart,
  } =
    props;
  const [mounted, setMounted] = useState(false);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [modelReady, setModelReady] = useState(false);
  const [checkingModel, setCheckingModel] = useState(false);
  const [modelVersion, setModelVersion] = useState(0);
  const modelUrlWithVersion = useMemo(() => {
    const sep = config.modelUrl.includes("?") ? "&" : "?";
    return `${config.modelUrl}${sep}v=${modelVersion}`;
  }, [config.modelUrl, modelVersion]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setModelVersion(Date.now());
  }, [open]);

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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setCheckingModel(true);
    setModelReady(false);
    fetch(modelUrlWithVersion, { method: "HEAD", cache: "no-store" })
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
  }, [modelUrlWithVersion, open]);

  useEffect(() => {
    onSlotsChange?.(slots);
  }, [slots, onSlotsChange]);

  const selectedColors = useMemo(
    () =>
      slots.map((_, index) => {
        const option = filamentOptions.find((x) => x.id === selectedFilamentIds[index]);
        return option?.hex || option?.color || "";
      }),
    [filamentOptions, selectedFilamentIds, slots]
  );

  function updateSlot(index: number, optionId: string) {
    const next = [...selectedFilamentIds];
    next[index] = optionId;
    onChangeFilamentIds(next);
  }

  const modal =
    open && mounted
        ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4"
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
              className="relative z-[10000] w-full sm:max-w-5xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0D0D0D]/80 backdrop-blur-xl backdrop-saturate-150 p-5 sm:p-6 text-white shadow-2xl"
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
                  <div className="h-[300px] sm:h-[380px] w-full rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0D0D0D] via-[#111111] to-[#12100B]">
                    {checkingModel ? (
                      <div className="h-full w-full flex items-center justify-center text-white/60 text-sm">
                        Loading model...
                      </div>
                    ) : modelReady ? (
                      <Canvas camera={{ position: [0, 0, 3.6], fov: 45 }} gl={{ alpha: true }}>
                        <hemisphereLight intensity={0.18} color="#e5e7eb" groundColor="#101010" />
                        <ambientLight intensity={0.12} />
                        <directionalLight position={[4, 5, 4]} intensity={0.42} />
                        <directionalLight position={[-2.5, 2, -3.5]} intensity={0.12} />
                        <Environment preset="apartment" />
                        <Suspense fallback={null}>
                          <ModelPreview
                            modelUrl={modelUrlWithVersion}
                            selectedColors={selectedColors}
                            defaultHexes={config.defaultHexes}
                            onSlotsDetected={setSlots}
                          />
                        </Suspense>
                        <OrbitControls enablePan={false} minDistance={1.8} maxDistance={8} target={[0, 0, 0]} />
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
                        const selectedId = selectedFilamentIds[index] || "";
                        const selectedColor =
                          filamentOptions.find((x) => x.id === selectedId)?.hex ||
                          filamentOptions.find((x) => x.id === selectedId)?.color ||
                          "";
                        const swatch = selectedColor || config.defaultHexes[index] || "#ffffff";
                        return (
                          <label key={slot.key} className="block">
                            <div className="mb-1 text-sm text-white/80">Slot {letter}: {label}</div>
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedId}
                                onChange={(e) => updateSlot(index, e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-[#FF8B64]"
                              >
                                {filamentOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <span
                                className="h-8 w-8 rounded-lg border border-white/15"
                                style={{ backgroundColor: swatch }}
                                title={selectedColor || "Default"}
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
                      onClick={onAddToCart}
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-white/95 hover:bg-white/15 transition"
                    >
                      Add to cart
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
