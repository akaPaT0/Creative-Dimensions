import variants from "@/catalog/static-image-variants.json";

const catalogVariants: Readonly<Record<string, Readonly<Record<number, string>> | undefined>> = variants;

export function getStaticCatalogImage(key: string, width: number): string | undefined {
  const file = catalogVariants[key]?.[width];
  return file ? `/catalog-variants/${file}` : undefined;
}
