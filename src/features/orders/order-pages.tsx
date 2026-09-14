"use client";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock3,
  MapPin,
  PackageCheck,
} from "lucide-react";
import { useOrders } from "./store";
import { money } from "@/lib/format";
import type { DeliveryOrderStatus, Tenant } from "@/types/domain";

const statusNames: Record<DeliveryOrderStatus, string> = {
  NEW: "Pedido recebido",
  PREPARING: "Em separação",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  COMPLETED: "Entregue",
  CANCELED: "Cancelado",
};
const flow: DeliveryOrderStatus[] = [
  "NEW",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
];
export function OrderSuccess({ tenant, id }: { tenant: Tenant; id: string }) {
  const order = useOrders((s) => s.get(id));
  if (!order) return <Missing tenant={tenant} />;
  return (
    <section className="success-page">
      <CheckCircle2 size={62} />
      <span className="eyebrow">PEDIDO RECEBIDO</span>
      <h1>
        Pedido realizado
        <br />
        com sucesso!
      </h1>
      <p>
        Seu pedido <strong>#{order.number}</strong> foi recebido. Este é um
        pedido demonstrativo.
      </p>
      <OrderTimeline status={order.status} history={order.history} />
      <Link className="button wide" href={`/loja/${tenant.slug}/pedido/${id}`}>
        Acompanhar pedido
      </Link>
      <Link className="text-link" href={`/loja/${tenant.slug}`}>
        Voltar para a loja
      </Link>
    </section>
  );
}
export function OrderTracking({ tenant, id }: { tenant: Tenant; id: string }) {
  const order = useOrders((s) => s.get(id));
  if (!order) return <Missing tenant={tenant} />;
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">ACOMPANHAMENTO</span>
          <h1>Pedido #{order.number}</h1>
        </div>
        <span className="badge">● {statusNames[order.status]}</span>
      </div>
      <div className="checkout-grid">
        <section className="panel">
          <div className="estimate">
            <Clock3 size={20} />
            <div>
              <strong>
                {order.status === "COMPLETED"
                  ? "Pedido entregue"
                  : "Previsão de entrega"}
              </strong>
              <p>
                {order.fulfillmentType === "PICKUP"
                  ? "15 a 30 min"
                  : "30 a 60 min"}
              </p>
            </div>
          </div>
          <OrderTimeline status={order.status} history={order.history} />
        </section>
        <section className="panel">
          <h2>Resumo</h2>
          <p>
            <MapPin size={15} />{" "}
            {order.fulfillmentType === "DELIVERY" && order.address
              ? `${order.address.street}, ${order.address.number} • ${order.address.neighborhood}`
              : "Retirada na loja"}
          </p>
          <p>
            {order.items.length
              ? `${order.items.reduce((s, i) => s + i.quantity, 0)} itens`
              : "Itens demonstrativos"}
          </p>
          <strong className="confirm-total">{money(order.total)}</strong>
        </section>
      </div>
    </>
  );
}
export function OrderTimeline({
  status,
  history,
}: {
  status: DeliveryOrderStatus;
  history: { status: DeliveryOrderStatus; at: string }[];
}) {
  const current = flow.indexOf(status);
  return (
    <ol className="timeline">
      {flow.map((item, index) => {
        const entry = history.find((h) => h.status === item);
        const done = index <= current && status !== "CANCELED";
        return (
          <li key={item} className={done ? "done" : ""}>
            {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            <div>
              <strong>{statusNames[item]}</strong>
              {entry && (
                <small>
                  {new Intl.DateTimeFormat("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(entry.at))}
                </small>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
function Missing({ tenant }: { tenant: Tenant }) {
  return (
    <section className="success-page">
      <PackageCheck size={52} />
      <h1>Pedido não encontrado</h1>
      <p>Os pedidos de demonstração existem apenas durante esta sessão.</p>
      <Link className="button" href={`/loja/${tenant.slug}`}>
        Voltar para a loja
      </Link>
    </section>
  );
}
