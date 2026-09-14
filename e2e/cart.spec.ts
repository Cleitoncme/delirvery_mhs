import { expect, test } from "@playwright/test";
test("adicionar, persistir e remover com confirmação", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Adicionar Coca-Cola 2L", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Navegação da loja" })
    .getByRole("link", { name: /Carrinho/ })
    .click();
  await expect(page).toHaveURL(/\/carrinho$/);
  await expect(
    page.getByRole("heading", { name: "Meu carrinho" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Coca-Cola 2L" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Coca-Cola 2L" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Aumentar quantidade de Coca-Cola 2L" })
    .click();
  await expect(
    page.getByRole("status", { name: "Quantidade de Coca-Cola 2L" }),
  ).toHaveText("2");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remover Coca-Cola 2L" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está esperando por você" }),
  ).toBeVisible();
});
