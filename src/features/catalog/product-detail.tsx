"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Heart } from "lucide-react";
import type { Product, Tenant } from "@/types/domain";
import { money } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { ProductArt } from "@/components/delivery/product-art";
import { QuantitySelector } from "@/components/delivery/quantity-selector";
import { useCart } from "@/features/cart/store";
export function ProductDetail({
  product,
  tenant,
}: {
  product: Product;
  tenant: Tenant;
}) {
  const [quantity, setQuantity] = useState(1);
  const [optionIds, setOptions] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [feedback, setFeedback] = useState("");
  const hydrated = useHydrated();
  const add = useCart((s) => s.add);
  const extra =
    product.optionGroups
      ?.flatMap((g) => g.options)
      .filter((o) => optionIds.includes(o.id))
      .reduce((sum, o) => sum + o.additionalPrice, 0) ?? 0;
  async function share() {
    try {
      await navigator.clipboard.writeText(location.href);
      setFeedback("Link copiado.");
    } catch {
      setFeedback("Copie o endereço da página para compartilhar.");
    }
  }
  return (
    <>
      <div className="page-toolbar">
        <Link href={`/loja/${tenant.slug}`}>
          <ArrowLeft size={18} /> Voltar para a loja
        </Link>
        <div>
          <button
            className="icon-button"
            aria-label="Compartilhar produto"
            onClick={share}
          >
            <Share2 size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Favoritar nesta visita"
            aria-pressed={favorite}
            onClick={() => setFavorite(!favorite)}
          >
            <Heart size={18} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-art">
          <ProductArt kind={product.illustration} name={product.name} />
        </div>
        <section className="panel">
          <span className="eyebrow">{product.subcategory}</span>
          <h1>{product.name}</h1>
          <p className="detail-price">{money(product.price)}</p>
          <p>{product.description}</p>
          {product.optionGroups?.map((group) => (
            <fieldset className="options" key={group.id}>
              <legend>
                {group.name}
                {group.required ? " *" : ""}
              </legend>
              <p>
                Selecione de {Math.max(group.min, group.required ? 1 : 0)} a{" "}
                {group.max} opção(ões).
              </p>
              {group.options.map((option) => (
                <label className="choice" key={option.id}>
                  <input
                    type={group.max === 1 ? "radio" : "checkbox"}
                    name={group.id}
                    checked={optionIds.includes(option.id)}
                    onChange={(e) =>
                      setOptions((old) =>
                        group.max === 1
                          ? [
                              ...old.filter(
                                (id) => !group.options.some((o) => o.id === id),
                              ),
                              option.id,
                            ]
                          : e.target.checked
                            ? [...old, option.id]
                            : old.filter((id) => id !== option.id),
                      )
                    }
                  />
                  <span>{option.name}</span>
                  <strong>
                    {option.additionalPrice
                      ? `+ ${money(option.additionalPrice)}`
                      : "Incluído"}
                  </strong>
                </label>
              ))}
            </fieldset>
          ))}
          <div className="quantity-row">
            <span>Quantidade</span>
            <QuantitySelector value={quantity} onChange={setQuantity} />
          </div>
          <button
            className="wide"
            disabled={!hydrated || !product.available || !tenant.isOpen}
            onClick={() => {
              if (
                add(tenant.id, { productId: product.id, quantity, optionIds })
              )
                setFeedback(
                  "Produto adicionado. Você pode continuar comprando ou abrir o carrinho.",
                );
              else setFeedback(useCart.getState().message);
            }}
          >
            {!product.available
              ? "Produto indisponível"
              : !tenant.isOpen
                ? "Loja fechada"
                : "Adicionar ao carrinho"}
            <span>{money((product.price + extra) * quantity)}</span>
          </button>
          <p role="status" className="feedback">
            {feedback}
          </p>
          <Link className="text-link" href={`/loja/${tenant.slug}/carrinho`}>
            Ver meu carrinho →
          </Link>
        </section>
      </div>
    </>
  );
}
