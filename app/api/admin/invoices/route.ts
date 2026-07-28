import { NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/app/lib/supabase/auth-server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

async function requireAdmin(req: Request) {
  const admin = await requireSupabaseAdmin(req);
  if ("response" in admin) return { ok: false as const, res: admin.response };
  return { ok: true as const };
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.res;

  const { searchParams } = new URL(req.url);
  const userId = asText(searchParams.get("userId"));
  const orderId = asText(searchParams.get("orderId"));
  if (!userId || !orderId) {
    return json({ error: "userId and orderId are required" }, 400);
  }

  // Fetch user metadata
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  const user = userData.user;
  if (userError || !user) return json({ error: "User not found" }, 404);

  const primaryEmail = user.email || "";
  const fullName =
    [user.user_metadata?.first_name, user.user_metadata?.last_name]
      .filter((x) => typeof x === "string" && x.trim())
      .join(" ") ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "") ||
    user.email?.split("@")[0] ||
    "Customer";

  // Fetch the specific order from Supabase (admin can query any user's order)
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (orderError || !order) return json({ error: "Order not found" }, 404);

  const address = (order.address ?? {}) as Record<string, unknown>;
  const invoice = (order.invoice ?? {}) as Record<string, unknown>;
  const items = Array.isArray(order.items) ? order.items as Record<string, unknown>[] : [];

  return json({
    ok: true,
    invoice: {
      orderId: asText(order.id),
      orderNumber: asText(order.order_number) || asText(order.id),
      status: asText(order.status) || "pending",
      createdAt: asText(order.created_at),
      subtotalUSD: asNumber(order.subtotal_usd),
      shippingUSD: asNumber(order.shipping_usd),
      discountUSD: asNumber(order.discount_usd),
      totalUSD: asNumber(order.total_usd),
      customer: {
        fullName,
        email: primaryEmail,
      },
      address: {
        fullName: asText(address.fullName),
        line1: asText(address.line1),
        line2: asText(address.line2),
        city: asText(address.city),
        state: asText(address.state),
        postalCode: asText(address.postalCode),
        country: asText(address.country),
      },
      items: items.map((item) => ({
        productId: asText(item.productId),
        name: asText(item.name),
        quantity: asNumber(item.quantity),
        unitPriceUSD: asNumber(item.unitPriceUSD),
        lineTotalUSD: asNumber(item.lineTotalUSD),
        customizationSummary: asText(item.customizationSummary),
      })),
      invoiceMeta: {
        invoiceNumber: asText(invoice.invoiceNumber) || "Pending",
        issuedAt: asText(invoice.issuedAt) || asText(order.created_at),
        paymentStatus: asText(invoice.paymentStatus) || "pending",
      },
    },
  });
}
