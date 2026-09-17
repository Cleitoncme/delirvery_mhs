import { redirect } from "next/navigation";import { getAdminSession } from "@/lib/admin-auth";import { AdminShell } from "@/features/admin/admin-shell";
export default async function AdminCustomersPage() { if (!(await getAdminSession())) redirect("/admin/login");
  return <AdminShell><main className="admin-main"><h1>Clientes</h1><p>O cadastro e histórico de clientes serão disponibilizados nesta área.</p></main></AdminShell>;
}
