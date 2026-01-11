export type Category = string;

export type SubCategory = string;

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: Category;
  subCategory?: SubCategory; // ✅ add this
  priceUSD: number;
  description: string;
  isNew?: boolean;
  featured?: boolean;
  image?: string;
  images?: string[];
};

export const products: Product[] = [
  {
    id: "KECU001",
    name: "Cute Crab",
    slug: "cute-crab",
    category: "keychains",
    subCategory: "cute",
    priceUSD: 2,
    description:
      "This crab has one job: make your keys look cooler 🦀🔥\nHandmade vibes, clean details, and that “I need it” look.\nAvailable now, DM to grab yours.",
    images: ["/products/Cute_Crab_1.webp", "/products/Cute_Crab_2.webp"],

    isNew: true,
    featured: true,
  },

  {
    id: "KECU002",
    name: "Half-skeleton cat keychain",
    slug: "half-skeleton-cat-keychain",
    category: "keychains",
    subCategory: "cute",
    priceUSD: 2.5,
    description:
      "Cute on one side, spooky on the other. This half-and-half cat design mixes a clean cat silhouette with a skeleton detail for a fun “sweet but dark” vibe\nLightweight, durable, and perfect for keys, bags, or as a small gift. \nAvailable in different color combos (like the ones shown). DM to order or customize.",
    images: [
      "/products/Cat Half Skel 1-1.webp",
      "/products/Cat Half Skel 1-2.webp",
      "/products/Cat Half Skel 1-3.webp",
      "/products/Cat Half Skel 1-4.webp",
      "/products/Cat Half Skel 1-5.webp",
      "/products/Cat Half Skel 1-6.webp",
    ],

    isNew: true,
    featured: true,
  },

  {
    id: "KECA001",
    name: "Shock Absorber Keychain",
    slug: "shock-absorber-keychain",
    category: "keychains",
    subCategory: "cars",
    priceUSD: 2,
    description: `A mini suspension-inspired keychain made for anyone who’s into cars, builds, and clean mechanical details.
The layered design gives it a realistic look, and it’s a perfect add-on for your daily keys without taking up much space.
Available in multiple color combos (spring + body).
DM to order or customize your colors.`,
    images: [
      "/products/Shock Absorber 1-1.webp",
      "/products/Shock Absorber 1-2.webp",
      "/products/Shock Absorber 1-3.webp",
    ],

    isNew: true,
    featured: true,
  },

  {
    id: "KECA002",
    name: "BMW Front E92",
    slug: "bmw-front-e92",
    category: "keychains",
    subCategory: "cars",
    priceUSD: 2,
    description:
      "BMW front-end keychain 🚘🖤\nIconic BMW-inspired bumper design with the signature kidney grille and headlights, made for anyone who’s into clean German-car vibes. The layered cutouts give it depth and it looks sharp on keys, bags, or a rearview tag.\nAvailable in multiple colors and combos (like the ones shown). DM to order or customize your own colors.",

    images: [
      "/products/BMW 1-6.webp",
      "/products/BMW 1-7.webp",
      "/products/BMW 1-5.webp",
      "/products/BMW 1-2.webp",
      "/products/BMW 1-3.webp",
      "/products/BMW 1-4.webp",
    ],

    isNew: true,
    featured: false,
  },

  {
    id: "KECA003",
    name: "Mercedes grille keychain",
    slug: "mercedes-grille-keychain",
    category: "keychains",
    subCategory: "cars",
    priceUSD: 2,
    description:
      "Mercedes grille keychain 🔥🚘\nA clean front-end inspired design made for car lovers who notice the details. The layered look gives it depth, and it sits nice on your keys without feeling bulky.\nAvailable in multiple color combos (like the ones shown). DM to order or customize your own colors.",

    images: [
      "/products/Mercedes 2-4.webp",
      "/products/Mercedes 2-5.webp",
      "/products/Mercedes 2-6.webp",
      "/products/Mercedes 2-1.webp",
      "/products/Mercedes 2-2.webp",
      "/products/Mercedes 2-3.webp",
    ],

    isNew: true,
    featured: false,
  },

  {
    id: "KECA004",
    name: "Mercedes front-end keychain",
    slug: "mercedes-front-end-keycahin",
    category: "keychains",
    subCategory: "cars",
    priceUSD: 2,
    description:
      "Mercedes front-end keychain 🚘🖤\nA clean Mercedes-inspired bumper design with the signature grille and headlight shape, made for anyone who loves that classic luxury-car look. The layered details give it depth, and it sits nicely on keys or bags without feeling oversized.\nAvailable in multiple colors and combos (like the ones shown). DM to order or customize your colors.",
    images: [
      "/products/Mercedes 3-1.webp",
      "/products/Mercedes 3-2.webp",
      "/products/Mercedes 3-4.webp",
      "/products/Mercedes 3-3.webp",
      "/products/Mercedes 3-6.webp",
      "/products/Mercedes 3-7.webp",
      "/products/Mercedes 3-5.webp",
      "/products/Mercedes 3-8.webp",
    ],

    isNew: true,
    featured: false,
  },

  {
    id: "KECA005",
    name: "Mercedes-inspired emblem keychain",
    slug: "mercedes-inspired-emblem-keychain",
    category: "keychains",
    subCategory: "cars",
    priceUSD: 2,
    description:
      "Mercedes-inspired emblem keychain ✨🚘\nClean, bold, and made to upgrade your everyday keys with a sleek automotive vibe.\nLightweight, durable, and perfect as a small gift for any car lover.\nAvailable in multiple colors and finishes. DM to order or customize.",
    images: ["/products/Mercedes 1-2.webp", "/products/Mercedes 1-1.webp"],

    isNew: true,
    featured: true,
  },

  {
    id: "KECA006",
    name: "BMW logo keychain ",
    slug: "bmw-logo-keychain",
    category: "keychains",
    subCategory: "cars",
    priceUSD: 2,
    description:
      "BMW logo keychain 🖤🚘\nClean, simple, and instantly recognizable. This BMW-inspired emblem keychain is made for daily carry and looks great on car keys, backpacks, or as a small gift for any BMW fan.\nAvailable in multiple colors and finishes. DM to order or customize.",
    images: ["/products/BMW 2-2.webp", "/products/BMW 2-1.webp"],

    isNew: true,
    featured: true,
  },

  {
    id: "KECA007",
    name: "Rim wheel keychain ",
    slug: "rim-wheel-keychain",
    category: "keychains",
    subCategory: "cars",
    priceUSD: 2,
    description:
      "Rim wheel keychain 🛞✨\nFor the people who stare at wheels a little longer than they should. Clean multi-spoke rim design with a bold tire profile, made to give your keys that car-guy (or car-girl) touch without being oversized.\nAvailable in different colors and combos for the rim + tire. DM to order.",
    images: ["/products/RIM 1-2.webp", "/products/RIM 1-1.webp"],

    isNew: true,
    featured: false,
  },

  {
    id: "MIAS003",
    name: "Minecraft Armor Stand",
    slug: "minecraft-armor-stand",
    category: "fanboys",
    subCategory: "minecraft",
    priceUSD: 5,
    description:
      "Minecraft Armor Figure + Weapons Set 🧱⚔️🪓✨\nIron, Diamond, or Gold armor figure with clean blocky details made for desk decor, shelves, and gifts.\nIncludes matching swords + axes designed to fit and match our Minecraft armor figures.\nDM to order, choose your armor type, and confirm your set.",
    images: [
      "/products/Minecraft/Stand Iron 1.webp",
      "/products/Minecraft/Stand Gold 1.webp",
      "/products/Minecraft/Stand Diamond 1.webp",
      "/products/Minecraft/Stand Iron w Sword 1.webp",
      "/products/Minecraft/Stand Gold w Sword 1.webp",
      "/products/Minecraft/Stand Diamond w Sword 1.webp",
      "/products/Minecraft/Iron Sword 1.webp",
      "/products/Minecraft/Iron Axe 1.webp",
      "/products/Minecraft/Gold Sword 1.webp",
      "/products/Minecraft/Gold Axe 1.webp",
      "/products/Minecraft/Diamon Sword 1.webp",
      "/products/Minecraft/Diamond Axe 1.webp",
    ],

    isNew: true,
    featured: true,
  },

{
  id: "KECU003",
  name: "crab head",
  slug: "crab-head",
  category: "keychains",
  subCategory: "cute",
  priceUSD: 2,
  description: "dada",
  images: ["/products/keychains/cute/crab-head-1.png"],
  isNew: true,
  featured: false,
},
];
