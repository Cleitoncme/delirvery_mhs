import { notFound } from "next/navigation";
import { catalogService } from "@/services/catalog";
import { OrderSuccess } from "@/features/orders/order-pages";
export default async function SuccessPage({params}:{params:Promise<{slug:string;orderId:string}>}){const {slug,orderId}=await params;const tenant=catalogService.getTenant(slug);if(!tenant)notFound();return <OrderSuccess tenant={tenant} id={orderId}/>;}
