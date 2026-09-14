import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container empty">
      <h1>Página não encontrada</h1>
      <p>Confira o endereço ou volte para o mercado.</p>
      <Link className="button" href="/">
        Voltar para a loja
      </Link>
    </main>
  );
}
