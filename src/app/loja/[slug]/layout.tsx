import { notFound } from "next/navigation";
import { getCatalog } from "@/services/catalog-db";
import { StoreShell } from "@/components/delivery/store-shell";
export default async function StoreLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const catalog = await getCatalog(slug);
  if (!catalog) notFound();
  return <StoreShell tenant={catalog.tenant} catalog={catalog}>{children}</StoreShell>;
}
