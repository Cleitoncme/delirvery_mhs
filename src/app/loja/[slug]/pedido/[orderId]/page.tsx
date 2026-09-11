import { notFound } from "next/navigation";
import { catalogService } from "@/services/catalog";
import { OrderTracking } from "@/features/orders/order-pages";
export default async function TrackingPage({params}:{params:Promise<{slug:string;orderId:string}>}){const {slug,orderId}=await params;const tenant=catalogService.getTenant(slug);if(!tenant)notFound();return <OrderTracking tenant={tenant} id={orderId}/>;}
