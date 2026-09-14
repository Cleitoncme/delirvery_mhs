import { notFound } from "next/navigation";
import { getCatalog } from "@/services/catalog-db";
import { CatalogView } from "@/features/catalog/catalog-view";
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string; categoryId: string }>;
}) {
  const { slug, categoryId } = await params;
  const catalog = await getCatalog(slug);
  if (!catalog) notFound();
  const category = catalog.categories.find((item) => item.slug === categoryId);
  if (categoryId !== "destaques" && !category) notFound();
  return (
    <CatalogView
      key={categoryId}
      tenant={catalog.tenant}
      categories={catalog.categories}
      products={catalog.products}
      categoryId={category?.id ?? "destaques"}
    />
  );
}
