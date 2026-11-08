import type { Metadata } from "next";
import ProductPage, { productMetadata, productStaticParams } from "../../ProductPage";

const CATEGORY = "fanboys";

export const revalidate = 300;

export function generateStaticParams() {
  return productStaticParams(CATEGORY);
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return productMetadata(CATEGORY, params);
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ProductPage category={CATEGORY} params={params} />;
}
