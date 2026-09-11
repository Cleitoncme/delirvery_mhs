import { notFound } from "next/navigation";
import { catalogService } from "@/services/catalog";
import { CatalogView } from "@/features/catalog/catalog-view";
export default async function CategoryPage({ params }: { params: Promise<{ slug: string; categoryId: string }> }) { const { slug, categoryId } = await params; const tenant = catalogService.getTenant(slug); if(!tenant || (categoryId !== "destaques" && !catalogService.getCategories(tenant.id).some(c=>c.id===categoryId))) notFound(); return <CatalogView key={categoryId} tenant={tenant} categoryId={categoryId}/>; }
