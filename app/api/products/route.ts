import { NextResponse } from "next/server";
import { getProducts } from "@/app/lib/products-db";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(
      { ok: true, products },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error) {
    console.error("Products request failed:", error);
    return NextResponse.json({ error: "Products are temporarily unavailable. Please try again." }, { status: 500 });
  }
}

