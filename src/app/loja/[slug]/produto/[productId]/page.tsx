import { notFound } from "next/navigation";
import { catalogService } from "@/services/catalog";
import { ProductDetail } from "@/features/catalog/product-detail";
export default async function ProductPage({ params }: { params:Promise<{slug:string;productId:string}> }) { const {slug,productId}=await params; const tenant=catalogService.getTenant(slug); if(!tenant) notFound(); const product=catalogService.getProduct(tenant.id,productId); if(!product) notFound(); return <ProductDetail product={product} tenant={tenant}/>; }
