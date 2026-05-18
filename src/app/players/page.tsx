import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getPlayers } from "@/services/players";

export const dynamic = "force-dynamic";

type PlayersPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

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
