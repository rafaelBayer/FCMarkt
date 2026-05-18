import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { LogoBox } from "@/components/ui/LogoBox";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getLeagues } from "@/services/leagues";

export const dynamic = "force-dynamic";

type LeaguesPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

export default async function LeaguesPage({ searchParams }: LeaguesPageProps) {
  const params = await searchParams;
  const leagues = await getLeagues();

  return (
    <div>
      <PageHeader
        title="Ligas"
        description="Organize competicoes e vincule cada uma ao seu pais."
        action={{ href: "/leagues/new", label: "Nova liga" }}
      />
      {params?.created === "league" ? (
        <StatusMessage tone="success">Liga cadastrada com sucesso.</StatusMessage>
      ) : null}
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      {leagues.length === 0 ? (
        <EmptyState
          title="Nenhuma liga cadastrada"
          description="Crie uma liga depois de cadastrar pelo menos um pais."
          action={{ href: "/leagues/new", label: "Criar liga" }}
        />
      ) : (
        <div className="grid gap-3">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3">
                <LogoBox src={league.logo_url} label={league.name} size="md" />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-950">{league.name}</h2>
                  <p className="text-sm text-slate-600">
                    {league.countries?.name ?? "Pais nao informado"}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-teal-700">Ver times</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
