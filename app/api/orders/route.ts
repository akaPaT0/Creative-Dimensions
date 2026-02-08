import { auth, clerkClient } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { getProducts } from "@/app/lib/products-db";
import { telegramNotify, telegramSendDocument } from "@/app/lib/telegram";
import { generateInvoicePdf } from "@/app/lib/invoicePdf";
import {
  PROMO_CODES_KEY,
  applyPromoRule,
  normalizePromoCode,
  normalizePromoRecords,
  withPromoDefaults,
} from "@/app/lib/promocodes";

type OrderRequestItem = {
  productId: string;
  quantity: number;
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
  }>;
};

function ordersKey(userId: string) {
  return `user:${userId}:orders`;
}

function addressesKey(userId: string) {
  return `user:${userId}:addresses`;
}

function orderCounterKey() {
  return "orders:counter";
}

function invoiceCounterKey() {
  return "invoices:counter";
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asPositiveInt(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function normalizeItems(raw: unknown): OrderRequestItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const row = x as Record<string, unknown>;
      const productId = asText(row.productId);
      const quantity = asPositiveInt(row.quantity);
      if (!productId) return null;
      return { productId, quantity };
    })
    .filter((x): x is OrderRequestItem => Boolean(x));
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

function normalizeOrders(raw: unknown): OrderRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is OrderRecord => !!x && typeof x === "object")
    .map((x) => x);
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

async function notifyOrderTelegram(params: {
  userId: string;
  order: OrderRecord;
}) {
  const { userId, order } = params;
  let customerName = order.address.fullName || "Customer";
  let customerEmail = "";
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      "";
    customerEmail = primaryEmail;
    customerName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      user.username ||
      customerName;
  } catch {
    // keep address-derived fallback
  }

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
        `- ${item.name} x${item.quantity} (${fmtMoney(item.unitPriceUSD)}) = ${fmtMoney(item.lineTotalUSD)}`
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
      name: item.name,
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

async function generateOrderNumber() {
  const next = await kv.incr(orderCounterKey());
  const padded = String(next).padStart(7, "0");
  return `CD-${padded}`;
}

async function generateInvoiceNumber() {
  const next = await kv.incr(invoiceCounterKey());
  const padded = String(next).padStart(7, "0");
  return `INV-${padded}`;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await kv.get<unknown>(ordersKey(userId));
  const orders = normalizeOrders(raw).sort((a, b) =>
    String(a.createdAt).localeCompare(String(b.createdAt)) * -1
  );
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { items?: unknown; addressId?: string; promoCode?: string }
    | null;

  const items = normalizeItems(body?.items);
  const addressId = asText(body?.addressId);
  const promoCode = normalizePromoCode(body?.promoCode);

  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const rawAddresses = await kv.get<unknown>(addressesKey(userId));
  const addresses = normalizeAddresses(rawAddresses);
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
    };
  });

  const subtotalUSD = resolvedItems.reduce((sum, x) => sum + x.lineTotalUSD, 0);
  const baseShippingUSD = subtotalUSD > 0 ? 5 : 0;

  const promoRaw = await kv.get<unknown>(PROMO_CODES_KEY);
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
    items: resolvedItems,
  };

  const existingRaw = await kv.get<unknown>(ordersKey(userId));
  const existing = normalizeOrders(existingRaw);
  await kv.set(ordersKey(userId), [order, ...existing]);

  try {
    await notifyOrderTelegram({ userId, order });
  } catch (error) {
    console.error("Order placed but Telegram notification failed:", error);
    // Do not block order placement if Telegram notification fails.
  }

  return NextResponse.json({ ok: true, order });
}
