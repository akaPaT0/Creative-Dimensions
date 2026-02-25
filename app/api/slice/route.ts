import { NextResponse } from "next/server";

type SlicePreset = "draft" | "standard" | "fine";
type SliceRequest = {
  fileUrl: string;
  material?: "PLA";
  preset: SlicePreset;
  infill: number;
  colors: number;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function isPreset(value: unknown): value is SlicePreset {
  return value === "draft" || value === "standard" || value === "fine";
}

function parseBody(raw: unknown): SliceRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const fileUrl = typeof row.fileUrl === "string" ? row.fileUrl.trim() : "";
  const preset = row.preset;
  const infill = typeof row.infill === "number" ? row.infill : NaN;
  const colors = typeof row.colors === "number" ? row.colors : NaN;
  const material = row.material === "PLA" ? "PLA" : undefined;
  if (!fileUrl || !isPreset(preset)) return null;
  if (!Number.isFinite(infill) || infill < 0 || infill > 100) return null;
  if (!Number.isInteger(colors) || colors < 1 || colors > 4) return null;
  return {
    fileUrl,
    material,
    preset,
    infill,
    colors,
  };
}

function normalizeHours(payload: Record<string, unknown>) {
  const grams = typeof payload.grams === "number" ? payload.grams : NaN;
  const seconds = typeof payload.seconds === "number" ? payload.seconds : NaN;
  const minutes = typeof payload.minutes === "number" ? payload.minutes : NaN;
  if (!Number.isFinite(grams) || grams <= 0) return null;

  if (Number.isFinite(seconds) && seconds > 0) {
    return { grams, hours: seconds / 3600 };
  }
  if (Number.isFinite(minutes) && minutes > 0) {
    return { grams, hours: minutes / 60 };
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const workerUrl = process.env.SLICER_WORKER_URL?.trim() || "";
    if (!workerUrl) return json({ error: "Missing SLICER_WORKER_URL." }, 500);

    const bodyRaw = (await req.json().catch(() => null)) as unknown;
    const body = parseBody(bodyRaw);
    if (!body) return json({ error: "Invalid payload." }, 400);

    let parsedFileUrl: URL;
    try {
      parsedFileUrl = new URL(body.fileUrl);
    } catch {
      return json({ error: "Invalid fileUrl." }, 400);
    }

    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileUrl: parsedFileUrl.toString(),
        material: "PLA",
        preset: body.preset,
        infill: body.infill,
        colors: body.colors,
      }),
      cache: "no-store",
    });

    const payload = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      const message =
        payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).error === "string"
          ? ((payload as Record<string, unknown>).error as string)
          : `Slicer worker returned ${res.status}.`;
      return json({ error: message }, 502);
    }

    if (!payload || typeof payload !== "object") {
      return json({ error: "Invalid slicer response." }, 502);
    }

    const normalized = normalizeHours(payload as Record<string, unknown>);
    if (!normalized) {
      return json({ error: "Slicer response missing valid grams/minutes/seconds." }, 502);
    }

    const grams = Math.round(normalized.grams * 100) / 100;
    const hours = Math.round(normalized.hours * 1000) / 1000;
    return json({ ok: true, grams, hours });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to slice model.";
    return json({ error: message }, 500);
  }
}
