import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { CatalogAdminView } from "@/features/admin/catalog-admin-view";
export default async function Page() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return <CatalogAdminView initialResource="grupos" />;
}
