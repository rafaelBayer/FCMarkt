import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ActionLink } from "@/components/ui/ActionLink";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LogoBox } from "@/components/ui/LogoBox";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { SquadMembershipForm } from "@/components/squad-memberships/SquadMembershipForm";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { assertConfirmed } from "@/services/admin-rules";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { redirectWithMessage } from "@/lib/action-redirects";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getPlayers } from "@/services/players";
import { getSeasons } from "@/services/seasons";
import {
  createSquadMembership,
  deleteSquadMembership,
  getSquadMembershipsByTeamId
} from "@/services/squad-memberships";
import { deleteTeam, getTeamById } from "@/services/teams";
import type { FormState } from "@/types/forms";

export const dynamic = "force-dynamic";

type TeamDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    seasonId?: string;
  }>;
};

async function createSquadMembershipAction(_: FormState, formData: FormData): Promise<FormState> {
  "use server";

  const teamId = String(formData.get("teamId") ?? "");
  const seasonId = String(formData.get("seasonId") ?? "");

  try {
    await createSquadMembership({
      playerId: String(formData.get("playerId") ?? ""),
      teamId,
      seasonId,
      shirtNumber: String(formData.get("shirtNumber") ?? ""),
      joinedAt: String(formData.get("joinedAt") ?? ""),
      leftAt: String(formData.get("leftAt") ?? "")
    });
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel adicionar o jogador ao elenco.")
    };
  }

  const query = new URLSearchParams({ created: "squadMembership" });
  if (seasonId) {
    query.set("seasonId", seasonId);
  }

  redirect(`/teams/${teamId}?${query.toString()}`);
}

async function deleteTeamAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  let errorMessage: string | null = null;

  try {
    assertConfirmed(formData.get("confirmed") === "1", "time");
    await deleteTeam(id);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Nao foi possivel excluir o time.");
  }

  if (errorMessage) {
    redirectWithMessage(`/teams/${id}`, "error", errorMessage);
  }

  redirectWithMessage("/teams", "deleted", "Time excluido com sucesso.");
}

async function deleteSquadMembershipAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const seasonId = String(formData.get("seasonId") ?? "");
  let errorMessage: string | null = null;

  try {
    assertConfirmed(formData.get("confirmed") === "1", "vinculo de elenco");
    await deleteSquadMembership(id);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Nao foi possivel excluir o vinculo de elenco.");
  }

  const path = seasonId ? `/teams/${teamId}?seasonId=${seasonId}` : `/teams/${teamId}`;

  if (errorMessage) {
    redirectWithMessage(path, "error", errorMessage);
  }

  redirectWithMessage(path, "deleted", "Vinculo de elenco excluido com sucesso.");
}

export default async function TeamDetailsPage({ params, searchParams }: TeamDetailsPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Detalhes do time" />
        <SetupNotice />
      </div>
    );
  }

  const { id } = await params;
  const query = await searchParams;
  const selectedSeasonId = query?.seasonId || null;
  const [team, seasons, players, squadMemberships] = await Promise.all([
    getTeamById(id),
    getSeasons(),
    getPlayers(),
    getSquadMembershipsByTeamId(id, selectedSeasonId)
  ]);

  if (!team) {
    notFound();
  }

  const league = team.leagues;
  const country = league?.countries;
  const displayName = team.short_name || team.name;

  return (
    <div className="space-y-8">
      <PageHeader
        title={displayName}
        description={`${league?.name ?? "Liga nao informada"}${country ? ` - ${country.name}` : ""}`}
      />
      {query?.created === "squadMembership" ? (
        <StatusMessage tone="success">Jogador adicionado ao elenco com sucesso.</StatusMessage>
      ) : null}
      {query?.deleted ? <StatusMessage tone="success">{query.deleted}</StatusMessage> : null}
      {query?.error ? <StatusMessage tone="error">{query.error}</StatusMessage> : null}
      <section className="grid gap-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[180px_1fr]">
        <LogoBox src={team.logo_url} label={displayName} size="xl" />
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{displayName}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm font-medium">
              {league ? (
                <Link
                  href={`/leagues/${league.id}`}
                  className="rounded-md bg-teal-50 px-3 py-1.5 text-teal-800 hover:bg-teal-100"
                >
                  {league.name}
                </Link>
              ) : (
                <span className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-600">Liga nao informada</span>
              )}
              <span className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700">
                {country?.name ?? "Pais nao informado"}
              </span>
            </div>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Cidade" value={team.city} />
            <Info label="Estadio" value={team.stadium} />
            <Info label="Fundacao" value={team.founded_year?.toString()} />
            <Info label="Nome oficial" value={team.name} />
          </dl>
          {team.description ? <p className="leading-7 text-slate-700">{team.description}</p> : null}
          <div className="flex flex-wrap gap-2">
            <ActionLink href={`/teams/${team.id}/edit`}>Editar time</ActionLink>
            <DeleteButton
              id={team.id}
              action={deleteTeamAction}
              confirmMessage="Excluir este time? Esta acao so sera permitida se nao houver elenco ou transferencias vinculadas."
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Elenco por temporada</h2>
            <p className="mt-1 text-sm text-slate-600">
              Vinculos manuais de jogadores com este time no universo do save.
            </p>
          </div>
          <form className="flex flex-wrap items-end gap-3">
            <label className="grid gap-2 text-sm font-medium text-slate-800">
              Temporada
              <select
                name="seasonId"
                defaultValue={selectedSeasonId ?? ""}
                className="min-w-48 rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
              >
                <option value="">Todas</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Filtrar
            </button>
          </form>
        </div>

        <SquadMembershipForm
          teamId={team.id}
          players={players}
          seasons={seasons}
          action={createSquadMembershipAction}
        />

        {squadMemberships.length === 0 ? (
          <EmptyState
            title="Nenhum jogador neste elenco"
            description="Adicione jogadores ao time e selecione uma temporada para montar o elenco."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
                  <tr>
                    <th className="w-24 px-4 py-3">Camisa</th>
                    <th className="min-w-56 px-4 py-3">Jogador</th>
                    <th className="min-w-36 px-4 py-3">Temporada</th>
                    <th className="min-w-32 px-4 py-3">Entrada</th>
                    <th className="min-w-32 px-4 py-3">Saida</th>
                    <th className="min-w-32 px-4 py-3">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {squadMemberships.map((membership) => (
                    <tr key={membership.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {membership.shirt_number ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {membership.players ? (
                          <Link
                            href={`/players/${membership.players.id}`}
                            className="font-semibold text-slate-950 hover:text-teal-700"
                          >
                            {membership.players.known_name || membership.players.name}
                          </Link>
                        ) : (
                          "Nao informado"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {membership.seasons?.name ?? "Nao informado"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{formatDate(membership.joined_at)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDate(membership.left_at)}</td>
                      <td className="px-4 py-3">
                        <DeleteButton
                          id={membership.id}
                          action={deleteSquadMembershipAction}
                          fields={{
                            teamId: team.id,
                            seasonId: selectedSeasonId ?? ""
                          }}
                          confirmMessage="Excluir este vinculo de elenco?"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-950">{value || "Nao informado"}</dd>
    </div>
  );
}
