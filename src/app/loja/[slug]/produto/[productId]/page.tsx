import { notFound } from "next/navigation";
import { getCatalog } from "@/services/catalog-db";
import { ProductDetail } from "@/features/catalog/product-detail";
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;
  const catalog = await getCatalog(slug);
  if (!catalog) notFound();
  const product = catalog.products.find((item) => item.slug === productId);
  if (!product) notFound();
  return <ProductDetail product={product} tenant={catalog.tenant} />;
}
