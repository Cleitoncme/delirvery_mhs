"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductArt } from "./product-art";
import { money } from "@/lib/format";
import type { Product } from "@/types/domain";
import { useCart } from "@/features/cart/store";
import { useHydrated } from "@/lib/use-hydrated";
import { catalogService } from "@/services/catalog";
export function ProductCard({ product, slug }: { product: Product; slug: string }) {
  const add=useCart(s=>s.add); const hydrated=useHydrated(); const href=`/loja/${slug}/produto/${product.id}`; const open=catalogService.getTenant(slug)?.isOpen;
  return <article className="product-card"><Link href={href}><div className="art-wrap">{product.compareAtPrice && <span className="offer-tag">OFERTA</span>}<ProductArt kind={product.illustration} name={product.name}/></div></Link><div className="product-info"><span className="product-category">{product.subcategory}</span><Link href={href}><h3>{product.name}</h3></Link><div className="price-row"><div>{product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}<strong>{money(product.price)}</strong><small> / {product.unit}</small></div>{product.configurable?<Link className="add-icon" href={href} aria-label={`Configurar ${product.name}`}><Plus size={18}/></Link>:<button className="add-icon" disabled={!hydrated||!product.available||!open} aria-label={`Adicionar ${product.name}`} onClick={()=>add(product.tenantId,{productId:product.id,quantity:1,optionIds:[]})}><Plus size={18}/></button>}</div>{!product.available && <span className="unavailable">Indisponível</span>}</div></article>;
}
