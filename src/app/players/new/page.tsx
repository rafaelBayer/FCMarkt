import { redirect } from "next/navigation";
import { PlayerForm } from "@/components/players/PlayerForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createPlayer } from "@/services/players";
import type { FormState } from "@/types/forms";

async function createPlayerAction(_: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    await createPlayer({
      name: String(formData.get("name") ?? ""),
      knownName: String(formData.get("knownName") ?? ""),
      nationality: String(formData.get("nationality") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      mainPosition: String(formData.get("mainPosition") ?? ""),
      overall: String(formData.get("overall") ?? ""),
      potential: String(formData.get("potential") ?? ""),
      photoUrl: String(formData.get("photoUrl") ?? "")
    });
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel cadastrar o jogador.")
    };
  }

  redirect("/players?created=player");
}

export default function NewPlayerPage() {
  return (
    <div>
      <PageHeader
        title="Novo jogador"
        description="Cadastre um jogador manualmente. O time atual sera derivado do historico."
      />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <PlayerForm action={createPlayerAction} />
    </div>
  );
}
