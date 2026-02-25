"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import Background from "@/app/components/Background";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ModelPreview from "@/components/custom-quote/ModelPreview";
import { QUOTE_CONFIG, type QualityPreset } from "@/app/lib/quoteConfig";

type UnitOption = "mm" | "cm" | "inch";
type FileFormat = "stl" | "3mf";
type Axis = "x" | "y" | "z";

type AxisScale = { x: number; y: number; z: number };
type BoundsMm = { x: number; y: number; z: number };

type GeometryStats = {
  boundsMm: BoundsMm;
  volumeMm3: number;
  triangleCount: number;
  longestSideMm: number;
};

type QuoteResult = {
  grams: number;
  hours: number;
  materialCost: number;
  timeCost: number;
  colorFee: number;
  subtotal: number;
  finalPrice: number;
  effectiveSolidFraction: number;
  supportRiskMultiplier: number;
};

const UNIT_TO_MM: Record<UnitOption, number> = {
  mm: 1,
  cm: 10,
  inch: 25.4,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function roundNearestHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function toFileFormat(fileName: string): FileFormat | null {
  const lower = fileName.trim().toLowerCase();
  if (lower.endsWith(".stl")) return "stl";
  if (lower.endsWith(".3mf")) return "3mf";
  return null;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parsePossible3mfUnit(root: Object3D): UnitOption | null {
  const candidates = [
    root.userData?.unit,
    root.userData?.units,
    root.userData?.modelUnit,
    root.userData?.metadata?.unit,
  ];
  for (const item of candidates) {
    const raw = typeof item === "string" ? item.trim().toLowerCase() : "";
    if (!raw) continue;
    if (raw === "mm" || raw === "millimeter" || raw === "millimeters") return "mm";
    if (raw === "cm" || raw === "centimeter" || raw === "centimeters") return "cm";
    if (raw === "in" || raw === "inch" || raw === "inches") return "inch";
  }
  return null;
}

function countTriangles(root: Object3D) {
  let total = 0;
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry;
    if (!geometry) return;
    if (geometry.index) {
      total += Math.floor(geometry.index.count / 3);
      return;
    }
    const pos = geometry.attributes?.position;
    if (!pos) return;
    total += Math.floor(pos.count / 3);
  });
  return total;
}

function analyzeGeometry(root: Object3D, scale: AxisScale, unitToMm: number): GeometryStats {
  const scaled = root.clone(true);
  scaled.scale.set(
    unitToMm * scale.x,
    unitToMm * scale.y,
    unitToMm * scale.z
  );
  scaled.updateMatrixWorld(true);

  const bboxMin = new Vector3(Infinity, Infinity, Infinity);
  const bboxMax = new Vector3(-Infinity, -Infinity, -Infinity);
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const ab = new Vector3();
  const ac = new Vector3();
  let signedVolume = 0;
  let triangleCount = 0;

  scaled.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const geometry = mesh.geometry;
    const position = geometry.attributes?.position;
    if (!position) return;

    const readTri = (ia: number, ib: number, ic: number) => {
      a.fromBufferAttribute(position, ia).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(position, ib).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(position, ic).applyMatrix4(mesh.matrixWorld);

      bboxMin.min(a).min(b).min(c);
      bboxMax.max(a).max(b).max(c);

      ab.subVectors(b, a);
      ac.subVectors(c, a);
      signedVolume += a.dot(ab.cross(ac)) / 6;
      triangleCount += 1;
    };

    if (geometry.index) {
      const index = geometry.index;
      for (let i = 0; i < index.count; i += 3) {
        readTri(index.getX(i), index.getX(i + 1), index.getX(i + 2));
      }
      return;
    }

    for (let i = 0; i < position.count; i += 3) {
      readTri(i, i + 1, i + 2);
    }
  });

  if (!Number.isFinite(bboxMin.x) || !Number.isFinite(bboxMax.x)) {
    return {
      boundsMm: { x: 0, y: 0, z: 0 },
      volumeMm3: 0,
      triangleCount: 0,
      longestSideMm: 0,
    };
  }

  const boundsMm = {
    x: Math.max(0, bboxMax.x - bboxMin.x),
    y: Math.max(0, bboxMax.y - bboxMin.y),
    z: Math.max(0, bboxMax.z - bboxMin.z),
  };

  return {
    boundsMm,
    volumeMm3: Math.abs(signedVolume),
    triangleCount,
    longestSideMm: Math.max(boundsMm.x, boundsMm.y, boundsMm.z),
  };
}

