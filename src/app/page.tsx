import Link from "next/link";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCountries } from "@/services/countries";
import { getLeagues } from "@/services/leagues";
import { getPlayers } from "@/services/players";
import { getSeasons } from "@/services/seasons";
import { getTeams } from "@/services/teams";
import { getTransfers } from "@/services/transfers";

export const dynamic = "force-dynamic";

const sections = [
  {
    href: "/countries",
    title: "Paises",
    description: "Base geografica para organizar ligas e bandeiras.",
    action: "Gerenciar paises"
  },
  {
    href: "/leagues",
    title: "Ligas",
    description: "Competicoes vinculadas aos paises, com logos quando disponiveis.",
    action: "Ver ligas"
  },
  {
    href: "/teams",
    title: "Times",
    description: "Clubes do modo carreira com liga, pais, estadio e ficha publica.",
    action: "Ver times"
  },
  {
    href: "/seasons",
    title: "Temporadas",
    description: "Anos do save usados para elencos e transferencias manuais.",
    action: "Gerenciar temporadas"
  },
  {
    href: "/players",
    title: "Jogadores",
    description: "Atletas cadastrados manualmente, sem time atual salvo em players.",
    action: "Ver jogadores"
  },
  {
    href: "/transfers",
    title: "Transferencias",
    description: "Movimentacoes manuais com data do universo do modo carreira.",
    action: "Ver transferencias"
  }
];

export default async function HomePage() {
  const [countries, leagues, teams, seasons, players, transfers] = isSupabaseConfigured()
    ? await Promise.all([
        getCountries(),
        getLeagues(),
        getTeams(),
        getSeasons(),
        getPlayers(),
        getTransfers()
      ])
    : [[], [], [], [], [], []];

  return (
    <div className="space-y-8">
      {!isSupabaseConfigured() ? <SetupNotice /> : null}

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div className="flex flex-col justify-between gap-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
              Modo carreira organizado
            </p>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
                FCMarkt
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-700">
                Um catalogo simples para estruturar paises, ligas, clubes, temporadas, jogadores
                e transferencias manuais do seu modo carreira FIFA/EA FC.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/teams"
              className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Explorar times
            </Link>
            <Link
              href="/players"
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Ver jogadores
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
          <Metric label="Paises" value={countries.length} />
          <Metric label="Ligas" value={leagues.length} />
          <Metric label="Times" value={teams.length} />
          <Metric label="Temporadas" value={seasons.length} />
          <Metric label="Jogadores" value={players.length} />
          <Metric label="Transferencias" value={transfers.length} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
            </div>
            <span className="text-sm font-semibold text-teal-700 group-hover:text-teal-800">
              {section.action}
            </span>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Escopo atual</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md bg-slate-50 p-4">Cadastro de paises, ligas e times</div>
          <div className="rounded-md bg-slate-50 p-4">Logos via Supabase Storage</div>
          <div className="rounded-md bg-slate-50 p-4">Jogadores sem time atual fixo</div>
          <div className="rounded-md bg-slate-50 p-4">Elencos e transferencias por temporada</div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">cadastrados</p>
    </div>
  );
}
