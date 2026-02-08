import { NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";

type OrderRecord = {
  id?: string;
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  subtotalUSD?: number;
  shippingUSD?: number;
  discountUSD?: number;
  totalUSD?: number;
  promoCode?: string;
  items?: Array<{
    productId?: string;
    name?: string;
    quantity?: number;
    unitPriceUSD?: number;
    lineTotalUSD?: number;
  }>;
  address?: {
    fullName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

type AdminOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotalUSD: number;
  shippingUSD: number;
  discountUSD: number;
  totalUSD: number;
  promoCode: string;
  itemsCount: number;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  address: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return value;
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

function normalizeOrders(raw: unknown) {
  if (!Array.isArray(raw)) return [] as OrderRecord[];
  return raw.filter((x): x is OrderRecord => !!x && typeof x === "object");
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const client = await clerkClient();
    const usersRes = await client.users.getUserList({ limit: 100, orderBy: "-created_at" });
    const users = usersRes.data ?? [];

    const ordersByUser = await Promise.all(
      users.map(async (u) => {
        const raw = await kv.get<unknown>(`user:${u.id}:orders`);
        const orders = normalizeOrders(raw);
        return { user: u, orders };
      })
    );

    const rows: AdminOrderRow[] = [];
    for (const group of ordersByUser) {
      const user = group.user;
      const primaryEmail =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
        user.emailAddresses[0]?.emailAddress ||
        "";
      const fullName =
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
        user.username ||
        "Unnamed user";

      for (const order of group.orders) {
        const items = Array.isArray(order.items) ? order.items : [];
        const itemCount = items.reduce((sum, item) => sum + asNumber(item.quantity), 0);
        rows.push({
          id: asText(order.id) || `legacy-${user.id}-${Math.random().toString(36).slice(2, 8)}`,
          orderNumber: asText(order.orderNumber) || asText(order.id) || "N/A",
          status: asText(order.status) || "pending",
          createdAt: asText(order.createdAt),
          subtotalUSD: asNumber(order.subtotalUSD),
          shippingUSD: asNumber(order.shippingUSD),
          discountUSD: asNumber(order.discountUSD),
          totalUSD: asNumber(order.totalUSD),
          promoCode: asText(order.promoCode),
          itemsCount: itemCount,
          user: {
            id: user.id,
            fullName,
            email: primaryEmail,
          },
          address: {
            fullName: asText(order.address?.fullName),
            phone: asText(order.address?.phone),
            line1: asText(order.address?.line1),
            city: asText(order.address?.city),
            state: asText(order.address?.state),
            postalCode: asText(order.address?.postalCode),
            country: asText(order.address?.country),
          },
        });
      }
    }

    rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    const totalOrders = rows.length;
    const revenueUSD = rows.reduce((sum, x) => sum + x.totalUSD, 0);
    const pendingOrders = rows.filter((x) => x.status.toLowerCase() === "pending").length;

    return json({
      ok: true,
      metrics: { totalOrders, pendingOrders, revenueUSD },
      orders: rows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin orders";
    return json({ error: message }, 500);
  }
}
