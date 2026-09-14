import { notFound } from "next/navigation";
import { getCatalog } from "@/services/catalog-db";
import { OrderTracking } from "@/features/orders/order-pages";
export default async function TrackingPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const catalog = await getCatalog(slug);
  if (!catalog) notFound();
  return <OrderTracking tenant={catalog.tenant} id={orderId} />;
}
