import { notFound } from "next/navigation";
import { catalogService } from "@/services/catalog";
import { CheckoutView } from "@/features/checkout/checkout-view";
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = catalogService.getTenant(slug);
  if (!tenant) notFound();
  return <CheckoutView tenant={tenant} />;
}
