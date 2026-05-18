import { redirect } from "next/navigation";
import { TransferForm } from "@/components/transfers/TransferForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getPlayers } from "@/services/players";
import { getSeasons } from "@/services/seasons";
import { getTeams } from "@/services/teams";
import { createTransfer } from "@/services/transfers";
import type { FormState } from "@/types/forms";

export const dynamic = "force-dynamic";

async function createTransferAction(_: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    await createTransfer({
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
      message: getErrorMessage(error, "Nao foi possivel cadastrar a transferencia.")
    };
  }

  redirect("/transfers?created=transfer");
}

export default async function NewTransferPage() {
  const [players, seasons, teams] = await Promise.all([getPlayers(), getSeasons(), getTeams()]);

  return (
    <div>
      <PageHeader
        title="Nova transferencia"
        description="Registre manualmente uma movimentacao do modo carreira."
      />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <TransferForm players={players} seasons={seasons} teams={teams} action={createTransferAction} />
    </div>
  );
}
