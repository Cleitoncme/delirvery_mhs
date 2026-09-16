import Link from "next/link";
export default function AdminSettingsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/admin">← Voltar ao painel</Link>
      <h1 className="mt-6 text-2xl font-bold">Configurações de entrega</h1>
      <p className="mt-2 text-slate-600">
        As faixas abaixo são consultadas pelo servidor. O navegador nunca define
        a taxa.
      </p>
      <p className="mt-6 rounded border p-4">
        A edição das faixas estará disponível na próxima atualização do painel.
        Consulte a API administrativa em <code>/api/admin/configuracoes</code>.
      </p>
    </main>
  );
}
