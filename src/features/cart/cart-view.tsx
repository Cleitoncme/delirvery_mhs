"use client";
import Link from "next/link";
import { Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "./store";
import { priceLine } from "./rules";
import { money } from "@/lib/format";
import { QuantitySelector } from "@/components/delivery/quantity-selector";
import { CartSummary } from "@/components/delivery/cart-summary";
import { EmptyState } from "@/components/ui/empty-state";
import type { Tenant } from "@/types/domain";
const empty: [] = [];
export function CartView({ tenant }: { tenant: Tenant }) {
  const lines = useCart((s) => s.carts[tenant.id] ?? empty);
  const setQuantity = useCart((s) => s.setQuantity);
  const notes = useCart((s) => s.notes);
  const setNotes = useCart((s) => s.setNotes);
  const items = lines.map((line) => priceLine(tenant.id, line));
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  if (!items.length)
    return (
      <EmptyState
        title="Seu carrinho está esperando por você"
        description="Explore o mercado e adicione seus produtos favoritos."
      >
        <Link className="button" href={`/loja/${tenant.slug}`}>
          Explorar produtos
        </Link>
      </EmptyState>
    );
  const remove = (id: string) => {
    if (window.confirm("Remover este item do carrinho?"))
      setQuantity(tenant.id, id, 0);
  };
  return (
    <>
      <Link className="back-link" href={`/loja/${tenant.slug}`}>
        <ArrowLeft size={17} /> Continuar comprando
      </Link>
      <div className="section-heading">
        <h1>Meu carrinho</h1>
        <span>{items.reduce((sum, i) => sum + i.quantity, 0)} unidades</span>
      </div>
      <div className="checkout-grid">
        <section className="panel">
          {items.map((item) => (
            <article className="cart-row" key={item.id}>
              <div>
                <h3>{item.productName}</h3>
                <p>{item.selectedOptions.map((o) => o.name).join(", ")}</p>
                <strong>{money(item.unitPrice)}</strong>
              </div>
              <div>
                <QuantitySelector
                  value={item.quantity}
                  min={0}
                  label={item.productName}
                  onChange={(n) =>
                    n === 0
                      ? remove(item.id)
                      : setQuantity(tenant.id, item.id, n)
                  }
                />
                <button
                  className="remove-button"
                  aria-label={`Remover ${item.productName}`}
                  onClick={() => remove(item.id)}
                >
                  <Trash2 size={15} />
                </button>
                <strong>{money(item.total)}</strong>
              </div>
            </article>
          ))}
          <label className="field">
            Observação do pedido
            <textarea
              placeholder="Ex.: tocar o interfone"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <small>Não inclua informações sensíveis.</small>
          </label>
        </section>
        <CartSummary subtotal={subtotal} fee={tenant.deliveryFee}>
          <p className="hint">
            Você poderá escolher retirada grátis no checkout.
          </p>
          {tenant.isOpen ? (
            <Link
              className="button wide"
              href={`/loja/${tenant.slug}/checkout`}
            >
              Continuar <span>{money(subtotal + tenant.deliveryFee)}</span>
            </Link>
          ) : (
            <p className="error-message">
              A loja está fechada. Seu carrinho foi mantido.
            </p>
          )}
        </CartSummary>
      </div>
    </>
  );
}
