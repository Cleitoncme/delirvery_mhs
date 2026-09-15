import type { DeliveryOrderStatus, FulfillmentType } from "@/types/domain";

export const orderStatusNames: Record<DeliveryOrderStatus, string> = {
  NEW: "Pedido recebido", PREPARING: "Em separação", READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega", COMPLETED: "Concluído", CANCELED: "Cancelado",
};

export function nextOrderStatus(
  status: DeliveryOrderStatus,
  fulfillment: FulfillmentType,
): DeliveryOrderStatus | undefined {
  switch (status) {
    case "NEW":
      return "PREPARING";
    case "PREPARING":
      return "READY";
    case "READY":
      return fulfillment === "PICKUP" ? "COMPLETED" : "OUT_FOR_DELIVERY";
    case "OUT_FOR_DELIVERY":
      return fulfillment === "DELIVERY" ? "COMPLETED" : undefined;
    default:
      return undefined;
  }
}
