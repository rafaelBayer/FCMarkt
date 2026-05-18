import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionLink } from "@/components/ui/ActionLink";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LogoBox } from "@/components/ui/LogoBox";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { assertConfirmed } from "@/services/admin-rules";
import { getErrorMessage } from "@/lib/errors";
import { redirectWithMessage } from "@/lib/action-redirects";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { deleteLeague, getLeagueById } from "@/services/leagues";
import { deleteTeam, getTeamsByLeagueId } from "@/services/teams";

export const dynamic = "force-dynamic";

type LeagueDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    deleted?: string;
    error?: string;
  }>;
};

async function deleteLeagueAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  let errorMessage: string | null = null;

  try {
    assertConfirmed(formData.get("confirmed") === "1", "liga");
    await deleteLeague(id);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Nao foi possivel excluir a liga.");
  }

  if (errorMessage) {
    redirectWithMessage(`/leagues/${id}`, "error", errorMessage);
  }

  redirectWithMessage("/leagues", "deleted", "Liga excluida com sucesso.");
}

async function deleteTeamAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const leagueId = String(formData.get("leagueId") ?? "");
  let errorMessage: string | null = null;

  try {
    assertConfirmed(formData.get("confirmed") === "1", "time");
    await deleteTeam(id);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Nao foi possivel excluir o time.");
  }

  if (errorMessage) {
    redirectWithMessage(`/leagues/${leagueId}`, "error", errorMessage);
  }

  redirectWithMessage(`/leagues/${leagueId}`, "deleted", "Time excluido com sucesso.");
}

export default async function LeagueDetailsPage({ params, searchParams }: LeagueDetailsPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Detalhes da liga" />
        <SetupNotice />
      </div>
    );
  }

  const { id } = await params;
  const query = await searchParams;
  const [league, teams] = await Promise.all([getLeagueById(id), getTeamsByLeagueId(id)]);

  if (!league) {
    notFound();
  }

  const country = league.countries;

  return (
    <div>
      <PageHeader
        title={league.name}
        description={`${country?.name ?? "Pais nao informado"} - ${teams.length} times cadastrados`}
        action={{ href: "/teams/new", label: "Novo time" }}
      />
      {query?.deleted ? <StatusMessage tone="success">{query.deleted}</StatusMessage> : null}
      {query?.error ? <StatusMessage tone="error">{query.error}</StatusMessage> : null}

      <section className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[72px_1fr_auto] sm:items-center">
        <LogoBox src={league.logo_url} label={league.name} size="lg" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Competicao</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{league.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{country?.name ?? "Pais nao informado"}</p>
        </div>
        <div className="rounded-md bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Clubes</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{teams.length}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-3">
          <ActionLink href={`/leagues/${league.id}/edit`}>Editar liga</ActionLink>
          <DeleteButton
            id={league.id}
            action={deleteLeagueAction}
            confirmMessage="Excluir esta liga? Esta acao so sera permitida se nao houver times vinculados."
          />
        </div>
      </section>

      {teams.length === 0 ? (
        <EmptyState
          title="Nenhum time nesta liga"
          description="Cadastre times e vincule eles a esta liga para montar a tabela."
          action={{ href: "/teams/new", label: "Criar time" }}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-950">Times em ordem alfabetica</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="w-14 px-4 py-3">#</th>
                  <th className="min-w-64 px-4 py-3">Clube</th>
                  <th className="min-w-56 px-4 py-3">Nome oficial</th>
                  <th className="min-w-40 px-4 py-3">Cidade</th>
                  <th className="min-w-48 px-4 py-3">Estadio</th>
                  <th className="w-28 px-4 py-3">Fundacao</th>
                  <th className="w-44 px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {teams.map((team, index) => {
                  const displayName = team.short_name || team.name;

                  return (
                    <tr key={team.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <Link href={`/teams/${team.id}`} className="flex min-w-0 items-center gap-3">
                          <LogoBox src={team.logo_url} label={displayName} size="sm" />
                          <span className="font-semibold text-slate-950 hover:text-teal-700">{displayName}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{team.name}</td>
                      <td className="px-4 py-3 text-slate-700">{team.city || "Nao informado"}</td>
                      <td className="px-4 py-3 text-slate-700">{team.stadium || "Nao informado"}</td>
                      <td className="px-4 py-3 text-slate-700">{team.founded_year ?? "Nao informado"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <ActionLink href={`/teams/${team.id}/edit`}>Editar</ActionLink>
                          <DeleteButton
                            id={team.id}
                            action={deleteTeamAction}
                            fields={{ leagueId: league.id }}
                            confirmMessage="Excluir este time? Esta acao so sera permitida se nao houver elenco ou transferencias vinculadas."
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
