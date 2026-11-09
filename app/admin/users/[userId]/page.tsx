import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AdminShell from "../../AdminShell";
import { OrderStatusBadge } from "@/app/components/OrderStatus";
import { ArrowLeft } from "lucide-react";
import type { Product } from "@/app/data/products";
import { getProducts } from "@/app/lib/products-db";
import { getSupabaseUserFromCookies } from "@/app/lib/supabase/auth-server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import { ui } from "../../ui";

function formatDate(value: unknown) {
  if (!value) return "N/A";

  const date =
    typeof value === "number" || typeof value === "string"
      ? new Date(value)
      : value instanceof Date
        ? value
        : null;

  if (!date || Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type OrderItem = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  promoCode: string;
  itemsCount: number;
  addressLine: string;
  createdAt: unknown;
  raw: unknown;
};

type SavedAddress = {
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

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAddresses(input: unknown): SavedAddress[] {
  if (!Array.isArray(input)) return [];
  return input
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
      country: asText(x.country) || "US",
      isDefault: x.isDefault === true,
      createdAt: asText(x.createdAt),
      updatedAt: asText(x.updatedAt),
    }))
    .filter((x) => x.id && x.fullName && x.line1);
}

function normalizeOrders(input: unknown): OrderItem[] {
  const records: unknown[] =
    Array.isArray(input)
      ? input
      : input && typeof input === "object"
        ? Array.isArray((input as { orders?: unknown }).orders)
          ? ((input as { orders: unknown[] }).orders ?? [])
          : Array.isArray((input as { data?: unknown }).data)
            ? ((input as { data: unknown[] }).data ?? [])
            : [input]
        : [];

  return records
    .filter((x) => x && typeof x === "object")
    .map((x, index) => {
      const order = x as Record<string, unknown>;
      const id =
        typeof order.id === "string"
          ? order.id
          : typeof order.orderId === "string"
            ? order.orderId
            : `order-${index + 1}`;

      const status =
        typeof order.status === "string"
          ? order.status
          : typeof order.state === "string"
            ? order.state
            : "Unknown";

      // Support both camelCase (old KV) and snake_case (Supabase) field names
      const subtotalRaw = order.subtotalUSD ?? order.subtotal_usd ?? order.subtotal ?? null;
      const shippingRaw = order.shippingUSD ?? order.shipping_usd ?? order.shipping ?? null;
      const discountRaw = order.discountUSD ?? order.discount_usd ?? order.discount ?? null;
      const totalRaw =
        order.totalUSD ?? order.total_usd ?? order.total ?? order.amount ?? null;
      const promoCodeRaw =
        typeof order.promoCode === "string"
          ? order.promoCode
          : typeof order.promo_code === "string"
            ? order.promo_code
            : "";
      const orderNumberRaw =
        typeof order.orderNumber === "string"
          ? order.orderNumber
          : typeof order.order_number === "string"
            ? order.order_number
            : id;

      return {
        id,
        orderNumber: orderNumberRaw,
        status,
        subtotal: subtotalRaw === null ? "N/A" : String(subtotalRaw),
        shipping: shippingRaw === null ? "N/A" : String(shippingRaw),
        discount: discountRaw === null ? "0" : String(discountRaw),
        total: totalRaw === null ? "N/A" : String(totalRaw),
        promoCode: promoCodeRaw,
        itemsCount: Array.isArray(order.items)
          ? order.items.reduce((sum, item) => {
              if (!item || typeof item !== "object") return sum;
              const qty = (item as { quantity?: unknown }).quantity;
              return sum + (typeof qty === "number" ? qty : 0);
            }, 0)
          : 0,
        addressLine:
          order.address && typeof order.address === "object"
            ? [
                asText((order.address as { line1?: unknown }).line1),
                asText((order.address as { city?: unknown }).city),
                asText((order.address as { state?: unknown }).state),
              ]
                .filter(Boolean)
                .join(", ")
            : "",
        createdAt: order.createdAt ?? order.created_at ?? order.date ?? null,
        raw: x,
      };
    });
}

function getProductImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (p.image) return p.image;
  return "/products/placeholder.jpg";
}

function getProductHref(p: Product) {
  return `/shop/${p.category}/${p.slug}`;
}

