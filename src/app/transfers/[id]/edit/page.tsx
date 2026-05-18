import { notFound, redirect } from "next/navigation";
import { TransferForm } from "@/components/transfers/TransferForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getPlayers } from "@/services/players";
import { getSeasons } from "@/services/seasons";
import { getTeams } from "@/services/teams";
import { getTransferById, updateTransfer } from "@/services/transfers";
import type { FormState } from "@/types/forms";

type EditTransferPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateTransferAction(id: string, _: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    await updateTransfer(id, {
      playerId: String(formData.get("playerId") ?? ""),
      fromTeamId: String(formData.get("fromTeamId") ?? ""),
      toTeamId: String(formData.get("toTeamId") ?? ""),
      seasonId: String(formData.get("seasonId") ?? ""),
      transferDate: String(formData.get("transferDate") ?? ""),
      transferType: String(formData.get("transferType") ?? ""),
      fee: String(formData.get("fee") ?? ""),
      notes: String(formData.get("notes") ?? "")
    });
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel atualizar a transferencia.")
    };
  }

  redirect("/transfers?updated=transfer");
}

export default async function EditTransferPage({ params }: EditTransferPageProps) {
  const { id } = await params;
  const [transfer, players, seasons, teams] = await Promise.all([
    getTransferById(id),
    getPlayers(),
    getSeasons(),
    getTeams()
  ]);

  if (!transfer) {
    notFound();
  }

  return (
    <div>
      <PageHeader title="Editar transferencia" description="Ajuste dados manuais da movimentacao." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <TransferForm
        players={players}
        seasons={seasons}
        teams={teams}
        action={updateTransferAction.bind(null, id)}
        initialValues={transfer}
        submitLabel="Atualizar transferencia"
      />
    </div>
  );
}
