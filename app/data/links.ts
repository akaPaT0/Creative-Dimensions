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

{
  title: "Inkscape",
  description: "Vector design",
  url: "https://inkscape.org/",
  category: "Design",
  tags: ["inkscape", "vector", "svg", "design", "illustration", "graphics"],
},
{
  title: "Illustrator",
  description: "Vector design",
  url: "https://www.adobe.com/products/illustrator.html",
  category: "Design",
  tags: ["illustrator", "adobe", "vector", "svg", "design", "graphics"],
},
{
  title: "Clipchamp",
  description: "Video editor",
  url: "https://clipchamp.com/",
  category: "Media",
  tags: ["clipchamp", "video", "editing", "editor", "content", "media"],
},
{
  title: "Blender",
  description: "3D creation",
  url: "https://www.blender.org/",
  category: "3D",
  tags: ["blender", "3d", "modeling", "animation", "rendering", "design"],
},
{
  title: "Supabase",
  description: "Backend platform",
  url: "https://supabase.com/",
  category: "Development",
  tags: ["supabase", "database", "backend", "auth", "storage", "development"],
},
{
  title: "SpotiDown",
  description: "Spotify downloader",
  url: "https://spotidown.co/",
  category: "Media",
  tags: ["spotidown", "spotify", "music", "download", "audio", "media"],
},
{
  title: "OpenArt Kling 2.6",
  description: "AI video animation",
  url: "https://openart.ai/suite/animate-video/kling2-6",
  category: "AI",
  tags: ["openart", "kling", "kling 2.6", "ai", "video", "animation", "generate"],
},


];

