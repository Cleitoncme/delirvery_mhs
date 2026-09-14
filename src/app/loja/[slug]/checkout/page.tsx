import { notFound } from "next/navigation";
import { getCatalog } from "@/services/catalog-db";
import { CheckoutView } from "@/features/checkout/checkout-view";
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalog(slug);
  if (!catalog) notFound();
  return <CheckoutView tenant={catalog.tenant} />;
}
