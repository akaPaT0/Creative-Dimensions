import CategoryPage from "../CategoryPage";

export default function Page() {
  return (
    <CategoryPage
      title="Christmas"
      intro="Festive crabs, a tree advent calendar and personalised ornaments for your Christmas display."
      path="/shop/christmas"
      jsonLdName="3D Printed Christmas Decorations in Lebanon"
      select={(p) => p.category === "christmas"}
    />
  );
}
