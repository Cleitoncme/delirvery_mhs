import { expect, test } from "@playwright/test";
test("checkout valida dados e cria pedido demonstrativo", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Adicionar Coca-Cola 2L", exact: true })
    .click();
  await page.getByRole("link", { name: /Carrinho/ }).click();
  await page.locator('a[href="/loja/mhs-mercado/checkout"]').click();
  await page.getByRole("button", { name: "Revisar pedido" }).click();
  await expect(page.getByText("Informe seu nome.")).toBeVisible();
  await page.getByLabel("Nome").fill("Maria Teste");
  await page.getByLabel("Celular").fill("49999999999");
  await page.getByLabel("Rua").fill("Rua das Flores");
  await page.getByLabel("Número").fill("123");
  await page.getByLabel("Bairro").fill("Centro");
  await page.getByLabel("CEP").fill("89801000");
  await page.getByRole("button", { name: "Revisar pedido" }).click();
  await expect(
    page.getByRole("heading", { name: "Confirme seu pedido" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await expect(page).toHaveURL(/\/pedido\/demo-.*\/sucesso$/);
});
