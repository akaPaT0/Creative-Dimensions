export type SavedLink = {
  title: string;
  description: string;
  url: string;
  image?: string;
  category: string;
  tags: string[];
};

export const savedLinks: SavedLink[] = [
  {
    title: "Fusion",
    description: "CAD",
    url: "https://www.autodesk.com/products/fusion-360",
    image: "/links/fusion.jpg",
    category: "Design",
    tags: ["fusion", "cad", "3d", "design", "modeling"],
  },
  {
    title: "YouTube",
    description: "Videos",
    url: "https://www.youtube.com",
    category: "Media",
    tags: ["video", "media", "learning", "tutorials"],
  },

  {
  title: "Pixabay",
  description: "Free assets",
  url: "https://pixabay.com/",
  category: "Assets",
  tags: ["pixabay", "images", "photos", "videos", "music", "assets", "stock"],
},
{
  title: "Vercel",
  description: "Deployment",
  url: "https://vercel.com/",
  category: "Development",
  tags: ["vercel", "hosting", "deployment", "nextjs", "web", "frontend"],
},
{
  title: "Mixamo",
  description: "3D animation",
  url: "https://www.mixamo.com/",
  category: "3D",
  tags: ["mixamo", "3d", "animation", "rigging", "characters", "adobe"],
},
{
  title: "Canva",
  description: "Design",
  url: "https://www.canva.com/",
  category: "Design",
  tags: ["canva", "design", "graphics", "social media", "templates", "branding"],
},
{
  title: "SVG Repo",
  description: "SVG icons",
  url: "https://www.svgrepo.com/",
  category: "Assets",
  tags: ["svgrepo", "svg", "icons", "vectors", "assets", "ui"],
},
{
  title: "GitHub",
  description: "Code hosting",
  url: "https://github.com/",
  category: "Development",
  tags: ["github", "git", "code", "repository", "development", "version control"],
},
{
  title: "MyColor.Space",
  description: "Color palettes",
  url: "https://mycolor.space/",
  category: "Design",
  tags: ["mycolorspace", "color", "palette", "gradient", "design", "branding"],
},

];

