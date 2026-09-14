import { cache } from "react";
import { query } from "@/lib/db";
import type { CatalogSnapshot } from "@/types/domain";

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  primary_color: string;
  is_open: boolean;
  opening_hours_label: string;
  delivery_fee_cents: number;
};
type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
};
type ProductRow = {
  id: string;
  category_id: string;
  slug: string;
  subcategory: string;
  name: string;
  description: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  unit: string;
  available: boolean;
  featured: boolean;
  illustration: string | null;
};
type OptionRow = {
  group_id: string;
  group_name: string;
  required: boolean;
  min_selections: number;
  max_selections: number;
  id: string;
  name: string;
  additional_price_cents: number;
};

export const getCatalog = cache(
  async (slug: string): Promise<CatalogSnapshot | null> => {
    const tenantResult = await query<TenantRow>(
      "SELECT id, slug, name, primary_color, is_open, opening_hours_label, delivery_fee_cents FROM tenants WHERE slug = $1",
      [slug],
    );
    const tenant = tenantResult.rows[0];
    if (!tenant) return null;
    const [categories, products, options] = await Promise.all([
      query<CategoryRow>(
        "SELECT id, slug, name, icon FROM categories WHERE tenant_id = $1 ORDER BY sort_order, name",
        [tenant.id],
      ),
      query<ProductRow>(
        "SELECT id, category_id, slug, subcategory, name, description, price_cents, compare_at_price_cents, unit, available, featured, illustration FROM products WHERE tenant_id = $1 ORDER BY featured DESC, name",
        [tenant.id],
      ),
      query<OptionRow>(
        "SELECT g.id AS group_id, g.name AS group_name, g.required, g.min_selections, g.max_selections, o.id, o.name, o.additional_price_cents FROM product_option_groups g JOIN product_options o ON o.option_group_id = g.id AND o.tenant_id = g.tenant_id WHERE g.tenant_id = $1 AND o.available ORDER BY g.sort_order, o.sort_order",
        [tenant.id],
      ),
    ]);
    const optionsByProduct = new Map<string, OptionRow[]>();
    const productGroups = await query<{ product_id: string; id: string }>(
      "SELECT product_id, id FROM product_option_groups WHERE tenant_id = $1",
      [tenant.id],
    );
    const productByGroup = new Map(
      productGroups.rows.map((row) => [row.id, row.product_id]),
    );
    for (const option of options.rows) {
      const productId = productByGroup.get(option.group_id);
      if (productId)
        optionsByProduct.set(productId, [
          ...(optionsByProduct.get(productId) ?? []),
          option,
        ]);
    }
    return {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        primaryColor: tenant.primary_color,
        isOpen: tenant.is_open,
        openingHoursLabel: tenant.opening_hours_label,
        deliveryFee: tenant.delivery_fee_cents,
      },
      categories: categories.rows.map((item) => ({
        id: item.id,
        tenantId: tenant.id,
        slug: item.slug,
        name: item.name,
        icon: item.icon ?? "",
      })),
      products: products.rows.map((item) => {
        const groups = new Map<
          string,
          {
            id: string;
            name: string;
            required: boolean;
            min: number;
            max: number;
            options: { id: string; name: string; additionalPrice: number }[];
          }
        >();
        for (const option of optionsByProduct.get(item.id) ?? []) {
          const group = groups.get(option.group_id) ?? {
            id: option.group_id,
            name: option.group_name,
            required: option.required,
            min: option.min_selections,
            max: option.max_selections,
            options: [],
          };
          group.options.push({
            id: option.id,
            name: option.name,
            additionalPrice: option.additional_price_cents,
          });
          groups.set(option.group_id, group);
        }
        return {
          id: item.id,
          slug: item.slug,
          tenantId: tenant.id,
          categoryId: item.category_id,
          name: item.name,
          description: item.description,
          price: item.price_cents,
          compareAtPrice: item.compare_at_price_cents ?? undefined,
          unit: item.unit,
          available: item.available,
          featured: item.featured,
          illustration: item.illustration ?? "",
          subcategory: item.subcategory,
          configurable: groups.size > 0,
          optionGroups: [...groups.values()],
        };
      }),
    };
  },
);
