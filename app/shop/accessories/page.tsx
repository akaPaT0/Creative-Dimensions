import CategoryPage from "../CategoryPage";

export default function Page() {
  return (
    <CategoryPage
      title="Accessories"
      intro="Lighter covers and pocket gear, printed to order."
      path="/shop/accessories"
      jsonLdName="3D Printed Accessories in Lebanon"
      select={(p) => p.category === "accessories"}
    />
  );
}
