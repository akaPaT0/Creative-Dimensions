import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Background from "@/app/components/Background";
import { products, type Product } from "@/app/data/products";

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

function getPrimaryEmail(user: {
  emailAddresses: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId: string | null;
}) {
  return (
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress || user.emailAddresses[0]?.emailAddress || ""
  );
}

type OrderItem = {
  id: string;
  status: string;
  total: string;
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

      const totalRaw =
        typeof order.total === "number" || typeof order.total === "string"
          ? order.total
          : typeof order.amount === "number" || typeof order.amount === "string"
            ? order.amount
            : null;

      return {
        id,
        status,
        total: totalRaw === null ? "N/A" : String(totalRaw),
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
  const { userId } = await auth();
  if (!userId) return { ok: false as const, reason: "unauthorized" as const };

  const user = await currentUser();
  if (!user) return { ok: false as const, reason: "unauthorized" as const };

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = getPrimaryEmail(user).trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) {
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

  const client = await clerkClient();

  let userData: Awaited<ReturnType<typeof client.users.getUser>>;
  try {
    userData = await client.users.getUser(decodedUserId);
  } catch {
    notFound();
  }

  const likesIds = ((await kv.smembers<string[]>(`user:${decodedUserId}:likes`)) ??
    []) as string[];

  const wishlistIds = new Set<string>([
    ...((((await kv.smembers<string[]>(`user:${decodedUserId}:wishlist`)) ?? []) as string[])),
    ...((((await kv.smembers<string[]>(`user:${decodedUserId}:whishlist`)) ?? []) as string[])),
  ]);

  const orderBlob = await kv.get<unknown>(`user:${decodedUserId}:orders`);
  const orders = normalizeOrders(orderBlob);
  const addressBlob = await kv.get<unknown>(`user:${decodedUserId}:addresses`);
  const addresses = normalizeAddresses(addressBlob);

  const productById = new Map<string, Product>();
  for (const p of products) productById.set(String(p.id), p);

  const likedProducts = likesIds
    .map((id) => productById.get(id))
    .filter(Boolean) as Product[];

  const wishlistProducts = [...wishlistIds]
    .map((id) => productById.get(id))
    .filter(Boolean) as Product[];

  const primaryEmail = getPrimaryEmail(userData);

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
                  {userData.fullName || userData.username || "Unnamed user"}
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
                  <span>{userData.username || "N/A"}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-white/60">Created:</span>{" "}
                  <span>{formatDate(userData.createdAt)}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-white/60">Last sign in:</span>{" "}
                  <span>{formatDate(userData.lastSignInAt)}</span>
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
              Loaded from KV key <code>user:{decodedUserId}:addresses</code>
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
              Loaded from KV key <code>user:{decodedUserId}:orders</code>
            </p>

            <div className="mt-4 space-y-3">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm text-white/90 font-medium">{order.id}</div>
                      <div className="text-xs text-white/70">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/80">
                      <span>Status: {order.status}</span>
                      <span>Total: {order.total}</span>
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
