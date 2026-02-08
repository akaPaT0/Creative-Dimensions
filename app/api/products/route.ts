import { NextResponse } from "next/server";
import { getProducts } from "@/app/lib/products-db";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json({ ok: true, products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

