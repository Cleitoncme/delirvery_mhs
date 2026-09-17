import { redirect } from "next/navigation";import { getAdminSession } from "@/lib/admin-auth";import { AdminShell } from "@/features/admin/admin-shell";
export default async function AdminCouponsPage(){if(!(await getAdminSession()))redirect("/admin/login");return <AdminShell><main className="admin-main"><h1>Cupons</h1><p>Nenhum cupom cadastrado.</p></main></AdminShell>}
