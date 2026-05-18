import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { formatDate, formatMoney } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getTransfers } from "@/services/transfers";

export const dynamic = "force-dynamic";

type TransfersPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

export default async function TransfersPage({ searchParams }: TransfersPageProps) {
  const params = await searchParams;
  const transfers = await getTransfers();

  return (
    <div>
      <PageHeader
        title="Transferencias"
        description="Movimentacoes manuais do universo do modo carreira, ordenadas por data."
        action={{ href: "/transfers/new", label: "Nova transferencia" }}
      />
      {params?.created === "transfer" ? (
        <StatusMessage tone="success">Transferencia cadastrada com sucesso.</StatusMessage>
      ) : null}
      {!isSupabaseConfigured() ? <SetupNotice /> : null}

      {transfers.length === 0 ? (
        <EmptyState
          title="Nenhuma transferencia cadastrada"
          description="Cadastre uma transferencia manual para iniciar o historico."
          action={{ href: "/transfers/new", label: "Criar transferencia" }}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="min-w-48 px-4 py-3">Jogador</th>
                  <th className="min-w-40 px-4 py-3">Origem</th>
                  <th className="min-w-40 px-4 py-3">Destino</th>
                  <th className="min-w-32 px-4 py-3">Temporada</th>
                  <th className="min-w-32 px-4 py-3">Data</th>
                  <th className="min-w-28 px-4 py-3">Tipo</th>
                  <th className="min-w-32 px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-950">
                      {transfer.players?.known_name || transfer.players?.name || "Nao informado"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {transfer.from_team?.short_name || transfer.from_team?.name || "Sem origem"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {transfer.to_team?.short_name || transfer.to_team?.name || "Nao informado"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{transfer.seasons?.name ?? "Nao informado"}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(transfer.transfer_date)}</td>
                    <td className="px-4 py-3 text-slate-700">{transfer.transfer_type}</td>
                    <td className="px-4 py-3 text-slate-700">{formatMoney(transfer.fee)}</td>
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
