import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query, withTransaction } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ApiError } from "@/lib/api";
import {
  catalogSchemas,
  type CatalogResource,
  type CatalogRecord,
  type AdminCatalog,
} from "@/lib/catalog-admin-schema";

// SQL identifiers are exclusively these fixed server-side values, never request data.
const tables = {
  categorias: "categories",
  produtos: "products",
  grupos: "product_option_groups",
  complementos: "product_options",
} as const;
const columns = {
  categorias: ["name", "slug", "icon", "sort_order"],
  produtos: [
    "name",
    "slug",
    "category_id",
    "subcategory",
    "description",
    "price_cents",
    "compare_at_price_cents",
    "unit",
    "available",
    "featured",
    "illustration",
    "stock_quantity",
  ],
  grupos: [
    "name",
    "product_id",
    "required",
    "min_selections",
    "max_selections",
    "sort_order",
  ],
  complementos: [
    "name",
    "option_group_id",
    "additional_price_cents",
    "available",
    "stock_quantity",
    "sort_order",
  ],
} as const;
export async function readAdminCatalog(): Promise<AdminCatalog> {
  const session = await requireAdmin();
  const resources = Object.keys(tables) as CatalogResource[];
  const rows = await Promise.all(
    resources.map((resource) =>
      query<CatalogRecord>(
        `SELECT id,version,${columns[resource].join(",")} FROM ${tables[resource]} WHERE tenant_id=$1 ORDER BY name,id`,
        [session.tenantId],
      ),
    ),
  );
  return {
    role: session.role,
    slug: session.slug,
    categorias: rows[0].rows,
    produtos: rows[1].rows,
    grupos: rows[2].rows,
    complementos: rows[3].rows,
  };
}
export async function saveCatalog(
  resource: CatalogResource,
  input: unknown,
  id?: string,
) {
  const session = await requireAdmin(true);
  const envelope = z
    .object({
      data: z.unknown(),
      version: z.number().int().positive().optional(),
    })
    .strict()
    .parse(input);
  if (id && !envelope.version)
    throw new ApiError(400, "A versão do registro é obrigatória.");
  const data = catalogSchemas[resource].parse(envelope.data) as Record<
    string,
    unknown
  >;
  try {
    return await withTransaction(async (client) => {
      if (id) {
        const current = await client.query(
          `SELECT * FROM ${tables[resource]} WHERE id=$1 AND tenant_id=$2 FOR UPDATE`,
          [id, session.tenantId],
        );
        if (!current.rows[0])
          throw new ApiError(404, "Registro não encontrado.");
        if (current.rows[0].version !== envelope.version)
          throw new ApiError(
            409,
            "Registro alterado por outro operador. Atualize a lista antes de editar novamente.",
          );
        const parent =
          resource === "grupos"
            ? "product_id"
            : resource === "complementos"
              ? "option_group_id"
              : null;
        if (parent && current.rows[0][parent] !== data[parent])
          throw new ApiError(
            409,
            "O vínculo de um complemento existente não pode ser alterado.",
          );
      }
      const relation =
        resource === "produtos"
          ? ["categories", "category_id"]
          : resource === "grupos"
            ? ["products", "product_id"]
            : resource === "complementos"
              ? ["product_option_groups", "option_group_id"]
              : null;
      if (relation) {
        const parent = await client.query(
          `SELECT id FROM ${relation[0]} WHERE id=$1 AND tenant_id=$2`,
          [data[relation[1]], session.tenantId],
        );
        if (!parent.rowCount)
          throw new ApiError(400, "Vínculo inválido para esta loja.");
      }
      const keys = columns[resource];
      const values = keys.map((key) => data[key]);
      const result = id
        ? await client.query<CatalogRecord>(
            `UPDATE ${tables[resource]} SET ${keys.map((key, i) => `${key}=$${i + 1}`).join(",")},version=version+1${resource === "produtos" ? ",updated_at=now()" : ""} WHERE id=$${keys.length + 1} AND tenant_id=$${keys.length + 2} RETURNING id,version,name`,
            [...values, id, session.tenantId],
          )
        : await client.query<CatalogRecord>(
            `INSERT INTO ${tables[resource]} (${keys.join(",")},tenant_id) VALUES (${values.map((_, i) => `$${i + 1}`).join(",")},$${keys.length + 1}) RETURNING id,version,name`,
            [...values, session.tenantId],
          );
      const saved = result.rows[0];
      await client.query(
        "INSERT INTO integration_events(tenant_id,aggregate_type,aggregate_id,event_type,payload,idempotency_key) VALUES($1,'CATALOG',$2,$3,$4,$5)",
        [
          session.tenantId,
          saved.id,
          id ? "CATALOG_UPDATED" : "CATALOG_CREATED",
          JSON.stringify({
            resource,
            actorId: session.userId,
            version: saved.version,
          }),
          randomUUID(),
        ],
      );
      return saved;
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "23505"
    )
      throw new ApiError(
        409,
        "Este endereço já está em uso na loja. Escolha outro identificador.",
      );
    throw error;
  }
}
