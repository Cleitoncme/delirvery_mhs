import { randomUUID } from "node:crypto";
import type { PoolClient, QueryResultRow } from "pg";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { withTransaction } from "@/lib/db";

const uuid = z.string().uuid();
export const createOrderSchema = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2).max(100),
      phone: z
        .string()
        .trim()
        .regex(/^[0-9()\s-]{10,20}$/),
      email: z.string().trim().email().max(254).optional(),
    }),
    address: z
      .object({
        street: z.string().trim().min(2).max(100),
        number: z.string().trim().min(1).max(20),
        complement: z.string().trim().max(100).optional(),
        neighborhood: z.string().trim().min(2).max(80),
        city: z.string().trim().min(2).max(80),
        state: z
          .string()
          .trim()
          .regex(/^[A-Za-z]{2}$/),
        zipCode: z.string().regex(/^\d{8}$/),
        reference: z.string().trim().max(160).optional(),
      })
      .optional(),
    fulfillment: z.enum(["DELIVERY", "PICKUP"]),
    payment: z.enum(["PIX", "CARD_ON_DELIVERY", "CASH"]),
    changeForCents: z.number().int().nonnegative().optional(),
    notes: z.string().trim().max(500).default(""),
    items: z
      .array(
        z.object({
          productId: uuid,
          quantity: z.number().int().min(1).max(99),
          optionIds: z.array(uuid).max(20).default([]),
        }),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.fulfillment === "DELIVERY" && !data.address)
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Endereço é obrigatório para entrega.",
      });
  });
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

type ProductRow = {
  id: string;
  name: string;
  price_cents: number;
  stock_quantity: number | null;
};
type OptionRow = {
  id: string;
  option_group_id: string;
  product_id: string;
  name: string;
  additional_price_cents: number;
  min_selections: number;
  max_selections: number;
  required: boolean;
  stock_quantity: number | null;
};

