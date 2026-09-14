import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "MHS Mercado | Delivery",
  description: "Seu mercado, perto de você. Protótipo demonstrativo MHS.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#main">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
