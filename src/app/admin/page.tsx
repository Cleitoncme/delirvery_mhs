import { AdminView } from "@/features/admin/admin-view";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
export default async function AdminPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return <AdminView />;
}
