"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Wine,
  Wheat,
  Heart,
  SprayCan,
  Truck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { catalogService } from "@/services/catalog";
import { normalize } from "@/lib/format";
import { ProductCard } from "@/components/delivery/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Tenant } from "@/types/domain";
import { useHydrated } from "@/lib/use-hydrated";
export function CatalogView({
  tenant,
  categoryId,
}: {
  tenant: Tenant;
  categoryId?: string;
}) {
  const [search, setSearch] = useState("");
  const [sub, setSub] = useState("Todos");
  const hydrated = useHydrated();
  const categories = catalogService.getCategories(tenant.id);
  const all = catalogService.getProducts(tenant.id);
  const category = categories.find((c) => c.id === categoryId);
  const categoryProducts =
    categoryId && categoryId !== "destaques"
      ? all.filter((p) => p.categoryId === categoryId)
      : all;
  const subs = [
    "Todos",
    ...new Set(categoryProducts.map((p) => p.subcategory)),
  ];
  const results = categoryProducts.filter(
    (p) =>
      (sub === "Todos" || p.subcategory === sub) &&
      (!categoryId || categoryId !== "destaques" || p.featured) &&
      normalize(
        `${p.name} ${p.description} ${p.subcategory} ${categories.find((c) => c.id === p.categoryId)?.name} ${p.externalId ?? p.id}`,
      ).includes(normalize(search)),
  );
  const icons = [Wine, Wheat, Heart, SprayCan];
  return (
    <>
      <label className="search-bar">
        <Search size={21} />
        <input
          type="search"
          disabled={!hydrated}
          aria-label="Buscar produtos"
          placeholder="O que você precisa hoje? Busque aqui"
          maxLength={100}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <kbd>BUSCAR</kbd>
      </label>
      {!categoryId && !search && (
        <>
          <section className="promo-banner">
            <div>
              <span className="promo-kicker">
                PRATICIDADE QUE COMBINA COM VOCÊ
              </span>
              <h1>
                Tudo o que você precisa,
                <br />
                <em>sem sair de casa.</em>
              </h1>
              <p>Seu mercado favorito, agora na palma da mão.</p>
              <a className="button" href="#produtos">
                Explorar produtos <ArrowRight size={18} />
              </a>
            </div>
            <div className="hero-basket" aria-hidden="true">
              <span className="basket-leaf">✦</span>
              <div className="basket-bottle" />
              <div className="basket-box" />
              <div className="basket">
                mhs<span>mercado</span>
              </div>
              <span className="basket-dot" />
            </div>
          </section>
          <div className="benefits">
            <span>
              <Truck size={18} /> Entrega rápida, pertinho de você
            </span>
            <span>
              <ShieldCheck size={18} /> Qualidade em cada escolha
            </span>
            <span>
              <Heart size={18} /> Cuidado do início ao fim
            </span>
          </div>
        </>
      )}
      <nav id="categorias" className="categories" aria-label="Categorias">
        <Link
          href={`/loja/${tenant.slug}/categoria/destaques`}
          className={
            categoryId === "destaques" || !categoryId ? "selected" : ""
          }
        >
          <Sparkles size={21} />
          Destaques
        </Link>
        {categories.map((c, i) => {
          const Icon = icons[i];
          return (
            <Link
              key={c.id}
              href={`/loja/${tenant.slug}/categoria/${c.id}`}
              className={categoryId === c.id ? "selected" : ""}
            >
              <Icon size={21} />
              {c.name}
            </Link>
          );
        })}
      </nav>
      {category && (
        <div className="subcategories" aria-label="Subcategorias">
          {subs.map((s) => (
            <button
              className={s === sub ? "selected" : ""}
              onClick={() => setSub(s)}
              key={s}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <section id="produtos">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ESCOLHIDOS PARA VOCÊ</span>
            <h2>
              {search
                ? `Resultados para “${search}”`
                : (category?.name ??
                  (categoryId === "destaques"
                    ? "Destaques"
                    : "Favoritos do dia"))}
            </h2>
          </div>
          <span>{results.length} produtos</span>
        </div>
        {results.length ? (
          <div className="product-grid">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} slug={tenant.slug} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum produto encontrado"
            description="Tente outro nome ou escolha uma categoria."
          />
        )}
      </section>
    </>
  );
}
