import type { CatalogSnapshot, Product } from "@/types/domain";

let snapshot: CatalogSnapshot | undefined;

export const catalogService = {
  setCatalog: (catalog: CatalogSnapshot) => {
    snapshot = catalog;
  },
  getTenant: (slug: string) =>
    snapshot?.tenant.slug === slug ? snapshot.tenant : undefined,
  getCategories: (tenantId: string) =>
    snapshot?.tenant.id === tenantId ? snapshot.categories : [],
  getProducts: (tenantId: string) =>
    snapshot?.tenant.id === tenantId ? snapshot.products : [],
  getProduct: (tenantId: string, id: string): Product | undefined =>
    snapshot?.tenant.id === tenantId
      ? snapshot.products.find((product) => product.id === id)
      : undefined,
};
