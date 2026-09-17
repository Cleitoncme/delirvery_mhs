import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { StoreSettingsView } from "@/features/admin/store-settings-view";
import { AdminShell } from "@/features/admin/admin-shell";
export default async function AdminSettingsPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return <AdminShell><StoreSettingsView /></AdminShell>;
}
