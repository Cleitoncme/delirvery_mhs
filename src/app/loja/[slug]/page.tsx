import { notFound } from "next/navigation";
import { getCatalog } from "@/services/catalog-db";
import { CatalogView } from "@/features/catalog/catalog-view";
export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalog(slug);
  if (!catalog) notFound();
  return (
    <CatalogView
      tenant={catalog.tenant}
      categories={catalog.categories}
      products={catalog.products}
    />
  );
}
