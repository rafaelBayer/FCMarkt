import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FCMarkt",
  description: "Base simples para organizar clubes, ligas e paises do modo carreira."
};

const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/countries", label: "Paises" },
  { href: "/leagues", label: "Ligas" },
  { href: "/teams", label: "Times" }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-xl font-bold tracking-normal text-slate-950">
              FCMarkt
            </Link>
            <nav className="flex flex-wrap gap-2 text-sm font-medium text-slate-700">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-73px)] max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
