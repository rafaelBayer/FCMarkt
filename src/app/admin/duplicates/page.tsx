import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getDuplicateTeamsByLeague } from "@/services/teams";

export const dynamic = "force-dynamic";

export default async function DuplicateDiagnosticsPage() {
  const duplicateGroups = await getDuplicateTeamsByLeague();

  return (
    <div>
      <PageHeader
        title="Diagnostico de duplicados"
        description="Lista possiveis times duplicados por nome e liga. Nenhum dado e apagado automaticamente."
      />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}

      {duplicateGroups.length === 0 ? (
        <EmptyState
          title="Nenhum time duplicado encontrado"
          description="Nao ha grupos com mesmo nome de time dentro da mesma liga."
        />
      ) : (
        <div className="grid gap-4">
          {duplicateGroups.map((group) => {
            const first = group[0];
            const leagueName = first?.leagues?.name ?? "Liga nao informada";

            return (
              <section
                key={`${first?.league_id}-${first?.name}`}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-950">
                  {first?.name} em {leagueName}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {group.length} registros encontrados. Revise manualmente antes de aplicar constraints no banco.
                </p>
                <div className="mt-4 grid gap-2">
                  {group.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-3"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {team.short_name || team.name} - {team.id}
                      </span>
                      <Link
                        href={`/teams/${team.id}`}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                      >
                        Abrir
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
