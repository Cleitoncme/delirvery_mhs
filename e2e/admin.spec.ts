import { expect, test } from "@playwright/test";
test("painel abre detalhes e avança um pedido",async({page})=>{
  await page.goto("/admin/pedidos");
  await expect(page.getByRole("heading",{name:"Pedidos"})).toBeVisible();
  await page.getByRole("button",{name:/#10254/}).click();
  await expect(page.getByRole("heading",{name:"#10254"})).toBeVisible();
  await page.getByRole("button",{name:"Marcar como pronto"}).click();
  await expect(page.getByRole("button",{name:"Saiu para entrega"})).toBeVisible();
});
