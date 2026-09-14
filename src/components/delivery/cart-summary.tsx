import { money } from "@/lib/format";
export function CartSummary({
  subtotal,
  fee,
  children,
}: {
  subtotal: number;
  fee: number;
  children?: React.ReactNode;
}) {
  return (
    <aside className="panel summary">
      <h2>Resumo do pedido</h2>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div>
          <dt>Entrega</dt>
          <dd>{fee ? money(fee) : "Grátis"}</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd>{money(subtotal + fee)}</dd>
        </div>
      </dl>
      {children}
    </aside>
  );
}
