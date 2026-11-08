import CategoryPage from "../CategoryPage";

export default function Page() {
  return (
    <CategoryPage
      title="Desk Add-Ons"
      intro="Holders and stands for your desk, counter or shop."
      path="/shop/desk-add-ons"
      jsonLdName="3D Printed Desk Accessories in Lebanon"
      select={(p) => p.category === "desk-add-ons"}
    />
  );
}
