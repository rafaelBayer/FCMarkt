import Link from "next/link";
import { ActionLink } from "@/components/ui/ActionLink";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
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
import { deletePlayer, getPaginatedPlayers } from "@/services/players";

export const dynamic = "force-dynamic";

type PlayersPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
    page?: string;
    search?: string;
    position?: string;
    nationality?: string;
  }>;
};

async function deletePlayerAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  let errorMessage: string | null = null;

  try {
    assertConfirmed(formData.get("confirmed") === "1", "jogador");
    await deletePlayer(id);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Nao foi possivel excluir o jogador.");
  }

  if (errorMessage) {
    redirectWithMessage("/players", "error", errorMessage);
  }

  redirectWithMessage("/players", "deleted", "Jogador excluido com sucesso.");
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const params = await searchParams;
  const search = params?.search ?? "";
  const position = params?.position ?? "";
  const nationality = params?.nationality ?? "";
  const players = await getPaginatedPlayers({
    page: params?.page,
    search,
    position,
    nationality
  });
  const hasActiveFilters = Boolean(search || position || nationality);

  return (
    <div>
      <PageHeader
        title="Jogadores"
        description="Cadastro manual de jogadores do modo carreira, sem vinculo fixo com time atual."
        action={{ href: "/players/new", label: "Novo jogador" }}
      />
      {params?.created === "player" ? (
        <StatusMessage tone="success">Jogador cadastrado com sucesso.</StatusMessage>
      ) : null}
      {params?.updated === "player" ? (
        <StatusMessage tone="success">Jogador atualizado com sucesso.</StatusMessage>
      ) : null}
      {params?.deleted ? <StatusMessage tone="success">{params.deleted}</StatusMessage> : null}
      {params?.error ? <StatusMessage tone="error">{params.error}</StatusMessage> : null}
      {!isSupabaseConfigured() ? <SetupNotice /> : null}

      <ListingFilters action="/players" clearHref="/players" hasActiveFilters={hasActiveFilters}>
        <SearchInput defaultValue={search} placeholder="Buscar jogador" />
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Posicao
          <input
            name="position"
            defaultValue={position}
            placeholder="ST"
            className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Nacionalidade
          <input
            name="nationality"
            defaultValue={nationality}
            placeholder="Brazil"
            className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>
      </ListingFilters>

      {players.data.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "Nenhum jogador encontrado" : "Nenhum jogador cadastrado"}
          description={
            hasActiveFilters
              ? "Ajuste ou limpe a busca e os filtros para ver outros jogadores."
              : "Crie jogadores manualmente para montar elencos e transferencias."
          }
          action={{ href: "/players/new", label: "Criar jogador" }}
        />
      ) : (
        <div className="grid gap-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
                  <tr>
                    <th className="min-w-56 px-4 py-3">Jogador</th>
                    <th className="min-w-40 px-4 py-3">Nacionalidade</th>
                    <th className="w-28 px-4 py-3">Posicao</th>
                    <th className="w-24 px-4 py-3">Overall</th>
                    <th className="w-24 px-4 py-3">Potencial</th>
                    <th className="w-48 px-4 py-3">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {players.data.map((player) => (
                    <tr key={player.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/players/${player.id}`}
                          className="font-semibold text-slate-950 hover:text-teal-700"
                        >
                          {player.known_name || player.name}
                        </Link>
                        {player.known_name ? (
                          <p className="text-xs text-slate-500">{player.name}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {player.nationality || "Nao informado"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {player.main_position || "Nao informado"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {player.overall ?? "Nao informado"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {player.potential ?? "Nao informado"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <ActionLink href={`/players/${player.id}/edit`}>Editar</ActionLink>
                          <DeleteButton
                            id={player.id}
                            action={deletePlayerAction}
                            confirmMessage="Excluir este jogador? Esta acao so sera permitida se nao houver elenco ou transferencias vinculadas."
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            result={players}
            basePath="/players"
            params={{ search, position, nationality }}
          />
        </div>
      )}
    </div>
  );
}
