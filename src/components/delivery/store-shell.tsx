"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, MapPin, ShoppingBag, Home, Grid2X2, UserRound, ArrowUpRight } from "lucide-react";
import type { Tenant } from "@/types/domain";
import { useEffect } from "react";
import { useCart } from "@/features/cart/store";
export function StoreShell({ tenant, children }: { tenant: Tenant; children: React.ReactNode }) {
  const path = usePathname(); const base = `/loja/${tenant.slug}`;
  const count=useCart(s=>(s.carts[tenant.id]??[]).reduce((sum,i)=>sum+i.quantity,0)); const message=useCart(s=>s.message);
  useEffect(()=>{void useCart.persist.rehydrate();},[]);
  useEffect(()=>{if(!message) return; const timer=setTimeout(()=>useCart.setState({message:""}),3500); return ()=>clearTimeout(timer);},[message]);
  const links = [{ href: base, label: "Início", icon: Home }, { href: `${base}#categorias`, label: "Categorias", icon: Grid2X2 }, { href: `${base}/carrinho`, label: "Carrinho", icon: ShoppingBag }, { href: `${base}/conta`, label: "Conta", icon: UserRound }];
  return <><div className="demo-bar">Ambiente de demonstração • pedidos e pagamentos simulados</div><header className="store-header"><div className="container header-inner"><Link className="brand" href={base}><span className="brand-mark">mhs<span>●</span></span><span className="brand-caption">SOLUÇÕES EM<br/>AUTOMAÇÃO COMERCIAL</span></Link><span className="header-location"><MapPin size={17}/> Qualidade perto de você</span><Link href={`${base}/conta`} className="icon-button" aria-label="Minha conta"><UserRound size={22}/></Link></div></header><div className="store-intro container"><div><span className="eyebrow">SEU MERCADO DE TODOS OS DIAS</span><h2>{tenant.name}</h2><p>Qualidade perto de você!</p></div><div className="store-meta"><span className={tenant.isOpen ? "badge" : "badge closed"}>{tenant.isOpen ? "● Aberto agora" : tenant.opensAt ? `Abre às ${tenant.opensAt}` : "Fechado"}</span><span><Clock3 size={14}/>{tenant.openingHoursLabel}</span><span>Entrega em 30–60 min <ArrowUpRight size={14}/></span></div></div><main id="main" className="container store-main">{children}</main><footer className="store-footer container"><span className="brand-mark small">mhs<span>●</span></span><p>Mais perto de você, em cada pedido.</p><small>Protótipo MHS • Dados fictícios</small></footer><nav className="bottom-nav" aria-label="Navegação da loja">{links.map(({href,label,icon:Icon}) => <Link key={label} href={href} className={path === href ? "active" : ""} aria-current={path === href ? "page" : undefined}><Icon size={21}/>{label==="Carrinho" && count>0 && <b className="cart-badge">{count}</b>}<span>{label}</span></Link>)}</nav>{message && <div className="toast" role="status" key={message}>{message}</div>}</>;
}
