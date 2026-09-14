import { notFound } from "next/navigation";
import { getCatalog } from "@/services/catalog-db";
import { CartView } from "@/features/cart/cart-view";
export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalog(slug);
  if (!catalog) notFound();
  return <CartView tenant={catalog.tenant} />;
}
