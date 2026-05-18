import Link from "next/link";
import { ActionLink } from "@/components/ui/ActionLink";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { assertConfirmed } from "@/services/admin-rules";
import { getErrorMessage } from "@/lib/errors";
import { redirectWithMessage } from "@/lib/action-redirects";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { deletePlayer, getPlayers } from "@/services/players";

export const dynamic = "force-dynamic";

type PlayersPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
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
  const players = await getPlayers();

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

      {players.length === 0 ? (
        <EmptyState
          title="Nenhum jogador cadastrado"
          description="Crie jogadores manualmente para montar elencos e transferencias."
          action={{ href: "/players/new", label: "Criar jogador" }}
        />
      ) : (
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
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/players/${player.id}`} className="font-semibold text-slate-950 hover:text-teal-700">
                        {player.known_name || player.name}
                      </Link>
                      {player.known_name ? (
                        <p className="text-xs text-slate-500">{player.name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{player.nationality || "Nao informado"}</td>
                    <td className="px-4 py-3 text-slate-700">{player.main_position || "Nao informado"}</td>
                    <td className="px-4 py-3 text-slate-700">{player.overall ?? "Nao informado"}</td>
                    <td className="px-4 py-3 text-slate-700">{player.potential ?? "Nao informado"}</td>
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
      )}
    </div>
  );
}
