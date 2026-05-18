import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <section className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
          Modo carreira organizado
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
            FCMarkt
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-700">
            Uma base simples para catalogar paises, ligas e times do seu modo carreira
            FIFA/EA FC, com logos armazenadas no Supabase e paginas publicas para consulta.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/teams"
            className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Ver times
          </Link>
          <Link
            href="/teams/new"
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Cadastrar time
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">MVP inicial</h2>
        <div className="mt-5 grid gap-3 text-sm text-slate-700">
          <div className="rounded-md bg-slate-50 p-4">Cadastro de paises</div>
          <div className="rounded-md bg-slate-50 p-4">Ligas vinculadas a paises</div>
          <div className="rounded-md bg-slate-50 p-4">Times vinculados a ligas</div>
          <div className="rounded-md bg-slate-50 p-4">Upload de logos no Supabase Storage</div>
          <div className="rounded-md bg-slate-50 p-4">Pagina publica de detalhes do time</div>
        </div>
      </section>
    </div>
  );
}
