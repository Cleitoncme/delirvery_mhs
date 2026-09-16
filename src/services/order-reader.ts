import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { query, withTransaction } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { cookieOptions, hashToken, requireAdmin } from "@/lib/admin-auth";
import { canCancelOrder, nextOrderStatus } from "@/lib/order-flow";
import type {
  Order,
  DeliveryOrderStatus,
  FulfillmentType,
} from "@/types/domain";

const orderSelect = `SELECT jsonb_build_object(
 'id',o.id,'tenantId',o.tenant_id,'number',o.number::text,'status',o.status,'createdAt',o.created_at,
 'fulfillmentType',o.fulfillment,'paymentMethod',o.payment,'changeFor',o.change_for_cents,
 'notes',o.notes,'subtotal',o.subtotal_cents,'deliveryFee',o.delivery_fee_cents,'discount',o.discount_cents,'total',o.total_cents,
 'customer',jsonb_build_object('id',c.id,'name',c.name,'phone',c.phone,'email',c.email),
 'address',CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object('street',a.street,'number',a.number,
 'complement',a.complement,'neighborhood',a.neighborhood,'city',a.city,'state',a.state,'zipCode',a.zip_code,'reference',a.reference) END,
 'items',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',i.id,'productId',i.product_id,'productName',i.product_name,
 'quantity',i.quantity,'unitPrice',i.unit_price_cents,'total',i.total_cents,'optionIds','[]'::jsonb,
 'selectedOptions',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',x.product_option_id,'name',x.option_name,'additionalPrice',x.additional_price_cents))
 FROM order_item_options x WHERE x.order_item_id=i.id AND x.tenant_id=o.tenant_id),'[]'::jsonb)) ORDER BY i.id)
 FROM order_items i WHERE i.order_id=o.id AND i.tenant_id=o.tenant_id),'[]'::jsonb),
 'history',COALESCE((SELECT jsonb_agg(jsonb_build_object('status',h.status,'at',h.created_at) ORDER BY h.created_at,h.id)
 FROM order_status_history h WHERE h.order_id=o.id AND h.tenant_id=o.tenant_id),'[]'::jsonb)
) AS data FROM orders o JOIN customers c ON c.id=o.customer_id AND c.tenant_id=o.tenant_id
LEFT JOIN addresses a ON a.id=o.address_id AND a.tenant_id=o.tenant_id`;

export async function listAdminOrders(page: number, filters?: { status?: DeliveryOrderStatus; search?: string }) {
  const session = await requireAdmin();
  const values: unknown[] = [session.tenantId];
  const clauses = ["o.tenant_id=$1"];
  if (filters?.status) { values.push(filters.status); clauses.push(`o.status=$${values.length}`); }
  if (filters?.search) { values.push(`%${filters.search}%`); clauses.push(`(o.number::text ILIKE $${values.length} OR c.name ILIKE $${values.length} OR c.phone ILIKE $${values.length})`); }
  const offsetIndex = values.length + 1;
  values.push(page * 50, 51);
  const result = await query<{ data: Order }>(
    `${orderSelect} WHERE ${clauses.join(" AND ")} ORDER BY o.created_at DESC,o.id DESC LIMIT $${values.length} OFFSET $${offsetIndex}`,
    values,
  );
  return {
    orders: result.rows.slice(0, 50).map((r) => r.data),
    hasMore: result.rows.length > 50,
    role: session.role,
  };
}
export async function advanceOrder(
  id: string,
  expected: DeliveryOrderStatus,
  status: DeliveryOrderStatus,
) {
  const session = await requireAdmin(true);
  await withTransaction(async (client) => {
    const result = await client.query<{
      status: DeliveryOrderStatus;
      fulfillment: FulfillmentType;
    }>(
      "SELECT status,fulfillment FROM orders WHERE id=$1 AND tenant_id=$2 FOR UPDATE",
      [id, session.tenantId],
    );
    const order = result.rows[0];
    if (!order) throw new ApiError(404, "Pedido não encontrado.");
    if (order.status !== expected)
      throw new ApiError(
        409,
        "O pedido foi atualizado por outro operador. Atualize o painel.",
      );
    if (nextOrderStatus(order.status, order.fulfillment) !== status)
      throw new ApiError(409, "Transição de status não permitida.");
    await client.query(
      "UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 AND tenant_id=$3",
      [status, id, session.tenantId],
    );
    await client.query(
      "INSERT INTO order_status_history(tenant_id,order_id,status,actor_type,actor_id) VALUES($1,$2,$3,'ADMIN',$4)",
      [session.tenantId, id, status, session.userId],
    );
    await client.query(
      "INSERT INTO integration_events(tenant_id,aggregate_type,aggregate_id,event_type,payload,idempotency_key) VALUES($1,'ORDER',$2,'ORDER_STATUS_CHANGED',$3,$4)",
      [
        session.tenantId,
        id,
        JSON.stringify({
          orderId: id,
          previousStatus: expected,
          status,
          actorId: session.userId,
        }),
        randomUUID(),
      ],
    );
  });
  return { id, status };
}

