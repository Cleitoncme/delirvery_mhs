import { notFound } from "next/navigation";
import { catalogService } from "@/services/catalog";
import { AccountView } from "@/features/account/account-view";
export default async function AccountPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const tenant=catalogService.getTenant(slug);if(!tenant)notFound();return <AccountView tenant={tenant}/>;}
