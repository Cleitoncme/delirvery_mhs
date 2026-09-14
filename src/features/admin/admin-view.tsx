"use client";
import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Tags,
  Users,
  Ticket,
  ChartNoAxesCombined,
  Settings,
  Plug,
  X,
  ArrowRight,
  Search,
} from "lucide-react";
import { useOrders } from "@/features/orders/store";
import { money } from "@/lib/format";
import type { DeliveryOrderStatus, Order } from "@/types/domain";
const columns: { status: DeliveryOrderStatus; label: string }[] = [
  { status: "NEW", label: "Novos" },
  { status: "PREPARING", label: "Em preparo" },
  { status: "READY", label: "Prontos" },
  { status: "OUT_FOR_DELIVERY", label: "Em entrega" },
  { status: "COMPLETED", label: "Concluídos" },
];
const next: Partial<Record<DeliveryOrderStatus, DeliveryOrderStatus>> = {
  NEW: "PREPARING",
  PREPARING: "READY",
  READY: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "COMPLETED",
};
const nav = [
  LayoutDashboard,
  ClipboardList,
  Package,
  Tags,
  Users,
  Ticket,
  ChartNoAxesCombined,
  Settings,
  Plug,
];
const names = [
  "Visão geral",
  "Pedidos",
  "Produtos",
  "Categorias",
  "Clientes",
  "Cupons",
  "Relatórios",
  "Configurações",
  "Integrações",
];
export function AdminView() {
  const orders = useOrders((s) => s.orders);
  const transition = useOrders((s) => s.transition);
  const [selected, setSelected] = useState<Order | null>(null);
  const [query, setQuery] = useState("");
  const visible = orders.filter((o) =>
    `${o.number} ${o.customer.name}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/admin" className="brand">
          <span className="brand-mark">
            mhs<span>●</span>
          </span>
        </Link>
        <nav>
          {names.map((name, i) => {
            const Icon = nav[i];
            return (
              <a
                href={name === "Pedidos" ? "#pedidos" : "#"}
                className={name === "Pedidos" ? "active" : ""}
                key={name}
              >
                <Icon size={19} />
                {name}
              </a>
            );
          })}
        </nav>
        <small>Dados demonstrativos</small>
      </aside>
      <main className="admin-main">
        <header>
          <div>
            <span className="eyebrow">PAINEL ADMINISTRATIVO</span>
            <h1>Pedidos</h1>
          </div>
          <span className="admin-user">MT</span>
        </header>
        <p className="demo-notice">
          Acesso demonstrativo: não há autenticação nem dados reais. Produção
          exige RBAC e isolamento por tenant no servidor.
        </p>
        <label className="admin-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por pedido ou cliente"
            aria-label="Buscar pedidos"
          />
        </label>
        <section id="pedidos" className="kanban">
          {columns.map((column) => {
            const list = visible.filter((o) => o.status === column.status);
            return (
              <div className="kanban-column" key={column.status}>
                <h2>
                  {column.label}
                  <span>{list.length}</span>
                </h2>
                {list.map((order) => (
                  <button
                    className="order-card"
                    key={order.id}
                    onClick={() => setSelected(order)}
                  >
                    <strong>#{order.number}</strong>
                    <span>{order.customer.name}</span>
                    <b>{money(order.total)}</b>
                    <small>
                      {new Intl.DateTimeFormat("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(order.createdAt))}
                    </small>
                  </button>
                ))}
              </div>
            );
          })}
        </section>
      </main>
      {selected && (
        <aside
          className="order-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          <button
            className="icon-button"
            aria-label="Fechar detalhes"
            onClick={() => setSelected(null)}
          >
            <X size={20} />
          </button>
          <span className="eyebrow">PEDIDO</span>
          <h2 id="drawer-title">#{selected.number}</h2>
          <h3>Cliente</h3>
          <p>
            {selected.customer.name}
            <br />
            {selected.customer.phone}
          </p>
          <h3>Entrega</h3>
          <p>
            {selected.fulfillmentType === "DELIVERY" && selected.address
              ? `${selected.address.street}, ${selected.address.number}`
              : "Retirada na loja"}
          </p>
          <h3>Itens</h3>
          {selected.items.length ? (
            selected.items.map((item) => (
              <p key={item.id}>
                {item.quantity}× {item.productName}{" "}
                <strong>{money(item.total)}</strong>
              </p>
            ))
          ) : (
            <p>Itens do pedido demonstrativo inicial.</p>
          )}
          <div className="drawer-total">
            <span>Total</span>
            <strong>{money(selected.total)}</strong>
          </div>
          <p>
            Pagamento:{" "}
            {selected.paymentMethod === "PIX"
              ? "PIX"
              : selected.paymentMethod === "CASH"
                ? "Dinheiro"
                : "Cartão na entrega"}
          </p>
          {next[selected.status] && (
            <button
              className="wide"
              onClick={() => {
                transition(selected.id, next[selected.status]!);
                setSelected({ ...selected, status: next[selected.status]! });
              }}
            >
              {selected.status === "NEW"
                ? "Aceitar pedido"
                : selected.status === "PREPARING"
                  ? "Marcar como pronto"
                  : selected.status === "READY"
                    ? "Saiu para entrega"
                    : "Concluir pedido"}
              <ArrowRight size={17} />
            </button>
          )}
        </aside>
      )}
    </div>
  );
}