export async function cancelOrder(id: string, reason: string) {
  const session = await requireAdmin(true);
  return withTransaction(async (client) => {
    const result = await client.query<{ status: DeliveryOrderStatus }>("SELECT status FROM orders WHERE id=$1 AND tenant_id=$2 FOR UPDATE", [id, session.tenantId]);
    const order = result.rows[0];
    if (!order) throw new ApiError(404, "Pedido não encontrado.");
    if (!canCancelOrder(order.status)) throw new ApiError(409, "Este pedido não pode mais ser cancelado.");
    const items = await client.query<{ product_id: string; quantity: number }>("SELECT product_id,quantity FROM order_items WHERE order_id=$1 AND tenant_id=$2", [id, session.tenantId]);
    for (const item of items.rows) await client.query("UPDATE products SET stock_quantity=stock_quantity+$1,updated_at=now() WHERE id=$2 AND tenant_id=$3 AND stock_quantity IS NOT NULL", [item.quantity,item.product_id,session.tenantId]);
    const options = await client.query<{ product_option_id: string; quantity: number }>("SELECT x.product_option_id,i.quantity FROM order_item_options x JOIN order_items i ON i.id=x.order_item_id AND i.tenant_id=x.tenant_id WHERE i.order_id=$1 AND x.tenant_id=$2", [id,session.tenantId]);
    for (const option of options.rows) await client.query("UPDATE product_options SET stock_quantity=stock_quantity+$1 WHERE id=$2 AND tenant_id=$3 AND stock_quantity IS NOT NULL", [option.quantity,option.product_option_id,session.tenantId]);
    await client.query("UPDATE orders SET status='CANCELED',updated_at=now() WHERE id=$1 AND tenant_id=$2", [id,session.tenantId]);
    await client.query("INSERT INTO order_status_history(tenant_id,order_id,status,actor_type,actor_id,reason) VALUES($1,$2,'CANCELED','ADMIN',$3,$4)", [session.tenantId,id,session.userId,reason]);
    await client.query("INSERT INTO integration_events(tenant_id,aggregate_type,aggregate_id,event_type,payload,idempotency_key) VALUES($1,'ORDER',$2,'ORDER_CANCELED',$3,$4)", [session.tenantId,id,JSON.stringify({ orderId:id, reason, actorId:session.userId }),randomUUID()]);
    return { id, status: "CANCELED" as const };
  });
}

export async function grantOrderAccess(
  slug: string,
  id: string,
  idempotencyKey: string,
) {
  const token = randomBytes(32).toString("hex");
  // The creation/retry key must match: knowing an order UUID cannot grant access.
  const result = await query(
    `INSERT INTO order_access(token_hash,tenant_id,order_id,expires_at)
     SELECT $1,o.tenant_id,o.id,now()+interval '7 days' FROM orders o JOIN tenants t ON t.id=o.tenant_id
     WHERE o.id=$2 AND t.slug=$3 AND o.idempotency_key=$4`,
    [hashToken(token), id, slug, idempotencyKey],
  );
  if (!result.rowCount) throw new ApiError(404, "Pedido não encontrado.");
  (await cookies()).set(`mhs-order-${id}`, token, {
    ...cookieOptions,
    path: `/api/v1/lojas/${slug}/pedidos/${id}`,
    maxAge: 7 * 24 * 60 * 60,
  });
}
export async function readCustomerOrder(slug: string, id: string) {
  const token = (await cookies()).get(`mhs-order-${id}`)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new ApiError(404, "Pedido não encontrado ou acesso expirado.");
  const result = await query<{ data: Order }>(
    `${orderSelect} WHERE o.id=$1 AND EXISTS(SELECT 1 FROM tenants t WHERE t.id=o.tenant_id AND t.slug=$2)
     AND EXISTS(SELECT 1 FROM order_access g WHERE g.order_id=o.id AND g.tenant_id=o.tenant_id AND g.token_hash=$3 AND g.expires_at>now())`,
    [id, slug, hashToken(token)],
  );
  if (!result.rows[0])
    throw new ApiError(404, "Pedido não encontrado ou acesso expirado.");
  // Contact details and internal customer/tenant IDs are unnecessary for tracking.
  const {
    id: orderId,
    number,
    status,
    fulfillmentType,
    paymentMethod,
    items,
    subtotal,
    deliveryFee,
    discount,
    total,
    createdAt,
    history,
  } = result.rows[0].data;
  return {
    id: orderId,
    number,
    status,
    fulfillmentType,
    paymentMethod,
    items,
    subtotal,
    deliveryFee,
    discount,
    total,
    createdAt,
    history,
  };
}
