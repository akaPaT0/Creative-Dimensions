import CategoryPage from "../CategoryPage";

export default function Page() {
  return (
    <CategoryPage
      title="Christmas"
      intro="Christmas trees, ornaments, nativity scenes, figurines and personalised gifts for your festive display."
      path="/shop/christmas"
      jsonLdName="3D Printed Christmas Decorations in Lebanon"
      select={(p) => p.category === "christmas"}
    />
  );
}
