"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductArt } from "./product-art";
import { money } from "@/lib/format";
import type { Product } from "@/types/domain";
export function ProductCard({ product, slug }: { product: Product; slug: string }) { return <article className="product-card"><Link href={`/loja/${slug}/produto/${product.id}`}><div className="art-wrap">{product.compareAtPrice && <span className="offer-tag">OFERTA</span>}<ProductArt kind={product.illustration} name={product.name}/></div><div className="product-info"><span className="product-category">{product.subcategory}</span><h3>{product.name}</h3><div className="price-row"><div>{product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}<strong>{money(product.price)}</strong><small> / {product.unit}</small></div><span className="add-icon"><ArrowUpRight size={18}/></span></div>{!product.available && <span className="unavailable">Indisponível</span>}</div></Link></article>; }
