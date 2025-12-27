export type Category = "new-arrivals" | "keychains" | "tools" | "accessories" | "fanboys";

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: Category;
  priceUSD?: number;
  description?: string;
  isNew?: boolean;
};

export const products: Product[] = [
  {
    id: "k001",
    name: "Axo Keychain",
    slug: "axo-keychain",
    category: "keychains",
    priceUSD: 5,
    description: "Cute articulated axolotl keychain.",
    isNew: true,
  },
  {
    id: "t001",
    name: "Caliper Card",
    slug: "caliper-card",
    category: "tools",
    priceUSD: 3,
    description: "Carry a caliper inside your wallet.",
  },

  
];
