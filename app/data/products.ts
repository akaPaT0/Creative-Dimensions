export type Category = "new-arrivals" | "keychains" | "tools" | "accessories" | "fanboys";

export type SubCategory =
  | "cute"
  | "minecraft"
  | "cars"
  | "anime"
  | "tools"
  | "other";

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: Category;
  subCategory?: SubCategory; // ✅ add this
  priceUSD: number;
  description: string;
  isNew?: boolean;
  image?: string;
  images?: string[];
};



export const products: Product[] = [
 {
  id: "k001",
  name: "Cute Crab",
  slug: "cute-crab-orange",
  category: "keychains",
  subCategory: "cute",
  priceUSD: 2,
  description:
    "This crab has one job: make your keys look cooler 🦀🔥\nHandmade vibes, clean details, and that “I need it” look.\nAvailable now, DM to grab yours.",
  images: [
    "/products/Final 1.jpg",
    "/products/Final 2.jpg",
  ],
  // optional (keep if your current card uses product.image)
  image: "/products/Final 1.jpg",
  isNew: true,
},

{
  id: "k002",
  name: "Cute Crab",
  slug: "cute-crab",
  category: "keychains",
  subCategory: "cute",
  priceUSD: 2,
  description:
    "This crab has one job: make your keys look cooler 🦀🔥\nHandmade vibes, clean details, and that “I need it” look.\nAvailable now, DM to grab yours.",
  images: [
    "/products/Final 1.jpg",
    "/products/Final 2.jpg",
  ],
  // optional (keep if your current card uses product.image)
  image: "/products/Final 1.jpg",
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

  {
  id: "t001",
    name: "Caliper Card",
    slug: "caliper-card",
    category: "keychains",
  subCategory: "cute",
  priceUSD: 2,
  description:
    "This crab has one job: make your keys look cooler 🦀🔥\nHandmade vibes, clean details, and that “I need it” look.\nAvailable now, DM to grab yours.",
  images: [
    "",
    "",
  ],
  // optional (keep if your current card uses product.image)
  image: "/products/Final 1.jpg",
  isNew: true,
},
];
