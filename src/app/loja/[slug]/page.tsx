import { notFound } from "next/navigation";
import { catalogService } from "@/services/catalog";
import { CatalogView } from "@/features/catalog/catalog-view";
export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = catalogService.getTenant(slug);
  if (!tenant) notFound();
  return <CatalogView tenant={tenant} />;
}
