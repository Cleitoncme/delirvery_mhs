import { z } from "zod";
import { catalogService } from "@/services/catalog";
import type { CartItem, CartLine } from "@/types/domain";
export const cartLineSchema = z
  .object({
    productId: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(99),
    optionIds: z.array(z.string().max(100)).max(20),
  })
  .strict();
export const cartKey = (line: CartLine) =>
  `${line.productId}:${[...line.optionIds].sort().join(",")}`;
export function priceLine(tenantId: string, input: unknown): CartItem {
  const line = cartLineSchema.parse(input);
  const product = catalogService.getProduct(tenantId, line.productId);
  if (!product || !product.available) throw new Error("Produto indisponível.");
  if (new Set(line.optionIds).size !== line.optionIds.length)
    throw new Error("Complemento repetido.");
  const groups = product.optionGroups ?? [];
  const options = groups
    .flatMap((g) => g.options)
    .filter((o) => line.optionIds.includes(o.id));
  if (options.length !== line.optionIds.length)
    throw new Error("Complemento inválido.");
  for (const group of groups) {
    const count = group.options.filter((o) =>
      line.optionIds.includes(o.id),
    ).length;
    if (
      count < Math.max(group.required ? 1 : 0, group.min) ||
      count > group.max
    )
      throw new Error(`Confira: ${group.name}.`);
  }
  const unitPrice =
    product.price + options.reduce((sum, o) => sum + o.additionalPrice, 0);
  return {
    ...line,
    id: cartKey(line),
    productName: product.name,
    selectedOptions: options,
    unitPrice,
    total: unitPrice * line.quantity,
  };
}
export function readCart(tenantId: string, input: unknown): CartLine[] {
  if (!Array.isArray(input) || input.length > 100) return [];
  const seen = new Set<string>();
  return input.flatMap((value) => {
    try {
      const item = priceLine(tenantId, value);
      if (seen.has(item.id)) return [];
      seen.add(item.id);
      return [
        {
          productId: item.productId,
          quantity: item.quantity,
          optionIds: item.optionIds,
        },
      ];
    } catch {
      return [];
    }
  });
}
