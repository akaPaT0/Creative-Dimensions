import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { getProducts } from "@/app/lib/products-db";
import { telegramNotify, telegramSendDocument, telegramSendPhoto } from "@/app/lib/telegram";
import { generateInvoicePdf } from "@/app/lib/invoicePdf";
import { uploadPublicAsset } from "@/app/lib/supabase/storage";
import {
  PROMO_CODES_KEY,
  applyPromoRule,
  normalizePromoCode,
  normalizePromoRecords,
  withPromoDefaults,
} from "@/app/lib/promocodes";
import { requireSupabaseUser } from "@/app/lib/supabase/auth-server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

type OrderRequestItem = {
  productId: string;
  quantity: number;
  previewImageUrl?: string;
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

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type OrderRecord = {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  createdAt: string;
  shippingUSD: number;
  subtotalUSD: number;
  discountUSD: number;
  totalUSD: number;
  promoCode?: string;
  invoice: {
    invoiceNumber: string;
    issuedAt: string;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
  };
  trackingHistory: Array<{
    status: string;
    at: string;
    note?: string;
  }>;
  address: Address;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPriceUSD: number;
    lineTotalUSD: number;
    previewImageUrl?: string;
    customizationSummary?: string;
    customizationSlots?: Array<{
      slot: string;
      label: string;
      filamentId: string;
      filamentLabel: string;
      colorValue: string;
    }>;
  }>;
};

// ─── Supabase row ↔ OrderRecord helpers ────────────────────────────────────

function rowToOrder(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row.id ?? ""),
    orderNumber: String(row.order_number ?? ""),
    userId: String(row.user_id ?? ""),
    status: String(row.status ?? "pending"),
    createdAt: String(row.created_at ?? ""),
    shippingUSD: Number(row.shipping_usd ?? 0),
    subtotalUSD: Number(row.subtotal_usd ?? 0),
    discountUSD: Number(row.discount_usd ?? 0),
    totalUSD: Number(row.total_usd ?? 0),
    promoCode: row.promo_code ? String(row.promo_code) : undefined,
    invoice: (row.invoice as OrderRecord["invoice"]) ?? {
      invoiceNumber: "",
      issuedAt: "",
      paymentStatus: "pending",
    },
    trackingHistory: Array.isArray(row.tracking_history) ? row.tracking_history : [],
    address: (row.address as Address) ?? ({} as Address),
    items: Array.isArray(row.items) ? row.items : [],
  };
}

function orderToRow(order: OrderRecord, userId: string) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    user_id: userId,
    status: order.status,
    created_at: order.createdAt,
    shipping_usd: order.shippingUSD,
    subtotal_usd: order.subtotalUSD,
    discount_usd: order.discountUSD,
    total_usd: order.totalUSD,
    promo_code: order.promoCode ?? null,
    invoice: order.invoice,
    tracking_history: order.trackingHistory,
    address: order.address,
    items: order.items,
  };
}

// ─── KV counter helpers (with local-dev fallback) ──────────────────────────

function orderCounterKey() {
  return "orders:counter";
}

function invoiceCounterKey() {
  return "invoices:counter";
}

