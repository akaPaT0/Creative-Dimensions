import CategoryPage from "../CategoryPage";

export default function Page() {
  return (
    <CategoryPage
      title="New Arrivals"
      intro="The latest prints from every category."
      path="/shop/new-arrivals"
      select={(p) => p.isNew === true}
      labelByCategory
      emptyTitle="Nothing new right now"
      emptyText="New prints land here first. Check back soon."
    />
  );
}
