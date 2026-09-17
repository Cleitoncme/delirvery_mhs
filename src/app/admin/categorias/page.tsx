import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { CatalogAdminView } from "@/features/admin/catalog-admin-view";
import { AdminShell } from "@/features/admin/admin-shell";
export default async function Page() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return <AdminShell><CatalogAdminView initialResource="categorias" /></AdminShell>;
}