/** Race a promise against a hard timeout so a dead KV doesn't stall the API */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`KV timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function generateOrderNumber() {
  try {
    const next = await withTimeout(kv.incr(orderCounterKey()), 2500);
    const padded = String(next).padStart(7, "0");
    return `CD-${padded}`;
  } catch {
    // KV unavailable or timed out — fall back to base-36 timestamp
    const ts = Date.now().toString(36).toUpperCase().slice(-7).padStart(7, "0");
    return `CD-${ts}`;
  }
}

async function generateInvoiceNumber() {
  try {
    const next = await withTimeout(kv.incr(invoiceCounterKey()), 2500);
    const padded = String(next).padStart(7, "0");
    return `INV-${padded}`;
  } catch {
    const ts = (Date.now() + 1).toString(36).toUpperCase().slice(-7).padStart(7, "0");
    return `INV-${ts}`;
  }
}

// ─── Misc helpers ───────────────────────────────────────────────────────────

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asPositiveInt(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function normalizeItems(raw: unknown): OrderRequestItem[] {
  if (!Array.isArray(raw)) return [];
  const out: OrderRequestItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const productId = asText(row.productId);
    const quantity = asPositiveInt(row.quantity);
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
            const filamentId = asText(s.filamentId);
            if (!filamentId) return null;
            return {
              slot: asText(s.slot),
              label: asText(s.label),
              filamentId,
              filamentLabel: asText(s.filamentLabel),
              colorValue: asText(s.colorValue),
            };
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
      : [];
    const summary = asText(customizationRaw?.summary);
    out.push({
      productId,
      quantity,
      previewImageUrl: asText(row.previewImageUrl) || undefined,
      customization: slots.length ? { summary, slots } : undefined,
    });
  }
  return out;
}

function normalizeAddresses(raw: unknown): Address[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      id: asText(x.id),
      label: asText(x.label),
      fullName: asText(x.fullName),
      phone: asText(x.phone),
      line1: asText(x.line1),
      line2: asText(x.line2),
      city: asText(x.city),
      state: asText(x.state),
      postalCode: asText(x.postalCode),
      country: asText(x.country),
      isDefault: x.isDefault === true,
      createdAt: asText(x.createdAt),
      updatedAt: asText(x.updatedAt),
    }))
    .filter((x) => x.id && x.fullName && x.line1 && x.city);
}

function fmtMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function getProductPreviewImage(product: { images?: string[]; image?: string }) {
  if (Array.isArray(product.images) && product.images.length > 0) return String(product.images[0] || "");
  if (typeof product.image === "string") return product.image;
  return "";
}

function parseDataImageUrl(raw: string) {
  const value = raw.trim();
  const match = value.match(/^data:(image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const base64 = match[2];
  let ext = "png";
  if (mime === "image/jpeg") ext = "jpg";
  if (mime === "image/webp") ext = "webp";
  try {
    const bytes = Buffer.from(base64, "base64");
    if (!bytes.length) return null;
    return { bytes, mime, ext };
  } catch {
    return null;
  }
}

async function persistCustomPreviewImage(params: {
  rawUrl?: string;
  orderNumber: string;
  itemIndex: number;
}) {
  const raw = asText(params.rawUrl);
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const parsed = parseDataImageUrl(raw);
  if (!parsed) return "";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pathname = `order-previews/${params.orderNumber}-${params.itemIndex + 1}-${unique}.${parsed.ext}`;
  const url = await uploadPublicAsset({
    path: pathname,
    bytes: parsed.bytes,
    contentType: parsed.mime,
  });
  return url;
}

async function notifyOrderTelegram(params: {
  userId: string;
  customerEmail: string;
  order: OrderRecord;
}) {
  const { userId, customerEmail, order } = params;
  const customerName = order.address.fullName || "Customer";

  const lines = [
    `New order placed: ${order.orderNumber}`,
    `Invoice: ${order.invoice.invoiceNumber}`,
    `Date: ${fmtDate(order.createdAt)}`,
    `Customer: ${customerName}`,
    `Email: ${customerEmail || "N/A"}`,
    `Phone: ${order.address.phone || "N/A"}`,
    `Address: ${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}, ${order.address.city}${order.address.state ? `, ${order.address.state}` : ""}${order.address.postalCode ? ` ${order.address.postalCode}` : ""}, ${order.address.country}`,
    `Items: ${order.items.length}`,
    ...order.items.map(
      (item) =>
        `- ${item.name} x${item.quantity} (${fmtMoney(item.unitPriceUSD)}) = ${fmtMoney(item.lineTotalUSD)}${item.customizationSummary ? ` | ${item.customizationSummary}` : ""}`
    ),
    `Subtotal: ${fmtMoney(order.subtotalUSD)}`,
    `Discount: -${fmtMoney(order.discountUSD)}`,
    `Shipping: ${fmtMoney(order.shippingUSD)}`,
    `Total: ${fmtMoney(order.totalUSD)}`,
    `Promo: ${order.promoCode || "None"}`,
    `Status: ${order.status}`,
    `Payment: ${order.invoice.paymentStatus}`,
    `User ID: ${userId}`,
    `Order ID: ${order.id}`,
  ];

  await telegramNotify(lines.join("\n"));

  const customizedItems = order.items.filter(
    (item) => item.customizationSummary && item.previewImageUrl
  );
  for (const item of customizedItems) {
    try {
      await telegramSendPhoto({
        photoUrl: item.previewImageUrl || "",
        caption: [
          `Custom item preview`,
          `Order: ${order.orderNumber}`,
          `Item: ${item.name} x${item.quantity}`,
          `Colors: ${item.customizationSummary}`,
        ].join("\n"),
      });
    } catch {
      // continue sending remaining attachments and invoice
    }
  }

  const pdfBytes = generateInvoicePdf({
    invoiceNumber: order.invoice.invoiceNumber,
    orderNumber: order.orderNumber,
    issuedAt: order.invoice.issuedAt || order.createdAt,
    orderStatus: order.status,
    paymentStatus: order.invoice.paymentStatus,
    customerName,
    customerEmail: customerEmail || undefined,
    customerPhone: order.address.phone || undefined,
    addressLines: [
      order.address.fullName,
      order.address.line1,
      order.address.line2,
      `${order.address.city}${order.address.state ? `, ${order.address.state}` : ""}${
        order.address.postalCode ? ` ${order.address.postalCode}` : ""
      }`,
      order.address.country,
    ],
    promoCode: order.promoCode,
    subtotalUSD: order.subtotalUSD,
    discountUSD: order.discountUSD,
    shippingUSD: order.shippingUSD,
    totalUSD: order.totalUSD,
    items: order.items.map((item) => ({
      name: item.customizationSummary ? `${item.name} (${item.customizationSummary})` : item.name,
      quantity: item.quantity,
      unitPriceUSD: item.unitPriceUSD,
      lineTotalUSD: item.lineTotalUSD,
    })),
  });

  await telegramSendDocument({
    filename: `${order.invoice.invoiceNumber || order.orderNumber}.pdf`,
    bytes: pdfBytes,
    caption: `Invoice ${order.invoice.invoiceNumber} | Order ${order.orderNumber} | Total ${fmtMoney(
      order.totalUSD
    )}`,
  });
}

// ─── Route handlers ─────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (data ?? []).map((row) => rowToOrder(row as Record<string, unknown>));
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  const body = (await req.json().catch(() => null)) as
    | { items?: unknown; addressId?: string; promoCode?: string }
    | null;

  const items = normalizeItems(body?.items);
  const addressId = asText(body?.addressId);
  const promoCode = normalizePromoCode(body?.promoCode);

  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const { data: addressRows, error: addressError } = await supabaseAdmin
    .from("user_addresses")
    .select("*")
    .eq("user_id", userId);

  if (addressError) {
    return NextResponse.json({ error: addressError.message }, { status: 500 });
  }

  const addresses = normalizeAddresses(
    (addressRows ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      fullName: row.full_name,
      phone: row.phone,
      line1: row.line1,
      line2: row.line2,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  );
  if (addresses.length === 0) {
    return NextResponse.json({ error: "No shipping address found" }, { status: 400 });
  }

  const address =
    addresses.find((x) => x.id === addressId) ??
    addresses.find((x) => x.isDefault) ??
    addresses[0];

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const products = await getProducts();
  const byId = new Map(products.map((p) => [String(p.id), p]));
  const resolvedItems = items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    const lineTotalUSD = product.priceUSD * item.quantity;
    return {
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      unitPriceUSD: product.priceUSD,
      lineTotalUSD,
      previewImageUrl: item.previewImageUrl || getProductPreviewImage(product),
      customizationSummary: item.customization?.summary || undefined,
      customizationSlots: item.customization?.slots?.length ? item.customization.slots : undefined,
    };
  });

  const subtotalUSD = resolvedItems.reduce((sum, x) => sum + x.lineTotalUSD, 0);
  const baseShippingUSD = subtotalUSD > 0 ? 5 : 0;

  const promoRaw = await kv.get<unknown>(PROMO_CODES_KEY).catch(() => null);
  const promoRecords = withPromoDefaults(normalizePromoRecords(promoRaw));

  let discountUSD = 0;
  let shippingUSD = baseShippingUSD;
  let appliedPromoCode = "";
  try {
    const promoResult = applyPromoRule({
      subtotalUSD,
      shippingUSD: baseShippingUSD,
      promoCode,
      records: promoRecords,
    });
    discountUSD = promoResult.discountUSD;
    shippingUSD =
      promoResult.shippingOverrideUSD === null
        ? baseShippingUSD
        : promoResult.shippingOverrideUSD;
    appliedPromoCode = promoResult.appliedCode;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid promo code";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const totalUSD = subtotalUSD - discountUSD + shippingUSD;

  const orderNumber = await generateOrderNumber();
  const invoiceNumber = await generateInvoiceNumber();
  const createdAt = new Date().toISOString();

  const finalizedItems = await Promise.all(
    resolvedItems.map(async (item, index) => {
      if (!item.customizationSummary) return item;
      const previewImageUrl = await persistCustomPreviewImage({
        rawUrl: item.previewImageUrl,
        orderNumber,
        itemIndex: index,
      }).catch(() => "");
      return {
        ...item,
        previewImageUrl: previewImageUrl || item.previewImageUrl || undefined,
      };
    })
  );

  const order: OrderRecord = {
    id: `ORD-${Date.now()}`,
    orderNumber,
    userId,
    status: "pending",
    createdAt,
    shippingUSD,
    subtotalUSD,
    discountUSD,
    totalUSD,
    promoCode: appliedPromoCode || undefined,
    invoice: {
      invoiceNumber,
      issuedAt: createdAt,
      paymentStatus: "pending",
    },
    trackingHistory: [
      {
        status: "pending",
        at: createdAt,
        note: "Order created",
      },
    ],
    address,
    items: finalizedItems,
  };

  // Persist order to Supabase
  const { error: insertError } = await supabaseAdmin
    .from("orders")
    .insert(orderToRow(order, userId));

  if (insertError) {
    console.error("Failed to save order to Supabase:", insertError);
    return NextResponse.json({ error: "Failed to save order. Please try again." }, { status: 500 });
  }

  // Fire Telegram notification in the background — do NOT await it so the
  // user gets their success response immediately (PDF generation + uploads
  // can take several seconds).
  void notifyOrderTelegram({ userId, customerEmail: auth.email, order }).catch((error) => {
    console.error("Order placed but Telegram notification failed:", error);
  });

  return NextResponse.json({ ok: true, order });
}