export async function createOrder(
  slug: string,
  idempotencyKey: string,
  input: CreateOrderInput,
) {
  return withTransaction(async (client) => {
    const tenant = await one<{
      id: string;
      delivery_fee_cents: number;
      is_open: boolean;
    }>(
      client,
      "SELECT id, delivery_fee_cents, is_open FROM tenants WHERE slug = $1 FOR SHARE",
      [slug],
      "Loja não encontrada.",
      404,
    );
    if (!tenant.is_open) throw new ApiError(409, "A loja está fechada.");
    const repeated = await client.query<{
      id: string;
      number: string;
      total_cents: number;
      status: string;
    }>(
      "SELECT id, number, total_cents, status FROM orders WHERE tenant_id = $1 AND idempotency_key = $2",
      [tenant.id, idempotencyKey],
    );
    if (repeated.rows[0])
      return { ...mapOrder(repeated.rows[0]), repeated: true };
    const productIds = input.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length)
      throw new ApiError(
        400,
        "Cada produto deve aparecer uma única vez no pedido.",
      );
    const products = await client.query<ProductRow>(
      "SELECT id, name, price_cents, stock_quantity FROM products WHERE tenant_id = $1 AND id = ANY($2::uuid[]) AND available FOR UPDATE",
      [tenant.id, productIds],
    );
    if (products.rows.length !== input.items.length)
      throw new ApiError(409, "Um ou mais produtos não estão disponíveis.");
    const productMap = new Map(
      products.rows.map((product) => [product.id, product]),
    );
    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      if (
        product.stock_quantity !== null &&
        product.stock_quantity < item.quantity
      )
        throw new ApiError(409, `Estoque insuficiente: ${product.name}.`);
    }
    const optionIds = input.items.flatMap((item) => item.optionIds);
    if (new Set(optionIds).size !== optionIds.length)
      throw new ApiError(400, "Complementos repetidos.");
    const options = optionIds.length
      ? await client.query<OptionRow>(
          "SELECT o.id, o.option_group_id, g.product_id, o.name, o.additional_price_cents, g.min_selections, g.max_selections, g.required, o.stock_quantity FROM product_options o JOIN product_option_groups g ON g.id = o.option_group_id AND g.tenant_id = o.tenant_id WHERE o.tenant_id = $1 AND o.id = ANY($2::uuid[]) AND o.available FOR UPDATE",
          [tenant.id, optionIds],
        )
      : { rows: [] as OptionRow[] };
    if (options.rows.length !== optionIds.length)
      throw new ApiError(409, "Um ou mais complementos não estão disponíveis.");
    const optionMap = new Map(
      options.rows.map((option) => [option.id, option]),
    );
    const rows = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const selected = item.optionIds.map((id) => optionMap.get(id)!);
      if (selected.some((option) => option.product_id !== item.productId))
        throw new ApiError(400, "Complemento não pertence ao produto.");
      const groups = new Map<string, OptionRow[]>();
      for (const option of selected)
        groups.set(option.option_group_id, [
          ...(groups.get(option.option_group_id) ?? []),
          option,
        ]);
      for (const group of groups.values()) {
        if (
          group.length > group[0].max_selections ||
          group.length < group[0].min_selections
        )
          throw new ApiError(400, "Quantidade inválida de complementos.");
      }
      if (
        selected.some(
          (option) =>
            option.stock_quantity !== null &&
            option.stock_quantity < item.quantity,
        )
      )
        throw new ApiError(409, "Estoque de complemento insuficiente.");
      const unitPrice =
        product.price_cents +
        selected.reduce(
          (sum, option) => sum + option.additional_price_cents,
          0,
        );
      return {
        ...item,
        product,
        selected,
        unitPrice,
        total: unitPrice * item.quantity,
      };
    });
    const required = await client.query<{
      id: string;
      product_id: string;
      min_selections: number;
      required: boolean;
    }>(
      "SELECT id, product_id, min_selections, required FROM product_option_groups WHERE tenant_id = $1 AND product_id = ANY($2::uuid[])",
      [tenant.id, productIds],
    );
    for (const group of required.rows) {
      const count =
        rows
          .find((row) => row.productId === group.product_id)
          ?.selected.filter((option) => option.option_group_id === group.id)
          .length ?? 0;
      if (count < Math.max(group.min_selections, group.required ? 1 : 0))
        throw new ApiError(
          400,
          "Há complementos obrigatórios não selecionados.",
        );
    }
    const customer = await client.query<{ id: string }>(
      "INSERT INTO customers (tenant_id, name, phone, email) VALUES ($1,$2,$3,$4) ON CONFLICT (tenant_id, phone) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, updated_at = now() RETURNING id",
      [
        tenant.id,
        input.customer.name,
        input.customer.phone,
        input.customer.email ?? null,
      ],
    );
    let addressId: string | null = null;
    if (input.fulfillment === "DELIVERY") {
      const address = input.address!;
      addressId = (
        await client.query<{ id: string }>(
          "INSERT INTO addresses (tenant_id, customer_id, street, number, complement, neighborhood, city, state, zip_code, reference) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id",
          [
            tenant.id,
            customer.rows[0].id,
            address.street,
            address.number,
            address.complement ?? null,
            address.neighborhood,
            address.city,
            address.state.toUpperCase(),
            address.zipCode,
            address.reference ?? null,
          ],
        )
      ).rows[0].id;
    }
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      tenant.id,
    ]);
    const number = (
      await client.query<{ number: string }>(
        "SELECT COALESCE(MAX(number), 10000) + 1 AS number FROM orders WHERE tenant_id = $1",
        [tenant.id],
      )
    ).rows[0].number;
    const subtotal = rows.reduce((sum, row) => sum + row.total, 0);
    const deliveryFee =
      input.fulfillment === "DELIVERY" ? tenant.delivery_fee_cents : 0;
    const total = subtotal + deliveryFee;
    if (
      input.payment === "CASH" &&
      input.changeForCents !== undefined &&
      input.changeForCents < total
    )
      throw new ApiError(400, "Troco deve ser maior ou igual ao total.");
    const order = await client.query<{
      id: string;
      number: string;
      total_cents: number;
      status: string;
    }>(
      "INSERT INTO orders (tenant_id, number, customer_id, address_id, fulfillment, payment, change_for_cents, notes, subtotal_cents, delivery_fee_cents, total_cents, idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, number, total_cents, status",
      [
        tenant.id,
        number,
        customer.rows[0].id,
        addressId,
        input.fulfillment,
        input.payment,
        input.changeForCents ?? null,
        input.notes,
        subtotal,
        deliveryFee,
        total,
        idempotencyKey,
      ],
    );
    for (const row of rows) {
      const item = await client.query<{ id: string }>(
        "INSERT INTO order_items (tenant_id, order_id, product_id, product_name, unit_price_cents, quantity, total_cents) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
        [
          tenant.id,
          order.rows[0].id,
          row.productId,
          row.product.name,
          row.unitPrice,
          row.quantity,
          row.total,
        ],
      );
      for (const option of row.selected)
        await client.query(
          "INSERT INTO order_item_options (tenant_id, order_item_id, product_option_id, option_name, additional_price_cents) VALUES ($1,$2,$3,$4,$5)",
          [
            tenant.id,
            item.rows[0].id,
            option.id,
            option.name,
            option.additional_price_cents,
          ],
        );
      for (const option of row.selected)
        if (option.stock_quantity !== null)
          await client.query(
            "UPDATE product_options SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND tenant_id = $3",
            [row.quantity, option.id, tenant.id],
          );
      if (row.product.stock_quantity !== null)
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = now() WHERE id = $2 AND tenant_id = $3",
          [row.quantity, row.productId, tenant.id],
        );
    }
    await client.query(
      "INSERT INTO order_status_history (tenant_id, order_id, status, actor_type) VALUES ($1,$2,'NEW','CUSTOMER')",
      [tenant.id, order.rows[0].id],
    );
    await client.query(
      "INSERT INTO integration_events (tenant_id, aggregate_type, aggregate_id, event_type, payload, idempotency_key) VALUES ($1,'ORDER',$2,'ORDER_CREATED',$3,$4)",
      [
        tenant.id,
        order.rows[0].id,
        JSON.stringify({ orderId: order.rows[0].id }),
        randomUUID(),
      ],
    );
    return { ...mapOrder(order.rows[0]), repeated: false };
  });
}

async function one<T extends QueryResultRow>(
  client: PoolClient,
  text: string,
  values: unknown[],
  message: string,
  status: number,
) {
  const result = await client.query<T>(text, values);
  if (!result.rows[0]) throw new ApiError(status, message);
  return result.rows[0];
}
function mapOrder(order: {
  id: string;
  number: string;
  total_cents: number;
  status: string;
}) {
  return {
    id: order.id,
    number: order.number,
    total: order.total_cents,
    status: order.status,
  };
}
