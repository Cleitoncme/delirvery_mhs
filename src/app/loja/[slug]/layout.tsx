import { notFound } from "next/navigation";
import { catalogService } from "@/services/catalog";
import { StoreShell } from "@/components/delivery/store-shell";
export default async function StoreLayout({ params, children }: { params: Promise<{ slug: string }>; children: React.ReactNode }) { const { slug } = await params; const tenant = catalogService.getTenant(slug); if (!tenant) notFound(); return <StoreShell tenant={tenant}>{children}</StoreShell>; }