function labelCategory(raw: string) {
  return raw
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

function formatPrice(p: Product) {
  return `$${p.priceUSD}`;
}

async function requireAdmin() {
  const auth = await getSupabaseUserFromCookies();
  if ("response" in auth) return { ok: false as const, reason: "unauthorized" as const };

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!adminEmail || auth.email !== adminEmail) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  return { ok: true as const, email: auth.email };
}

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    if (admin.reason === "unauthorized") redirect("/sign-in");
    notFound();
  }

  const { userId } = await params;
  const decodedUserId = decodeURIComponent(userId);

  const { data: userResult, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(decodedUserId);
  if (userError || !userResult.user) notFound();
  const userData = userResult.user;

  const { data: likesRows } = await supabaseAdmin
    .from("user_likes")
    .select("product_id")
    .eq("user_id", decodedUserId);
  const likesIds = (likesRows ?? []).map((row) => String(row.product_id));

  const { data: wishlistRows } = await supabaseAdmin
    .from("user_wishlist")
    .select("product_id")
    .eq("user_id", decodedUserId);
  const wishlistIds = new Set<string>((wishlistRows ?? []).map((row) => String(row.product_id)));

  const { data: orderRows } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("user_id", decodedUserId)
    .order("created_at", { ascending: false });
  const orders = normalizeOrders(orderRows ?? []);
  const { data: addressRows } = await supabaseAdmin
    .from("user_addresses")
    .select("*")
    .eq("user_id", decodedUserId)
    .order("is_default", { ascending: false });
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
  const products = await getProducts();

  const productById = new Map<string, Product>();
  for (const p of products) productById.set(String(p.id), p);

  const likedProducts = likesIds
    .map((id) => productById.get(id))
    .filter(Boolean) as Product[];

  const wishlistProducts = [...wishlistIds]
    .map((id) => productById.get(id))
    .filter(Boolean) as Product[];

  const primaryEmail = userData.email || "";
  const fullName =
    [userData.user_metadata?.first_name, userData.user_metadata?.last_name]
      .filter((x) => typeof x === "string" && x.trim())
      .join(" ") ||
    (typeof userData.user_metadata?.name === "string" ? userData.user_metadata.name : "") ||
    userData.email?.split("@")[0] ||
    "Unnamed user";
  const username =
    typeof userData.user_metadata?.username === "string" ? userData.user_metadata.username : "";

  const productTiles = (list: Product[], prefix: string, empty: string) =>
    list.length > 0 ? (
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
        {list.map((p) => (
          <li key={`${prefix}-${p.id}`}>
            <Link href={getProductHref(p)} className="group block">
              <span className="relative block aspect-square overflow-hidden rounded-xl border border-white/10 bg-black">
                <Image src={getProductImage(p)} alt={p.name} fill className="object-cover transition group-hover:scale-[1.04]" sizes="120px" />
              </span>
              <span className="mt-1.5 block truncate text-xs font-medium text-white/80 group-hover:text-[#FF8B64] transition-colors">
                {p.name}
              </span>
              <span className="block text-[11px] text-white/40">{formatPrice(p)}</span>
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-white/40">{empty}</p>
    );

  return (
    <AdminShell
      active="insights"
      email={admin.email}
      title={fullName}
      blurb={primaryEmail || "No email"}
      actions={
        <Link href="/admin?tab=insights" className={ui.btn}>
          <ArrowLeft size={15} aria-hidden="true" />
          All customers
        </Link>
      }
    >
      <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className={ui.panelPad}>
            <h2 className={ui.label}>Profile</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-white/45">Username</dt><dd className="truncate text-white/85">{username ? `@${username}` : "–"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/45">Joined</dt><dd className="text-white/85">{formatDate(userData.created_at)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/45">Last sign-in</dt><dd className="text-white/85">{formatDate(userData.last_sign_in_at)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/45">Orders</dt><dd className="font-semibold text-white">{orders.length}</dd></div>
            </dl>
            <p className={`mt-4 break-all ${ui.mono}`}>{userData.id}</p>
          </section>

          <section className={ui.panelPad}>
            <h2 className={ui.label}>Addresses</h2>
            <div className="mt-3 space-y-3">
              {addresses.length > 0 ? (
                addresses.map((addr) => (
                  <div key={addr.id} className={`${ui.inset} p-3.5 text-sm`}>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{addr.label || "Address"}</p>
                      {addr.isDefault && (
                        <span className="rounded-full bg-[#FF8B64]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FF8B64]">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-white/80">{addr.fullName}</p>
                    {addr.phone && (
                      <a href={`tel:${addr.phone}`} className="text-[#FF8B64] hover:text-[#ffa282]">
                        {addr.phone}
                      </a>
                    )}
                    <p className="mt-1.5 text-white/55 leading-relaxed">
                      {[addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/40">No saved addresses.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className={`${ui.panel} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
              <h2 className="text-base font-bold text-white">Orders</h2>
              <span className="text-xs text-white/40">{orders.length}</span>
            </div>
            {orders.length > 0 ? (
              <ul className="divide-y divide-white/[0.06]">
                {orders.map((order) => (
                  <li key={order.id} className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{order.orderNumber || order.id}</p>
                        <p className="text-xs text-white/40">
                          {formatDate(order.createdAt)} · {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}
                          {order.promoCode ? ` · ${order.promoCode}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold tabular-nums text-white">{order.total}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                    {order.addressLine && <p className="mt-1.5 truncate text-xs text-white/45">{order.addressLine}</p>}
                    <details className="mt-2 text-xs text-white/40">
                      <summary className="cursor-pointer select-none hover:text-white/70">Full order data</summary>
                      <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-white/70">
                        {JSON.stringify(order.raw, null, 2)}
                      </pre>
                    </details>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-white/40">No orders yet.</p>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className={ui.panelPad}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className={ui.label}>Liked</h2>
                <span className="text-xs text-white/40">{likesIds.length}</span>
              </div>
              {productTiles(likedProducts, "like", "No likes yet.")}
            </section>
            <section className={ui.panelPad}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className={ui.label}>Wishlist</h2>
                <span className="text-xs text-white/40">{wishlistIds.size}</span>
              </div>
              {productTiles(wishlistProducts, "wish", "Nothing saved yet.")}
            </section>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
