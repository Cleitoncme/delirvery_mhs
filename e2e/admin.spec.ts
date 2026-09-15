import { expect as baseExpect, test as base, type APIRequestContext } from "@playwright/test";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { Pool } from "pg";
const origin = "http://127.0.0.1:3000";
// New routes compile on first access in the local Next development server.
const expect = baseExpect.configure({ timeout: 30000 });
type Shop = { slug: string; tenantId: string; productId: string; email: string; password: string; userId: string; pool: Pool };
const test = base.extend<{ shop: Shop }>({
  shop: async ({}, provide) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const slug = `test-${randomUUID()}`, tenantId = randomUUID(), categoryId = randomUUID(), productId = randomUUID(), userId = randomUUID();
    const email = `${randomUUID()}@example.test`, password = randomBytes(24).toString("hex"), salt = randomBytes(16).toString("hex");
    try {
      await pool.query("INSERT INTO tenants(id,slug,name,opening_hours_label) VALUES($1,$2,'Loja de teste','08:00 às 22:00')", [tenantId,slug]);
      await pool.query("INSERT INTO categories(id,tenant_id,slug,name) VALUES($1,$2,'teste','Teste')", [categoryId,tenantId]);
      await pool.query("INSERT INTO products(id,tenant_id,category_id,slug,subcategory,name,price_cents,unit) VALUES($1,$2,$3,'produto','Teste','Produto de teste',1000,'un')", [productId,tenantId,categoryId]);
      await pool.query("INSERT INTO admin_users(id,tenant_id,email,password_hash,role) VALUES($1,$2,$3,$4,'OPERATOR')", [userId,tenantId,email,`${salt}:${scryptSync(password,salt,64).toString("hex")}`]);
      await provide({ slug, tenantId, productId, email, password, userId, pool });
    } finally {
      // Remove exclusively the tenant UUID allocated by this test.
      for (const table of ["integration_events","order_access","order_status_history","order_item_options","order_items","orders","addresses","customers"])
        await pool.query(`DELETE FROM ${table} WHERE tenant_id=$1`, [tenantId]);
      await pool.query("DELETE FROM admin_users WHERE id=$1", [userId]);
      for (const table of ["products","categories"]) await pool.query(`DELETE FROM ${table} WHERE tenant_id=$1`, [tenantId]);
      await pool.query("DELETE FROM tenants WHERE id=$1", [tenantId]);
      await pool.end();
    }
  },
});
test.describe.configure({ timeout: 90000 });
async function login(request: APIRequestContext, shop: Shop) {
  expect((await request.post("/api/admin/session", { headers: { Origin: origin }, data: { slug: shop.slug, email: shop.email, password: shop.password } })).status()).toBe(200);
}
async function order(request: APIRequestContext, shop: Shop, fulfillment = "PICKUP") {
  const response = await request.post(`/api/v1/lojas/${shop.slug}/pedidos`, {
    headers: { "Idempotency-Key": randomUUID() },
    data: { customer: { name: "Cliente Teste", phone: "49999999999" }, fulfillment, payment: "PIX", items: [{ productId: shop.productId, quantity: 1, optionIds: [] }],
      ...(fulfillment === "DELIVERY" ? { address: { street: "Rua Teste", number: "1", neighborhood: "Centro", city: "Chapecó", state: "SC", zipCode: "89801000" } } : {}) },
  });
  expect(response.status()).toBe(201);
  return await response.json() as { id: string; number: string };
}
test("painel autentica e cliente acompanha status real após recarregar", async ({ page, browser, shop }) => {
  test.setTimeout(90000);
  const customer = await browser.newContext({ baseURL: origin });
  try {
    const created = await order(customer.request, shop);
    expect((await customer.request.get(`/api/v1/lojas/${shop.slug}/pedidos/${created.id}`)).status()).toBe(200);
    const tracking = await customer.newPage();
    await tracking.goto(`/loja/${shop.slug}/pedido/${created.id}`);
    await expect(tracking.getByRole("heading", { name: `Pedido #${created.number}` })).toBeVisible();
    await page.goto("/admin/pedidos");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.getByLabel("Loja", { exact: true }).fill(shop.slug);
    await page.getByLabel("E-mail", { exact: true }).fill(shop.email);
    await page.getByLabel("Senha", { exact: true }).fill(shop.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Pedidos", exact: true })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(`#${created.number}`) }).click();
    await page.getByRole("button", { name: "Aceitar pedido" }).click();
    await expect(tracking.getByRole("status")).toContainText("Em separação", { timeout: 20000 });
    await tracking.reload();
    await expect(tracking.getByRole("status")).toContainText("Em separação");
    const history = await shop.pool.query("SELECT actor_id FROM order_status_history WHERE order_id=$1 AND status='PREPARING'", [created.id]);
    expect(history.rows).toEqual([{ actor_id: shop.userId }]);
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    expect((await page.request.get("/api/admin/pedidos")).status()).toBe(401);
  } finally { await customer.close(); }
});
test("API bloqueia anônimo, origem externa, consulta e sessão expirada", async ({ request, shop }) => {
  expect((await request.get("/api/admin/pedidos")).status()).toBe(401);
  const created = await order(request, shop);
  await login(request, shop);
  const path = `/api/admin/pedidos/${created.id}/status`, data = { expectedStatus: "NEW", status: "PREPARING" };
  expect((await request.patch(path, { data, headers: { Origin: "https://externo.example" } })).status()).toBe(403);
  expect((await request.patch(path, { data })).status()).toBe(403);
  await shop.pool.query("UPDATE admin_users SET role='VIEWER' WHERE id=$1", [shop.userId]);
  expect((await request.get("/api/admin/pedidos")).status()).toBe(200);
  expect((await request.patch(path, { data, headers: { Origin: origin } })).status()).toBe(403);
  await shop.pool.query("UPDATE admin_sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1", [shop.userId]);
  expect((await request.get("/api/admin/pedidos")).status()).toBe(401);
});
test("acompanhamento exige cookie e administrador só acessa sua loja", async ({ request, playwright, shop }) => {
  const created = await order(request, shop), path = `/api/v1/lojas/${shop.slug}/pedidos/${created.id}`;
  const stranger = await playwright.request.newContext({ baseURL: origin });
  try {
    expect((await stranger.get(path)).status()).toBe(404);
    const own = await request.get(path);
    expect(own.status()).toBe(200);
    expect(await own.json()).not.toHaveProperty("customer");
    expect((await request.get(`/api/v1/lojas/mhs-mercado/pedidos/${created.id}`)).status()).toBe(404);
    await login(request, shop);
    const otherId = (await shop.pool.query("SELECT id FROM tenants WHERE slug='mhs-mercado'")).rows[0].id;
    await shop.pool.query("UPDATE admin_users SET tenant_id=$1 WHERE id=$2", [otherId, shop.userId]);
    const list = await (await request.get("/api/admin/pedidos")).json();
    expect(list.orders.every((item: { tenantId: string }) => item.tenantId === otherId)).toBe(true);
    expect((await request.patch(`/api/admin/pedidos/${created.id}/status`, { headers: { Origin: origin }, data: { expectedStatus: "NEW", status: "PREPARING" } })).status()).toBe(404);
  } finally { await stranger.dispose(); }
});
test("concorrência registra uma transição e retirada não sai para entrega", async ({ request, shop }) => {
  const created = await order(request, shop);
  await login(request, shop);
  const change = (expectedStatus: string, status: string) => request.patch(`/api/admin/pedidos/${created.id}/status`, { headers: { Origin: origin }, data: { expectedStatus, status } });
  expect((await change("NEW","COMPLETED")).status()).toBe(409);
  const concurrent = await Promise.all([change("NEW","PREPARING"),change("NEW","PREPARING")]);
  expect(concurrent.map(r => r.status()).sort()).toEqual([200,409]);
  expect((await change("PREPARING","READY")).status()).toBe(200);
  expect((await change("READY","OUT_FOR_DELIVERY")).status()).toBe(409);
  expect((await change("READY","COMPLETED")).status()).toBe(200);
  expect((await change("COMPLETED","NEW")).status()).toBe(409);
  const history = await shop.pool.query("SELECT status FROM order_status_history WHERE order_id=$1 ORDER BY created_at", [created.id]);
  expect(history.rows.map(r => r.status)).toEqual(["NEW","PREPARING","READY","COMPLETED"]);
  expect((await shop.pool.query("SELECT id FROM integration_events WHERE aggregate_id=$1 AND event_type='ORDER_STATUS_CHANGED'", [created.id])).rowCount).toBe(3);
});
test("entrega percorre todos os estados e usuário desativado perde acesso", async ({ request, shop }) => {
  const created = await order(request, shop, "DELIVERY");
  await login(request, shop);
  const states = ["NEW","PREPARING","READY","OUT_FOR_DELIVERY","COMPLETED"];
  for (let i=1; i<states.length; i++) {
    expect((await request.patch(`/api/admin/pedidos/${created.id}/status`, { headers: { Origin: origin }, data: { expectedStatus: states[i-1], status: states[i] } })).status()).toBe(200);
  }
  await shop.pool.query("UPDATE admin_users SET active=false WHERE id=$1", [shop.userId]);
  expect((await request.get("/api/admin/pedidos")).status()).toBe(401);
});
test("login limita tentativas sem emitir sessão", async ({ request, shop }) => {
  for (let i=0; i<11; i++) {
    const response = await request.post("/api/admin/session", { headers: { Origin: origin }, data: { slug: shop.slug, email: shop.email, password: "incorreta" } });
    expect(response.status()).toBe(i === 10 ? 429 : 401);
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
});
