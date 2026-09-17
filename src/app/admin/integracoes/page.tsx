import { redirect } from "next/navigation";import { getAdminSession } from "@/lib/admin-auth";import { AdminShell } from "@/features/admin/admin-shell";
export default async function AdminIntegrationsPage(){if(!(await getAdminSession()))redirect("/admin/login");return <AdminShell><main className="admin-main"><h1>Integrações</h1><p>Nenhuma integração configurada.</p></main></AdminShell>}
