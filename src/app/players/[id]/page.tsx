import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { LogoBox } from "@/components/ui/LogoBox";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { formatDate, formatMoney } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getPlayerProfile } from "@/services/players";

export const dynamic = "force-dynamic";

type PlayerDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PlayerDetailsPage({ params }: PlayerDetailsPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Perfil do jogador" />
        <SetupNotice />
      </div>
    );
  }

  const { id } = await params;
  const player = await getPlayerProfile(id);

  if (!player) {
    notFound();
  }

  const displayName = player.known_name || player.name;

  return (
    <div className="space-y-8">
      <PageHeader
        title={displayName}
        description="Perfil manual do jogador no universo do modo carreira."
      />

      <section className="grid gap-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[180px_1fr]">
        <LogoBox src={player.photo_url} label={displayName} size="xl" />
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{displayName}</h2>
            {player.known_name ? <p className="mt-1 text-slate-600">{player.name}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-medium">
              <span className="rounded-md bg-teal-50 px-3 py-1.5 text-teal-800">
                Time atual: {player.currentTeam?.name ?? "Sem time derivado"}
              </span>
              <span className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700">
                Fonte: {player.currentTeam?.source ?? "historico vazio"}
              </span>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Nacionalidade" value={player.nationality} />
            <Info label="Nascimento" value={formatDate(player.birth_date)} />
            <Info label="Posicao" value={player.main_position} />
            <Info label="Overall / Potencial" value={`${player.overall ?? "-"} / ${player.potential ?? "-"}`} />
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">Historico de transferencias</h2>
        </div>
        {player.transfers.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Nenhuma transferencia cadastrada"
              description="As movimentacoes manuais deste jogador aparecerao aqui."
              action={{ href: "/transfers/new", label: "Criar transferencia" }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Destino</th>
                  <th className="px-4 py-3">Temporada</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {player.transfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td className="px-4 py-3">{formatDate(transfer.transfer_date)}</td>
                    <td className="px-4 py-3">{transfer.from_team?.short_name || transfer.from_team?.name || "Sem origem"}</td>
                    <td className="px-4 py-3">{transfer.to_team?.short_name || transfer.to_team?.name || "Nao informado"}</td>
                    <td className="px-4 py-3">{transfer.seasons?.name ?? "Nao informado"}</td>
                    <td className="px-4 py-3">{transfer.transfer_type}</td>
                    <td className="px-4 py-3">{formatMoney(transfer.fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">Historico de elencos</h2>
        </div>
        {player.squadMemberships.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Nenhum vinculo de elenco"
              description="Adicione o jogador a um elenco na pagina do time."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="px-4 py-3">Temporada</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Camisa</th>
                  <th className="px-4 py-3">Entrada</th>
                  <th className="px-4 py-3">Saida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {player.squadMemberships.map((membership) => (
                  <tr key={membership.id}>
                    <td className="px-4 py-3">{membership.seasons?.name ?? "Nao informado"}</td>
                    <td className="px-4 py-3">
                      {membership.teams ? (
                        <Link href={`/teams/${membership.teams.id}`} className="font-semibold text-slate-950 hover:text-teal-700">
                          {membership.teams.short_name || membership.teams.name}
                        </Link>
                      ) : (
                        "Nao informado"
                      )}
                    </td>
                    <td className="px-4 py-3">{membership.shirt_number ?? "Nao informado"}</td>
                    <td className="px-4 py-3">{formatDate(membership.joined_at)}</td>
                    <td className="px-4 py-3">{formatDate(membership.left_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
