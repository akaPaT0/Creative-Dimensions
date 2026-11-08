import CategoryPage from "../CategoryPage";

export default function Page() {
  return (
    <CategoryPage
      title="Tools"
      intro="Maker gear and utilities."
      path="/shop/tools"
      select={(p) => p.category === "tools"}
      emptyTitle="Coming soon"
      emptyText="We’re still putting this section together. Need a tool or part printed now? Get a quote below."
    />
  );
}
