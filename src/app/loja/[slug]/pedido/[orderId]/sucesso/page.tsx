import { notFound } from "next/navigation";
import { getCatalog } from "@/services/catalog-db";
import { OrderSuccess } from "@/features/orders/order-pages";
export default async function SuccessPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const catalog = await getCatalog(slug);
  if (!catalog) notFound();
  return <OrderSuccess tenant={catalog.tenant} id={orderId} />;
}
