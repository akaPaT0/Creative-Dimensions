import CategoryPage from "../CategoryPage";

export default function Page() {
  return (
    <CategoryPage
      title="Halloween"
      intro="Ghost bowls, skulls, bats and colourful coffin lanterns for your spooky display."
      path="/shop/halloween"
      jsonLdName="3D Printed Halloween Decorations in Lebanon"
      select={(p) => p.category === "halloween"}
    />
  );
}