function estimateQuote(
  stats: GeometryStats,
  preset: QualityPreset,
  infillPct: number,
  colors: number
): QuoteResult {
  const material = QUOTE_CONFIG.material;
  const presetCfg = QUOTE_CONFIG.presets[preset];
  const h = QUOTE_CONFIG.heuristics;
  const p = QUOTE_CONFIG.pricing;

  const volumeCm3 = stats.volumeMm3 / 1000;
  const effectiveSolidFraction = clamp(
    presetCfg.baseShellFraction + h.infillFractionMultiplier * (infillPct / 100),
    h.minSolidFraction,
    h.maxSolidFraction
  );

  const grams = volumeCm3 * material.densityGPerCm3 * effectiveSolidFraction;
  const complexityPenalty = clamp(
    stats.triangleCount / h.trianglePenaltyDivisor,
    0,
    h.maxComplexityPenaltyHours
  );

  const baseHours =
    volumeCm3 / presetCfg.flowRateCm3PerHour +
    stats.boundsMm.z / h.zPenaltyMmPerHour +
    complexityPenalty;

  let supportRisk = 0;
  if (
    stats.boundsMm.z >= h.supportRiskThresholds.veryTallHeightMm &&
    volumeCm3 <= h.supportRiskThresholds.veryLowVolumeCm3
  ) {
    supportRisk = h.supportRiskThresholds.veryTallRiskAdd;
  } else if (
    stats.boundsMm.z >= h.supportRiskThresholds.tallHeightMm &&
    volumeCm3 <= h.supportRiskThresholds.lowVolumeCm3
  ) {
    supportRisk = h.supportRiskThresholds.tallRiskAdd;
  }

  const hours = baseHours * (1 + supportRisk);
  const materialCost = grams * material.plaPerGram;
  const timeCost = hours * (p.electricityPerHour + p.machineWearPerHour);
  const colorFee = Math.max(0, colors - 1) * p.colorFeePerExtra;
  const subtotal = p.baseFee + materialCost + timeCost + colorFee;
  const finalPrice = roundNearestHalf(subtotal * p.profitMultiplier);

  return {
    grams: round2(grams),
    hours: Math.round(hours * 1000) / 1000,
    materialCost: round2(materialCost),
    timeCost: round2(timeCost),
    colorFee: round2(colorFee),
    subtotal: round2(subtotal),
    finalPrice: round2(finalPrice),
    effectiveSolidFraction: Math.round(effectiveSolidFraction * 1000) / 1000,
    supportRiskMultiplier: Math.round((1 + supportRisk) * 1000) / 1000,
  };
}

