import { NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/app/lib/supabase/auth-server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

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
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPriceUSD: number;
    lineTotalUSD: number;
  }>;
  invoice: {
    invoiceNumber: string;
    issuedAt: string;
    paymentStatus: string;
  };
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

async function requireAdmin(req: Request) {
  const admin = await requireSupabaseAdmin(req);
  if ("response" in admin) return { ok: false as const, res: admin.response };
  return { ok: true as const };
}

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

function normalizeStatus(value: unknown) {
  const status = asText(value).toLowerCase();
  return ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number]) ? status : "";
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.res;

    // Fetch all orders from Supabase
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;
    const allOrders = ordersData ?? [];

    // Get unique user IDs from the orders
    const userIds = [...new Set(allOrders.map((o) => String(o.user_id)))].filter(Boolean);

    // Batch-fetch user metadata from Supabase Auth
    const userMap = new Map<string, { fullName: string; email: string }>();
    if (userIds.length > 0) {
      // Supabase Auth Admin listUsers paginates at 1000; fetch pages until done
      let page = 1;
      let done = false;
      while (!done) {
        const { data: usersPage, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (usersError) throw usersError;
        const users = usersPage.users ?? [];
        for (const u of users) {
          if (!userIds.includes(u.id)) continue;
          const fullName =
            [u.user_metadata?.first_name, u.user_metadata?.last_name]
              .filter((x) => typeof x === "string" && x.trim())
              .join(" ") ||
            (typeof u.user_metadata?.name === "string" ? u.user_metadata.name : "") ||
            u.email?.split("@")[0] ||
            "Unnamed user";
          userMap.set(u.id, { fullName, email: u.email || "" });
        }
        // Stop when we've seen fewer than a full page (last page)
        done = users.length < 1000;
        page++;
      }
    }

    const rows: AdminOrderRow[] = allOrders.map((o) => {
      const userId = String(o.user_id ?? "");
      const userInfo = userMap.get(userId) ?? { fullName: "Unknown", email: "" };
      const items = Array.isArray(o.items) ? o.items : [];
      const itemsCount = items.reduce((sum: number, item: Record<string, unknown>) => sum + asNumber(item.quantity), 0);
      const invoice = (o.invoice ?? {}) as Record<string, unknown>;
      const address = (o.address ?? {}) as Record<string, unknown>;

      return {
        id: asText(o.id),
        orderNumber: asText(o.order_number) || asText(o.id) || "N/A",
        status: asText(o.status) || "pending",
        createdAt: asText(o.created_at),
        subtotalUSD: asNumber(o.subtotal_usd),
        shippingUSD: asNumber(o.shipping_usd),
        discountUSD: asNumber(o.discount_usd),
        totalUSD: asNumber(o.total_usd),
        promoCode: asText(o.promo_code),
        itemsCount,
        items: items.map((item: Record<string, unknown>) => ({
          productId: asText(item.productId),
          name: asText(item.name),
          quantity: asNumber(item.quantity),
          unitPriceUSD: asNumber(item.unitPriceUSD),
          lineTotalUSD: asNumber(item.lineTotalUSD),
        })),
        invoice: {
          invoiceNumber: asText(invoice.invoiceNumber),
          issuedAt: asText(invoice.issuedAt),
          paymentStatus: asText(invoice.paymentStatus) || "pending",
        },
        user: {
          id: userId,
          fullName: userInfo.fullName,
          email: userInfo.email,
        },
        address: {
          fullName: asText(address.fullName),
          phone: asText(address.phone),
          line1: asText(address.line1),
          city: asText(address.city),
          state: asText(address.state),
          postalCode: asText(address.postalCode),
          country: asText(address.country),
        },
      };
    });

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

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.res;

    const body = (await req.json().catch(() => null)) as
      | { orderId?: unknown; status?: unknown }
      | null;

    const orderId = asText(body?.orderId);
    const status = normalizeStatus(body?.status);

    if (!orderId || !status) {
      return json({ error: "orderId and valid status are required" }, 400);
    }

    // Fetch current order to get tracking history
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("status, tracking_history")
      .eq("id", orderId)
      .single();

    if (fetchError || !existing) {
      return json({ error: "Order not found" }, 404);
    }

    const existingHistory = Array.isArray(existing.tracking_history)
      ? existing.tracking_history
      : [];
    const lastStatus = asText(
      (existingHistory[existingHistory.length - 1] as Record<string, unknown>)?.status
    );
    const trackingHistory =
      lastStatus === status
        ? existingHistory
        : [
            ...existingHistory,
            {
              status,
              at: new Date().toISOString(),
              note: "Updated by admin",
            },
          ];

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ status, tracking_history: trackingHistory })
      .eq("id", orderId)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return json({ ok: true, order: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order status";
    return json({ error: message }, 500);
  }
}
