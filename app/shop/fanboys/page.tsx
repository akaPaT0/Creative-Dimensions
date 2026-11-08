import CategoryPage from "../CategoryPage";

export default function Page() {
  return (
    <CategoryPage
      title="Fanboys"
      intro="Figurines and props from the games and shows you love."
      path="/shop/fanboys"
      jsonLdName="3D Printed Figurines & Collectibles in Lebanon"
      select={(p) => p.category === "fanboys"}
    />
  );
}
