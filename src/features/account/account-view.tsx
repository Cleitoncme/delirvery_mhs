"use client";
import Link from "next/link";
import {
  ClipboardList,
  MapPin,
  CreditCard,
  UserRound,
  Ticket,
  MessageCircle,
  LogOut,
} from "lucide-react";
import type { Tenant } from "@/types/domain";
const items = [
  { label: "Meus pedidos", icon: ClipboardList },
  { label: "Meus endereços", icon: MapPin },
  { label: "Formas de pagamento", icon: CreditCard },
  { label: "Meus dados", icon: UserRound },
  { label: "Cupons", icon: Ticket },
  { label: "Atendimento", icon: MessageCircle },
];
export function AccountView({ tenant }: { tenant: Tenant }) {
  return (
    <section className="account">
      <span className="eyebrow">ÁREA DEMONSTRATIVA</span>
      <h1>Minha conta</h1>
      <div className="account-card">
        <div className="avatar">MT</div>
        <div>
          <h2>Maria Teste</h2>
          <p>
            maria@exemplo.com
            <br />
            (49) 99999-9999
          </p>
        </div>
      </div>
      <div className="account-menu">
        {items.map(({ label, icon: Icon }) => (
          <button key={label} type="button">
            <Icon size={20} />
            <span>{label}</span>
            <b>›</b>
          </button>
        ))}
        <Link href={`/loja/${tenant.slug}`}>
          <LogOut size={20} />
          <span>Sair da demonstração</span>
        </Link>
      </div>
      <p className="demo-notice">
        Esta tela ilustra a experiência. Dados de conta não são armazenados
        neste protótipo.
      </p>
    </section>
  );
}
