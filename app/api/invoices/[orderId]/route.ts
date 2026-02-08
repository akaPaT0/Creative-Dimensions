import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId: encodedOrderId } = await params;
  const orderId = decodeURIComponent(encodedOrderId || "");
  if (!orderId) {
    return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  }

  const raw = await kv.get<unknown>(`user:${userId}:orders`);
  const orders = normalizeOrders(raw);
  const order = orders.find((x) => asText(x.id) === orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const user = await currentUser();
  const primaryEmail =
    user?.emailAddresses.find((x) => x.id === user.primaryEmailAddressId)?.emailAddress ||
    user?.emailAddresses[0]?.emailAddress ||
    "";
  const fullName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.username || "Customer";

  return NextResponse.json({
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

