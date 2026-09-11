import { expect, test } from "@playwright/test";
test("loja acessível e tenant desconhecido rejeitado", async ({ page }) => {
  const response = await page.goto("/loja/mhs-mercado");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await expect(page.locator("h1")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const missing = await page.goto("/loja/inexistente");
  expect(missing?.status()).toBe(404);
});
