import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("API lê catálogo do PostgreSQL e cria pedido idempotente", async ({
  request,
}) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();

  const catalog = await request.get("/api/v1/lojas/mhs-mercado/catalogo");
  expect(catalog.ok()).toBeTruthy();
  const data = (await catalog.json()) as {
    products: { id: string; slug: string }[];
  };
  const product = data.products.find((item) => item.slug === "agua-500ml");
  expect(product).toBeDefined();

  const idempotencyKey = randomUUID();
  const payload = {
    customer: { name: "Teste de API", phone: "49999990000" },
    address: {
      street: "Rua de Teste",
      number: "1",
      neighborhood: "Centro",
      city: "Chapecó",
      state: "SC",
      zipCode: "89801000",
    },
    fulfillment: "DELIVERY",
    payment: "PIX",
    notes: "Pedido automatizado de teste",
    items: [{ productId: product!.id, quantity: 1, optionIds: [] }],
  };
  const first = await request.post("/api/v1/lojas/mhs-mercado/pedidos", {
    headers: { "Idempotency-Key": idempotencyKey },
    data: payload,
  });
  expect(first.status()).toBe(201);
  const firstOrder = (await first.json()) as {
    id: string;
    total: number;
    repeated: boolean;
  };
  expect(firstOrder.total).toBe(750);
  expect(firstOrder.repeated).toBe(false);

  const repeated = await request.post("/api/v1/lojas/mhs-mercado/pedidos", {
    headers: { "Idempotency-Key": idempotencyKey },
    data: payload,
  });
  expect(repeated.status()).toBe(200);
  const repeatedOrder = (await repeated.json()) as {
    id: string;
    repeated: boolean;
  };
  expect(repeatedOrder.id).toBe(firstOrder.id);
  expect(repeatedOrder.repeated).toBe(true);
});

test("API rejeita pedido sem chave de idempotência", async ({ request }) => {
  const response = await request.post("/api/v1/lojas/mhs-mercado/pedidos", {
    data: {},
  });
  expect(response.status()).toBe(400);
});
