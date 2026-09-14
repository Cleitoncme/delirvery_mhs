import { notFound } from "next/navigation";
import { getCatalog } from "@/services/catalog-db";
import { AccountView } from "@/features/account/account-view";
export default async function AccountPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalog(slug);
  if (!catalog) notFound();
  return <AccountView tenant={catalog.tenant} />;
}
