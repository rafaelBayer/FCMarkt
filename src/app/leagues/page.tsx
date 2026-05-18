import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getLeagues } from "@/services/leagues";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  return (
    <div>
      <PageHeader
        title="Ligas"
        description="Organize competicoes e vincule cada uma ao seu pais."
        action={{ href: "/leagues/new", label: "Nova liga" }}
      />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      {leagues.length === 0 ? (
        <EmptyState title="Nenhuma liga cadastrada" description="Crie uma liga depois de cadastrar um pais." />
      ) : (
        <div className="grid gap-3">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
                  {league.logo_url ? (
                    <img src={league.logo_url} alt="" className="max-h-10 max-w-10 object-contain" />
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">--</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-950">{league.name}</h2>
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
