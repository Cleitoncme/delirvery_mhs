"use client";
import { useState } from "react";
import Link from "next/link";
import { useApiResource } from "@/lib/use-api-resource";
import { money } from "@/lib/format";
import {
  catalogSchemas,
  reaisToCents,
  type AdminCatalog,
  type CatalogRecord,
  type CatalogResource,
} from "@/lib/catalog-admin-schema";
import { fields, resourceNames, optionLabels } from "./catalog-fields";

export function CatalogAdminView({
  initialResource,
}: {
  initialResource: CatalogResource;
}) {
  const { data, error, refresh } = useApiResource<AdminCatalog>(
    "/api/admin/catalogo",
    60000,
  );
  const [resource, setResource] = useState(initialResource);
  const [editor, setEditor] = useState<{ record?: CatalogRecord } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");
  const rows = (data?.[resource] ?? []).filter((row) =>
    row.name
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(rows.length / 20) - 1),
  );
  const writable = data?.role === "OPERATOR";
  return (
    <main id="main" className="container store-main catalog-admin">
      <nav aria-label="Administração">
        <Link href="/admin">Pedidos</Link>
        <Link href="/admin/produtos">Produtos</Link>
        <Link href="/admin/categorias">Categorias</Link>
        <Link href="/admin/complementos">Complementos</Link>
      </nav>
      <h1>{resourceNames[resource]}</h1>
      {(initialResource === "grupos" || initialResource === "complementos") && (
        <div className="catalog-actions">
          {(["grupos", "complementos"] as const).map((key) => (
            <button
              key={key}
              disabled={!!editor}
              aria-pressed={resource === key}
              onClick={() => {
                setResource(key);
                setPage(0);
                setSearch("");
                setNotice("");
              }}
            >
              {resourceNames[key]}
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Carregando catálogo…</p>}
      {notice && <p role="status">{notice}</p>}
      {data && (
        <>
          <p>
            Alterações salvas aparecem na próxima consulta à loja.{" "}
            {writable ? "" : "Seu perfil permite somente consulta."}
          </p>
          {editor && writable ? (
            <CatalogEditor
              key={`${resource}:${editor.record?.id ?? "new"}`}
              resource={resource}
              record={editor.record}
              catalog={data}
              onCancel={() => setEditor(null)}
              onSaved={() => {
                setEditor(null);
                setNotice("Registro salvo.");
                refresh();
              }}
            />
          ) : (
            <>
              <div className="catalog-actions">
                <label className="field">
                  Buscar por nome
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                  />
                </label>
                <button onClick={refresh}>Atualizar lista</button>
                {writable && (
                  <button
                    onClick={() => {
                      setEditor({});
                      setNotice("");
                    }}
                  >
                    Novo cadastro
                  </button>
                )}
              </div>
              <ul className="catalog-records">
                {rows
                  .slice(currentPage * 20, currentPage * 20 + 20)
                  .map((row) => (
                    <li key={row.id}>
                      <div>
                        <strong>{row.name}</strong>
                        {typeof row.price_cents === "number" && (
                          <p>{money(row.price_cents)}</p>
                        )}
                        {typeof row.additional_price_cents === "number" && (
                          <p>Adicional: {money(row.additional_price_cents)}</p>
                        )}
                        {typeof row.available === "boolean" && (
                          <p>{row.available ? "Disponível" : "Indisponível"}</p>
                        )}
                        {row.product_id && (
                          <p>
                            Produto:{" "}
                            {
                              data.produtos.find((p) => p.id === row.product_id)
                                ?.name
                            }
                          </p>
                        )}
                        {row.option_group_id && (
                          <p>
                            Grupo:{" "}
                            {
                              data.grupos.find(
                                (g) => g.id === row.option_group_id,
                              )?.name
                            }
                          </p>
                        )}
                      </div>
                      {writable && (
                        <button
                          aria-label={`Editar ${row.name}`}
                          onClick={() => {
                            setEditor({ record: row });
                            setNotice("");
                          }}
                        >
                          Editar
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
              {!rows.length && <p>Nenhum registro encontrado.</p>}
              <div className="catalog-actions">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Anterior
                </button>
                <span>Página {currentPage + 1}</span>
                <button
                  disabled={(currentPage + 1) * 20 >= rows.length}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Próxima
                </button>
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
function CatalogEditor({
  resource,
  record,
  catalog,
  onCancel,
  onSaved,
}: {
  resource: CatalogResource;
  record?: CatalogRecord;
  catalog: AdminCatalog;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(
      fields[resource].map((field) => {
        const value = record?.[field.key];
        return [
          field.key,
          field.kind === "checkbox"
            ? (value ?? field.key === "available")
            : field.kind === "money"
              ? typeof value === "number"
                ? (value / 100).toFixed(2)
                : field.nullable
                  ? ""
                  : "0.00"
              : value == null
                ? (field.options?.[0] ??
                  (field.key === "unit"
                    ? "un"
                    : field.key === "max_selections"
                      ? "1"
                      : field.kind === "number" && !field.nullable
                        ? "0"
                        : ""))
                : String(value),
        ];
      }),
    ),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel catalog-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setError("");
        try {
          const input = Object.fromEntries(
            fields[resource].map((field) => {
              const value = values[field.key];
              return [
                field.key,
                field.kind === "money"
                  ? reaisToCents(String(value))
                  : field.kind === "number"
                    ? value === "" && field.nullable
                      ? null
                      : Number(value)
                    : value,
              ];
            }),
          );
          const parsed = catalogSchemas[resource].safeParse(input);
          if (!parsed.success) {
            setError(
              parsed.error.issues
                .map(
                  (issue) =>
                    `${fields[resource].find((f) => f.key === issue.path[0])?.label ?? "Registro"}: ${issue.message}`,
                )
                .join(" "),
            );
            return;
          }
          setBusy(true);
          const response = await fetch(
            `/api/admin/catalogo/${resource}${record ? `/${record.id}` : ""}`,
            {
              method: record ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                data: parsed.data,
                ...(record ? { version: record.version } : {}),
              }),
            },
          );
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error ?? "Não foi possível salvar.");
          onSaved();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Falha ao salvar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>{record ? "Editar cadastro" : "Novo cadastro"}</h2>
      {(resource === "grupos" || resource === "complementos") && (
        <p>
          Cadastre o grupo no produto e depois suas opções. Um grupo obrigatório
          precisa ter opções disponíveis para permitir a venda.
        </p>
      )}
      {fields[resource].map((field) => (
        <label className="field" key={field.key}>
          {field.label}
          {field.kind === "checkbox" ? (
            <input
              type="checkbox"
              checked={Boolean(values[field.key])}
              disabled={busy}
              onChange={(e) =>
                setValues({ ...values, [field.key]: e.target.checked })
              }
            />
          ) : field.kind === "select" ? (
            <select
              value={String(values[field.key])}
              disabled={
                busy ||
                (!!record &&
                  (field.key === "product_id" ||
                    field.key === "option_group_id"))
              }
              onChange={(e) =>
                setValues({ ...values, [field.key]: e.target.value })
              }
            >
              <option value="">Selecione</option>
              {field.relation
                ? catalog[field.relation].map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                      {field.relation === "grupos"
                        ? ` — ${catalog.produtos.find((p) => p.id === item.product_id)?.name ?? ""}`
                        : ""}
                    </option>
                  ))
                : field.options?.map((value) => (
                    <option key={value} value={value}>
                      {optionLabels[value] ?? value}
                    </option>
                  ))}
            </select>
          ) : field.kind === "textarea" ? (
            <textarea
              value={String(values[field.key])}
              disabled={busy}
              maxLength={4000}
              onChange={(e) =>
                setValues({ ...values, [field.key]: e.target.value })
              }
            />
          ) : (
            <input
              value={String(values[field.key])}
              disabled={busy}
              type={field.kind === "number" ? "number" : "text"}
              inputMode={field.kind === "money" ? "decimal" : undefined}
              min={0}
              step={1}
              maxLength={field.kind === "money" ? 14 : 180}
              onChange={(e) =>
                setValues({ ...values, [field.key]: e.target.value })
              }
            />
          )}
        </label>
      ))}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <div className="catalog-actions">
        <button disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button>
        <button type="button" disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
