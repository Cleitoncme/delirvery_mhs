import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { StoreSettingsView } from "@/features/admin/store-settings-view";
export default async function AdminSettingsPage(){if(!(await getAdminSession())) redirect("/admin/login"); return <StoreSettingsView/>;}
