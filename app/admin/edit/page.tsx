import { notFound } from "next/navigation";
import { products } from "@/app/data/products";
import EditProductClient from "./EditProductClient";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const product = products.find((p: any) => p?.id === params.id);
  if (!product) return notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-xl font-semibold text-white">Edit Product</h1>
      <p className="text-sm text-white/60 mt-1">ID: {product.id}</p>

      <div className="mt-6">
        <EditProductClient product={product as any} />
      </div>
    </div>
  );
}
