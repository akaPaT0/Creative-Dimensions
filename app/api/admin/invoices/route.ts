import { NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";

type InvoiceOrder = {
  id?: string;
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  subtotalUSD?: number;
  shippingUSD?: number;
  discountUSD?: number;
  totalUSD?: number;
  items?: Array<{
    productId?: string;
    name?: string;
    quantity?: number;
    unitPriceUSD?: number;
    lineTotalUSD?: number;
    customizationSummary?: string;
  }>;
  address?: {
    fullName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  invoice?: {
    invoiceNumber?: string;
    issuedAt?: string;
    paymentStatus?: string;
  };
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeOrders(raw: unknown): InvoiceOrder[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is InvoiceOrder => !!x && typeof x === "object");
}

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) };

  const user = await currentUser();
  if (!user) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) };

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";
  const userEmail = primaryEmail.trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) {
    return { ok: false as const, res: json({ error: "Forbidden" }, 403) };
  }
  return { ok: true as const };
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;

  const { searchParams } = new URL(req.url);
  const userId = asText(searchParams.get("userId"));
  const orderId = asText(searchParams.get("orderId"));
  if (!userId || !orderId) {
    return json({ error: "userId and orderId are required" }, 400);
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId).catch(() => null);
  if (!user) return json({ error: "User not found" }, 404);

  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";
  const fullName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username || "Customer";

  const raw = await kv.get<unknown>(`user:${userId}:orders`);
  const orders = normalizeOrders(raw);
  const order = orders.find((x) => asText(x.id) === orderId);
  if (!order) return json({ error: "Order not found" }, 404);

  return json({
    ok: true,
    invoice: {
      orderId: asText(order.id),
      orderNumber: asText(order.orderNumber) || asText(order.id),
      status: asText(order.status) || "pending",
      createdAt: asText(order.createdAt),
      subtotalUSD: asNumber(order.subtotalUSD),
      shippingUSD: asNumber(order.shippingUSD),
      discountUSD: asNumber(order.discountUSD),
      totalUSD: asNumber(order.totalUSD),
      customer: {
        fullName,
        email: primaryEmail,
      },
      address: {
        fullName: asText(order.address?.fullName),
        line1: asText(order.address?.line1),
        line2: asText(order.address?.line2),
        city: asText(order.address?.city),
        state: asText(order.address?.state),
        postalCode: asText(order.address?.postalCode),
        country: asText(order.address?.country),
      },
      items: Array.isArray(order.items)
        ? order.items.map((item) => ({
            productId: asText(item.productId),
            name: asText(item.name),
            quantity: asNumber(item.quantity),
            unitPriceUSD: asNumber(item.unitPriceUSD),
            lineTotalUSD: asNumber(item.lineTotalUSD),
            customizationSummary: asText(item.customizationSummary),
          }))
        : [],
      invoiceMeta: {
        invoiceNumber: asText(order.invoice?.invoiceNumber) || "Pending",
        issuedAt: asText(order.invoice?.issuedAt) || asText(order.createdAt),
        paymentStatus: asText(order.invoice?.paymentStatus) || "pending",
      },
    },
  });
}
