"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type Zone = {
  min_distance_m: number;
  max_distance_m: number;
  fee_cents: number;
  active: boolean;
};
export function StoreSettingsView() {
  const [min, setMin] = useState(0),
    [zones, setZones] = useState<Zone[]>([]),
    [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/admin/configuracoes")
      .then((r) => r.json())
      .then((v) => {
        setMin(v.tenant.minimum_order_cents);
        setZones(v.zones);
      });
  }, []);
  const update = (i: number, k: keyof Zone, v: number) =>
    setZones((z) => z.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <main className="container store-main">
      <nav>
        <Link href="/admin">Pedidos</Link>
      </nav>
      <h1>Configurações de entrega</h1>
      <label>
        Pedido mínimo (centavos)
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
        />
      </label>
      {zones.map((z, i) => (
        <div className="catalog-actions" key={i}>
          <input
            aria-label="Início (m)"
            type="number"
            value={z.min_distance_m}
            onChange={(e) =>
              update(i, "min_distance_m", Number(e.target.value))
            }
          />
          <input
            aria-label="Fim (m)"
            type="number"
            value={z.max_distance_m}
            onChange={(e) =>
              update(i, "max_distance_m", Number(e.target.value))
            }
          />
          <input
            aria-label="Taxa (centavos)"
            type="number"
            value={z.fee_cents}
            onChange={(e) => update(i, "fee_cents", Number(e.target.value))}
          />
          <button onClick={() => setZones((v) => v.filter((_, j) => j !== i))}>
            Remover
          </button>
        </div>
      ))}
      <button
        onClick={() =>
          setZones((v) => [
            ...v,
            {
              min_distance_m: 0,
              max_distance_m: 2000,
              fee_cents: 0,
              active: true,
            },
          ])
        }
      >
        Adicionar faixa
      </button>{" "}
      <button
        onClick={() =>
          fetch("/api/admin/configuracoes", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ minimumOrderCents: min, zones }),
          }).then((r) => setMsg(r.ok ? "Salvo." : "Erro ao salvar."))
        }
      >
        Salvar
      </button>
      {msg && <p role="status">{msg}</p>}
    </main>
  );
}