export default function CustomQuotePage() {
  const [source, setSource] = useState<Object3D | null>(null);
  const [format, setFormat] = useState<FileFormat | null>(null);
  const [error, setError] = useState("");
  const [unitInterpretation, setUnitInterpretation] = useState<UnitOption>("mm");
  const [has3mfUnitMetadata, setHas3mfUnitMetadata] = useState(false);
  const [scale, setScale] = useState<AxisScale>({ x: 1, y: 1, z: 1 });
  const [lockAspect, setLockAspect] = useState(true);
  const [sizeConfirmed, setSizeConfirmed] = useState(false);

  const [preset, setPreset] = useState<QualityPreset>("standard");
  const [infill, setInfill] = useState(20);
  const [colors, setColors] = useState(1);
  const [result, setResult] = useState<QuoteResult | null>(null);

  const unitFactor = UNIT_TO_MM[unitInterpretation];
  const scaleVec: [number, number, number] = [
    unitFactor * scale.x,
    unitFactor * scale.y,
    unitFactor * scale.z,
  ];

  const geometryStats = useMemo(() => {
    if (!source) return null;
    return analyzeGeometry(source, scale, unitFactor);
  }, [scale, source, unitFactor]);

  const fitsPrinter = useMemo(() => {
    if (!geometryStats) return false;
    const b = QUOTE_CONFIG.printer.buildVolumeMm;
    return (
      geometryStats.boundsMm.x <= b.x &&
      geometryStats.boundsMm.y <= b.y &&
      geometryStats.boundsMm.z <= b.z
    );
  }, [geometryStats]);

  function clearEstimateAndUnconfirm() {
    setResult(null);
    setSizeConfirmed(false);
  }

  async function handleFile(file: File) {
    setError("");
    setResult(null);
    setSource(null);
    setFormat(null);
    setSizeConfirmed(false);
    setScale({ x: 1, y: 1, z: 1 });
    setHas3mfUnitMetadata(false);

    const parsedFormat = toFileFormat(file.name);
    if (!parsedFormat) {
      setError("Invalid file type. Please upload STL or 3MF.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      if (parsedFormat === "stl") {
        const geometry = new STLLoader().parse(arrayBuffer);
        geometry.computeVertexNormals();
        const mesh = new Mesh(
          geometry,
          new MeshStandardMaterial({ color: "#c7ced8", roughness: 0.7, metalness: 0.05 })
        );
        const root = new Group();
        root.add(mesh);
        if (countTriangles(root) > QUOTE_CONFIG.heuristics.maxTriangles) {
          setError("Mesh is too heavy for instant quote. Please simplify and retry.");
          return;
        }
        setUnitInterpretation("mm");
        setFormat("stl");
        setSource(root);
        setSizeConfirmed(false);
        return;
      }

      const loader = new ThreeMFLoader();
      const root = loader.parse(arrayBuffer);
      if (countTriangles(root) > QUOTE_CONFIG.heuristics.maxTriangles) {
        setError("Mesh is too heavy for instant quote. Please simplify and retry.");
        return;
      }
      const detectedUnit = parsePossible3mfUnit(root);
      setHas3mfUnitMetadata(Boolean(detectedUnit));
      if (detectedUnit) {
        setUnitInterpretation(detectedUnit);
        setSizeConfirmed(true);
      } else {
        setUnitInterpretation("mm");
        setSizeConfirmed(false);
      }
      setFormat("3mf");
      setSource(root);
    } catch {
      setError("Could not parse this file. Ensure it is a valid STL or 3MF.");
    }
  }

  function applyLongestSide(targetMm: number) {
    if (!geometryStats || targetMm <= 0 || !Number.isFinite(targetMm)) return;
    if (geometryStats.longestSideMm <= 0) return;
    const ratio = targetMm / geometryStats.longestSideMm;
    setScale((prev) => ({
      x: prev.x * ratio,
      y: prev.y * ratio,
      z: prev.z * ratio,
    }));
    clearEstimateAndUnconfirm();
  }

  function setAxisTarget(axis: Axis, targetMm: number) {
    if (!geometryStats || targetMm <= 0 || !Number.isFinite(targetMm)) return;
    const current = geometryStats.boundsMm[axis];
    if (current <= 0) return;
    const ratio = targetMm / current;
    setScale((prev) => {
      if (lockAspect) {
        return { x: prev.x * ratio, y: prev.y * ratio, z: prev.z * ratio };
      }
      return { ...prev, [axis]: prev[axis] * ratio };
    });
    clearEstimateAndUnconfirm();
  }

  function fitToPrinter() {
    if (!geometryStats) return;
    const b = QUOTE_CONFIG.printer.buildVolumeMm;
    const xRatio = b.x / Math.max(geometryStats.boundsMm.x, 1e-6);
    const yRatio = b.y / Math.max(geometryStats.boundsMm.y, 1e-6);
    const zRatio = b.z / Math.max(geometryStats.boundsMm.z, 1e-6);
    const ratio = Math.min(xRatio, yRatio, zRatio, 1);
    if (ratio >= 1) return;
    setScale((prev) => ({ x: prev.x * ratio, y: prev.y * ratio, z: prev.z * ratio }));
    clearEstimateAndUnconfirm();
  }

  function handleGetPrice() {
    if (!geometryStats || !source || !sizeConfirmed) return;
    setResult(estimateQuote(geometryStats, preset, infill, colors));
  }

  const getPriceDisabled = !source || !geometryStats || !sizeConfirmed;
  const wallCount = QUOTE_CONFIG.presets[preset].wallCount;

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-[1250px] px-6 lg:px-8 pt-24 pb-16 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Instant Quote</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Custom 3D Print Quote</h1>
            <p className="mt-2 text-white/70">
              Upload STL/3MF, confirm dimensions, then get an instant estimate.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10 transition"
          >
            <ChevronLeft size={16} strokeWidth={2.25} />
            Back
          </Link>
        </div>

        <div className="mt-6 lg:hidden grid gap-4">
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-3.5">
            <h2 className="text-lg font-semibold">Model + Settings</h2>

            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <label className="block">
                <span className="text-sm text-white/80">Upload STL or 3MF</span>
                <input
                  type="file"
                  accept=".stl,.3mf"
                  className="mt-2 w-full text-sm text-white/90 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-white/15"
                  onChange={(e) => {
                    const next = e.target.files?.[0];
                    if (next) void handleFile(next);
                  }}
                />
              </label>
            </div>

            {error ? (
              <div className="mt-3 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {format === "stl" ? (
              <div className="mt-3 rounded-xl border border-amber-300/35 bg-amber-400/10 p-3 text-sm text-amber-100">
                STL files don&apos;t store units. Confirm size before pricing.
              </div>
            ) : null}

            <div className="mt-3">
              <ModelPreview source={source} scaleVec={scaleVec} />
            </div>

            <div className="mt-3 grid gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-medium text-white/90">Dimensions (mm)</div>
                <div className="mt-2 text-sm text-white/75 space-y-1">
                  <div>X: {geometryStats ? geometryStats.boundsMm.x.toFixed(2) : "-"}</div>
                  <div>Y: {geometryStats ? geometryStats.boundsMm.y.toFixed(2) : "-"}</div>
                  <div>Z: {geometryStats ? geometryStats.boundsMm.z.toFixed(2) : "-"}</div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {fitsPrinter ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-300" />
                      <span className="text-emerald-200">Fits printer</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} className="text-amber-300" />
                      <span className="text-amber-200">Exceeds build volume</span>
                    </>
                  )}
                </div>
                <div className="mt-1 text-xs text-white/55">
                  Build volume: {QUOTE_CONFIG.printer.buildVolumeMm.x} x{" "}
                  {QUOTE_CONFIG.printer.buildVolumeMm.y} x{" "}
                  {QUOTE_CONFIG.printer.buildVolumeMm.z} mm
                </div>
                <button
                  type="button"
                  onClick={fitToPrinter}
                  disabled={!geometryStats || fitsPrinter}
                  className="mt-3 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10 transition disabled:opacity-50"
                >
                  Fit to printer
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-medium text-white/90">Scale / Units</div>
                <label className="mt-2 block text-xs text-white/70">
                  Treat model units as
                  <select
                    value={unitInterpretation}
                    onChange={(e) => {
                      setUnitInterpretation(e.target.value as UnitOption);
                      clearEstimateAndUnconfirm();
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#111111] px-2 py-2 text-sm text-white"
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="inch">inches</option>
                  </select>
                </label>
                {format === "3mf" && has3mfUnitMetadata ? (
                  <p className="mt-1 text-[11px] text-emerald-200/80">
                    3MF unit metadata detected.
                  </p>
                ) : null}

                <label className="mt-3 block text-xs text-white/70">
                  Set longest side to (mm)
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 120"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const value = Number((e.target as HTMLInputElement).value);
                      applyLongestSide(value);
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#111111] px-2 py-2 text-sm text-white"
                  />
                </label>
                <p className="mt-1 text-[11px] text-white/50">Press Enter to apply</p>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    id="lock-aspect-mobile"
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => setLockAspect(e.target.checked)}
                  />
                  <label htmlFor="lock-aspect-mobile" className="text-xs text-white/75">
                    Lock aspect ratio
                  </label>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["x", "y", "z"] as Axis[]).map((axis) => (
                    <input
                      key={`mobile-${axis}`}
                      type="number"
                      min={1}
                      placeholder={axis.toUpperCase()}
                      onBlur={(e) => {
                        const value = Number(e.target.value);
                        if (value > 0) setAxisTarget(axis, value);
                      }}
                      className="rounded-lg border border-white/15 bg-[#111111] px-2 py-2 text-xs text-white"
                    />
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-white/50">Set target X/Y/Z (mm), then blur</p>

                <button
                  type="button"
                  onClick={() => setSizeConfirmed(true)}
                  disabled={!source}
                  className="mt-3 w-full rounded-lg border border-white/15 bg-[#FF8B64] px-3 py-2 text-xs font-medium text-black disabled:opacity-50"
                >
                  Confirm size
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3">
              <label className="block">
                <span className="text-sm text-white/80">Material</span>
                <input
                  value="PLA"
                  disabled
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white/90"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white/80">Quality preset</span>
                <select
                  value={preset}
                  onChange={(e) => {
                    setPreset(e.target.value as QualityPreset);
                    setResult(null);
                  }}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white/90"
                >
                  <option value="draft">Draft</option>
                  <option value="standard">Standard</option>
                  <option value="fine">Fine</option>
                </select>
                <p className="mt-1 text-[11px] text-white/55">
                  Walls: {wallCount} (derived from preset)
                </p>
              </label>
              <label className="block">
                <span className="text-sm text-white/80">Infill %</span>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={infill}
                  onChange={(e) => {
                    setInfill(clamp(Number(e.target.value) || 0, 0, 60));
                    setResult(null);
                  }}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white/90"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white/80">Colors</span>
                <select
                  value={colors}
                  onChange={(e) => {
                    setColors(clamp(Number(e.target.value) || 1, 1, 4));
                    setResult(null);
                  }}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white/90"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={handleGetPrice}
              disabled={getPriceDisabled}
              className="mt-4 w-full rounded-xl border border-white/15 bg-[#FF8B64] px-5 py-3 font-medium text-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Price
            </button>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-3.5">
            <h2 className="text-lg font-semibold">Estimate</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between text-white/80">
                <span>Estimated grams</span>
                <span>{result ? `${result.grams.toFixed(2)} g` : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Estimated hours</span>
                <span>{result ? `${result.hours.toFixed(2)} h` : "-"}</span>
              </div>
            </div>

            <div className="my-4 h-px bg-white/10" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-white/75">
                <span>Material cost</span>
                <span>{result ? formatMoney(result.materialCost) : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-white/75">
                <span>Time cost</span>
                <span>{result ? formatMoney(result.timeCost) : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-white/75">
                <span>Color fee</span>
                <span>{result ? formatMoney(result.colorFee) : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-white/75">
                <span>Subtotal</span>
                <span>{result ? formatMoney(result.subtotal) : "-"}</span>
              </div>
            </div>

            <div className="my-4 h-px bg-white/10" />

            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Final Price</span>
              <span className="text-2xl font-semibold text-white">
                {result ? formatMoney(result.finalPrice) : "-"}
              </span>
            </div>

            <p className="mt-3 text-xs text-white/55">Final price confirmed after review</p>
          </aside>
        </div>

        <div className="mt-6 hidden lg:grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-5">
            <h2 className="text-xl font-semibold">Model + Settings</h2>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <label className="block">
                <span className="text-sm text-white/80">Upload STL or 3MF</span>
                <input
                  type="file"
                  accept=".stl,.3mf"
                  className="mt-2 w-full text-sm text-white/90 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-white/15"
                  onChange={(e) => {
                    const next = e.target.files?.[0];
                    if (next) void handleFile(next);
                  }}
                />
              </label>
            </div>

            {error ? (
              <div className="mt-3 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {format === "stl" ? (
              <div className="mt-3 rounded-xl border border-amber-300/35 bg-amber-400/10 p-3 text-sm text-amber-100">
                STL files don&apos;t store units. Confirm size before pricing.
              </div>
            ) : null}

            <div className="mt-4">
              <ModelPreview source={source} scaleVec={scaleVec} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-medium text-white/90">Dimensions (mm)</div>
                <div className="mt-2 text-sm text-white/75 space-y-1">
                  <div>X: {geometryStats ? geometryStats.boundsMm.x.toFixed(2) : "-"}</div>
                  <div>Y: {geometryStats ? geometryStats.boundsMm.y.toFixed(2) : "-"}</div>
                  <div>Z: {geometryStats ? geometryStats.boundsMm.z.toFixed(2) : "-"}</div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {fitsPrinter ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-300" />
                      <span className="text-emerald-200">Fits printer</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} className="text-amber-300" />
                      <span className="text-amber-200">Exceeds build volume</span>
                    </>
                  )}
                </div>
                <div className="mt-1 text-xs text-white/55">
                  Build volume: {QUOTE_CONFIG.printer.buildVolumeMm.x} x{" "}
                  {QUOTE_CONFIG.printer.buildVolumeMm.y} x{" "}
                  {QUOTE_CONFIG.printer.buildVolumeMm.z} mm
                </div>
                <button
                  type="button"
                  onClick={fitToPrinter}
                  disabled={!geometryStats || fitsPrinter}
                  className="mt-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10 transition disabled:opacity-50"
                >
                  Fit to printer
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-medium text-white/90">Scale / Units</div>
                <label className="mt-2 block text-xs text-white/70">
                  Treat model units as
                  <select
                    value={unitInterpretation}
                    onChange={(e) => {
                      setUnitInterpretation(e.target.value as UnitOption);
                      clearEstimateAndUnconfirm();
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#111111] px-2 py-2 text-sm text-white"
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="inch">inches</option>
                  </select>
                </label>
                {format === "3mf" && has3mfUnitMetadata ? (
                  <p className="mt-1 text-[11px] text-emerald-200/80">
                    3MF unit metadata detected.
                  </p>
                ) : null}

                <label className="mt-3 block text-xs text-white/70">
                  Set longest side to (mm)
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 120"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const value = Number((e.target as HTMLInputElement).value);
                      applyLongestSide(value);
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#111111] px-2 py-2 text-sm text-white"
                  />
                </label>
                <p className="mt-1 text-[11px] text-white/50">Press Enter to apply</p>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    id="lock-aspect-desktop"
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => setLockAspect(e.target.checked)}
                  />
                  <label htmlFor="lock-aspect-desktop" className="text-xs text-white/75">
                    Lock aspect ratio
                  </label>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["x", "y", "z"] as Axis[]).map((axis) => (
                    <input
                      key={axis}
                      type="number"
                      min={1}
                      placeholder={axis.toUpperCase()}
                      onBlur={(e) => {
                        const value = Number(e.target.value);
                        if (value > 0) setAxisTarget(axis, value);
                      }}
                      className="rounded-lg border border-white/15 bg-[#111111] px-2 py-2 text-xs text-white"
                    />
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-white/50">Set target X/Y/Z (mm), then blur</p>

                <button
                  type="button"
                  onClick={() => setSizeConfirmed(true)}
                  disabled={!source}
                  className="mt-3 rounded-lg border border-white/15 bg-[#FF8B64] px-3 py-2 text-xs font-medium text-black disabled:opacity-50"
                >
                  Confirm size
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-white/80">Material</span>
                <input
                  value="PLA"
                  disabled
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white/90"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white/80">Quality preset</span>
                <select
                  value={preset}
                  onChange={(e) => {
                    setPreset(e.target.value as QualityPreset);
                    setResult(null);
                  }}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white/90"
                >
                  <option value="draft">Draft</option>
                  <option value="standard">Standard</option>
                  <option value="fine">Fine</option>
                </select>
                <p className="mt-1 text-[11px] text-white/55">
                  Walls: {wallCount} (derived from preset)
                </p>
              </label>
              <label className="block">
                <span className="text-sm text-white/80">Infill %</span>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={infill}
                  onChange={(e) => {
                    setInfill(clamp(Number(e.target.value) || 0, 0, 60));
                    setResult(null);
                  }}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white/90"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white/80">Colors</span>
                <select
                  value={colors}
                  onChange={(e) => {
                    setColors(clamp(Number(e.target.value) || 1, 1, 4));
                    setResult(null);
                  }}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white/90"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={handleGetPrice}
              disabled={getPriceDisabled}
              className="mt-5 rounded-xl border border-white/15 bg-[#FF8B64] px-5 py-3 font-medium text-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Price
            </button>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-5">
            <h2 className="text-xl font-semibold">Estimate</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-white/80">
                <span>Estimated grams</span>
                <span>{result ? `${result.grams.toFixed(2)} g` : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Estimated hours</span>
                <span>{result ? `${result.hours.toFixed(2)} h` : "-"}</span>
              </div>
            </div>

            <div className="my-4 h-px bg-white/10" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-white/75">
                <span>Material cost</span>
                <span>{result ? formatMoney(result.materialCost) : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-white/75">
                <span>Time cost</span>
                <span>{result ? formatMoney(result.timeCost) : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-white/75">
                <span>Color fee</span>
                <span>{result ? formatMoney(result.colorFee) : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-white/75">
                <span>Subtotal</span>
                <span>{result ? formatMoney(result.subtotal) : "-"}</span>
              </div>
            </div>

            <div className="my-4 h-px bg-white/10" />

            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Final Price</span>
              <span className="text-2xl font-semibold text-white">
                {result ? formatMoney(result.finalPrice) : "-"}
              </span>
            </div>

            <p className="mt-3 text-xs text-white/55">Final price confirmed after review</p>
          </aside>
        </div>

        <Footer />
      </main>
    </div>
  );
}
