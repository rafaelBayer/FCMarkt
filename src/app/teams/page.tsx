import { TeamCard } from "@/components/teams/TeamCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { ListingFilters } from "@/components/ui/ListingFilters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { assertConfirmed } from "@/services/admin-rules";
import { getErrorMessage } from "@/lib/errors";
import { redirectWithMessage } from "@/lib/action-redirects";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCountries } from "@/services/countries";
import { getLeagues } from "@/services/leagues";
import { deleteTeam, getPaginatedTeams } from "@/services/teams";

export const dynamic = "force-dynamic";

type TeamsPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
    page?: string;
    search?: string;
    league?: string;
    country?: string;
  }>;
};

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
    redirectWithMessage("/teams", "error", errorMessage);
  }

  redirectWithMessage("/teams", "deleted", "Time excluido com sucesso.");
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const params = await searchParams;
  const search = params?.search ?? "";
  const league = params?.league ?? "";
  const country = params?.country ?? "";
  const [teams, leagues, countries] = await Promise.all([
    getPaginatedTeams({ page: params?.page, search, league, country }),
    getLeagues(),
    getCountries()
  ]);
  const hasActiveFilters = Boolean(search || league || country);

  return (
    <div>
      <PageHeader
        title="Times"
        description="Lista de clubes cadastrados com liga, pais e logo."
        action={{ href: "/teams/new", label: "Novo time" }}
      />
      {params?.created === "team" ? (
        <StatusMessage tone="success">Time cadastrado com sucesso.</StatusMessage>
      ) : null}
      {params?.updated === "team" ? (
        <StatusMessage tone="success">Time atualizado com sucesso.</StatusMessage>
      ) : null}
      {params?.deleted ? <StatusMessage tone="success">{params.deleted}</StatusMessage> : null}
      {params?.error ? <StatusMessage tone="error">{params.error}</StatusMessage> : null}
      {!isSupabaseConfigured() ? <SetupNotice /> : null}

      <ListingFilters action="/teams" clearHref="/teams" hasActiveFilters={hasActiveFilters}>
        <SearchInput defaultValue={search} placeholder="Buscar time" />
        <FilterSelect
          label="Liga"
          name="league"
          defaultValue={league}
          options={leagues.map((item) => ({ value: item.id, label: item.name }))}
        />
        <FilterSelect
          label="Pais"
          name="country"
          defaultValue={country}
          options={countries.map((item) => ({ value: item.id, label: item.name }))}
        />
      </ListingFilters>

      {teams.data.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "Nenhum time encontrado" : "Nenhum time cadastrado"}
          description={
            hasActiveFilters
              ? "Ajuste ou limpe a busca e os filtros para ver outros times."
              : "Cadastre ligas e crie seu primeiro time para popular o catalogo."
          }
          action={{ href: "/teams/new", label: "Criar time" }}
        />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.data.map((team) => (
              <TeamCard key={team.id} team={team} deleteAction={deleteTeamAction} />
            ))}
          </div>
          <Pagination result={teams} basePath="/teams" params={{ search, league, country }} />
        </div>
      )}
    </div>
  );
}
