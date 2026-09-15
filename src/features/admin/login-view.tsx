"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main id="main" className="container store-main">
      <section className="panel">
        <h1>Entrar no painel</h1>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            const form = new FormData(event.currentTarget);
            setBusy(true);
            setError("");
            try {
              const response = await fetch("/api/admin/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(Object.fromEntries(form)),
              });
              const data = await response.json();
              if (!response.ok)
                throw new Error(data.error ?? "Falha ao entrar.");
              router.replace("/admin");
              router.refresh();
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : "Falha de conexão.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            Loja
            <input
              name="slug"
              required
              maxLength={80}
              autoComplete="organization"
              placeholder="mhs-mercado"
            />
          </label>
          <label className="field">
            E-mail
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="username"
            />
          </label>
          <label className="field">
            Senha
            <input
              name="password"
              type="password"
              required
              maxLength={256}
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <button disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
        </form>
      </section>
    </main>
  );
}
