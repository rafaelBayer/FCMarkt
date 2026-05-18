import { ActionLink } from "@/components/ui/ActionLink";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { assertConfirmed } from "@/services/admin-rules";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatMoney } from "@/lib/format";
import { redirectWithMessage } from "@/lib/action-redirects";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { deleteTransfer, getTransfers } from "@/services/transfers";

export const dynamic = "force-dynamic";

type TransfersPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
};

async function deleteTransferAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  let errorMessage: string | null = null;

  try {
    assertConfirmed(formData.get("confirmed") === "1", "transferencia");
    await deleteTransfer(id);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Nao foi possivel excluir a transferencia.");
  }

  if (errorMessage) {
    redirectWithMessage("/transfers", "error", errorMessage);
  }

  redirectWithMessage("/transfers", "deleted", "Transferencia excluida com sucesso.");
}

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
      {params?.updated === "transfer" ? (
        <StatusMessage tone="success">Transferencia atualizada com sucesso.</StatusMessage>
      ) : null}
      {params?.deleted ? <StatusMessage tone="success">{params.deleted}</StatusMessage> : null}
      {params?.error ? <StatusMessage tone="error">{params.error}</StatusMessage> : null}
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
                  <th className="min-w-44 px-4 py-3">Acoes</th>
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
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <ActionLink href={`/transfers/${transfer.id}/edit`}>Editar</ActionLink>
                        <DeleteButton
                          id={transfer.id}
                          action={deleteTransferAction}
                          confirmMessage="Excluir esta transferencia? O historico sera removido deste jogador."
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
