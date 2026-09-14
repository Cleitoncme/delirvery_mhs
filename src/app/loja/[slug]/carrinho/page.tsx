import { notFound } from "next/navigation";
import { catalogService } from "@/services/catalog";
import { CartView } from "@/features/cart/cart-view";
export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = catalogService.getTenant(slug);
  if (!tenant) notFound();
  return <CartView tenant={tenant} />;
}
