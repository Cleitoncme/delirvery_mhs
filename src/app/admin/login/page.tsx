import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminLogin } from "@/features/admin/login-view";
export default async function AdminLoginPage() {
  if (process.env.ADMIN_ENABLED !== "true")
    return (
      <main id="main" className="container store-main">
        <h1>Acesso administrativo desabilitado</h1>
        <p>Solicite a configuração ao responsável pelo sistema.</p>
      </main>
    );
  if (await getAdminSession()) redirect("/admin");
  return <AdminLogin />;
}
