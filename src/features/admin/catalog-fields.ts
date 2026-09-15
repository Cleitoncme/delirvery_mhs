import type { CatalogResource } from "@/lib/catalog-admin-schema";
export type CatalogField = {
  key: string;
  label: string;
  kind?: "text" | "number" | "money" | "checkbox" | "textarea" | "select";
  nullable?: boolean;
  options?: string[];
  relation?: CatalogResource;
};
const name = { key: "name", label: "Nome" };
const slug = { key: "slug", label: "Endereço (ex.: arroz-5kg)" };
const sort: CatalogField = {
  key: "sort_order",
  label: "Ordem de exibição",
  kind: "number",
};
const stock: CatalogField = {
  key: "stock_quantity",
  label: "Estoque (vazio = sem controle)",
  kind: "number",
  nullable: true,
};
const available: CatalogField = {
  key: "available",
  label: "Disponível para venda",
  kind: "checkbox",
};
export const resourceNames: Record<CatalogResource, string> = {
  categorias: "Categorias",
  produtos: "Produtos",
  grupos: "Grupos de complementos",
  complementos: "Complementos",
};
export const fields: Record<CatalogResource, CatalogField[]> = {
  categorias: [
    name,
    slug,
    {
      key: "icon",
      label: "Ícone",
      kind: "select",
      options: ["wine", "wheat", "heart", "sparkles"],
    },
    sort,
  ],
  produtos: [
    name,
    slug,
    {
      key: "category_id",
      label: "Categoria",
      kind: "select",
      relation: "categorias",
    },
    { key: "subcategory", label: "Subcategoria" },
    { key: "description", label: "Descrição", kind: "textarea" },
    { key: "price_cents", label: "Preço de venda (R$)", kind: "money" },
    {
      key: "compare_at_price_cents",
      label: "Preço anterior (R$, opcional)",
      kind: "money",
      nullable: true,
    },
    { key: "unit", label: "Unidade (un, kg, pct...)" },
    {
      key: "illustration",
      label: "Ilustração",
      kind: "select",
      options: [
        "cola",
        "can",
        "green",
        "water",
        "rice",
        "milk",
        "soap",
        "clean",
      ],
    },
    available,
    { key: "featured", label: "Destacar na loja", kind: "checkbox" },
    stock,
  ],
  grupos: [
    name,
    {
      key: "product_id",
      label: "Produto",
      kind: "select",
      relation: "produtos",
    },
    { key: "required", label: "Escolha obrigatória", kind: "checkbox" },
    { key: "min_selections", label: "Mínimo de escolhas", kind: "number" },
    { key: "max_selections", label: "Máximo de escolhas", kind: "number" },
    sort,
  ],
  complementos: [
    name,
    {
      key: "option_group_id",
      label: "Grupo",
      kind: "select",
      relation: "grupos",
    },
    {
      key: "additional_price_cents",
      label: "Preço adicional (R$)",
      kind: "money",
    },
    available,
    stock,
    sort,
  ],
};
export const optionLabels: Record<string, string> = {
  wine: "Bebidas",
  wheat: "Alimentos",
  heart: "Cuidados pessoais",
  sparkles: "Limpeza",
  cola: "Refrigerante",
  can: "Lata",
  green: "Garrafa verde",
  water: "Água",
  rice: "Pacote",
  milk: "Leite",
  soap: "Sabonete",
  clean: "Limpeza",
};
