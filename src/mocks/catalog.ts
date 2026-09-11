import type { Category, Product, Tenant } from "@/types/domain";
export const tenant: Tenant = { id: "mhs", slug: "mhs-mercado", name: "MHS Mercado", primaryColor: "#B3202A", isOpen: true, openingHoursLabel: "08:00 às 22:00", deliveryFee: 500 };
export const categories: Category[] = [
  { id: "bebidas", tenantId: "mhs", name: "Bebidas", slug: "bebidas", icon: "wine" },
  { id: "alimentos", tenantId: "mhs", name: "Alimentos", slug: "alimentos", icon: "wheat" },
  { id: "higiene", tenantId: "mhs", name: "Higiene", slug: "higiene", icon: "heart" },
  { id: "limpeza", tenantId: "mhs", name: "Limpeza", slug: "limpeza", icon: "sparkles" },
];
export const products: Product[] = [
  { id: "coca-cola-2l", categoryId: "bebidas", subcategory: "Refrigerantes", name: "Coca-Cola 2L", description: "O sabor clássico para compartilhar. Refrigerante de cola, garrafa de 2 litros.", price: 1290, compareAtPrice: 1490, unit: "un", illustration: "cola", featured: true },
  { id: "coca-cola-lata", categoryId: "bebidas", subcategory: "Refrigerantes", name: "Coca-Cola Lata 350ml", description: "Seu refrigerante favorito na medida certa.", price: 450, unit: "un", illustration: "can", featured: false },
  { id: "guarana-2l", categoryId: "bebidas", subcategory: "Refrigerantes", name: "Guaraná Antarctica 2L", description: "Refrigerante de guaraná para acompanhar suas refeições.", price: 1190, unit: "un", illustration: "green", featured: true },
  { id: "agua-500ml", categoryId: "bebidas", subcategory: "Águas", name: "Água Mineral 500ml", description: "Água mineral natural sem gás.", price: 250, unit: "un", illustration: "water", featured: false },
  { id: "heineken-330ml", categoryId: "bebidas", subcategory: "Cervejas", name: "Cerveja Heineken 330ml", description: "Produto indisponível nesta demonstração.", price: 590, unit: "un", illustration: "green", featured: false, available: false },
  { id: "arroz-5kg", categoryId: "alimentos", subcategory: "Mercearia", name: "Arroz Tipo 1 5kg", description: "Arroz branco tipo 1. Soltinho, versátil e ideal para o dia a dia.", price: 2890, unit: "pct", illustration: "rice", featured: true },
  { id: "leite-1l", categoryId: "alimentos", subcategory: "Laticínios", name: "Leite Integral 1L", description: "Leite integral UHT. Nutrição para começar bem o dia.", price: 499, unit: "un", illustration: "milk", featured: true },
  { id: "sabonete", categoryId: "higiene", subcategory: "Cuidados pessoais", name: "Sabonete Suave 90g", description: "Cuidado e suavidade para sua rotina.", price: 299, unit: "un", illustration: "soap", featured: true },
  { id: "detergente", categoryId: "limpeza", subcategory: "Cozinha", name: "Detergente Neutro 500ml", description: "Limpeza prática para a cozinha.", price: 279, unit: "un", illustration: "clean", featured: true },
  { id: "kit-lanche", categoryId: "alimentos", subcategory: "Lanches", name: "Kit Lanche", description: "Monte seu lanche escolhendo a bebida. Exemplo de produto com complementos.", price: 1500, unit: "kit", illustration: "rice", featured: false, configurable: true, optionGroups: [{ id: "bebida", name: "Escolha sua bebida", required: true, min: 1, max: 1, options: [{ id: "kit-agua", name: "Água mineral", additionalPrice: 0 }, { id: "kit-cola", name: "Coca-Cola lata", additionalPrice: 200 }] }] },
].map(p => ({ tenantId: "mhs", available: true, ...p }));
