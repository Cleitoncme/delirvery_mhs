import { categories, products, tenant } from "@/mocks/catalog";
export const catalogService = {
  getTenant: (slug: string) => slug === tenant.slug ? tenant : undefined,
  getCategories: (tenantId: string) => categories.filter(c => c.tenantId === tenantId),
  getProducts: (tenantId: string) => products.filter(p => p.tenantId === tenantId),
  getProduct: (tenantId: string, id: string) => products.find(p => p.tenantId === tenantId && p.id === id),
};
