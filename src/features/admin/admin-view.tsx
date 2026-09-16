"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useApiResource } from "@/lib/use-api-resource";
import { nextOrderStatus, orderStatusNames } from "@/lib/order-flow";
import { money } from "@/lib/format";
import type { DeliveryOrderStatus, Order } from "@/types/domain";
const columns: { status: DeliveryOrderStatus; label: string }[] = [
  { status: "NEW", label: "Novos" },
  { status: "PREPARING", label: "Em preparo" },
  { status: "READY", label: "Prontos" },
  { status: "OUT_FOR_DELIVERY", label: "Em entrega" },
  { status: "COMPLETED", label: "Concluídos" },
  { status: "CANCELED", label: "Cancelados" },
];
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
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryOrderStatus | "">("");
  const { data, error, refresh } = useApiResource<{
    orders: Order[];
    hasMore: boolean;
    role: string;
  }>(`/api/admin/pedidos?page=${page}&status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(query)}`);
  const orders = data?.orders ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = orders.find((order) => order.id === selectedId);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const nextStatus =
    selected && nextOrderStatus(selected.status, selected.fulfillmentType);
  async function transition() {
    if (!selected || !nextStatus || busy) return;
    setBusy(true);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/pedidos/${selected.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedStatus: selected.status,
          status: nextStatus,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Falha ao alterar o pedido.");
      setSelectedId(null);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Falha de conexão.",
      );
    } finally {
      setBusy(false);
      refresh();
    }
  }
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
                href={
                  name === "Pedidos"
                    ? "#pedidos"
                    : name === "Produtos"
                      ? "/admin/produtos"
                      : name === "Categorias"
                        ? "/admin/categorias"
                        : "#"
                }
                className={name === "Pedidos" ? "active" : ""}
                key={name}
              >
                <Icon size={19} />
                {name}
              </a>
            );
          })}
        </nav>
        <small>Gestão de pedidos</small>
      </aside>
      <main id="main" className="admin-main">
        <nav className="catalog-actions" aria-label="Catálogo administrativo">
          <Link href="/admin/produtos">Produtos</Link>
          <Link href="/admin/categorias">Categorias</Link>
          <Link href="/admin/complementos">Complementos</Link>
        </nav>
        <header>
          <div>
            <span className="eyebrow">PAINEL ADMINISTRATIVO</span>
            <h1>Pedidos</h1>
          </div>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const response = await fetch("/api/admin/session", {
                  method: "DELETE",
                });
                if (!response.ok)
                  throw new Error("Não foi possível encerrar a sessão.");
                router.replace("/admin/login");
                router.refresh();
              } catch {
                setActionError("Não foi possível sair. Tente novamente.");
                setBusy(false);
              }
            }}
          >
            Sair
          </button>
        </header>
        <p className="demo-notice">
          Atualização automática a cada 10 segundos.{" "}
          {data?.role === "VIEWER"
            ? "Seu perfil permite somente consulta."
            : "Selecione um pedido para avançar o atendimento."}
        </p>
        {(error || actionError) && (
          <p role="alert" className="field-error">
            {error || actionError}
          </p>
        )}
        {!data && !error && <p role="status">Carregando pedidos…</p>}
        <button onClick={refresh}>Atualizar pedidos</button>
        <label className="admin-search">
          Status
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as DeliveryOrderStatus | ""); setPage(0); }}>
            <option value="">Todos</option>
            {columns.map((column) => <option value={column.status} key={column.status}>{column.label}</option>)}
          </select>
        </label>
        {data && orders.length === 0 && <p>Nenhum pedido nesta página.</p>}
        <label className="admin-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nesta página por pedido ou cliente"
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
                    onClick={() => {
                      setSelectedId(order.id);
                      setActionError("");
                    }}
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
        <nav aria-label="Páginas de pedidos">
          <button
            disabled={page === 0 || busy}
            onClick={() => {
              setPage(page - 1);
              setSelectedId(null);
            }}
          >
            Anterior
          </button>
          <span> Página {page + 1} </span>
          <button
            disabled={!data?.hasMore || busy}
            onClick={() => {
              setPage(page + 1);
              setSelectedId(null);
            }}
          >
            Próxima
          </button>
        </nav>
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
            onClick={() => setSelectedId(null)}
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
          {selected.address && (
            <p>
              {selected.address.neighborhood} • {selected.address.city}/
              {selected.address.state}
              <br />
              {selected.address.complement} {selected.address.reference}
            </p>
          )}
          <h3>Itens</h3>
          {selected.items.length ? (
            selected.items.map((item) => (
              <p key={item.id}>
                {item.quantity}× {item.productName}{" "}
                <strong>{money(item.total)}</strong>
                {item.selectedOptions.length > 0 && (
                  <small>
                    <br />
                    {item.selectedOptions
                      .map((option) => option.name)
                      .join(", ")}
                  </small>
                )}
              </p>
            ))
          ) : (
            <p>Nenhum item registrado.</p>
          )}
          {selected.notes && (
            <p>
              <strong>Observações:</strong> {selected.notes}
            </p>
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
          {selected.paymentMethod === "CASH" && selected.changeFor != null && (
            <p>Troco para {money(selected.changeFor)}</p>
          )}
          <h3>Histórico</h3>
          <ul>
            {selected.history.map((entry, index) => (
              <li key={index}>
                {orderStatusNames[entry.status]} —{" "}
                {new Date(entry.at).toLocaleString("pt-BR")}
              </li>
            ))}
          </ul>
          {nextStatus && data?.role === "OPERATOR" && (
            <button
              className="wide"
              disabled={busy || !!error}
              onClick={transition}
            >
              {selected.status === "NEW"
                ? "Aceitar pedido"
                : selected.status === "PREPARING"
                  ? "Marcar como pronto"
                  : selected.status === "READY" &&
                      selected.fulfillmentType === "DELIVERY"
                    ? "Saiu para entrega"
                    : "Concluir pedido"}
              <ArrowRight size={17} />
            </button>
          )}
          {data?.role === "OPERATOR" && ["NEW", "PREPARING", "READY"].includes(selected.status) && (
            <button className="secondary-button wide" disabled={busy} onClick={async () => {
              const reason = window.prompt("Informe o motivo do cancelamento:");
              if (!reason?.trim()) return;
              setBusy(true); setActionError("");
              try {
                const response = await fetch(`/api/admin/pedidos/${selected.id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error ?? "Falha ao cancelar o pedido.");
                setSelectedId(null);
              } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Falha de conexão."); }
              finally { setBusy(false); refresh(); }
            }}>Cancelar pedido</button>
          )}
        </aside>
      )}
    </div>
  );
}
