import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Background from "@/app/components/Background";
import type { Product } from "@/app/data/products";
import { getProducts } from "@/app/lib/products-db";
import { getSupabaseUserFromCookies } from "@/app/lib/supabase/auth-server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

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

  return { ok: true as const };
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

  return (
    <div className="relative min-h-screen">
      <Background />

      <main className="relative z-20 min-h-screen px-4 sm:px-6 lg:px-8 py-10">
        <div className="mx-auto w-full max-w-[1400px] space-y-5">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Admin User View
                </p>
                <h1 className="mt-2 text-white text-3xl sm:text-4xl font-semibold">
                  {fullName}
                </h1>
                <p className="mt-2 text-white/70">{primaryEmail || "No email"}</p>
                <div className="mt-3 text-sm text-white/55 font-mono">{userData.id}</div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/admin"
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                >
                  Back to Admin
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-white text-xl font-semibold">Profile</h2>
              <div className="mt-4 space-y-2 text-sm text-white/80">
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-white/60">Username:</span>{" "}
                  <span>{username || "N/A"}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-white/60">Created:</span>{" "}
                  <span>{formatDate(userData.created_at)}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-white/60">Last sign in:</span>{" "}
                  <span>{formatDate(userData.last_sign_in_at)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-white text-xl font-semibold">Likes</h2>
              <p className="mt-1 text-sm text-white/60">{likesIds.length} product(s)</p>
              <div className="mt-4 space-y-3">
                {likedProducts.length > 0 ? (
                  likedProducts.map((p) => (
                    <div key={`like-${p.id}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex gap-3">
                        <Link
                          href={getProductHref(p)}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5"
                        >
                          <Image
                            src={getProductImage(p)}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={getProductHref(p)}
                            className="line-clamp-1 text-sm font-medium text-white hover:underline underline-offset-4"
                          >
                            {p.name}
                          </Link>
                          <div className="mt-1 text-xs text-white/65">{labelCategory(p.category)}</div>
                          <div className="mt-1 text-xs text-white/90">{formatPrice(p)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/65">
                    No likes found.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-white text-xl font-semibold">Wishlist</h2>
              <p className="mt-1 text-sm text-white/60">{wishlistIds.size} product(s)</p>
              <div className="mt-4 space-y-3">
                {wishlistProducts.length > 0 ? (
                  wishlistProducts.map((p) => (
                    <div
                      key={`wishlist-${p.id}`}
                      className="rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <div className="flex gap-3">
                        <Link
                          href={getProductHref(p)}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5"
                        >
                          <Image
                            src={getProductImage(p)}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={getProductHref(p)}
                            className="line-clamp-1 text-sm font-medium text-white hover:underline underline-offset-4"
                          >
                            {p.name}
                          </Link>
                          <div className="mt-1 text-xs text-white/65">{labelCategory(p.category)}</div>
                          <div className="mt-1 text-xs text-white/90">{formatPrice(p)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/65">
                    No wishlist items found.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-white text-xl font-semibold">Saved Addresses</h2>
            <p className="mt-1 text-sm text-white/60">
              Loaded from Supabase user_addresses table.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {addresses.length > 0 ? (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">
                        {addr.label || "Address"}
                      </p>
                      {addr.isDefault && (
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-white/90">{addr.fullName}</p>
                    <p className="text-sm text-white/75">{addr.phone}</p>
                    <p className="mt-2 text-sm text-white/80">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}
                    </p>
                    <p className="text-sm text-white/80">
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p className="text-sm text-white/80">{addr.country}</p>
                    <p className="mt-2 text-xs text-white/55">
                      Updated {formatDate(addr.updatedAt || addr.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/65">
                  No saved addresses found for this user.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-white text-xl font-semibold">Orders</h2>
            <p className="mt-1 text-sm text-white/60">
              Loaded from KV store.
            </p>

            <div className="mt-4 space-y-3">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm text-white/90 font-medium">
                          {order.orderNumber || order.id}
                        </div>
                        <div className="text-[11px] text-white/60">{order.id}</div>
                      </div>
                      <div className="text-xs text-white/70">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/80">
                      <span>Status: {order.status}</span>
                      <span>Items: {order.itemsCount}</span>
                      <span>Subtotal: {order.subtotal}</span>
                      <span>Discount: {order.discount}</span>
                      <span>Shipping: {order.shipping}</span>
                      <span>Total: {order.total}</span>
                      <span>Promo: {order.promoCode || "-"}</span>
                      <span>Address: {order.addressLine || "-"}</span>
                    </div>
                    <details className="mt-2 text-xs text-white/65">
                      <summary className="cursor-pointer">Raw order payload</summary>
                      <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/35 p-2 text-[11px] leading-relaxed text-white/75">
                        {JSON.stringify(order.raw, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/65">
                  No orders found for this user in KV.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
