import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/app/lib/supabase/auth-server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const { orderId: encodedOrderId } = await params;
  const orderId = decodeURIComponent(encodedOrderId || "");
  if (!orderId) {
    return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", auth.userId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const primaryEmail = auth.email;
  const address = (order.address ?? {}) as Record<string, unknown>;
  const invoice = (order.invoice ?? {}) as Record<string, unknown>;
  const items = Array.isArray(order.items) ? order.items as Record<string, unknown>[] : [];
  const fullName = asText(address.fullName) || "Customer";

  return NextResponse.json({
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
