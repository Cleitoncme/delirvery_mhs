import { beforeEach, describe, expect, it } from "vitest";
import { priceLine, readCart } from "./rules";
import { categories, products, tenant } from "@/mocks/catalog";
import { catalogService } from "@/services/catalog";
describe("fronteira do carrinho", () => {
  const line = { productId: "coca-cola-2l", quantity: 2, optionIds: [] };
  beforeEach(() => {
    catalogService.setCatalog({ tenant, categories, products });
  });
  it("recalcula centavos e rejeita preços injetados", () => {
    expect(priceLine("mhs", line).total).toBe(2580);
    expect(() => priceLine("mhs", { ...line, unitPrice: 1 })).toThrow();
  });
  it("isola tenant e valida quantidade", () => {
    expect(() => priceLine("outro", line)).toThrow();
    for (const quantity of [-1, 0, 1.5, 100, Infinity])
      expect(() => priceLine("mhs", { ...line, quantity })).toThrow();
  });
  it("valida complementos obrigatórios e desconhecidos", () => {
    expect(() =>
      priceLine("mhs", { ...line, productId: "kit-lanche" }),
    ).toThrow();
    expect(() => priceLine("mhs", { ...line, optionIds: ["fake"] })).toThrow();
    expect(
      priceLine("mhs", {
        productId: "kit-lanche",
        quantity: 1,
        optionIds: ["kit-cola"],
      }).total,
    ).toBe(1700);
  });
  it("descarta persistência corrompida, duplicada e indisponível", () => {
    expect(
      readCart("mhs", [
        line,
        line,
        { ...line, productId: "heineken-330ml" },
        null,
      ]),
    ).toEqual([line]);
    expect(readCart("mhs", {})).toEqual([]);
  });
});
