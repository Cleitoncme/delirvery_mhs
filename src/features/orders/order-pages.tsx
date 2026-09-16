"use client";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock3,
  MapPin,
  PackageCheck,
} from "lucide-react";
import { useApiResource } from "@/lib/use-api-resource";
import { money } from "@/lib/format";
import type { DeliveryOrderStatus, Tenant, Order } from "@/types/domain";
type TrackedOrder = Omit<
  Order,
  "customer" | "tenantId" | "address" | "notes" | "changeFor"
>;

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
  const { data: order, error } = useApiResource<TrackedOrder>(
    `/api/v1/lojas/${tenant.slug}/pedidos/${id}`,
  );
  if (error) return <Missing tenant={tenant} message={error} />;
  if (!order) return <p role="status">Carregando pedido…</p>;
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
      <OrderTimeline
        status={order.status}
        history={order.history}
        fulfillment={order.fulfillmentType}
      />
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
  const { data: order, error } = useApiResource<TrackedOrder>(
    `/api/v1/lojas/${tenant.slug}/pedidos/${id}`,
  );
  if (error) return <Missing tenant={tenant} message={error} />;
  if (!order) return <p role="status">Carregando pedido…</p>;
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">ACOMPANHAMENTO</span>
          <h1>Pedido #{order.number}</h1>
        </div>
        <span className="badge" role="status">
          ●{" "}
          {order.status === "COMPLETED" && order.fulfillmentType === "PICKUP"
            ? "Retirado"
            : statusNames[order.status]}
        </span>
      </div>
      <div className="checkout-grid">
        <section className="panel">
          <div className="estimate">
            <Clock3 size={20} />
            <div>
              <strong>
                {order.status === "COMPLETED"
                  ? "Pedido concluído"
                  : order.status === "CANCELED"
                    ? "Pedido cancelado"
                    : "Previsão de atendimento"}
              </strong>
              <p>
                {order.fulfillmentType === "PICKUP"
                  ? "15 a 30 min"
                  : "30 a 60 min"}
              </p>
            </div>
          </div>
          <OrderTimeline
            status={order.status}
            history={order.history}
            fulfillment={order.fulfillmentType}
          />
          <p>O status é atualizado automaticamente a cada 10 segundos.</p>
        </section>
        <section className="panel">
          <h2>Resumo</h2>
          <p>
            <MapPin size={15} />{" "}
            {order.fulfillmentType === "DELIVERY"
              ? "Entrega no endereço informado"
              : "Retirada na loja"}
          </p>
          <p>
            {order.items.length
              ? `${order.items.reduce((s, i) => s + i.quantity, 0)} itens`
              : "Nenhum item"}
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
  fulfillment = "DELIVERY",
}: {
  status: DeliveryOrderStatus;
  history: { status: DeliveryOrderStatus; at: string }[];
  fulfillment?: Order["fulfillmentType"];
}) {
  const steps = flow.filter(
    (item) => fulfillment !== "PICKUP" || item !== "OUT_FOR_DELIVERY",
  );
  const current = steps.indexOf(status);
  if (status === "CANCELED") return <p role="status">Pedido cancelado.</p>;
  return (
    <ol className="timeline">
      {steps.map((item, index) => {
        const entry = history.find((h) => h.status === item);
        const done = index <= current;
        return (
          <li key={item} className={done ? "done" : ""}>
            {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            <div>
              <strong>
                {item === "COMPLETED" && fulfillment === "PICKUP"
                  ? "Retirado"
                  : statusNames[item]}
              </strong>
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
function Missing({ tenant, message }: { tenant: Tenant; message: string }) {
  return (
    <section className="success-page">
      <PackageCheck size={52} />
      <h1>Não foi possível abrir o pedido</h1>
      <p role="alert">{message}</p>
      <p>
        Use o navegador em que o pedido foi realizado. O acesso de
        acompanhamento dura sete dias.
      </p>
      <Link className="button" href={`/loja/${tenant.slug}`}>
        Voltar para a loja
      </Link>
    </section>
  );
}
