import CategoryPage from "../CategoryPage";

export default function Page() {
  return (
    <CategoryPage
      title="Keychains"
      intro="Car fronts, logos and small fun pieces, printed to order."
      path="/shop/keychains"
      jsonLdName="3D Printed Keychains in Lebanon"
      select={(p) => p.category === "keychains"}
    />
  );
}
