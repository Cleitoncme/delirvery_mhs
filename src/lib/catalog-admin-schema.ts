import { z } from "zod";
const name = z.string().trim().min(2).max(100);
const slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const cents = z.number().int().min(0).max(100_000_000);
const sort = z.number().int().min(0).max(32767);
const stock = z.number().int().min(0).max(1_000_000).nullable();
export const resourceSchema = z.enum([
  "categorias",
  "produtos",
  "grupos",
  "complementos",
]);
export type CatalogResource = z.infer<typeof resourceSchema>;
export const catalogSchemas = {
  categorias: z
    .object({
      name,
      slug,
      icon: z.enum(["wine", "wheat", "heart", "sparkles"]),
      sort_order: sort,
    })
    .strict(),
  produtos: z
    .object({
      name: name.max(180),
      slug,
      category_id: z.uuid(),
      subcategory: z.string().trim().max(100),
      description: z.string().trim().max(4000),
      price_cents: cents,
      compare_at_price_cents: cents.nullable(),
      unit: z.string().trim().min(1).max(20),
      available: z.boolean(),
      featured: z.boolean(),
      illustration: z.enum([
        "cola",
        "can",
        "green",
        "water",
        "rice",
        "milk",
        "soap",
        "clean",
      ]),
      stock_quantity: stock,
    })
    .strict()
    .refine(
      (v) =>
        v.compare_at_price_cents === null ||
        v.compare_at_price_cents >= v.price_cents,
      {
        message: "O preço anterior deve ser maior ou igual ao preço de venda.",
        path: ["compare_at_price_cents"],
      },
    ),
  grupos: z
    .object({
      name,
      product_id: z.uuid(),
      required: z.boolean(),
      min_selections: z.number().int().min(0).max(20),
      max_selections: z.number().int().min(1).max(20),
      sort_order: sort,
    })
    .strict()
    .refine((v) => v.max_selections >= v.min_selections, {
      message: "O máximo deve ser maior ou igual ao mínimo.",
      path: ["max_selections"],
    }),
  complementos: z
    .object({
      name,
      option_group_id: z.uuid(),
      additional_price_cents: cents,
      available: z.boolean(),
      stock_quantity: stock,
      sort_order: sort,
    })
    .strict(),
};
export type CatalogRecord = {
  id: string;
  version: number;
  name: string;
  [key: string]: string | number | boolean | null;
};
export type AdminCatalog = {
  role: "OPERATOR" | "VIEWER";
  slug: string;
  categorias: CatalogRecord[];
  produtos: CatalogRecord[];
  grupos: CatalogRecord[];
  complementos: CatalogRecord[];
};

export function reaisToCents(value: string): number | null {
  if (!value.trim()) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim()))
    throw new Error("Informe um valor com até duas casas decimais.");
  const [integer, fraction = ""] = value.trim().replace(",", ".").split(".");
  const result = Number(integer) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result)) throw new Error("Valor muito alto.");
  return result;
}
